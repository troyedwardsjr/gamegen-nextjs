/**
 * Pixellab Provider
 * 
 * Integration with Pixellab API for pixel art generation.
 * Specialized for high-quality pixel art sprites, tiles, and UI elements.
 */

import { 
  AssetGenerationRequest, 
  ProviderConfig, 
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
  AssetStyle,
} from '../types';

interface PixellabGenerationRequest {
  prompt: string;
  style: string;
  width: number;
  height: number;
  pixel_size?: number;
  color_count?: number;
  negative_prompt?: string;
  seed?: number;
  quality?: 'draft' | 'standard' | 'high';
  format?: 'png' | 'webp';
}

interface PixellabResponse {
  success: boolean;
  data?: {
    image_url: string;
    image_data: string; // Base64 encoded
    metadata: {
      width: number;
      height: number;
      color_count: number;
      style_score: number;
      processing_time: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class PixellabProvider {
  public readonly name = 'Pixellab';
  private config: ProviderConfig;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'https://api.pixellab.ai/v1';
    
    if (!config.apiKey) {
      throw new AssetGenerationError(
        'Pixellab API key is required',
        ERROR_CODES.INVALID_REQUEST,
      );
    }
    
    this.apiKey = config.apiKey;
  }

  /**
   * Generate asset using Pixellab API
   */
  async generateAsset(request: AssetGenerationRequest): Promise<any> {
    const pixellabRequest = this.convertRequest(request);
    
    try {
      const response = await this.makeApiCall('/generate', pixellabRequest);
      
      if (!response.success || !response.data) {
        throw new AssetGenerationError(
          response.error?.message || 'Generation failed',
          ERROR_CODES.GENERATION_FAILED,
          'pixellab',
          true,
        );
      }

      return this.processResponse(response, request);
    } catch (error) {
      if (error instanceof AssetGenerationError) {
        throw error;
      }

      throw new AssetGenerationError(
        `Pixellab generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GENERATION_FAILED,
        'pixellab',
        true,
      );
    }
  }

  /**
   * Convert our request format to Pixellab format
   */
  private convertRequest(request: AssetGenerationRequest): PixellabGenerationRequest {
    const pixellabRequest: PixellabGenerationRequest = {
      prompt: this.enhancePrompt(request),
      style: this.mapStyle(request.style || 'pixel-art'),
      width: request.dimensions?.width || this.getDefaultDimensions(request.assetType).width,
      height: request.dimensions?.height || this.getDefaultDimensions(request.assetType).height,
    };

    // Pixel art specific parameters
    if (request.style === 'pixel-art' || request.style === '8bit' || request.style === '16bit') {
      pixellabRequest.pixel_size = request.style === '8bit' ? 8 : 4;
    }

    // Color constraints
    if (request.colorCount) {
      pixellabRequest.color_count = Math.min(Math.max(request.colorCount, 4), 256);
    }

    // Quality mapping
    const qualityMap = {
      'draft': 'draft' as const,
      'standard': 'standard' as const,
      'high': 'high' as const,
      'ultra': 'high' as const, // Map ultra to high for PixelLab
    };
    pixellabRequest.quality = qualityMap[request.quality || 'standard'];

    // Negative prompt
    if (request.negativePrompt) {
      pixellabRequest.negative_prompt = request.negativePrompt;
    }

    // Seed for reproducibility
    if (request.seed) {
      pixellabRequest.seed = request.seed;
    }

    // Preferred format
    pixellabRequest.format = 'png'; // Pixellab works best with PNG for pixel art

    return pixellabRequest;
  }

  /**
   * Enhance prompt with pixel art specific terms
   */
  private enhancePrompt(request: AssetGenerationRequest): string {
    let enhancedPrompt = request.prompt;

    // Add asset type context
    const assetTypePrompts = {
      sprite: 'game character sprite',
      background: 'game background scene',
      tile: 'tileable texture pattern',
      animation: 'animated sprite frames',
      tileset: 'game tileset collection',
      ui: 'game UI element',
    };

    const assetContext = assetTypePrompts[request.assetType];
    if (assetContext && !enhancedPrompt.toLowerCase().includes(assetContext.toLowerCase())) {
      enhancedPrompt = `${assetContext}, ${enhancedPrompt}`;
    }

    // Add style context
    const stylePrompts = {
      'pixel-art': 'pixel art style, crisp pixels, no anti-aliasing',
      '8bit': '8-bit retro game style, limited color palette',
      '16bit': '16-bit retro game style, detailed pixel art',
      'retro': 'retro game style, nostalgic feel',
      'modern': 'modern pixel art, detailed and polished',
    };

    const styleContext = stylePrompts[request.style as keyof typeof stylePrompts];
    if (styleContext && !enhancedPrompt.toLowerCase().includes('pixel')) {
      enhancedPrompt = `${enhancedPrompt}, ${styleContext}`;
    }

    // Add color palette context if provided
    if (request.colorPalette && request.colorPalette.length > 0) {
      const colorString = request.colorPalette.join(', ');
      enhancedPrompt += `, using colors: ${colorString}`;
    }

    // Add project theme context
    if (request.projectTheme) {
      enhancedPrompt = `${request.projectTheme} themed ${enhancedPrompt}`;
    }

    return enhancedPrompt;
  }

  /**
   * Map our style to Pixellab style
   */
  private mapStyle(style: AssetStyle): string {
    const styleMapping = {
      'pixel-art': 'pixel_art',
      '8bit': '8bit_retro',
      '16bit': '16bit_retro',
      '32bit': '32bit_detailed',
      'retro': 'retro_game',
      'modern': 'modern_pixel',
      'minimalist': 'minimal_pixel',
      'cartoon': 'cartoon_pixel',
      'realistic': 'detailed_pixel',
      'abstract': 'abstract_pixel',
    };

    return styleMapping[style] || 'pixel_art';
  }

  /**
   * Get default dimensions for asset type
   */
  private getDefaultDimensions(assetType: AssetType): { width: number; height: number } {
    const defaults = {
      sprite: { width: 64, height: 64 },
      background: { width: 320, height: 240 },
      tile: { width: 32, height: 32 },
      animation: { width: 64, height: 64 },
      tileset: { width: 256, height: 256 },
      ui: { width: 128, height: 32 },
    };

    return defaults[assetType] || { width: 64, height: 64 };
  }

  /**
   * Make API call to Pixellab
   */
  private async makeApiCall(endpoint: string, data: any): Promise<PixellabResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GameGen-Platform/1.0',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AssetGenerationError(
          'Invalid Pixellab API key',
          ERROR_CODES.UNAUTHORIZED,
          'pixellab',
        );
      }
      
      if (response.status === 429) {
        throw new AssetGenerationError(
          'Pixellab rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'pixellab',
          true,
        );
      }

      if (response.status === 503) {
        throw new AssetGenerationError(
          'Pixellab service temporarily unavailable',
          ERROR_CODES.PROVIDER_NOT_AVAILABLE,
          'pixellab',
          true,
        );
      }

      throw new AssetGenerationError(
        `Pixellab API error: ${response.status}`,
        ERROR_CODES.GENERATION_FAILED,
        'pixellab',
        response.status >= 500,
      );
    }

    return await response.json();
  }

  /**
   * Process Pixellab response
   */
  private processResponse(response: PixellabResponse, request: AssetGenerationRequest): any {
    if (!response.data) {
      throw new AssetGenerationError(
        'No image data in Pixellab response',
        ERROR_CODES.GENERATION_FAILED,
        'pixellab',
      );
    }

    const { data } = response;
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(data.image_data, 'base64');
    
    return {
      buffer: imageBuffer,
      url: data.image_url,
      metadata: {
        width: data.metadata.width,
        height: data.metadata.height,
        format: 'png',
        mimeType: 'image/png',
        fileSize: imageBuffer.length,
        provider: 'pixellab',
        styleScore: data.metadata.style_score,
        colors: {
          count: data.metadata.color_count,
        },
        processingTime: data.metadata.processing_time,
        qualityScore: Math.min(data.metadata.style_score, 1.0),
      },
    };
  }

  /**
   * Health check for Pixellab service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      } as any);

      return response.ok;
    } catch (error) {
      console.error('Pixellab health check failed:', error);
      return false;
    }
  }

  /**
   * Get provider capabilities
   */
  async getCapabilities(): Promise<{
    supportedAssetTypes: AssetType[];
    supportedStyles: AssetStyle[];
    supportedFormats: string[];
    maxDimensions: { width: number; height: number };
  }> {
    return {
      supportedAssetTypes: ['sprite', 'background', 'tile', 'ui', 'tileset'],
      supportedStyles: ['pixel-art', '8bit', '16bit', 'retro', 'modern'],
      supportedFormats: ['png', 'webp'],
      maxDimensions: { width: 1024, height: 1024 },
    };
  }

  /**
   * Generate animation frames (for sprite animations)
   */
  async generateAnimation(request: AssetGenerationRequest & { frameCount: number }): Promise<any> {
    const frames = [];
    const baseSeed = request.seed || Math.floor(Math.random() * 1000000);
    
    // Pre-calculate animation progression
    const animationPrompts = this.generateAnimationPrompts(request);
    
    for (let i = 0; i < request.frameCount; i++) {
      const frameRequest = {
        ...request,
        prompt: animationPrompts[i] || `${request.prompt}, animation frame ${i + 1} of ${request.frameCount}`,
        seed: baseSeed + i, // Consistent seeding for animation
      };

      try {
        const frame = await this.generateAsset(frameRequest);
        frames.push({
          frameNumber: i,
          ...frame,
        });
        
        // Apply frame consistency validation
        if (i > 0) {
          const consistencyScore = await this.validateFrameConsistency(frames[i-1], frame);
          frame.metadata.consistencyScore = consistencyScore;
        }
      } catch (error) {
        console.error(`Failed to generate frame ${i + 1}:`, error);
        // Continue with other frames but track failures
      }
    }

    // Post-process animation for consistency
    const processedFrames = await this.enhanceAnimationConsistency(frames, request);

    return {
      frames: processedFrames,
      metadata: {
        totalFrames: request.frameCount,
        successfulFrames: processedFrames.length,
        provider: 'pixellab',
        consistencyScore: this.calculateAnimationConsistency(processedFrames),
        animationType: request.assetType,
      },
    };
  }

  /**
   * Generate contextual animation prompts for better consistency
   */
  private generateAnimationPrompts(request: AssetGenerationRequest & { frameCount: number }): string[] {
    const basePrompt = request.prompt;
    const prompts: string[] = [];
    
    // Generate frame-specific prompts based on animation type
    for (let i = 0; i < request.frameCount; i++) {
      const frameProgress = i / (request.frameCount - 1);
      let framePrompt = basePrompt;
      
      // Add frame-specific context
      if (basePrompt.toLowerCase().includes('walk') || basePrompt.toLowerCase().includes('running')) {
        const walkCycle = ['standing', 'lift leg', 'step forward', 'plant foot', 'push off', 'lift other leg', 'step forward', 'plant foot'];
        const cycleIndex = Math.floor(frameProgress * walkCycle.length);
        framePrompt += `, ${walkCycle[cycleIndex] || 'walking'}`;
      } else if (basePrompt.toLowerCase().includes('idle') || basePrompt.toLowerCase().includes('breathing')) {
        const idleCycle = ['neutral pose', 'slight lean', 'breath in', 'breath hold', 'breath out', 'return neutral'];
        const cycleIndex = Math.floor(frameProgress * idleCycle.length);
        framePrompt += `, ${idleCycle[cycleIndex] || 'idle'}`;
      } else {
        // Generic animation progression
        if (frameProgress < 0.25) framePrompt += ', beginning pose';
        else if (frameProgress < 0.5) framePrompt += ', quarter motion';
        else if (frameProgress < 0.75) framePrompt += ', mid motion';
        else framePrompt += ', end motion';
      }
      
      framePrompt += `, frame ${i + 1} of ${request.frameCount}, maintain character consistency`;
      prompts.push(framePrompt);
    }
    
    return prompts;
  }

  /**
   * Validate consistency between animation frames
   */
  private async validateFrameConsistency(frame1: any, frame2: any): Promise<number> {
    try {
      // This would use image comparison algorithms to validate consistency
      // For now, return a basic consistency score based on metadata
      
      let score = 0.8; // Base score
      
      // Check dimension consistency
      if (frame1.metadata.width === frame2.metadata.width && 
          frame1.metadata.height === frame2.metadata.height) {
        score += 0.1;
      }
      
      // Check style score consistency
      if (Math.abs((frame1.metadata.styleScore || 0.8) - (frame2.metadata.styleScore || 0.8)) < 0.2) {
        score += 0.1;
      }
      
      return Math.min(score, 1.0);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Enhance animation consistency across frames
   */
  private async enhanceAnimationConsistency(frames: any[], request: AssetGenerationRequest): Promise<any[]> {
    // This would apply post-processing to ensure consistent style across frames
    // For now, return frames as-is with consistency metadata
    return frames.map((frame, index) => ({
      ...frame,
      metadata: {
        ...frame.metadata,
        frameIndex: index,
        animationContext: {
          totalFrames: frames.length,
          frameProgress: index / (frames.length - 1),
          isKeyFrame: index === 0 || index === frames.length - 1 || index === Math.floor(frames.length / 2),
        },
      },
    }));
  }

  /**
   * Calculate overall animation consistency score
   */
  private calculateAnimationConsistency(frames: any[]): number {
    if (frames.length < 2) return 1.0;
    
    let totalConsistency = 0;
    let validComparisons = 0;
    
    for (let i = 1; i < frames.length; i++) {
      if (frames[i].metadata.consistencyScore !== undefined) {
        totalConsistency += frames[i].metadata.consistencyScore;
        validComparisons++;
      }
    }
    
    return validComparisons > 0 ? totalConsistency / validComparisons : 0.8;
  }

  /**
   * Generate batch assets with style consistency
   */
  async generateBatch(requests: AssetGenerationRequest[], options: {
    maintainConsistency: boolean;
    parallelGeneration: number;
    baseStyle?: any;
  }): Promise<any[]> {
    const results: any[] = [];
    
    // If maintaining consistency, establish base parameters
    let baseStyleParameters: any = null;
    if (options.maintainConsistency && requests.length > 0) {
      baseStyleParameters = await this.establishBaseStyle(requests[0], options.baseStyle);
    }
    
    // Process requests in batches for parallel generation
    const batchSize = Math.min(options.parallelGeneration || 3, requests.length);
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batchRequests = requests.slice(i, i + batchSize);
      
      const batchPromises = batchRequests.map(async (request, batchIndex) => {
        try {
          // Apply consistency parameters if enabled
          const enhancedRequest = options.maintainConsistency && baseStyleParameters 
            ? this.applyConsistencyParameters(request, baseStyleParameters)
            : request;
            
          const result = await this.generateAsset(enhancedRequest);
          
          // Add batch metadata
          result.metadata.batchInfo = {
            batchIndex: Math.floor(i / batchSize),
            requestIndex: i + batchIndex,
            totalRequests: requests.length,
            consistencyApplied: options.maintainConsistency,
          };
          
          return result;
        } catch (error) {
          console.error(`Batch generation failed for request ${i + batchIndex}:`, error);
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestIndex: i + batchIndex,
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    // Post-process for consistency validation if enabled
    if (options.maintainConsistency) {
      return await this.validateBatchConsistency(results);
    }
    
    return results;
  }

  /**
   * Establish base style parameters for consistency
   */
  private async establishBaseStyle(referenceRequest: AssetGenerationRequest, baseStyle?: any): Promise<any> {
    return {
      style: baseStyle?.style || referenceRequest.style || 'pixel-art',
      colorPalette: baseStyle?.colorPalette || referenceRequest.colorPalette,
      dimensions: baseStyle?.dimensions || referenceRequest.dimensions,
      quality: baseStyle?.quality || referenceRequest.quality || 'standard',
      projectTheme: baseStyle?.projectTheme || referenceRequest.projectTheme,
      
      // Pixellab-specific consistency parameters
      pixelSize: baseStyle?.pixelSize || (referenceRequest.style === '8bit' ? 8 : 4),
      colorCount: baseStyle?.colorCount || referenceRequest.colorCount,
    };
  }

  /**
   * Apply consistency parameters to a request
   */
  private applyConsistencyParameters(request: AssetGenerationRequest, baseStyle: any): AssetGenerationRequest {
    return {
      ...request,
      style: baseStyle.style,
      colorPalette: request.colorPalette || baseStyle.colorPalette,
      dimensions: request.dimensions || baseStyle.dimensions,
      quality: request.quality || baseStyle.quality,
      projectTheme: request.projectTheme || baseStyle.projectTheme,
      colorCount: request.colorCount || baseStyle.colorCount,
    };
  }

  /**
   * Validate and enhance batch consistency
   */
  private async validateBatchConsistency(results: any[]): Promise<any[]> {
    const validResults = results.filter(result => !result.error);
    
    if (validResults.length < 2) {
      return results;
    }
    
    // Calculate consistency scores between results
    const consistencyScores: number[] = [];
    
    for (let i = 1; i < validResults.length; i++) {
      const score = await this.calculateStyleConsistency(validResults[0], validResults[i]);
      consistencyScores.push(score);
      validResults[i].metadata.batchConsistencyScore = score;
    }
    
    // Add overall batch consistency metadata
    const overallConsistency = consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length;
    
    return results.map(result => {
      if (!result.error) {
        result.metadata.overallBatchConsistency = overallConsistency;
      }
      return result;
    });
  }

  /**
   * Calculate style consistency between two assets
   */
  private async calculateStyleConsistency(asset1: any, asset2: any): Promise<number> {
    let score = 0.5; // Base score
    
    // Compare metadata for consistency indicators
    const meta1 = asset1.metadata;
    const meta2 = asset2.metadata;
    
    // Dimension consistency
    if (meta1.width === meta2.width && meta1.height === meta2.height) {
      score += 0.15;
    }
    
    // Style score consistency
    if (Math.abs((meta1.styleScore || 0.8) - (meta2.styleScore || 0.8)) < 0.1) {
      score += 0.15;
    }
    
    // Color count consistency
    if (meta1.colors && meta2.colors && 
        Math.abs(meta1.colors.count - meta2.colors.count) <= 2) {
      score += 0.1;
    }
    
    // Format consistency
    if (meta1.format === meta2.format) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Estimate generation time for this provider
   */
  estimateGenerationTime(request: AssetGenerationRequest): number {
    let baseTime = 12000; // 12 seconds base

    // Adjust for dimensions
    if (request.dimensions) {
      const pixels = request.dimensions.width * request.dimensions.height;
      if (pixels > 256 * 256) {
        baseTime *= 1.5;
      } else if (pixels > 128 * 128) {
        baseTime *= 1.2;
      }
    }

    // Adjust for quality
    const qualityMultipliers = {
      draft: 0.7,
      standard: 1.0,
      high: 1.5,
      ultra: 2.0,
    };
    baseTime *= qualityMultipliers[request.quality || 'standard'];

    return baseTime;
  }
}