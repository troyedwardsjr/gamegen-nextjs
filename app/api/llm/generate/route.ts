/**
 * LLM Generation API Endpoint
 *
 * RESTful API endpoint for LLM text generation with streaming support,
 * authentication, rate limiting, and comprehensive error handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { ProviderManager } from "@/lib/llm/providers/manager";
import { ClaudeProvider } from "@/lib/llm/providers/claude";
import { LLMConfigManager } from "@/lib/llm/config";
import { BillingTracker } from "@/lib/llm/billing/tracker";
import { LLMLogger } from "@/lib/llm/monitoring/logger";
import {
  GenerationRequest,
  GenerationResponse,
  LLMError,
  RateLimitError,
  CircuitBreakerError,
  InsufficientCreditsError,
} from "@/lib/llm/types";

// Configuration that can be safely initialized at module level
const configManager = LLMConfigManager.fromEnvironment();

// Function to initialize components that require request context
function initializeComponents() {
  const providerManager = new ProviderManager({
    default_provider: "claude",
    fallback_chain: ["claude"],
    load_balancing: { type: "round_robin" },
    health_check_interval: 30000,
    failover_enabled: true,
    max_concurrent_requests: 10,
  });

  const billingTracker = new BillingTracker({
    enabled: true,
    credit_system_enabled: true,
    auto_deduct_credits: true,
    minimum_balance: 1.0,
    low_balance_threshold: 5.0,
    billing_cycle: "monthly",
    cost_per_token: {
      claude: { input: 3.0, output: 15.0 }, // Per million tokens
    },
    user_tier_discounts: {
      free: 0,
      pro: 0.1,
      enterprise: 0.2,
    },
    free_tier_limits: {
      monthly_tokens: 100000,
      monthly_requests: 1000,
    },
  });

  const logger = new LLMLogger({
    enabled: true,
    log_requests: true,
    log_responses: true,
    log_errors: true,
    log_performance: true,
    sensitive_data_masking: true,
    retention_days: 30,
    max_payload_size: 10000,
    async_logging: true,
    buffer_size: 100,
    flush_interval: 60000,
  });

  // Register Claude provider
  const claudeConfig = configManager.getProviderConfig("claude");

  if (claudeConfig && process.env.ANTHROPIC_API_KEY) {
    const claudeProvider = new ClaudeProvider({
      api_key: process.env.ANTHROPIC_API_KEY!,
      endpoint: "https://api.anthropic.com",
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      rate_limit: {
        requests_per_minute: 100,
        tokens_per_minute: 100000,
      },
      health_check_interval: 60000,
      timeout: 30000,
      retry_attempts: 3,
    });

    providerManager.registerProvider(claudeProvider);
  }

  return { providerManager, billingTracker, logger };
}

/**
 * POST /api/llm/generate
 * Generate text using LLM providers
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let generationRequest: GenerationRequest | undefined;
  let reservationId: string | undefined;

  // Initialize components within request context
  const { providerManager, billingTracker, logger } = initializeComponents();

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    userId = user.id;

    // Parse request body
    try {
      generationRequest = (await request.json()) as GenerationRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Validate request
    const validationError = validateGenerationRequest(generationRequest);

    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Add user context
    generationRequest.user_id = userId;
    generationRequest.session_id =
      request.headers.get("x-session-id") || undefined;

    // Estimate token usage for billing
    const estimatedTokens = estimateTokenUsage(generationRequest);

    // Check credits and reserve them
    const hasCredits = await billingTracker.checkCredits(
      userId,
      estimatedTokens,
      "claude",
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

    // Reserve credits for the request
    reservationId = await billingTracker.reserveCredits(
      userId,
      estimatedTokens,
      "claude",
    );

    // Handle streaming vs non-streaming
    if (generationRequest.stream) {
      return handleStreamingRequest(generationRequest, userId, reservationId, {
        providerManager,
        billingTracker,
        logger,
      });
    } else {
      return handleRegularRequest(generationRequest, userId, reservationId, {
        providerManager,
        billingTracker,
        logger,
      });
    }
  } catch (error) {
    // Log error
    if (userId && generationRequest) {
      await logger.logRequest(
        generationRequest,
        undefined,
        error instanceof LLMError
          ? error
          : new LLMError(
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
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 429 },
      );
    }

    if (error instanceof CircuitBreakerError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 503 },
      );
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 402 },
      );
    }

    if (error instanceof LLMError) {
      const statusCode = getStatusCodeForError(error.code);

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode },
      );
    }

    // Generic error
    console.error("[LLM API] Unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * Handle regular (non-streaming) generation request
 */
async function handleRegularRequest(
  request: GenerationRequest,
  userId: string,
  reservationId: string,
  components: { providerManager: any; billingTracker: any; logger: any },
): Promise<Response> {
  const { providerManager, billingTracker, logger } = components;

  try {
    // Generate response
    const response = await providerManager.generate(request);

    // Record usage and billing
    await billingTracker.recordUsage(
      userId,
      response,
      "generation",
      reservationId,
    );

    // Log request/response
    await logger.logRequest(
      request,
      response,
      undefined,
      response.provider_id,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: response,
      usage: response.usage,
      cost: 0, // Would be calculated in billing tracker
    });
  } catch (error) {
    // Release reservation
    await billingTracker.releaseReservation(userId, reservationId);

    throw error;
  }
}

