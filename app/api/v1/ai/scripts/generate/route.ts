/**
 * Toxoid Script Generation API Route
 * 
 * NextJS API endpoint for generating Toxoid-compatible JavaScript scripts
 * using the GameGen LLM system. Supports various game types, complexity levels,
 * and feature requirements with comprehensive error handling and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToxoidScriptGenerator } from '@/lib/toxoid/script-generator';
import { ToxoidScriptValidator } from '@/lib/toxoid/script-validator';
import { ProviderManager } from '@/lib/llm/providers/manager';
import { ScriptGenerationRequest } from '@/types/toxoid';

// Initialize the LLM provider manager and script generator
let providerManager: ProviderManager;
let scriptGenerator: ToxoidScriptGenerator;
let scriptValidator: ToxoidScriptValidator;

async function initializeServices() {
  if (!providerManager) {
    providerManager = new ProviderManager();
    await providerManager.initialize();
  }
  
  if (!scriptGenerator) {
    scriptGenerator = new ToxoidScriptGenerator(providerManager);
  }
  
  if (!scriptValidator) {
    scriptValidator = new ToxoidScriptValidator();
  }
}

interface GenerationResponse {
  success: boolean;
  script?: string;
  metadata?: {
    gameType: string;
    complexity: string;
    features: string[];
    generationTime: number;
    tokensUsed: number;
  };
  validation?: {
    isValid: boolean;
    errors: any[];
    warnings: any[];
    metrics: any;
  };
  error?: string;
  code?: string;
}

/**
 * POST /api/v1/ai/scripts/generate
 * 
 * Generate a new Toxoid-compatible script based on user requirements
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerationResponse>> {
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
    const validationError = validateRequestBody(body);
    if (validationError) {
      return NextResponse.json({
        success: false,
        error: validationError.message,
        code: validationError.code
      }, { status: 400 });
    }

    // Build generation request
    const generationRequest: ScriptGenerationRequest = {
      prompt: body.prompt,
      gameType: body.gameType || 'custom',
      complexity: body.complexity || 'intermediate',
      features: Array.isArray(body.features) ? body.features : [],
      existingCode: body.existingCode || undefined,
      constraints: body.constraints || undefined,
      userId: body.userId || undefined,
      sessionId: body.sessionId || undefined
    };

    // Generate script
    console.log(`[ScriptAPI] Generating script for game type: ${generationRequest.gameType}, complexity: ${generationRequest.complexity}`);
    
    const generatedScript = await scriptGenerator.generateScript(generationRequest);
    
    if (!generatedScript || generatedScript.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Script generation returned empty result',
        code: 'EMPTY_GENERATION'
      }, { status: 500 });
    }

    // Validate generated script if requested
    let validation = null;
    if (body.validateGenerated !== false) { // Default to true
      try {
        validation = await scriptValidator.validateScript({
          script: generatedScript,
          constraints: generationRequest.constraints,
          performanceCheck: body.performanceCheck || false
        });
      } catch (validationError) {
        console.warn('[ScriptAPI] Validation failed, but continuing:', validationError);
        // Continue without validation results
      }
    }

    const generationTime = Date.now() - startTime;

    // Prepare response
    const response: GenerationResponse = {
      success: true,
      script: generatedScript,
      metadata: {
        gameType: generationRequest.gameType,
        complexity: generationRequest.complexity,
        features: generationRequest.features,
        generationTime,
        tokensUsed: 0 // This would be populated from the LLM response
      }
    };

    if (validation) {
      response.validation = validation;
    }

    console.log(`[ScriptAPI] Successfully generated script (${generatedScript.length} chars) in ${generationTime}ms`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ScriptAPI] Generation failed:', error);

    const isRateLimitError = error instanceof Error && error.message.includes('rate limit');
    const isProviderError = error instanceof Error && error.message.includes('provider');
    
    let statusCode = 500;
    let errorCode = 'GENERATION_FAILED';
    let errorMessage = 'Script generation failed';

    if (isRateLimitError) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (isProviderError) {
      statusCode = 503;
      errorCode = 'PROVIDER_UNAVAILABLE';
      errorMessage = 'AI service is temporarily unavailable';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode
    }, { status: statusCode });
  }
}

/**
 * GET /api/v1/ai/scripts/generate
 * 
 * Get available generation options and capabilities
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const capabilities = {
      gameTypes: [
        {
          id: 'bullet_hell',
          name: 'Bullet Hell',
          description: 'Fast-paced shooter with projectile dodging mechanics',
          complexity: ['simple', 'intermediate', 'advanced']
        },
        {
          id: 'rpg',
          name: 'RPG',
          description: 'Role-playing game with character progression',
          complexity: ['intermediate', 'advanced']
        },
        {
          id: 'platformer',
          name: 'Platformer',
          description: '2D platform jumping game with physics',
          complexity: ['simple', 'intermediate', 'advanced']
        },
        {
          id: 'puzzle',
          name: 'Puzzle',
          description: 'Logic-based puzzle solving game',
          complexity: ['simple', 'intermediate', 'advanced']
        },
        {
          id: 'racing',
          name: 'Racing',
          description: 'Vehicle racing with physics simulation',
          complexity: ['intermediate', 'advanced']
        },
        {
          id: 'custom',
          name: 'Custom',
          description: 'Custom game mechanics and systems',
          complexity: ['simple', 'intermediate', 'advanced']
        }
      ],
      complexityLevels: [
        {
          id: 'simple',
          name: 'Simple',
          description: 'Basic mechanics with 1-3 systems',
          estimatedLines: '50-200'
        },
        {
          id: 'intermediate',
          name: 'Intermediate',
          description: 'Multiple systems with interactions',
          estimatedLines: '200-800'
        },
        {
          id: 'advanced',
          name: 'Advanced',
          description: 'Complex systems with AI and advanced features',
          estimatedLines: '800-2000+'
        }
      ],
      availableFeatures: [
        'player_movement',
        'enemy_ai',
        'collision_detection',
        'particle_effects',
        'sound_effects',
        'scoring_system',
        'power_ups',
        'level_progression',
        'save_system',
        'multiplayer',
        'physics_simulation',
        'procedural_generation'
      ],
      constraints: {
        maxMemoryMB: 50,
        maxStackMB: 1,
        maxExecutionTimeMs: 100,
        maxLoops: 10000,
        supportedAPIs: [
          'Toxoid.API.*',
          'Toxoid.System.*',
          'Toxoid.Observer.*',
          'Toxoid.Query.*',
          'console.log',
          'Math.*',
          'Date.*'
        ],
        forbiddenPatterns: [
          'eval(',
          'Function(',
          'setTimeout(',
          'setInterval(',
          'XMLHttpRequest',
          'fetch(',
          'import(',
          'require(',
          'process.',
          'global.',
          'window.',
          'document.'
        ]
      },
      runtimeInfo: {
        targetRuntime: 'QuickJS',
        memoryLimit: '50MB',
        stackLimit: '1MB',
        executionModel: 'Single-threaded event loop'
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
    console.error('[ScriptAPI] Failed to get capabilities:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve generation capabilities',
      code: 'CAPABILITIES_ERROR'
    }, { status: 500 });
  }
}

/**
 * Validate request body for script generation
 */
