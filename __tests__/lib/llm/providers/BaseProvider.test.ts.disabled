import { BaseProvider } from '@/lib/llm/providers/base';
import {
  LLMCapability,
  ProviderConfig,
  GenerationRequest,
  GenerationResponse,
  ProviderHealthStatus,
  StreamCallback,
  LLMError,
  TokenUsage,
} from '@/lib/llm/types';

// Mock p-retry to avoid actual retry logic in tests
jest.mock('p-retry', () => {
  const mockPRetry = jest.fn().mockImplementation(async (fn) => {
    // Execute the function once without retry logic
    try {
      return await fn();
    } catch (error) {
      // Re-throw error without retry attempts
      throw error;
    }
  });
  
  return {
    __esModule: true,
    default: mockPRetry,
    AbortError: class AbortError extends Error {
      constructor(message) {
        super(message);
        this.name = 'AbortError';
      }
    },
  };
});

// Test implementation of BaseProvider
class TestProvider extends BaseProvider {
  readonly id = 'test-provider';
  readonly name = 'Test Provider';
  readonly capabilities = [LLMCapability.TEXT_GENERATION, LLMCapability.STREAMING];

  private _shouldFailGeneration = false;
  private _shouldFailStream = false;
  private _shouldFailHealth = false;
  private _generationResponse: GenerationResponse = {
    content: 'Test response',
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    model: 'test-model',
    finish_reason: 'stop',
  };

  // Test helper methods
  setGenerationFailure(shouldFail: boolean) {
    this._shouldFailGeneration = shouldFail;
  }

  setStreamFailure(shouldFail: boolean) {
    this._shouldFailStream = shouldFail;
  }

  setHealthFailure(shouldFail: boolean) {
    this._shouldFailHealth = shouldFail;
  }

  setMockResponse(response: GenerationResponse) {
    this._generationResponse = response;
  }

  protected async _generateInternal(request: GenerationRequest): Promise<GenerationResponse> {
    if (this._shouldFailGeneration) {
      throw new LLMError('Generation failed', 'GENERATION_FAILED', this.id, true);
    }
    return this._generationResponse;
  }

  protected async _generateStreamInternal(
    request: GenerationRequest,
    callback: StreamCallback
  ): Promise<void> {
    if (this._shouldFailStream) {
      throw new LLMError('Stream failed', 'STREAMING_FAILED', this.id, true);
    }

    // Simulate streaming chunks
    callback({ content: 'Test', usage: null, model: 'test-model', finish_reason: null });
    callback({ content: ' stream', usage: null, model: 'test-model', finish_reason: null });
    callback({ 
      content: '', 
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }, 
      model: 'test-model', 
      finish_reason: 'stop' 
    });
  }

  protected async _healthCheckInternal(): Promise<boolean> {
    if (this._shouldFailHealth) {
      throw new Error('Health check failed');
    }
    return true;
  }
}

