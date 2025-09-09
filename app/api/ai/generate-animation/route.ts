/**
 * AI Animation Generation API Endpoint
 * 
 * RESTful API endpoint for generating sprite animations with seamless loops,
 * frame interpolation, and sprite sheet compilation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetPostProcessor } from "@/lib/ai/asset-generation/post-processor";
import { AnimationGenerator } from "@/lib/ai/asset-generation/animation-generator";
import { BillingTracker } from "@/lib/llm/billing/tracker";
import { LLMLogger, createLoggerConfig } from "@/lib/llm/monitoring/logger";
import {
  AnimationGenerationRequest,
  AssetGenerationError,
  ERROR_CODES,
} from "@/lib/ai/asset-generation/types";

/**
 * POST /api/ai/generate-animation
 * Generate animated sprites with multiple frames and sprite sheets
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let animationRequest: AnimationGenerationRequest | undefined;

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
    timeout: 120000, // 2 minutes for animations
  });

  const assetQueue = new AssetGenerationQueue(assetManager, {
    maxConcurrentJobs: 2, // Lower for animation processing
    maxQueueSize: 25,
    defaultTimeout: 600000, // 10 minutes for animations
  }, true);

  const postProcessor = new AssetPostProcessor({
    pixelArtOptimization: true,
    compressionLevel: 0.8,
    formatOptimization: true,
    thumbnailGeneration: true,
  });

  const animationGenerator = new AnimationGenerator(assetManager, postProcessor, true);

  const billingTracker = new BillingTracker({
    enabled: true,
    credit_system_enabled: true,
    auto_deduct_credits: true,
    minimum_balance: 5.0, // Higher minimum for animations
    low_balance_threshold: 10.0,
    billing_cycle: "monthly",
    cost_per_token: {
      pixellab: { input: 0.003, output: 0.015 }, // Higher cost for animations
      retrodiffusion: { input: 0.0025, output: 0.0125 },
      dalle: { input: 0.004, output: 0.020 },
    },
    user_tier_discounts: {
      free: 0,
      pro: 0.1,
      max: 0.2,
    },
    free_tier_limits: {
      monthly_tokens: 10000,
      monthly_requests: 100,
    },
  });

  const logger = new LLMLogger(createLoggerConfig({
    enabled: true,
    log_requests: true,
    log_responses: true,
    log_errors: true,
    sensitive_data_masking: true,
  }));

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
      animationRequest = (await request.json()) as AnimationGenerationRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Validate animation request
    const validationError = validateAnimationRequest(animationRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Check subscription tier for animation generation
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

    // Animation generation requires Pro or Max subscription for complex animations
    if (profile.subscription_tier === 'free' && animationRequest.frameCount > 4) {
      return NextResponse.json(
        {
          error: "Complex animations (>4 frames) require Pro or Max subscription",
          code: "TIER_LIMIT_EXCEEDED",
          required_tier: "pro",
          max_frames_free: 4,
        },
        { status: 402 }
      );
    }

    // Check frame limits based on subscription tier
    const maxFrames = {
      free: 4,
      pro: 20,
      max: 60,
      educational: 12,
    };

    const frameLimit = maxFrames[profile.subscription_tier as keyof typeof maxFrames] || 4;
    if (animationRequest.frameCount > frameLimit) {
      return NextResponse.json(
        {
          error: `Frame count exceeds limit for ${profile.subscription_tier} tier (${frameLimit} max)`,
          code: "TIER_LIMIT_EXCEEDED",
          max_frames: frameLimit,
        },
        { status: 402 }
      );
    }

    // Add user context
    animationRequest.userId = userId;
    animationRequest.sessionId = request.headers.get("x-session-id") || undefined;

    // Estimate credits for animation (frames * base cost * complexity multiplier)
    const baseCredits = estimateAnimationCredits(animationRequest);
    const frameMultiplier = animationRequest.frameCount * 0.8; // Slight discount for multiple frames
    const complexityMultiplier = animationRequest.motionType === 'elastic' ? 1.3 : 
                                animationRequest.motionType === 'bounce' ? 1.2 : 1.0;
    const totalEstimatedCredits = Math.round(baseCredits * frameMultiplier * complexityMultiplier);

    // Check credits
    const hasCredits = await billingTracker.checkCredits(
      userId,
      totalEstimatedCredits,
      animationRequest.provider || "pixellab"
    );

    if (!hasCredits) {
      const balance = await billingTracker.getCreditBalance(userId);
      return NextResponse.json(
        {
          error: `Insufficient credits for animation generation. Required: $${totalEstimatedCredits.toFixed(2)}, Available: $${balance.available.toFixed(2)}`,
          code: "INSUFFICIENT_CREDITS",
          required: totalEstimatedCredits,
          available: balance.available,
        },
        { status: 402 }
      );
    }

    // Check if immediate processing or queued
    const isImmediate = request.url.includes("immediate=true") || 
                       animationRequest.frameCount <= 8; // Process simple animations immediately

    if (isImmediate) {
      // Reserve credits for immediate processing
      const reservationId = await billingTracker.reserveCredits(
        userId,
        totalEstimatedCredits,
        animationRequest.provider || "pixellab",
      );

      // Generate animation immediately
      const animation = await animationGenerator.generateAnimation(animationRequest);

      // Record usage and billing
      await billingTracker.recordUsage(
        userId,
        {
          id: animation.id,
          type: "animation_generation",
          provider_id: animationRequest.provider || "pixellab",
          usage: { animations: 1, frames: animationRequest.frameCount },
        } as any,
        "animation_generation",
        reservationId,
      );

      // Log successful generation
      await logger.logRequest(
        animationRequest as any,
        {
          id: animation.id,
          content: `Animation generated: ${animation.name} (${animationRequest.frameCount} frames)`,
          usage: { total_tokens: 0 },
          provider_id: animationRequest.provider || "pixellab",
        } as any,
        undefined,
        animationRequest.provider || "pixellab",
        userId,
      );

      return NextResponse.json({
        success: true,
        animation,
        credits: {
          used: totalEstimatedCredits,
          remaining: (await billingTracker.getCreditBalance(userId)).available - totalEstimatedCredits,
        },
        processingTime: Date.now() - startTime,
      });

    } else {
      // Add to queue for complex animations
      if (!animationRequest) {
        return NextResponse.json(
          { error: "Animation request is required", code: "INVALID_REQUEST" },
          { status: 400 }
        );
      }
      
      const priority = (animationRequest.priority as any) || 'normal';
      
      // Create a batch request for the animation frames
      // TypeScript assertion is safe here because we checked for null above
      const request = animationRequest as AnimationGenerationRequest;
      const batchRequest = {
        baseRequest: request,
        prompts: Array.from({ length: request.frameCount }, (_, i) => 
          `${request.prompt} frame ${i + 1} of ${request.frameCount}`
        ),
        maintainConsistency: true,
        parallelGeneration: 2,
        stopOnFailure: false,
      };

      const queueResult = await assetQueue.enqueueBatchGeneration(
        batchRequest,
        userId,
        priority
      );

      // Log batch request
      await logger.logRequest(
        request as any,
        {
          id: queueResult.jobId,
          content: `Animation generation queued: ${request.frameCount} frames`,
          usage: { total_tokens: 0 },
          provider_id: request.provider || "pixellab",
        } as any,
        undefined,
        request.provider || "pixellab",
        userId,
      );

      return NextResponse.json({
        success: true,
        queued: true,
        jobId: queueResult.jobId,
        queuePosition: queueResult.queuePosition,
        estimatedCompletion: queueResult.estimatedCompletion,
        frameCount: animationRequest.frameCount,
        estimatedCredits: totalEstimatedCredits,
        message: `Animation generation (${animationRequest.frameCount} frames) has been queued`,
      }, { status: 202 }); // 202 Accepted
    }

  } catch (error) {
    console.error("Animation generation failed:", error);

    // Log error
    if (userId && animationRequest) {
      await logger.logRequest(
        animationRequest as any,
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
        error: "Animation generation failed",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate animation generation request
 */
