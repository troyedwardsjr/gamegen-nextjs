/**
 * Integration tests for LLM Generation API endpoint
 * Tests the complete request/response cycle including authentication,
 * provider management, billing, and error handling
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/llm/generate/route';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock LLM providers and components
jest.mock('@/lib/llm/providers/manager');
jest.mock('@/lib/llm/providers/claude');
jest.mock('@/lib/llm/config');
jest.mock('@/lib/llm/billing/tracker');
jest.mock('@/lib/llm/monitoring/logger');

import { ProviderManager } from '@/lib/llm/providers/manager';
import { ClaudeProvider } from '@/lib/llm/providers/claude';
import { LLMConfigManager } from '@/lib/llm/config';
import { BillingTracker } from '@/lib/llm/billing/tracker';
import { LLMLogger } from '@/lib/llm/monitoring/logger';

// Create mock implementations
const MockProviderManager = ProviderManager as jest.MockedClass<typeof ProviderManager>;
const MockClaudeProvider = ClaudeProvider as jest.MockedClass<typeof ClaudeProvider>;
const MockLLMConfigManager = LLMConfigManager as jest.MockedClass<typeof LLMConfigManager>;
const MockBillingTracker = BillingTracker as jest.MockedClass<typeof BillingTracker>;
const MockLLMLogger = LLMLogger as jest.MockedClass<typeof LLMLogger>;

describe('/api/llm/generate', () => {
  let mockUser: any;
  let mockProviderManager: any;
  let mockBillingTracker: any;
  let mockLogger: any;

  // Helper function to create mock request
  const createMockRequest = (body: any) => {
    return new NextRequest('https://localhost:3000/api/llm/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        subscription_tier: 'pro',
        credits_remaining: 100,
      },
    };

    // Mock provider manager
    mockProviderManager = {
      generateText: jest.fn(),
      generateStream: jest.fn(),
      isHealthy: jest.fn(() => true),
      getMetrics: jest.fn(() => ({})),
    };
    MockProviderManager.mockImplementation(() => mockProviderManager);

    // Mock billing tracker
    mockBillingTracker = {
      checkBalance: jest.fn(() => ({ hasBalance: true, balance: 100 })),
      deductCredits: jest.fn(),
      trackUsage: jest.fn(),
    };
    MockBillingTracker.mockImplementation(() => mockBillingTracker);

    // Mock logger
    mockLogger = {
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logError: jest.fn(),
    };
    MockLLMLogger.mockImplementation(() => mockLogger);

    // Mock config manager
    MockLLMConfigManager.fromEnvironment = jest.fn(() => ({
      getProviderConfig: jest.fn(() => ({
        api_key: 'test-key',
        max_tokens: 1000,
        timeout: 30000,
      })),
    }));

    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('processes request when user is authenticated', async () => {
      mockProviderManager.generateText.mockResolvedValue({
        content: 'Hello! How can I help you?',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        model: 'claude-3',
        finish_reason: 'stop',
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Hello! How can I help you?');
      expect(data.usage).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    it('returns 400 for missing messages', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('messages');
    });

    it('returns 400 for empty messages array', async () => {
      const request = createMockRequest({
        messages: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('messages');
    });

    it('returns 400 for invalid message format', async () => {
      const request = createMockRequest({
        messages: [{ content: 'Missing role' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('role');
    });

    it('accepts valid request with optional parameters', async () => {
      mockProviderManager.generateText.mockResolvedValue({
        content: 'Test response',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'claude-3',
        finish_reason: 'stop',
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockProviderManager.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 100,
          temperature: 0.7,
        })
      );
    });
  });

  describe('Billing and Credits', () => {
    it('returns 402 when user has insufficient credits', async () => {
      mockBillingTracker.checkBalance.mockReturnValue({
        hasBalance: false,
        balance: 0,
        required: 5,
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('insufficient credits');
    });

    it('deducts credits after successful generation', async () => {
      const mockResponse = {
        content: 'Test response',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'claude-3',
        finish_reason: 'stop',
      };
      
      mockProviderManager.generateText.mockResolvedValue(mockResponse);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockBillingTracker.deductCredits).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Number),
        expect.objectContaining({
          usage: mockResponse.usage,
        })
      );
    });

    it('does not deduct credits on generation failure', async () => {
      mockProviderManager.generateText.mockRejectedValue(
        new Error('Generation failed')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(500);
      expect(mockBillingTracker.deductCredits).not.toHaveBeenCalled();
    });
  });

  describe('LLM Provider Integration', () => {
    it('successfully generates text', async () => {
      const mockResponse = {
        content: 'Generated response',
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
        model: 'claude-3',
        finish_reason: 'stop',
      };
      
      mockProviderManager.generateText.mockResolvedValue(mockResponse);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Generate something' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject(mockResponse);
      expect(mockProviderManager.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Generate something' }],
        })
      );
    });

    it('handles provider rate limiting', async () => {
      mockProviderManager.generateText.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('rate limit');
    });

    it('handles provider timeout', async () => {
      mockProviderManager.generateText.mockRejectedValue(
        new Error('Request timeout')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(408);
      expect(data.error).toContain('timeout');
    });

    it('handles general provider errors', async () => {
      mockProviderManager.generateText.mockRejectedValue(
        new Error('Provider error')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('generation failed');
    });
  });

  describe('Streaming Support', () => {
    it('returns stream response when stream=true', async () => {
      // Mock streaming response
      mockProviderManager.generateStream.mockImplementation(
        async (request: any, callback: any) => {
          callback({
            content: 'Streaming',
            usage: null,
            model: 'claude-3',
            finish_reason: null,
          });
          callback({
            content: ' response',
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
            model: 'claude-3',
            finish_reason: 'stop',
          });
        }
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/stream');
      expect(mockProviderManager.generateStream).toHaveBeenCalled();
    });

    it('handles streaming errors gracefully', async () => {
      mockProviderManager.generateStream.mockRejectedValue(
        new Error('Streaming error')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Logging and Monitoring', () => {
    it('logs successful requests', async () => {
      mockProviderManager.generateText.mockResolvedValue({
        content: 'Test response',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        model: 'claude-3',
        finish_reason: 'stop',
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await POST(request);

      expect(mockLogger.logRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );
      expect(mockLogger.logResponse).toHaveBeenCalled();
    });

    it('logs errors', async () => {
      const error = new Error('Test error');
      mockProviderManager.generateText.mockRejectedValue(error);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await POST(request);

      expect(mockLogger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error.message,
          user_id: mockUser.id,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed JSON request body', async () => {
      const request = new NextRequest('https://localhost:3000/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('handles missing Content-Type header', async () => {
      const request = new NextRequest('https://localhost:3000/api/llm/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      mockProviderManager.generateText.mockResolvedValue({
        content: 'Response',
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        model: 'claude-3',
        finish_reason: 'stop',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles very large request payload', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB string
      
      const request = createMockRequest({
        messages: [{ role: 'user', content: largeContent }],
      });

      const response = await POST(request);
      const data = await response.json();

      // Should either process successfully or return appropriate error
      expect([200, 413, 400]).toContain(response.status);
    });

    it('handles concurrent requests properly', async () => {
      mockProviderManager.generateText.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            content: 'Response',
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
            model: 'claude-3',
            finish_reason: 'stop',
          }), 100)
        )
      );

      const requests = Array.from({ length: 3 }, (_, i) =>
        POST(createMockRequest({
          messages: [{ role: 'user', content: `Hello ${i}` }],
        }))
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});