/**
 * Handle streaming generation request
 */
async function handleStreamingRequest(
  request: GenerationRequest,
  userId: string,
  reservationId: string,
  components: { providerManager: any; billingTracker: any; logger: any },
): Promise<Response> {
  const { providerManager, billingTracker, logger } = components;
  const encoder = new TextEncoder();
  let totalTokens = 0;
  let responseContent = "";
  let responseId = "";
  let providerId = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await providerManager.generateStream(request, (chunk: any) => {
          // Track streaming data
          if (chunk.type === "content_block_delta" && chunk.delta?.text) {
            responseContent += chunk.delta.text;
            totalTokens += estimateTokensFromText(chunk.delta.text);
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.total_tokens;
          }

          // Send chunk to client
          const data = JSON.stringify({
            type: chunk.type,
            delta: chunk.delta,
            usage: chunk.usage,
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        });

        // Stream completed successfully
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // Create response object for logging/billing
        const mockResponse: GenerationResponse = {
          id: generateId(),
          content: responseContent,
          usage: {
            prompt_tokens: estimateTokenUsage(request),
            completion_tokens: totalTokens,
            total_tokens: estimateTokenUsage(request) + totalTokens,
          },
          model: "claude-3-5-sonnet-20241022",
          finish_reason: "stop",
          provider_id: "claude",
          response_time:
            Date.now() - parseInt(request.metadata?.start_time || "0"),
          created_at: new Date(),
        };

        // Record usage and billing
        await billingTracker.recordUsage(
          userId,
          mockResponse,
          "streaming",
          reservationId,
        );

        // Log request/response
        await logger.logRequest(
          request,
          mockResponse,
          undefined,
          "claude",
          userId,
        );
      } catch (error) {
        // Release reservation on error
        await billingTracker.releaseReservation(userId, reservationId);

        // Send error to client
        const errorData = JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          code: (error as any).code || "STREAMING_ERROR",
        });

        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();

        // Log error
        await logger.logRequest(
          request,
          undefined,
          error instanceof LLMError
            ? error
            : new LLMError(
                error instanceof Error ? error.message : "Unknown error",
                "STREAMING_ERROR",
              ),
          "claude",
          userId,
        );
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Validate generation request
 */
function validateGenerationRequest(request: any): string | null {
  if (!request || typeof request !== "object") {
    return "Request must be an object";
  }

  if (!request.messages || !Array.isArray(request.messages)) {
    return "messages field is required and must be an array";
  }

  if (request.messages.length === 0) {
    return "At least one message is required";
  }

  for (const message of request.messages) {
    if (!message.role || !message.content) {
      return "Each message must have role and content";
    }

    if (!["user", "assistant", "system"].includes(message.role)) {
      return "Message role must be user, assistant, or system";
    }
  }

  if (
    request.max_tokens &&
    (request.max_tokens < 1 || request.max_tokens > 8000)
  ) {
    return "max_tokens must be between 1 and 8000";
  }

  if (
    request.temperature &&
    (request.temperature < 0 || request.temperature > 2)
  ) {
    return "temperature must be between 0 and 2";
  }

  return null;
}

/**
 * Estimate token usage from request
 */
function estimateTokenUsage(request: GenerationRequest): number {
  const messagesText = request.messages
    .map((msg) => (typeof msg.content === "string" ? msg.content : ""))
    .join(" ");

  const systemPromptText = request.system_prompt || "";
  const totalText = messagesText + systemPromptText;

  // Rough approximation: ~4 characters per token
  return Math.ceil(totalText.length / 4);
}

/**
 * Estimate tokens from text
 */
function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get appropriate HTTP status code for error
 */
function getStatusCodeForError(code: string): number {
  switch (code) {
    case "AUTHENTICATION_FAILED":
    case "UNAUTHORIZED":
      return 401;
    case "INSUFFICIENT_CREDITS":
      return 402;
    case "RATE_LIMIT_EXCEEDED":
      return 429;
    case "INVALID_REQUEST":
    case "CONTENT_FILTERED":
      return 400;
    case "PROVIDER_NOT_FOUND":
    case "NO_PROVIDERS_AVAILABLE":
      return 404;
    case "CIRCUIT_BREAKER_OPEN":
    case "SERVICE_OVERLOADED":
      return 503;
    case "TIMEOUT":
      return 408;
    case "SERVER_ERROR":
    case "PROVIDER_ERROR":
    default:
      return 500;
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * GET /api/llm/generate
 * Get provider status and configuration
 */
export async function GET(): Promise<Response> {
  try {
    // Initialize components within request context
    const { providerManager } = initializeComponents();

    const providerStatus = await providerManager.getAllProviderStatus();
    const configSummary = configManager.getConfigSummary();

    return NextResponse.json({
      success: true,
      data: {
        providers: providerStatus,
        config: configSummary,
        health_check: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status", code: "STATUS_ERROR" },
      { status: 500 },
    );
  }
}
