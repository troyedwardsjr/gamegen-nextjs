/**
 * Toxoid Script Optimization API Route
 * 
 * NextJS API endpoint for optimizing Toxoid-compatible JavaScript scripts.
 * Provides script optimization, performance profiling, and enhancement 
 * recommendations for QuickJS runtime compatibility and performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToxoidScriptOptimizer } from '@/lib/toxoid/script-optimizer';
import { ScriptOptimizationRequest, ScriptOptimizationResult, PerformanceProfile } from '@/types/toxoid';

// Initialize services
let scriptOptimizer: ToxoidScriptOptimizer;

async function initializeServices() {
  if (!scriptOptimizer) {
    scriptOptimizer = new ToxoidScriptOptimizer();
  }
}

interface OptimizationResponse {
  success: boolean;
  result?: {
    originalScript: string;
    optimizedScript: string;
    compressionRatio: number;
    optimizationsApplied: string[];
    performanceGains: {
      memoryReduction: number;
      sizeReduction: number;
      estimatedSpeedImprovement: number;
    };
  };
  metadata?: {
    optimizationTime: number;
    originalSize: number;
    optimizedSize: number;
    optimizationLevel: string;
    targetRuntime: string;
  };
  error?: string;
  code?: string;
}

interface ProfileResponse {
  success: boolean;
  profile?: PerformanceProfile;
  metadata?: {
    analysisTime: number;
    scriptLength: number;
  };
  error?: string;
  code?: string;
}

/**
 * POST /api/v1/ai/scripts/optimize
 * 
 * Optimize a Toxoid-compatible script for performance and size
 */
export async function POST(request: NextRequest): Promise<NextResponse<OptimizationResponse>> {
  const startTime = Date.now();
  
  try {
    // Initialize services
    await initializeServices();

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    // Validate required fields
    const validationError = validateOptimizationRequest(body);
    if (validationError) {
      return NextResponse.json({
        success: false,
        error: validationError.message,
        code: validationError.code
      }, { status: 400 });
    }

    // Build optimization request
    const optimizationRequest: ScriptOptimizationRequest = {
      script: body.script,
      optimizationLevel: body.optimizationLevel || 'basic',
      preserveComments: body.preserveComments !== false, // Default to true
      targetRuntime: body.targetRuntime || 'quickjs'
    };

    console.log(`[OptimizationAPI] Optimizing script (${body.script.length} chars) with level: ${optimizationRequest.optimizationLevel}`);

    // Perform optimization
    const optimizationResult = await scriptOptimizer.optimizeScript(optimizationRequest);

    const optimizationTime = Date.now() - startTime;
    const originalSize = body.script.length;
    const optimizedSize = optimizationResult.optimizedScript.length;

    // Prepare response
    const response: OptimizationResponse = {
      success: true,
      result: optimizationResult,
      metadata: {
        optimizationTime,
        originalSize,
        optimizedSize,
        optimizationLevel: optimizationRequest.optimizationLevel,
        targetRuntime: optimizationRequest.targetRuntime
      }
    };

    console.log(`[OptimizationAPI] Optimization completed in ${optimizationTime}ms - Size: ${originalSize} -> ${optimizedSize} (${optimizationResult.compressionRatio.toFixed(2)}x)`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[OptimizationAPI] Optimization failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Script optimization failed';

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: 'OPTIMIZATION_FAILED'
    }, { status: 500 });
  }
}

