/**
 * Theme Asset Pack Results API Endpoint
 * 
 * RESTful API endpoint for retrieving completed theme pack results,
 * generated assets, and download packages.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { ThemeAssetProcessor } from "@/lib/ai/asset-generation/theme-processor";
import {
  AssetGenerationError,
  ERROR_CODES,
} from "@/lib/ai/asset-generation/types";

interface RouteParams {
  packId: string;
}

interface ThemePackResultsResponse {
  success: boolean;
  packId: string;
  theme: {
    id: string;
    name: string;
    description: string;
  };
  results: {
    totalAssets: number;
    generatedAssets: any[];
    failedAssets: any[];
    successRate: number;
  };
  quality: {
    averageScore: number;
    consistencyScore: number;
    qualityDistribution: { [key: string]: number };
  };
  organization: {
    categories: { [category: string]: any[] };
    spriteSheets?: any[];
    animations?: any[];
  };
  downloads: {
    packageUrl?: string;
    individualAssets: boolean;
    spriteSheets: boolean;
    animations: boolean;
  };
  metadata: {
    processingTime: number;
    creditsUsed: number;
    completedAt: string;
    generationSettings: any;
  };
  analytics: {
    categoryBreakdown: { [category: string]: { total: number; success: number; failed: number } };
    qualityByCategory: { [category: string]: number };
    processingTimeByCategory: { [category: string]: number };
  };
}

/**
 * GET /api/ai/theme-pack/[packId]/results
 * Get completed theme pack results and assets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<Response> {
  const { packId } = await params;
  const startTime = Date.now();
  let userId: string | undefined;

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
    // packId is already extracted from params above

    // Validate pack ID format
    if (!packId || typeof packId !== 'string' || !packId.startsWith('pack_')) {
      return NextResponse.json(
        { error: "Invalid pack ID format", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const includeAssets = url.searchParams.get('includeAssets') !== 'false';
    const includeAnalytics = url.searchParams.get('includeAnalytics') !== 'false';
    const format = url.searchParams.get('format') || 'json';

    // Initialize theme processor
    const assetManager = new AssetGenerationManager({
      defaultProvider: "pixellab",
      providers: {
        pixellab: {
          apiKey: process.env.PIXELLAB_API_KEY,
          enabled: !!process.env.PIXELLAB_API_KEY,
        },
        retrodiffusion: {
          apiKey: process.env.RETRODIFFUSION_API_KEY,
          enabled: !!process.env.RETRODIFFUSION_API_KEY,
        },
        dalle: {
          apiKey: process.env.OPENAI_API_KEY,
          enabled: !!process.env.OPENAI_API_KEY,
        },
      },
    });

    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);
    const themeProcessor = new ThemeAssetProcessor(assetManager, assetQueue, true);

    // Get theme pack results
    const packResult = await themeProcessor.getThemePackResult(packId, userId);

    // Get theme information
    const availableThemes = themeProcessor.getAvailableThemes();
    const theme = availableThemes.find(t => t.id === packResult.themeId);

    // Organize assets by category
    const assetsByCategory: { [category: string]: any[] } = {};
    const qualityByCategory: { [category: string]: number } = {};
    const processingTimeByCategory: { [category: string]: number } = {};
    const categoryBreakdown: { [category: string]: { total: number; success: number; failed: number } } = {};

    if (includeAssets && packResult.generatedAssets) {
      for (const asset of packResult.generatedAssets) {
        const category = asset.metadata?.category || 'uncategorized';
        
        if (!assetsByCategory[category]) {
          assetsByCategory[category] = [];
          qualityByCategory[category] = 0;
          processingTimeByCategory[category] = 0;
          categoryBreakdown[category] = { total: 0, success: 0, failed: 0 };
        }
        
        assetsByCategory[category].push(asset);
        categoryBreakdown[category].success++;
        categoryBreakdown[category].total++;
        
        if (asset.qualityScore) {
          qualityByCategory[category] = 
            (qualityByCategory[category] + asset.qualityScore) / 2;
        }
        
        if (asset.processingTime) {
          processingTimeByCategory[category] += asset.processingTime;
        }
      }
    }

    // Add failed assets to category breakdown
    if (packResult.failedAssets) {
      for (const failed of packResult.failedAssets) {
        const category = failed.category || 'uncategorized';
        
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, success: 0, failed: 0 };
        }
        
        categoryBreakdown[category].failed++;
        categoryBreakdown[category].total++;
      }
    }

    // Calculate quality distribution
    const qualityDistribution: { [key: string]: number } = {
      'excellent': 0, // 0.9+
      'good': 0,      // 0.7-0.89
      'fair': 0,      // 0.5-0.69
      'poor': 0,      // <0.5
    };

    if (packResult.generatedAssets) {
      for (const asset of packResult.generatedAssets) {
        const score = asset.qualityScore || 0;
        if (score >= 0.9) qualityDistribution.excellent++;
        else if (score >= 0.7) qualityDistribution.good++;
        else if (score >= 0.5) qualityDistribution.fair++;
        else qualityDistribution.poor++;
      }
    }

    // Calculate success rate
    const totalAttempts = packResult.totalAssets;
    const successful = packResult.generatedAssets?.length || 0;
    const successRate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0;

    // Prepare response
    const response: ThemePackResultsResponse = {
      success: true,
      packId: packResult.packId,
      theme: {
        id: packResult.themeId,
        name: theme?.name || packResult.themeId,
        description: theme?.description || '',
      },
      results: {
        totalAssets: packResult.totalAssets,
        generatedAssets: includeAssets ? packResult.generatedAssets : [],
        failedAssets: packResult.failedAssets,
        successRate: Math.round(successRate * 100) / 100,
      },
      quality: {
        averageScore: Math.round(packResult.qualityScore * 100) / 100,
        consistencyScore: Math.round(packResult.consistencyScore * 100) / 100,
        qualityDistribution,
      },
      organization: {
        categories: assetsByCategory,
        spriteSheets: packResult.spriteSheets || [],
        animations: [], // TODO: Add animation support
      },
      downloads: {
        packageUrl: packResult.packageUrl,
        individualAssets: true,
        spriteSheets: (packResult.spriteSheets?.length || 0) > 0,
        animations: false, // TODO: Add animation support
      },
      metadata: {
        processingTime: packResult.processingTime,
        creditsUsed: packResult.creditsUsed,
        completedAt: new Date().toISOString(), // TODO: Get from database
        generationSettings: {}, // TODO: Include generation settings
      },
      analytics: includeAnalytics ? {
        categoryBreakdown,
        qualityByCategory,
        processingTimeByCategory,
      } : {
        categoryBreakdown: {},
        qualityByCategory: {},
        processingTimeByCategory: {},
      },
    };

    // Handle different response formats
    if (format === 'summary') {
      // Return a summarized version
      return NextResponse.json({
        success: true,
        packId: packResult.packId,
        theme: response.theme,
        summary: {
          totalAssets: response.results.totalAssets,
          successful: successful,
          failed: response.results.failedAssets.length,
          successRate: response.results.successRate,
          averageQuality: response.quality.averageScore,
          processingTime: response.metadata.processingTime,
          creditsUsed: response.metadata.creditsUsed,
          categories: Object.keys(assetsByCategory).length,
          downloadAvailable: !!response.downloads.packageUrl,
        },
        requestTime: Date.now() - startTime,
      });
    }

    return NextResponse.json({
      ...response,
      requestTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error("Failed to get theme pack results:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.NOT_FOUND ? 404 :
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to retrieve theme pack results",
        code: ERROR_CODES.INTERNAL_ERROR,
        requestTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/theme-pack/[packId]/results
 * Add review or feedback for a theme pack
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<Response> {
  const { packId } = await params;
  const startTime = Date.now();
  let userId: string | undefined;

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
    // packId is already extracted from params above

    // Parse request body
    const reviewData = await request.json();

    // Validate review data
    const validationError = validateReviewData(reviewData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Verify pack exists and user has access
    const { data: pack, error: packError } = await (supabase as any)
      .from('ai_asset_packs')
      .select('id, theme_id, status')
      .eq('id', packId)
      .eq('user_id', userId)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { error: "Asset pack not found or access denied", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (pack.status !== 'completed') {
      return NextResponse.json(
        { error: "Can only review completed asset packs", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Create or update review
    const { data: review, error: reviewError } = await (supabase as any)
      .from('ai_asset_pack_reviews')
      .upsert({
        pack_id: packId,
        user_id: userId,
        rating: reviewData.rating,
        quality_rating: reviewData.qualityRating,
        consistency_rating: reviewData.consistencyRating,
        usefulness_rating: reviewData.usefulnessRating,
        review_text: reviewData.reviewText,
        liked_categories: reviewData.likedCategories || [],
        improvement_suggestions: reviewData.improvementSuggestions || [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reviewError) {
      throw new AssetGenerationError(
        'Failed to save review',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // Update theme analytics with the new review
    const { error: analyticsError } = await (supabase as any)
      .rpc('update_theme_analytics', {
        p_theme_id: pack.theme_id,
        p_pack_status: null,
        p_assets_count: 0,
        p_quality_score: 0,
        p_consistency_score: 0,
        p_processing_time: 0,
        p_credits_used: 0,
      });

    if (analyticsError) {
      console.warn('Failed to update theme analytics:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      packId,
      review: {
        id: review.id,
        rating: review.rating,
        qualityRating: review.quality_rating,
        consistencyRating: review.consistency_rating,
        usefulnessRating: review.usefulness_rating,
        reviewText: review.review_text,
        likedCategories: review.liked_categories,
        improvementSuggestions: review.improvement_suggestions,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      },
      message: "Review saved successfully",
      requestTime: Date.now() - startTime,
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to save pack review:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.NOT_FOUND ? 404 :
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 
                 error.code === ERROR_CODES.DATABASE_ERROR ? 500 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to save review",
        code: ERROR_CODES.INTERNAL_ERROR,
        requestTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate review request data
 */
function validateReviewData(data: any): string | null {
  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    return "Overall rating is required and must be between 1 and 5";
  }

  if (data.qualityRating && (typeof data.qualityRating !== 'number' || data.qualityRating < 1 || data.qualityRating > 5)) {
    return "Quality rating must be between 1 and 5";
  }

  if (data.consistencyRating && (typeof data.consistencyRating !== 'number' || data.consistencyRating < 1 || data.consistencyRating > 5)) {
    return "Consistency rating must be between 1 and 5";
  }

  if (data.usefulnessRating && (typeof data.usefulnessRating !== 'number' || data.usefulnessRating < 1 || data.usefulnessRating > 5)) {
    return "Usefulness rating must be between 1 and 5";
  }

  if (data.reviewText && typeof data.reviewText !== 'string') {
    return "Review text must be a string";
  }

  if (data.reviewText && data.reviewText.length > 2000) {
    return "Review text cannot exceed 2000 characters";
  }

  if (data.likedCategories && !Array.isArray(data.likedCategories)) {
    return "Liked categories must be an array";
  }

  if (data.improvementSuggestions && !Array.isArray(data.improvementSuggestions)) {
    return "Improvement suggestions must be an array";
  }

  return null;
}