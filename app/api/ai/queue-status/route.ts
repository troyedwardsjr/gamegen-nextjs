/**
 * AI Asset Generation Queue Status API
 * 
 * RESTful API endpoint for retrieving queue metrics, system status,
 * and provider health information for the asset generation pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetGenerationManager } from "@/lib/ai/asset-generation/manager";
import { AssetGenerationQueue } from "@/lib/ai/asset-generation/queue";
import { AssetGenerationError, ERROR_CODES } from "@/lib/ai/asset-generation/types";

/**
 * GET /api/ai/queue-status
 * Get comprehensive queue status, metrics, and provider health
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Authentication (optional for basic status, required for detailed metrics)
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
    const isAuthenticated = !authError && !!user;

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeProviders = searchParams.get('include_providers') === 'true';
    const includeRecommendations = searchParams.get('include_recommendations') === 'true' && isAuthenticated;

    // Get queue metrics
    const queueMetrics = await assetQueue.getQueueMetrics();

    // Prepare response data
    const responseData: any = {
      success: true,
      timestamp: new Date().toISOString(),
      queue: queueMetrics,
      system: {
        status: queueMetrics.currentLoad < 0.8 ? 'healthy' : 
                queueMetrics.currentLoad < 0.95 ? 'busy' : 'overloaded',
        uptime: process.uptime(),
        version: '1.0.0',
        maintenance: false,
      },
    };

    // Include provider status if requested
    if (includeProviders) {
      const providerStatus = await assetManager.getProvidersStatus();
      responseData.providers = providerStatus;

      // Calculate overall provider health
      const healthyProviders = Object.values(providerStatus).filter(p => p.status === 'online').length;
      const totalProviders = Object.keys(providerStatus).length;
      responseData.system.providerHealth = {
        healthy: healthyProviders,
        total: totalProviders,
        percentage: Math.round((healthyProviders / totalProviders) * 100),
      };
    }

    // Include user-specific data if authenticated
    if (isAuthenticated && user) {
      // Get user's recent jobs
      const userJobs = await assetQueue.getUserJobs(user.id, {
        status: ['queued', 'processing'],
        limit: 10,
      });

      responseData.user = {
        id: user.id,
        activeJobs: userJobs.length,
        jobsInQueue: userJobs.filter(job => job.status === 'queued').length,
        jobsProcessing: userJobs.filter(job => job.status === 'processing').length,
        recentJobs: userJobs.map(job => ({
          id: job.id,
          status: job.status,
          priority: job.priority,
          progress: job.progress,
          queuePosition: job.queuePosition,
          estimatedCompletion: job.estimatedCompletion,
        })),
      };

      // Include provider recommendations if requested
      if (includeRecommendations) {
        // Get a sample request for recommendations (would be better with user's actual preferences)
        const sampleRequest = {
          assetType: 'sprite' as const,
          style: 'pixel-art' as const,
          prompt: 'sample',
        };
        const recommendations = assetManager.getProviderRecommendations(sampleRequest);
        responseData.recommendations = recommendations;
      }
    }

    // Include health tips and recommendations
    responseData.tips = generateSystemTips(queueMetrics, responseData.system);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Failed to get queue status:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to get queue status",
        code: ERROR_CODES.INTERNAL_ERROR 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate helpful tips based on system status
 */
function generateSystemTips(queueMetrics: any, systemStatus: any): string[] {
  const tips: string[] = [];

  // Queue-based tips
  if (queueMetrics.queuedJobs > 20) {
    tips.push("High queue volume detected. Consider using batch generation for multiple assets.");
  }

  if (queueMetrics.successRatePercentage < 85) {
    tips.push("Some generations may be failing. Try simpler prompts or different providers.");
  }

  if (queueMetrics.averageWaitTimeMinutes > 10) {
    tips.push("Wait times are longer than usual. Consider generating during off-peak hours.");
  }

  // System-based tips
  if (systemStatus.status === 'busy') {
    tips.push("System is busy. Non-urgent generations will be queued.");
  } else if (systemStatus.status === 'overloaded') {
    tips.push("System is overloaded. Consider trying again in a few minutes.");
  }

  // Provider-specific tips
  if (systemStatus.providerHealth && systemStatus.providerHealth.percentage < 75) {
    tips.push("Some providers are offline. Generations may take longer due to fallback processing.");
  }

  // General tips if no specific issues
  if (tips.length === 0) {
    tips.push("System is running smoothly. Perfect time for asset generation!");
  }

  return tips;
}

/**
 * GET /api/ai/queue-status/health
 * Simple health check endpoint (no authentication required)
 */
export async function HEAD(request: NextRequest): Promise<Response> {
  try {
    // Basic system health check
    const isHealthy = process.uptime() > 0; // Simple check

    if (isHealthy) {
      return new Response(null, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Health-Status': 'healthy',
        }
      });
    } else {
      return new Response(null, { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Health-Status': 'unhealthy',
        }
      });
    }
  } catch (error) {
    return new Response(null, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Health-Status': 'error',
      }
    });
  }
}