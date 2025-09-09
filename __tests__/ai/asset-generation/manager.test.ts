/**
 * Asset Generation Manager Tests
 * 
 * Comprehensive test suite for the AI asset generation manager,
 * covering provider management, failover, and asset generation workflows.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AssetGenerationManager } from '@/lib/ai/asset-generation/manager';
import { AssetGenerationRequest, AssetGenerationError, ERROR_CODES } from '@/lib/ai/asset-generation/types';

// Mock providers
const mockPixellabProvider = {
  generateAsset: jest.fn(),
  isHealthy: jest.fn(),
  getCapabilities: jest.fn(),
  estimateGenerationTime: jest.fn(),
};

const mockRetrodiffusionProvider = {
  generateAsset: jest.fn(),
  isHealthy: jest.fn(),
  getCapabilities: jest.fn(),
  estimateGenerationTime: jest.fn(),
};

const mockDalleProvider = {
  generateAsset: jest.fn(),
  isHealthy: jest.fn(),
  getCapabilities: jest.fn(),
  estimateGenerationTime: jest.fn(),
};

jest.mock('@/lib/ai/asset-generation/providers/pixellab', () => ({
  PixellabProvider: jest.fn(() => mockPixellabProvider),
}));

jest.mock('@/lib/ai/asset-generation/providers/retrodiffusion', () => ({
  RetrodiffusionProvider: jest.fn(() => mockRetrodiffusionProvider),
}));

jest.mock('@/lib/ai/asset-generation/providers/dalle', () => ({
  DalleProvider: jest.fn(() => mockDalleProvider),
}));

describe('AssetGenerationManager', () => {
  let manager: AssetGenerationManager;
  let mockRequest: AssetGenerationRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockPixellabProvider.isHealthy.mockResolvedValue(true);
    mockRetrodiffusionProvider.isHealthy.mockResolvedValue(true);
    mockDalleProvider.isHealthy.mockResolvedValue(true);

    mockPixellabProvider.getCapabilities.mockReturnValue({
      supportedAssetTypes: ['sprite', 'tile', 'background'],
      supportedStyles: ['pixel-art', '8bit', '16bit'],
      maxDimensions: { width: 512, height: 512 },
    });

    mockRetrodiffusionProvider.getCapabilities.mockReturnValue({
      supportedAssetTypes: ['sprite', 'background'],
      supportedStyles: ['pixel-art', 'retro'],
      maxDimensions: { width: 256, height: 256 },
    });

    mockDalleProvider.getCapabilities.mockReturnValue({
      supportedAssetTypes: ['sprite', 'background', 'ui'],
      supportedStyles: ['modern', 'realistic'],
      maxDimensions: { width: 1024, height: 1024 },
    });

    // Initialize manager
    manager = new AssetGenerationManager({
      providers: {
        pixellab: {
          apiKey: 'test-pixellab-key',
          endpoint: 'https://api.pixellab.ai/v1/generate',
          enabled: true,
        },
        retrodiffusion: {
          apiKey: 'test-retro-key',
          endpoint: 'https://api.retrodiffusion.ai/generate',
          enabled: true,
        },
        dalle: {
          apiKey: 'test-dalle-key',
          endpoint: 'https://api.openai.com/v1',
          enabled: true,
        },
      },
      defaultProvider: 'pixellab',
      fallbackChain: ['pixellab', 'retrodiffusion', 'dalle'],
      maxRetries: 2,
      timeout: 30000,
    });

    // Mock request
    mockRequest = {
      prompt: 'a pixel art character sprite',
      assetType: 'sprite',
      style: 'pixel-art',
      quality: 'high',
      dimensions: { width: 64, height: 64 },
      userId: 'test-user-id',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with valid configuration', () => {
      expect(manager).toBeDefined();
      expect(manager.getProviderStatus).toBeDefined();
    });

    test('should throw error with invalid configuration', () => {
      expect(() => {
        new AssetGenerationManager({
          providers: {},
          defaultProvider: 'nonexistent',
        });
      }).toThrow('Default provider nonexistent not found');
    });

    test('should validate provider configurations', () => {
      expect(() => {
        new AssetGenerationManager({
          providers: {
            pixellab: {
              apiKey: '',
              endpoint: 'invalid-url',
              enabled: true,
            },
          },
          defaultProvider: 'pixellab',
        });
      }).toThrow();
    });
  });

  describe('Asset Generation', () => {
    test('should generate asset successfully with default provider', async () => {
      const mockAsset = {
        id: 'test-asset-id',
        url: 'https://example.com/asset.png',
        thumbnailUrl: 'https://example.com/thumb.png',
        metadata: { format: 'PNG', size: { width: 64, height: 64 } },
        generatedBy: 'pixellab',
        qualityScore: 0.85,
      };

      mockPixellabProvider.generateAsset.mockResolvedValue(mockAsset);

      const result = await manager.generateAsset(mockRequest);

      expect(result).toEqual(mockAsset);
      expect(mockPixellabProvider.generateAsset).toHaveBeenCalledWith(mockRequest);
      expect(mockRetrodiffusionProvider.generateAsset).not.toHaveBeenCalled();
      expect(mockDalleProvider.generateAsset).not.toHaveBeenCalled();
    });

    test('should fallback to secondary provider on primary failure', async () => {
      const error = new AssetGenerationError('Primary provider failed', ERROR_CODES.PROVIDER_ERROR, undefined, true);
      const mockAsset = {
        id: 'test-asset-id-2',
        url: 'https://example.com/asset2.png',
        thumbnailUrl: 'https://example.com/thumb2.png',
        metadata: { format: 'PNG', size: { width: 64, height: 64 } },
        generatedBy: 'retrodiffusion',
        qualityScore: 0.78,
      };

      mockPixellabProvider.generateAsset.mockRejectedValue(error);
      mockRetrodiffusionProvider.generateAsset.mockResolvedValue(mockAsset);

      const result = await manager.generateAsset(mockRequest);

      expect(result).toEqual(mockAsset);
      expect(mockPixellabProvider.generateAsset).toHaveBeenCalledWith(mockRequest);
      expect(mockRetrodiffusionProvider.generateAsset).toHaveBeenCalledWith(mockRequest);
      expect(mockDalleProvider.generateAsset).not.toHaveBeenCalled();
    });

    test('should use all providers in fallback chain before failing', async () => {
      const error = new AssetGenerationError('Provider failed', ERROR_CODES.PROVIDER_ERROR, undefined, true);

      mockPixellabProvider.generateAsset.mockRejectedValue(error);
      mockRetrodiffusionProvider.generateAsset.mockRejectedValue(error);
      mockDalleProvider.generateAsset.mockRejectedValue(error);

      await expect(manager.generateAsset(mockRequest)).rejects.toThrow('All providers failed');

      expect(mockPixellabProvider.generateAsset).toHaveBeenCalled();
      expect(mockRetrodiffusionProvider.generateAsset).toHaveBeenCalled();
      expect(mockDalleProvider.generateAsset).toHaveBeenCalled();
    });

    test('should respect provider capabilities when selecting', async () => {
      // Request an asset type only supported by DALL-E
      const uiRequest: AssetGenerationRequest = {
        ...mockRequest,
        assetType: 'ui',
        style: 'modern',
      };

      const mockAsset = {
        id: 'test-ui-asset',
        url: 'https://example.com/ui.png',
        thumbnailUrl: 'https://example.com/ui-thumb.png',
        metadata: { format: 'PNG', size: { width: 64, height: 64 } },
        generatedBy: 'dalle',
        qualityScore: 0.92,
      };

      mockDalleProvider.generateAsset.mockResolvedValue(mockAsset);

      const result = await manager.generateAsset(uiRequest);

      expect(result).toEqual(mockAsset);
      expect(mockDalleProvider.generateAsset).toHaveBeenCalledWith(uiRequest);
    });

    test('should handle timeout errors appropriately', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';

      mockPixellabProvider.generateAsset.mockRejectedValue(timeoutError);

      await expect(manager.generateAsset(mockRequest)).rejects.toThrow('Request timeout');
    });

    test('should validate request before generation', async () => {
      const invalidRequest = {
        ...mockRequest,
        prompt: '', // Invalid empty prompt
      };

      await expect(manager.generateAsset(invalidRequest)).rejects.toThrow('Prompt is required');
    });
  });

  describe('Provider Health Monitoring', () => {
    test('should check provider health status', async () => {
      mockPixellabProvider.isHealthy.mockResolvedValue(true);
      mockRetrodiffusionProvider.isHealthy.mockResolvedValue(false);
      mockDalleProvider.isHealthy.mockResolvedValue(true);

      const status = await manager.getProviderStatus();

      expect(status).toEqual({
        pixellab: { healthy: true, lastCheck: expect.any(String) },
        retrodiffusion: { healthy: false, lastCheck: expect.any(String) },
        dalle: { healthy: true, lastCheck: expect.any(String) },
      });
    });

    test('should skip unhealthy providers during generation', async () => {
      mockPixellabProvider.isHealthy.mockResolvedValue(false);
      mockRetrodiffusionProvider.isHealthy.mockResolvedValue(true);

      const mockAsset = {
        id: 'test-asset-fallback',
        url: 'https://example.com/fallback.png',
        thumbnailUrl: 'https://example.com/fallback-thumb.png',
        metadata: { format: 'PNG', size: { width: 64, height: 64 } },
        generatedBy: 'retrodiffusion',
        qualityScore: 0.72,
      };

      mockRetrodiffusionProvider.generateAsset.mockResolvedValue(mockAsset);

      const result = await manager.generateAsset(mockRequest);

      expect(result).toEqual(mockAsset);
      expect(mockPixellabProvider.generateAsset).not.toHaveBeenCalled();
      expect(mockRetrodiffusionProvider.generateAsset).toHaveBeenCalled();
    });
  });

  describe('Time Estimation', () => {
    test('should estimate generation time accurately', () => {
      mockPixellabProvider.estimateGenerationTime.mockReturnValue(45000); // 45 seconds

      const estimate = manager.estimateGenerationTime(mockRequest);

      expect(estimate).toBe(45000);
      expect(mockPixellabProvider.estimateGenerationTime).toHaveBeenCalledWith(mockRequest);
    });

    test('should adjust estimates for different providers', () => {
      mockPixellabProvider.estimateGenerationTime.mockReturnValue(30000); // 30 seconds
      mockRetrodiffusionProvider.estimateGenerationTime.mockReturnValue(60000); // 60 seconds

      const pixellabEstimate = manager.estimateGenerationTime(mockRequest);
      expect(pixellabEstimate).toBe(30000);

      // Simulate provider switch
      mockPixellabProvider.isHealthy.mockResolvedValue(false);
      const retrodiffusionEstimate = manager.estimateGenerationTime(mockRequest);
      expect(retrodiffusionEstimate).toBe(60000);
    });
  });

  describe('Error Handling', () => {
    test('should handle provider initialization errors', () => {
      expect(() => {
        new AssetGenerationManager({
          providers: {
            pixellab: {
              apiKey: 'test-key',
              endpoint: 'invalid-url',
              enabled: true,
            },
          },
          defaultProvider: 'pixellab',
        });
      }).toThrow();
    });

    test('should distinguish between retryable and non-retryable errors', async () => {
      const nonRetryableError = new AssetGenerationError(
        'Invalid API key',
        ERROR_CODES.INVALID_API_KEY,
        undefined,
        false
      );

      mockPixellabProvider.generateAsset.mockRejectedValue(nonRetryableError);

      await expect(manager.generateAsset(mockRequest)).rejects.toThrow('Invalid API key');
      expect(mockPixellabProvider.generateAsset).toHaveBeenCalledTimes(1); // No retries for non-retryable
    });

    test('should retry on retryable errors', async () => {
      const retryableError = new AssetGenerationError(
        'Temporary server error',
        ERROR_CODES.PROVIDER_ERROR,
        undefined,
        true
      );

      mockPixellabProvider.generateAsset
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue({
          id: 'retry-success',
          url: 'https://example.com/retry.png',
          thumbnailUrl: 'https://example.com/retry-thumb.png',
          metadata: { format: 'PNG' },
          generatedBy: 'pixellab',
          qualityScore: 0.81,
        });

      const result = await manager.generateAsset(mockRequest);

      expect(result.id).toBe('retry-success');
      expect(mockPixellabProvider.generateAsset).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch asset generation', async () => {
      const requests = [
        { ...mockRequest, prompt: 'sprite 1' },
        { ...mockRequest, prompt: 'sprite 2' },
        { ...mockRequest, prompt: 'sprite 3' },
      ];

      const mockAssets = requests.map((req, i) => ({
        id: `batch-asset-${i}`,
        url: `https://example.com/batch-${i}.png`,
        thumbnailUrl: `https://example.com/batch-thumb-${i}.png`,
        metadata: { format: 'PNG', batchIndex: i },
        generatedBy: 'pixellab',
        qualityScore: 0.8 + i * 0.05,
      }));

      mockPixellabProvider.generateAsset
        .mockResolvedValueOnce(mockAssets[0])
        .mockResolvedValueOnce(mockAssets[1])
        .mockResolvedValueOnce(mockAssets[2]);

      const results = await Promise.all(
        requests.map(req => manager.generateAsset(req))
      );

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('batch-asset-0');
      expect(results[1].id).toBe('batch-asset-1');
      expect(results[2].id).toBe('batch-asset-2');
    });

    test('should handle partial batch failures gracefully', async () => {
      const requests = [
        { ...mockRequest, prompt: 'sprite 1' },
        { ...mockRequest, prompt: 'sprite 2' },
        { ...mockRequest, prompt: 'sprite 3' },
      ];

      mockPixellabProvider.generateAsset
        .mockResolvedValueOnce({
          id: 'batch-asset-0',
          url: 'https://example.com/batch-0.png',
          thumbnailUrl: 'https://example.com/batch-thumb-0.png',
          metadata: { format: 'PNG' },
          generatedBy: 'pixellab',
          qualityScore: 0.85,
        })
        .mockRejectedValueOnce(new AssetGenerationError('Generation failed', ERROR_CODES.PROVIDER_ERROR))
        .mockResolvedValueOnce({
          id: 'batch-asset-2',
          url: 'https://example.com/batch-2.png',
          thumbnailUrl: 'https://example.com/batch-thumb-2.png',
          metadata: { format: 'PNG' },
          generatedBy: 'pixellab',
          qualityScore: 0.79,
        });

      const results = await Promise.allSettled(
        requests.map(req => manager.generateAsset(req))
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Performance Metrics', () => {
    test('should track generation metrics', async () => {
      const mockAsset = {
        id: 'metrics-test',
        url: 'https://example.com/metrics.png',
        thumbnailUrl: 'https://example.com/metrics-thumb.png',
        metadata: { format: 'PNG', processingTime: 2500 },
        generatedBy: 'pixellab',
        qualityScore: 0.88,
      };

      mockPixellabProvider.generateAsset.mockResolvedValue(mockAsset);

      const startTime = Date.now();
      await manager.generateAsset(mockRequest);
      const endTime = Date.now();

      const metrics = manager.getMetrics();

      expect(metrics.totalGenerations).toBe(1);
      expect(metrics.successfulGenerations).toBe(1);
      expect(metrics.failedGenerations).toBe(0);
      expect(metrics.averageGenerationTime).toBeGreaterThan(0);
      expect(metrics.averageGenerationTime).toBeLessThan(endTime - startTime + 1000);
    });

    test('should track provider usage statistics', async () => {
      const mockAsset = {
        id: 'stats-test',
        url: 'https://example.com/stats.png',
        thumbnailUrl: 'https://example.com/stats-thumb.png',
        metadata: { format: 'PNG' },
        generatedBy: 'pixellab',
        qualityScore: 0.82,
      };

      mockPixellabProvider.generateAsset.mockResolvedValue(mockAsset);

      await manager.generateAsset(mockRequest);

      const stats = manager.getProviderStats();

      expect(stats.pixellab.totalRequests).toBe(1);
      expect(stats.pixellab.successfulRequests).toBe(1);
      expect(stats.pixellab.failedRequests).toBe(0);
      expect(stats.pixellab.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    test('should update provider configuration dynamically', async () => {
      await manager.updateProviderConfig('pixellab', {
        enabled: false,
      });

      const status = await manager.getProviderStatus();
      expect(status.pixellab.enabled).toBe(false);
    });

    test('should validate configuration updates', async () => {
      await expect(
        manager.updateProviderConfig('nonexistent', { enabled: true })
      ).rejects.toThrow('Provider nonexistent not found');
    });

    test('should handle configuration changes gracefully', async () => {
      // Disable primary provider
      await manager.updateProviderConfig('pixellab', { enabled: false });

      // Should fallback to secondary
      const mockAsset = {
        id: 'config-change-test',
        url: 'https://example.com/config.png',
        thumbnailUrl: 'https://example.com/config-thumb.png',
        metadata: { format: 'PNG' },
        generatedBy: 'retrodiffusion',
        qualityScore: 0.76,
      };

      mockRetrodiffusionProvider.generateAsset.mockResolvedValue(mockAsset);

      const result = await manager.generateAsset(mockRequest);

      expect(result.generatedBy).toBe('retrodiffusion');
      expect(mockPixellabProvider.generateAsset).not.toHaveBeenCalled();
    });
  });
});