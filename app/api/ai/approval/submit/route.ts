/**
 * Asset Approval Submission API Endpoint
 * 
 * RESTful API endpoint for submitting assets for approval workflow,
 * with automated quality checks and reviewer assignment.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getAuthenticatedUser, createAuthErrorResponse } from "@/lib/auth/dev-server-auth";
import { AssetApprovalWorkflow, ApprovalWorkflowConfig } from "@/lib/ai/asset-generation/approval-workflow";
import { LLMLogger } from "@/lib/llm/monitoring/logger";
import {
  AssetGenerationError,
  ERROR_CODES,
  GeneratedAsset,
  AssetType,
} from "@/lib/ai/asset-generation/types";

interface ApprovalSubmissionRequest {
  assetId: string;
  assetType: AssetType;
  submissionNotes?: string;
  requestFastTrack?: boolean; // For priority users
  generationMetadata?: any;
}

/**
 * POST /api/ai/approval/submit
 * Submit an asset for approval workflow
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  let userId: string | undefined;
  let submissionRequest: ApprovalSubmissionRequest | undefined;

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
      submissionRequest = (await request.json()) as ApprovalSubmissionRequest;
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Validate submission request
    const validationError = validateSubmissionRequest(submissionRequest);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    // Verify asset exists and user owns it
    const { data: asset, error: assetError } = await (supabase as any)
      .from('game_assets')
      .select('*')
      .eq('id', submissionRequest.assetId)
      .eq('created_by', userId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found or access denied", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if asset is already under review
    const { data: existingReview, error: reviewCheckError } = await (supabase as any)
      .from('ai_asset_reviews')
      .select('id, status')
      .eq('asset_id', submissionRequest.assetId)
      .in('status', ['pending', 'needs_revision'])
      .single();

    if (existingReview && !reviewCheckError) {
      return NextResponse.json(
        {
          error: "Asset is already under review",
          code: "INVALID_REQUEST",
          currentReviewId: existingReview.id,
          currentStatus: existingReview.status,
        },
        { status: 409 }
      );
    }

    // Get user's subscription tier for configuration
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    // Configure approval workflow based on user tier
    const workflowConfig: Partial<ApprovalWorkflowConfig> = getWorkflowConfigForTier(
      profile?.subscription_tier || 'free'
    );

    // Add fast-track for priority users
    if (submissionRequest.requestFastTrack && 
        ['pro', 'max'].includes(profile?.subscription_tier)) {
      workflowConfig.thresholds!.autoApprove.qualityScore = 0.7; // Lower threshold for fast-track
    }

    // Initialize approval workflow
    const approvalWorkflow = new AssetApprovalWorkflow(workflowConfig, true);

    // Convert database asset to GeneratedAsset format
    const generatedAsset: GeneratedAsset = {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      url: asset.url,
      thumbnailUrl: asset.thumbnail_url,
      metadata: asset.metadata || {},
      qualityScore: asset.metadata?.qualityScore || 0.6, // Default quality score
      generatedBy: 'ai_generation', // Assuming AI-generated
      prompt: asset.metadata?.prompt || '',
      style: asset.metadata?.style || 'pixel-art',
      createdAt: asset.created_at,
      processingTime: asset.metadata?.processingTime || 0,
    };

    // Submit for approval
    const reviewData = await approvalWorkflow.submitForApproval(
      generatedAsset,
      userId,
      submissionRequest.generationMetadata
    );

    // Log successful submission
    await logger.logRequest(
      {
        id: reviewData.id,
        type: "approval_submission",
        assetId: submissionRequest.assetId,
        userId,
        fastTrack: submissionRequest.requestFastTrack,
      } as any,
      {
        id: reviewData.id,
        content: `Asset approval submission: ${asset.name}`,
        usage: { total_tokens: 0 },
        provider_id: "approval_workflow",
      } as any,
      undefined,
      "approval_workflow",
      userId,
    );

    // Prepare response based on processing result
    const response: any = {
      success: true,
      reviewId: reviewData.id,
      assetId: submissionRequest.assetId,
      status: reviewData.status,
      processingType: reviewData.autoProcessed ? 'automatic' : 'manual',
      qualityScore: reviewData.qualityScore,
      consistencyScore: reviewData.consistencyScore,
      processingTime: Date.now() - startTime,
    };

    // Add status-specific information
    if (reviewData.status === 'approved') {
      response.message = "Asset has been automatically approved";
      response.approvedAt = reviewData.approvedAt;
    } else if (reviewData.status === 'rejected') {
      response.message = "Asset was automatically rejected due to quality or content issues";
      response.rejectionReasons = analyzeRejectionReasons(reviewData);
    } else if (reviewData.status === 'pending') {
      response.message = "Asset has been submitted for manual review";
      response.estimatedReviewTime = estimateReviewTime(submissionRequest.assetType);
      response.queuePosition = await getQueuePosition(reviewData.id);
    }

    // Add reviewer information if assigned
    if (reviewData.reviewerUserId) {
      response.reviewerAssigned = true;
      response.estimatedReviewTime = "Within 24 hours";
    }

    const responseStatus = reviewData.status === 'approved' ? 200 :
                          reviewData.status === 'rejected' ? 202 :
                          202; // 202 Accepted for pending reviews

    return NextResponse.json(response, { status: responseStatus });

  } catch (error) {
    console.error("Approval submission failed:", error);

    // Log error
    if (userId && submissionRequest) {
      await logger.logRequest(
        {
          type: "approval_submission",
          assetId: submissionRequest.assetId,
          userId,
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
        error: "Approval submission failed",
        code: ERROR_CODES.INTERNAL_ERROR,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate approval submission request
 */