function validateRequestBody(body: any): { message: string; code: string } | null {
  if (!body.prompt || typeof body.prompt !== 'string') {
    return {
      message: 'Missing or invalid prompt field',
      code: 'MISSING_PROMPT'
    };
  }

  if (body.prompt.length < 10) {
    return {
      message: 'Prompt must be at least 10 characters long',
      code: 'PROMPT_TOO_SHORT'
    };
  }

  if (body.prompt.length > 5000) {
    return {
      message: 'Prompt must be less than 5000 characters',
      code: 'PROMPT_TOO_LONG'
    };
  }

  const validGameTypes = ['bullet_hell', 'rpg', 'platformer', 'puzzle', 'racing', 'custom'];
  if (body.gameType && !validGameTypes.includes(body.gameType)) {
    return {
      message: `Invalid game type. Must be one of: ${validGameTypes.join(', ')}`,
      code: 'INVALID_GAME_TYPE'
    };
  }

  const validComplexity = ['simple', 'intermediate', 'advanced'];
  if (body.complexity && !validComplexity.includes(body.complexity)) {
    return {
      message: `Invalid complexity level. Must be one of: ${validComplexity.join(', ')}`,
      code: 'INVALID_COMPLEXITY'
    };
  }

  if (body.features && !Array.isArray(body.features)) {
    return {
      message: 'Features must be an array',
      code: 'INVALID_FEATURES'
    };
  }

  if (body.existingCode && typeof body.existingCode !== 'string') {
    return {
      message: 'Existing code must be a string',
      code: 'INVALID_EXISTING_CODE'
    };
  }

  if (body.existingCode && body.existingCode.length > 50000) {
    return {
      message: 'Existing code must be less than 50KB',
      code: 'EXISTING_CODE_TOO_LARGE'
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}