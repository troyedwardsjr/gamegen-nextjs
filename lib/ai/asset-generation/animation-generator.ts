/**
 * Animation Frame Generation System
 * 
 * Advanced system for generating sprite animation frames with seamless loops,
 * motion analysis, timing optimization, and sprite sheet compilation.
 */

import { 
  AnimationGenerationRequest,
  AnimationResult,
  AssetGenerationRequest,
  AssetGenerationError,
  ERROR_CODES,
  GeneratedAsset,
} from './types';
import { AssetGenerationManager } from './manager';
import { AssetPostProcessor } from './post-processor';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface AnimationFrame {
  frameNumber: number;
  asset: GeneratedAsset;
  timing: number; // Duration in milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  transform?: {
    scale?: number;
    rotation?: number;
    translation?: { x: number; y: number };
  };
}

interface SpriteSheetConfig {
  layout: 'horizontal' | 'vertical' | 'grid';
  padding: number;
  backgroundColor?: string;
  powerOfTwo?: boolean; // Ensure dimensions are power of 2 for game engines
  maxDimension?: number;
}

interface AnimationMetadata {
  totalFrames: number;
  totalDuration: number;
  frameRate: number;
  loopType: 'seamless' | 'bounce' | 'once';
  smoothness: number; // 0-1 score
  consistency: number; // 0-1 score
  motionType: string;
  keyFrames: number[];
}

export class AnimationGenerator {
  private generationManager: AssetGenerationManager;
  private postProcessor: AssetPostProcessor;
  private isServer: boolean;

