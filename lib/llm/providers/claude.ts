/**
 * Claude Provider Implementation
 *
 * Anthropic Claude provider implementation with streaming support,
 * function calling, and optimized for GameGen's game creation tasks.
 */

import Anthropic from "@anthropic-ai/sdk";

import {
  LLMCapability,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  StreamCallback,
  StreamChunk,
  LLMError,
  RateLimitError,
  LLMMessage,
  LLMContentBlock,
  TokenUsage,
  ToolCall,
} from "../types";

import { BaseProvider } from "./base";

export interface ClaudeConfig extends ProviderConfig {
  model:
    | "claude-3-5-sonnet-20241022"
    | "claude-3-haiku-20240307"
    | "claude-3-opus-20240229";
  beta_features?: string[];
}

export class ClaudeProvider extends BaseProvider {
  readonly id = "claude";
  readonly name = "Anthropic Claude";
  readonly capabilities = [
    LLMCapability.TEXT_GENERATION,
    LLMCapability.CODE_GENERATION,
    LLMCapability.FUNCTION_CALLING,
    LLMCapability.STREAMING,
  ];

  private anthropic: Anthropic;
  private readonly rateLimitCodes = [429, 529];

  constructor(config: ClaudeConfig) {
    super(config);

    this.anthropic = new Anthropic({
      apiKey: config.api_key,
      timeout: config.timeout,
      maxRetries: 0, // We handle retries in base class
    });

    this.log("info", "Claude provider initialized", { model: config.model });
  }

  /**
   * Internal generation implementation
   */
  protected async _generateInternal(
    request: GenerationRequest,
  ): Promise<GenerationResponse> {
    const startTime = Date.now();

    try {
      // Format messages for Claude API
      const messages = this.formatClaudeMessages(request.messages);

      // Prepare API request
      const apiRequest: Anthropic.MessageCreateParamsNonStreaming = {
        model: this._config.model as any,
        max_tokens: request.max_tokens || this._config.max_tokens,
        temperature: request.temperature ?? this._config.temperature,
        messages,
        system: request.system_prompt,
        tools: this.formatClaudeTools(request.tools),
        tool_choice: request.tool_choice as any,
      };

      // Remove undefined fields
      Object.keys(apiRequest).forEach((key) => {
        if (apiRequest[key as keyof typeof apiRequest] === undefined) {
          delete apiRequest[key as keyof typeof apiRequest];
        }
      });

      // Make API call
      const response = await this.anthropic.messages.create(apiRequest);

      // Parse response
      const parsedResponse = this.parseClaudeResponse(response, startTime);

      this.log("info", "Generation completed successfully", {
        tokens: parsedResponse.usage.total_tokens,
        responseTime: parsedResponse.response_time,
      });

      return parsedResponse;
    } catch (error) {
      this.handleClaudeError(error);
    }
  }

  /**
   * Internal streaming generation implementation
   */
  protected async _generateStreamInternal(
    request: GenerationRequest,
    callback: StreamCallback,
  ): Promise<void> {
    try {
      // Format messages for Claude API
      const messages = this.formatClaudeMessages(request.messages);

      // Prepare streaming API request
      const apiRequest: Anthropic.MessageCreateParamsStreaming = {
        model: this._config.model as any,
        max_tokens: request.max_tokens || this._config.max_tokens,
        temperature: request.temperature ?? this._config.temperature,
        messages,
        system: request.system_prompt,
        tools: this.formatClaudeTools(request.tools),
        tool_choice: request.tool_choice as any,
        stream: true,
      };

      // Remove undefined fields
      Object.keys(apiRequest).forEach((key) => {
        if (apiRequest[key as keyof typeof apiRequest] === undefined) {
          delete apiRequest[key as keyof typeof apiRequest];
        }
      });

      // Create stream
      const stream = await this.anthropic.messages.create(apiRequest);

      // Process stream chunks
      for await (const chunk of stream) {
        const streamChunk = this.parseClaudeStreamChunk(chunk);

        if (streamChunk) {
          callback(streamChunk);
        }
      }

      this.log("info", "Streaming generation completed successfully");
    } catch (error) {
      this.handleClaudeError(error);
    }
  }

