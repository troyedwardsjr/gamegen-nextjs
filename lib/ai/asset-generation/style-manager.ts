/**
 * Asset Style Consistency & Template Management System
 * 
 * Advanced system for maintaining visual coherence across generated assets,
 * template management, style analysis, and automated style recommendations.
 */

import { 
  StyleTemplate, 
  StyleConsistencyCheck, 
  AssetGenerationRequest,
  AssetMetadata,
  AssetStyle,
  AssetType,
  GeneratedAsset,
  AssetGenerationError,
  ERROR_CODES,
} from './types';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/supabase/utils';

interface StyleAnalysisResult {
  dominantColors: string[];
  colorHarmony: number; // 0-1
  visualComplexity: number; // 0-1
  pixelArtScore: number; // 0-1
  styleCoherence: number; // 0-1
  aestheticCategories: string[];
  technicalQuality: number; // 0-1
}

interface ProjectStyleProfile {
  id: string;
  userId: string;
  projectId?: string;
  dominantStyles: AssetStyle[];
  colorPalette: string[];
  visualThemes: string[];
  technicalSpecs: {
    preferredDimensions: { width: number; height: number }[];
    qualityThreshold: number;
    consistencyWeight: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class AssetStyleManager {
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
   * Create a new style template
   */
  async createStyleTemplate(
    template: Omit<StyleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'averageQuality'>
  ): Promise<StyleTemplate> {
    const supabase = await this.getClient();

    const templateData = {
      ...template,
      usage_count: 0,
      average_quality: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase as any)
      .from('asset_style_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create style template',
        error.code,
        error.details,
        error.hint
      );
    }

    return this.mapTemplateFromDb(data);
  }

  /**
   * Get style templates for a user
   */
  async getUserStyleTemplates(
    userId: string,
    options: {
      includePublic?: boolean;
      style?: AssetStyle;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<StyleTemplate[]> {
    const supabase = await this.getClient();

    let query = (supabase as any)
      .from('asset_style_templates')
      .select('*');

    if (options.includePublic) {
      query = query.or(`created_by.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('created_by', userId);
    }

    if (options.style) {
      query = query.eq('style', options.style);
    }

    query = query
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

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
        `Failed to fetch style templates for user: ${userId}`,
        error.code,
        error.details
      );
    }

    return (data || []).map((template: any) => this.mapTemplateFromDb(template));
  }

  /**
   * Apply style template to generation request
   */
  async applyStyleTemplate(
    request: AssetGenerationRequest,
    templateId: string
  ): Promise<AssetGenerationRequest> {
    const supabase = await this.getClient();

    const { data: template, error } = await (supabase as any)
      .from('asset_style_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      throw new AssetGenerationError(
        `Style template not found: ${templateId}`,
        ERROR_CODES.INVALID_REQUEST
      );
    }

    const enhancedRequest = { ...request };

    // Apply template styling
    enhancedRequest.style = template.style;
    enhancedRequest.colorPalette = template.color_palette;
    enhancedRequest.artDirection = template.art_direction;

    if (template.negative_prompt) {
      enhancedRequest.negativePrompt = enhancedRequest.negativePrompt 
        ? `${enhancedRequest.negativePrompt}, ${template.negative_prompt}`
        : template.negative_prompt;
    }

    // Apply default prompt modifiers
    if (template.default_prompt_modifiers && template.default_prompt_modifiers.length > 0) {
      const modifiers = template.default_prompt_modifiers.join(', ');
      enhancedRequest.prompt = `${enhancedRequest.prompt}, ${modifiers}`;
    }

    // Apply preferred dimensions if not specified
    if (!enhancedRequest.dimensions && template.preferred_dimensions && template.preferred_dimensions.length > 0) {
      // Choose most appropriate dimensions based on asset type
      const dimensions = this.selectOptimalDimensions(
        enhancedRequest.assetType,
        template.preferred_dimensions
      );
      enhancedRequest.dimensions = dimensions;
    }

    // Update template usage
    await this.incrementTemplateUsage(templateId);

    return enhancedRequest;
  }

  /**
   * Analyze style consistency across multiple assets
   */
  async analyzeStyleConsistency(
    assets: GeneratedAsset[],
    referenceStyle?: AssetStyle
  ): Promise<StyleConsistencyCheck> {
    if (assets.length === 0) {
      return {
        consistency: 1.0,
        recommendations: [],
        similarAssets: [],
      };
    }

    const analyses = await Promise.all(
      assets.map(asset => this.analyzeAssetStyle(asset))
    );

    // Calculate overall consistency metrics
    const colorConsistency = this.calculateColorConsistency(analyses);
    const styleCoherence = this.calculateStyleCoherence(analyses, referenceStyle);
    const technicalConsistency = this.calculateTechnicalConsistency(analyses);

    const overallConsistency = (colorConsistency + styleCoherence + technicalConsistency) / 3;

    // Generate recommendations
    const recommendations = this.generateConsistencyRecommendations(
      analyses,
      overallConsistency,
      referenceStyle
    );

    // Find similar assets
    const similarAssets = await this.findSimilarAssets(assets, 5);

    return {
      consistency: overallConsistency,
      recommendations,
      similarAssets: similarAssets.map(asset => asset.id),
    };
  }

  /**
   * Create or update project style profile
   */
  async createProjectStyleProfile(
    userId: string,
    projectId: string,
    assets: GeneratedAsset[]
  ): Promise<ProjectStyleProfile> {
    const supabase = await this.getClient();

    if (assets.length === 0) {
      throw new AssetGenerationError(
        'At least one asset is required to create style profile',
        ERROR_CODES.INVALID_REQUEST
      );
    }

    // Analyze assets to extract style characteristics
    const analyses = await Promise.all(
      assets.map(asset => this.analyzeAssetStyle(asset))
    );

    // Extract dominant styles
    const styleCounts = assets.reduce((acc, asset) => {
      if (asset.style) {
        acc[asset.style] = (acc[asset.style] || 0) + 1;
      }
      return acc;
    }, {} as Record<AssetStyle, number>);

    const dominantStyles = Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style as AssetStyle);

    // Extract color palette
    const allColors = analyses.flatMap(analysis => analysis.dominantColors);
    const colorFrequency = allColors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantColors = Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([color]) => color);

    // Extract visual themes
    const allCategories = analyses.flatMap(analysis => analysis.aestheticCategories);
    const themeFrequency = allCategories.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visualThemes = Object.entries(themeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);

    // Calculate preferred dimensions
    const dimensionCounts = assets.reduce((acc, asset) => {
      const dim = `${asset.metadata.dimensions.width}x${asset.metadata.dimensions.height}`;
      acc[dim] = (acc[dim] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredDimensions = Object.entries(dimensionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([dim]) => {
        const [width, height] = dim.split('x').map(Number);
        return { width, height };
      });

    // Calculate average quality
    const averageQuality = assets.reduce((sum, asset) => sum + asset.qualityScore, 0) / assets.length;

    const profileData = {
      user_id: userId,
      project_id: projectId,
      dominant_styles: dominantStyles,
      color_palette: dominantColors,
      visual_themes: visualThemes,
      technical_specs: {
        preferredDimensions,
        qualityThreshold: Math.max(0.7, averageQuality - 0.1),
        consistencyWeight: 0.8,
      },
    };

    const { data, error } = await (supabase as any)
      .from('project_style_profiles')
      .upsert(profileData, { onConflict: 'project_id' })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        'Failed to create project style profile',
        error.code,
        error.details
      );
    }

    return this.mapStyleProfileFromDb(data);
  }

  /**
   * Get project style profile
   */
  async getProjectStyleProfile(projectId: string): Promise<ProjectStyleProfile | null> {
    const supabase = await this.getClient();

    const { data, error } = await (supabase as any)
      .from('project_style_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw new DatabaseError(
        `Failed to fetch project style profile: ${projectId}`,
        error.code,
        error.details
      );
    }

    return data ? this.mapStyleProfileFromDb(data) : null;
  }

  /**
   * Generate style-consistent asset suggestions
   */
  async generateStyleSuggestions(
    projectId: string,
    assetType: AssetType,
    basePrompt: string
  ): Promise<AssetGenerationRequest[]> {
    const styleProfile = await this.getProjectStyleProfile(projectId);
    
    if (!styleProfile) {
      // Return basic suggestions without style profile
      return this.generateBasicSuggestions(assetType, basePrompt);
    }

    const suggestions: AssetGenerationRequest[] = [];

    // Generate suggestions based on each dominant style
    for (const style of styleProfile.dominantStyles) {
      const suggestion: AssetGenerationRequest = {
        prompt: basePrompt,
        assetType,
        style,
        colorPalette: styleProfile.colorPalette,
        dimensions: styleProfile.technicalSpecs.preferredDimensions[0],
        quality: styleProfile.technicalSpecs.qualityThreshold > 0.8 ? 'high' : 'standard',
        artDirection: `Consistent with project themes: ${styleProfile.visualThemes.join(', ')}`,
      };

      suggestions.push(suggestion);
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Analyze individual asset style characteristics
   */
  private async analyzeAssetStyle(asset: GeneratedAsset): Promise<StyleAnalysisResult> {
    // This would integrate with image analysis services or local processing
    // For now, we'll use metadata and heuristics
    
    const colors = asset.metadata.colors?.palette || [];
    const complexity = this.calculateVisualComplexity(asset);
    const pixelArtScore = this.calculatePixelArtScore(asset);

    return {
      dominantColors: colors.slice(0, 8),
      colorHarmony: this.calculateColorHarmony(colors),
      visualComplexity: complexity,
      pixelArtScore,
      styleCoherence: this.calculateStyleCoherence([{ pixelArtScore }], asset.style),
      aestheticCategories: this.extractAestheticCategories(asset),
      technicalQuality: asset.qualityScore,
    };
  }

  /**
   * Calculate color consistency across analyses
   */
  private calculateColorConsistency(analyses: StyleAnalysisResult[]): number {
    if (analyses.length < 2) return 1.0;

    const allColors = analyses.flatMap(a => a.dominantColors);
    const uniqueColors = new Set(allColors).size;
    const totalColors = allColors.length;

    // Lower ratio means more color reuse (better consistency)
    const colorReuseRatio = 1 - (uniqueColors / Math.max(totalColors, 1));
    return Math.max(0, colorReuseRatio);
  }

  /**
   * Calculate style coherence across analyses
   */
  private calculateStyleCoherence(
    analyses: StyleAnalysisResult[], 
    referenceStyle?: AssetStyle
  ): number {
    if (analyses.length === 0) return 1.0;

    const pixelArtScores = analyses.map(a => a.pixelArtScore);
    const avgPixelArtScore = pixelArtScores.reduce((sum, score) => sum + score, 0) / pixelArtScores.length;
    
    // Calculate variance in pixel art scores (lower variance = more consistent)
    const variance = pixelArtScores.reduce((sum, score) => sum + Math.pow(score - avgPixelArtScore, 2), 0) / pixelArtScores.length;
    const consistency = Math.max(0, 1 - variance);

    return consistency;
  }

  /**
   * Calculate technical consistency (dimensions, quality, etc.)
   */
  private calculateTechnicalConsistency(analyses: StyleAnalysisResult[]): number {
    if (analyses.length === 0) return 1.0;

    const qualityScores = analyses.map(a => a.technicalQuality);
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    const variance = qualityScores.reduce((sum, score) => sum + Math.pow(score - avgQuality, 2), 0) / qualityScores.length;
    return Math.max(0, 1 - variance * 2); // Penalize quality variance more heavily
  }

  /**
   * Generate consistency improvement recommendations
   */
  private generateConsistencyRecommendations(
    analyses: StyleAnalysisResult[],
    consistency: number,
    referenceStyle?: AssetStyle
  ): string[] {
    const recommendations: string[] = [];

    if (consistency < 0.6) {
      recommendations.push('Consider using a consistent color palette across all assets');
      recommendations.push('Use the same art style (pixel-art, modern, etc.) for related assets');
    }

    if (consistency < 0.4) {
      recommendations.push('Create a style template to maintain visual coherence');
      recommendations.push('Review and adjust generation prompts for consistency');
    }

    // Analyze specific issues
    const avgColorHarmony = analyses.reduce((sum, a) => sum + a.colorHarmony, 0) / analyses.length;
    if (avgColorHarmony < 0.6) {
      recommendations.push('Improve color harmony by using complementary color schemes');
    }

    const avgPixelArtScore = analyses.reduce((sum, a) => sum + a.pixelArtScore, 0) / analyses.length;
    if (referenceStyle === 'pixel-art' && avgPixelArtScore < 0.7) {
      recommendations.push('Use more pixel-art specific providers for better style consistency');
    }

    return recommendations;
  }

  // Helper methods for calculations
  private calculateVisualComplexity(asset: GeneratedAsset): number {
    // Heuristic based on file size, dimensions, and color count
    const dimensions = asset.metadata.dimensions.width * asset.metadata.dimensions.height;
    const colors = asset.metadata.colors?.count || 16;
    const fileSize = asset.metadata.fileSize;

    // Normalize and combine factors
    const dimensionComplexity = Math.min(dimensions / (1024 * 1024), 1);
    const colorComplexity = Math.min(colors / 256, 1);
    const sizeComplexity = Math.min(fileSize / (1024 * 1024), 1);

    return (dimensionComplexity + colorComplexity + sizeComplexity) / 3;
  }

  private calculatePixelArtScore(asset: GeneratedAsset): number {
    // Heuristic based on style, dimensions, and color count
    if (asset.style === 'pixel-art' || asset.style === '8bit' || asset.style === '16bit') {
      return 0.9;
    }

    const colors = asset.metadata.colors?.count || 256;
    const dimensions = Math.max(asset.metadata.dimensions.width, asset.metadata.dimensions.height);

    // Lower color count and smaller dimensions suggest pixel art
    const colorScore = Math.max(0, 1 - colors / 256);
    const dimensionScore = dimensions < 256 ? 0.8 : dimensions < 512 ? 0.4 : 0.1;

    return (colorScore + dimensionScore) / 2;
  }

  private calculateColorHarmony(colors: string[]): number {
    // Simplified color harmony calculation
    // In a real implementation, this would analyze color theory principles
    if (colors.length < 2) return 1.0;
    
    // For now, return a value based on color count (fewer colors often means better harmony)
    return Math.max(0.3, 1 - (colors.length - 2) / 20);
  }

  private extractAestheticCategories(asset: GeneratedAsset): string[] {
    const categories: string[] = [];

    // Extract from style
    if (asset.style) {
      categories.push(asset.style);
    }

    // Extract from asset type
    categories.push(asset.type);

    // Extract from tags if available
    if (asset.metadata.tags) {
      categories.push(...asset.metadata.tags.slice(0, 3));
    }

    return categories;
  }

  private selectOptimalDimensions(
    assetType: AssetType, 
    options: { width: number; height: number }[]
  ): { width: number; height: number } {
    // Select most appropriate dimensions for asset type
    const typePreferences = {
      sprite: (dims: any) => dims.width === dims.height && dims.width <= 128,
      background: (dims: any) => dims.width > dims.height,
      tile: (dims: any) => dims.width === dims.height && dims.width <= 64,
      ui: (dims: any) => dims.width >= dims.height,
      tileset: (dims: any) => dims.width >= dims.height && dims.width >= 256,
      animation: (dims: any) => dims.width === dims.height && dims.width <= 128,
    };

    const preference = typePreferences[assetType];
    const preferred = options.find(preference);
    
    return preferred || options[0];
  }

  private async incrementTemplateUsage(templateId: string): Promise<void> {
    const supabase = await this.getClient();
    
    await (supabase as any)
      .from('asset_style_templates')
      .update({ 
        usage_count: (supabase as any).raw('usage_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);
  }

  private async findSimilarAssets(assets: GeneratedAsset[], limit: number): Promise<GeneratedAsset[]> {
    // This would use vector similarity search in a real implementation
    // For now, return assets with similar styles or types
    return assets.slice(0, limit);
  }

  private async generateBasicSuggestions(
    assetType: AssetType, 
    basePrompt: string
  ): Promise<AssetGenerationRequest[]> {
    const basicSuggestions: AssetGenerationRequest[] = [
      {
        prompt: basePrompt,
        assetType,
        style: 'pixel-art',
        quality: 'standard',
      },
      {
        prompt: basePrompt,
        assetType,
        style: 'modern',
        quality: 'high',
      },
      {
        prompt: basePrompt,
        assetType,
        style: 'retro',
        quality: 'standard',
      },
    ];

    return basicSuggestions;
  }

  // Database mapping helpers
  private mapTemplateFromDb(data: any): StyleTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      style: data.style,
      colorPalette: data.color_palette,
      artDirection: data.art_direction,
      defaultPromptModifiers: data.default_prompt_modifiers,
      negativePrompt: data.negative_prompt,
      preferredDimensions: data.preferred_dimensions,
      usageCount: data.usage_count,
      averageQuality: data.average_quality,
      createdBy: data.created_by,
      isPublic: data.is_public,
      isPremium: data.is_premium,
      tags: data.tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapStyleProfileFromDb(data: any): ProjectStyleProfile {
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      dominantStyles: data.dominant_styles,
      colorPalette: data.color_palette,
      visualThemes: data.visual_themes,
      technicalSpecs: data.technical_specs,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}