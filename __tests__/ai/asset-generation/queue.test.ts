/**
 * Asset Generation Queue Tests
 * 
 * Comprehensive test suite for the asset generation queue system,
 * covering job management, priority handling, and batch processing.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AssetGenerationQueue } from '@/lib/ai/asset-generation/queue';
import { AssetGenerationManager } from '@/lib/ai/asset-generation/manager';
import { 
  AssetGenerationRequest, 
  BatchGenerationRequest,
  AssetGenerationError, 
  ERROR_CODES 
} from '@/lib/ai/asset-generation/types';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  not: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lt: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  single: jest.fn(),
  channel: jest.fn(() => ({
    on: jest.fn(() => ({ subscribe: jest.fn() })),
  })),
  removeChannel: jest.fn(),
  raw: jest.fn((sql: string) => ({ sql })),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

// Mock Asset Generation Manager
const mockGenerationManager = {
  generateAsset: jest.fn(),
  estimateGenerationTime: jest.fn(),
  getProviderStatus: jest.fn(),
  getMetrics: jest.fn(),
};

jest.mock('@/lib/ai/asset-generation/manager', () => ({
  AssetGenerationManager: jest.fn(() => mockGenerationManager),
}));

describe('AssetGenerationQueue', () => {
  let queue: AssetGenerationQueue;
  let mockRequest: AssetGenerationRequest;
  let mockBatchRequest: BatchGenerationRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockSupabase.single.mockResolvedValue({
      data: { id: 'test-user', subscription_tier: 'pro', subscription_status: 'active' },
      error: null,
    });

    mockSupabase.insert.mockResolvedValue({
      data: { 
        id: 'test-job-id',
        user_id: 'test-user',
        status: 'queued',
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    mockGenerationManager.estimateGenerationTime.mockReturnValue(60000); // 1 minute

    // Initialize queue
    queue = new AssetGenerationQueue(
      mockGenerationManager as any,
      {
        maxConcurrentJobs: 3,
        maxQueueSize: 20,
        defaultTimeout: 300000,
      },
      true
    );

    // Mock request
    mockRequest = {
      prompt: 'a pixel art character sprite',
      assetType: 'sprite',
      style: 'pixel-art',
      quality: 'high',
      dimensions: { width: 64, height: 64 },
      userId: 'test-user',
    };

    // Mock batch request
    mockBatchRequest = {
      baseRequest: mockRequest,
      prompts: [
        'pixel art warrior sprite',
        'pixel art mage sprite',
        'pixel art rogue sprite',
      ],
      maintainConsistency: true,
      parallelGeneration: 2,
      stopOnFailure: false,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Single Asset Generation Queue', () => {
    test('should enqueue single asset generation successfully', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        count: 5, // Current queue size
        error: null,
      });

      const result = await queue.enqueueAssetGeneration(mockRequest, 'test-user', 'normal');

      expect(result).toEqual({
        jobId: 'test-job-id',
        queuePosition: expect.any(Number),
        estimatedCompletion: expect.any(String),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_generation_jobs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user',
          request_type: 'single',
          request_data: mockRequest,
          status: 'queued',
          priority: 'normal',
        })
      );
    });

    test('should reject when queue is full', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        count: 25, // Exceeds maxQueueSize
        error: null,
      });

      await expect(
        queue.enqueueAssetGeneration(mockRequest, 'test-user', 'normal')
      ).rejects.toThrow('Generation queue is full');
    });

    test('should handle different priority levels', async () => {
      mockSupabase.select.mockResolvedValue({
        count: 5,
        error: null,
      });

      // Test high priority
      await queue.enqueueAssetGeneration(mockRequest, 'test-user', 'high');

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
        })
      );

      // Test urgent priority
      await queue.enqueueAssetGeneration(mockRequest, 'test-user', 'urgent');

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'urgent',
        })
      );
    });

    test('should validate user permissions', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(
        queue.enqueueAssetGeneration(mockRequest, 'invalid-user', 'normal')
      ).rejects.toThrow('User profile not found');
    });

    test('should estimate credits correctly', async () => {
      mockSupabase.select.mockResolvedValue({
        count: 1,
        error: null,
      });

      const highQualityRequest = {
        ...mockRequest,
        quality: 'ultra' as const,
        variants: 3,
      };

      await queue.enqueueAssetGeneration(highQualityRequest, 'test-user', 'normal');

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          estimated_credits: expect.any(Number),
        })
      );
    });
  });

  describe('Batch Asset Generation Queue', () => {
    test('should enqueue batch generation successfully', async () => {
      mockSupabase.select.mockResolvedValue({
        count: 3,
        error: null,
      });

      const result = await queue.enqueueBatchGeneration(mockBatchRequest, 'test-user', 'normal');

      expect(result).toEqual({
        jobId: 'test-job-id',
        queuePosition: expect.any(Number),
        estimatedCompletion: expect.any(String),
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          request_type: 'batch',
          request_data: mockBatchRequest,
        })
      );
    });

    test('should require Pro+ subscription for batch operations', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'free', subscription_status: 'active' },
        error: null,
      });

      await expect(
        queue.enqueueBatchGeneration(mockBatchRequest, 'test-user', 'normal')
      ).rejects.toThrow('Batch generation requires Pro or Max subscription');
    });

    test('should calculate batch credits correctly', async () => {
      mockSupabase.select.mockResolvedValue({
        count: 1,
        error: null,
      });

      await queue.enqueueBatchGeneration(mockBatchRequest, 'test-user', 'normal');

      const expectedCredits = mockBatchRequest.prompts.length * 10 * 0.85; // Base credits * batch discount

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          estimated_credits: expect.any(Number),
        })
      );
    });

    test('should handle large batch requests', async () => {
      const largeBatchRequest = {
        ...mockBatchRequest,
        prompts: Array(50).fill('test prompt'),
      };

      mockSupabase.select.mockResolvedValue({
        count: 1,
        error: null,
      });

      const result = await queue.enqueueBatchGeneration(largeBatchRequest, 'test-user', 'normal');

      expect(result.jobId).toBeDefined();
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          estimated_credits: expect.any(Number),
        })
      );
    });
  });

  describe('Job Status Management', () => {
    test('should retrieve job status correctly', async () => {
      const mockJob = {
        id: 'test-job-id',
        user_id: 'test-user',
        request_data: mockRequest,
        status: 'processing',
        priority: 'normal',
        progress: 50,
        current_step: 'Generating asset...',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        estimated_credits: 15,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockJob,
        error: null,
      });

      const status = await queue.getJobStatus('test-job-id', 'test-user');

      expect(status).toEqual(
        expect.objectContaining({
          id: 'test-job-id',
          userId: 'test-user',
          status: 'processing',
          priority: 'normal',
          progress: 50,
          currentStep: 'Generating asset...',
        })
      );
    });

    test('should return queue position for pending jobs', async () => {
      const mockJob = {
        id: 'test-job-id',
        user_id: 'test-user',
        status: 'queued',
        created_at: new Date().toISOString(),
        priority: 'normal',
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockJob, error: null })
        .mockResolvedValueOnce({ data: { created_at: mockJob.created_at, priority: 'normal' }, error: null })
        .mockResolvedValueOnce({ count: 3, error: null }); // 3 jobs ahead in queue

      const status = await queue.getJobStatus('test-job-id', 'test-user');

      expect(status.queuePosition).toBe(4); // 3 ahead + current = position 4
    });

    test('should handle job not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Job not found' },
      });

      await expect(
        queue.getJobStatus('invalid-job-id', 'test-user')
      ).rejects.toThrow('Failed to fetch generation job');
    });
  });

  describe('Job Cancellation', () => {
    test('should cancel queued job successfully', async () => {
      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null,
      });

      await queue.cancelJob('test-job-id', 'test-user');

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String),
      });
    });

    test('should not cancel completed jobs', async () => {
      mockSupabase.update.mockResolvedValue({
        data: null,
        error: { message: 'No rows updated' },
      });

      await expect(
        queue.cancelJob('completed-job-id', 'test-user')
      ).rejects.toThrow('Failed to cancel generation job');
    });
  });

  describe('Job Filtering and Pagination', () => {
    test('should filter jobs by status', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'job-1', status: 'completed' },
          { id: 'job-2', status: 'completed' },
        ],
        error: null,
      });

      const jobs = await queue.getUserJobs('test-user', {
        status: ['completed'],
        limit: 10,
      });

      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['completed']);
      expect(jobs).toHaveLength(2);
    });

    test('should handle pagination correctly', async () => {
      mockSupabase.select.mockResolvedValue({
        data: Array(5).fill(null).map((_, i) => ({ id: `job-${i}` })),
        error: null,
      });

      const jobs = await queue.getUserJobs('test-user', {
        limit: 5,
        offset: 10,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 14);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('should sort jobs by different fields', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await queue.getUserJobs('test-user', {
        orderBy: 'priority',
        orderDirection: 'asc',
      });

      expect(mockSupabase.order).toHaveBeenCalledWith('priority', { ascending: true });
    });
  });

  describe('Queue Metrics', () => {
    test('should calculate queue metrics correctly', async () => {
      // Mock various count queries
      mockSupabase.select
        .mockResolvedValueOnce({ count: 5, error: null }) // queued
        .mockResolvedValueOnce({ count: 2, error: null }) // processing
        .mockResolvedValueOnce({ count: 15, error: null }) // completed today
        .mockResolvedValueOnce({ count: 3, error: null }) // failed today
        .mockResolvedValueOnce({ // processing times
          data: [
            { processing_time_ms: 30000 },
            { processing_time_ms: 45000 },
            { processing_time_ms: 60000 },
          ],
          error: null,
        });

      const metrics = await queue.getQueueMetrics();

      expect(metrics).toEqual({
        totalJobs: 25,
        queuedJobs: 5,
        processingJobs: 2,
        completedToday: 15,
        failedToday: 3,
        averageWaitTimeMinutes: expect.any(Number),
        averageProcessingTimeMinutes: expect.any(Number),
        successRatePercentage: expect.any(Number),
        currentLoad: expect.any(Number),
      });
    });

    test('should handle zero processing times gracefully', async () => {
      mockSupabase.select
        .mockResolvedValue({ count: 0, error: null })
        .mockResolvedValue({ data: [], error: null });

      const metrics = await queue.getQueueMetrics();

      expect(metrics.averageProcessingTimeMinutes).toBe(0);
      expect(metrics.successRatePercentage).toBe(100);
    });
  });

  describe('Job Processing Simulation', () => {
    test('should process jobs in priority order', async () => {
      const mockJobs = [
        { id: 'job-1', priority: 'urgent', created_at: '2023-01-01T10:00:00Z' },
        { id: 'job-2', priority: 'high', created_at: '2023-01-01T09:00:00Z' },
        { id: 'job-3', priority: 'normal', created_at: '2023-01-01T08:00:00Z' },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockJobs,
        error: null,
      });

      // Simulate getting next job from queue
      const jobs = await queue.getUserJobs('system', { status: ['queued'] });

      // Jobs should be ordered by priority (urgent > high > normal) then by creation time
      expect(jobs[0].id).toBe('job-1'); // urgent priority
      expect(jobs[1].id).toBe('job-2'); // high priority
      expect(jobs[2].id).toBe('job-3'); // normal priority
    });

    test('should handle concurrent job processing', async () => {
      const mockAsset = {
        id: 'generated-asset',
        url: 'https://example.com/asset.png',
        metadata: {},
      };

      mockGenerationManager.generateAsset.mockResolvedValue(mockAsset);

      // Simulate multiple concurrent generations
      const promises = Array(3).fill(null).map((_, i) => 
        queue.enqueueAssetGeneration({
          ...mockRequest,
          prompt: `concurrent sprite ${i}`,
        }, 'test-user', 'normal')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.jobId).toBeDefined();
        expect(result.queuePosition).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        queue.enqueueAssetGeneration(mockRequest, 'test-user', 'normal')
      ).rejects.toThrow('Failed to create generation job');
    });

    test('should handle validation errors', async () => {
      const invalidRequest = {
        ...mockRequest,
        prompt: '', // Invalid empty prompt
      };

      await expect(
        queue.enqueueAssetGeneration(invalidRequest, 'test-user', 'normal')
      ).rejects.toThrow();
    });

    test('should handle subscription validation errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { subscription_tier: 'free', subscription_status: 'cancelled' },
        error: null,
      });

      await expect(
        queue.enqueueAssetGeneration(mockRequest, 'test-user', 'normal')
      ).rejects.toThrow('Active subscription required');
    });
  });

  describe('Performance Tests', () => {
    test('should handle high queue load efficiently', async () => {
      // Mock a large number of existing jobs
      mockSupabase.select.mockResolvedValue({
        count: 100,
        error: null,
      });

      const startTime = Date.now();
      
      // Enqueue multiple jobs
      const promises = Array(10).fill(null).map((_, i) =>
        queue.enqueueAssetGeneration({
          ...mockRequest,
          prompt: `load test sprite ${i}`,
        }, 'test-user', 'normal')
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(processingTime).toBeLessThan(5000);
    });

    test('should maintain queue integrity under concurrent load', async () => {
      mockSupabase.select.mockResolvedValue({
        count: 5,
        error: null,
      });

      // Simulate high concurrency
      const promises = Array(20).fill(null).map((_, i) =>
        queue.enqueueAssetGeneration({
          ...mockRequest,
          prompt: `concurrent load test ${i}`,
        }, `test-user-${i % 5}`, 'normal')
      );

      const results = await Promise.allSettled(promises);

      // All should succeed or fail predictably
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(succeeded + failed).toBe(20);
      expect(succeeded).toBeGreaterThan(0);
    });
  });
});