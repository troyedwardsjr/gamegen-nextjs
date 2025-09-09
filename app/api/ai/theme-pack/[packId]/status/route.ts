/**
 * Theme Asset Pack Status API Endpoint
 * 
 * RESTful API endpoint for retrieving theme pack generation progress,
 * status updates, and completion results.
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

/**
 * GET /api/ai/theme-pack/[packId]/status
 * Get theme pack generation progress and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<Response> {
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
    const { packId } = params;

    // Validate pack ID format
    if (!packId || typeof packId !== 'string' || !packId.startsWith('pack_')) {
      return NextResponse.json(
        { error: "Invalid pack ID format", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Initialize theme processor
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
        dalle: {
          apiKey: process.env.OPENAI_API_KEY,
          enabled: !!process.env.OPENAI_API_KEY,
        },
      },
    });

    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);
    const themeProcessor = new ThemeAssetProcessor(assetManager, assetQueue, true);

    // Get theme pack progress
    const progress = await themeProcessor.getThemePackProgress(packId, userId);

    // Determine response status based on pack status
    let responseStatus = 200;
    if (progress.overallProgress === 100) {
      responseStatus = 200; // Complete
    } else if (progress.overallProgress > 0) {
      responseStatus = 202; // In progress (Accepted)
    } else {
      responseStatus = 202; // Queued (Accepted)
    }

    return NextResponse.json({
      success: true,
      packId: progress.packId,
      status: progress.overallProgress === 100 ? 'completed' : 
              progress.overallProgress > 0 ? 'processing' : 'queued',
      progress: {
        overall: progress.overallProgress,
        completed: progress.completedAssets,
        total: progress.totalAssets,
        current: {
          category: progress.currentCategory,
          asset: progress.currentAsset,
        },
        byCategory: progress.categoryProgress,
        quality: {
          scores: progress.qualityScores,
          average: progress.qualityScores.length > 0 
            ? progress.qualityScores.reduce((sum, score) => sum + score, 0) / progress.qualityScores.length
            : 0,
        },
        consistency: {
          checks: progress.consistencyChecks,
          overallScore: progress.consistencyChecks.length > 0
            ? progress.consistencyChecks.reduce((sum, check) => sum + check.score, 0) / progress.consistencyChecks.length
            : 0,
        },
      },
      timing: {
        estimatedCompletion: progress.estimatedCompletion,
        processingTime: Date.now() - startTime,
      },
      nextCheck: new Date(Date.now() + (progress.overallProgress < 100 ? 30000 : 300000)).toISOString(), // 30s if processing, 5min if complete
    }, { status: responseStatus });

  } catch (error) {
    console.error("Failed to get theme pack status:", error);

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
        error: "Failed to retrieve theme pack status",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/theme-pack/[packId]/status
 * Cancel theme pack generation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<Response> {
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
    const { packId } = params;

    // Validate pack ID format
    if (!packId || typeof packId !== 'string' || !packId.startsWith('pack_')) {
      return NextResponse.json(
        { error: "Invalid pack ID format", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Initialize theme processor
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
        dalle: {
          apiKey: process.env.OPENAI_API_KEY,
          enabled: !!process.env.OPENAI_API_KEY,
        },
      },
    });

    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);
    const themeProcessor = new ThemeAssetProcessor(assetManager, assetQueue, true);

    // Cancel the theme pack generation
    await themeProcessor.cancelThemePackGeneration(packId, userId);

    return NextResponse.json({
      success: true,
      packId,
      message: "Theme pack generation has been cancelled",
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error("Failed to cancel theme pack:", error);

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
        error: "Failed to cancel theme pack generation",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}