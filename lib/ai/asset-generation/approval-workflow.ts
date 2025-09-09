/**
 * Asset Approval Workflow System
 * 
 * Handles manual review, auto-approval thresholds, quality validation,
 * and approval pipeline management for AI-generated assets.
 */

import {
  GeneratedAsset,
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
} from './types';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';

// Approval workflow interfaces
export interface ApprovalThresholds {
  autoApprove: {
    qualityScore: number; // 0-1 scale
    consistencyScore: number; // 0-1 scale
    flaggedContentScore: number; // 0-1 scale (higher = more likely flagged)
    communityRating?: number; // Average user rating threshold
  };
  autoReject: {
    qualityScore: number;
    flaggedContentScore: number;
    technicalIssues: boolean;
  };
  requiresReview: {
    qualityScoreRange: [number, number];
    flaggedContentRange: [number, number];
    communityReports: number; // Number of reports before requiring review
    newUserContent: boolean; // Require review for new users
  };
}

export interface AssetReviewData {
  id: string;
  assetId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision' | 'flagged';
  
  // Quality assessment
  qualityScore: number;
  consistencyScore: number;
  technicalQuality: {
    resolution: boolean;
    format: boolean;
    fileIntegrity: boolean;
    pixelArtCompliance: boolean;
  };
  
  // Content moderation
  contentFlags: {
    inappropriate: boolean;
    copyright: boolean;
    violence: boolean;
    adult: boolean;
    offensive: boolean;
    spam: boolean;
  };
  flaggedContentScore: number;
  
  // Review process
  autoProcessed: boolean;
  requiresManualReview: boolean;
  reviewerUserId?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  
  // Community feedback
  communityRating?: number;
  reportCount: number;
  likeCount: number;
  downloadCount: number;
  
  // Timestamps
  submittedAt: string;
  processedAt?: string;
  approvedAt?: string;
  
  // Revision tracking
  revisionCount: number;
  revisionRequested?: string;
  parentAssetId?: string; // For revised assets
  
  // Metadata
  generationMetadata: any;
  reviewMetadata: any;
}

export interface ReviewerAssignment {
  reviewerId: string;
  specializations: AssetType[];
  workload: number; // Current number of pending reviews
  averageReviewTime: number; // Minutes
  reviewQualityScore: number; // Based on review accuracy
  isActive: boolean;
}

export interface ApprovalWorkflowConfig {
  thresholds: ApprovalThresholds;
  reviewerPool: ReviewerAssignment[];
  escalationRules: {
    communityReports: number;
    qualityDisputes: boolean;
    reviewerDisagreement: boolean;
  };
  automatedChecks: {
    qualityValidation: boolean;
    contentModeration: boolean;
    technicalValidation: boolean;
    duplicateDetection: boolean;
  };
  notifications: {
    userApproval: boolean;
    userRejection: boolean;
    reviewerAssignment: boolean;
    escalation: boolean;
  };
}

export class AssetApprovalWorkflow {
  private config: ApprovalWorkflowConfig;
  private isServer: boolean;

