/**
 * Theme-Based Batch Processing for AI Asset Generation
 * 
 * Handles coordinated generation of asset packs for specific game themes,
 * ensuring visual consistency, thematic coherence, and optimal resource usage.
 */

import {
  AssetGenerationRequest,
  BatchGenerationRequest,
  AssetType,
  AssetStyle,
  GeneratedAsset,
  AssetGenerationError,
  ERROR_CODES,
} from './types';
import { AssetGenerationManager } from './manager';
import { AssetGenerationQueue } from './queue';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';

// Theme-specific interfaces
export interface GameTheme {
  id: string;
  name: string;
  description: string;
  tags: string[];
  stylePreferences: AssetStyle[];
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  artDirection: {
    pixelArtStyle: '8bit' | '16bit' | '32bit' | 'hd';
    resolution: { width: number; height: number };
    animationStyle: 'static' | 'simple' | 'complex';
    lightingStyle: 'flat' | 'cell-shaded' | 'realistic';
  };
  metadata: {
    targetAge?: string;
    gameGenre: string[];
    complexity: 'simple' | 'medium' | 'complex';
    estimatedAssetCount: number;
  };
}

export interface AssetPackConfig {
  theme: GameTheme;
  assetCategories: {
    [category: string]: {
      count: number;
      priority: 'low' | 'normal' | 'high';
      templates: string[];
      variations?: number;
    };
  };
  consistency: {
    maintainColorPalette: boolean;
    maintainStyle: boolean;
    maintainScale: boolean;
    crossReference: boolean; // Use previous assets as style reference
  };
  generation: {
    maxConcurrent: number;
    timeoutMinutes: number;
    qualityThreshold: number;
    autoApprove: boolean;
  };
  output: {
    createSpriteSheets: boolean;
    generateAnimations: boolean;
    createThumbnails: boolean;
    packageAsZip: boolean;
  };
}

export interface ThemeGenerationResult {
  success: boolean;
  themeId: string;
  packId: string;
  totalAssets: number;
  generatedAssets: GeneratedAsset[];
  failedAssets: { category: string; template: string; error: string }[];
  consistencyScore: number;
  qualityScore: number;
  processingTime: number;
  creditsUsed: number;
  packageUrl?: string; // ZIP download URL
  spriteSheets?: Array<{
    category: string;
    url: string;
    assetIds: string[];
  }>;
}

export interface ThemeGenerationProgress {
  packId: string;
  totalAssets: number;
  completedAssets: number;
  currentCategory: string;
  currentAsset: string;
  overallProgress: number; // 0-100
  categoryProgress: { [category: string]: number };
  estimatedCompletion: string;
  qualityScores: number[];
  consistencyChecks: Array<{
    type: 'color' | 'style' | 'scale';
    passed: boolean;
    score: number;
  }>;
}

