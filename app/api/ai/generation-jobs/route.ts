/**
 * AI Asset Generation Jobs List API
 * 
 * RESTful API endpoints for listing user's generation jobs with filtering,
 * pagination, and queue statistics.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetGenerationError, ERROR_CODES, GenerationJob } from "@/lib/ai/asset-generation/types";

interface GetJobsParams {
  status?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'priority';
  orderDirection?: 'asc' | 'desc';
}

/**
 * GET /api/ai/generation-jobs
 * Get user's generation jobs with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<Response> {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: GetJobsParams = {};

    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      params.status = statusParam.split(',') as GenerationJob['status'][];
    }

    // Parse pagination
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (limit > 0 && limit <= 100) {
        params.limit = limit;
      }
    }

    const offsetParam = searchParams.get('offset');
    if (offsetParam) {
      const offset = parseInt(offsetParam, 10);
      if (offset >= 0) {
        params.offset = offset;
      }
    }

    // Parse ordering
    const orderByParam = searchParams.get('orderBy');
    if (orderByParam && ['created_at', 'updated_at', 'priority'].includes(orderByParam)) {
      params.orderBy = orderByParam as any;
    }

    const orderDirectionParam = searchParams.get('orderDirection');
    if (orderDirectionParam && ['asc', 'desc'].includes(orderDirectionParam)) {
      params.orderDirection = orderDirectionParam as any;
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

    // Get user's jobs
    const jobs = await assetQueue.getUserJobs(user.id, params);

    // Get queue metrics if requested
    const includeMetrics = searchParams.get('include_metrics') === 'true';
    let queueMetrics = undefined;
    
    if (includeMetrics) {
      queueMetrics = await assetQueue.getQueueMetrics();
    }

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        limit: params.limit || 20,
        offset: params.offset || 0,
        total: jobs.length, // This would be more accurate with a count query
      },
      queueMetrics,
    });

  } catch (error) {
    console.error("Failed to get generation jobs:", error);

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
        error: "Failed to get generation jobs",
        code: ERROR_CODES.INTERNAL_ERROR 
      },
      { status: 500 }
    );
  }
}