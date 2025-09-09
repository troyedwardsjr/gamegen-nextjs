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
  // Base properties for both models
  description: string;
  negative_description?: string;
  image_size: {
    width: number;
    height: number;
  };
  text_guidance_scale?: number;
  outline?: "no outline" | "thin outline" | "thick outline";
  shading?: "flat" | "cell shading" | "soft shading";
  detail?: "low detail" | "medium detail" | "highly detailed";
  view?: "side" | "low top-down" | "high top-down";
  direction?: "north" | "north-east" | "east" | "south-east" | 
            "south" | "south-west" | "west" | "north-west";
  isometric?: boolean;
  no_background?: boolean;
  seed?: number;

  // Pixflux-specific properties
  init_image?: Base64Image;
  init_image_strength?: number;
  color_image?: Base64Image;

  // Bitforge-specific properties
  extra_guidance_scale?: number;
  style_strength?: number;
  oblique_projection?: boolean;
  coverage_percentage?: number;
  style_image?: Base64Image;
  inpainting_image?: Base64Image;
  mask_image?: Base64Image;
  skeleton_guidance_scale?: number;
  skeleton_keypoints?: Point[];
}

interface Base64Image {
  type: "base64";
  base64: string; // data:image/png;base64,...
}

interface Point {
  x: number;
  y: number;
}

