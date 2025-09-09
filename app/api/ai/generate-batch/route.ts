/**
 * AI Asset Batch Generation API Endpoint
 * 
 * RESTful API endpoint for batch AI-powered asset generation with queue
 * management, theme consistency, and parallel processing optimization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { BillingTracker } from "@/lib/llm/billing/tracker";
import { LLMLogger } from "@/lib/llm/monitoring/logger";
import {
  BatchGenerationRequest,
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
  AssetStyle,
} from "@/lib/ai/asset-generation/types";

/**
 * POST /api/ai/generate-batch
 * Generate multiple AI-powered assets in batch with queue management
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let batchRequest: BatchGenerationRequest | undefined;

  // Initialize components
  const assetManager = new AssetGenerationManager({
    providers: {
      pixellab: {
        apiKey: process.env.PIXELLAB_API_KEY,
        endpoint: "https://api.pixellab.ai/v1/generate",
        enabled: !!process.env.PIXELLAB_API_KEY,
      },
      retrodiffusion: {
        apiKey: process.env.RETRODIFFUSION_API_KEY,
        endpoint: "https://api.retrodiffusion.ai/generate",
        enabled: !!process.env.RETRODIFFUSION_API_KEY,
      },
      dalle: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: "https://api.openai.com/v1",
        enabled: !!process.env.OPENAI_API_KEY,
      },
    },
    defaultProvider: "pixellab",
    fallbackChain: ["pixellab", "retrodiffusion", "dalle"],
    maxRetries: 2,
    timeout: 60000,
  });

  const assetQueue = new AssetGenerationQueue(assetManager, {
    maxConcurrentJobs: 3, // Lower for batch processing
    maxQueueSize: 50,
    defaultTimeout: 600000, // 10 minutes for batch
  }, true);

  const billingTracker = new BillingTracker({
    enabled: true,
    credit_system_enabled: true,
    auto_deduct_credits: true,
    minimum_balance: 1.0,
    cost_per_generation: {
      pixellab: 2.0,
      retrodiffusion: 1.5,
      dalle: 3.0,
    },
  });

  const logger = new LLMLogger({
    enabled: true,
    log_requests: true,
    log_responses: true,
    log_errors: true,
    sensitive_data_masking: true,
  });

  try {
    // Authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { user, error: authError } = await getAuthenticatedUser(supabase, request);

    if (authError || !user) {
      const errorResponse = createAuthErrorResponse(authError, true);
      return NextResponse.json(
        { code: "UNAUTHORIZED", ...errorResponse },
        { status: 401 }
      );
    }

    userId = user.id;

    // Parse and validate request body
    try {
      batchRequest = (await request.json()) as BatchGenerationRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Validate batch request
    const validationError = validateBatchGenerationRequest(batchRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Check subscription tier for batch processing
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Batch processing requires Pro or Max subscription
    if (profile.subscription_tier === 'free') {
      return NextResponse.json(
        {
          error: "Batch generation requires Pro or Max subscription",
          code: "TIER_LIMIT_EXCEEDED",
          required_tier: "pro",
        },
        { status: 402 }
      );
    }

    // Check batch size limits based on subscription tier
    const maxBatchSizes = {
      pro: 10,
      max: 50,
      educational: 15,
    };

    const maxBatchSize = maxBatchSizes[profile.subscription_tier as keyof typeof maxBatchSizes] || 10;
    if (batchRequest.prompts.length > maxBatchSize) {
      return NextResponse.json(
        {
          error: `Batch size exceeds limit for ${profile.subscription_tier} tier (${maxBatchSize} max)`,
          code: "TIER_LIMIT_EXCEEDED",
          max_batch_size: maxBatchSize,
        },
        { status: 402 }
      );
    }

    // Add user context
    batchRequest.baseRequest.userId = userId;
    batchRequest.baseRequest.sessionId = request.headers.get("x-session-id") || undefined;

    // Estimate credits for batch
    const baseCredits = estimateGenerationCredits(batchRequest.baseRequest);
    const totalEstimatedCredits = Math.round(baseCredits * batchRequest.prompts.length * 0.85); // 15% batch discount

    // Check credits
    const hasCredits = await billingTracker.checkCredits(
      userId,
      totalEstimatedCredits,
      batchRequest.baseRequest.provider || "pixellab"
    );

    if (!hasCredits) {
      const balance = await billingTracker.getCreditBalance(userId);
      return NextResponse.json(
        {
          error: `Insufficient credits for batch generation. Required: $${totalEstimatedCredits.toFixed(2)}, Available: $${balance.available.toFixed(2)}`,
          code: "INSUFFICIENT_CREDITS",
          required: totalEstimatedCredits,
          available: balance.available,
        },
        { status: 402 }
      );
    }

    // Add to batch generation queue
    const priority = (batchRequest.baseRequest.priority as any) || 'normal';
    const queueResult = await assetQueue.enqueueBatchGeneration(
      batchRequest,
      userId,
      priority
    );

    // Log batch request
    await logger.logRequest(
      batchRequest as any,
      {
        id: queueResult.jobId,
        content: `Batch generation queued: ${batchRequest.prompts.length} assets`,
        usage: { total_tokens: 0 },
        provider_id: batchRequest.baseRequest.provider || "pixellab",
      } as any,
      undefined,
      batchRequest.baseRequest.provider || "pixellab",
      userId,
    );

    return NextResponse.json({
      success: true,
      batch: true,
      jobId: queueResult.jobId,
      queuePosition: queueResult.queuePosition,
      estimatedCompletion: queueResult.estimatedCompletion,
      batchSize: batchRequest.prompts.length,
      estimatedCredits: totalEstimatedCredits,
      message: `Batch generation of ${batchRequest.prompts.length} assets has been queued`,
    }, { status: 202 }); // 202 Accepted

  } catch (error) {
    console.error("Batch generation failed:", error);

    // Log error
    if (userId && batchRequest) {
      await logger.logRequest(
        batchRequest as any,
        undefined,
        error instanceof AssetGenerationError
          ? error
          : new AssetGenerationError(
              error instanceof Error ? error.message : "Unknown error",
              ERROR_CODES.INTERNAL_ERROR,
            ),
        undefined,
        userId,
      );
    }

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.INSUFFICIENT_CREDITS ? 402 :
                 error.code === ERROR_CODES.TIER_LIMIT_EXCEEDED ? 402 :
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Batch generation failed",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate batch generation request
 */