  /**
   * Health check implementation
   */
  protected async _healthCheckInternal(): Promise<boolean> {
    try {
      // Simple health check with minimal token usage
      const response = await this.anthropic.messages.create({
        model: this._config.model as any,
        max_tokens: 10,
        messages: [{ role: "user", content: "Health check" }],
      });

      return response.content.length > 0;
    } catch (error) {
      this.log("warn", "Health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return false;
    }
  }

  /**
   * Format messages for Claude API
   */
  private formatClaudeMessages(
    messages: LLMMessage[],
  ): Anthropic.MessageParam[] {
    return messages
      .filter((msg) => msg.role !== "system") // System messages handled separately
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: this.formatClaudeContent(msg.content),
      }));
  }

  /**
   * Format content for Claude API
   */
  private formatClaudeContent(
    content: string | LLMContentBlock[],
  ): string | any[] {
    if (typeof content === "string") {
      return content;
    }

    return content.map((block) => {
      if (block.type === "text") {
        return {
          type: "text" as const,
          text: block.text!,
        };
      } else if (block.type === "image") {
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: block.image!.source.media_type as any,
            data: block.image!.source.data,
          },
        };
      }

      throw new LLMError(
        "Unsupported content block type",
        "INVALID_CONTENT",
        this.id,
      );
    });
  }

  /**
   * Format tools for Claude API
   */
  private formatClaudeTools(tools?: any[]): Anthropic.Tool[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }

    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  /**
   * Parse Claude API response
   */
  private parseClaudeResponse(
    response: Anthropic.Message,
    startTime: number,
  ): GenerationResponse {
    // Extract text content
    const textBlocks = response.content.filter(
      (block) => block.type === "text",
    );
    const content = textBlocks.map((block) => (block as any).text).join("");

    // Extract tool calls
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use",
    );
    const toolCalls: ToolCall[] = toolUseBlocks.map((block) => ({
      id: (block as any).id,
      name: (block as any).name,
      input: (block as any).input,
    }));

    // Map finish reason
    const finishReason = this.mapClaudeStopReason(response.stop_reason);

    return {
      id: response.id,
      content,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens:
          response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      finish_reason: finishReason,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      provider_id: this.id,
      response_time: Date.now() - startTime,
      created_at: new Date(),
    };
  }

  /**
   * Parse Claude streaming chunk
   */
  private parseClaudeStreamChunk(chunk: any): StreamChunk | null {
    switch (chunk.type) {
      case "content_block_delta":
        if (chunk.delta?.type === "text_delta") {
          return {
            type: "content_block_delta",
            delta: {
              type: "text_delta",
              text: chunk.delta.text,
            },
          };
        }
        break;

      case "message_delta":
        return {
          type: "message_delta",
        };

      case "message_stop":
        return {
          type: "message_stop",
          usage: chunk.usage
            ? {
                prompt_tokens: chunk.usage.input_tokens,
                completion_tokens: chunk.usage.output_tokens,
                total_tokens:
                  chunk.usage.input_tokens + chunk.usage.output_tokens,
              }
            : undefined,
        };
    }

    return null;
  }

  /**
   * Map Claude stop reason to standard format
   */
  private mapClaudeStopReason(
    reason: string | null,
  ): GenerationResponse["finish_reason"] {
    switch (reason) {
      case "end_turn":
      case "stop_sequence":
        return "stop";
      case "max_tokens":
        return "max_tokens";
      case "tool_use":
        return "tool_use";
      default:
        return "stop";
    }
  }

  /**
   * Handle Claude-specific errors
   */
  private handleClaudeError(error: any): never {
    // Handle rate limiting
    if (error.status && this.rateLimitCodes.includes(error.status)) {
      // Extract reset time from headers if available
      const resetTime = error.headers?.["x-ratelimit-reset"]
        ? new Date(parseInt(error.headers["x-ratelimit-reset"]) * 1000)
        : undefined;

      throw new RateLimitError(this.id, resetTime);
    }

    // Handle authentication errors
    if (error.status === 401) {
      throw new LLMError(
        "Invalid API key for Claude provider",
        "AUTHENTICATION_FAILED",
        this.id,
        false,
      );
    }

    // Handle quota exceeded
    if (error.status === 429 && error.error?.type === "rate_limit_error") {
      throw new LLMError(
        "Claude API quota exceeded",
        "QUOTA_EXCEEDED",
        this.id,
        true,
      );
    }

    // Handle overloaded errors
    if (error.status === 529) {
      throw new LLMError(
        "Claude API is overloaded, please try again",
        "SERVICE_OVERLOADED",
        this.id,
        true,
      );
    }

    // Handle content filter errors
    if (error.status === 400 && error.error?.type === "invalid_request_error") {
      const errorMessage = error.error?.message || "Invalid request";

      // Check for content policy violations
      if (errorMessage.includes("content") || errorMessage.includes("policy")) {
        throw new LLMError(
          "Content blocked by Claude content policy",
          "CONTENT_FILTERED",
          this.id,
          false,
        );
      }

      throw new LLMError(
        `Claude API request error: ${errorMessage}`,
        "INVALID_REQUEST",
        this.id,
        false,
      );
    }

    // Handle server errors
    if (error.status >= 500) {
      throw new LLMError(
        `Claude API server error: ${error.message}`,
        "SERVER_ERROR",
        this.id,
        true,
      );
    }

    // Handle network/timeout errors
    if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
      throw new LLMError(
        `Network error connecting to Claude API: ${error.message}`,
        "NETWORK_ERROR",
        this.id,
        true,
      );
    }

    // Generic error handling
    throw new LLMError(
      `Claude provider error: ${error.message}`,
      "PROVIDER_ERROR",
      this.id,
      this.shouldFallback(error),
    );
  }

  /**
   * Get provider-specific headers
   */
  protected getHeaders(): Record<string, string> {
    const headers = super.getHeaders();

    // Add Claude-specific headers
    headers["anthropic-version"] = "2023-06-01";

    // Add beta features if configured
    const claudeConfig = this._config as ClaudeConfig;

    if (claudeConfig.beta_features && claudeConfig.beta_features.length > 0) {
      headers["anthropic-beta"] = claudeConfig.beta_features.join(",");
    }

    return headers;
  }

  /**
   * Estimate token count for billing (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get model pricing information
   */
  getModelPricing(): { input: number; output: number } {
    // Pricing per million tokens (as of design document date)
    const pricing = {
      "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
      "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
      "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
    };

    return (
      pricing[this._config.model as keyof typeof pricing] ||
      pricing["claude-3-5-sonnet-20241022"]
    );
  }

  /**
   * Calculate request cost
   */
  calculateCost(usage: TokenUsage): number {
    const pricing = this.getModelPricing();

    const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }
}