  constructor(config: Partial<ApprovalWorkflowConfig>, isServer: boolean = false) {
    this.isServer = isServer;
    this.config = {
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
      reviewerPool: [],
      escalationRules: {
        communityReports: 5,
        qualityDisputes: true,
        reviewerDisagreement: true,
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
        escalation: true,
      },
      ...config,
    };
  }

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }
    return createClient();
  }

  /**
   * Submit an asset for approval workflow
   */
  async submitForApproval(
    asset: GeneratedAsset,
    userId: string,
    generationMetadata?: any
  ): Promise<AssetReviewData> {
    const supabase = await this.getClient();

    // Create initial review record
    const reviewData: Partial<AssetReviewData> = {
      assetId: asset.id,
      userId,
      status: 'pending',
      qualityScore: asset.qualityScore || 0.5,
      consistencyScore: 0.5, // Default, will be calculated
      technicalQuality: await this.validateTechnicalQuality(asset),
      contentFlags: await this.performContentModeration(asset),
      flaggedContentScore: 0, // Will be calculated
      autoProcessed: false,
      requiresManualReview: false,
      communityRating: undefined,
      reportCount: 0,
      likeCount: 0,
      downloadCount: 0,
      submittedAt: new Date().toISOString(),
      revisionCount: 0,
      generationMetadata: generationMetadata || {},
      reviewMetadata: {},
    };

    // Calculate flagged content score
    reviewData.flaggedContentScore = this.calculateFlaggedContentScore(reviewData.contentFlags!);

    // Determine if auto-processing is possible
    const autoDecision = this.evaluateAutoApproval(reviewData as AssetReviewData);
    reviewData.autoProcessed = autoDecision.canAutoProcess;
    reviewData.requiresManualReview = !autoDecision.canAutoProcess;

    // Set initial status based on auto-processing
    if (autoDecision.canAutoProcess) {
      reviewData.status = autoDecision.decision;
      reviewData.processedAt = new Date().toISOString();
      
      if (autoDecision.decision === 'approved') {
        reviewData.approvedAt = new Date().toISOString();
      }
    }

    // Save review record
    const { data: review, error } = await (supabase as any)
      .from('ai_asset_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      throw new AssetGenerationError(
        'Failed to create asset review record',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // If requires manual review, assign to reviewer
    if (reviewData.requiresManualReview) {
      await this.assignReviewer(review.id, asset.type);
    }

    // Send notifications
    if (this.config.notifications.userApproval && autoDecision.decision === 'approved') {
      await this.sendApprovalNotification(userId, asset);
    } else if (this.config.notifications.userRejection && autoDecision.decision === 'rejected') {
      await this.sendRejectionNotification(userId, asset, autoDecision.reason);
    }

    return review as AssetReviewData;
  }

  /**
   * Process manual review by reviewer
   */
  async processManualReview(
    reviewId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected' | 'needs_revision',
    reviewerNotes?: string,
    revisionRequests?: string
  ): Promise<AssetReviewData> {
    const supabase = await this.getClient();

    // Verify reviewer permissions
    await this.validateReviewerPermissions(reviewerId, reviewId);

    // Get current review
    const { data: currentReview, error: fetchError } = await (supabase as any)
      .from('ai_asset_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !currentReview) {
      throw new AssetGenerationError(
        'Review record not found',
        ERROR_CODES.NOT_FOUND
      );
    }

    if (currentReview.status !== 'pending') {
      throw new AssetGenerationError(
        'Review has already been processed',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    // Update review record
    const updateData: any = {
      status: decision,
      reviewerUserId: reviewerId,
      reviewerNotes: reviewerNotes,
      reviewedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      reviewMetadata: {
        ...currentReview.review_metadata,
        reviewDuration: Date.now() - new Date(currentReview.submitted_at).getTime(),
        reviewerDecision: decision,
      },
    };

    if (decision === 'approved') {
      updateData.approvedAt = new Date().toISOString();
    }

    if (decision === 'needs_revision') {
      updateData.revisionRequested = revisionRequests;
    }

    const { data: updatedReview, error: updateError } = await (supabase as any)
      .from('ai_asset_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      throw new AssetGenerationError(
        'Failed to update review record',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // Update reviewer metrics
    await this.updateReviewerMetrics(reviewerId, decision);

    // Send user notification
    if (this.config.notifications.userApproval && decision === 'approved') {
      await this.sendApprovalNotification(currentReview.user_id, null);
    } else if (this.config.notifications.userRejection && decision === 'rejected') {
      await this.sendRejectionNotification(currentReview.user_id, null, reviewerNotes);
    }

    // Update asset status
    await this.updateAssetStatus(currentReview.asset_id, decision);

    return updatedReview as AssetReviewData;
  }

  /**
   * Get pending reviews for a reviewer
   */
  async getPendingReviews(
    reviewerId: string,
    limit: number = 20,
    assetType?: AssetType
  ): Promise<AssetReviewData[]> {
    const supabase = await this.getClient();

    let query = (supabase as any)
      .from('ai_asset_reviews')
      .select(`
        *,
        game_assets:asset_id (
          id, name, type, url, thumbnail_url, metadata
        )
      `)
      .eq('status', 'pending')
      .eq('reviewer_user_id', reviewerId)
      .order('submitted_at', { ascending: true })
      .limit(limit);

    if (assetType) {
      query = query.eq('game_assets.type', assetType);
    }

    const { data, error } = await query;

    if (error) {
      throw new AssetGenerationError(
        'Failed to fetch pending reviews',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    return data as AssetReviewData[];
  }

  /**
   * Get review statistics
   */
  async getReviewStatistics(
    timeRange?: { start: string; end: string }
  ): Promise<{
    totalReviews: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    averageReviewTime: number;
    autoApprovalRate: number;
    qualityDistribution: { [key: string]: number };
  }> {
    const supabase = await this.getClient();

    let query = (supabase as any)
      .from('ai_asset_reviews')
      .select('*');

    if (timeRange) {
      query = query
        .gte('submitted_at', timeRange.start)
        .lte('submitted_at', timeRange.end);
    }

    const { data: reviews, error } = await query;

    if (error) {
      throw new AssetGenerationError(
        'Failed to fetch review statistics',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    const stats = {
      totalReviews: reviews.length,
      approvedCount: reviews.filter((r: any) => r.status === 'approved').length,
      rejectedCount: reviews.filter((r: any) => r.status === 'rejected').length,
      pendingCount: reviews.filter((r: any) => r.status === 'pending').length,
      averageReviewTime: 0,
      autoApprovalRate: 0,
      qualityDistribution: {
        'excellent': 0,
        'good': 0,
        'fair': 0,
        'poor': 0,
      },
    };

    // Calculate average review time
    const processedReviews = reviews.filter((r: any) => r.processed_at);
    if (processedReviews.length > 0) {
      const totalReviewTime = processedReviews.reduce((sum: number, review: any) => {
        const submitted = new Date(review.submitted_at).getTime();
        const processed = new Date(review.processed_at).getTime();
        return sum + (processed - submitted);
      }, 0);
      
      stats.averageReviewTime = Math.round(totalReviewTime / processedReviews.length / (1000 * 60)); // Minutes
    }

    // Calculate auto-approval rate
    const autoProcessedCount = reviews.filter((r: any) => r.auto_processed).length;
    stats.autoApprovalRate = Math.round((autoProcessedCount / Math.max(reviews.length, 1)) * 100);

    // Quality distribution
    reviews.forEach((review: any) => {
      const score = review.quality_score || 0;
      if (score >= 0.9) stats.qualityDistribution.excellent++;
      else if (score >= 0.7) stats.qualityDistribution.good++;
      else if (score >= 0.5) stats.qualityDistribution.fair++;
      else stats.qualityDistribution.poor++;
    });

    return stats;
  }

  /**
   * Report an asset for review
   */
  async reportAsset(
    assetId: string,
    reporterId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    const supabase = await this.getClient();

    // Create report record
    await (supabase as any)
      .from('ai_asset_reports')
      .insert({
        asset_id: assetId,
        reporter_user_id: reporterId,
        reason,
        details,
        created_at: new Date().toISOString(),
      });

    // Update report count in review record
    const { error: updateError } = await (supabase as any)
      .from('ai_asset_reviews')
      .update({
        report_count: (supabase as any).raw('report_count + 1'),
      })
      .eq('asset_id', assetId);

    if (updateError) {
      console.error('Failed to update report count:', updateError);
    }

    // Check if escalation is needed
    const { data: review } = await (supabase as any)
      .from('ai_asset_reviews')
      .select('report_count, status')
      .eq('asset_id', assetId)
      .single();

    if (review && 
        review.report_count >= this.config.escalationRules.communityReports &&
        review.status === 'approved') {
      await this.escalateForReview(assetId, 'community_reports');
    }
  }

  // Private helper methods
  private async validateTechnicalQuality(asset: GeneratedAsset): Promise<AssetReviewData['technicalQuality']> {
    // Implement technical quality validation
    return {
      resolution: true, // Check if resolution meets requirements
      format: true, // Check if format is correct
      fileIntegrity: true, // Check if file is not corrupted
      pixelArtCompliance: true, // Check if follows pixel art standards
    };
  }

  private async performContentModeration(asset: GeneratedAsset): Promise<AssetReviewData['contentFlags']> {
    // Implement content moderation checks
    // This would integrate with content moderation APIs or ML models
    return {
      inappropriate: false,
      copyright: false,
      violence: false,
      adult: false,
      offensive: false,
      spam: false,
    };
  }

  private calculateFlaggedContentScore(flags: AssetReviewData['contentFlags']): number {
    const flagWeights = {
      inappropriate: 0.3,
      copyright: 0.4,
      violence: 0.2,
      adult: 0.3,
      offensive: 0.2,
      spam: 0.1,
    };

    let score = 0;
    Object.entries(flags).forEach(([flag, isSet]) => {
      if (isSet && flagWeights[flag as keyof typeof flagWeights]) {
        score += flagWeights[flag as keyof typeof flagWeights];
      }
    });

    return Math.min(score, 1.0);
  }

  private evaluateAutoApproval(review: AssetReviewData): {
    canAutoProcess: boolean;
    decision: 'approved' | 'rejected' | 'pending';
    reason?: string;
  } {
    const { thresholds } = this.config;

    // Check for auto-rejection
    if (review.qualityScore <= thresholds.autoReject.qualityScore ||
        review.flaggedContentScore >= thresholds.autoReject.flaggedContentScore ||
        !Object.values(review.technicalQuality).every(Boolean)) {
      return {
        canAutoProcess: true,
        decision: 'rejected',
        reason: 'Quality or content standards not met',
      };
    }

    // Check for auto-approval
    if (review.qualityScore >= thresholds.autoApprove.qualityScore &&
        review.consistencyScore >= thresholds.autoApprove.consistencyScore &&
        review.flaggedContentScore <= thresholds.autoApprove.flaggedContentScore) {
      return {
        canAutoProcess: true,
        decision: 'approved',
      };
    }

    // Requires manual review
    return {
      canAutoProcess: false,
      decision: 'pending',
    };
  }

  private async assignReviewer(reviewId: string, assetType: AssetType): Promise<void> {
    const supabase = await this.getClient();

    // Find available reviewers with relevant specialization
    const { data: reviewers } = await (supabase as any)
      .from('ai_reviewers')
      .select('*')
      .contains('specializations', [assetType])
      .eq('is_active', true)
      .order('workload', { ascending: true })
      .limit(3);

    if (!reviewers || reviewers.length === 0) {
      // Assign to general reviewers if no specialists available
      const { data: generalReviewers } = await (supabase as any)
        .from('ai_reviewers')
        .select('*')
        .eq('is_active', true)
        .order('workload', { ascending: true })
        .limit(1);

      if (!generalReviewers || generalReviewers.length === 0) {
        throw new AssetGenerationError(
          'No reviewers available',
          ERROR_CODES.INTERNAL_ERROR
        );
      }

      reviewers.push(generalReviewers[0]);
    }

    // Select reviewer with lowest workload
    const selectedReviewer = reviewers[0];

    // Assign reviewer
    await (supabase as any)
      .from('ai_asset_reviews')
      .update({ reviewer_user_id: selectedReviewer.user_id })
      .eq('id', reviewId);

    // Update reviewer workload
    await (supabase as any)
      .from('ai_reviewers')
      .update({ workload: selectedReviewer.workload + 1 })
      .eq('user_id', selectedReviewer.user_id);

    // Send notification if enabled
    if (this.config.notifications.reviewerAssignment) {
      await this.sendReviewerNotification(selectedReviewer.user_id, reviewId);
    }
  }

  private async validateReviewerPermissions(reviewerId: string, reviewId: string): Promise<void> {
    const supabase = await this.getClient();

    const { data: reviewer } = await (supabase as any)
      .from('ai_reviewers')
      .select('*')
      .eq('user_id', reviewerId)
      .eq('is_active', true)
      .single();

    if (!reviewer) {
      throw new AssetGenerationError(
        'Unauthorized reviewer',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const { data: review } = await (supabase as any)
      .from('ai_asset_reviews')
      .select('reviewer_user_id')
      .eq('id', reviewId)
      .single();

    if (!review || review.reviewer_user_id !== reviewerId) {
      throw new AssetGenerationError(
        'Review not assigned to this reviewer',
        ERROR_CODES.UNAUTHORIZED
      );
    }
  }

  private async updateReviewerMetrics(reviewerId: string, decision: string): Promise<void> {
    const supabase = await this.getClient();

    // Update reviewer statistics
    await (supabase as any)
      .from('ai_reviewers')
      .update({
        workload: (supabase as any).raw('workload - 1'),
        total_reviews: (supabase as any).raw('total_reviews + 1'),
      })
      .eq('user_id', reviewerId);
  }

  private async updateAssetStatus(assetId: string, decision: string): Promise<void> {
    const supabase = await this.getClient();

    const status = decision === 'approved' ? 'active' : 
                  decision === 'rejected' ? 'rejected' : 'pending_revision';

    await (supabase as any)
      .from('game_assets')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId);
  }

  private async escalateForReview(assetId: string, reason: string): Promise<void> {
    const supabase = await this.getClient();

    // Mark for escalation
    await (supabase as any)
      .from('ai_asset_reviews')
      .update({
        status: 'pending',
        requires_manual_review: true,
        review_metadata: (supabase as any).raw(`review_metadata || '{"escalated": true, "escalation_reason": "${reason}"}'::jsonb`),
      })
      .eq('asset_id', assetId);

    // Assign to senior reviewer
    // This would implement escalation logic
  }

  private async sendApprovalNotification(userId: string, asset: GeneratedAsset | null): Promise<void> {
    // Implement notification sending
    console.log(`Sending approval notification to user ${userId}`);
  }

  private async sendRejectionNotification(userId: string, asset: GeneratedAsset | null, reason?: string): Promise<void> {
    // Implement notification sending
    console.log(`Sending rejection notification to user ${userId}, reason: ${reason}`);
  }

  private async sendReviewerNotification(reviewerId: string, reviewId: string): Promise<void> {
    // Implement notification sending
    console.log(`Assigning review ${reviewId} to reviewer ${reviewerId}`);
  }
}