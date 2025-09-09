/**
 * AI Asset Generation - Library Integration System
 * 
 * Comprehensive integration layer between AI asset generation pipeline
 * and the existing GameGen asset library system for seamless storage,
 * organization, and management of generated assets.
 */

import { Asset, AssetCollection } from '@/types/assets';
import { GeneratedAsset, AssetGenerationRequest, AnimationResult } from './types';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseApi } from '@/lib/assets/api';
import { DatabaseError } from '@/lib/supabase/utils';

interface AssetStorageConfig {
  bucket: string;
  path: string;
  generateThumbnail: boolean;
  createPreview: boolean;
  addToCollection?: string;
  enableVersioning: boolean;
  publishToMarketplace: boolean;
}

interface StorageResult {
  asset: Asset;
  collection?: AssetCollection;
  thumbnailUrl?: string;
  previewUrl?: string;
}

export class AssetLibraryIntegration {
  private isServer: boolean;

  constructor(isServer: boolean = false) {
    this.isServer = isServer;
  }

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }
    return createClient();
  }

  /**
   * Store generated asset in the library system
   */
  async storeGeneratedAsset(
    generatedAsset: GeneratedAsset,
    request: AssetGenerationRequest,
    userId: string,
    config: Partial<AssetStorageConfig> = {}
  ): Promise<StorageResult> {
    const supabase = await this.getClient();

    // Configure storage options
    const storageConfig: AssetStorageConfig = {
      bucket: 'ai-generated-assets',
      path: `users/${userId}/generated`,
      generateThumbnail: true,
      createPreview: true,
      enableVersioning: true,
      publishToMarketplace: false,
      ...config,
    };

    // Generate unique asset path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${request.assetType}_${timestamp}_${generatedAsset.id}`;
    const assetPath = `${storageConfig.path}/${filename}.png`;

    try {
      // Upload main asset to storage
      const assetBuffer = generatedAsset.buffer || await this.fetchAssetBuffer(generatedAsset.url);
      const uploadResult = await this.uploadAssetToStorage(
        storageConfig.bucket,
        assetPath,
        assetBuffer,
        'image/png'
      );

      // Generate and upload thumbnail
      let thumbnailUrl: string | undefined;
      if (storageConfig.generateThumbnail) {
        const thumbnailBuffer = await this.generateThumbnail(assetBuffer, { width: 150, height: 150 });
        const thumbnailPath = `${storageConfig.path}/thumbnails/${filename}_thumb.png`;
        const thumbnailResult = await this.uploadAssetToStorage(
          storageConfig.bucket,
          thumbnailPath,
          thumbnailBuffer,
          'image/png'
        );
        thumbnailUrl = thumbnailResult.url;
      }

      // Generate preview for larger view
      let previewUrl: string | undefined;
      if (storageConfig.createPreview) {
        const previewBuffer = await this.generatePreview(assetBuffer, { width: 512, height: 512 });
        const previewPath = `${storageConfig.path}/previews/${filename}_preview.png`;
        const previewResult = await this.uploadAssetToStorage(
          storageConfig.bucket,
          previewPath,
          previewBuffer,
          'image/png'
        );
        previewUrl = previewResult.url;
      }

      // Convert generated asset to Asset format
      const asset = await this.convertToAssetFormat(
        generatedAsset,
        request,
        userId,
        uploadResult.url,
        thumbnailUrl,
        previewUrl
      );

      // Store asset in database
      const storedAsset = await this.insertAssetToDatabase(asset);

      // Handle collection assignment
      let collection: AssetCollection | undefined;
      if (storageConfig.addToCollection) {
        collection = await this.addAssetToCollection(storedAsset.id, storageConfig.addToCollection, userId);
      } else {
        // Create or add to default AI generated collection
        collection = await this.ensureAIGeneratedCollection(userId);
        await this.addAssetToCollection(storedAsset.id, collection.id, userId);
      }

      // Update asset metadata with generation details
      await this.updateAssetMetadata(storedAsset.id, {
        generationDetails: {
          provider: generatedAsset.generatedBy,
          prompt: request.prompt,
          style: request.style,
          seed: request.seed,
          processingTime: generatedAsset.processingTime,
          qualityScore: generatedAsset.qualityScore,
        },
        aiTags: await this.generateAITags(generatedAsset, request),
      });

      return {
        asset: storedAsset,
        collection,
        thumbnailUrl,
        previewUrl,
      };

    } catch (error) {
      console.error('Failed to store generated asset:', error);
      throw new DatabaseError(
        'Failed to store generated asset',
        'ASSET_STORAGE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Store animation result with sprite sheet and frames
   */
  async storeAnimationResult(
    animationResult: AnimationResult,
    request: AssetGenerationRequest,
    userId: string,
    config: Partial<AssetStorageConfig> = {}
  ): Promise<StorageResult> {
    const supabase = await this.getClient();

    const storageConfig: AssetStorageConfig = {
      bucket: 'ai-generated-assets',
      path: `users/${userId}/animations`,
      generateThumbnail: true,
      createPreview: true,
      enableVersioning: true,
      publishToMarketplace: false,
      ...config,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `animation_${timestamp}_${animationResult.id}`;

    try {
      // Upload sprite sheet
      const spriteSheetBuffer = await this.fetchAssetBuffer(animationResult.animationData!.spriteSheetUrl);
      const spriteSheetPath = `${storageConfig.path}/${filename}_spritesheet.png`;
      const spriteSheetResult = await this.uploadAssetToStorage(
        storageConfig.bucket,
        spriteSheetPath,
        spriteSheetBuffer,
        'image/png'
      );

      // Upload individual frames
      const frameUrls: string[] = [];
      for (let i = 0; i < animationResult.animationData!.frameUrls.length; i++) {
        const frameBuffer = await this.fetchAssetBuffer(animationResult.animationData!.frameUrls[i]);
        const framePath = `${storageConfig.path}/frames/${filename}_frame_${i.toString().padStart(3, '0')}.png`;
        const frameResult = await this.uploadAssetToStorage(
          storageConfig.bucket,
          framePath,
          frameBuffer,
          'image/png'
        );
        frameUrls.push(frameResult.url);
      }

      // Generate thumbnail from first frame
      let thumbnailUrl: string | undefined;
      if (storageConfig.generateThumbnail) {
        const firstFrameBuffer = await this.fetchAssetBuffer(animationResult.animationData!.frameUrls[0]);
        const thumbnailBuffer = await this.generateThumbnail(firstFrameBuffer, { width: 150, height: 150 });
        const thumbnailPath = `${storageConfig.path}/thumbnails/${filename}_thumb.png`;
        const thumbnailResult = await this.uploadAssetToStorage(
          storageConfig.bucket,
          thumbnailPath,
          thumbnailBuffer,
          'image/png'
        );
        thumbnailUrl = thumbnailResult.url;
      }

      // Create animated GIF preview
      let previewUrl: string | undefined;
      if (storageConfig.createPreview) {
        const animatedGifBuffer = await this.createAnimatedPreview(
          animationResult.animationData!.frameUrls,
          animationResult.animationData!.frameRate
        );
        const previewPath = `${storageConfig.path}/previews/${filename}_preview.gif`;
        const previewResult = await this.uploadAssetToStorage(
          storageConfig.bucket,
          previewPath,
          animatedGifBuffer,
          'image/gif'
        );
        previewUrl = previewResult.url;
      }

      // Convert to Asset format with animation data
      const asset = await this.convertAnimationToAssetFormat(
        animationResult,
        request,
        userId,
        spriteSheetResult.url,
        thumbnailUrl,
        previewUrl,
        frameUrls
      );

      // Store in database
      const storedAsset = await this.insertAssetToDatabase(asset);

      // Add to animations collection
      const animationsCollection = await this.ensureAnimationsCollection(userId);
      await this.addAssetToCollection(storedAsset.id, animationsCollection.id, userId);

      return {
        asset: storedAsset,
        collection: animationsCollection,
        thumbnailUrl,
        previewUrl,
      };

    } catch (error) {
      console.error('Failed to store animation result:', error);
      throw new DatabaseError(
        'Failed to store animation result',
        'ANIMATION_STORAGE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Create or update asset collection for batch results
   */
  async createBatchCollection(
    assets: StorageResult[],
    batchName: string,
    userId: string,
    description?: string
  ): Promise<AssetCollection> {
    const supabase = await this.getClient();

    const collection = {
      name: batchName,
      description: description || `Batch generated assets - ${new Date().toLocaleDateString()}`,
      color: '#10B981', // Green for generated content
      icon: 'magic-wand',
      is_system: false,
      owner_id: userId,
      asset_ids: assets.map(result => result.asset.id),
      tags: ['ai-generated', 'batch', 'pixel-art'],
      is_public: false,
      asset_count: assets.length,
    };

    const { data, error } = await (supabase as any)
      .from('asset_collections')
      .insert(collection)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create batch collection',
        error.code,
        error.details
      );
    }

    return this.mapCollectionFromDb(data);
  }

  /**
   * Update asset with additional metadata from generation process
   */
  async updateAssetMetadata(assetId: string, metadata: any): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await (supabase as any)
      .from('game_assets')
      .update({
        properties: (supabase as any).raw(`properties || '${JSON.stringify(metadata)}'`),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId);

    if (error) {
      throw new DatabaseError(
        'Failed to update asset metadata',
        error.code,
        error.details
      );
    }
  }

  /**
   * Search for similar existing assets to avoid duplicates
   */
  async findSimilarAssets(
    generatedAsset: GeneratedAsset,
    userId: string,
    threshold: number = 0.8
  ): Promise<Asset[]> {
    const supabase = await this.getClient();

    // Search by prompt similarity and visual characteristics
    const { data, error } = await (supabase as any)
      .from('game_assets')
      .select('*')
      .eq('owner_id', userId)
      .eq('asset_type', generatedAsset.type)
      .eq('source_type', 'ai_generated')
      .ilike('properties->>prompt', `%${generatedAsset.prompt.substring(0, 50)}%`)
      .limit(5);

    if (error) {
      console.warn('Failed to search for similar assets:', error);
      return [];
    }

    return (data || []).map((asset: any) => this.mapAssetFromDb(asset));
  }

  // Private helper methods

  private async uploadAssetToStorage(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string
  ): Promise<{ url: string; path: string }> {
    // Convert buffer to File for upload
    const blob = new Blob([buffer], { type: contentType });
    const file = new File([blob], path.split('/').pop() || 'asset', { type: contentType });

    return await supabaseApi.uploadToStorage(bucket, path, file);
  }

  private async fetchAssetBuffer(url: string): Promise<Buffer> {
    // Mock implementation - in reality, would fetch from the URL
    return Buffer.from('mock-asset-data');
  }

  private async generateThumbnail(
    assetBuffer: Buffer,
    dimensions: { width: number; height: number }
  ): Promise<Buffer> {
    // Mock thumbnail generation - in reality, would use image processing library
    return assetBuffer; // For now, return original
  }

  private async generatePreview(
    assetBuffer: Buffer,
    dimensions: { width: number; height: number }
  ): Promise<Buffer> {
    // Mock preview generation
    return assetBuffer;
  }

  private async createAnimatedPreview(
    frameUrls: string[],
    frameRate: number
  ): Promise<Buffer> {
    // Mock animated GIF creation
    return Buffer.from('mock-animated-gif-data');
  }

  private async convertToAssetFormat(
    generatedAsset: GeneratedAsset,
    request: AssetGenerationRequest,
    userId: string,
    assetUrl: string,
    thumbnailUrl?: string,
    previewUrl?: string
  ): Promise<Asset> {
    const now = new Date();
    
    return {
      id: generatedAsset.id,
      name: generatedAsset.name || `${request.assetType} - ${request.prompt.substring(0, 30)}`,
      type: this.mapAssetType(generatedAsset.type),
      format: 'png',
      source: 'ai_generated',
      status: 'ready',
      url: assetUrl,
      thumbnailUrl,
      previewUrl,
      size: generatedAsset.metadata.fileSize || 0,
      dimensions: {
        width: generatedAsset.metadata.dimensions.width,
        height: generatedAsset.metadata.dimensions.height,
      },
      quality: this.mapQuality(request.quality || 'standard'),
      colorPalette: generatedAsset.metadata.colors?.palette,
      hasTransparency: true,
      isAnimated: false,
      hasAudio: false,
      tags: [
        request.assetType,
        request.style || 'pixel-art',
        'ai-generated',
        generatedAsset.generatedBy,
      ].filter(Boolean),
      collections: [],
      categories: [request.assetType],
      searchableText: `${request.prompt} ${request.style} ${request.assetType}`,
      usage: {
        usageCount: 0,
        usedInScenes: [],
        usedInComponents: [],
        dependencies: [],
      },
      metadata: {
        keywords: request.prompt.split(' ').filter(word => word.length > 2),
        style: request.style,
        description: `AI-generated ${request.assetType} created from prompt: "${request.prompt}"`,
        rating: Math.round(generatedAsset.qualityScore * 5), // Convert to 1-5 scale
      },
      optimization: {
        originalSize: generatedAsset.metadata.fileSize || 0,
        compressedSize: generatedAsset.metadata.fileSize || 0,
        compressionRatio: 1.0,
        formats: ['png'],
        optimizationLevel: 'none',
        webOptimized: true,
        mobileOptimized: true,
      },
      ai: {
        generated: true,
        aiModel: generatedAsset.generatedBy,
        prompt: request.prompt,
        seed: request.seed,
        confidence: Math.round(generatedAsset.qualityScore * 100),
        qualityScore: Math.round(generatedAsset.qualityScore * 100),
        tags: generatedAsset.metadata.tags || [],
        smartCategory: request.assetType,
        similar: [],
        variations: [],
      },
      versioning: {
        version: '1.0.0',
        isLatest: true,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      ownerId: userId,
      isPublic: false,
      isEditable: true,
      isDeletable: true,
    };
  }

  private async convertAnimationToAssetFormat(
    animationResult: AnimationResult,
    request: AssetGenerationRequest,
    userId: string,
    spriteSheetUrl: string,
    thumbnailUrl?: string,
    previewUrl?: string,
    frameUrls: string[] = []
  ): Promise<Asset> {
    const baseAsset = await this.convertToAssetFormat(
      animationResult,
      request,
      userId,
      spriteSheetUrl,
      thumbnailUrl,
      previewUrl
    );

    // Add animation-specific properties
    return {
      ...baseAsset,
      isAnimated: true,
      dimensions: {
        ...baseAsset.dimensions!,
        frames: animationResult.animationData!.frames,
        duration: animationResult.animationData!.duration / 1000, // Convert to seconds
      },
      tags: [...baseAsset.tags, 'animation', 'sprite-sheet'],
      ai: {
        ...baseAsset.ai,
        tags: [
          ...baseAsset.ai.tags,
          'animated',
          `${animationResult.animationData!.frames}-frames`,
          `${animationResult.animationData!.frameRate}fps`,
        ],
      },
    };
  }

  private async insertAssetToDatabase(asset: Asset): Promise<Asset> {
    const supabase = await this.getClient();

    const dbAsset = {
      id: asset.id,
      name: asset.name,
      asset_type: asset.type,
      file_path: asset.url,
      thumbnail_url: asset.thumbnailUrl,
      file_size: asset.size,
      mime_type: `image/${asset.format}`,
      width: asset.dimensions?.width,
      height: asset.dimensions?.height,
      owner_id: asset.ownerId,
      source_type: asset.source,
      properties: {
        ...asset.metadata,
        ...asset.ai,
        ...asset.optimization,
        tags: asset.tags,
        quality: asset.quality,
        colorPalette: asset.colorPalette,
        hasTransparency: asset.hasTransparency,
        isAnimated: asset.isAnimated,
        previewUrl: asset.previewUrl,
      },
    };

    const { data, error } = await (supabase as any)
      .from('game_assets')
      .insert(dbAsset)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to insert asset to database',
        error.code,
        error.details
      );
    }

    return this.mapAssetFromDb(data);
  }

  private async ensureAIGeneratedCollection(userId: string): Promise<AssetCollection> {
    const supabase = await this.getClient();

    // Try to find existing AI generated collection
    const { data: existing } = await (supabase as any)
      .from('asset_collections')
      .select('*')
      .eq('owner_id', userId)
      .eq('name', 'AI Generated Assets')
      .single();

    if (existing) {
      return this.mapCollectionFromDb(existing);
    }

    // Create new AI generated collection
    const collection = {
      name: 'AI Generated Assets',
      description: 'Assets created using AI generation tools',
      color: '#8B5CF6', // Purple for AI
      icon: 'sparkles',
      is_system: false,
      owner_id: userId,
      asset_ids: [],
      tags: ['ai-generated', 'automatic'],
      is_public: false,
      asset_count: 0,
    };

    const { data, error } = await (supabase as any)
      .from('asset_collections')
      .insert(collection)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create AI generated collection',
        error.code,
        error.details
      );
    }

    return this.mapCollectionFromDb(data);
  }

  private async ensureAnimationsCollection(userId: string): Promise<AssetCollection> {
    const supabase = await this.getClient();

    // Try to find existing animations collection
    const { data: existing } = await (supabase as any)
      .from('asset_collections')
      .select('*')
      .eq('owner_id', userId)
      .eq('name', 'Animations')
      .single();

    if (existing) {
      return this.mapCollectionFromDb(existing);
    }

    // Create new animations collection
    const collection = {
      name: 'Animations',
      description: 'Animated sprites and sprite sheets',
      color: '#F59E0B', // Amber for animations
      icon: 'film',
      is_system: false,
      owner_id: userId,
      asset_ids: [],
      tags: ['animations', 'sprites'],
      is_public: false,
      asset_count: 0,
    };

    const { data, error } = await (supabase as any)
      .from('asset_collections')
      .insert(collection)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create animations collection',
        error.code,
        error.details
      );
    }

    return this.mapCollectionFromDb(data);
  }

  private async addAssetToCollection(
    assetId: string,
    collectionId: string,
    userId: string
  ): Promise<AssetCollection> {
    const supabase = await this.getClient();

    // Add asset to collection's asset_ids array and increment count
    const { data, error } = await (supabase as any)
      .from('asset_collections')
      .update({
        asset_ids: (supabase as any).raw(`array_append(asset_ids, '${assetId}')`),
        asset_count: (supabase as any).raw('asset_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to add asset to collection',
        error.code,
        error.details
      );
    }

    return this.mapCollectionFromDb(data);
  }

  private async generateAITags(
    generatedAsset: GeneratedAsset,
    request: AssetGenerationRequest
  ): Promise<string[]> {
    // Generate relevant tags based on asset characteristics
    const tags: string[] = [];

    // Add style-based tags
    if (request.style) {
      tags.push(request.style);
      if (request.style.includes('pixel')) tags.push('retro-gaming');
      if (request.style.includes('8bit') || request.style.includes('16bit')) tags.push('vintage');
    }

    // Add color-based tags
    if (generatedAsset.metadata.colors?.count) {
      if (generatedAsset.metadata.colors.count <= 8) tags.push('limited-palette');
      if (generatedAsset.metadata.colors.count >= 32) tags.push('rich-colors');
    }

    // Add size-based tags
    if (generatedAsset.metadata.dimensions) {
      const { width, height } = generatedAsset.metadata.dimensions;
      if (width <= 32 && height <= 32) tags.push('micro');
      else if (width <= 64 && height <= 64) tags.push('small');
      else if (width <= 128 && height <= 128) tags.push('medium');
      else tags.push('large');
    }

    // Add quality-based tags
    if (generatedAsset.qualityScore >= 0.9) tags.push('high-quality');
    if (generatedAsset.qualityScore >= 0.95) tags.push('premium');

    return tags;
  }

  // Database mapping helpers
  private mapAssetType(aiAssetType: string): any {
    const typeMap: Record<string, any> = {
      sprite: 'sprite',
      background: 'texture',
      tile: 'tileset',
      ui: 'texture',
      animation: 'animation',
      tileset: 'tileset',
    };

    return typeMap[aiAssetType] || 'sprite';
  }

  private mapQuality(aiQuality: string): any {
    const qualityMap: Record<string, any> = {
      draft: 'low',
      standard: 'medium',
      high: 'high',
      ultra: 'ultra',
    };

    return qualityMap[aiQuality] || 'medium';
  }

  private mapAssetFromDb(data: any): Asset {
    // This would properly map database fields to Asset interface
    // Simplified for brevity
    return {
      id: data.id,
      name: data.name,
      type: data.asset_type,
      url: data.file_path,
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // ... map other fields
    } as Asset;
  }

  private mapCollectionFromDb(data: any): AssetCollection {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isSystem: data.is_system,
      ownerId: data.owner_id,
      assetIds: data.asset_ids,
      tags: data.tags,
      isPublic: data.is_public,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      assetCount: data.asset_count,
    };
  }
}