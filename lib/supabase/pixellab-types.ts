// PixelLab API Types and Configurations
// This file contains TypeScript types for PixelLab integration

export type PixelLabModel = 'pixflux' | 'bitforge' | 'animate-skeleton' | 'animate-text';

export interface PixelLabModelLimits {
  pixflux: { maxSize: 400 };
  bitforge: { maxSize: 200 };
  'animate-skeleton': { frames: 4 };
  'animate-text': { minFrames: 2; maxFrames: 20 };
}

// Base configuration for all models
export interface BasePixelLabConfig {
  prompt: string;
  negative_prompt?: string;
  guidance_scale?: number;
  seed?: number;
}

// PixFlux model configuration (general pixel art generation)
export interface PixFluxConfig extends BasePixelLabConfig {
  width?: number; // max 400
  height?: number; // max 400
  num_inference_steps?: number;
}

// BitForge model configuration (style-guided generation with inpainting)
export interface BitForgeConfig extends BasePixelLabConfig {
  width?: number; // max 200
  height?: number; // max 200
  style_image?: string; // base64 encoded image
  style_weight?: number;
  inpaint_mask?: string; // base64 encoded mask
  num_inference_steps?: number;
}

// Animate Skeleton model configuration (skeleton-based animation, 4 frames)
export interface AnimateSkeletonConfig extends BasePixelLabConfig {
  skeleton_keypoints: SkeletonKeypoint[][]; // Array of 4 frame keypoints
  width?: number;
  height?: number;
  num_inference_steps?: number;
}

// Animate Text model configuration (text-based animation, 2-20 frames)
export interface AnimateTextConfig extends BasePixelLabConfig {
  num_frames?: number; // 2-20
  width?: number;
  height?: number;
  motion_description?: string;
  num_inference_steps?: number;
}

// Union type for all PixelLab configurations
export type PixelLabConfig = PixFluxConfig | BitForgeConfig | AnimateSkeletonConfig | AnimateTextConfig;

// Skeleton keypoint structure for animate-skeleton model
export interface SkeletonKeypoint {
  x: number;
  y: number;
  confidence?: number; // Optional confidence score
}

// PixelLab API response structure
export interface PixelLabApiResponse {
  success: boolean;
  data?: {
    images: string[]; // base64 encoded images
    seed_used?: number;
    generation_time_ms?: number;
    credits_consumed?: number;
    keyframes?: SkeletonKeypoint[][]; // Only for animate-skeleton
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Database record types (will be auto-generated after migration)
export interface PixelLabGeneration {
  id: string;
  user_id: string;
  game_asset_id?: string;
  model_used: PixelLabModel;
  generation_config: PixelLabConfig;
  input_prompt: string;
  seed_used?: number;
  credits_consumed: number;
  generation_time_ms?: number;
  created_at: string;
}

export interface PixelLabAnimationKeyframe {
  id: string;
  generation_id: string;
  frame_number: number;
  keypoints: SkeletonKeypoint[];
  created_at: string;
}

export interface PixelLabStyleReference {
  id: string;
  user_id: string;
  name: string;
  style_image_url?: string;
  style_config: BitForgeConfig | Record<string, any>;
  usage_count: number;
  created_at: string;
}

// Extended game asset type with PixelLab fields
export interface GameAssetWithPixelLab {
  id: string;
  game_id?: string;
  creator_id: string;
  name: string;
  asset_type: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  properties?: Record<string, any>;
  generated_by_ai?: boolean;
  generation_prompt?: string;
  generation_model?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  // PixelLab specific fields
  pixellab_model?: PixelLabModel;
  pixellab_config?: PixelLabConfig;
  seed?: number;
  credits_used?: number;
}

// Helper types for form validation and UI
export interface PixelLabFormData {
  model: PixelLabModel;
  prompt: string;
  negative_prompt?: string;
  guidance_scale?: number;
  seed?: number;
  // Model-specific fields
  width?: number;
  height?: number;
  num_frames?: number;
  style_reference_id?: string;
  style_image?: File;
  motion_description?: string;
}

// Credit cost mapping (these values should match API documentation)
export const PIXELLAB_CREDIT_COSTS: Record<PixelLabModel, number> = {
  'pixflux': 1.0,
  'bitforge': 2.0,
  'animate-skeleton': 4.0,
  'animate-text': 3.0, // Base cost, may vary by frame count
};

// Model capabilities and constraints
export const PIXELLAB_MODEL_INFO: Record<PixelLabModel, {
  name: string;
  description: string;
  maxWidth: number;
  maxHeight: number;
  supportsAnimation: boolean;
  supportsStyleGuide: boolean;
  supportsInpainting: boolean;
  estimatedTime: string;
}> = {
  'pixflux': {
    name: 'PixFlux',
    description: 'General purpose pixel art generation up to 400x400',
    maxWidth: 400,
    maxHeight: 400,
    supportsAnimation: false,
    supportsStyleGuide: false,
    supportsInpainting: false,
    estimatedTime: '30-60 seconds'
  },
  'bitforge': {
    name: 'BitForge',
    description: 'Style-guided generation with inpainting support up to 200x200',
    maxWidth: 200,
    maxHeight: 200,
    supportsAnimation: false,
    supportsStyleGuide: true,
    supportsInpainting: true,
    estimatedTime: '45-90 seconds'
  },
  'animate-skeleton': {
    name: 'Animate Skeleton',
    description: 'Skeleton-based animation generation (4 frames)',
    maxWidth: 200,
    maxHeight: 200,
    supportsAnimation: true,
    supportsStyleGuide: false,
    supportsInpainting: false,
    estimatedTime: '2-4 minutes'
  },
  'animate-text': {
    name: 'Animate Text',
    description: 'Text-based animation generation (2-20 frames)',
    maxWidth: 200,
    maxHeight: 200,
    supportsAnimation: true,
    supportsStyleGuide: false,
    supportsInpainting: false,
    estimatedTime: '1-5 minutes'
  }
};

// Validation functions
export function validatePixelLabConfig(model: PixelLabModel, config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const info = PIXELLAB_MODEL_INFO[model];

  // Common validations
  if (!config.prompt || config.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }

  if (config.width && config.width > info.maxWidth) {
    errors.push(`Width cannot exceed ${info.maxWidth} for ${info.name}`);
  }

  if (config.height && config.height > info.maxHeight) {
    errors.push(`Height cannot exceed ${info.maxHeight} for ${info.name}`);
  }

  // Model-specific validations
  switch (model) {
    case 'animate-text':
      if (config.num_frames && (config.num_frames < 2 || config.num_frames > 20)) {
        errors.push('Number of frames must be between 2 and 20 for Animate Text');
      }
      break;
    case 'animate-skeleton':
      if (!config.skeleton_keypoints || !Array.isArray(config.skeleton_keypoints)) {
        errors.push('Skeleton keypoints are required for Animate Skeleton');
      } else if (config.skeleton_keypoints.length !== 4) {
        errors.push('Animate Skeleton requires exactly 4 frame keypoints');
      }
      break;
    case 'bitforge':
      if (config.style_weight && (config.style_weight < 0 || config.style_weight > 1)) {
        errors.push('Style weight must be between 0 and 1');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// Helper function to estimate credit cost
export function estimatePixelLabCost(model: PixelLabModel, config: any): number {
  let baseCost = PIXELLAB_CREDIT_COSTS[model];
  
  // Adjust cost based on configuration
  if (model === 'animate-text' && config.num_frames) {
    // Scale cost by number of frames (base cost assumes 4 frames)
    baseCost = (baseCost * config.num_frames) / 4;
  }
  
  return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
}