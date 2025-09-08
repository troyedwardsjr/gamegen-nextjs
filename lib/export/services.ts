// Export System Services
// Core service classes for multi-platform game export system

import type {
  ExportJob,
  ExportArtifact,
  ExportPlatformConfig,
  ExportQueueStats,
  UserExportUsage,
  ExportAnalytics,
  ExportStatus,
  ExportPlatform,
  SubscriptionTier,
  CreateExportJobRequest,
  ExportJobResponse,
  ExportStatusResponse,
  QueueMetrics,
  SubscriptionLimits,
} from "@/types/export";

import { PLATFORM_CAPABILITIES } from "@/types/export";
import { DatabaseError } from "@/lib/supabase/utils";
import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Main export service for job management
export class ExportService {
  constructor(private isServer: boolean = false) {}

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async createExportJob(
    request: CreateExportJobRequest,
    userId: string,
  ): Promise<ExportJobResponse> {
    const supabase = await this.getClient();

    // Get user's subscription tier and validate export permissions
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new DatabaseError("User profile not found");
    }

    if (
      profile.subscription_status !== "active" &&
      profile.subscription_tier !== "free"
    ) {
      throw new DatabaseError("Subscription required for export functionality");
    }

    // Validate platform access for subscription tier
    const canExport = await this.validateExportPermissions(
      profile.subscription_tier,
      request.platform,
    );

    if (!canExport.allowed) {
      throw new DatabaseError(
        `Platform ${request.platform} not available for ${profile.subscription_tier} tier`,
        "INSUFFICIENT_TIER",
        { required_tier: canExport.required_tier },
      );
    }

    // Check daily export limits
    const usage = await this.getUserExportUsage(userId);
    const limits = this.getSubscriptionLimits(profile.subscription_tier);

    if (usage.exports_today >= limits.daily_export_limit) {
      throw new DatabaseError(
        `Daily export limit reached (${limits.daily_export_limit})`,
        "LIMIT_EXCEEDED",
        { limit: limits.daily_export_limit, used: usage.exports_today },
      );
    }

    // Create the export job
    const jobData = {
      game_id: request.game_id,
      user_id: userId,
      platform: request.platform,
      export_options: request.export_options || {},
      subscription_tier: profile.subscription_tier,
      priority: request.priority || "normal",
      status: "queued",
    };