  constructor(
    generationManager: AssetGenerationManager,
    postProcessor: AssetPostProcessor,
    isServer: boolean = false
  ) {
    this.generationManager = generationManager;
    this.postProcessor = postProcessor;
    this.isServer = isServer;
  }

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }
    return createClient();
  }

  /**
   * Generate complete animation sequence
   */
  async generateAnimation(request: AnimationGenerationRequest): Promise<AnimationResult> {
    const startTime = Date.now();

    // Validate animation request
    this.validateAnimationRequest(request);

    // Generate key frames first
    const keyFrames = await this.generateKeyFrames(request);

    // Generate in-between frames if needed
    const allFrames = await this.generateInBetweenFrames(request, keyFrames);

    // Ensure seamless looping if required
    if (request.loopType === 'seamless') {
      await this.optimizeForSeamlessLoop(allFrames, request);
    }

    // Generate sprite sheet
    const spriteSheet = await this.createSpriteSheet(allFrames, {
      layout: 'horizontal',
      padding: 2,
      backgroundColor: 'transparent',
      powerOfTwo: true,
    });

    // Analyze motion quality
    const motionAnalysis = await this.analyzeMotionQuality(allFrames, request);

    // Store animation data
    const animationAsset = await this.storeAnimationAsset(
      allFrames,
      spriteSheet,
      request,
      motionAnalysis
    );

    const processingTime = Date.now() - startTime;

    return {
      id: animationAsset.id,
      name: animationAsset.name,
      type: request.assetType,
      url: animationAsset.url,
      thumbnailUrl: animationAsset.thumbnailUrl,
      metadata: animationAsset.metadata,
      generatedBy: 'pixellab', // Default animation provider
      prompt: request.prompt,
      style: request.style,
      qualityScore: motionAnalysis.smoothness,
      createdAt: new Date().toISOString(),
      processingTime,
      animationData: {
        frames: allFrames.length,
        frameRate: request.frameRate,
        duration: (allFrames.length / request.frameRate) * 1000,
        frameUrls: allFrames.map(frame => frame.asset.url),
        spriteSheetUrl: spriteSheet.url,
        motionAnalysis: {
          smoothness: motionAnalysis.smoothness,
          consistency: motionAnalysis.consistency,
          loopQuality: motionAnalysis.loopQuality,
        },
      },
    };
  }

  /**
   * Generate key animation frames
   */
  private async generateKeyFrames(request: AnimationGenerationRequest): Promise<AnimationFrame[]> {
    const keyFrames: AnimationFrame[] = [];

    // Define key frame moments based on animation type and motion
    const keyMoments = this.calculateKeyMoments(request);

    for (const moment of keyMoments) {
      const frameRequest = this.createFrameRequest(request, moment);
      
      try {
        const asset = await this.generationManager.generateAsset(frameRequest);
        const processedAsset = await this.postProcessor.processAsset(asset, frameRequest);
        
        const frame: AnimationFrame = {
          frameNumber: moment.frameNumber,
          asset: this.convertToGeneratedAsset(processedAsset, frameRequest),
          timing: moment.timing,
          easing: moment.easing,
          transform: moment.transform,
        };

        keyFrames.push(frame);
      } catch (error) {
        console.error(`Failed to generate key frame ${moment.frameNumber}:`, error);
        // Continue with other frames, but we'll need to handle missing frames
      }
    }

    if (keyFrames.length === 0) {
      throw new AssetGenerationError(
        'Failed to generate any animation key frames',
        ERROR_CODES.GENERATION_FAILED,
        undefined,
        true
      );
    }

    return keyFrames;
  }

  /**
   * Generate in-between frames for smooth animation
   */
  private async generateInBetweenFrames(
    request: AnimationGenerationRequest,
    keyFrames: AnimationFrame[]
  ): Promise<AnimationFrame[]> {
    const allFrames: AnimationFrame[] = [...keyFrames];

    // Sort key frames by frame number
    keyFrames.sort((a, b) => a.frameNumber - b.frameNumber);

    // Generate in-between frames
    for (let i = 0; i < keyFrames.length; i++) {
      const currentKey = keyFrames[i];
      const nextKey = keyFrames[i + 1] || keyFrames[0]; // Loop back to first for seamless

      const framesBetween = nextKey.frameNumber - currentKey.frameNumber - 1;
      
      if (framesBetween > 0) {
        const inBetweens = await this.generateIntermediateFrames(
          currentKey,
          nextKey,
          framesBetween,
          request
        );
        allFrames.push(...inBetweens);
      }
    }

    // Sort all frames by frame number
    allFrames.sort((a, b) => a.frameNumber - b.frameNumber);

    return allFrames;
  }

  /**
   * Generate intermediate frames between two key frames
   */
  private async generateIntermediateFrames(
    startFrame: AnimationFrame,
    endFrame: AnimationFrame,
    count: number,
    request: AnimationGenerationRequest
  ): Promise<AnimationFrame[]> {
    const intermediates: AnimationFrame[] = [];

    for (let i = 1; i <= count; i++) {
      const progress = i / (count + 1);
      const frameNumber = startFrame.frameNumber + i;

      // Interpolate between start and end descriptions
      const interpolatedPrompt = this.interpolatePrompts(
        startFrame.asset.prompt,
        endFrame.asset.prompt,
        progress,
        request.motionType
      );

      const frameTiming = this.interpolate(startFrame.timing, endFrame.timing, progress);
      const frameTransform = this.interpolateTransforms(progress, startFrame.transform, endFrame.transform);
      
      const frameRequest = this.createFrameRequest(request, {
        frameNumber,
        prompt: interpolatedPrompt,
        timing: frameTiming,
        easing: 'linear', // Intermediate frames use linear interpolation
        transform: frameTransform,
      });

      try {
        const asset = await this.generationManager.generateAsset(frameRequest);
        const processedAsset = await this.postProcessor.processAsset(asset, frameRequest);

        const frame: AnimationFrame = {
          frameNumber,
          asset: this.convertToGeneratedAsset(processedAsset, frameRequest),
          timing: frameTiming || 100,
          easing: 'linear',
          transform: frameTransform,
        };

        intermediates.push(frame);
      } catch (error) {
        console.error(`Failed to generate intermediate frame ${frameNumber}:`, error);
        // Continue without this frame
      }
    }

    return intermediates;
  }

  /**
   * Optimize frames for seamless looping
   */
  private async optimizeForSeamlessLoop(
    frames: AnimationFrame[],
    request: AnimationGenerationRequest
  ): Promise<void> {
    if (frames.length < 2) return;

    const firstFrame = frames[0];
    const lastFrame = frames[frames.length - 1];

    // Check if loop is already seamless by analyzing visual similarity
    const loopQuality = await this.analyzeLoopSeamlessness(firstFrame, lastFrame);

    if (loopQuality < 0.8) {
      // Generate improved last frame to better match first frame
      const improvedLastPrompt = this.createSeamlessLoopPrompt(
        firstFrame.asset.prompt,
        lastFrame.asset.prompt,
        request
      );

      const improvedFrameRequest = this.createFrameRequest(request, {
        frameNumber: lastFrame.frameNumber,
        prompt: improvedLastPrompt,
        timing: lastFrame.timing,
        easing: lastFrame.easing,
      });

      try {
        const asset = await this.generationManager.generateAsset(improvedFrameRequest);
        const processedAsset = await this.postProcessor.processAsset(asset, improvedFrameRequest);

        // Replace the last frame
        frames[frames.length - 1] = {
          ...lastFrame,
          asset: this.convertToGeneratedAsset(processedAsset, improvedFrameRequest),
        };
      } catch (error) {
        console.warn('Failed to optimize last frame for seamless loop:', error);
      }
    }
  }

  /**
   * Create sprite sheet from animation frames
   */
  private async createSpriteSheet(
    frames: AnimationFrame[],
    config: SpriteSheetConfig
  ): Promise<{ url: string; buffer: Buffer; metadata: any }> {
    // This would use a canvas library like node-canvas or similar
    // For now, we'll create a mock implementation

    const frameWidth = frames[0]?.asset.metadata.dimensions.width || 64;
    const frameHeight = frames[0]?.asset.metadata.dimensions.height || 64;
    const padding = config.padding;

    let spriteSheetWidth: number;
    let spriteSheetHeight: number;
    let cols: number;
    let rows: number;

    // Calculate layout dimensions
    switch (config.layout) {
      case 'horizontal':
        cols = frames.length;
        rows = 1;
        spriteSheetWidth = cols * (frameWidth + padding) - padding;
        spriteSheetHeight = frameHeight;
        break;
      
      case 'vertical':
        cols = 1;
        rows = frames.length;
        spriteSheetWidth = frameWidth;
        spriteSheetHeight = rows * (frameHeight + padding) - padding;
        break;
      
      case 'grid':
      default:
        cols = Math.ceil(Math.sqrt(frames.length));
        rows = Math.ceil(frames.length / cols);
        spriteSheetWidth = cols * (frameWidth + padding) - padding;
        spriteSheetHeight = rows * (frameHeight + padding) - padding;
        break;
    }

    // Ensure power of 2 dimensions if requested
    if (config.powerOfTwo) {
      spriteSheetWidth = this.nextPowerOfTwo(spriteSheetWidth);
      spriteSheetHeight = this.nextPowerOfTwo(spriteSheetHeight);
    }

    // Limit maximum dimensions
    if (config.maxDimension) {
      const scale = Math.min(
        config.maxDimension / spriteSheetWidth,
        config.maxDimension / spriteSheetHeight,
        1
      );
      if (scale < 1) {
        spriteSheetWidth = Math.floor(spriteSheetWidth * scale);
        spriteSheetHeight = Math.floor(spriteSheetHeight * scale);
      }
    }

    // Generate mock sprite sheet data
    const mockBuffer = Buffer.from('mock-sprite-sheet-data');
    const mockUrl = `https://assets.gamegen.ai/sprites/${Date.now()}-spritesheet.png`;

    return {
      url: mockUrl,
      buffer: mockBuffer,
      metadata: {
        width: spriteSheetWidth,
        height: spriteSheetHeight,
        frameWidth,
        frameHeight,
        cols,
        rows,
        frameCount: frames.length,
        padding,
        format: 'png',
      },
    };
  }

  /**
   * Analyze motion quality and consistency
   */
  private async analyzeMotionQuality(
    frames: AnimationFrame[],
    request: AnimationGenerationRequest
  ): Promise<{
    smoothness: number;
    consistency: number;
    loopQuality: number;
  }> {
    if (frames.length < 2) {
      return { smoothness: 1.0, consistency: 1.0, loopQuality: 1.0 };
    }

    // Calculate smoothness based on frame-to-frame visual coherence
    let totalSmoothness = 0;
    for (let i = 0; i < frames.length - 1; i++) {
      const currentFrame = frames[i];
      const nextFrame = frames[(i + 1) % frames.length];
      const similarity = await this.calculateFrameSimilarity(currentFrame, nextFrame);
      totalSmoothness += similarity;
    }
    const smoothness = totalSmoothness / frames.length;

    // Calculate consistency based on style and visual characteristics
    const consistency = await this.calculateVisualConsistency(frames);

    // Calculate loop quality for seamless animations
    let loopQuality = 1.0;
    if (request.loopType === 'seamless') {
      loopQuality = await this.analyzeLoopSeamlessness(frames[0], frames[frames.length - 1]);
    }

    return {
      smoothness: Math.max(0, Math.min(1, smoothness)),
      consistency: Math.max(0, Math.min(1, consistency)),
      loopQuality: Math.max(0, Math.min(1, loopQuality)),
    };
  }

  // Helper methods

  private validateAnimationRequest(request: AnimationGenerationRequest): void {
    if (!request.frameCount || request.frameCount < 2) {
      throw new AssetGenerationError(
        'Animation must have at least 2 frames',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    if (request.frameCount > 60) {
      throw new AssetGenerationError(
        'Animation cannot have more than 60 frames',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    if (!request.frameRate || request.frameRate < 1 || request.frameRate > 60) {
      throw new AssetGenerationError(
        'Frame rate must be between 1 and 60 FPS',
        ERROR_CODES.INVALID_REQUEST
      );
    }
  }

  private calculateKeyMoments(request: AnimationGenerationRequest): any[] {
    const keyMoments = [];
    const totalFrames = request.frameCount;

    // Define key moments based on animation type
    switch (request.motionType) {
      case 'linear':
        // Simple linear progression
        for (let i = 0; i < totalFrames; i += Math.max(1, Math.floor(totalFrames / 4))) {
          keyMoments.push({
            frameNumber: i,
            timing: 1000 / request.frameRate,
            easing: 'linear',
            prompt: this.generateFramePrompt(request, i / (totalFrames - 1)),
          });
        }
        break;

      case 'bounce':
        // Bounce motion with acceleration/deceleration
        const bouncePoints = [0, 0.3, 0.7, 1.0];
        for (const point of bouncePoints) {
          const frameIndex = Math.floor(point * (totalFrames - 1));
          keyMoments.push({
            frameNumber: frameIndex,
            timing: 1000 / request.frameRate,
            easing: point < 0.5 ? 'ease-out' : 'ease-in',
            prompt: this.generateFramePrompt(request, point),
          });
        }
        break;

      default:
        // Default to evenly spaced key frames
        const keyFrameCount = Math.min(4, totalFrames);
        for (let i = 0; i < keyFrameCount; i++) {
          const progress = i / (keyFrameCount - 1);
          const frameIndex = Math.floor(progress * (totalFrames - 1));
          keyMoments.push({
            frameNumber: frameIndex,
            timing: 1000 / request.frameRate,
            easing: 'ease-in-out',
            prompt: this.generateFramePrompt(request, progress),
          });
        }
        break;
    }

    return keyMoments;
  }

  private generateFramePrompt(request: AnimationGenerationRequest, progress: number): string {
    // Generate frame-specific prompts based on progress through animation
    const basePrompt = request.prompt;

    // Add motion-specific modifiers
    const motionModifiers = this.getMotionModifiers(request.motionType || 'linear', progress);
    
    return `${basePrompt}, ${motionModifiers}`;
  }

  private getMotionModifiers(motionType: string, progress: number): string {
    switch (motionType) {
      case 'bounce':
        if (progress < 0.3) return 'starting position, preparing to move';
        if (progress < 0.7) return 'mid-motion, peak action';
        return 'ending position, settling';

      case 'elastic':
        if (progress < 0.2) return 'initial state, beginning movement';
        if (progress < 0.8) return 'elastic deformation, stretching';
        return 'returning to rest, final position';

      default:
        return `animation progress ${Math.round(progress * 100)}%`;
    }
  }

  private createFrameRequest(request: AnimationGenerationRequest, moment: any): AssetGenerationRequest {
    return {
      prompt: moment.prompt || request.prompt,
      assetType: request.assetType,
      style: request.style,
      dimensions: request.dimensions,
      colorPalette: request.colorPalette,
      quality: request.quality,
      seed: request.seed ? request.seed + moment.frameNumber : undefined,
      userId: request.userId,
      sessionId: request.sessionId,
      timing: moment.timing,
      transform: moment.transform,
    } as any;
  }

  private interpolatePrompts(startPrompt: string, endPrompt: string, progress: number, motionType?: string): string {
    // Simple interpolation - in a real implementation, this would be more sophisticated
    if (progress < 0.5) {
      return startPrompt;
    } else {
      return endPrompt;
    }
  }

  private interpolate(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private interpolateTransforms(progress: number, start?: any, end?: any): any {
    if (!start && !end) return undefined;
    if (!start) return end;
    if (!end) return start;

    return {
      scale: this.interpolate(start.scale || 1, end.scale || 1, progress),
      rotation: this.interpolate(start.rotation || 0, end.rotation || 0, progress),
      translation: {
        x: this.interpolate(start.translation?.x || 0, end.translation?.x || 0, progress),
        y: this.interpolate(start.translation?.y || 0, end.translation?.y || 0, progress),
      },
    };
  }

  private createSeamlessLoopPrompt(firstPrompt: string, lastPrompt: string, request: AnimationGenerationRequest): string {
    return `${lastPrompt}, transitioning back to starting position, seamless loop, ${firstPrompt}`;
  }

  private async calculateFrameSimilarity(frame1: AnimationFrame, frame2: AnimationFrame): Promise<number> {
    // Mock similarity calculation - in reality, this would use image comparison
    return 0.85; // Assume good similarity for now
  }

  private async calculateVisualConsistency(frames: AnimationFrame[]): Promise<number> {
    // Mock consistency calculation
    return 0.9; // Assume good consistency for now
  }

  private async analyzeLoopSeamlessness(firstFrame: AnimationFrame, lastFrame: AnimationFrame): Promise<number> {
    // Mock loop quality analysis
    return 0.88; // Assume good loop quality for now
  }

  private nextPowerOfTwo(value: number): number {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }

  private convertToGeneratedAsset(processedAsset: any, request: AssetGenerationRequest): GeneratedAsset {
    return {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Animation Frame`,
      type: request.assetType,
      url: processedAsset.url || '',
      thumbnailUrl: processedAsset.thumbnailUrl,
      metadata: processedAsset.metadata || {},
      generatedBy: 'pixellab', // Default animation provider
      prompt: request.prompt,
      style: request.style,
      qualityScore: 0.85,
      createdAt: new Date().toISOString(),
    };
  }

  private async storeAnimationAsset(
    frames: AnimationFrame[],
    spriteSheet: any,
    request: AnimationGenerationRequest,
    motionAnalysis: any
  ): Promise<GeneratedAsset> {
    // This would store the animation data in the database and file storage
    const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: animationId,
      name: `${request.assetType} Animation`,
      type: request.assetType,
      url: spriteSheet.url,
      thumbnailUrl: frames[0]?.asset.url,
      metadata: {
        dimensions: spriteSheet.metadata,
        frameCount: frames.length,
        frameRate: request.frameRate,
        duration: (frames.length / request.frameRate) * 1000,
        fileSize: spriteSheet.buffer.length,
        format: 'png',
        colors: frames[0]?.asset.metadata.colors,
        tags: ['animation', request.motionType || 'linear', request.assetType],
        motionQuality: motionAnalysis,
      },
      generatedBy: 'pixellab', // Default animation provider
      prompt: request.prompt,
      style: request.style,
      qualityScore: motionAnalysis.smoothness,
      createdAt: new Date().toISOString(),
    };
  }
}