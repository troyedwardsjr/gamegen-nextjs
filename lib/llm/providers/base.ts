/**
 * Base LLM Provider Abstract Class
 *
 * Abstract base class for all LLM providers, implementing common functionality
 * including health checking, metrics tracking, error handling, and configuration
 * management.
 */

import pRetry from "p-retry";

import {
  LLMProvider,
  LLMCapability,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  ProviderMetrics,
  ProviderHealthStatus,
  StreamCallback,
  LLMError,
  TokenUsage,
} from "../types";

export abstract class BaseProvider implements LLMProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: LLMCapability[];

  protected _config: ProviderConfig;
  protected _metrics: ProviderMetrics;
  protected _lastHealthCheck: Date = new Date();
  protected _healthStatus: ProviderHealthStatus = ProviderHealthStatus.HEALTHY;

  constructor(config: ProviderConfig) {
    this._config = config;
    this._metrics = this.initializeMetrics();
  }

  get config(): ProviderConfig {
    return { ...this._config };
  }

  // Abstract methods that must be implemented by concrete providers
  protected abstract _generateInternal(
    request: GenerationRequest,
  ): Promise<GenerationResponse>;
  protected abstract _generateStreamInternal(
    request: GenerationRequest,
    callback: StreamCallback,
  ): Promise<void>;
  protected abstract _healthCheckInternal(): Promise<boolean>;

  /**
   * Generate text with retry logic and error handling
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateRequest(request);

      // Apply retry logic with exponential backoff
      const response = await pRetry(
        async () => {
          try {
            return await this._generateInternal(request);
          } catch (error) {
            // Check if error is retryable
            if (error instanceof LLMError && !error.retryable) {
              // Don't retry for non-retryable errors
              throw new pRetry.AbortError(error.message);
            }
            throw error;
          }
        },
        {
          retries: this._config.retry_attempts,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
          onFailedAttempt: (error) => {
            console.warn(
              `Attempt ${error.attemptNumber} failed for ${this.id}:`,
              error.message,
            );
          },
        },
      );

      // Update metrics on success
      const responseTime = Date.now() - startTime;

      this.updateMetrics(true, responseTime, response.usage);

      return response;
    } catch (error) {
      // Update metrics on failure
      const responseTime = Date.now() - startTime;

      this.updateMetrics(false, responseTime);

      // Wrap unknown errors in LLMError
      if (!(error instanceof LLMError)) {
        throw new LLMError(
          `Provider ${this.id} generation failed: ${error.message}`,
          "GENERATION_FAILED",
          this.id,
          true,
        );
      }

      throw error;
    }
  }

  /**
   * Generate streaming text with error handling
   */
  async generateStream(
    request: GenerationRequest,
    callback: StreamCallback,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateRequest(request);

      // Ensure provider supports streaming
      if (!this.capabilities.includes(LLMCapability.STREAMING)) {
        throw new LLMError(
          `Provider ${this.id} does not support streaming`,
          "STREAMING_NOT_SUPPORTED",
          this.id,
          false,
        );
      }

      await this._generateStreamInternal(request, callback);

      // Update metrics on success (approximate usage for streaming)
      const responseTime = Date.now() - startTime;

      this.updateMetrics(true, responseTime);
    } catch (error) {
      // Update metrics on failure
      const responseTime = Date.now() - startTime;

      this.updateMetrics(false, responseTime);

      if (!(error instanceof LLMError)) {
        throw new LLMError(
          `Provider ${this.id} streaming failed: ${error.message}`,
          "STREAMING_FAILED",
          this.id,
          true,
        );
      }

      throw error;
    }
  }

  /**
   * Perform health check with caching
   */
  async healthCheck(): Promise<boolean> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this._lastHealthCheck.getTime();

    // Use cached result if within interval
    if (timeSinceLastCheck < this._config.health_check_interval) {
      return this._healthStatus === ProviderHealthStatus.HEALTHY;
    }

    try {
      const isHealthy = await Promise.race([
        this._healthCheckInternal(),
        new Promise<boolean>((_, reject) =>
          setTimeout(
            () => reject(new Error("Health check timeout")),
            this._config.timeout,
          ),
        ),
      ]);

      this._healthStatus = isHealthy
        ? ProviderHealthStatus.HEALTHY
        : ProviderHealthStatus.UNHEALTHY;
      this._lastHealthCheck = now;

      return isHealthy;
    } catch (error) {
      this._healthStatus = ProviderHealthStatus.OFFLINE;
      this._lastHealthCheck = now;

      console.warn(`Health check failed for ${this.id}:`, error.message);

      return false;
    }
  }

  /**
   * Get current provider metrics
   */
  async getMetrics(): Promise<ProviderMetrics> {
    return {
      ...this._metrics,
      health_status: this._healthStatus,
      average_response_time:
        this._metrics.total_requests > 0
          ? this._metrics.total_requests / this._metrics.total_requests
          : 0,
    };
  }

  /**
   * Update provider configuration
   */
  async updateConfig(config: Partial<ProviderConfig>): Promise<void> {
    this._config = { ...this._config, ...config };

    // Reset health check to force re-check with new config
    this._lastHealthCheck = new Date(0);

    console.info(`Configuration updated for provider ${this.id}`);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Base implementation - override if provider needs specific cleanup
    console.info(`Provider ${this.id} destroyed`);
  }

  /**
   * Validate generation request
   */
  protected validateRequest(request: GenerationRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new LLMError(
        "Generation request must include at least one message",
        "INVALID_REQUEST",
        this.id,
        false,
      );
    }

    // Validate max_tokens if specified
    if (request.max_tokens && request.max_tokens > this._config.max_tokens) {
      throw new LLMError(
        `Requested max_tokens (${request.max_tokens}) exceeds provider limit (${this._config.max_tokens})`,
        "INVALID_REQUEST",
        this.id,
        false,
      );
    }

    // Validate temperature range
    if (
      request.temperature &&
      (request.temperature < 0 || request.temperature > 2)
    ) {
      throw new LLMError(
        `Temperature must be between 0 and 2, got ${request.temperature}`,
        "INVALID_REQUEST",
        this.id,
        false,
      );
    }

    // Validate tools if function calling is requested
    if (
      request.tools &&
      !this.capabilities.includes(LLMCapability.FUNCTION_CALLING)
    ) {
      throw new LLMError(
        `Provider ${this.id} does not support function calling`,
        "FUNCTION_CALLING_NOT_SUPPORTED",
        this.id,
        false,
      );
    }
  }

  /**
   * Initialize metrics object
   */
  protected initializeMetrics(): ProviderMetrics {
    return {
      provider_id: this.id,
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
      total_tokens_used: 0,
      health_status: ProviderHealthStatus.HEALTHY,
      last_used: new Date(),
      cost_per_token: 0,
    };
  }

  /**
   * Update provider metrics
   */
  protected updateMetrics(
    success: boolean,
    responseTime: number,
    usage?: TokenUsage,
  ): void {
    this._metrics.total_requests++;
    this._metrics.last_used = new Date();

    if (success) {
      this._metrics.successful_requests++;
    } else {
      this._metrics.failed_requests++;
    }

    // Update average response time using running average
    const totalResponseTime =
      this._metrics.average_response_time * (this._metrics.total_requests - 1);

    this._metrics.average_response_time =
      (totalResponseTime + responseTime) / this._metrics.total_requests;

    // Update token usage if provided
    if (usage) {
      this._metrics.total_tokens_used += usage.total_tokens;
    }
  }

  /**
   * Format messages for provider-specific API
   */
  protected formatMessages(request: GenerationRequest): any[] {
    // Base implementation - override for provider-specific formatting
    return request.messages;
  }

  /**
   * Parse provider response into standard format
   */
  protected parseResponse(response: any): GenerationResponse {
    // Base implementation - must be overridden by concrete providers
    throw new Error("parseResponse must be implemented by concrete provider");
  }

  /**
   * Check if error should trigger fallback
   */
  protected shouldFallback(error: any): boolean {
    // Fallback on rate limits, timeouts, and server errors
    if (error instanceof LLMError) {
      return error.retryable;
    }

    // Check for common HTTP error codes that suggest fallback
    if (error.status) {
      return [429, 500, 502, 503, 504].includes(error.status);
    }

    return false;
  }

  /**
   * Get provider-specific headers
   */
  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "User-Agent": "GameGen-Platform/1.0",
    };
  }

  /**
   * Log provider activity (override for custom logging)
   */
  protected log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any,
  ): void {
    const logMessage = `[${this.id}] ${message}`;

    switch (level) {
      case "info":
        console.info(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      case "error":
        console.error(logMessage, data);
        break;
    }
  }
}
