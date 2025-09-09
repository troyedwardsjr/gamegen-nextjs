/**
 * Theme Asset Pack Generation API Endpoint
 * 
 * RESTful API endpoint for generating complete themed asset packs with
 * batch processing, consistency management, and progress tracking.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetPostProcessor } from "@/lib/ai/asset-generation/post-processor";
import { ThemeAssetProcessor, AssetPackConfig } from "@/lib/ai/asset-generation/theme-processor";
import { BillingTracker } from "@/lib/llm/billing/tracker";
import { LLMLogger } from "@/lib/llm/monitoring/logger";
import {
  AssetGenerationError,
  ERROR_CODES,
} from "@/lib/ai/asset-generation/types";

interface ThemePackRequest {
  themeId: string;
  customConfig?: Partial<AssetPackConfig>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * POST /api/ai/generate-theme-pack
 * Generate a complete themed asset pack
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let themePackRequest: ThemePackRequest | undefined;

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
    timeout: 180000, // 3 minutes for theme packs
  });

  const assetQueue = new AssetGenerationQueue(assetManager, {
    maxConcurrentJobs: 3, // Higher for theme packs
    maxQueueSize: 50,
    defaultTimeout: 1800000, // 30 minutes for theme packs
  }, true);

  const postProcessor = new AssetPostProcessor({
    pixelArtOptimization: true,
    compressionLevel: 0.8,
    formatOptimization: true,
    thumbnailGeneration: true,
  });

  const themeProcessor = new ThemeAssetProcessor(assetManager, assetQueue, true);

  const billingTracker = new BillingTracker({
    enabled: true,
    credit_system_enabled: true,
    auto_deduct_credits: true,
    minimum_balance: 50.0, // Higher minimum for theme packs
    cost_per_generation: {
      pixellab: 15.0, // Higher cost for theme packs
      retrodiffusion: 12.0,
      dalle: 18.0,
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
      themePackRequest = (await request.json()) as ThemePackRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Validate theme pack request
    const validationError = validateThemePackRequest(themePackRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Check subscription tier for theme pack generation
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

    // Theme packs require Pro or Max subscription
    if (profile.subscription_tier === 'free') {
      return NextResponse.json(
        {
          error: "Theme asset packs require Pro or Max subscription",
          code: "TIER_LIMIT_EXCEEDED",
          required_tier: "pro",
        },
        { status: 402 }
      );
    }

    // Get available themes to validate theme ID
    const availableThemes = themeProcessor.getAvailableThemes();
    const selectedTheme = availableThemes.find(theme => theme.id === themePackRequest.themeId);

    if (!selectedTheme) {
      return NextResponse.json(
        {
          error: `Theme '${themePackRequest.themeId}' not found`,
          code: "INVALID_REQUEST",
          availableThemes: availableThemes.map(t => ({ id: t.id, name: t.name })),
        },
        { status: 400 }
      );
    }

    // Check if complex themes require Max subscription
    if (selectedTheme.metadata.complexity === 'complex' && profile.subscription_tier !== 'max') {
      return NextResponse.json(
        {
          error: `Complex themes like '${selectedTheme.name}' require Max subscription`,
          code: "TIER_LIMIT_EXCEEDED",
          required_tier: "max",
          theme_complexity: selectedTheme.metadata.complexity,
        },
        { status: 402 }
      );
    }

    // Estimate credits for theme pack
    const estimatedCredits = estimateThemePackCredits(selectedTheme, themePackRequest.customConfig);

    // Check credits
    const hasCredits = await billingTracker.checkCredits(
      userId,
      estimatedCredits,
      "pixellab"
    );

    if (!hasCredits) {
      const balance = await billingTracker.getCreditBalance(userId);
      return NextResponse.json(
        {
          error: `Insufficient credits for theme pack generation. Required: $${estimatedCredits.toFixed(2)}, Available: $${balance.available.toFixed(2)}`,
          code: "INSUFFICIENT_CREDITS",
          required: estimatedCredits,
          available: balance.available,
          estimated_assets: selectedTheme.metadata.estimatedAssetCount,
        },
        { status: 402 }
      );
    }

    // Reserve credits for the theme pack
    const reservationId = await billingTracker.reserveCredits(
      userId,
      estimatedCredits,
      "pixellab"
    );

    // Generate the theme asset pack
    const packResult = await themeProcessor.generateThemeAssetPack(
      themePackRequest.themeId,
      userId,
      themePackRequest.customConfig,
      themePackRequest.priority || 'normal'
    );

    // Log successful theme pack request
    await logger.logRequest(
      {
        id: packResult.packId,
        type: "theme_pack_generation",
        themeId: themePackRequest.themeId,
        userId,
        config: themePackRequest.customConfig,
      } as any,
      {
        id: packResult.packId,
        content: `Theme pack generation started: ${selectedTheme.name}`,
        usage: { total_tokens: 0 },
        provider_id: "pixellab",
      } as any,
      undefined,
      "pixellab",
      userId,
    );

    return NextResponse.json({
      success: true,
      packId: packResult.packId,
      theme: {
        id: selectedTheme.id,
        name: selectedTheme.name,
        description: selectedTheme.description,
        estimatedAssetCount: selectedTheme.metadata.estimatedAssetCount,
        complexity: selectedTheme.metadata.complexity,
      },
      estimatedCompletion: packResult.estimatedCompletion,
      estimatedCredits,
      reservationId,
      message: `Theme pack generation for '${selectedTheme.name}' has been started`,
      processingTime: Date.now() - startTime,
    }, { status: 202 }); // 202 Accepted

  } catch (error) {
    console.error("Theme pack generation failed:", error);

    // Log error
    if (userId && themePackRequest) {
      await logger.logRequest(
        {
          type: "theme_pack_generation",
          themeId: themePackRequest.themeId,
          userId,
        } as any,
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
        error: "Theme pack generation failed",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/generate-theme-pack
 * Get available themes and pack templates
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Authentication (optional for getting available themes)
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

    const { user } = await getAuthenticatedUser(supabase, request);

    // Initialize theme processor
    const assetManager = new AssetGenerationManager({
      providers: {
        pixellab: { enabled: !!process.env.PIXELLAB_API_KEY },
        retrodiffusion: { enabled: !!process.env.RETRODIFFUSION_API_KEY },
        dalle: { enabled: !!process.env.OPENAI_API_KEY },
      },
    });
    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);
    const themeProcessor = new ThemeAssetProcessor(assetManager, assetQueue, true);

    // Get available themes
    const availableThemes = themeProcessor.getAvailableThemes();

    // Get pack templates
    const packTemplates = themeProcessor.getAssetPackTemplates();

    // Get user's subscription tier if authenticated
    let userTier = 'free';
    if (user) {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        userTier = profile.subscription_tier;
      }
    }

    // Filter themes based on user's subscription tier
    const accessibleThemes = availableThemes.filter(theme => {
      if (theme.metadata.complexity === 'complex' && userTier !== 'max') {
        return false;
      }
      if (theme.metadata.complexity === 'medium' && userTier === 'free') {
        return false;
      }
      return true;
    });

    // Get theme templates from database
    const { data: dbTemplates } = await (supabase as any)
      .from('ai_theme_templates')
      .select('*')
      .eq('is_active', true)
      .lte('required_tier', getTierLevel(userTier))
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false });

    return NextResponse.json({
      success: true,
      themes: accessibleThemes.map(theme => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        tags: theme.tags,
        estimatedAssetCount: theme.metadata.estimatedAssetCount,
        complexity: theme.metadata.complexity,
        gameGenres: theme.metadata.gameGenre,
        targetAge: theme.metadata.targetAge,
        accessible: true,
      })),
      packTemplates: Object.entries(packTemplates).map(([key, template]) => ({
        id: key,
        name: template.theme?.name || key,
        theme: template.theme,
        categories: Object.keys(template.assetCategories || {}),
        estimatedAssets: Object.values(template.assetCategories || {})
          .reduce((sum, cat: any) => sum + (cat.count * (cat.variations || 1)), 0),
        estimatedCredits: estimatePackTemplateCredits(template),
      })),
      databaseTemplates: dbTemplates || [],
      userTier,
      message: `Found ${accessibleThemes.length} accessible themes for ${userTier} tier`,
    });

  } catch (error) {
    console.error("Failed to get available themes:", error);

    return NextResponse.json(
      { 
        error: "Failed to retrieve available themes",
        code: ERROR_CODES.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate theme pack generation request
 */