describe('BaseProvider', () => {
  let provider: TestProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      api_key: 'test-key',
      max_tokens: 1000,
      timeout: 30000,
      retry_attempts: 3,
      health_check_interval: 60000,
    };

    provider = new TestProvider(config);
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('initializes with provided config', () => {
      expect(provider.config).toEqual(config);
    });

    it('initializes metrics', async () => {
      const metrics = await provider.getMetrics();
      
      expect(metrics).toEqual({
        provider_id: 'test-provider',
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        average_response_time: 0,
        total_tokens_used: 0,
        health_status: ProviderHealthStatus.HEALTHY,
        last_used: expect.any(Date),
        cost_per_token: 0,
      });
    });

    it('returns immutable config copy', () => {
      const configCopy = provider.config;
      configCopy.max_tokens = 2000;
      
      expect(provider.config.max_tokens).toBe(1000);
    });
  });

  describe('Configuration Updates', () => {
    it('updates config correctly', async () => {
      const updates = { max_tokens: 2000, timeout: 60000 };
      
      await provider.updateConfig(updates);
      
      expect(provider.config.max_tokens).toBe(2000);
      expect(provider.config.timeout).toBe(60000);
      expect(provider.config.api_key).toBe('test-key'); // Unchanged
    });

    it('resets health check timestamp on config update', async () => {
      // Set a recent health check
      await provider.healthCheck();
      
      // Update config
      await provider.updateConfig({ max_tokens: 2000 });
      
      // Health check should be forced on next call
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Text Generation', () => {
    const validRequest: GenerationRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 100,
      temperature: 0.7,
    };

    it('generates text successfully', async () => {
      const response = await provider.generate(validRequest);
      
      expect(response).toEqual({
        content: 'Test response',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'test-model',
        finish_reason: 'stop',
      });
    });

    it('updates metrics on successful generation', async () => {
      await provider.generate(validRequest);
      
      const metrics = await provider.getMetrics();
      expect(metrics.total_requests).toBe(1);
      expect(metrics.successful_requests).toBe(1);
      expect(metrics.failed_requests).toBe(0);
      expect(metrics.total_tokens_used).toBe(30);
      expect(metrics.average_response_time).toBeGreaterThan(0);
    });

    it('handles generation failures', async () => {
      provider.setGenerationFailure(true);
      
      await expect(provider.generate(validRequest))
        .rejects.toThrow('Generation failed');
      
      const metrics = await provider.getMetrics();
      expect(metrics.total_requests).toBe(1);
      expect(metrics.successful_requests).toBe(0);
      expect(metrics.failed_requests).toBe(1);
    });

    it('wraps unknown errors in LLMError', async () => {
      // Override to throw unknown error
      jest.spyOn(provider as any, '_generateInternal')
        .mockRejectedValueOnce(new Error('Unknown error'));
      
      await expect(provider.generate(validRequest))
        .rejects.toThrow('Provider test-provider generation failed: Unknown error');
    });
  });

  describe('Stream Generation', () => {
    const validRequest: GenerationRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
    };

    it('generates stream successfully', async () => {
      const chunks: any[] = [];
      const callback = jest.fn((chunk) => chunks.push(chunk));
      
      await provider.generateStream(validRequest, callback);
      
      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('Test');
      expect(chunks[1].content).toBe(' stream');
      expect(chunks[2].usage?.total_tokens).toBe(15);
    });

    it('fails for providers without streaming capability', async () => {
      // Create provider without streaming capability
      class NonStreamingProvider extends TestProvider {
        readonly capabilities = [LLMCapability.TEXT_GENERATION];
      }
      
      const nonStreamingProvider = new NonStreamingProvider(config);
      const callback = jest.fn();
      
      await expect(nonStreamingProvider.generateStream(validRequest, callback))
        .rejects.toThrow('Provider test-provider does not support streaming');
    });

    it('handles stream failures', async () => {
      provider.setStreamFailure(true);
      const callback = jest.fn();
      
      await expect(provider.generateStream(validRequest, callback))
        .rejects.toThrow('Stream failed');
    });

    it('updates metrics on streaming', async () => {
      const callback = jest.fn();
      await provider.generateStream(validRequest, callback);
      
      const metrics = await provider.getMetrics();
      expect(metrics.total_requests).toBe(1);
      expect(metrics.successful_requests).toBe(1);
    });
  });

  describe('Request Validation', () => {
    it('rejects empty messages', async () => {
      const invalidRequest: GenerationRequest = {
        messages: [],
      };
      
      await expect(provider.generate(invalidRequest))
        .rejects.toThrow('Generation request must include at least one message');
    });

    it('rejects excessive max_tokens', async () => {
      const invalidRequest: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 2000, // Exceeds config limit of 1000
      };
      
      await expect(provider.generate(invalidRequest))
        .rejects.toThrow('Requested max_tokens (2000) exceeds provider limit (1000)');
    });

    it('rejects invalid temperature', async () => {
      const invalidRequest: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 3, // Must be 0-2
      };
      
      await expect(provider.generate(invalidRequest))
        .rejects.toThrow('Temperature must be between 0 and 2');
    });

    it('rejects function calling for unsupported providers', async () => {
      // Create provider without function calling capability
      class BasicProvider extends TestProvider {
        readonly capabilities = [LLMCapability.TEXT_GENERATION];
      }
      
      const basicProvider = new BasicProvider(config);
      const requestWithTools: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        tools: [{ type: 'function', function: { name: 'test', description: 'test' } }],
      };
      
      await expect(basicProvider.generate(requestWithTools))
        .rejects.toThrow('Provider test-provider does not support function calling');
    });
  });

  describe('Health Check', () => {
    it('performs health check successfully', async () => {
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
      
      const metrics = await provider.getMetrics();
      expect(metrics.health_status).toBe(ProviderHealthStatus.HEALTHY);
    });

    it('handles health check failures', async () => {
      provider.setHealthFailure(true);
      
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(false);
      
      const metrics = await provider.getMetrics();
      expect(metrics.health_status).toBe(ProviderHealthStatus.OFFLINE);
    });

    it('caches health check results', async () => {
      // First call should trigger actual check
      const spy = jest.spyOn(provider as any, '_healthCheckInternal');
      
      await provider.healthCheck();
      expect(spy).toHaveBeenCalledTimes(1);
      
      // Second immediate call should use cache
      await provider.healthCheck();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('respects health check timeout', async () => {
      // Mock a slow health check
      jest.spyOn(provider as any, '_healthCheckInternal')
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 35000)));
      
      const start = Date.now();
      const isHealthy = await provider.healthCheck();
      const duration = Date.now() - start;
      
      expect(isHealthy).toBe(false);
      expect(duration).toBeLessThan(35000); // Should timeout before 35s
    });
  });

  describe('Metrics Tracking', () => {
    it('tracks multiple requests correctly', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      
      // Make successful request
      await provider.generate(request);
      
      // Make failed request
      provider.setGenerationFailure(true);
      try {
        await provider.generate(request);
      } catch (error) {
        // Expected failure
      }
      
      // Make another successful request
      provider.setGenerationFailure(false);
      await provider.generate(request);
      
      const metrics = await provider.getMetrics();
      expect(metrics.total_requests).toBe(3);
      expect(metrics.successful_requests).toBe(2);
      expect(metrics.failed_requests).toBe(1);
      expect(metrics.total_tokens_used).toBe(60); // 30 tokens × 2 successful requests
    });

    it('calculates average response time correctly', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      
      await provider.generate(request);
      await provider.generate(request);
      
      const metrics = await provider.getMetrics();
      expect(metrics.average_response_time).toBeGreaterThan(0);
      expect(metrics.total_requests).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('handles retryable errors correctly', async () => {
      const retryableLLMError = new LLMError('Rate limit', 'RATE_LIMITED', 'test', true);
      const spy = jest.spyOn(provider as any, '_generateInternal')
        .mockRejectedValueOnce(retryableLLMError)
        .mockResolvedValueOnce({
          content: 'Success after retry',
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          model: 'test-model',
          finish_reason: 'stop',
        });
      
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      
      const response = await provider.generate(request);
      expect(response.content).toBe('Success after retry');
      expect(spy).toHaveBeenCalledTimes(2); // Initial call + retry
    });

    it('does not retry non-retryable errors', async () => {
      const nonRetryableError = new LLMError('Invalid API key', 'INVALID_API_KEY', 'test', false);
      const spy = jest.spyOn(provider as any, '_generateInternal')
        .mockRejectedValue(nonRetryableError);
      
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      
      await expect(provider.generate(request)).rejects.toThrow('Invalid API key');
      expect(spy).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('Cleanup', () => {
    it('destroys provider cleanly', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      await provider.destroy();
      
      expect(consoleSpy).toHaveBeenCalledWith('Provider test-provider destroyed');
      consoleSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('shouldFallback identifies retryable errors', () => {
      const retryableError = new LLMError('Rate limit', 'RATE_LIMITED', 'test', true);
      const nonRetryableError = new LLMError('Invalid key', 'INVALID_API_KEY', 'test', false);
      
      expect((provider as any).shouldFallback(retryableError)).toBe(true);
      expect((provider as any).shouldFallback(nonRetryableError)).toBe(false);
    });

    it('shouldFallback identifies HTTP status codes', () => {
      const rateLimitError = { status: 429 };
      const serverError = { status: 500 };
      const clientError = { status: 400 };
      
      expect((provider as any).shouldFallback(rateLimitError)).toBe(true);
      expect((provider as any).shouldFallback(serverError)).toBe(true);
      expect((provider as any).shouldFallback(clientError)).toBe(false);
    });

    it('getHeaders returns correct headers', () => {
      const headers = (provider as any).getHeaders();
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'User-Agent': 'GameGen-Platform/1.0',
      });
    });

    it('formatMessages returns messages by default', () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      };
      
      const formatted = (provider as any).formatMessages(request);
      expect(formatted).toBe(request.messages);
    });

    it('parseResponse throws error by default', () => {
      expect(() => (provider as any).parseResponse({}))
        .toThrow('parseResponse must be implemented by concrete provider');
    });
  });

  describe('Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs info messages correctly', () => {
      (provider as any).log('info', 'Test message', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[test-provider] Test message',
        { data: 'test' }
      );
    });

    it('logs different levels correctly', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (provider as any).log('warn', 'Warning message');
      (provider as any).log('error', 'Error message');
      
      expect(warnSpy).toHaveBeenCalledWith('[test-provider] Warning message', undefined);
      expect(errorSpy).toHaveBeenCalledWith('[test-provider] Error message', undefined);
      
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});