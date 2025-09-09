// PixelLab API Client
// This file provides a TypeScript client for interacting with PixelLab API

import { createClient } from '@/lib/supabase/client';
import { 
  PixelLabModel, 
  PixelLabConfig, 
  PixelLabApiResponse,
  PixelLabGeneration,
  validatePixelLabConfig,
  estimatePixelLabCost,
  PIXELLAB_MODEL_INFO
} from '@/lib/supabase/pixellab-types';

// PixelLab API configuration
const PIXELLAB_API_BASE_URL = 'https://api.pixellab.ai/v1';
const PIXELLAB_API_KEY = process.env.NEXT_PUBLIC_PIXELLAB_API_KEY || '40a31eae-a872-45cf-8b8b-becb0d4d71cc';

export class PixelLabClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || PIXELLAB_API_KEY;
    this.baseUrl = PIXELLAB_API_BASE_URL;
  }

  /**
   * Generate pixel art using the specified PixelLab model
   */
  async generate(
    model: PixelLabModel, 
    config: PixelLabConfig,
    userId: string
  ): Promise<{
    success: boolean;
    data?: {
      images: string[];
      generation_id: string;
      seed_used?: number;
      generation_time_ms?: number;
      credits_consumed?: number;
    };
    error?: string;
  }> {
    try {
      // Validate configuration
      const validation = validatePixelLabConfig(model, config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`
        };
      }

      // Check user credits
      const supabase = createClient();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'Unable to verify user credits'
        };
      }

      const estimatedCost = estimatePixelLabCost(model, config);
      if (profile.credits_remaining < estimatedCost) {
        return {
          success: false,
          error: `Insufficient credits. Need ${estimatedCost}, have ${profile.credits_remaining}`
        };
      }

      // Make API request to PixelLab
      const response = await fetch(`${this.baseUrl}/generate/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PixelLab API error: ${response.status} ${errorText}`);
      }

      const apiResponse: PixelLabApiResponse = await response.json();

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.error?.message || 'Generation failed'
        };
      }

      // Record generation in database
      const generationRecord: Omit<PixelLabGeneration, 'id' | 'created_at'> = {
        user_id: userId,
        game_asset_id: undefined, // Will be set when asset is created
        model_used: model,
        generation_config: config,
        input_prompt: config.prompt,
        seed_used: apiResponse.data?.seed_used,
        credits_consumed: apiResponse.data?.credits_consumed || estimatedCost,
        generation_time_ms: apiResponse.data?.generation_time_ms,
      };

      const { data: generation, error: generationError } = await supabase
        .from('pixellab_generations')
        .insert(generationRecord)
        .select()
        .single();

      if (generationError) {
        console.error('Failed to record generation:', generationError);
        // Still return success since the generation worked
      }

      // Update user credits
      await supabase
        .from('profiles')
        .update({ 
          credits_remaining: profile.credits_remaining - (apiResponse.data?.credits_consumed || estimatedCost)
        })
        .eq('id', userId);

      // Store keyframes if this is an animation
      if (model === 'animate-skeleton' && apiResponse.data?.keyframes && generation) {
        const keyframeRecords = apiResponse.data.keyframes.map((frameKeypoints, index) => ({
          generation_id: generation.id,
          frame_number: index,
          keypoints: frameKeypoints,
        }));

        await supabase
          .from('pixellab_animation_keyframes')
          .insert(keyframeRecords);
      }

      return {
        success: true,
        data: {
          images: apiResponse.data?.images || [],
          generation_id: generation?.id || '',
          seed_used: apiResponse.data?.seed_used,
          generation_time_ms: apiResponse.data?.generation_time_ms,
          credits_consumed: apiResponse.data?.credits_consumed || estimatedCost,
        }
      };

    } catch (error) {
      console.error('PixelLab generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's generation history
   */
  async getGenerationHistory(userId: string, limit: number = 50): Promise<PixelLabGeneration[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('pixellab_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch generation history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get animation keyframes for a generation
   */
  async getAnimationKeyframes(generationId: string): Promise<any[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('pixellab_animation_keyframes')
      .select('*')
      .eq('generation_id', generationId)
      .order('frame_number');

    if (error) {
      console.error('Failed to fetch keyframes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's style references
   */
  async getStyleReferences(userId: string): Promise<any[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('pixellab_style_references')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Failed to fetch style references:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a new style reference
   */
  async createStyleReference(
    userId: string, 
    name: string, 
    styleConfig: any, 
    styleImageUrl?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('pixellab_style_references')
      .insert({
        user_id: userId,
        name,
        style_config: styleConfig,
        style_image_url: styleImageUrl,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Get model information and capabilities
   */
  getModelInfo(model: PixelLabModel) {
    return PIXELLAB_MODEL_INFO[model];
  }

  /**
   * Validate configuration for a model
   */
  validateConfig(model: PixelLabModel, config: any) {
    return validatePixelLabConfig(model, config);
  }

  /**
   * Estimate credit cost for a generation
   */
  estimateCost(model: PixelLabModel, config: any) {
    return estimatePixelLabCost(model, config);
  }
}

// Export singleton instance
export const pixelLabClient = new PixelLabClient();