function validateSubmissionRequest(request: ApprovalSubmissionRequest): string | null {
  if (!request.assetId || typeof request.assetId !== 'string') {
    return "Asset ID is required and must be a string";
  }

  if (!request.assetType || !['sprite', 'background', 'tile', 'ui', 'tileset'].includes(request.assetType)) {
    return "Valid asset type is required";
  }

  if (request.submissionNotes && typeof request.submissionNotes !== 'string') {
    return "Submission notes must be a string";
  }

  if (request.submissionNotes && request.submissionNotes.length > 1000) {
    return "Submission notes cannot exceed 1000 characters";
  }

  return null;
}

/**
 * Get workflow configuration based on user tier
 */
function getWorkflowConfigForTier(tier: string): Partial<ApprovalWorkflowConfig> {
  const baseConfig: Partial<ApprovalWorkflowConfig> = {
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

  // Adjust thresholds based on tier
  switch (tier) {
    case 'max':
      // Max tier gets more lenient auto-approval
      baseConfig.thresholds!.autoApprove.qualityScore = 0.7;
      baseConfig.thresholds!.autoApprove.consistencyScore = 0.7;
      baseConfig.notifications!.escalation = true;
      break;
    
    case 'pro':
      // Pro tier gets standard settings with some benefits
      baseConfig.thresholds!.requiresReview.newUserContent = false;
      break;
    
    case 'free':
    default:
      // Free tier has stricter requirements
      baseConfig.thresholds!.autoApprove.qualityScore = 0.85;
      baseConfig.thresholds!.autoApprove.consistencyScore = 0.8;
      baseConfig.thresholds!.requiresReview.newUserContent = true;
      break;
  }

  return baseConfig;
}

/**
 * Analyze rejection reasons for user feedback
 */
function analyzeRejectionReasons(reviewData: any): string[] {
  const reasons: string[] = [];

  if (reviewData.qualityScore < 0.3) {
    reasons.push("Quality score too low");
  }

  if (reviewData.flaggedContentScore > 0.8) {
    reasons.push("Content moderation flags detected");
  }

  if (!Object.values(reviewData.technicalQuality || {}).every(Boolean)) {
    reasons.push("Technical quality issues detected");
  }

  if (reasons.length === 0) {
    reasons.push("Does not meet current approval standards");
  }

  return reasons;
}

/**
 * Estimate review time based on asset type
 */
function estimateReviewTime(assetType: AssetType): string {
  const estimationMap: { [key in AssetType]: string } = {
    sprite: "2-4 hours",
    background: "4-8 hours",
    tile: "1-3 hours",
    ui: "1-2 hours",
    tileset: "6-12 hours",
  };

  return estimationMap[assetType] || "2-6 hours";
}

/**
 * Get queue position for pending review
 */
async function getQueuePosition(reviewId: string): Promise<number> {
  // This would calculate the position in the review queue
  // For now, return a placeholder
  return Math.floor(Math.random() * 10) + 1;
}