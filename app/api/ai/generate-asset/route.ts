/**
 * AI Asset Generation API Endpoint
 *
 * RESTful API endpoint for AI-powered pixel art and asset generation with multiple
 * provider support, post-processing pipeline, quality validation, and comprehensive error handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetPostProcessor } from "@/lib/ai/asset-generation/post-processor";
import { AssetQualityValidator } from "@/lib/ai/asset-generation/quality-validator";
import { AssetMetadataExtractor } from "@/lib/ai/asset-generation/metadata-extractor";
import { BillingTracker } from "@/lib/llm/billing/tracker";
import { LLMLogger, createLoggerConfig } from "@/lib/llm/monitoring/logger";
import {
  AssetGenerationRequest,
  AssetGenerationResponse,
  AssetGenerationError,
  AssetType,
  AssetStyle,
  GenerationProvider,
} from "@/lib/ai/asset-generation/types";

/**
 * POST /api/ai/generate-asset
 * Generate AI-powered pixel art assets
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let generationRequest: AssetGenerationRequest | undefined;
  let reservationId: string | undefined;

  // Initialize components
  const assetManager = new AssetGenerationManager({
    providers: {
      pixellab: {
        apiKey: process.env.PIXELLAB_API_KEY,
        endpoint: "https://api.pixellab.ai/v1",
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
    timeout: 60000, // 60 seconds
  });

  // Initialize queue system
  const assetQueue = new AssetGenerationQueue(assetManager, {
    maxConcurrentJobs: 5,
    maxQueueSize: 100,
    defaultTimeout: 300000, // 5 minutes
  }, true); // Server-side

  const postProcessor = new AssetPostProcessor({
    pixelArtOptimization: true,
    compressionLevel: 0.85,
    formatOptimization: true,
    thumbnailGeneration: true,
  });

  const qualityValidator = new AssetQualityValidator({
    minResolution: { width: 16, height: 16 },
    maxResolution: { width: 2048, height: 2048 },
    allowedFormats: ["png", "webp", "jpg"],
    qualityThresholds: {
      pixelArt: 0.8,
      sprites: 0.75,
      backgrounds: 0.7,
      animations: 0.8,
    },
    contentFiltering: true,
  });

  const metadataExtractor = new AssetMetadataExtractor({
    extractColors: true,
    extractDimensions: true,
    generateTags: true,
    detectAnimationFrames: true,
  });

  const billingTracker = new BillingTracker({
    enabled: true,
    credit_system_enabled: true,
    auto_deduct_credits: true,
    minimum_balance: 1.0,
    low_balance_threshold: 5.0,
    billing_cycle: "monthly",
    cost_per_token: {
      pixellab: { input: 0.002, output: 0.010 },
      retrodiffusion: { input: 0.0015, output: 0.0075 },
      fallback: { input: 0.003, output: 0.015 },
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
      },
    );

    const { user, error: authError } = await getAuthenticatedUser(supabase, request);

    if (authError || !user) {
      const errorResponse = createAuthErrorResponse(authError, true);
      return NextResponse.json(
        { code: "UNAUTHORIZED", ...errorResponse },
        { status: 401 },
      );
    }

    userId = user.id;

    // Parse request body
    try {
      generationRequest = (await request.json()) as AssetGenerationRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Validate request
    const validationError = validateAssetGenerationRequest(generationRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Add user context
    generationRequest.userId = userId;
    generationRequest.sessionId = request.headers.get("x-session-id") || undefined;

    // Estimate credits needed
    const estimatedCredits = estimateGenerationCredits(generationRequest);

    // Check credits and reserve them
    const hasCredits = await billingTracker.checkCredits(
      userId,
      estimatedCredits,
      generationRequest.provider || "pixellab",
    );

    if (!hasCredits) {
      const balance = await billingTracker.getCreditBalance(userId);
      return NextResponse.json(
        {
          error: `Insufficient credits. Available: $${balance.available.toFixed(2)}`,
          code: "INSUFFICIENT_CREDITS",
          balance: balance.available,
        },
        { status: 402 },
      );
    }

    // Check if request is for immediate processing or queued processing
    const isImmediate = request.url.includes("immediate=true") || 
                       generationRequest.priority === "urgent";

    if (isImmediate) {
      // Reserve credits for immediate processing
      reservationId = await billingTracker.reserveCredits(
        userId,
        estimatedCredits,
        generationRequest.provider || "pixellab",
      );

      // Generate asset immediately
      const rawAsset = await assetManager.generateAsset(generationRequest);

      // Post-process asset
      const processedAsset = await postProcessor.processAsset(rawAsset, generationRequest);

      // Validate quality
      const validationResult = await qualityValidator.validateAsset(processedAsset);
      if (!validationResult.isValid) {
        throw new AssetGenerationError(
          `Asset failed quality validation: ${validationResult.issues.join(", ")}`,
          "QUALITY_VALIDATION_FAILED",
          generationRequest.provider,
        );
      }

      // Extract metadata
      const metadata = await metadataExtractor.extractMetadata(processedAsset);

      // Save to database and storage
      const savedAsset = await saveAssetToDatabase(
        supabase,
        processedAsset,
        metadata,
        generationRequest,
        userId,
      );

      // Record usage and billing
      await billingTracker.recordUsage(
        userId,
        {
          id: savedAsset.id,
          type: "asset_generation",
          provider_id: generationRequest.provider || "pixellab",
          usage: { generations: 1 },
        } as any,
        "asset_generation",
        reservationId,
      );

      // Log successful generation
      await logger.logRequest(
        generationRequest as any,
        {
          id: savedAsset.id,
          content: `Asset generated: ${savedAsset.name}`,
          usage: { total_tokens: 0 },
          provider_id: generationRequest.provider || "pixellab",
        } as any,
        undefined,
        generationRequest.provider || "pixellab",
        userId,
      );

      // Return immediate response with asset
      const response: AssetGenerationResponse = {
        success: true,
        asset: {
          id: savedAsset.id,
          name: savedAsset.name,
          type: savedAsset.asset_type as AssetType,
          url: savedAsset.file_path,
          thumbnailUrl: savedAsset.properties.thumbnail_url,
          metadata: savedAsset.properties as any,
          generatedBy: rawAsset.generatedBy,
          prompt: generationRequest.prompt,
          style: generationRequest.style,
          qualityScore: validationResult.score,
          createdAt: savedAsset.created_at,
          processingTime: Date.now() - startTime,
        },
        credits: {
          used: estimatedCredits,
          remaining: (await billingTracker.getCreditBalance(userId)).available - estimatedCredits,
        },
        processingTime: Date.now() - startTime,
        warnings: validationResult.warnings,
      };

      return NextResponse.json(response);
    } else {
      // Add to queue for asynchronous processing
      const priority = (generationRequest.priority as any) || 'normal';
      const queueResult = await assetQueue.enqueueAssetGeneration(
        generationRequest,
        userId,
        priority
      );

      // Return queue information
      return NextResponse.json({
        success: true,
        queued: true,
        jobId: queueResult.jobId,
        queuePosition: queueResult.queuePosition,
        estimatedCompletion: queueResult.estimatedCompletion,
        message: "Asset generation has been queued and will be processed shortly",
      }, { status: 202 }); // 202 Accepted
    }
  } catch (error) {
    // Log error
    if (userId && generationRequest) {
      await logger.logRequest(
        generationRequest as any,
        undefined,
        error instanceof AssetGenerationError
          ? error
          : new AssetGenerationError(
              error instanceof Error ? error.message : "Unknown error",
              "INTERNAL_ERROR",
            ),
        undefined,
        userId,
      );
    }

    // Release reservation on error
    if (reservationId && userId) {
      await billingTracker.releaseReservation(userId, reservationId);
    }

    // Handle different error types
    if (error instanceof AssetGenerationError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        { error: error.message, code: error.code, provider: error.providerId },
        { status: statusCode },
      );
    }

    // Generic error
    console.error("[Asset Generation API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ai/generate-asset
 * Get generation status and provider information
 */