function validateThemePackRequest(request: ThemePackRequest): string | null {
  if (!request.themeId || typeof request.themeId !== 'string') {
    return "Theme ID is required and must be a string";
  }

  if (request.themeId.length > 50) {
    return "Theme ID exceeds maximum length (50 characters)";
  }

  if (request.priority && !['low', 'normal', 'high', 'urgent'].includes(request.priority)) {
    return "Invalid priority value";
  }

  if (request.customConfig) {
    // Validate custom configuration if provided
    const config = request.customConfig;

    if (config.generation?.maxConcurrent && 
        (config.generation.maxConcurrent < 1 || config.generation.maxConcurrent > 10)) {
      return "Max concurrent jobs must be between 1 and 10";
    }

    if (config.generation?.timeoutMinutes && 
        (config.generation.timeoutMinutes < 5 || config.generation.timeoutMinutes > 120)) {
      return "Timeout must be between 5 and 120 minutes";
    }

    if (config.generation?.qualityThreshold && 
        (config.generation.qualityThreshold < 0 || config.generation.qualityThreshold > 1)) {
      return "Quality threshold must be between 0 and 1";
    }
  }

  return null;
}

/**
 * Estimate credits needed for theme pack generation
 */
function estimateThemePackCredits(theme: any, customConfig?: Partial<AssetPackConfig>): number {
  const baseCreditsPerAsset = 15; // Higher base cost for theme packs
  let totalCredits = theme.metadata.estimatedAssetCount * baseCreditsPerAsset;

  // Complexity multiplier
  switch (theme.metadata.complexity) {
    case 'complex':
      totalCredits *= 1.5;
      break;
    case 'medium':
      totalCredits *= 1.2;
      break;
    case 'simple':
    default:
      totalCredits *= 1.0;
      break;
  }

  // Custom configuration adjustments
  if (customConfig?.generation?.qualityThreshold && customConfig.generation.qualityThreshold > 0.8) {
    totalCredits *= 1.3; // Higher quality requires more credits
  }

  if (customConfig?.output?.generateAnimations) {
    totalCredits *= 1.4; // Animation generation adds cost
  }

  if (customConfig?.consistency?.crossReference) {
    totalCredits *= 1.1; // Cross-referencing adds slight cost
  }

  return Math.round(totalCredits);
}

/**
 * Estimate credits for pack template
 */
function estimatePackTemplateCredits(template: Partial<AssetPackConfig>): number {
  if (!template.assetCategories) return 0;

  let totalAssets = 0;
  for (const category of Object.values(template.assetCategories)) {
    if (typeof category === 'object' && 'count' in category) {
      totalAssets += (category as any).count * ((category as any).variations || 1);
    }
  }

  return totalAssets * 12; // Base estimate
}

/**
 * Get tier level for comparison
 */
function getTierLevel(tier: string): number {
  switch (tier) {
    case 'free': return 1;
    case 'pro': return 2;
    case 'max': return 3;
    case 'educational': return 2;
    default: return 1;
  }
}