/**
 * PUT /api/v1/ai/scripts/optimize
 * 
 * Get performance profile for a script without optimization
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  const startTime = Date.now();
  
  try {
    await initializeServices();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    if (!body.script || typeof body.script !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid script field',
        code: 'MISSING_SCRIPT'
      }, { status: 400 });
    }

    if (body.script.length > 1024 * 1024) { // 1MB limit
      return NextResponse.json({
        success: false,
        error: 'Script must be less than 1MB',
        code: 'SCRIPT_TOO_LARGE'
      }, { status: 400 });
    }

    console.log(`[OptimizationAPI] Profiling script (${body.script.length} chars)`);

    // Generate performance profile
    const profile = await scriptOptimizer.profileScript(body.script);

    const analysisTime = Date.now() - startTime;

    const response: ProfileResponse = {
      success: true,
      profile,
      metadata: {
        analysisTime,
        scriptLength: body.script.length
      }
    };

    console.log(`[OptimizationAPI] Profiling completed in ${analysisTime}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[OptimizationAPI] Profiling failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Script profiling failed',
      code: 'PROFILING_FAILED'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/ai/scripts/optimize
 * 
 * Get optimization capabilities and configuration options
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const capabilities = {
      optimizationLevels: [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Remove comments, optimize whitespace, basic variable optimization',
          features: [
            'Comment removal',
            'Whitespace optimization',
            'Variable declaration optimization',
            'Basic dead code elimination'
          ],
          estimatedGains: {
            sizeReduction: '10-20%',
            speedImprovement: '5-10%',
            memoryReduction: '5-15%'
          }
        },
        {
          id: 'aggressive',
          name: 'Aggressive',
          description: 'Advanced optimizations including function inlining and loop optimization',
          features: [
            'All basic optimizations',
            'Function optimization',
            'Loop restructuring',
            'API call caching',
            'Memory allocation optimization',
            'Performance-critical code optimization'
          ],
          estimatedGains: {
            sizeReduction: '20-40%',
            speedImprovement: '15-30%',
            memoryReduction: '20-35%'
          }
        },
        {
          id: 'minify',
          name: 'Minify',
          description: 'Maximum size reduction for production deployment',
          features: [
            'All aggressive optimizations',
            'Variable name mangling',
            'Maximum whitespace removal',
            'String optimization',
            'Object property optimization'
          ],
          estimatedGains: {
            sizeReduction: '40-70%',
            speedImprovement: '20-40%',
            memoryReduction: '30-50%'
          }
        }
      ],
      targetRuntimes: [
        {
          id: 'quickjs',
          name: 'QuickJS',
          description: 'Optimize for QuickJS runtime performance characteristics',
          features: [
            'Avoid arrow functions for better performance',
            'Optimize array operations',
            'Cache object property access',
            'Use traditional for loops over array methods'
          ]
        },
        {
          id: 'v8',
          name: 'V8 (Chrome/Node)',
          description: 'Optimize for V8 JavaScript engine',
          features: [
            'Modern JavaScript features',
            'Arrow function optimization',
            'Generator and async optimization',
            'Advanced array method optimization'
          ]
        },
        {
          id: 'both',
          name: 'Universal',
          description: 'Balance optimizations for both QuickJS and V8',
          features: [
            'Conservative optimizations',
            'Maximum compatibility',
            'Performance improvements for both runtimes'
          ]
        }
      ],
      optimizationPasses: [
        {
          name: 'Remove Comments',
          description: 'Strip single-line and multi-line comments',
          configurable: true
        },
        {
          name: 'Whitespace Optimization',
          description: 'Remove unnecessary whitespace and formatting',
          configurable: false
        },
        {
          name: 'Variable Declaration Optimization',
          description: 'Combine declarations and optimize variable types',
          configurable: false
        },
        {
          name: 'Function Optimization',
          description: 'Optimize function declarations and calls',
          configurable: false
        },
        {
          name: 'Loop Optimization',
          description: 'Optimize loop constructs for better performance',
          configurable: false
        },
        {
          name: 'API Call Optimization',
          description: 'Cache frequent API calls and optimize patterns',
          configurable: false
        },
        {
          name: 'Dead Code Elimination',
          description: 'Remove unused variables and unreachable code',
          configurable: false
        }
      ],
      performanceMetrics: [
        {
          metric: 'memoryUsage',
          description: 'Estimated memory usage breakdown',
          components: ['heap', 'stack', 'objects', 'strings', 'arrays']
        },
        {
          metric: 'executionTime',
          description: 'Estimated execution time analysis',
          components: ['totalTime', 'hotPaths', 'systemCalls']
        },
        {
          metric: 'apiCallFrequency',
          description: 'Frequency of Toxoid API calls',
          components: ['byType', 'inLoops', 'cached']
        },
        {
          metric: 'loopComplexity',
          description: 'Analysis of loop structures and complexity',
          components: ['iterations', 'nesting', 'optimizations']
        }
      ],
      quickjsSpecific: {
        memoryLimit: '50MB',
        stackLimit: '1MB',
        optimizations: [
          'Prefer traditional functions over arrow functions',
          'Use for loops instead of array methods where possible',
          'Cache object property access',
          'Minimize object creation in loops',
          'Use const for immutable values'
        ],
        limitations: [
          'Limited arrow function performance',
          'No dynamic imports',
          'Reduced Symbol support',
          'Limited Proxy support'
        ]
      },
      suggestions: {
        caching: 'Cache frequently accessed singletons and components',
        loops: 'Optimize nested loops and reduce iterations',
        memory: 'Use object pooling for frequently created objects',
        api: 'Batch API operations and minimize calls in hot paths',
        complexity: 'Break down complex functions into smaller pieces'
      }
    };

    return NextResponse.json(capabilities, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[OptimizationAPI] Failed to get capabilities:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve optimization capabilities',
      code: 'CAPABILITIES_ERROR'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/ai/scripts/optimize
 * 
 * Get optimization recommendations for a script without performing optimization
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    await initializeServices();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    if (!body.script || typeof body.script !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid script field',
        code: 'MISSING_SCRIPT'
      }, { status: 400 });
    }

    console.log(`[OptimizationAPI] Getting recommendations for script (${body.script.length} chars)`);

    // Get optimization recommendations
    const recommendations = await scriptOptimizer.getOptimizationRecommendations(body.script);

    const analysisTime = Date.now() - startTime;

    console.log(`[OptimizationAPI] Generated ${recommendations.length} recommendations in ${analysisTime}ms`);

    return NextResponse.json({
      success: true,
      recommendations,
      metadata: {
        analysisTime,
        scriptLength: body.script.length,
        recommendationCount: recommendations.length
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[OptimizationAPI] Recommendations failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get optimization recommendations',
      code: 'RECOMMENDATIONS_FAILED'
    }, { status: 500 });
  }
}

/**
 * Validate optimization request body
 */