function validateAnimationRequest(request: AnimationGenerationRequest): string | null {
  if (!request.prompt || typeof request.prompt !== 'string') {
    return "Prompt is required and must be a string";
  }

  if (request.prompt.length > 1000) {
    return "Prompt exceeds maximum length (1000 characters)";
  }

  if (!request.assetType) {
    return "Asset type is required";
  }

  if (request.assetType !== 'sprite' && request.assetType !== 'animation') {
    return "Animation generation only supports 'sprite' and 'animation' asset types";
  }

  if (!request.frameCount || request.frameCount < 2) {
    return "Frame count must be at least 2";
  }

  if (request.frameCount > 60) {
    return "Frame count cannot exceed 60";
  }

  if (!request.frameRate || request.frameRate < 1 || request.frameRate > 60) {
    return "Frame rate must be between 1 and 60 FPS";
  }

  if (request.dimensions) {
    const { width, height } = request.dimensions;
    if (width < 16 || width > 512 || height < 16 || height > 512) {
      return "Animation dimensions must be between 16x16 and 512x512 pixels";
    }
  }

  if (request.motionType && !['linear', 'ease_in', 'ease_out', 'bounce', 'elastic'].includes(request.motionType)) {
    return "Invalid motion type";
  }

  if (request.loopType && !['seamless', 'bounce', 'once'].includes(request.loopType)) {
    return "Invalid loop type";
  }

  return null;
}

/**
 * Estimate credits needed for animation generation
 */
function estimateAnimationCredits(request: AnimationGenerationRequest): number {
  const baseCredits = 15; // Base cost per frame
  let multiplier = 1;

  // Quality adjustments
  if (request.quality === 'high') multiplier *= 1.5;
  if (request.quality === 'ultra') multiplier *= 2.0;

  // Dimension adjustments
  if (request.dimensions) {
    const pixels = request.dimensions.width * request.dimensions.height;
    if (pixels > 256 * 256) multiplier *= 1.3;
    else if (pixels > 128 * 128) multiplier *= 1.15;
  }

  // Motion type adjustments
  switch (request.motionType) {
    case 'bounce':
      multiplier *= 1.2;
      break;
    case 'elastic':
      multiplier *= 1.3;
      break;
    case 'ease_in':
    case 'ease_out':
      multiplier *= 1.1;
      break;
  }

  // Seamless loop requires more processing
  if (request.loopType === 'seamless') {
    multiplier *= 1.15;
  }

  return Math.round(baseCredits * multiplier);
}