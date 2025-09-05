/**
 * Toxoid Script Validation API Route
 * 
 * NextJS API endpoint for validating Toxoid-compatible JavaScript scripts.
 * Provides comprehensive validation including syntax checking, API compliance,
 * security analysis, performance metrics, and optimization suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ToxoidScriptValidator } from '@/lib/toxoid/script-validator';
import { ToxoidScriptSecurity } from '@/lib/toxoid/script-security';
import { ScriptValidationRequest, ScriptValidationResult } from '@/types/toxoid';

// Initialize services
let scriptValidator: ToxoidScriptValidator;
let scriptSecurity: ToxoidScriptSecurity;

async function initializeServices() {
  if (!scriptValidator) {
    scriptValidator = new ToxoidScriptValidator();
  }
  
  if (!scriptSecurity) {
    scriptSecurity = new ToxoidScriptSecurity();
  }
}

interface ValidationResponse {
  success: boolean;
  result?: {
    isValid: boolean;
    errors: any[];
    warnings: any[];
    metrics: any;
    suggestions: string[];
    security?: {
      passed: boolean;
      issues: any[];
      riskScore: number;
    };
    compatibility?: {
      compatible: boolean;
      issues: string[];
      recommendations: string[];
    };
  };
  metadata?: {
    validationTime: number;
    scriptLength: number;
    checksPerformed: string[];
  };
  error?: string;
  code?: string;
}

/**
 * POST /api/v1/ai/scripts/validate
 * 
 * Validate a Toxoid-compatible script
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidationResponse>> {
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

    // Build validation request
    const validationRequest: ScriptValidationRequest = {
      script: body.script,
      constraints: body.constraints || undefined,
      performanceCheck: body.performanceCheck !== false // Default to true
    };

    console.log(`[ValidationAPI] Validating script (${body.script.length} chars)`);

    // Perform primary validation
    const validationResult = await scriptValidator.validateScript(validationRequest);

    const checksPerformed = ['syntax', 'toxoid_api', 'best_practices'];
    let securityResult = null;
    let compatibilityResult = null;

    // Perform security scan if requested
    if (body.securityCheck !== false) { // Default to true
      try {
        securityResult = await scriptSecurity.scanScript(body.script, validationRequest.constraints);
        checksPerformed.push('security');
      } catch (securityError) {
        console.warn('[ValidationAPI] Security scan failed:', securityError);
        // Continue without security results
      }
    }

    // Perform sandbox compatibility check if requested
    if (body.compatibilityCheck === true) { // Default to false
      try {
        compatibilityResult = scriptSecurity.validateSandboxCompatibility(body.script);
        checksPerformed.push('compatibility');
      } catch (compatibilityError) {
        console.warn('[ValidationAPI] Compatibility check failed:', compatibilityError);
        // Continue without compatibility results
      }
    }

    const validationTime = Date.now() - startTime;

    // Prepare response
    const response: ValidationResponse = {
      success: true,
      result: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        metrics: validationResult.metrics,
        suggestions: validationResult.suggestions
      },
      metadata: {
        validationTime,
        scriptLength: body.script.length,
        checksPerformed
      }
    };

    // Add security results if available
    if (securityResult) {
      response.result!.security = securityResult;
    }

    // Add compatibility results if available
    if (compatibilityResult) {
      response.result!.compatibility = compatibilityResult;
    }

    // Determine overall validation status
    const hasSecurityIssues = securityResult && !securityResult.passed;
    const hasCompatibilityIssues = compatibilityResult && !compatibilityResult.compatible;
    
    if (hasSecurityIssues || hasCompatibilityIssues) {
      response.result!.isValid = false;
    }

    console.log(`[ValidationAPI] Validation completed in ${validationTime}ms - Valid: ${response.result!.isValid}`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ValidationAPI] Validation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Script validation failed';

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: 'VALIDATION_FAILED'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/ai/scripts/validate
 * 
 * Get validation capabilities and configuration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const capabilities = {
      validationChecks: [
        {
          id: 'syntax',
          name: 'Syntax Validation',
          description: 'JavaScript syntax and parsing validation',
          enabled: true,
          configurable: false
        },
        {
          id: 'toxoid_api',
          name: 'Toxoid API Compliance',
          description: 'Validates proper usage of Toxoid ECS APIs',
          enabled: true,
          configurable: false
        },
        {
          id: 'security',
          name: 'Security Analysis',
          description: 'Detects potentially malicious code patterns',
          enabled: true,
          configurable: true
        },
        {
          id: 'performance',
          name: 'Performance Analysis',
          description: 'Analyzes performance characteristics and bottlenecks',
          enabled: true,
          configurable: true
        },
        {
          id: 'best_practices',
          name: 'Best Practices',
          description: 'Checks adherence to ECS and game development best practices',
          enabled: true,
          configurable: false
        },
        {
          id: 'compatibility',
          name: 'QuickJS Compatibility',
          description: 'Validates compatibility with QuickJS runtime',
          enabled: false,
          configurable: true
        }
      ],
      securityChecks: [
        'Code injection detection',
        'XSS prevention',
        'Prototype pollution',
        'Resource access control',
        'Network request prevention',
        'File system access',
        'Global object access',
        'Infinite loop detection',
        'Memory exhaustion',
        'Denial of service patterns'
      ],
      performanceMetrics: [
        {
          metric: 'estimatedMemoryUsage',
          description: 'Estimated memory usage in bytes',
          unit: 'bytes'
        },
        {
          metric: 'cyclomaticComplexity',
          description: 'Code complexity score',
          unit: 'score'
        },
        {
          metric: 'apiUsageCount',
          description: 'Count of Toxoid API calls by type',
          unit: 'count'
        },
        {
          metric: 'performanceScore',
          description: 'Overall performance score (0-100)',
          unit: 'score'
        },
        {
          metric: 'securityScore',
          description: 'Security assessment score (0-100)',
          unit: 'score'
        },
        {
          metric: 'maintainabilityScore',
          description: 'Code maintainability score (0-100)',
          unit: 'score'
        }
      ],
      constraints: {
        default: {
          maxMemoryMB: 50,
          maxStackMB: 1,
          maxExecutionTime: 100,
          maxLoops: 10000,
          allowedAPIs: [
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
        limits: {
          maxScriptSize: '1MB',
          maxValidationTime: '30s',
          maxComplexity: 50
        }
      },
      supportedFormats: [
        'JavaScript (ES2020)',
        'Toxoid ECS scripts',
        'QuickJS compatible code'
      ]
    };

    return NextResponse.json(capabilities, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ValidationAPI] Failed to get capabilities:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve validation capabilities',
      code: 'CAPABILITIES_ERROR'
    }, { status: 500 });
  }
}

/**
 * PUT /api/v1/ai/scripts/validate
 * 
 * Batch validate multiple scripts
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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

    if (!Array.isArray(body.scripts)) {
      return NextResponse.json({
        success: false,
        error: 'Scripts must be an array',
        code: 'INVALID_SCRIPTS_ARRAY'
      }, { status: 400 });
    }

    if (body.scripts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one script must be provided',
        code: 'EMPTY_SCRIPTS_ARRAY'
      }, { status: 400 });
    }

    if (body.scripts.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 10 scripts can be validated in batch',
        code: 'TOO_MANY_SCRIPTS'
      }, { status: 400 });
    }

    console.log(`[ValidationAPI] Batch validating ${body.scripts.length} scripts`);

    const results = [];
    const errors = [];

    for (let i = 0; i < body.scripts.length; i++) {
      const scriptData = body.scripts[i];
      
      try {
        if (!scriptData.script || typeof scriptData.script !== 'string') {
          errors.push({
            index: i,
            error: 'Missing or invalid script content',
            code: 'INVALID_SCRIPT_CONTENT'
          });
          continue;
        }

        const validationRequest: ScriptValidationRequest = {
          script: scriptData.script,
          constraints: scriptData.constraints || body.constraints,
          performanceCheck: scriptData.performanceCheck !== false
        };

        const validationResult = await scriptValidator.validateScript(validationRequest);
        
        results.push({
          index: i,
          id: scriptData.id || `script_${i}`,
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          metrics: validationResult.metrics,
          suggestions: validationResult.suggestions
        });

      } catch (scriptError) {
        console.error(`[ValidationAPI] Script ${i} validation failed:`, scriptError);
        errors.push({
          index: i,
          error: scriptError instanceof Error ? scriptError.message : 'Validation failed',
          code: 'SCRIPT_VALIDATION_ERROR'
        });
      }
    }

    const validationTime = Date.now() - startTime;
    const successCount = results.length;
    const errorCount = errors.length;

    console.log(`[ValidationAPI] Batch validation completed: ${successCount} success, ${errorCount} errors in ${validationTime}ms`);

    return NextResponse.json({
      success: true,
      results,
      errors,
      metadata: {
        totalScripts: body.scripts.length,
        successCount,
        errorCount,
        validationTime
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ValidationAPI] Batch validation failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch validation failed',
      code: 'BATCH_VALIDATION_FAILED'
    }, { status: 500 });
  }
}

/**
 * Validate request body for script validation
 */
function validateRequestBody(body: any): { message: string; code: string } | null {
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

  // Validate constraints if provided
  if (body.constraints) {
    if (typeof body.constraints !== 'object') {
      return {
        message: 'Constraints must be an object',
        code: 'INVALID_CONSTRAINTS'
      };
    }

    if (body.constraints.maxMemoryMB && 
        (typeof body.constraints.maxMemoryMB !== 'number' || body.constraints.maxMemoryMB <= 0)) {
      return {
        message: 'maxMemoryMB must be a positive number',
        code: 'INVALID_MEMORY_CONSTRAINT'
      };
    }

    if (body.constraints.allowedAPIs && !Array.isArray(body.constraints.allowedAPIs)) {
      return {
        message: 'allowedAPIs must be an array',
        code: 'INVALID_ALLOWED_APIS'
      };
    }

    if (body.constraints.forbiddenPatterns && !Array.isArray(body.constraints.forbiddenPatterns)) {
      return {
        message: 'forbiddenPatterns must be an array',
        code: 'INVALID_FORBIDDEN_PATTERNS'
      };
    }
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}