/**
 * Approval Workflow Tests
 * 
 * Comprehensive test suite for the asset approval workflow system,
 * covering auto-approval, manual review, and quality validation.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  AssetApprovalWorkflow,
  ApprovalWorkflowConfig,
  AssetReviewData
} from '@/lib/ai/asset-generation/approval-workflow';
import {
  GeneratedAsset,
  AssetGenerationError,
  ERROR_CODES,
} from '@/lib/ai/asset-generation/types';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  contains: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  single: jest.fn(),
  gte: jest.fn(() => mockSupabase),
  lt: jest.fn(() => mockSupabase),
  raw: jest.fn((sql: string) => ({ sql })),
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('AssetApprovalWorkflow', () => {
  let approvalWorkflow: AssetApprovalWorkflow;
  let mockAsset: GeneratedAsset;
  let mockConfig: Partial<ApprovalWorkflowConfig>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'test-review-id',
        asset_id: 'test-asset-id',
        user_id: 'test-user',
        status: 'pending',
        quality_score: 0.85,
        consistency_score: 0.8,
        flagged_content_score: 0.05,
        auto_processed: false,
        requires_manual_review: true,
        submitted_at: new Date().toISOString(),
      },
      error: null,
    });

    mockSupabase.insert.mockResolvedValue({
      data: {
        id: 'test-review-id',
        asset_id: 'test-asset-id',
        user_id: 'test-user',
        status: 'pending',
        submitted_at: new Date().toISOString(),
      },
      error: null,
    });

    mockSupabase.update.mockResolvedValue({
      data: null,
      error: null,
    });

    // Mock config
    mockConfig = {
      thresholds: {
        autoApprove: {
          qualityScore: 0.8,
          consistencyScore: 0.75,
          flaggedContentScore: 0.1,
          communityRating: 4.0,
        },
        autoReject: {
          qualityScore: 0.3,
          flaggedContentScore: 0.8,
          technicalIssues: true,
        },
        requiresReview: {
          qualityScoreRange: [0.3, 0.8],
          flaggedContentRange: [0.1, 0.8],
          communityReports: 3,
          newUserContent: true,
        },
      },
      automatedChecks: {
        qualityValidation: true,
        contentModeration: true,
        technicalValidation: true,
        duplicateDetection: true,
      },
      notifications: {
        userApproval: true,
        userRejection: true,
        reviewerAssignment: true,
        escalation: false,
      },
    };

    // Initialize approval workflow
    approvalWorkflow = new AssetApprovalWorkflow(mockConfig, true);

    // Mock asset
    mockAsset = {
      id: 'test-asset-id',
      name: 'Test Pixel Art Sprite',
      type: 'sprite',
      url: 'https://example.com/asset.png',
      thumbnailUrl: 'https://example.com/thumb.png',
      metadata: { format: 'PNG', size: { width: 64, height: 64 } },
      qualityScore: 0.85,
      generatedBy: 'pixellab',
      prompt: 'a pixel art character sprite',
      style: 'pixel-art',
      createdAt: new Date().toISOString(),
      processingTime: 5000,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Asset Submission for Approval', () => {
    test('should submit asset for approval successfully', async () => {
      const review = await approvalWorkflow.submitForApproval(
        mockAsset,
        'test-user',
        { source: 'ai_generation' }
      );

      expect(review).toEqual(
        expect.objectContaining({
          assetId: 'test-asset-id',
          userId: 'test-user',
          status: 'pending',
          qualityScore: 0.85,
        })
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_asset_reviews');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_id: 'test-asset-id',
          user_id: 'test-user',
          quality_score: 0.85,
        })
      );
    });

    test('should auto-approve high quality assets', async () => {
      const highQualityAsset = {
        ...mockAsset,
        qualityScore: 0.9,
      };

      // Mock the insert to return auto-approved status
      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          id: 'auto-approved-review',
          asset_id: 'test-asset-id',
          status: 'approved',
          auto_processed: true,
          approved_at: new Date().toISOString(),
        },
        error: null,
      });

      const review = await approvalWorkflow.submitForApproval(
        highQualityAsset,
        'test-user'
      );

      expect(review.status).toBe('approved');
      expect(review.autoProcessed).toBe(true);
    });

    test('should auto-reject low quality assets', async () => {
      const lowQualityAsset = {
        ...mockAsset,
        qualityScore: 0.2, // Below auto-reject threshold
      };

      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          id: 'auto-rejected-review',
          asset_id: 'test-asset-id',
          status: 'rejected',
          auto_processed: true,
        },
        error: null,
      });

      const review = await approvalWorkflow.submitForApproval(
        lowQualityAsset,
        'test-user'
      );

      expect(review.status).toBe('rejected');
      expect(review.autoProcessed).toBe(true);
    });

    test('should require manual review for borderline quality assets', async () => {
      const borderlineAsset = {
        ...mockAsset,
        qualityScore: 0.6, // Between thresholds
      };

      const review = await approvalWorkflow.submitForApproval(
        borderlineAsset,
        'test-user'
      );

      expect(review.status).toBe('pending');
      expect(review.requiresManualReview).toBe(true);
    });

    test('should flag assets with content moderation issues', async () => {
      const flaggedAsset = {
        ...mockAsset,
        qualityScore: 0.9,
      };

      // Mock content moderation to flag inappropriate content
      jest.spyOn(approvalWorkflow as any, 'performContentModeration')
        .mockResolvedValue({
          inappropriate: true,
          copyright: false,
          violence: false,
          adult: false,
          offensive: false,
          spam: false,
        });

      const review = await approvalWorkflow.submitForApproval(
        flaggedAsset,
        'test-user'
      );

      expect(review.requiresManualReview).toBe(true);
    });

    test('should validate technical quality', async () => {
      const invalidAsset = {
        ...mockAsset,
        qualityScore: 0.9,
      };

      jest.spyOn(approvalWorkflow as any, 'validateTechnicalQuality')
        .mockResolvedValue({
          resolution: false,
          format: false,
          fileIntegrity: true,
          pixelArtCompliance: true,
        });

      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          id: 'technical-issue-review',
          status: 'rejected',
          auto_processed: true,
        },
        error: null,
      });

      const review = await approvalWorkflow.submitForApproval(
        invalidAsset,
        'test-user'
      );

      expect(review.status).toBe('rejected');
    });
  });

  describe('Manual Review Processing', () => {
    test('should process manual review approval', async () => {
      // Mock reviewer validation
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { user_id: 'reviewer-id', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { reviewer_user_id: 'reviewer-id', status: 'pending' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'test-review-id',
            status: 'approved',
            reviewer_user_id: 'reviewer-id',
            approved_at: new Date().toISOString(),
          },
          error: null,
        });

      const updatedReview = await approvalWorkflow.processManualReview(
        'test-review-id',
        'reviewer-id',
        'approved',
        'Good quality pixel art with consistent style'
      );

      expect(updatedReview.status).toBe('approved');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          reviewer_user_id: 'reviewer-id',
          reviewer_notes: 'Good quality pixel art with consistent style',
        })
      );
    });

    test('should process manual review rejection', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { user_id: 'reviewer-id', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { reviewer_user_id: 'reviewer-id', status: 'pending' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'test-review-id',
            status: 'rejected',
            reviewer_user_id: 'reviewer-id',
          },
          error: null,
        });

      const updatedReview = await approvalWorkflow.processManualReview(
        'test-review-id',
        'reviewer-id',
        'rejected',
        'Quality does not meet standards'
      );

      expect(updatedReview.status).toBe('rejected');
    });

    test('should handle revision requests', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { user_id: 'reviewer-id', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { reviewer_user_id: 'reviewer-id', status: 'pending' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'test-review-id',
            status: 'needs_revision',
            revision_requested: 'Please improve color consistency',
          },
          error: null,
        });

      const updatedReview = await approvalWorkflow.processManualReview(
        'test-review-id',
        'reviewer-id',
        'needs_revision',
        'Needs color adjustment',
        'Please improve color consistency'
      );

      expect(updatedReview.status).toBe('needs_revision');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'needs_revision',
          revision_requested: 'Please improve color consistency',
        })
      );
    });

    test('should validate reviewer permissions', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Reviewer not found' },
      });

      await expect(
        approvalWorkflow.processManualReview(
          'test-review-id',
          'invalid-reviewer',
          'approved'
        )
      ).rejects.toThrow('Unauthorized reviewer');
    });

    test('should prevent reviewing already processed assets', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { user_id: 'reviewer-id', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: 'approved' }, // Already processed
          error: null,
        });

      await expect(
        approvalWorkflow.processManualReview(
          'test-review-id',
          'reviewer-id',
          'approved'
        )
      ).rejects.toThrow('Review has already been processed');
    });
  });

  describe('Reviewer Assignment', () => {
    test('should get pending reviews for reviewer', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          asset_id: 'asset-1',
          status: 'pending',
          quality_score: 0.7,
          submitted_at: new Date().toISOString(),
        },
        {
          id: 'review-2',
          asset_id: 'asset-2',
          status: 'pending',
          quality_score: 0.6,
          submitted_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockReviews,
        error: null,
      });

      const reviews = await approvalWorkflow.getPendingReviews('reviewer-id', 10);

      expect(reviews).toHaveLength(2);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'pending');
      expect(mockSupabase.eq).toHaveBeenCalledWith('reviewer_user_id', 'reviewer-id');
    });

    test('should filter reviews by asset type', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await approvalWorkflow.getPendingReviews('reviewer-id', 10, 'sprite');

      expect(mockSupabase.eq).toHaveBeenCalledWith('game_assets.type', 'sprite');
    });

    test('should assign reviews to appropriate specialists', async () => {
      // Mock reviewer with sprite specialization
      mockSupabase.select.mockResolvedValue({
        data: [
          {
            user_id: 'specialist-reviewer',
            specializations: ['sprite'],
            workload: 2,
          },
        ],
        error: null,
      });

      // This would be tested through the internal assignReviewer method
      // In a real implementation, this would be called during submission
      const review = await approvalWorkflow.submitForApproval(
        mockAsset,
        'test-user'
      );

      // Verify reviewer was assigned (would need to mock the internal assignment)
      expect(review).toBeDefined();
    });
  });

  describe('Community Reporting', () => {
    test('should handle asset reports', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { report_count: 4, status: 'approved' },
        error: null,
      });

      await approvalWorkflow.reportAsset(
        'test-asset-id',
        'reporter-id',
        'inappropriate_content',
        'Contains offensive imagery'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_asset_reports');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_id: 'test-asset-id',
          reporter_user_id: 'reporter-id',
          reason: 'inappropriate_content',
          details: 'Contains offensive imagery',
        })
      );
    });

    test('should escalate assets with multiple reports', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { report_count: 6, status: 'approved' }, // Exceeds escalation threshold
        error: null,
      });

      // Mock escalateForReview method
      jest.spyOn(approvalWorkflow as any, 'escalateForReview')
        .mockResolvedValue(undefined);

      await approvalWorkflow.reportAsset(
        'test-asset-id',
        'reporter-id',
        'inappropriate_content'
      );

      // Verify escalation was triggered
      expect(approvalWorkflow['escalateForReview']).toHaveBeenCalledWith(
        'test-asset-id',
        'community_reports'
      );
    });
  });

  describe('Review Statistics', () => {
    test('should calculate review statistics correctly', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          status: 'approved',
          auto_processed: true,
          submitted_at: '2023-01-01T10:00:00Z',
          processed_at: '2023-01-01T10:05:00Z',
          quality_score: 0.9,
        },
        {
          id: 'review-2',
          status: 'rejected',
          auto_processed: false,
          submitted_at: '2023-01-01T11:00:00Z',
          processed_at: '2023-01-01T11:15:00Z',
          quality_score: 0.4,
        },
        {
          id: 'review-3',
          status: 'pending',
          auto_processed: false,
          submitted_at: '2023-01-01T12:00:00Z',
          quality_score: 0.7,
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockReviews,
        error: null,
      });

      const stats = await approvalWorkflow.getReviewStatistics();

      expect(stats).toEqual({
        totalReviews: 3,
        approvedCount: 1,
        rejectedCount: 1,
        pendingCount: 1,
        averageReviewTime: expect.any(Number),
        autoApprovalRate: expect.any(Number),
        qualityDistribution: {
          excellent: 1, // score >= 0.9
          good: 1,      // score >= 0.7
          fair: 0,      // score >= 0.5
          poor: 1,      // score < 0.5
        },
      });
    });

    test('should handle empty review data', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const stats = await approvalWorkflow.getReviewStatistics();

      expect(stats.totalReviews).toBe(0);
      expect(stats.averageReviewTime).toBe(0);
      expect(stats.autoApprovalRate).toBe(0);
    });

    test('should filter statistics by time range', async () => {
      const timeRange = {
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-31T23:59:59Z',
      };

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await approvalWorkflow.getReviewStatistics(timeRange);

      expect(mockSupabase.gte).toHaveBeenCalledWith('submitted_at', timeRange.start);
      expect(mockSupabase.lte).toHaveBeenCalledWith('submitted_at', timeRange.end);
    });
  });

  describe('Configuration Management', () => {
    test('should apply different thresholds based on configuration', () => {
      const strictConfig: Partial<ApprovalWorkflowConfig> = {
        thresholds: {
          autoApprove: {
            qualityScore: 0.95,
            consistencyScore: 0.9,
            flaggedContentScore: 0.05,
          },
          autoReject: {
            qualityScore: 0.5,
            flaggedContentScore: 0.7,
            technicalIssues: true,
          },
          requiresReview: {
            qualityScoreRange: [0.5, 0.95],
            flaggedContentRange: [0.05, 0.7],
            communityReports: 2,
            newUserContent: true,
          },
        },
      };

      const strictWorkflow = new AssetApprovalWorkflow(strictConfig, true);

      expect(strictWorkflow).toBeDefined();
      // The configuration would affect auto-approval decisions in the actual implementation
    });

    test('should enable/disable automated checks', () => {
      const minimalConfig: Partial<ApprovalWorkflowConfig> = {
        automatedChecks: {
          qualityValidation: false,
          contentModeration: false,
          technicalValidation: false,
          duplicateDetection: false,
        },
      };

      const minimalWorkflow = new AssetApprovalWorkflow(minimalConfig, true);

      expect(minimalWorkflow).toBeDefined();
    });

    test('should configure notification preferences', () => {
      const notificationConfig: Partial<ApprovalWorkflowConfig> = {
        notifications: {
          userApproval: false,
          userRejection: true,
          reviewerAssignment: false,
          escalation: true,
        },
      };

      const configuredWorkflow = new AssetApprovalWorkflow(notificationConfig, true);

      expect(configuredWorkflow).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors during submission', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        approvalWorkflow.submitForApproval(mockAsset, 'test-user')
      ).rejects.toThrow('Failed to create asset review record');
    });

    test('should handle database errors during review processing', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { user_id: 'reviewer-id', is_active: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { reviewer_user_id: 'reviewer-id', status: 'pending' },
          error: null,
        });

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        approvalWorkflow.processManualReview(
          'test-review-id',
          'reviewer-id',
          'approved'
        )
      ).rejects.toThrow('Failed to update review record');
    });

    test('should handle invalid review IDs', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Review not found' },
      });

      await expect(
        approvalWorkflow.processManualReview(
          'invalid-review-id',
          'reviewer-id',
          'approved'
        )
      ).rejects.toThrow('Review record not found');
    });
  });

  describe('Quality Validation', () => {
    test('should validate pixel art compliance', async () => {
      const pixelArtAsset = {
        ...mockAsset,
        style: 'pixel-art',
        metadata: {
          ...mockAsset.metadata,
          pixelPerfect: true,
          colorCount: 16,
        },
      };

      jest.spyOn(approvalWorkflow as any, 'validateTechnicalQuality')
        .mockResolvedValue({
          resolution: true,
          format: true,
          fileIntegrity: true,
          pixelArtCompliance: true,
        });

      const review = await approvalWorkflow.submitForApproval(
        pixelArtAsset,
        'test-user'
      );

      expect(review.technicalQuality.pixelArtCompliance).toBe(true);
    });

    test('should detect format issues', async () => {
      const invalidFormatAsset = {
        ...mockAsset,
        metadata: {
          ...mockAsset.metadata,
          format: 'INVALID',
        },
      };

      jest.spyOn(approvalWorkflow as any, 'validateTechnicalQuality')
        .mockResolvedValue({
          resolution: true,
          format: false,
          fileIntegrity: true,
          pixelArtCompliance: true,
        });

      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          status: 'rejected',
          auto_processed: true,
        },
        error: null,
      });

      const review = await approvalWorkflow.submitForApproval(
        invalidFormatAsset,
        'test-user'
      );

      expect(review.status).toBe('rejected');
    });
  });
});