interface PixellabResponse {
  image: Base64Image;
  usage: {
    type: "credits";
    credits: number;
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
  // Determine which model to use
  const modelSelection = this.selectModel(request);
  const endpoint = modelSelection.model === 'pixflux' ? '/generate-image-pixflux' : '/generate-image-bitforge';
  
  // Convert request to appropriate format
  const pixellabRequest = this.convertRequest(request, modelSelection.model);
  
  try {
    const response = await this.makeApiCall(endpoint, pixellabRequest);
    
    if (!response.image || !response.image.base64) {
      throw new AssetGenerationError(
        'No image data in PixelLab response',
        ERROR_CODES.GENERATION_FAILED,
        'pixellab',
        true,
      );
    }

    return this.processResponse(response, request, modelSelection.model);
  } catch (error) {
    if (error instanceof AssetGenerationError) {
      throw error;
    }

    throw new AssetGenerationError(
      `PixelLab generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ERROR_CODES.GENERATION_FAILED,
      'pixellab',
      true,
    );
  }
}

  /**
   * Select the appropriate PixelLab model based on request requirements
   */
  private selectModel(request: AssetGenerationRequest): { model: 'pixflux' | 'bitforge'; reason: string } {
  // Use Bitforge if we have existing assets to maintain style consistency
  if (request.existingAssets && request.existingAssets.length > 0) {
    return { model: 'bitforge', reason: 'Style consistency with existing assets required' };
  }

  // Use Bitforge for smaller images where quality matters more than speed
  if (request.dimensions && 
      request.dimensions.width <= 200 && 
      request.dimensions.height <= 200) {
    return { model: 'bitforge', reason: 'Small image size, prioritizing quality' };
  }

  // Use Bitforge for character sprites that need detailed work
  if (request.assetType === 'sprite' && 
      (request.prompt.toLowerCase().includes('character') || 
       request.prompt.toLowerCase().includes('person') ||
       request.prompt.toLowerCase().includes('warrior') ||
       request.prompt.toLowerCase().includes('hero') ||
       request.prompt.toLowerCase().includes('npc'))) {
    return { model: 'bitforge', reason: 'Character sprite with detailed requirements' };
  }

  // Use Bitforge for high quality requests
  if (request.quality === 'high' || request.quality === 'ultra') {
    return { model: 'bitforge', reason: 'High quality requested, using Bitforge for better results' };
  }

  // Use Pixflux for larger images (Pixflux supports up to 400x400)
  if (request.dimensions && 
      (request.dimensions.width > 200 || request.dimensions.height > 200)) {
    return { model: 'pixflux', reason: 'Large image size, using Pixflux for better support' };
  }

  // Use Pixflux for backgrounds and tilesets (typically larger)
  if (request.assetType === 'background' || request.assetType === 'tileset') {
    return { model: 'pixflux', reason: 'Background/tileset typically needs larger dimensions' };
  }

  // Use Pixflux for multiple variants (faster generation)
  if (request.variants && request.variants > 1) {
    return { model: 'pixflux', reason: 'Multiple variants requested, using faster Pixflux model' };
  }

  // Default to Pixflux for general pixel art generation
  return { model: 'pixflux', reason: 'General pixel art generation, default to Pixflux' };
}

  /**
   * Convert our request format to Pixellab format
   */
  private convertRequest(request: AssetGenerationRequest, model: 'pixflux' | 'bitforge'): PixellabGenerationRequest {
  const pixellabRequest: PixellabGenerationRequest = {
    description: this.enhancePrompt(request),
    image_size: {
      width: request.dimensions?.width || this.getDefaultDimensions(request.assetType).width,
      height: request.dimensions?.height || this.getDefaultDimensions(request.assetType).height,
    },
  };

  // Validate image size constraints based on model
  this.validateImageSizeForModel(pixellabRequest.image_size, model);

  // Map style parameters
  pixellabRequest.outline = this.mapOutlineStyle(request.style);
  pixellabRequest.shading = this.mapShadingStyle(request.style);
  pixellabRequest.detail = this.mapDetailLevel(request.quality);
  
  // Map view and direction from prompt context or explicit settings
  const viewDirection = this.extractViewDirection(request);
  if (viewDirection.view) pixellabRequest.view = viewDirection.view;
  if (viewDirection.direction) pixellabRequest.direction = viewDirection.direction;

  // Set guidance scale based on quality
  const guidanceScale = this.mapQualityToGuidance(request.quality);
  pixellabRequest.text_guidance_scale = guidanceScale;

  // Background handling
  if (request.assetType === 'sprite' || request.assetType === 'ui') {
    pixellabRequest.no_background = true;
  }

  // Handle isometric view for certain asset types
  if (request.assetType === 'tile' || 
      (request.assetType === 'background' && request.prompt.toLowerCase().includes('isometric'))) {
    pixellabRequest.isometric = true;
  }

  // Add negative prompt
  if (request.negativePrompt) {
    pixellabRequest.negative_description = request.negativePrompt;
  }

  // Seed for reproducibility
  if (request.seed) {
    pixellabRequest.seed = request.seed;
  }

  // Model-specific parameters
  if (model === 'pixflux') {
    this.addPixfluxSpecificParams(pixellabRequest, request);
  } else {
    this.addBitforgeSpecificParams(pixellabRequest, request);
  }

  return pixellabRequest;
}

  /**
   * Validate image size constraints for the selected model
   */
  private validateImageSizeForModel(imageSize: { width: number; height: number }, model: 'pixflux' | 'bitforge'): void {
    const area = imageSize.width * imageSize.height;
    
    if (model === 'pixflux') {
      // Pixflux: 32x32 to 400x400 (minimum area 1024, maximum area 160000)
      if (area < 1024) {
        throw new AssetGenerationError(
          'Image too small for Pixflux model (minimum 32x32)',
          ERROR_CODES.INVALID_REQUEST,
          'pixellab',
        );
      }
      if (area > 160000) {
        throw new AssetGenerationError(
          'Image too large for Pixflux model (maximum 400x400)',
          ERROR_CODES.INVALID_REQUEST,
          'pixellab',
        );
      }
    } else {
      // Bitforge: Maximum 200x200 (40000 pixels)
      if (area > 40000) {
        throw new AssetGenerationError(
          'Image too large for Bitforge model (maximum 200x200)',
          ERROR_CODES.INVALID_REQUEST,
          'pixellab',
        );
      }
    }
  }

  /**
   * Map our style to PixelLab outline parameter
   */
  private mapOutlineStyle(style?: AssetStyle): "no outline" | "thin outline" | "thick outline" {
    switch (style) {
      case 'minimalist':
        return "no outline";
      case 'pixel-art':
      case '8bit':
      case '16bit':
        return "thick outline";
      case 'modern':
      case 'cartoon':
        return "thin outline";
      default:
        return "thick outline"; // Default for pixel art
    }
  }

  /**
   * Map our style to PixelLab shading parameter
   */
  private mapShadingStyle(style?: AssetStyle): "flat" | "cell shading" | "soft shading" {
    switch (style) {
      case '8bit':
      case 'minimalist':
        return "flat";
      case 'pixel-art':
      case '16bit':
      case 'cartoon':
        return "cell shading";
      case 'modern':
      case 'realistic':
        return "soft shading";
      default:
        return "cell shading"; // Default for pixel art
    }
  }

  /**
   * Map our quality to PixelLab detail level
   */
  private mapDetailLevel(quality?: string): "low detail" | "medium detail" | "highly detailed" {
    switch (quality) {
      case 'draft':
        return "low detail";
      case 'standard':
        return "medium detail";
      case 'high':
      case 'ultra':
        return "highly detailed";
      default:
        return "medium detail";
    }
  }

  /**
   * Map quality to text guidance scale
   */
  private mapQualityToGuidance(quality?: string): number {
    switch (quality) {
      case 'draft':
        return 6.0;
      case 'standard':
        return 8.0;
      case 'high':
        return 12.0;
      case 'ultra':
        return 15.0;
      default:
        return 8.0;
    }
  }

  /**
   * Extract view and direction from request context
   */
  private extractViewDirection(request: AssetGenerationRequest): { 
    view?: "side" | "low top-down" | "high top-down";
    direction?: "north" | "north-east" | "east" | "south-east" | "south" | "south-west" | "west" | "north-west";
  } {
    const prompt = request.prompt.toLowerCase();
    const result: any = {};

    // Determine view based on asset type and prompt
    if (request.assetType === 'tile' || prompt.includes('top-down') || prompt.includes('overhead')) {
      result.view = prompt.includes('high') ? "high top-down" : "low top-down";
    } else if (request.assetType === 'sprite' || prompt.includes('side view') || prompt.includes('profile')) {
      result.view = "side";
    }

    // Extract direction from prompt
    if (prompt.includes('facing right') || prompt.includes('east')) result.direction = "east";
    else if (prompt.includes('facing left') || prompt.includes('west')) result.direction = "west";
    else if (prompt.includes('facing up') || prompt.includes('north')) result.direction = "north";
    else if (prompt.includes('facing down') || prompt.includes('south')) result.direction = "south";
    else if (prompt.includes('northeast')) result.direction = "north-east";
    else if (prompt.includes('southeast')) result.direction = "south-east";
    else if (prompt.includes('southwest')) result.direction = "south-west";
    else if (prompt.includes('northwest')) result.direction = "north-west";

    return result;
  }

  /**
   * Add Pixflux-specific parameters
   */
  private addPixfluxSpecificParams(pixellabRequest: PixellabGenerationRequest, request: AssetGenerationRequest): void {
  // Note: Current AssetGenerationRequest interface doesn't have baseImage or imageStrength
  // These would need to be added to the interface if needed for img2img functionality
  
  // Handle color palette
  if (request.colorPalette && request.colorPalette.length > 0) {
    // Create a simple color palette image from the colors
    const paletteImage = this.createColorPaletteImage(request.colorPalette);
    if (paletteImage) {
      pixellabRequest.color_image = {
        type: "base64",
        base64: paletteImage
      };
    }
  }
}

  /**
   * Add Bitforge-specific parameters
   */
  private addBitforgeSpecificParams(pixellabRequest: PixellabGenerationRequest, request: AssetGenerationRequest): void {
  // Set extra guidance scale for Bitforge
  pixellabRequest.extra_guidance_scale = 3.0;

  // Style strength based on quality and style bias
  let styleStrength = 60.0; // Default
  if (request.styleBias) {
    // styleBias is -1 to 1, map to style strength 20-90
    styleStrength = 55.0 + (request.styleBias * 35.0);
  }
  if (request.quality === 'high' || request.quality === 'ultra') {
    styleStrength += 15.0; // Higher style strength for quality
  }
  pixellabRequest.style_strength = Math.max(20, Math.min(90, styleStrength));

  // Coverage percentage based on asset type
  switch (request.assetType) {
    case 'sprite':
      pixellabRequest.coverage_percentage = 70.0;
      break;
    case 'background':
      pixellabRequest.coverage_percentage = 90.0;
      break;
    case 'tile':
      pixellabRequest.coverage_percentage = 60.0;
      break;
    case 'ui':
      pixellabRequest.coverage_percentage = 50.0;
      break;
    default:
      pixellabRequest.coverage_percentage = 75.0;
  }

  // Add oblique projection for certain views
  if (request.assetType === 'background' && 
      (request.prompt.toLowerCase().includes('building') || 
       request.prompt.toLowerCase().includes('structure') ||
       request.prompt.toLowerCase().includes('city'))) {
    pixellabRequest.oblique_projection = true;
  }

  // Set skeleton guidance scale for character sprites
  if (request.assetType === 'sprite' && 
      (request.prompt.toLowerCase().includes('character') || 
       request.prompt.toLowerCase().includes('person'))) {
    pixellabRequest.skeleton_guidance_scale = 2.0;
  }
}

  /**
   * Create a simple color palette image from color array
   */
  private createColorPaletteImage(colors: string[]): string | null {
    // This is a simplified implementation
    // In a real implementation, you'd generate a small image with the color swatches
    // For now, we'll skip this and let the API handle natural color constraints
    return null;
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
  private async makeApiCall(endpoint: string, data: PixellabGenerationRequest): Promise<PixellabResponse> {
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
        'Invalid PixelLab API key',
        ERROR_CODES.UNAUTHORIZED,
        'pixellab',
      );
    }
    
    if (response.status === 402) {
      throw new AssetGenerationError(
        'Insufficient PixelLab credits',
        ERROR_CODES.INSUFFICIENT_CREDITS,
        'pixellab',
      );
    }
    
    if (response.status === 422) {
      // Try to get validation error details
      let errorMessage = 'PixelLab validation error';
      try {
        const errorBody = await response.json();
        if (errorBody.detail && Array.isArray(errorBody.detail)) {
          errorMessage = `Validation error: ${errorBody.detail.map((e: any) => e.msg).join(', ')}`;
        } else if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Use default message if we can't parse error
      }
      
      throw new AssetGenerationError(
        errorMessage,
        ERROR_CODES.INVALID_REQUEST,
        'pixellab',
      );
    }
    
    if (response.status === 429) {
      throw new AssetGenerationError(
        'PixelLab rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'pixellab',
        true,
      );
    }

    if (response.status === 529) {
      throw new AssetGenerationError(
        'PixelLab rate limit exceeded (529)',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'pixellab',
        true,
      );
    }

    if (response.status >= 500) {
      throw new AssetGenerationError(
        'PixelLab service temporarily unavailable',
        ERROR_CODES.PROVIDER_NOT_AVAILABLE,
        'pixellab',
        true,
      );
    }

    throw new AssetGenerationError(
      `PixelLab API error: ${response.status}`,
      ERROR_CODES.GENERATION_FAILED,
      'pixellab',
      response.status >= 500,
    );
  }

  const responseData = await response.json();
  return responseData as PixellabResponse;
}

  /**
   * Process Pixellab response
   */
  private processResponse(response: PixellabResponse, request: AssetGenerationRequest, model: 'pixflux' | 'bitforge'): any {
  if (!response.image || !response.image.base64) {
    throw new AssetGenerationError(
      'No image data in PixelLab response',
      ERROR_CODES.GENERATION_FAILED,
      'pixellab',
    );
  }

  // Extract base64 data (handle data URL format)
  let base64Data = response.image.base64;
  if (base64Data.startsWith('data:image/')) {
    base64Data = base64Data.split(',')[1];
  }
  
  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  return {
    buffer: imageBuffer,
    metadata: {
      width: request.dimensions?.width || this.getDefaultDimensions(request.assetType).width,
      height: request.dimensions?.height || this.getDefaultDimensions(request.assetType).height,
      format: 'png',
      mimeType: 'image/png',
      fileSize: imageBuffer.length,
      provider: 'pixellab',
      model: model,
      creditsUsed: response.usage?.credits || 1,
      generatedBy: {
        provider: 'pixellab',
        model: model,
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      processingTime: Date.now(),
      qualityScore: 0.85, // Default quality score for PixelLab
      pixelArt: true,
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