function validateBatchGenerationRequest(request: BatchGenerationRequest): string | null {
  if (!request.baseRequest) {
    return "Base request is required";
  }

  if (!request.prompts || !Array.isArray(request.prompts) || request.prompts.length === 0) {
    return "At least one prompt is required";
  }

  if (request.prompts.length > 100) {
    return "Maximum 100 prompts per batch";
  }

  // Validate each prompt
  for (let i = 0; i < request.prompts.length; i++) {
    const prompt = request.prompts[i];
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return `Prompt ${i + 1} is empty or invalid`;
    }
    if (prompt.length > 1000) {
      return `Prompt ${i + 1} exceeds maximum length (1000 characters)`;
    }
  }

  // Validate base request
  const baseValidation = validateAssetGenerationRequest(request.baseRequest);
  if (baseValidation) {
    return `Base request validation failed: ${baseValidation}`;
  }

  // Validate parallel generation setting
  if (request.parallelGeneration && (request.parallelGeneration < 1 || request.parallelGeneration > 10)) {
    return "Parallel generation must be between 1 and 10";
  }

  return null;
}

/**
 * Validate asset generation request (shared validation logic)
 */
function validateAssetGenerationRequest(request: any): string | null {
  if (!request.prompt || typeof request.prompt !== 'string') {
    return "Prompt is required and must be a string";
  }

  if (request.prompt.length > 1000) {
    return "Prompt exceeds maximum length (1000 characters)";
  }

  if (!request.assetType) {
    return "Asset type is required";
  }

  const validAssetTypes: AssetType[] = ["sprite", "background", "tile", "animation", "tileset", "ui"];
  if (!validAssetTypes.includes(request.assetType)) {
    return `Invalid asset type. Must be one of: ${validAssetTypes.join(", ")}`;
  }

  if (request.style) {
    const validStyles: AssetStyle[] = ["pixel-art", "retro", "8bit", "16bit", "32bit", "modern", "minimalist", "cartoon", "realistic", "abstract"];
    if (!validStyles.includes(request.style)) {
      return `Invalid style. Must be one of: ${validStyles.join(", ")}`;
    }
  }

  if (request.dimensions) {
    if (typeof request.dimensions !== 'object' || !request.dimensions.width || !request.dimensions.height) {
      return "Dimensions must include width and height";
    }

    const { width, height } = request.dimensions;
    if (width < 16 || width > 2048 || height < 16 || height > 2048) {
      return "Dimensions must be between 16x16 and 2048x2048 pixels";
    }
  }

  return null;
}

/**
 * Estimate credits needed for generation
 */
function estimateGenerationCredits(request: any): number {
  const baseCredits = 10;
  let multiplier = 1;

  // Quality adjustments
  if (request.quality === 'high') multiplier *= 1.5;
  if (request.quality === 'ultra') multiplier *= 2.0;

  // Dimension adjustments
  if (request.dimensions) {
    const pixels = request.dimensions.width * request.dimensions.height;
    if (pixels > 512 * 512) multiplier *= 1.5;
    else if (pixels > 256 * 256) multiplier *= 1.2;
  }

  // Animation adjustments
  if (request.animationFrames && request.animationFrames > 1) {
    multiplier *= Math.min(request.animationFrames * 0.5, 3.0);
  }

  return Math.round(baseCredits * multiplier);
}