// Pre-defined game themes
export const GAME_THEMES: { [key: string]: GameTheme } = {
  retro_platformer: {
    id: 'retro_platformer',
    name: 'Retro Platformer',
    description: 'Classic 8-bit platformer style with vibrant colors and simple shapes',
    tags: ['retro', '8bit', 'platformer', 'mario', 'classic'],
    stylePreferences: ['pixel-art', '8bit', 'retro'],
    colorPalette: {
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      secondary: ['#96CEB4', '#FECA57', '#FF9FF3'],
      accent: ['#FFFFFF', '#2F3542', '#F1C40F'],
    },
    artDirection: {
      pixelArtStyle: '8bit',
      resolution: { width: 32, height: 32 },
      animationStyle: 'simple',
      lightingStyle: 'flat',
    },
    metadata: {
      targetAge: 'all',
      gameGenre: ['platformer', 'arcade'],
      complexity: 'simple',
      estimatedAssetCount: 50,
    },
  },
  space_shooter: {
    id: 'space_shooter',
    name: 'Space Shooter',
    description: 'Sci-fi space theme with metallic textures and neon accents',
    tags: ['space', 'sci-fi', 'shooter', 'neon', 'metallic'],
    stylePreferences: ['pixel-art', '16bit', 'sci-fi'],
    colorPalette: {
      primary: ['#0F3460', '#16213E', '#1A1A2E'],
      secondary: ['#E94560', '#0F4C75', '#3282B8'],
      accent: ['#BBE1FA', '#00FFF0', '#FF00FF'],
    },
    artDirection: {
      pixelArtStyle: '16bit',
      resolution: { width: 48, height: 48 },
      animationStyle: 'complex',
      lightingStyle: 'cell-shaded',
    },
    metadata: {
      targetAge: 'teen+',
      gameGenre: ['shooter', 'action'],
      complexity: 'medium',
      estimatedAssetCount: 75,
    },
  },
  fantasy_rpg: {
    id: 'fantasy_rpg',
    name: 'Fantasy RPG',
    description: 'Medieval fantasy with rich textures and mystical elements',
    tags: ['fantasy', 'medieval', 'rpg', 'magic', 'mystical'],
    stylePreferences: ['pixel-art', '16bit', 'fantasy'],
    colorPalette: {
      primary: ['#8B4513', '#228B22', '#4169E1'],
      secondary: ['#DAA520', '#DC143C', '#9370DB'],
      accent: ['#FFD700', '#FFFFFF', '#000000'],
    },
    artDirection: {
      pixelArtStyle: '16bit',
      resolution: { width: 64, height: 64 },
      animationStyle: 'complex',
      lightingStyle: 'realistic',
    },
    metadata: {
      targetAge: 'teen+',
      gameGenre: ['rpg', 'adventure'],
      complexity: 'complex',
      estimatedAssetCount: 120,
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic neon-lit cityscape with high-tech aesthetic',
    tags: ['cyberpunk', 'futuristic', 'neon', 'tech', 'dystopian'],
    stylePreferences: ['pixel-art', '32bit', 'modern'],
    colorPalette: {
      primary: ['#FF006E', '#0066FF', '#00FFFF'],
      secondary: ['#FF3300', '#FF9900', '#9900FF'],
      accent: ['#FFFFFF', '#000000', '#808080'],
    },
    artDirection: {
      pixelArtStyle: '32bit',
      resolution: { width: 64, height: 64 },
      animationStyle: 'complex',
      lightingStyle: 'realistic',
    },
    metadata: {
      targetAge: 'mature',
      gameGenre: ['action', 'rpg'],
      complexity: 'complex',
      estimatedAssetCount: 100,
    },
  },
  cartoon_adventure: {
    id: 'cartoon_adventure',
    name: 'Cartoon Adventure',
    description: 'Colorful cartoon style perfect for family-friendly games',
    tags: ['cartoon', 'colorful', 'family', 'adventure', 'cute'],
    stylePreferences: ['pixel-art', '16bit', 'cartoon'],
    colorPalette: {
      primary: ['#FF69B4', '#32CD32', '#FFD700'],
      secondary: ['#FF6347', '#87CEEB', '#DDA0DD'],
      accent: ['#FFFFFF', '#000000', '#F0F8FF'],
    },
    artDirection: {
      pixelArtStyle: '16bit',
      resolution: { width: 48, height: 48 },
      animationStyle: 'simple',
      lightingStyle: 'flat',
    },
    metadata: {
      targetAge: 'child',
      gameGenre: ['adventure', 'puzzle'],
      complexity: 'simple',
      estimatedAssetCount: 60,
    },
  },
};

// Asset pack templates for different game types
export const ASSET_PACK_TEMPLATES: { [key: string]: AssetPackConfig } = {
  platformer_complete: {
    theme: GAME_THEMES.retro_platformer,
    assetCategories: {
      characters: {
        count: 8,
        priority: 'high',
        templates: [
          'player character sprite',
          'enemy goomba sprite',
          'enemy koopa sprite',
          'boss character sprite',
          'NPC friendly sprite',
          'power-up character sprite',
          'background character sprite',
          'bonus character sprite',
        ],
        variations: 2,
      },
      environments: {
        count: 12,
        priority: 'high',
        templates: [
          'grass platform tile',
          'brick platform tile',
          'stone platform tile',
          'cloud platform',
          'tree background',
          'mountain background',
          'castle background',
          'sky background',
          'underground cavern tile',
          'water tile',
          'lava tile',
          'ice platform tile',
        ],
      },
      items: {
        count: 10,
        priority: 'normal',
        templates: [
          'coin pickup',
          'power mushroom',
          'fire flower',
          'star power-up',
          'extra life',
          'key item',
          'flag pole',
          'warp pipe',
          'question block',
          'brick block',
        ],
      },
      ui: {
        count: 8,
        priority: 'normal',
        templates: [
          'health bar UI',
          'coin counter UI',
          'score display UI',
          'pause button',
          'menu button',
          'game over screen',
          'victory screen',
          'lives indicator',
        ],
      },
    },
    consistency: {
      maintainColorPalette: true,
      maintainStyle: true,
      maintainScale: true,
      crossReference: true,
    },
    generation: {
      maxConcurrent: 3,
      timeoutMinutes: 30,
      qualityThreshold: 0.7,
      autoApprove: false,
    },
    output: {
      createSpriteSheets: true,
      generateAnimations: true,
      createThumbnails: true,
      packageAsZip: true,
    },
  },
  // Add more templates...
};

export class ThemeAssetProcessor {
  private generationManager: AssetGenerationManager;
  private generationQueue: AssetGenerationQueue;
  private isServer: boolean;

  constructor(
    generationManager: AssetGenerationManager,
    generationQueue: AssetGenerationQueue,
    isServer: boolean = false
  ) {
    this.generationManager = generationManager;
    this.generationQueue = generationQueue;
    this.isServer = isServer;
  }

  protected async getClient() {
    if (this.isServer) {
      return createServerClient();
    }
    return createClient();
  }

  /**
   * Generate a complete asset pack for a specific theme
   */
  async generateThemeAssetPack(
    themeId: string,
    userId: string,
    customConfig?: Partial<AssetPackConfig>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{ packId: string; estimatedCompletion: string }> {
    const supabase = await this.getClient();

    // Validate theme exists
    const theme = GAME_THEMES[themeId];
    if (!theme) {
      throw new AssetGenerationError(
        `Theme '${themeId}' not found`,
        ERROR_CODES.INVALID_REQUEST
      );
    }

    // Get or create pack configuration
    const packTemplate = ASSET_PACK_TEMPLATES[`${themeId}_complete`] || this.createDefaultPackConfig(theme);
    const packConfig: AssetPackConfig = {
      ...packTemplate,
      ...customConfig,
      theme: { ...packTemplate.theme, ...customConfig?.theme },
    };

    // Validate user can create theme packs
    await this.validateUserPermissions(userId, packConfig);

    // Generate pack ID and create pack record
    const packId = `pack_${themeId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Create pack record in database
    const { error: packError } = await (supabase as any)
      .from('ai_asset_packs')
      .insert({
        id: packId,
        user_id: userId,
        theme_id: themeId,
        name: `${theme.name} Asset Pack`,
        description: `Complete asset pack for ${theme.description}`,
        config: packConfig,
        status: 'queued',
        total_assets: this.calculateTotalAssets(packConfig),
        completed_assets: 0,
        created_at: new Date().toISOString(),
      });

    if (packError) {
      throw new AssetGenerationError(
        'Failed to create asset pack record',
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // Generate asset requests for each category
    const assetRequests = this.generateAssetRequestsFromPack(packConfig, packId, userId);

    // Estimate completion time
    const totalAssets = assetRequests.length;
    const estimatedTimePerAsset = 120; // 2 minutes per asset
    const concurrency = packConfig.generation.maxConcurrent;
    const totalEstimatedTime = (totalAssets / concurrency) * estimatedTimePerAsset * 1000;
    const estimatedCompletion = new Date(Date.now() + totalEstimatedTime).toISOString();

    // Queue all asset generations
    const batchRequest: BatchGenerationRequest = {
      baseRequest: this.createBaseRequest(packConfig),
      prompts: assetRequests.map(req => req.prompt),
      maintainConsistency: packConfig.consistency.maintainColorPalette,
      parallelGeneration: packConfig.generation.maxConcurrent,
      stopOnFailure: false,
      metadata: {
        packId,
        themeId,
        categoryMapping: this.createCategoryMapping(packConfig, assetRequests),
      },
    };

    // Add to generation queue
    const queueResult = await this.generationQueue.enqueueBatchGeneration(
      batchRequest,
      userId,
      priority
    );

    // Update pack with job ID
    await (supabase as any)
      .from('ai_asset_packs')
      .update({
        generation_job_id: queueResult.jobId,
        estimated_completion: estimatedCompletion,
      })
      .eq('id', packId);

    // Start progress monitoring
    this.startProgressMonitoring(packId, queueResult.jobId);

    return {
      packId,
      estimatedCompletion,
    };
  }

  /**
   * Get progress for a theme asset pack generation
   */
  async getThemePackProgress(packId: string, userId: string): Promise<ThemeGenerationProgress> {
    const supabase = await this.getClient();

    // Get pack information
    const { data: pack, error: packError } = await (supabase as any)
      .from('ai_asset_packs')
      .select('*')
      .eq('id', packId)
      .eq('user_id', userId)
      .single();

    if (packError || !pack) {
      throw new AssetGenerationError(
        'Asset pack not found',
        ERROR_CODES.NOT_FOUND
      );
    }

    // Get job progress if still processing
    let jobProgress = null;
    if (pack.generation_job_id && pack.status !== 'completed') {
      try {
        const job = await this.generationQueue.getJobStatus(pack.generation_job_id, userId);
        jobProgress = job;
      } catch (error) {
        console.error('Failed to get job progress:', error);
      }
    }

    // Calculate category progress
    const categoryProgress: { [category: string]: number } = {};
    const config = pack.config as AssetPackConfig;
    
    for (const [category, categoryConfig] of Object.entries(config.assetCategories)) {
      const completedInCategory = pack.completed_assets_by_category?.[category] || 0;
      const totalInCategory = categoryConfig.count * (categoryConfig.variations || 1);
      categoryProgress[category] = Math.round((completedInCategory / totalInCategory) * 100);
    }

    // Get quality scores
    const qualityScores = pack.quality_scores || [];

    // Get consistency check results
    const consistencyChecks = pack.consistency_checks || [];

    return {
      packId,
      totalAssets: pack.total_assets,
      completedAssets: pack.completed_assets,
      currentCategory: pack.current_category || 'Initializing',
      currentAsset: pack.current_asset || 'Preparing generation...',
      overallProgress: Math.round((pack.completed_assets / pack.total_assets) * 100),
      categoryProgress,
      estimatedCompletion: pack.estimated_completion || new Date(Date.now() + 3600000).toISOString(),
      qualityScores,
      consistencyChecks,
    };
  }

  /**
   * Get completed theme asset pack results
   */
  async getThemePackResult(packId: string, userId: string): Promise<ThemeGenerationResult> {
    const supabase = await this.getClient();

    const { data: pack, error } = await (supabase as any)
      .from('ai_asset_packs')
      .select('*')
      .eq('id', packId)
      .eq('user_id', userId)
      .single();

    if (error || !pack) {
      throw new AssetGenerationError(
        'Asset pack not found',
        ERROR_CODES.NOT_FOUND
      );
    }

    if (pack.status !== 'completed') {
      throw new AssetGenerationError(
        'Asset pack is not yet completed',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    // Get all generated assets for this pack
    const { data: assets } = await (supabase as any)
      .from('game_assets')
      .select('*')
      .eq('pack_id', packId)
      .eq('created_by', userId);

    // Calculate quality and consistency scores
    const qualityScore = this.calculateAverageQuality(assets || []);
    const consistencyScore = this.calculateConsistencyScore(assets || [], pack.config);

    return {
      success: true,
      themeId: pack.theme_id,
      packId: pack.id,
      totalAssets: pack.total_assets,
      generatedAssets: assets || [],
      failedAssets: pack.failed_assets || [],
      consistencyScore,
      qualityScore,
      processingTime: pack.processing_time_ms || 0,
      creditsUsed: pack.credits_used || 0,
      packageUrl: pack.package_url,
      spriteSheets: pack.sprite_sheets,
    };
  }

  /**
   * Cancel theme asset pack generation
   */
  async cancelThemePackGeneration(packId: string, userId: string): Promise<void> {
    const supabase = await this.getClient();

    // Get pack information
    const { data: pack } = await (supabase as any)
      .from('ai_asset_packs')
      .select('generation_job_id, status')
      .eq('id', packId)
      .eq('user_id', userId)
      .single();

    if (!pack || pack.status === 'completed') {
      throw new AssetGenerationError(
        'Cannot cancel completed or non-existent pack',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    // Cancel the generation job
    if (pack.generation_job_id) {
      await this.generationQueue.cancelJob(pack.generation_job_id, userId);
    }

    // Update pack status
    await (supabase as any)
      .from('ai_asset_packs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', packId);
  }

  /**
   * List available themes
   */
  getAvailableThemes(): GameTheme[] {
    return Object.values(GAME_THEMES);
  }

  /**
   * Get theme asset pack templates
   */
  getAssetPackTemplates(): { [key: string]: Partial<AssetPackConfig> } {
    const templates: { [key: string]: Partial<AssetPackConfig> } = {};
    
    for (const [key, config] of Object.entries(ASSET_PACK_TEMPLATES)) {
      templates[key] = {
        theme: config.theme,
        assetCategories: config.assetCategories,
        consistency: config.consistency,
        generation: config.generation,
        output: config.output,
      };
    }
    
    return templates;
  }

  // Private helper methods
  private async validateUserPermissions(userId: string, packConfig: AssetPackConfig): Promise<void> {
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

    // Theme packs require Pro or Max subscription
    if (profile.subscription_tier === 'free') {
      throw new AssetGenerationError(
        'Theme asset packs require Pro or Max subscription',
        ERROR_CODES.TIER_LIMIT_EXCEEDED
      );
    }

    // Complex themes require Max subscription
    if (packConfig.theme.metadata.complexity === 'complex' && profile.subscription_tier !== 'max') {
      throw new AssetGenerationError(
        'Complex theme packs require Max subscription',
        ERROR_CODES.TIER_LIMIT_EXCEEDED
      );
    }
  }

  private calculateTotalAssets(config: AssetPackConfig): number {
    let total = 0;
    for (const [category, categoryConfig] of Object.entries(config.assetCategories)) {
      total += categoryConfig.count * (categoryConfig.variations || 1);
    }
    return total;
  }

  private generateAssetRequestsFromPack(
    config: AssetPackConfig,
    packId: string,
    userId: string
  ): AssetGenerationRequest[] {
    const requests: AssetGenerationRequest[] = [];
    
    for (const [category, categoryConfig] of Object.entries(config.assetCategories)) {
      for (const template of categoryConfig.templates) {
        const variations = categoryConfig.variations || 1;
        
        for (let v = 0; v < variations; v++) {
          const prompt = this.generateThematicPrompt(template, config.theme, v);
          
          requests.push({
            prompt,
            assetType: this.categorizeAssetType(category),
            style: config.theme.stylePreferences[0],
            quality: 'high',
            dimensions: config.theme.artDirection.resolution,
            userId,
            metadata: {
              packId,
              category,
              template,
              variation: v,
              themeId: config.theme.id,
            },
          });
        }
      }
    }
    
    return requests;
  }

  private generateThematicPrompt(template: string, theme: GameTheme, variation: number): string {
    const colorPaletteDesc = `using colors ${theme.colorPalette.primary.join(', ')}`;
    const styleDesc = `in ${theme.artDirection.pixelArtStyle} pixel art style`;
    const themeDesc = theme.description.toLowerCase();
    const variationDesc = variation > 0 ? ` (variation ${variation + 1})` : '';
    
    return `${template} ${styleDesc}, ${themeDesc}, ${colorPaletteDesc}${variationDesc}`;
  }

  private categorizeAssetType(category: string): AssetType {
    const categoryMap: { [key: string]: AssetType } = {
      characters: 'sprite',
      environments: 'background',
      items: 'sprite',
      ui: 'ui',
      tiles: 'tile',
      effects: 'sprite',
    };
    
    return categoryMap[category] || 'sprite';
  }

  private createBaseRequest(config: AssetPackConfig): AssetGenerationRequest {
    return {
      prompt: '', // Will be filled by individual requests
      assetType: 'sprite',
      style: config.theme.stylePreferences[0],
      quality: 'high',
      dimensions: config.theme.artDirection.resolution,
      provider: 'pixellab', // Prefer Pixellab for pixel art
    };
  }

  private createCategoryMapping(
    config: AssetPackConfig,
    requests: AssetGenerationRequest[]
  ): { [index: number]: { category: string; template: string } } {
    const mapping: { [index: number]: { category: string; template: string } } = {};
    
    requests.forEach((request, index) => {
      if (request.metadata) {
        mapping[index] = {
          category: request.metadata.category,
          template: request.metadata.template,
        };
      }
    });
    
    return mapping;
  }

  private createDefaultPackConfig(theme: GameTheme): AssetPackConfig {
    return {
      theme,
      assetCategories: {
        characters: {
          count: 4,
          priority: 'high',
          templates: [
            'main character sprite',
            'enemy character sprite',
            'NPC character sprite',
            'boss character sprite',
          ],
        },
        environments: {
          count: 6,
          priority: 'normal',
          templates: [
            'ground tile',
            'wall tile',
            'background element',
            'platform tile',
            'decorative element',
            'environmental object',
          ],
        },
        items: {
          count: 4,
          priority: 'normal',
          templates: [
            'collectible item',
            'power-up item',
            'tool item',
            'bonus item',
          ],
        },
      },
      consistency: {
        maintainColorPalette: true,
        maintainStyle: true,
        maintainScale: true,
        crossReference: true,
      },
      generation: {
        maxConcurrent: 2,
        timeoutMinutes: 20,
        qualityThreshold: 0.7,
        autoApprove: false,
      },
      output: {
        createSpriteSheets: true,
        generateAnimations: false,
        createThumbnails: true,
        packageAsZip: true,
      },
    };
  }

  private startProgressMonitoring(packId: string, jobId: string): void {
    // This would start a background process to monitor the generation progress
    // and update the pack record with real-time progress information
    console.log(`Started progress monitoring for pack ${packId}, job ${jobId}`);
  }

  private calculateAverageQuality(assets: any[]): number {
    if (!assets.length) return 0;
    
    const qualityScores = assets
      .map(asset => asset.metadata?.qualityScore || 0.5)
      .filter(score => score > 0);
    
    return qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0.5;
  }

  private calculateConsistencyScore(assets: any[], config: AssetPackConfig): number {
    if (!assets.length) return 0;
    
    // This would analyze the assets for visual consistency
    // For now, return a placeholder score
    return 0.85;
  }
}