/**
 * DALL-E Provider
 * 
 * Integration with OpenAI's DALL-E API as a fallback provider for asset generation.
 * Optimized for modern and realistic styles when specialized pixel art providers fail.
 */

import { 
  AssetGenerationRequest, 
  ProviderConfig, 
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
  AssetStyle,
} from '../types';

interface DalleGenerationRequest {
  model: 'dall-e-2' | 'dall-e-3';
  prompt: string;
  n: number;
  size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  response_format?: 'url' | 'b64_json';
}

interface DalleResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

export class DalleProvider {
  public readonly name = 'DALL-E';
  private config: ProviderConfig;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'https://api.openai.com/v1';
    
    if (!config.apiKey) {
      throw new AssetGenerationError(
        'OpenAI API key is required',
        ERROR_CODES.INVALID_REQUEST,
      );
    }
    
    this.apiKey = config.apiKey;
  }

  /**
   * Generate asset using DALL-E API
   */
  async generateAsset(request: AssetGenerationRequest): Promise<any> {
    const dalleRequest = this.convertRequest(request);
    
    try {
      const response = await this.makeApiCall('/images/generations', dalleRequest);
      
      if (!response.data || response.data.length === 0) {
        throw new AssetGenerationError(
          'No image data in DALL-E response',
          ERROR_CODES.GENERATION_FAILED,
          'dalle',
          true,
        );
      }

      return this.processResponse(response, request);
    } catch (error) {
      if (error instanceof AssetGenerationError) {
        throw error;
      }

      throw new AssetGenerationError(
        `DALL-E generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GENERATION_FAILED,
        'dalle',
        true,
      );
    }
  }

  /**
   * Convert our request format to DALL-E format
   */
  private convertRequest(request: AssetGenerationRequest): DalleGenerationRequest {
    const dalleRequest: DalleGenerationRequest = {
      model: this.selectModel(request),
      prompt: this.enhancePromptForDalle(request),
      n: 1,
      size: this.mapDimensions(request.dimensions),
      response_format: 'b64_json',
    };

    // DALL-E 3 specific parameters
    if (dalleRequest.model === 'dall-e-3') {
      dalleRequest.quality = request.quality === 'high' || request.quality === 'ultra' ? 'hd' : 'standard';
      dalleRequest.style = this.mapStyleToDalle(request.style);
    }

    return dalleRequest;
  }

  /**
   * Select appropriate DALL-E model
   */
  private selectModel(request: AssetGenerationRequest): 'dall-e-2' | 'dall-e-3' {
    // Use DALL-E 3 for higher quality requests
    if (request.quality === 'high' || request.quality === 'ultra') {
      return 'dall-e-3';
    }

    // Use DALL-E 3 for complex modern styles
    if (request.style === 'modern' || request.style === 'realistic') {
      return 'dall-e-3';
    }

    // Use DALL-E 2 for simpler requests (faster and cheaper)
    return 'dall-e-2';
  }

  /**
   * Enhance prompt for DALL-E generation
   */
  private enhancePromptForDalle(request: AssetGenerationRequest): string {
    let enhancedPrompt = request.prompt;

    // Add game asset context
    const assetContexts = {
      sprite: 'video game character sprite icon',
      background: 'video game background scene',
      tile: 'repeatable game texture tile',
      animation: 'video game sprite animation frame',
      tileset: 'video game tileset collection',
      ui: 'video game user interface element',
    };

    const assetContext = assetContexts[request.assetType];
    if (assetContext) {
      enhancedPrompt = `${assetContext} of ${enhancedPrompt}`;
    }

    // Add style guidance for DALL-E
    if (request.style) {
      const stylePrompts = {
        'pixel-art': 'in pixel art style with crisp sharp pixels and limited color palette',
        '8bit': 'in 8-bit video game style with retro pixelated look',
        '16bit': 'in 16-bit video game style with detailed pixel art',
        '32bit': 'in 32-bit video game style with high-color detailed pixel art',
        'retro': 'in retro vintage video game style',
        'modern': 'in modern video game art style with polished graphics',
        'minimalist': 'in minimalist clean art style',
        'cartoon': 'in cartoon illustration style',
        'realistic': 'in realistic detailed art style',
        'abstract': 'in abstract artistic style',
      };

      const stylePrompt = stylePrompts[request.style];
      if (stylePrompt) {
        enhancedPrompt += ` ${stylePrompt}`;
      }
    }

    // Add transparency requirement for sprites
    if (request.assetType === 'sprite' || request.assetType === 'ui') {
      enhancedPrompt += ', transparent background, isolated object';
    }

    // Add color palette constraints if specified
    if (request.colorPalette && request.colorPalette.length > 0) {
      const colorString = request.colorPalette.slice(0, 5).join(', '); // Limit to 5 colors for prompt
      enhancedPrompt += `, using color palette: ${colorString}`;
    }

    // Add quality and detail guidance
    if (request.quality === 'high' || request.quality === 'ultra') {
      enhancedPrompt += ', highly detailed, professional quality';
    }

    // Ensure prompt isn't too long (DALL-E has limits)
    if (enhancedPrompt.length > 1000) {
      enhancedPrompt = enhancedPrompt.substring(0, 1000).trim();
    }

    return enhancedPrompt;
  }

  /**
   * Map our dimensions to DALL-E supported sizes
   */
  private mapDimensions(
    dimensions?: { width: number; height: number }
  ): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' {
    if (!dimensions) {
      return '512x512';
    }

    const { width, height } = dimensions;
    
    // For DALL-E 3, support rectangular formats
    if (width > height) {
      if (width >= 1400 || height >= 800) {
        return '1792x1024';
      }
    } else if (height > width) {
      if (height >= 1400 || width >= 800) {
        return '1024x1792';
      }
    }

    // Square formats
    if (Math.max(width, height) >= 800) {
      return '1024x1024';
    } else if (Math.max(width, height) >= 400) {
      return '512x512';
    } else {
      return '256x256';
    }
  }

  /**
   * Map our style to DALL-E style parameter
   */
  private mapStyleToDalle(style?: AssetStyle): 'vivid' | 'natural' {
    // Vivid for more stylized, dramatic results
    const vividStyles = ['pixel-art', 'cartoon', 'abstract', 'modern'];
    
    if (style && vividStyles.includes(style)) {
      return 'vivid';
    }
    
    // Natural for more realistic, subdued results
    return 'natural';
  }

  /**
   * Make API call to OpenAI
   */
  private async makeApiCall(endpoint: string, data: any): Promise<DalleResponse> {
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
          'Invalid OpenAI API key',
          ERROR_CODES.UNAUTHORIZED,
          'dalle',
        );
      }
      
      if (response.status === 429) {
        throw new AssetGenerationError(
          'OpenAI rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'dalle',
          true,
        );
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new AssetGenerationError(
          `DALL-E request error: ${errorData.error?.message || 'Invalid request'}`,
          ERROR_CODES.INVALID_REQUEST,
          'dalle',
        );
      }

      if (response.status >= 500) {
        throw new AssetGenerationError(
          'OpenAI service temporarily unavailable',
          ERROR_CODES.PROVIDER_NOT_AVAILABLE,
          'dalle',
          true,
        );
      }

      throw new AssetGenerationError(
        `OpenAI API error: ${response.status}`,
        ERROR_CODES.GENERATION_FAILED,
        'dalle',
        response.status >= 500,
      );
    }

    return await response.json();
  }

  /**
   * Process DALL-E response
   */
  private processResponse(response: DalleResponse, request: AssetGenerationRequest): any {
    const imageData = response.data[0];
    
    if (!imageData.b64_json) {
      throw new AssetGenerationError(
        'No base64 image data in DALL-E response',
        ERROR_CODES.GENERATION_FAILED,
        'dalle',
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
    
    // Parse dimensions from the size parameter used
    const dimensionsParts = this.mapDimensions(request.dimensions).split('x');
    const width = parseInt(dimensionsParts[0]);
    const height = parseInt(dimensionsParts[1]);

    return {
      buffer: imageBuffer,
      url: imageData.url,
      metadata: {
        width,
        height,
        format: 'png',
        mimeType: 'image/png',
        fileSize: imageBuffer.length,
        provider: 'dalle',
        model: this.selectModel(request),
        revisedPrompt: imageData.revised_prompt,
        qualityScore: 0.85, // DALL-E generally produces good quality
        
        // DALL-E specific metadata
        generationDetails: {
          originalPrompt: request.prompt,
          enhancedPrompt: this.enhancePromptForDalle(request),
          modelUsed: this.selectModel(request),
          sizeRequested: this.mapDimensions(request.dimensions),
        },
      },
    };
  }

  /**
   * Health check for OpenAI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      } as any);

      return response.ok;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
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
      supportedAssetTypes: ['sprite', 'background', 'ui', 'animation'],
      supportedStyles: ['modern', 'realistic', 'cartoon', 'abstract', 'pixel-art'],
      supportedFormats: ['png'],
      maxDimensions: { width: 1792, height: 1792 },
    };
  }

  /**
   * Generate variations of an asset
   */
  async generateVariations(
    baseImage: Buffer,
    request: AssetGenerationRequest,
    count: number = 2
  ): Promise<any[]> {
    // DALL-E 2 supports variations, DALL-E 3 doesn't
    if (this.selectModel(request) === 'dall-e-3') {
      throw new AssetGenerationError(
        'Variations not supported with DALL-E 3',
        ERROR_CODES.UNSUPPORTED_ASSET_TYPE,
        'dalle',
      );
    }

    try {
      // Convert buffer to form data
      const formData = new FormData();
      formData.append('image', new Blob([baseImage]), 'image.png');
      formData.append('n', Math.min(count, 10).toString());
      formData.append('size', this.mapDimensions(request.dimensions));
      formData.append('response_format', 'b64_json');

      const response = await fetch(`${this.baseUrl}/images/variations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DalleResponse = await response.json();
      
      return data.data.map((item, index) => {
        if (!item.b64_json) return null;
        
        const buffer = Buffer.from(item.b64_json, 'base64');
        return {
          buffer,
          url: item.url,
          variationIndex: index,
          metadata: {
            width: parseInt(this.mapDimensions(request.dimensions).split('x')[0]),
            height: parseInt(this.mapDimensions(request.dimensions).split('x')[1]),
            format: 'png',
            mimeType: 'image/png',
            fileSize: buffer.length,
            provider: 'dalle',
            model: 'dall-e-2',
            isVariation: true,
            baseImageProvided: true,
          },
        };
      }).filter(Boolean);
    } catch (error) {
      throw new AssetGenerationError(
        `DALL-E variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GENERATION_FAILED,
        'dalle',
        true,
      );
    }
  }

  /**
   * Edit an existing image (DALL-E 2 only)
   */
  async editImage(
    originalImage: Buffer,
    mask: Buffer,
    request: AssetGenerationRequest
  ): Promise<any> {
    if (this.selectModel(request) === 'dall-e-3') {
      throw new AssetGenerationError(
        'Image editing not supported with DALL-E 3',
        ERROR_CODES.UNSUPPORTED_ASSET_TYPE,
        'dalle',
      );
    }

    try {
      const formData = new FormData();
      formData.append('image', new Blob([originalImage]), 'image.png');
      formData.append('mask', new Blob([mask]), 'mask.png');
      formData.append('prompt', this.enhancePromptForDalle(request));
      formData.append('n', '1');
      formData.append('size', this.mapDimensions(request.dimensions));
      formData.append('response_format', 'b64_json');

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DalleResponse = await response.json();
      return this.processResponse(data, request);
    } catch (error) {
      throw new AssetGenerationError(
        `DALL-E image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GENERATION_FAILED,
        'dalle',
        true,
      );
    }
  }

  /**
   * Estimate generation time for DALL-E
   */
  estimateGenerationTime(request: AssetGenerationRequest): number {
    const model = this.selectModel(request);
    
    // DALL-E 3 is slower but higher quality
    let baseTime = model === 'dall-e-3' ? 25000 : 15000; // 25s vs 15s
    
    // Larger images take more time
    const dimensions = this.mapDimensions(request.dimensions);
    if (dimensions === '1024x1024' || dimensions === '1792x1024' || dimensions === '1024x1792') {
      baseTime *= 1.5;
    }
    
    // HD quality takes longer
    if (request.quality === 'high' || request.quality === 'ultra') {
      baseTime *= 1.3;
    }
    
    return baseTime;
  }

  /**
   * Check if request is suitable for DALL-E
   */
  isSuitableForRequest(request: AssetGenerationRequest): boolean {
    // DALL-E works best for modern, realistic, or abstract styles
    const suitableStyles = ['modern', 'realistic', 'cartoon', 'abstract'];
    
    if (request.style && suitableStyles.includes(request.style)) {
      return true;
    }
    
    // Less suitable for pure pixel art (but can work as fallback)
    const pixelArtStyles = ['pixel-art', '8bit', '16bit'];
    if (request.style && pixelArtStyles.includes(request.style)) {
      return false;
    }
    
    // Generally suitable for most asset types except tiles
    return request.assetType !== 'tile';
  }
}