    const { data: job, error } = await (supabase as any)
      .from("export_jobs")
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        "Failed to create export job",
        error.code,
        error.details,
        error.hint,
      );
    }

    // Update usage statistics
    await this.incrementUserExportUsage(userId, request.platform);

    // Get queue position and estimated wait time
    const queueStats = await this.getQueueStats();
    const position = await this.getJobQueuePosition(job.id);

    return {
      job: job as ExportJob,
      estimated_wait_time_minutes: this.calculateWaitTime(
        position,
        request.platform,
      ),
      queue_position: position,
    };
  }

  async getExportJobStatus(
    jobId: string,
    userId: string,
  ): Promise<ExportStatusResponse> {
    const supabase = await this.getClient();

    const { data: job, error } = await (supabase as any)
      .from("export_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to fetch export job: ${jobId}`,
        error.code,
        error.details,
      );
    }

    // Get artifacts if job is completed
    let artifacts: ExportArtifact[] = [];
    let analytics: ExportAnalytics | undefined;

    if (job.status === "completed") {
      const artifactService = new ExportArtifactService(this.isServer);

      artifacts = await artifactService.getJobArtifacts(jobId);

      const analyticsService = new ExportAnalyticsService(this.isServer);
      const analyticsResult = await analyticsService.getJobAnalytics(jobId);

      analytics = analyticsResult || undefined;
    }

    let queuePosition: number | undefined;
    let estimatedCompletion: string | undefined;

    if (job.status === "queued") {
      queuePosition = await this.getJobQueuePosition(jobId);
      estimatedCompletion = this.calculateEstimatedCompletion(
        queuePosition,
        job.platform,
      );
    }

    return {
      job: job as ExportJob,
      artifacts,
      analytics,
      queue_position: queuePosition,
      estimated_completion: estimatedCompletion,
    };
  }

  async cancelExportJob(jobId: string, userId: string): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await (supabase as any)
      .from("export_jobs")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", userId)
      .in("status", ["queued", "processing"]);

    if (error) {
      throw new DatabaseError(
        `Failed to cancel export job: ${jobId}`,
        error.code,
        error.details,
      );
    }
  }

  async getUserExportJobs(
    userId: string,
    options: {
      status?: ExportStatus[];
      platform?: ExportPlatform;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ExportJob[]> {
    const supabase = await this.getClient();

    let query = (supabase as any)
      .from("export_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options.status && options.status.length > 0) {
      query = query.in("status", options.status);
    }

    if (options.platform) {
      query = query.eq("platform", options.platform);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to fetch export jobs for user: ${userId}`,
        error.code,
        error.details,
      );
    }

    return (data || []) as ExportJob[];
  }

  // Internal helper methods
  private async validateExportPermissions(
    tier: SubscriptionTier,
    platform: ExportPlatform,
  ): Promise<{ allowed: boolean; required_tier?: SubscriptionTier }> {
    const capabilities = PLATFORM_CAPABILITIES[platform];
    const allowed = capabilities.tiers.includes(tier);

    if (!allowed) {
      return {
        allowed: false,
        required_tier: capabilities.tiers[0], // First allowed tier
      };
    }

    return { allowed: true };
  }

  private async getUserExportUsage(userId: string): Promise<UserExportUsage> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await (supabase as any)
      .from("user_export_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found is ok
      throw new DatabaseError("Failed to fetch user export usage", error.code);
    }

    return (
      (data as UserExportUsage) || {
        id: "",
        user_id: userId,
        usage_date: today,
        exports_today: 0,
        total_exports: 0,
        web_exports: 0,
        desktop_exports: 0,
        mobile_exports: 0,
        source_exports: 0,
        total_storage_used_bytes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }

  private async incrementUserExportUsage(
    userId: string,
    platform: ExportPlatform,
  ): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await (supabase as any).rpc(
      "increment_user_export_usage",
      {
        p_user_id: userId,
        p_platform: platform,
      },
    );

    if (error) {
      throw new DatabaseError("Failed to update export usage", error.code);
    }
  }

  private getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
    const limits = {
      free: {
        daily_export_limit: 5,
        concurrent_exports: 1,
        max_file_size_mb: 50,
        available_platforms: ["web", "pwa"] as ExportPlatform[],
        features: {
          source_code_export: false,
          white_label_exports: false,
          custom_branding: false,
          priority_queue: false,
          webhook_notifications: false,
          advanced_analytics: false,
        },
      },
      pro: {
        daily_export_limit: 25,
        concurrent_exports: 3,
        max_file_size_mb: 200,
        available_platforms: [
          "web",
          "pwa",
          "desktop-windows",
          "desktop-macos",
          "desktop-linux",
          "mobile-android",
          "mobile-ios",
          "source-code",
        ] as ExportPlatform[],
        features: {
          source_code_export: true,
          white_label_exports: false,
          custom_branding: false,
          priority_queue: false,
          webhook_notifications: true,
          advanced_analytics: true,
        },
      },
      max: {
        daily_export_limit: 100,
        concurrent_exports: 10,
        max_file_size_mb: 1000,
        available_platforms: [
          "web",
          "pwa",
          "desktop-windows",
          "desktop-macos",
          "desktop-linux",
          "mobile-android",
          "mobile-ios",
          "source-code",
        ] as ExportPlatform[],
        features: {
          source_code_export: true,
          white_label_exports: true,
          custom_branding: true,
          priority_queue: true,
          webhook_notifications: true,
          advanced_analytics: true,
        },
      },
      educational: {
        daily_export_limit: 15,
        concurrent_exports: 2,
        max_file_size_mb: 100,
        available_platforms: ["web", "pwa", "source-code"] as ExportPlatform[],
        features: {
          source_code_export: true,
          white_label_exports: false,
          custom_branding: false,
          priority_queue: false,
          webhook_notifications: false,
          advanced_analytics: false,
        },
      },
    };

    return limits[tier];
  }

  private async getQueueStats(): Promise<ExportQueueStats> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await (supabase as any)
      .from("export_queue_stats")
      .select("*")
      .eq("stats_date", today)
      .single();

    if (error) {
      throw new DatabaseError("Failed to fetch queue stats", error.code);
    }

    return data as ExportQueueStats;
  }

  private async getJobQueuePosition(jobId: string): Promise<number> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from("export_jobs")
      .select("created_at")
      .eq("id", jobId)
      .single();

    if (error) {
      throw new DatabaseError("Failed to get job creation time", error.code);
    }

    const { count, error: countError } = await (supabase as any)
      .from("export_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued")
      .lt("created_at", data.created_at);

    if (countError) {
      throw new DatabaseError(
        "Failed to calculate queue position",
        countError.code,
      );
    }

    return (count || 0) + 1;
  }

  private calculateWaitTime(
    position: number,
    platform: ExportPlatform,
  ): number {
    const capabilities = PLATFORM_CAPABILITIES[platform];
    const avgBuildTime = capabilities.build_time_minutes;

    // Assume 2 concurrent workers per platform type
    const estimatedWait = Math.ceil(position / 2) * avgBuildTime;

    return Math.max(1, estimatedWait);
  }

  private calculateEstimatedCompletion(
    position: number,
    platform: ExportPlatform,
  ): string {
    const waitTimeMinutes = this.calculateWaitTime(position, platform);
    const completionTime = new Date(Date.now() + waitTimeMinutes * 60 * 1000);

    return completionTime.toISOString();
  }
}

// Service for managing export artifacts
export class ExportArtifactService {
  constructor(private isServer: boolean = false) {}

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async getJobArtifacts(jobId: string): Promise<ExportArtifact[]> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from("export_artifacts")
      .select("*")
      .eq("export_job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError(
        `Failed to fetch artifacts for job: ${jobId}`,
        error.code,
        error.details,
      );
    }

    return (data || []) as ExportArtifact[];
  }

  async createArtifact(
    artifact: Omit<
      ExportArtifact,
      "id" | "created_at" | "updated_at" | "download_count"
    >,
  ): Promise<ExportArtifact> {
    const artifactData = {
      ...artifact,
      download_count: 0,
    };

    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from("export_artifacts")
      .insert(artifactData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError("Failed to create export artifact", error.code);
    }

    return data as ExportArtifact;
  }

  async incrementDownloadCount(artifactId: string): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await (supabase as any).rpc(
      "increment_artifact_downloads",
      {
        artifact_id: artifactId,
      },
    );

    if (error) {
      throw new DatabaseError("Failed to increment download count", error.code);
    }
  }
}

// Service for export analytics
export class ExportAnalyticsService {
  constructor(private isServer: boolean = false) {}

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async getJobAnalytics(jobId: string): Promise<ExportAnalytics | null> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from("export_analytics")
      .select("*")
      .eq("export_job_id", jobId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found is ok
      throw new DatabaseError(
        `Failed to fetch analytics for job: ${jobId}`,
        error.code,
        error.details,
      );
    }

    return data as ExportAnalytics | null;
  }

  async createAnalytics(
    analytics: Omit<ExportAnalytics, "id" | "created_at">,
  ): Promise<ExportAnalytics> {
    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from("export_analytics")
      .insert(analytics)
      .select()
      .single();

    if (error) {
      throw new DatabaseError("Failed to create export analytics", error.code);
    }

    return data as ExportAnalytics;
  }
}

// Service for platform configurations
export class ExportPlatformConfigService {
  constructor(private isServer: boolean = false) {}

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async getPlatformConfigs(
    platform: ExportPlatform,
  ): Promise<ExportPlatformConfig[]> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from("export_platform_configs")
      .select("*")
      .eq("platform", platform)
      .order("is_default", { ascending: false })
      .order("config_name");

    if (error) {
      throw new DatabaseError(
        `Failed to fetch configs for platform: ${platform}`,
        error.code,
        error.details,
      );
    }

    return (data || []) as ExportPlatformConfig[];
  }

  async getDefaultConfig(
    platform: ExportPlatform,
  ): Promise<ExportPlatformConfig | null> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from("export_platform_configs")
      .select("*")
      .eq("platform", platform)
      .eq("is_default", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found is ok
      throw new DatabaseError(
        `Failed to fetch default config for platform: ${platform}`,
        error.code,
        error.details,
      );
    }

    return data as ExportPlatformConfig | null;
  }
}

// Service for queue management and statistics
export class ExportQueueService {
  constructor(private isServer: boolean = false) {}

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async getQueueMetrics(): Promise<QueueMetrics> {
    const supabase = await this.getClient();

    // Get current queue stats
    const { data: stats, error: statsError } = await (supabase as any)
      .from("export_queue_stats")
      .select("*")
      .eq("stats_date", new Date().toISOString().split("T")[0])
      .single();

    if (statsError) {
      throw new DatabaseError("Failed to fetch queue metrics", statsError.code);
    }

    // Calculate success rate
    const totalJobs = stats.total_completed_today + stats.total_failed_today;
    const successRate =
      totalJobs > 0
        ? Math.round((stats.total_completed_today / totalJobs) * 100)
        : 100;

    return {
      total_jobs: stats.total_queued + stats.total_processing + totalJobs,
      queued_jobs: stats.total_queued,
      processing_jobs: stats.total_processing,
      completed_today: stats.total_completed_today,
      failed_today: stats.total_failed_today,
      average_wait_time_minutes: Math.round(stats.peak_queue_size * 5), // Estimated
      average_processing_time_minutes: Math.round(
        stats.avg_processing_time_seconds / 60,
      ),
      success_rate_percentage: successRate,
    };
  }

  async updateQueueStats(): Promise<void> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split("T")[0];

    // Count current queue status
    const [queuedCount, processingCount] = await Promise.all([
      (supabase as any)
        .from("export_jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued"),
      (supabase as any)
        .from("export_jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "processing"),
    ]);

    const { error } = await (supabase as any)
      .from("export_queue_stats")
      .upsert({
        stats_date: today,
        total_queued: queuedCount.count || 0,
        total_processing: processingCount.count || 0,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      throw new DatabaseError("Failed to update queue stats", error.code);
    }
  }
}
