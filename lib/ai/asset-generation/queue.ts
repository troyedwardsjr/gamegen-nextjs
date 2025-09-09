/**
 * Asset Generation Queue Management System
 * 
 * Comprehensive queue management for AI asset generation requests with
 * priority handling, load balancing, batch processing, and resource optimization.
 */

import { 
  GenerationJob,
  AssetGenerationRequest, 
  BatchGenerationRequest,
  AssetGenerationResponse,
  BatchGenerationResponse,
  AssetGenerationError,
  ERROR_CODES,
  GeneratedAsset,
} from './types';
import { AssetGenerationManager } from './manager';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import { DatabaseError } from '@/lib/supabase/utils';

interface QueueConfig {
  maxConcurrentJobs: number;
  maxQueueSize: number;
  defaultTimeout: number;
  priorityWeights: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  retryDelays: number[]; // Array of delays in milliseconds for each retry
}

interface QueueMetrics {
  totalJobs: number;
  queuedJobs: number;
  processingJobs: number;
  completedToday: number;
  failedToday: number;
  averageWaitTimeMinutes: number;
  averageProcessingTimeMinutes: number;
  successRatePercentage: number;
  currentLoad: number; // 0-1 scale
}

interface JobProgressUpdate {
  jobId: string;
  progress: number; // 0-100
  currentStep: string;
  estimatedCompletion?: string;
  intermediateResults?: any[];
}

