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
    pixellabRequest.quality = request.quality || 'standard';

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
    
    for (let i = 0; i < request.frameCount; i++) {
      const frameRequest = {
        ...request,
        prompt: `${request.prompt}, animation frame ${i + 1} of ${request.frameCount}`,
        seed: request.seed ? request.seed + i : undefined,
      };

      try {
        const frame = await this.generateAsset(frameRequest);
        frames.push({
          frameNumber: i,
          ...frame,
        });
      } catch (error) {
        console.error(`Failed to generate frame ${i + 1}:`, error);
        // Continue with other frames
      }
    }

    return {
      frames,
      metadata: {
        totalFrames: request.frameCount,
        successfulFrames: frames.length,
        provider: 'pixellab',
      },
    };
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