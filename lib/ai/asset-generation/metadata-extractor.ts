/**
 * Asset Metadata Extractor
 * 
 * Advanced metadata extraction for AI-generated assets including color analysis,
 * dimension detection, automatic tagging, animation frame detection, and semantic analysis.
 */

import {
  AssetGenerationRequest,
  AssetMetadata,
  AssetFormat,
  AssetGenerationError,
  ERROR_CODES,
} from './types';

interface MetadataExtractionConfig {
  extractColors?: boolean;
  extractDimensions?: boolean;
  generateTags?: boolean;
  detectAnimationFrames?: boolean;
  colorAnalysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  semanticAnalysis?: boolean;
}

interface ColorAnalysis {
  palette: string[];
  count: number;
  dominant: string;
  distribution: { color: string; percentage: number }[];
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'mixed';
  temperature: 'warm' | 'cool' | 'neutral';
}

interface SemanticAnalysis {
  contentType: string;
  objects: string[];
  mood: string;
  style: string;
  complexity: number;
  recognizedElements: string[];
}

export class AssetMetadataExtractor {
  private config: MetadataExtractionConfig;

  constructor(config: MetadataExtractionConfig = {}) {
    this.config = {
      extractColors: true,
      extractDimensions: true,
      generateTags: true,
      detectAnimationFrames: false,
      colorAnalysisDepth: 'detailed',
      semanticAnalysis: true,
      ...config,
    };
  }

  /**
   * Extract comprehensive metadata from asset
   */
  async extractMetadata(
    asset: any,
    request?: AssetGenerationRequest
  ): Promise<AssetMetadata> {
    try {
      const buffer = asset.processedAsset || asset.buffer;
      const originalMetadata = asset.metadata || {};

      // Extract basic metadata
      const dimensions = await this.extractDimensions(buffer, originalMetadata);
      const format = this.detectFormat(buffer, originalMetadata);
      const fileSize = buffer.length;

      // Extract colors if requested
      let colors: ColorAnalysis | undefined;
      if (this.config.extractColors) {
        colors = await this.analyzeColors(buffer, dimensions);
      }

      // Generate tags if requested
      let tags: string[] = [];
      if (this.config.generateTags) {
        tags = await this.generateTags(buffer, request, colors, dimensions);
      }

      // Detect animation frames if applicable
      let animationFrames = 0;
      if (this.config.detectAnimationFrames && format === 'gif') {
        animationFrames = await this.detectAnimationFrames(buffer);
      }

      // Perform semantic analysis if requested
      let semanticData: SemanticAnalysis | undefined;
      if (this.config.semanticAnalysis) {
        semanticData = await this.performSemanticAnalysis(buffer, request);
      }

      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(
        buffer,
        dimensions,
        colors,
        request
      );

      // Generate content hash for deduplication
      const hash = await this.generateContentHash(buffer);

      return {
        dimensions,
        fileSize,
        format,
        colors: colors ? {
          palette: colors.palette,
          count: colors.count,
          dominant: colors.dominant,
        } : undefined,
        tags,
        hash,
        
        // Quality metrics
        pixelArtScore: qualityMetrics.pixelArtScore,
        styleConsistency: qualityMetrics.styleConsistency,
        visualComplexity: qualityMetrics.visualComplexity,
        
        // Technical details
        transparency: await this.hasTransparency(buffer),
        compression: this.estimateCompression(buffer, fileSize),
        dpi: 72, // Default DPI for web assets
        
        // Extended metadata
        ...(colors && {
          colorHarmony: colors.harmony,
          colorTemperature: colors.temperature,
          colorDistribution: colors.distribution,
        }),
        
        ...(semanticData && {
          contentType: semanticData.contentType,
          detectedObjects: semanticData.objects,
          mood: semanticData.mood,
          recognizedElements: semanticData.recognizedElements,
        }),
        
        ...(animationFrames > 0 && {
          animationFrames,
          isAnimated: true,
        }),
      };
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      
      // Return minimal metadata on failure
      return {
        dimensions: { width: 64, height: 64 },
        fileSize: asset.buffer?.length || 0,
        format: 'png',
        tags: [],
      };
    }
  }

