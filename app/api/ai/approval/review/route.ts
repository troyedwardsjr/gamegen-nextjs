/**
 * Asset Review Management API Endpoint
 * 
 * RESTful API endpoint for reviewers to manage asset reviews,
 * process approvals/rejections, and track review progress.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetApprovalWorkflow } from "@/lib/ai/asset-generation/approval-workflow";
import { LLMLogger } from "@/lib/llm/monitoring/logger";
import {
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
} from "@/lib/ai/asset-generation/types";

interface ReviewDecisionRequest {
  reviewId: string;
  decision: 'approved' | 'rejected' | 'needs_revision';
  reviewerNotes?: string;
  revisionRequests?: string;
  qualityAssessment?: {
    overrideQualityScore?: number;
    consistencyScore?: number;
    technicalIssues?: string[];
    contentConcerns?: string[];
  };
}

interface ReviewListRequest {
  assetType?: AssetType;
  status?: 'pending' | 'in_review' | 'completed';
  limit?: number;
  offset?: number;
  sortBy?: 'submitted_at' | 'quality_score' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * GET /api/ai/approval/review
 * Get pending reviews for the authenticated reviewer
 */
export async function GET(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;

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
      }
    );

    const { user, error: authError } = await getAuthenticatedUser(supabase, request);

    if (authError || !user) {
      const errorResponse = createAuthErrorResponse(authError, true);
      return NextResponse.json(
        { code: "UNAUTHORIZED", ...errorResponse },
        { status: 401 }
      );
    }

    userId = user.id;

    // Verify user is an active reviewer
    const { data: reviewer, error: reviewerError } = await (supabase as any)
      .from('ai_reviewers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        { error: "Not authorized as a reviewer", code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const assetType = url.searchParams.get('assetType') as AssetType | undefined;
    const status = url.searchParams.get('status') as 'pending' | 'in_review' | 'completed' | undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') as 'submitted_at' | 'quality_score' | 'priority' || 'submitted_at';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';

    // Initialize approval workflow
    const approvalWorkflow = new AssetApprovalWorkflow({}, true);

    // Get pending reviews for this reviewer
    const reviews = await approvalWorkflow.getPendingReviews(userId, limit, assetType);

    // Get additional review statistics
    const stats = await getReviewerStats(supabase, userId);

    // Get review queue information
    const queueInfo = await getReviewQueueInfo(supabase, userId);

    return NextResponse.json({
      success: true,
      reviewer: {
        id: reviewer.id,
        userId: reviewer.user_id,
        specializations: reviewer.specializations,
        experienceLevel: reviewer.experience_level,
        currentWorkload: reviewer.workload,
        maxConcurrentReviews: reviewer.max_concurrent_reviews,
        totalReviews: reviewer.total_reviews,
        averageReviewTime: reviewer.average_review_time,
        reviewQualityScore: reviewer.review_quality_score,
      },
      reviews: reviews.map(review => ({
        id: review.id,
        assetId: review.assetId,
        submittedAt: review.submittedAt,
        qualityScore: review.qualityScore,
        consistencyScore: review.consistencyScore,
        flaggedContentScore: review.flaggedContentScore,
        assetInfo: review.generationMetadata?.assetInfo || {},
        urgency: calculateReviewUrgency(review),
      })),
      statistics: stats,
      queueInfo,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error("Failed to get reviewer dashboard:", error);

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.NOT_FOUND ? 404 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to retrieve reviewer dashboard",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/approval/review
 * Process a review decision
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let reviewRequest: ReviewDecisionRequest | undefined;

  const logger = new LLMLogger({
    enabled: true,
    log_requests: true,
    log_responses: true,
    log_errors: true,
    sensitive_data_masking: true,
  });

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
      }
    );

    const { user, error: authError } = await getAuthenticatedUser(supabase, request);

    if (authError || !user) {
      const errorResponse = createAuthErrorResponse(authError, true);
      return NextResponse.json(
        { code: "UNAUTHORIZED", ...errorResponse },
        { status: 401 }
      );
    }

    userId = user.id;

    // Parse and validate request body
    try {
      reviewRequest = (await request.json()) as ReviewDecisionRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Validate review decision request
    const validationError = validateReviewDecisionRequest(reviewRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Verify user is an active reviewer
    const { data: reviewer, error: reviewerError } = await (supabase as any)
      .from('ai_reviewers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        { error: "Not authorized as a reviewer", code: "UNAUTHORIZED" },
        { status: 403 }
      );
    }

    // Initialize approval workflow
    const approvalWorkflow = new AssetApprovalWorkflow({}, true);

    // Process the review decision
    const updatedReview = await approvalWorkflow.processManualReview(
      reviewRequest.reviewId,
      userId,
      reviewRequest.decision,
      reviewRequest.reviewerNotes,
      reviewRequest.revisionRequests
    );

    // Apply quality assessment overrides if provided
    if (reviewRequest.qualityAssessment) {
      await applyQualityOverrides(
        supabase, 
        reviewRequest.reviewId, 
        reviewRequest.qualityAssessment
      );
    }

    // Log successful review
    await logger.logRequest(
      {
        id: updatedReview.id,
        type: "review_decision",
        reviewId: reviewRequest.reviewId,
        decision: reviewRequest.decision,
        reviewerId: userId,
      } as any,
      {
        id: updatedReview.id,
        content: `Review decision: ${reviewRequest.decision}`,
        usage: { total_tokens: 0 },
        provider_id: "approval_workflow",
      } as any,
      undefined,
      "approval_workflow",
      userId,
    );

    // Prepare response based on decision
    const response: any = {
      success: true,
      reviewId: updatedReview.id,
      assetId: updatedReview.assetId,
      decision: reviewRequest.decision,
      processedAt: updatedReview.processedAt,
      processingTime: Date.now() - startTime,
    };

    // Add decision-specific information
    if (reviewRequest.decision === 'approved') {
      response.message = "Asset has been approved";
      response.approvedAt = updatedReview.approvedAt;
    } else if (reviewRequest.decision === 'rejected') {
      response.message = "Asset has been rejected";
      response.rejectionReasons = reviewRequest.reviewerNotes;
    } else if (reviewRequest.decision === 'needs_revision') {
      response.message = "Asset requires revision";
      response.revisionRequests = reviewRequest.revisionRequests;
    }

    // Update reviewer stats
    const updatedStats = await updateReviewerStats(supabase, userId, reviewRequest.decision);
    response.reviewerStats = updatedStats;

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Review decision processing failed:", error);

    // Log error
    if (userId && reviewRequest) {
      await logger.logRequest(
        {
          type: "review_decision",
          reviewId: reviewRequest.reviewId,
          decision: reviewRequest.decision,
          reviewerId: userId,
        } as any,
        undefined,
        error instanceof AssetGenerationError
          ? error
          : new AssetGenerationError(
              error instanceof Error ? error.message : "Unknown error",
              ERROR_CODES.INTERNAL_ERROR,
            ),
        undefined,
        userId,
      );
    }

    if (error instanceof AssetGenerationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { 
          status: error.code === ERROR_CODES.UNAUTHORIZED ? 401 : 
                 error.code === ERROR_CODES.NOT_FOUND ? 404 :
                 error.code === ERROR_CODES.INVALID_REQUEST ? 400 : 500 
        }
      );
    }

    return NextResponse.json(
      { 
        error: "Review decision processing failed",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate review decision request
 */
function validateReviewDecisionRequest(request: ReviewDecisionRequest): string | null {
  if (!request.reviewId || typeof request.reviewId !== 'string') {
    return "Review ID is required and must be a string";
  }

  if (!request.decision || !['approved', 'rejected', 'needs_revision'].includes(request.decision)) {
    return "Valid decision is required (approved, rejected, needs_revision)";
  }

  if (request.decision === 'needs_revision' && !request.revisionRequests) {
    return "Revision requests are required when decision is 'needs_revision'";
  }

  if (request.reviewerNotes && typeof request.reviewerNotes !== 'string') {
    return "Reviewer notes must be a string";
  }

  if (request.reviewerNotes && request.reviewerNotes.length > 2000) {
    return "Reviewer notes cannot exceed 2000 characters";
  }

  if (request.qualityAssessment) {
    const qa = request.qualityAssessment;
    
    if (qa.overrideQualityScore && (qa.overrideQualityScore < 0 || qa.overrideQualityScore > 1)) {
      return "Quality score override must be between 0 and 1";
    }

    if (qa.consistencyScore && (qa.consistencyScore < 0 || qa.consistencyScore > 1)) {
      return "Consistency score must be between 0 and 1";
    }
  }

  return null;
}

/**
 * Calculate review urgency based on various factors
 */
function calculateReviewUrgency(review: any): 'low' | 'medium' | 'high' | 'urgent' {
  const hoursWaiting = (Date.now() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60);
  
  if (hoursWaiting > 24) return 'urgent';
  if (hoursWaiting > 12) return 'high';
  if (hoursWaiting > 4) return 'medium';
  return 'low';
}

/**
 * Get reviewer statistics
 */
async function getReviewerStats(supabase: any, userId: string) {
  const { data: stats } = await supabase
    .from('ai_reviewers')
    .select(`
      total_reviews,
      total_approved,
      total_rejected,
      average_review_time,
      review_quality_score
    `)
    .eq('user_id', userId)
    .single();

  return {
    totalReviews: stats?.total_reviews || 0,
    totalApproved: stats?.total_approved || 0,
    totalRejected: stats?.total_rejected || 0,
    averageReviewTime: stats?.average_review_time || 0,
    reviewQualityScore: stats?.review_quality_score || 0.5,
    approvalRate: stats?.total_reviews > 0 
      ? Math.round((stats.total_approved / stats.total_reviews) * 100)
      : 0,
  };
}

/**
 * Get review queue information
 */
async function getReviewQueueInfo(supabase: any, userId: string) {
  const { data: queueData } = await supabase
    .from('ai_asset_reviews')
    .select('*')
    .eq('reviewer_user_id', userId)
    .eq('status', 'pending');

  const { data: globalQueue } = await supabase
    .from('ai_asset_reviews')
    .select('id')
    .eq('status', 'pending')
    .is('reviewer_user_id', null);

  return {
    myPendingReviews: queueData?.length || 0,
    unassignedReviews: globalQueue?.length || 0,
    estimatedNewAssignments: Math.min(globalQueue?.length || 0, 5), // Max 5 new assignments
  };
}

/**
 * Apply quality assessment overrides
 */
async function applyQualityOverrides(
  supabase: any, 
  reviewId: string, 
  qualityAssessment: ReviewDecisionRequest['qualityAssessment']
) {
  const updateData: any = {};

  if (qualityAssessment?.overrideQualityScore !== undefined) {
    updateData.quality_score = qualityAssessment.overrideQualityScore;
  }

  if (qualityAssessment?.consistencyScore !== undefined) {
    updateData.consistency_score = qualityAssessment.consistencyScore;
  }

  if (qualityAssessment?.technicalIssues || qualityAssessment?.contentConcerns) {
    updateData.review_metadata = supabase.raw(`
      review_metadata || '${JSON.stringify({
        qualityOverrides: qualityAssessment,
        overriddenAt: new Date().toISOString(),
      })}'::jsonb
    `);
  }

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('ai_asset_reviews')
      .update(updateData)
      .eq('id', reviewId);
  }
}

/**
 * Update reviewer statistics after decision
 */
async function updateReviewerStats(supabase: any, userId: string, decision: string) {
  const updateData: any = {
    workload: supabase.raw('workload - 1'),
    total_reviews: supabase.raw('total_reviews + 1'),
  };

  if (decision === 'approved') {
    updateData.total_approved = supabase.raw('total_approved + 1');
  } else if (decision === 'rejected') {
    updateData.total_rejected = supabase.raw('total_rejected + 1');
  }

  const { data } = await supabase
    .from('ai_reviewers')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  return data;
}