export async function GET(): Promise<Response> {
  try {
    const assetManager = new AssetGenerationManager({
      providers: {
        pixellab: {
          apiKey: process.env.PIXELLAB_API_KEY,
          enabled: !!process.env.PIXELLAB_API_KEY,
        },
        retrodiffusion: {
          apiKey: process.env.RETRODIFFUSION_API_KEY,
          enabled: !!process.env.RETRODIFFUSION_API_KEY,
        },
      },
      defaultProvider: "pixellab",
    });

    const providersStatus = await assetManager.getProvidersStatus();

    return NextResponse.json({
      success: true,
      data: {
        providers: providersStatus,
        supportedAssetTypes: ["sprite", "background", "tile", "animation"],
        supportedStyles: ["pixel-art", "retro", "8bit", "16bit", "modern"],
        maxDimensions: { width: 2048, height: 2048 },
        supportedFormats: ["png", "webp", "jpg"],
        healthCheck: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status", code: "STATUS_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * Validate asset generation request
 */
function validateAssetGenerationRequest(request: any): string | null {
  if (!request || typeof request !== "object") {
    return "Request must be an object";
  }

  if (!request.prompt || typeof request.prompt !== "string") {
    return "prompt field is required and must be a string";
  }

  if (request.prompt.length < 3 || request.prompt.length > 1000) {
    return "prompt must be between 3 and 1000 characters";
  }

  if (!request.assetType || !["sprite", "background", "tile", "animation"].includes(request.assetType)) {
    return "assetType must be one of: sprite, background, tile, animation";
  }

  if (request.style && !["pixel-art", "retro", "8bit", "16bit", "modern"].includes(request.style)) {
    return "style must be one of: pixel-art, retro, 8bit, 16bit, modern";
  }

  if (request.dimensions) {
    if (!request.dimensions.width || !request.dimensions.height) {
      return "dimensions must include width and height";
    }
    if (request.dimensions.width < 16 || request.dimensions.width > 2048) {
      return "width must be between 16 and 2048 pixels";
    }
    if (request.dimensions.height < 16 || request.dimensions.height > 2048) {
      return "height must be between 16 and 2048 pixels";
    }
  }

  return null;
}

/**
 * Estimate credits needed for generation
 */
function estimateGenerationCredits(request: AssetGenerationRequest): number {
  let baseCredits = 2.0; // Base cost

  // Adjust for asset type
  const typeMultipliers = {
    sprite: 1.0,
    background: 1.5,
    tile: 0.8,
    animation: 2.5,
    tileset: 1.8,
    ui: 1.2,
  };
  baseCredits *= typeMultipliers[request.assetType] || 1.0;

  // Adjust for dimensions
  if (request.dimensions) {
    const pixels = request.dimensions.width * request.dimensions.height;
    if (pixels > 512 * 512) {
      baseCredits *= 1.5;
    } else if (pixels > 256 * 256) {
      baseCredits *= 1.2;
    }
  }

  // Adjust for style complexity
  const styleMultipliers = {
    "pixel-art": 1.0,
    retro: 1.1,
    "8bit": 1.0,
    "16bit": 1.2,
    modern: 1.3,
  };
  baseCredits *= styleMultipliers[request.style as keyof typeof styleMultipliers] || 1.0;

  // Animation frames
  if (request.animationFrames && request.animationFrames > 1) {
    baseCredits *= Math.min(request.animationFrames * 0.8, 5.0);
  }

  return Math.round(baseCredits * 100) / 100; // Round to 2 decimal places
}

/**
 * Save generated asset to database and storage
 */
async function saveAssetToDatabase(
  supabase: any,
  asset: any,
  metadata: any,
  request: AssetGenerationRequest,
  userId: string,
): Promise<any> {
  // Upload asset to storage
  const fileName = `${userId}/${Date.now()}-${request.assetType}.${metadata.format}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("game-assets")
    .upload(fileName, asset.buffer, {
      contentType: metadata.mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new AssetGenerationError(
      `Failed to upload asset: ${uploadError.message}`,
      "UPLOAD_FAILED",
    );
  }

  // Upload thumbnail if exists
  let thumbnailPath: string | null = null;
  if (asset.thumbnail) {
    const thumbnailFileName = `${userId}/thumbnails/${Date.now()}-thumb.webp`;
    const { error: thumbError } = await supabase.storage
      .from("game-assets")
      .upload(thumbnailFileName, asset.thumbnail, {
        contentType: "image/webp",
        cacheControl: "3600",
      });

    if (!thumbError) {
      thumbnailPath = thumbnailFileName;
    }
  }

  // Insert into database
  const { data: assetData, error: dbError } = await supabase
    .from("game_assets")
    .insert({
      creator_id: userId,
      name: `Generated ${request.assetType}`,
      asset_type: request.assetType,
      file_path: uploadData.path,
      file_size: metadata.fileSize,
      mime_type: metadata.mimeType,
      properties: {
        dimensions: metadata.dimensions,
        colors: metadata.colors,
        tags: metadata.tags,
        thumbnail_url: thumbnailPath,
        generation_metadata: {
          prompt: request.prompt,
          style: request.style,
          provider: request.provider,
          quality_score: metadata.qualityScore,
          processing_time: metadata.processingTime,
        },
      },
      generated_by_ai: true,
      generation_prompt: request.prompt,
      generation_model: request.provider || "pixellab",
    })
    .select()
    .single();

  if (dbError) {
    throw new AssetGenerationError(
      `Failed to save asset to database: ${dbError.message}`,
      "DATABASE_ERROR",
    );
  }

  // Record generation in ai_generations table
  await supabase.from("ai_generations").insert({
    user_id: userId,
    generation_type: "asset",
    prompt: request.prompt,
    model_used: request.provider || "pixellab",
    success: true,
    credits_consumed: estimateGenerationCredits(request),
    output_data: {
      asset_id: assetData.id,
      asset_type: request.assetType,
      dimensions: metadata.dimensions,
      quality_score: metadata.qualityScore,
    },
  });

  return assetData;
}

/**
 * Get appropriate HTTP status code for error
 */
function getStatusCodeForError(code: string): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "INSUFFICIENT_CREDITS":
      return 402;
    case "INVALID_REQUEST":
    case "QUALITY_VALIDATION_FAILED":
      return 400;
    case "PROVIDER_NOT_AVAILABLE":
    case "ALL_PROVIDERS_FAILED":
      return 503;
    case "TIMEOUT":
      return 408;
    case "UPLOAD_FAILED":
    case "DATABASE_ERROR":
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}