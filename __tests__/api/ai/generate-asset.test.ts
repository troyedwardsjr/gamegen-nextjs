/**
 * AI Asset Generation API Tests
 * 
 * Comprehensive test suite for the AI asset generation API endpoints,
 * covering authentication, validation, and generation workflows.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/generate-asset/route';

// Mock dependencies
jest.mock('@/lib/auth/dev-server-auth', () => ({
  getAuthenticatedUser: jest.fn(),
  createAuthErrorResponse: jest.fn(() => ({ message: 'Authentication failed' })),
}));

jest.mock('@/lib/ai/asset-generation/manager', () => ({
  AssetGenerationManager: jest.fn(() => ({
    generateAsset: jest.fn(),
    estimateGenerationTime: jest.fn(() => 60000),
  })),
}));

jest.mock('@/lib/ai/asset-generation/queue', () => ({
  AssetGenerationQueue: jest.fn(() => ({
    enqueueAssetGeneration: jest.fn(),
  })),
}));

jest.mock('@/lib/llm/billing/tracker', () => ({
  BillingTracker: jest.fn(() => ({
    checkCredits: jest.fn(() => true),
    reserveCredits: jest.fn(() => 'reservation-123'),
    recordUsage: jest.fn(),
    getCreditBalance: jest.fn(() => ({ available: 100 })),
  })),
}));

jest.mock('@/lib/llm/monitoring/logger', () => ({
  LLMLogger: jest.fn(() => ({
    logRequest: jest.fn(),
  })),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { subscription_tier: 'pro', subscription_status: 'active' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-cookie-value' })),
  })),
}));

// Import mocked functions
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth/dev-server-auth';
import { AssetGenerationManager } from '@/lib/ai/asset-generation/manager';
import { AssetGenerationQueue } from '@/lib/ai/asset-generation/queue';
import { BillingTracker } from '@/lib/llm/billing/tracker';

const mockGetAuthenticatedUser = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
const mockCreateAuthErrorResponse = createAuthErrorResponse as jest.MockedFunction<typeof createAuthErrorResponse>;
const mockAssetGenerationManager = AssetGenerationManager as jest.MockedClass<typeof AssetGenerationManager>;
const mockAssetGenerationQueue = AssetGenerationQueue as jest.MockedClass<typeof AssetGenerationQueue>;
const mockBillingTracker = BillingTracker as jest.MockedClass<typeof BillingTracker>;

describe('/api/ai/generate-asset', () => {
  let mockRequest: NextRequest;
  let validRequestBody: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup valid request body
    validRequestBody = {
      prompt: 'a pixel art character sprite in 16x16 resolution',
      assetType: 'sprite',
      style: 'pixel-art',
      quality: 'high',
      dimensions: { width: 16, height: 16 },
    };

    // Mock successful authentication
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      error: null,
    });

    // Mock successful asset generation
    const mockGeneratedAsset = {
      id: 'generated-asset-123',
      url: 'https://cdn.example.com/asset.png',
      thumbnailUrl: 'https://cdn.example.com/thumb.png',
      metadata: { format: 'PNG', size: { width: 16, height: 16 } },
      generatedBy: 'pixellab',
      qualityScore: 0.85,
    };

    mockAssetGenerationManager.prototype.generateAsset = jest.fn().mockResolvedValue(mockGeneratedAsset);
    mockAssetGenerationQueue.prototype.enqueueAssetGeneration = jest.fn().mockResolvedValue({
      jobId: 'job-123',
      queuePosition: 1,
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
    });

    // Mock billing
    mockBillingTracker.prototype.checkCredits = jest.fn().mockResolvedValue(true);
    mockBillingTracker.prototype.reserveCredits = jest.fn().mockResolvedValue('reservation-123');
    mockBillingTracker.prototype.getCreditBalance = jest.fn().mockResolvedValue({ available: 100 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      mockGetAuthenticatedUser.mockResolvedValue({
        user: null,
        error: { message: 'Not authenticated' },
      });

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    test('should accept valid authentication', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    test('should validate required prompt field', async () => {
      const invalidBody = { ...validRequestBody };
      delete invalidBody.prompt;

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Prompt is required');
    });

    test('should validate asset type', async () => {
      const invalidBody = { ...validRequestBody, assetType: 'invalid-type' };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid asset type');
    });

    test('should validate prompt length', async () => {
      const longPrompt = 'a'.repeat(1001); // Exceeds max length
      const invalidBody = { ...validRequestBody, prompt: longPrompt };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('exceeds maximum length');
    });

    test('should validate dimensions', async () => {
      const invalidBody = { 
        ...validRequestBody, 
        dimensions: { width: 2000, height: 2000 } // Exceeds max dimensions
      };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Dimensions exceed maximum');
    });

    test('should reject malformed JSON', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });
  });

  describe('Subscription Validation', () => {
    test('should allow asset generation for Pro users', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
    });

    test('should limit free users to basic quality', async () => {
      // Mock free tier user
      jest.mock('@supabase/ssr', () => ({
        createServerClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { subscription_tier: 'free', subscription_status: 'active' },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      const ultraQualityBody = { ...validRequestBody, quality: 'ultra' };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(ultraQualityBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('Ultra quality requires');
    });

    test('should check subscription status', async () => {
      jest.mock('@supabase/ssr', () => ({
        createServerClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { subscription_tier: 'pro', subscription_status: 'cancelled' },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('Active subscription required');
    });
  });

  describe('Credit System', () => {
    test('should check credits before generation', async () => {
      mockBillingTracker.prototype.checkCredits = jest.fn().mockResolvedValue(false);
      mockBillingTracker.prototype.getCreditBalance = jest.fn().mockResolvedValue({ available: 2 });

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('Insufficient credits');
      expect(data.code).toBe('INSUFFICIENT_CREDITS');
    });

    test('should reserve credits for immediate generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(mockRequest);

      expect(mockBillingTracker.prototype.reserveCredits).toHaveBeenCalled();
    });

    test('should record usage after successful generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(mockRequest);

      expect(mockBillingTracker.prototype.recordUsage).toHaveBeenCalled();
    });
  });

  describe('Generation Modes', () => {
    test('should handle immediate generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.asset).toBeDefined();
      expect(mockAssetGenerationManager.prototype.generateAsset).toHaveBeenCalled();
    });

    test('should handle queued generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(202); // Accepted
      expect(data.success).toBe(true);
      expect(data.queued).toBe(true);
      expect(data.jobId).toBeDefined();
      expect(mockAssetGenerationQueue.prototype.enqueueAssetGeneration).toHaveBeenCalled();
    });

    test('should prioritize urgent requests for immediate processing', async () => {
      const urgentBody = { ...validRequestBody, priority: 'urgent' };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(urgentBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200); // Immediate processing for urgent
      expect(data.asset).toBeDefined();
    });
  });

  describe('Provider Selection', () => {
    test('should use specified provider', async () => {
      const providerBody = { ...validRequestBody, provider: 'retrodiffusion' };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(providerBody),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(mockRequest);

      expect(mockAssetGenerationManager.prototype.generateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'retrodiffusion',
        })
      );
    });

    test('should use default provider when none specified', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(mockRequest);

      expect(mockAssetGenerationManager.prototype.generateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('Variant Generation', () => {
    test('should handle multiple variants', async () => {
      const variantBody = { ...validRequestBody, variants: 3 };

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(variantBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(202); // Should be queued for multiple variants
      expect(data.queued).toBe(true);
    });

    test('should validate variant limits by subscription tier', async () => {
      const manyVariantsBody = { ...validRequestBody, variants: 10 };

      // Mock free tier user
      jest.mock('@supabase/ssr', () => ({
        createServerClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { subscription_tier: 'free', subscription_status: 'active' },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(manyVariantsBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('Variant limit exceeded');
    });
  });

  describe('Error Handling', () => {
    test('should handle generation failures gracefully', async () => {
      mockAssetGenerationManager.prototype.generateAsset = jest.fn().mockRejectedValue(
        new Error('Generation failed')
      );

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Asset generation failed');
    });

    test('should handle queue failures', async () => {
      mockAssetGenerationQueue.prototype.enqueueAssetGeneration = jest.fn().mockRejectedValue(
        new Error('Queue is full')
      );

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Asset generation failed');
    });

    test('should handle database errors', async () => {
      jest.mock('@supabase/ssr', () => ({
        createServerClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { message: 'Database error' },
                })),
              })),
            })),
          })),
        })),
      }));

      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('User profile not found');
    });
  });

  describe('Response Format', () => {
    test('should return correct response format for immediate generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        asset: expect.objectContaining({
          id: expect.any(String),
          url: expect.any(String),
          thumbnailUrl: expect.any(String),
          metadata: expect.any(Object),
          generatedBy: expect.any(String),
          qualityScore: expect.any(Number),
        }),
        credits: expect.objectContaining({
          used: expect.any(Number),
          remaining: expect.any(Number),
        }),
        processingTime: expect.any(Number),
      });
    });

    test('should return correct response format for queued generation', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        queued: true,
        jobId: expect.any(String),
        queuePosition: expect.any(Number),
        estimatedCompletion: expect.any(String),
        estimatedCredits: expect.any(Number),
        message: expect.any(String),
      });
    });

    test('should include processing time in all responses', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should complete request within reasonable time', async () => {
      mockRequest = new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const startTime = Date.now();
      await POST(mockRequest);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds for mocked calls
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        new NextRequest('http://localhost/api/ai/generate-asset?immediate=true', {
          method: 'POST',
          body: JSON.stringify(validRequestBody),
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});