  /**
   * Extract image dimensions
   */
  private async extractDimensions(
    buffer: Buffer,
    existingMetadata: any = {}
  ): Promise<{ width: number; height: number }> {
    // If we already have dimensions from previous processing, use them
    if (existingMetadata.dimensions) {
      return existingMetadata.dimensions;
    }

    // In a real implementation, this would use an image processing library
    // like Sharp, jimp, or image-size to extract actual dimensions
    try {
      // Placeholder implementation - would parse image headers
      return this.parseImageDimensions(buffer);
    } catch (error) {
      console.error('Failed to extract dimensions:', error);
      return { width: 64, height: 64 }; // Default fallback
    }
  }

  /**
   * Parse image dimensions from buffer (placeholder implementation)
   */
  private parseImageDimensions(buffer: Buffer): { width: number; height: number } {
    // This would implement actual image format parsing
    // For PNG: read header at bytes 16-23
    // For JPEG: search for SOF markers
    // For WebP: parse RIFF header
    // For GIF: read logical screen descriptor
    
    // Placeholder implementation
    if (buffer.length > 24) {
      // Simulate PNG header parsing
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        // PNG signature found - would read width/height from header
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width > 0 && width < 10000 && height > 0 && height < 10000) {
          return { width, height };
        }
      }
    }
    
    return { width: 64, height: 64 };
  }

  /**
   * Detect image format from buffer
   */
  private detectFormat(buffer: Buffer, existingMetadata: any = {}): AssetFormat {
    if (existingMetadata.format) {
      return existingMetadata.format;
    }

    // Check magic bytes to detect format
    if (buffer.length < 4) return 'png';

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }

    // JPEG: FF D8
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return 'jpg';
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'webp';
      }
    }

    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'gif';
    }

    return 'png'; // Default
  }

  /**
   * Analyze colors in the image
   */
  private async analyzeColors(
    buffer: Buffer,
    dimensions: { width: number; height: number }
  ): Promise<ColorAnalysis> {
    try {
      // In a real implementation, this would:
      // 1. Decode the image pixel data
      // 2. Extract color information from pixels
      // 3. Perform color quantization and analysis
      // 4. Calculate color harmony and temperature

      // Placeholder implementation with simulated analysis
      const colors = await this.extractColorPalette(buffer);
      const dominant = await this.findDominantColor(colors);
      const distribution = this.calculateColorDistribution(colors);
      const harmony = this.analyzeColorHarmony(colors);
      const temperature = this.analyzeColorTemperature(colors);

      return {
        palette: colors,
        count: colors.length,
        dominant,
        distribution,
        harmony,
        temperature,
      };
    } catch (error) {
      console.error('Color analysis failed:', error);
      
      return {
        palette: ['#000000', '#FFFFFF'],
        count: 2,
        dominant: '#000000',
        distribution: [
          { color: '#000000', percentage: 50 },
          { color: '#FFFFFF', percentage: 50 },
        ],
        harmony: 'mixed',
        temperature: 'neutral',
      };
    }
  }

  /**
   * Extract color palette from image (placeholder)
   */
  private async extractColorPalette(buffer: Buffer): Promise<string[]> {
    // This would use image processing to extract unique colors
    // For pixel art, might use exact color extraction
    // For complex images, might use color quantization
    
    // Placeholder - return common game colors
    return [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', 
      '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
    ];
  }

  /**
   * Find dominant color
   */
  private async findDominantColor(colors: string[]): Promise<string> {
    // Would analyze pixel frequency
    return colors[0] || '#000000';
  }

  /**
   * Calculate color distribution
   */
  private calculateColorDistribution(colors: string[]): { color: string; percentage: number }[] {
    // Would calculate actual percentage of each color in the image
    const equalPercentage = 100 / colors.length;
    return colors.map(color => ({
      color,
      percentage: Math.round(equalPercentage * 100) / 100,
    }));
  }

  /**
   * Analyze color harmony
   */
  private analyzeColorHarmony(colors: string[]): ColorAnalysis['harmony'] {
    // Would analyze HSV relationships between colors
    if (colors.length <= 2) return 'monochromatic';
    if (colors.length <= 4) return 'analogous';
    return 'mixed';
  }

  /**
   * Analyze color temperature
   */
  private analyzeColorTemperature(colors: string[]): ColorAnalysis['temperature'] {
    // Would analyze average hue values
    // Warm: reds, oranges, yellows
    // Cool: blues, greens, purples
    // Neutral: balanced or grays
    return 'neutral';
  }

  /**
   * Generate descriptive tags
   */
  private async generateTags(
    buffer: Buffer,
    request?: AssetGenerationRequest,
    colors?: ColorAnalysis,
    dimensions?: { width: number; height: number }
  ): Promise<string[]> {
    const tags: string[] = [];

    // Add tags from request
    if (request) {
      if (request.assetType) tags.push(request.assetType);
      if (request.style) tags.push(request.style);
      if (request.projectTheme) {
        tags.push(...request.projectTheme.toLowerCase().split(/\s+/));
      }
    }

    // Add dimension-based tags
    if (dimensions) {
      const { width, height } = dimensions;
      
      if (width <= 32 && height <= 32) tags.push('small', 'icon');
      else if (width <= 64 && height <= 64) tags.push('medium');
      else if (width >= 256 || height >= 256) tags.push('large');
      
      const aspectRatio = width / height;
      if (Math.abs(aspectRatio - 1) < 0.1) tags.push('square');
      else if (aspectRatio > 1.5) tags.push('wide', 'landscape');
      else if (aspectRatio < 0.67) tags.push('tall', 'portrait');
    }

    // Add color-based tags
    if (colors) {
      if (colors.count <= 4) tags.push('limited-palette');
      else if (colors.count <= 16) tags.push('retro-palette');
      else if (colors.count >= 64) tags.push('rich-colors');
      
      tags.push(colors.temperature);
      if (colors.harmony !== 'mixed') tags.push(colors.harmony);
    }

    // Add semantic tags from analysis
    const semanticTags = await this.generateSemanticTags(buffer, request);
    tags.push(...semanticTags);

    // Remove duplicates and return
    return [...new Set(tags)];
  }

  /**
   * Generate semantic tags using content analysis
   */
  private async generateSemanticTags(
    buffer: Buffer,
    request?: AssetGenerationRequest
  ): Promise<string[]> {
    const tags: string[] = [];

    // Analyze content from request prompt if available
    if (request?.prompt) {
      const prompt = request.prompt.toLowerCase();
      
      // Character/creature tags
      if (/character|hero|player|warrior|mage|knight/.test(prompt)) {
        tags.push('character');
      }
      if (/enemy|monster|boss|dragon|zombie/.test(prompt)) {
        tags.push('enemy', 'creature');
      }
      
      // Environment tags
      if (/forest|tree|nature|grass|plant/.test(prompt)) {
        tags.push('nature', 'environment');
      }
      if (/castle|building|house|tower|structure/.test(prompt)) {
        tags.push('building', 'architecture');
      }
      if (/water|ocean|sea|lake|river/.test(prompt)) {
        tags.push('water', 'environment');
      }
      
      // Object tags
      if (/weapon|sword|gun|bow|axe/.test(prompt)) {
        tags.push('weapon', 'item');
      }
      if (/coin|gem|treasure|gold|crystal/.test(prompt)) {
        tags.push('collectible', 'item');
      }
      if (/button|menu|interface|ui/.test(prompt)) {
        tags.push('ui', 'interface');
      }
      
      // Style tags
      if (/medieval|fantasy|magic/.test(prompt)) {
        tags.push('fantasy', 'medieval');
      }
      if (/sci-fi|space|robot|future/.test(prompt)) {
        tags.push('sci-fi', 'futuristic');
      }
      if (/cute|kawaii|adorable/.test(prompt)) {
        tags.push('cute', 'friendly');
      }
    }

    return tags;
  }

  /**
   * Detect animation frames in GIF
   */
  private async detectAnimationFrames(buffer: Buffer): Promise<number> {
    try {
      // Would parse GIF structure to count frames
      // Look for Image Descriptor blocks (0x2C)
      let frames = 0;
      let offset = 0;
      
      // Simplified GIF frame detection
      while (offset < buffer.length - 1) {
        if (buffer[offset] === 0x2C) { // Image Descriptor
          frames++;
        }
        offset++;
      }
      
      return Math.max(frames, 1);
    } catch (error) {
      console.error('Animation frame detection failed:', error);
      return 1;
    }
  }

  /**
   * Perform semantic analysis of image content
   */
  private async performSemanticAnalysis(
    buffer: Buffer,
    request?: AssetGenerationRequest
  ): Promise<SemanticAnalysis> {
    try {
      // In a real implementation, this would use:
      // - Computer vision APIs (Google Vision, AWS Rekognition)
      // - Custom ML models for game asset classification
      // - Object detection and scene analysis
      
      const prompt = request?.prompt || '';
      
      return {
        contentType: this.classifyContentType(prompt, request?.assetType),
        objects: this.extractObjectMentions(prompt),
        mood: this.analyzeMood(prompt),
        style: request?.style || 'unknown',
        complexity: this.estimateComplexity(prompt),
        recognizedElements: this.recognizeGameElements(prompt),
      };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      
      return {
        contentType: 'unknown',
        objects: [],
        mood: 'neutral',
        style: 'unknown',
        complexity: 0.5,
        recognizedElements: [],
      };
    }
  }

  /**
   * Classify content type based on prompt and asset type
   */
  private classifyContentType(prompt: string, assetType?: string): string {
    if (assetType) {
      const typeMap = {
        sprite: 'character',
        background: 'environment',
        tile: 'texture',
        ui: 'interface',
        animation: 'animated',
      };
      if (typeMap[assetType]) return typeMap[assetType];
    }

    const lowerPrompt = prompt.toLowerCase();
    if (/character|hero|person|creature/.test(lowerPrompt)) return 'character';
    if (/background|scene|environment|landscape/.test(lowerPrompt)) return 'environment';
    if (/item|object|weapon|tool/.test(lowerPrompt)) return 'object';
    if (/interface|button|menu|hud/.test(lowerPrompt)) return 'ui';
    if (/texture|pattern|material/.test(lowerPrompt)) return 'texture';
    
    return 'unknown';
  }

  /**
   * Extract object mentions from prompt
   */
  private extractObjectMentions(prompt: string): string[] {
    const objects: string[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // Common game objects
    const objectPatterns = [
      /sword|weapon|blade/, /tree|forest|plant/,
      /castle|building|house/, /dragon|monster|creature/,
      /coin|gem|treasure/, /fire|flame|torch/,
      /water|ocean|river/, /mountain|hill|rock/,
      /character|hero|warrior/, /magic|spell|potion/,
    ];
    
    const objectNames = [
      'weapon', 'tree', 'building', 'creature',
      'treasure', 'fire', 'water', 'mountain',
      'character', 'magic'
    ];
    
    objectPatterns.forEach((pattern, index) => {
      if (pattern.test(lowerPrompt)) {
        objects.push(objectNames[index]);
      }
    });
    
    return objects;
  }

  /**
   * Analyze mood from prompt
   */
  private analyzeMood(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (/dark|evil|scary|horror|nightmare/.test(lowerPrompt)) return 'dark';
    if (/bright|happy|cheerful|colorful|vibrant/.test(lowerPrompt)) return 'cheerful';
    if (/mysterious|magic|mystical|ancient/.test(lowerPrompt)) return 'mysterious';
    if (/peaceful|calm|serene|tranquil/.test(lowerPrompt)) return 'peaceful';
    if (/action|dynamic|energetic|fast/.test(lowerPrompt)) return 'energetic';
    
    return 'neutral';
  }

  /**
   * Estimate visual complexity
   */
  private estimateComplexity(prompt: string): number {
    const lowerPrompt = prompt.toLowerCase();
    let complexity = 0.5; // Base complexity
    
    // Increase complexity based on prompt content
    if (/detailed|intricate|complex|ornate/.test(lowerPrompt)) complexity += 0.3;
    if (/simple|minimal|clean|basic/.test(lowerPrompt)) complexity -= 0.3;
    if (/background|scene|environment/.test(lowerPrompt)) complexity += 0.2;
    if (/icon|symbol|logo/.test(lowerPrompt)) complexity -= 0.2;
    
    // Count descriptive words
    const words = lowerPrompt.split(/\s+/);
    const descriptiveWords = words.filter(word => 
      word.length > 4 && !/the|and|with|for|from/.includes(word)
    );
    
    complexity += Math.min(descriptiveWords.length * 0.05, 0.3);
    
    return Math.max(0, Math.min(1, complexity));
  }

  /**
   * Recognize common game elements
   */
  private recognizeGameElements(prompt: string): string[] {
    const elements: string[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    const gameElements = {
      'health-bar': /health|hp|life|heart/,
      'collectible': /coin|gem|star|point|score/,
      'power-up': /power.*up|boost|upgrade|enhancement/,
      'enemy': /enemy|monster|boss|villain/,
      'platform': /platform|ledge|ground|floor/,
      'obstacle': /obstacle|barrier|wall|spike/,
      'portal': /portal|door|gate|entrance/,
      'weapon': /weapon|sword|gun|bow|staff/,
    };
    
    Object.entries(gameElements).forEach(([element, pattern]) => {
      if (pattern.test(lowerPrompt)) {
        elements.push(element);
      }
    });
    
    return elements;
  }

  /**
   * Calculate quality metrics
   */
  private async calculateQualityMetrics(
    buffer: Buffer,
    dimensions: { width: number; height: number },
    colors?: ColorAnalysis,
    request?: AssetGenerationRequest
  ): Promise<{
    pixelArtScore: number;
    styleConsistency: number;
    visualComplexity: number;
  }> {
    // Calculate pixel art score based on style and characteristics
    let pixelArtScore = 0.5;
    if (request?.style && ['pixel-art', '8bit', '16bit', 'retro'].includes(request.style)) {
      pixelArtScore = 0.8;
      
      // Bonus for appropriate dimensions
      if (dimensions.width <= 128 && dimensions.height <= 128) {
        pixelArtScore += 0.1;
      }
      
      // Bonus for limited color palette
      if (colors && colors.count <= 16) {
        pixelArtScore += 0.1;
      }
    }

    // Calculate style consistency
    let styleConsistency = 0.7;
    if (request?.style && colors) {
      // Consistent with requested style characteristics
      styleConsistency = 0.8;
    }

    // Calculate visual complexity based on various factors
    let visualComplexity = 0.5;
    if (colors) {
      // More colors = higher complexity
      visualComplexity += Math.min(colors.count / 64, 0.3);
    }
    
    // Larger dimensions can indicate more complexity
    const pixelCount = dimensions.width * dimensions.height;
    visualComplexity += Math.min(pixelCount / (512 * 512), 0.2);

    return {
      pixelArtScore: Math.min(pixelArtScore, 1),
      styleConsistency: Math.min(styleConsistency, 1),
      visualComplexity: Math.min(visualComplexity, 1),
    };
  }

  /**
   * Check if image has transparency
   */
  private async hasTransparency(buffer: Buffer): Promise<boolean> {
    // Would check for alpha channel in PNG or transparent pixels in GIF
    // PNG: check color type in IHDR chunk
    // GIF: check for transparent color index
    
    // Simplified check for PNG
    if (buffer.length > 25 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      const colorType = buffer[25]; // Color type byte in PNG header
      return colorType === 4 || colorType === 6; // Grayscale+alpha or RGB+alpha
    }
    
    return false; // Conservative default
  }

  /**
   * Estimate compression level
   */
  private estimateCompression(buffer: Buffer, fileSize: number): number {
    // Estimate based on file size vs expected uncompressed size
    // This is a rough approximation
    const format = this.detectFormat(buffer);
    
    if (format === 'png' || format === 'webp') {
      return 0.8; // These formats use good compression
    } else if (format === 'jpg') {
      return 0.9; // JPEG is already compressed
    }
    
    return 0.5; // Default
  }

  /**
   * Generate content hash for deduplication
   */
  private async generateContentHash(buffer: Buffer): Promise<string> {
    // In a real implementation, would use crypto.createHash
    // For now, generate a simple hash based on buffer content
    let hash = 0;
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract metadata for batch processing
   */
  async extractBatchMetadata(
    assets: any[],
    requests?: AssetGenerationRequest[]
  ): Promise<AssetMetadata[]> {
    return Promise.all(
      assets.map((asset, index) => 
        this.extractMetadata(asset, requests?.[index])
      )
    );
  }
}