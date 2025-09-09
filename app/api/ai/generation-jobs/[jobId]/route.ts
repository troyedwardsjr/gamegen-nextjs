/**
 * AI Asset Generation Job Management API
 * 
 * RESTful API endpoints for managing individual asset generation jobs,
 * including status checking, cancellation, and result retrieval.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetGenerationError, ERROR_CODES } from "@/lib/ai/asset-generation/types";

/**
 * GET /api/ai/generation-jobs/[jobId]
 * Get status and results of a specific generation job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<Response> {
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

    // Initialize queue system
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
    });

    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);

    // Get job status
    const job = await assetQueue.getJobStatus(params.jobId, user.id);

    return NextResponse.json({
      success: true,
      job,
    });

  } catch (error) {
    console.error("Failed to get generation job status:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to get generation job status",
        code: ERROR_CODES.INTERNAL_ERROR 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/generation-jobs/[jobId]
 * Cancel a generation job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<Response> {
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

    // Initialize queue system
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
    });

    const assetQueue = new AssetGenerationQueue(assetManager, {}, true);

    // Cancel the job
    await assetQueue.cancelJob(params.jobId, user.id);

    return NextResponse.json({
      success: true,
      message: "Generation job cancelled successfully",
      jobId: params.jobId,
    });

  } catch (error) {
    console.error("Failed to cancel generation job:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to cancel generation job",
        code: ERROR_CODES.INTERNAL_ERROR 
      },
      { status: 500 }
    );
  }
}