export class AssetGenerationQueue {
  private generationManager: AssetGenerationManager;
  private config: QueueConfig;
  private isServer: boolean;
  private processingJobs = new Map<string, AbortController>();
  private queueStats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalProcessingTime: 0,
  };

  constructor(
    generationManager: AssetGenerationManager,
    config: Partial<QueueConfig> = {},
    isServer: boolean = false
  ) {
    this.generationManager = generationManager;
    this.isServer = isServer;
    this.config = {
      maxConcurrentJobs: 5,
      maxQueueSize: 100,
      defaultTimeout: 300000, // 5 minutes
      priorityWeights: {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      },
      retryDelays: [5000, 15000, 30000], // 5s, 15s, 30s
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
   * Add a single asset generation job to the queue
   */
  async enqueueAssetGeneration(
    request: AssetGenerationRequest,
    userId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{ jobId: string; queuePosition: number; estimatedCompletion: string }> {
    const supabase = await this.getClient();

    // Validate user can create generation jobs
    await this.validateUserPermissions(userId, 'single');

    // Check queue capacity
    const currentQueueSize = await this.getCurrentQueueSize();
    if (currentQueueSize >= this.config.maxQueueSize) {
      throw new AssetGenerationError(
        'Generation queue is full. Please try again later.',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        undefined,
        true
      );
    }

    // Estimate credits required
    const estimatedCredits = await this.estimateCredits(request);

    // Validate user has sufficient credits
    await this.validateUserCredits(userId, estimatedCredits);

    // Create job record
    const jobData = {
      user_id: userId,
      request_type: 'single' as const,
      request_data: request,
      status: 'queued' as const,
      priority,
      estimated_credits: estimatedCredits,
      max_retries: 3,
      retry_count: 0,
      progress: 0,
    };

    const { data: job, error } = await (supabase as any)
      .from('ai_generation_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create generation job',
        error.code,
        error.details,
        error.hint
      );
    }

    // Calculate queue position and estimated completion
    const queuePosition = await this.getJobQueuePosition(job.id);
    const estimatedCompletion = this.calculateEstimatedCompletion(queuePosition, request);

    // Start processing if there's capacity
    this.tryStartProcessing();

    return {
      jobId: job.id,
      queuePosition,
      estimatedCompletion,
    };
  }

  /**
   * Add a batch generation job to the queue
   */
  async enqueueBatchGeneration(
    request: BatchGenerationRequest,
    userId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{ jobId: string; queuePosition: number; estimatedCompletion: string }> {
    const supabase = await this.getClient();

    // Validate user can create batch jobs
    await this.validateUserPermissions(userId, 'batch');

    // Estimate total credits for batch
    const estimatedCredits = await this.estimateBatchCredits(request);

    // Validate user has sufficient credits
    await this.validateUserCredits(userId, estimatedCredits);

    // Create batch job record
    const jobData = {
      user_id: userId,
      request_type: 'batch' as const,
      request_data: request,
      status: 'queued' as const,
      priority,
      estimated_credits: estimatedCredits,
      max_retries: 2, // Lower retry count for batch jobs
      retry_count: 0,
      progress: 0,
    };

    const { data: job, error } = await (supabase as any)
      .from('ai_generation_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create batch generation job',
        error.code,
        error.details,
        error.hint
      );
    }

    const queuePosition = await this.getJobQueuePosition(job.id);
    const estimatedCompletion = this.calculateBatchEstimatedCompletion(queuePosition, request);

    this.tryStartProcessing();

    return {
      jobId: job.id,
      queuePosition,
      estimatedCompletion,
    };
  }

  /**
   * Get job status and results
   */
  async getJobStatus(jobId: string, userId: string): Promise<GenerationJob> {
    const supabase = await this.getClient();

    const { data: job, error } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to fetch generation job: ${jobId}`,
        error.code,
        error.details
      );
    }

    // Add queue position if still queued
    let queuePosition: number | undefined;
    if (job.status === 'queued') {
      queuePosition = await this.getJobQueuePosition(jobId);
    }

    // Parse results if completed
    let result: AssetGenerationResponse | BatchGenerationResponse | undefined;
    if (job.status === 'completed' && job.result_data) {
      result = job.result_data;
    }

    return {
      id: job.id,
      userId: job.user_id,
      request: job.request_data,
      status: job.status,
      priority: job.priority,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      estimatedCompletion: job.estimated_completion,
      progress: job.progress,
      currentStep: job.current_step,
      result,
      error: job.error_data,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      creditsUsed: job.credits_used || 0,
      estimatedCredits: job.estimated_credits,
      queuePosition,
    } as GenerationJob;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, userId: string): Promise<void> {
    const supabase = await this.getClient();

    // Cancel processing if currently running
    const controller = this.processingJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.processingJobs.delete(jobId);
    }

    // Update job status
    const { error } = await (supabase as any)
      .from('ai_generation_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', userId)
      .in('status', ['queued', 'processing']);

    if (error) {
      throw new DatabaseError(
        `Failed to cancel generation job: ${jobId}`,
        error.code,
        error.details
      );
    }

    // Try to start next job in queue
    this.tryStartProcessing();
  }

  /**
   * Get user's jobs with filtering and pagination
   */
  async getUserJobs(
    userId: string,
    options: {
      status?: GenerationJob['status'][];
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'priority';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<GenerationJob[]> {
    const supabase = await this.getClient();

    let query = (supabase as any)
      .from('ai_generation_jobs')
      .select('*')
      .eq('user_id', userId);

    if (options.status && options.status.length > 0) {
      query = query.in('status', options.status);
    }

    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to fetch generation jobs for user: ${userId}`,
        error.code,
        error.details
      );
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      userId: job.user_id,
      request: job.request_data,
      status: job.status,
      priority: job.priority,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      estimatedCompletion: job.estimated_completion,
      progress: job.progress,
      currentStep: job.current_step,
      result: job.result_data,
      error: job.error_data,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      creditsUsed: job.credits_used || 0,
      estimatedCredits: job.estimated_credits,
    }));
  }

  /**
   * Get queue metrics and statistics
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split('T')[0];

    // Get current queue counts
    const [queuedCount, processingCount, completedCount, failedCount] = await Promise.all([
      this.getJobCountByStatus('queued'),
      this.getJobCountByStatus('processing'),
      this.getJobCountByStatusAndDate('completed', today),
      this.getJobCountByStatusAndDate('failed', today),
    ]);

    // Calculate average processing time
    const { data: avgTimes } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('processing_time_ms')
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00Z`)
      .not('processing_time_ms', 'is', null);

    const avgProcessingTime = avgTimes && avgTimes.length > 0
      ? avgTimes.reduce((sum: number, job: any) => sum + (job.processing_time_ms || 0), 0) / avgTimes.length
      : 0;

    // Calculate success rate
    const totalJobs = completedCount + failedCount;
    const successRate = totalJobs > 0 ? (completedCount / totalJobs) * 100 : 100;

    // Calculate current load (processing / max concurrent)
    const currentLoad = Math.min(processingCount / this.config.maxConcurrentJobs, 1.0);

    return {
      totalJobs: queuedCount + processingCount + completedCount + failedCount,
      queuedJobs: queuedCount,
      processingJobs: processingCount,
      completedToday: completedCount,
      failedToday: failedCount,
      averageWaitTimeMinutes: Math.round((queuedCount / Math.max(processingCount, 1)) * 3), // Estimate
      averageProcessingTimeMinutes: Math.round(avgProcessingTime / (1000 * 60)),
      successRatePercentage: Math.round(successRate),
      currentLoad,
    };
  }

  /**
   * Process jobs in the queue (internal worker function)
   */
  private async tryStartProcessing(): Promise<void> {
    const currentProcessing = this.processingJobs.size;
    if (currentProcessing >= this.config.maxConcurrentJobs) {
      return; // At capacity
    }

    // Get next job from queue
    const nextJob = await this.getNextQueuedJob();
    if (!nextJob) {
      return; // No jobs waiting
    }

    // Start processing the job
    this.processJob(nextJob).catch((error) => {
      console.error(`Failed to process job ${nextJob.id}:`, error);
    });

    // Try to start more jobs if there's capacity
    if (currentProcessing + 1 < this.config.maxConcurrentJobs) {
      setTimeout(() => this.tryStartProcessing(), 100);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    const supabase = await this.getClient();
    const jobId = job.id;
    const abortController = new AbortController();
    this.processingJobs.set(jobId, abortController);

    try {
      // Mark job as processing
      await this.updateJobStatus(jobId, 'processing', 0, 'Starting generation...');

      const startTime = Date.now();
      let result: AssetGenerationResponse | BatchGenerationResponse;

      if (job.request_type === 'single') {
        result = await this.processSingleGeneration(job, abortController.signal);
      } else {
        result = await this.processBatchGeneration(job, abortController.signal);
      }

      const processingTime = Date.now() - startTime;

      // Mark job as completed
      await (supabase as any)
        .from('ai_generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          current_step: 'Generation completed',
          result_data: result,
          credits_used: result.credits.used,
          processing_time_ms: processingTime,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      this.queueStats.totalProcessed++;
      this.queueStats.totalProcessingTime += processingTime;

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);

      const shouldRetry = job.retry_count < job.max_retries && 
                          error instanceof AssetGenerationError && 
                          error.retryable;

      if (shouldRetry) {
        // Schedule retry
        await this.scheduleJobRetry(job);
      } else {
        // Mark job as failed
        await (supabase as any)
          .from('ai_generation_jobs')
          .update({
            status: 'failed',
            error_data: {
              code: error instanceof AssetGenerationError ? error.code : ERROR_CODES.INTERNAL_ERROR,
              message: error instanceof Error ? error.message : 'Unknown error',
              retryable: false,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        this.queueStats.totalFailed++;
      }
    } finally {
      this.processingJobs.delete(jobId);
      // Try to start next job
      this.tryStartProcessing();
    }
  }

  /**
   * Process a single asset generation
   */
  private async processSingleGeneration(
    job: any,
    abortSignal: AbortSignal
  ): Promise<AssetGenerationResponse> {
    const request = job.request_data as AssetGenerationRequest;
    
    await this.updateJobStatus(job.id, 'processing', 25, 'Generating asset...');
    
    const asset = await this.generationManager.generateAsset(request);
    
    await this.updateJobStatus(job.id, 'processing', 75, 'Post-processing asset...');

    // Store asset and get URLs
    const storedAsset = await this.storeGeneratedAsset(asset, job.user_id, request);

    await this.updateJobStatus(job.id, 'processing', 90, 'Finalizing...');

    return {
      success: true,
      asset: storedAsset,
      credits: {
        used: job.estimated_credits,
        remaining: 0, // Would be calculated from user's actual credits
      },
      processingTime: Date.now() - new Date(job.started_at || job.created_at).getTime(),
      warnings: [],
    };
  }

  /**
   * Process a batch generation
   */
  private async processBatchGeneration(
    job: any,
    abortSignal: AbortSignal
  ): Promise<BatchGenerationResponse> {
    const request = job.request_data as BatchGenerationRequest;
    const results: GeneratedAsset[] = [];
    const failures: { prompt: string; error: string }[] = [];
    let creditsUsed = 0;

    const totalPrompts = request.prompts.length;
    
    for (let i = 0; i < totalPrompts; i++) {
      if (abortSignal.aborted) {
        throw new Error('Generation cancelled');
      }

      const prompt = request.prompts[i];
      const progress = Math.round(((i + 1) / totalPrompts) * 90);
      
      await this.updateJobStatus(
        job.id, 
        'processing', 
        progress, 
        `Generating asset ${i + 1} of ${totalPrompts}`
      );

      try {
        const assetRequest = { ...request.baseRequest, prompt };
        const asset = await this.generationManager.generateAsset(assetRequest);
        const storedAsset = await this.storeGeneratedAsset(asset, job.user_id, assetRequest);
        
        results.push(storedAsset);
        creditsUsed += job.estimated_credits / totalPrompts;
      } catch (error) {
        failures.push({
          prompt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (request.stopOnFailure) {
          throw error;
        }
      }
    }

    return {
      success: true,
      results,
      failures,
      totalGenerated: results.length,
      totalFailed: failures.length,
      totalCreditsUsed: creditsUsed,
      processingTime: Date.now() - new Date(job.started_at || job.created_at).getTime(),
    };
  }

  // Helper methods
  private async validateUserPermissions(userId: string, type: 'single' | 'batch'): Promise<void> {
    const supabase = await this.getClient();
    
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new AssetGenerationError(
        'User profile not found',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    if (profile.subscription_status !== 'active' && profile.subscription_tier !== 'free') {
      throw new AssetGenerationError(
        'Active subscription required for asset generation',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    if (type === 'batch' && profile.subscription_tier === 'free') {
      throw new AssetGenerationError(
        'Batch generation requires Pro or Max subscription',
        ERROR_CODES.TIER_LIMIT_EXCEEDED
      );
    }
  }

  private async validateUserCredits(userId: string, requiredCredits: number): Promise<void> {
    // This would integrate with the billing system
    // For now, we'll assume validation passes
  }

  private async estimateCredits(request: AssetGenerationRequest): Promise<number> {
    const baseCredits = 10; // Base cost per generation
    let multiplier = 1;

    // Adjust based on quality
    if (request.quality === 'high') multiplier *= 1.5;
    if (request.quality === 'ultra') multiplier *= 2.0;

    // Adjust based on variants
    if (request.variants && request.variants > 1) {
      multiplier *= request.variants * 0.8; // Slight discount for variants
    }

    // Adjust based on animation frames
    if (request.animationFrames && request.animationFrames > 1) {
      multiplier *= Math.min(request.animationFrames * 0.5, 3.0);
    }

    return Math.round(baseCredits * multiplier);
  }

  private async estimateBatchCredits(request: BatchGenerationRequest): Promise<number> {
    const singleRequestCredit = await this.estimateCredits(request.baseRequest);
    const batchDiscount = 0.85; // 15% discount for batch processing
    
    return Math.round(singleRequestCredit * request.prompts.length * batchDiscount);
  }

  private async getCurrentQueueSize(): Promise<number> {
    return await this.getJobCountByStatus('queued');
  }

  private async getJobCountByStatus(status: string): Promise<number> {
    const supabase = await this.getClient();
    
    const { count, error } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      console.error(`Failed to count jobs with status ${status}:`, error);
      return 0;
    }

    return count || 0;
  }

  private async getJobCountByStatusAndDate(status: string, date: string): Promise<number> {
    const supabase = await this.getClient();
    
    const { count, error } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
      .gte('updated_at', `${date}T00:00:00Z`)
      .lt('updated_at', `${date}T23:59:59Z`);

    if (error) {
      console.error(`Failed to count jobs with status ${status} for date ${date}:`, error);
      return 0;
    }

    return count || 0;
  }

  private async getJobQueuePosition(jobId: string): Promise<number> {
    const supabase = await this.getClient();

    const { data: job } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('created_at, priority')
      .eq('id', jobId)
      .single();

    if (!job) return 0;

    // Count jobs ahead in queue considering priority
    const { count } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued')
      .or(`priority.gt.${job.priority},and(priority.eq.${job.priority},created_at.lt.${job.created_at})`);

    return (count || 0) + 1;
  }

  private async getNextQueuedJob(): Promise<any> {
    const supabase = await this.getClient();

    // Get highest priority job that's been waiting the longest
    const { data: jobs } = await (supabase as any)
      .from('ai_generation_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    return jobs?.[0] || null;
  }

  private async updateJobStatus(
    jobId: string,
    status: GenerationJob['status'],
    progress: number,
    currentStep: string
  ): Promise<void> {
    const supabase = await this.getClient();

    const updateData: any = {
      progress,
      current_step: currentStep,
      updated_at: new Date().toISOString(),
    };

    if (status !== 'processing') {
      updateData.status = status;
    }

    if (status === 'processing' && progress === 0) {
      updateData.started_at = new Date().toISOString();
    }

    await (supabase as any)
      .from('ai_generation_jobs')
      .update(updateData)
      .eq('id', jobId);
  }

  private async scheduleJobRetry(job: any): Promise<void> {
    const retryDelay = this.config.retryDelays[job.retry_count] || this.config.retryDelays[this.config.retryDelays.length - 1];
    
    setTimeout(async () => {
      const supabase = await this.getClient();
      
      await (supabase as any)
        .from('ai_generation_jobs')
        .update({
          status: 'queued',
          retry_count: job.retry_count + 1,
          progress: 0,
          current_step: 'Queued for retry',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      this.tryStartProcessing();
    }, retryDelay);
  }

  private calculateEstimatedCompletion(queuePosition: number, request: AssetGenerationRequest): string {
    const estimatedTime = this.generationManager.estimateGenerationTime(request);
    const waitTime = (queuePosition - 1) * (estimatedTime / this.config.maxConcurrentJobs);
    const completionTime = new Date(Date.now() + waitTime + estimatedTime);
    
    return completionTime.toISOString();
  }

  private calculateBatchEstimatedCompletion(queuePosition: number, request: BatchGenerationRequest): string {
    const singleEstimate = this.generationManager.estimateGenerationTime(request.baseRequest);
    const batchTime = singleEstimate * request.prompts.length / (request.parallelGeneration || 1);
    const waitTime = (queuePosition - 1) * (batchTime / this.config.maxConcurrentJobs);
    const completionTime = new Date(Date.now() + waitTime + batchTime);
    
    return completionTime.toISOString();
  }

  private async storeGeneratedAsset(asset: any, userId: string, request: AssetGenerationRequest): Promise<GeneratedAsset> {
    // This would integrate with the asset storage system
    // For now, return a simplified structure
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: assetId,
      name: `Generated ${request.assetType}`,
      type: request.assetType,
      url: asset.url || '',
      thumbnailUrl: asset.thumbnailUrl,
      metadata: asset.metadata,
      generatedBy: asset.generatedBy,
      prompt: request.prompt,
      style: request.style,
      qualityScore: asset.metadata?.qualityScore || 0.8,
      createdAt: new Date().toISOString(),
      processingTime: asset.processingTime,
    };
  }
}