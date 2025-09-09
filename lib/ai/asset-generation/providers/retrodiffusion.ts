/**
 * Retrodiffusion Provider
 * 
 * Integration with Retrodiffusion API for retro-style pixel art generation.
 * Specialized for nostalgic game assets with authentic retro aesthetics.
 */

import { 
  AssetGenerationRequest, 
  ProviderConfig, 
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
  AssetStyle,
} from '../types';

interface RetrodiffusionGenerationRequest {
  prompt: string;
  style: string;
  width: number;
  height: number;
  retro_level?: number; // 1-10, how retro/vintage the output should be
  color_palette?: 'c64' | 'nes' | 'gameboy' | 'cga' | 'custom';
  custom_colors?: string[];
  dithering?: boolean;
  scanlines?: boolean;
  crt_effect?: boolean;
  negative_prompt?: string;
  seed?: number;
  quality?: 'draft' | 'standard' | 'high';
}

interface RetrodiffusionResponse {
  success: boolean;
  data?: {
    image_url: string;
    image_data: string; // Base64 encoded
    metadata: {
      width: number;
      height: number;
      retro_score: number;
      authenticity_score: number;
      color_palette_used: string;
      processing_time: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class RetrodiffusionProvider {
  public readonly name = 'Retrodiffusion';
  private config: ProviderConfig;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'https://api.retrodiffusion.ai/v1';
    
    if (!config.apiKey) {
      throw new AssetGenerationError(
        'Retrodiffusion API key is required',
        ERROR_CODES.INVALID_REQUEST,
      );
    }
    
    this.apiKey = config.apiKey;
  }

  /**
   * Generate asset using Retrodiffusion API
   */
  async generateAsset(request: AssetGenerationRequest): Promise<any> {
    const retroRequest = this.convertRequest(request);
    
    try {
      const response = await this.makeApiCall('/generate', retroRequest);
      
      if (!response.success || !response.data) {
        throw new AssetGenerationError(
          response.error?.message || 'Generation failed',
          ERROR_CODES.GENERATION_FAILED,
          'retrodiffusion',
          true,
        );
      }

      return this.processResponse(response, request);
    } catch (error) {
      if (error instanceof AssetGenerationError) {
        throw error;
      }

      throw new AssetGenerationError(
        `Retrodiffusion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GENERATION_FAILED,
        'retrodiffusion',
        true,
      );
    }
  }

  /**
   * Convert our request format to Retrodiffusion format
   */
  private convertRequest(request: AssetGenerationRequest): RetrodiffusionGenerationRequest {
    const retroRequest: RetrodiffusionGenerationRequest = {
      prompt: this.enhancePromptForRetro(request),
      style: this.mapStyleToRetro(request.style || 'retro'),
      width: request.dimensions?.width || this.getDefaultDimensions(request.assetType).width,
      height: request.dimensions?.height || this.getDefaultDimensions(request.assetType).height,
    };

    // Retro-specific parameters
    retroRequest.retro_level = this.calculateRetroLevel(request.style);
    retroRequest.color_palette = this.mapColorPalette(request.colorPalette, request.style);
    
    // Custom color palette
    if (request.colorPalette && request.colorPalette.length > 0) {
      retroRequest.color_palette = 'custom';
      retroRequest.custom_colors = request.colorPalette;
    }

    // Retro effects
    retroRequest.dithering = this.shouldUseDithering(request);
    retroRequest.scanlines = this.shouldUseScanlines(request);
    retroRequest.crt_effect = request.style === '8bit' || request.style === 'retro';

    // Quality and other parameters
    retroRequest.quality = request.quality || 'standard';
    
    if (request.negativePrompt) {
      retroRequest.negative_prompt = request.negativePrompt;
    }
    
    if (request.seed) {
      retroRequest.seed = request.seed;
    }

    return retroRequest;
  }

  /**
   * Enhance prompt with retro-specific context
   */
  private enhancePromptForRetro(request: AssetGenerationRequest): string {
    let enhancedPrompt = request.prompt;

    // Add retro gaming context
    const retroTerms = {
      sprite: 'classic arcade game sprite',
      background: 'retro game background scene',
      tile: 'vintage game tile texture',
      animation: 'old-school animated sprite',
      tileset: 'classic game tileset',
      ui: 'retro game interface element',
    };

    const retroContext = retroTerms[request.assetType];
    if (retroContext && !enhancedPrompt.toLowerCase().includes('retro')) {
      enhancedPrompt = `${retroContext}, ${enhancedPrompt}`;
    }

    // Add era-specific context
    const styleEras = {
      '8bit': '1980s arcade style, 8-bit era graphics',
      '16bit': '1990s console style, 16-bit era graphics',
      'retro': 'vintage gaming aesthetic, nostalgic feel',
      'pixel-art': 'classic pixel art, crisp retro pixels',
    };

    const eraContext = styleEras[request.style as keyof typeof styleEras];
    if (eraContext) {
      enhancedPrompt += `, ${eraContext}`;
    }

    // Add authentic retro limitations
    enhancedPrompt += ', limited color palette, authentic retro feel';

    // Add project theme with retro twist
    if (request.projectTheme) {
      enhancedPrompt = `retro ${request.projectTheme} style ${enhancedPrompt}`;
    }

    return enhancedPrompt;
  }

  /**
   * Map our style to Retrodiffusion style
   */
  private mapStyleToRetro(style: AssetStyle): string {
    const styleMapping = {
      'pixel-art': 'classic_pixel',
      '8bit': 'eighties_arcade',
      '16bit': 'nineties_console',
      'retro': 'vintage_gaming',
      'modern': 'modern_retro',
      'minimalist': 'minimal_retro',
      'cartoon': 'cartoon_retro',
      'realistic': 'detailed_retro',
      'abstract': 'abstract_retro',
    };

    return styleMapping[style] || 'vintage_gaming';
  }

  /**
   * Calculate appropriate retro level (1-10)
   */
  private calculateRetroLevel(style?: AssetStyle): number {
    const retroLevels = {
      '8bit': 9,      // Very retro
      '16bit': 7,     // Moderately retro
      'retro': 8,     // Quite retro
      'pixel-art': 6, // Somewhat retro
      'modern': 3,    // Less retro
    };

    return retroLevels[style as keyof typeof retroLevels] || 6;
  }

  /**
   * Map color palette to retro standards
   */
  private mapColorPalette(
    colorPalette?: string[], 
    style?: AssetStyle
  ): 'c64' | 'nes' | 'gameboy' | 'cga' | 'custom' {
    if (colorPalette && colorPalette.length > 0) {
      return 'custom';
    }

    // Map styles to classic palettes
    const paletteMapping = {
      '8bit': 'nes',
      'retro': 'c64',
      'pixel-art': 'nes',
      '16bit': 'nes',
    };

    return paletteMapping[style as keyof typeof paletteMapping] || 'nes';
  }

  /**
   * Determine if dithering should be used
   */
  private shouldUseDithering(request: AssetGenerationRequest): boolean {
    // Dithering is great for retro styles with limited colors
    const ditheringStyles = ['8bit', 'retro', 'pixel-art'];
    return ditheringStyles.includes(request.style || '');
  }

  /**
   * Determine if scanlines should be used
   */
  private shouldUseScanlines(request: AssetGenerationRequest): boolean {
    // Scanlines for authentic CRT feel
    return request.style === '8bit' || request.style === 'retro';
  }

  /**
   * Get default dimensions optimized for retro gaming
   */
  private getDefaultDimensions(assetType: AssetType): { width: number; height: number } {
    const retroDefaults = {
      sprite: { width: 16, height: 16 },    // Classic sprite size
      background: { width: 256, height: 240 }, // NES resolution
      tile: { width: 8, height: 8 },        // Classic tile size
      animation: { width: 16, height: 16 },  // Animation sprite
      tileset: { width: 128, height: 128 },  // Tileset collection
      ui: { width: 64, height: 16 },         // UI element
    };

    return retroDefaults[assetType] || { width: 16, height: 16 };
  }

  /**
   * Make API call to Retrodiffusion
   */
  private async makeApiCall(endpoint: string, data: any): Promise<RetrodiffusionResponse> {
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
          'Invalid Retrodiffusion API key',
          ERROR_CODES.UNAUTHORIZED,
          'retrodiffusion',
        );
      }
      
      if (response.status === 429) {
        throw new AssetGenerationError(
          'Retrodiffusion rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'retrodiffusion',
          true,
        );
      }

      if (response.status === 503) {
        throw new AssetGenerationError(
          'Retrodiffusion service temporarily unavailable',
          ERROR_CODES.PROVIDER_NOT_AVAILABLE,
          'retrodiffusion',
          true,
        );
      }

      throw new AssetGenerationError(
        `Retrodiffusion API error: ${response.status}`,
        ERROR_CODES.GENERATION_FAILED,
        'retrodiffusion',
        response.status >= 500,
      );
    }

    return await response.json();
  }

  /**
   * Process Retrodiffusion response
   */
  private processResponse(response: RetrodiffusionResponse, request: AssetGenerationRequest): any {
    if (!response.data) {
      throw new AssetGenerationError(
        'No image data in Retrodiffusion response',
        ERROR_CODES.GENERATION_FAILED,
        'retrodiffusion',
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
        provider: 'retrodiffusion',
        retroScore: data.metadata.retro_score,
        authenticityScore: data.metadata.authenticity_score,
        colorPaletteUsed: data.metadata.color_palette_used,
        processingTime: data.metadata.processing_time,
        qualityScore: Math.min((data.metadata.retro_score + data.metadata.authenticity_score) / 2, 1.0),
        
        // Retro-specific metadata
        retroEffects: {
          dithering: this.shouldUseDithering(request),
          scanlines: this.shouldUseScanlines(request),
          crtEffect: request.style === '8bit' || request.style === 'retro',
          retroLevel: this.calculateRetroLevel(request.style),
        },
      },
    };
  }

  /**
   * Health check for Retrodiffusion service
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
      console.error('Retrodiffusion health check failed:', error);
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
      supportedAssetTypes: ['sprite', 'background', 'tile', 'animation', 'tileset', 'ui'],
      supportedStyles: ['8bit', '16bit', 'retro', 'pixel-art'],
      supportedFormats: ['png'],
      maxDimensions: { width: 512, height: 512 },
    };
  }

  /**
   * Generate retro animation sequence
   */
  async generateRetroAnimation(
    request: AssetGenerationRequest & { frameCount: number }
  ): Promise<any> {
    const frames = [];
    
    // Generate frames with consistent retro styling
    for (let i = 0; i < request.frameCount; i++) {
      const frameRequest = {
        ...request,
        prompt: `${request.prompt}, retro animation frame ${i + 1}`,
        seed: request.seed ? request.seed + i * 100 : undefined, // Larger seed jumps for variation
      };

      try {
        const frame = await this.generateAsset(frameRequest);
        frames.push({
          frameNumber: i,
          ...frame,
        });
      } catch (error) {
        console.error(`Failed to generate retro frame ${i + 1}:`, error);
      }
    }

    return {
      frames,
      metadata: {
        totalFrames: request.frameCount,
        successfulFrames: frames.length,
        provider: 'retrodiffusion',
        retroAnimationStyle: this.mapStyleToRetro(request.style || 'retro'),
        preservedRetroAesthetic: true,
      },
    };
  }

  /**
   * Generate asset with specific retro palette
   */
  async generateWithRetroPalette(
    request: AssetGenerationRequest,
    palette: 'c64' | 'nes' | 'gameboy' | 'cga'
  ): Promise<any> {
    const paletteRequest = {
      ...request,
      colorPalette: this.getRetroPaletteColors(palette),
    };

    return this.generateAsset(paletteRequest);
  }

  /**
   * Get colors for classic retro palettes
   */
  private getRetroPaletteColors(palette: 'c64' | 'nes' | 'gameboy' | 'cga'): string[] {
    const palettes = {
      c64: [
        '#000000', '#FFFFFF', '#68372B', '#70A4B2',
        '#6F3D86', '#588D43', '#352879', '#B8C76F',
        '#6F4F25', '#433900', '#9A6759', '#444444',
        '#6C6C6C', '#9AD284', '#6C5EB5', '#959595'
      ],
      nes: [
        '#7C7C7C', '#0000FC', '#0000BC', '#4428BC',
        '#940084', '#A80020', '#A81000', '#881400',
        '#503000', '#007800', '#006800', '#005800',
        '#004058', '#000000', '#000000', '#000000'
      ],
      gameboy: [
        '#0F380F', '#306230', '#8BAC0F', '#9BBD0F'
      ],
      cga: [
        '#000000', '#0000AA', '#00AA00', '#00AAAA',
        '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
        '#555555', '#5555FF', '#55FF55', '#55FFFF',
        '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
      ],
    };

    return palettes[palette] || palettes.nes;
  }

  /**
   * Estimate generation time for retro assets
   */
  estimateGenerationTime(request: AssetGenerationRequest): number {
    let baseTime = 18000; // 18 seconds base for retro processing

    // Retro processing takes longer due to authenticity checks
    const retroLevel = this.calculateRetroLevel(request.style);
    baseTime += retroLevel * 1000;

    // Adjust for dimensions
    if (request.dimensions) {
      const pixels = request.dimensions.width * request.dimensions.height;
      if (pixels > 128 * 128) {
        baseTime *= 1.3; // Larger retro assets take more time
      }
    }

    // Quality adjustments
    const qualityMultipliers = {
      draft: 0.8,
      standard: 1.0,
      high: 1.4,
    };
    baseTime *= qualityMultipliers[request.quality || 'standard'];

    return baseTime;
  }

  /**
   * Validate retro authenticity
   */
  async validateRetroAuthenticity(asset: any): Promise<{
    score: number;
    feedback: string[];
    improvements: string[];
  }> {
    const feedback: string[] = [];
    const improvements: string[] = [];
    let score = 0.7; // Base score

    const metadata = asset.metadata || {};

    // Check retro score if available
    if (metadata.retroScore !== undefined) {
      score = metadata.retroScore;
      
      if (score < 0.6) {
        feedback.push('Asset may not feel authentically retro');
        improvements.push('Try using a more limited color palette');
        improvements.push('Consider adding dithering effects');
      } else if (score > 0.8) {
        feedback.push('Excellent retro authenticity achieved');
      }
    }

    // Check authenticity score
    if (metadata.authenticityScore !== undefined) {
      if (metadata.authenticityScore < 0.7) {
        improvements.push('Consider using classic retro gaming references');
        improvements.push('Reduce color count for more authentic feel');
      }
    }

    // Check dimensions against retro standards
    if (metadata.dimensions) {
      const { width, height } = metadata.dimensions;
      if (width > 256 || height > 240) {
        feedback.push('Dimensions are larger than classic retro gaming standards');
        improvements.push('Consider smaller dimensions (256x240 or less)');
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      feedback,
      improvements,
    };
  }
}