function validateOptimizationRequest(body: any): { message: string; code: string } | null {
  if (!body.script || typeof body.script !== 'string') {
    return {
      message: 'Missing or invalid script field',
      code: 'MISSING_SCRIPT'
    };
  }

  if (body.script.length === 0) {
    return {
      message: 'Script cannot be empty',
      code: 'EMPTY_SCRIPT'
    };
  }

  if (body.script.length > 1024 * 1024) { // 1MB limit
    return {
      message: 'Script must be less than 1MB',
      code: 'SCRIPT_TOO_LARGE'
    };
  }

  const validOptimizationLevels = ['basic', 'aggressive', 'minify'];
  if (body.optimizationLevel && !validOptimizationLevels.includes(body.optimizationLevel)) {
    return {
      message: `Invalid optimization level. Must be one of: ${validOptimizationLevels.join(', ')}`,
      code: 'INVALID_OPTIMIZATION_LEVEL'
    };
  }

  const validTargetRuntimes = ['quickjs', 'v8', 'both'];
  if (body.targetRuntime && !validTargetRuntimes.includes(body.targetRuntime)) {
    return {
      message: `Invalid target runtime. Must be one of: ${validTargetRuntimes.join(', ')}`,
      code: 'INVALID_TARGET_RUNTIME'
    };
  }

  if (body.preserveComments !== undefined && typeof body.preserveComments !== 'boolean') {
    return {
      message: 'preserveComments must be a boolean',
      code: 'INVALID_PRESERVE_COMMENTS'
    };
  }

  return null;
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}