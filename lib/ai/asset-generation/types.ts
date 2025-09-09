/**
 * Types for AI Asset Generation Pipeline
 * 
 * Comprehensive type definitions for pixel art and asset generation,
 * including providers, requests, responses, and processing pipeline types.
 */

// Core Asset Types
export type AssetType = "sprite" | "background" | "tile" | "animation" | "tileset" | "ui";

export type AssetStyle = 
  | "pixel-art" 
  | "retro" 
  | "8bit" 
  | "16bit" 
  | "32bit"
  | "modern" 
  | "minimalist" 
  | "cartoon"
  | "realistic"
  | "abstract";

export type GenerationProvider = 
  | "pixellab" 
  | "retrodiffusion" 
  | "dalle" 
  | "midjourney"
  | "stable-diffusion"
  | "custom";

export type AssetFormat = "png" | "webp" | "jpg" | "gif" | "svg";

// Generation Request Types
export interface AssetGenerationRequest {
  // Core generation parameters
  prompt: string;
  assetType: AssetType;
  style?: AssetStyle;
  provider?: GenerationProvider;
  
  // Dimensions and sizing
  dimensions?: {
    width: number;
    height: number;
  };
  
  // Animation parameters (for animated assets)
  animationFrames?: number;
  animationDuration?: number; // in milliseconds
  animationLoop?: boolean;
  
  // Style and appearance
  colorPalette?: string[]; // Hex color values
  colorCount?: number; // Max colors to use
  artDirection?: string; // Additional style guidance
  
  // Generation options
  seed?: number; // For reproducible generation
  variants?: number; // Number of variants to generate
  quality?: "draft" | "standard" | "high" | "ultra";
  
  // Advanced options
  negativePrompt?: string; // What to avoid
  styleBias?: number; // -1 to 1, bias towards style vs prompt
  creativityLevel?: number; // 0 to 1, how creative vs literal
  
  // Context and metadata
  userId?: string;
  sessionId?: string;
  gameId?: string; // If generating for specific game
  projectTheme?: string; // Overall project theme
  existingAssets?: string[]; // Asset IDs for style consistency
  
  // Processing options
  postProcessing?: {
    pixelPerfect?: boolean;
    autoOptimize?: boolean;
    generateThumbnail?: boolean;
    extractColors?: boolean;
  };
  
  // Queue management
  priority?: "low" | "normal" | "high" | "urgent";
}

// Generation Response Types
export interface AssetGenerationResponse {
  success: boolean;
  asset?: GeneratedAsset;
  variants?: GeneratedAsset[];
  credits: {
    used: number;
    remaining: number;
  };
  processingTime: number; // milliseconds
  warnings?: string[];
  error?: string;
}

export interface GeneratedAsset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  buffer?: Buffer; // Raw asset data
  
  metadata: AssetMetadata;
  generatedBy: GenerationProvider;
  prompt: string;
  style?: AssetStyle;
  qualityScore: number; // 0-1
  
  // Timestamps
  createdAt: string;
  processingTime?: number;
  
  // Animation data (if applicable)
  animationData?: {
    frames: number;
    duration: number;
    frameUrls?: string[];
    spriteSheet?: string;
  };
}

export interface AssetMetadata {
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: AssetFormat;
  colors?: {
    palette: string[];
    count: number;
    dominant: string;
  };
  tags: string[];
  category?: string; // Asset category for organization
  hash?: string; // Content hash for deduplication
  
  // Animation-specific metadata
  frameCount?: number; // Number of animation frames
  frameRate?: number; // Frames per second
  duration?: number; // Animation duration in milliseconds
  motionQuality?: any; // Motion analysis results
  
  // Quality metrics
  pixelArtScore?: number; // How pixel-art-like it is
  styleConsistency?: number; // How consistent with project style
  visualComplexity?: number; // Complexity score
  
  // Technical details
  transparency?: boolean;
  compression?: number;
  dpi?: number;
}

// Provider Configuration Types
export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
  
  // Provider-specific settings
  settings?: {
    maxDimensions?: { width: number; height: number };
    supportedStyles?: AssetStyle[];
    supportedFormats?: AssetFormat[];
    defaultQuality?: string;
    rateLimit?: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
  
  // Retry and timeout
  maxRetries?: number;
  timeout?: number;
  
  // Cost configuration
  costPerGeneration?: number;
  costPerVariant?: number;
}

export interface ProviderStatus {
  id: GenerationProvider;
  name: string;
  status: "online" | "offline" | "degraded";
  enabled: boolean;
  
  // Performance metrics
  averageResponseTime: number;
  successRate: number; // 0-1
  lastChecked: string;
  
  // Capabilities
  supportedAssetTypes: AssetType[];
  supportedStyles: AssetStyle[];
  supportedFormats: AssetFormat[];
  maxDimensions: { width: number; height: number };
  
  // Current usage
  requestsToday: number;
  creditsUsed: number;
  rateLimitRemaining?: number;
}

// Processing Pipeline Types
export interface ProcessingOptions {
  pixelArtOptimization?: boolean;
  compressionLevel?: number; // 0-1
  formatOptimization?: boolean;
  thumbnailGeneration?: boolean;
  colorOptimization?: boolean;
  transparencyOptimization?: boolean;
}

export interface PostProcessingResult {
  processedAsset: Buffer;
  thumbnail?: Buffer;
  metadata: AssetMetadata;
  optimizations: string[];
  processingTime: number;
}

// Quality Validation Types
export interface QualityValidationConfig {
  minResolution: { width: number; height: number };
  maxResolution: { width: number; height: number };
  allowedFormats: AssetFormat[];
  
  qualityThresholds: {
    pixelArt: number;
    sprites: number;
    backgrounds: number;
    animations: number;
  };
  
  contentFiltering: boolean;
  nsfw?: boolean;
  violenceFilter?: boolean;
  copyrightFilter?: boolean;
}

export interface QualityValidationResult {
  isValid: boolean;
  score: number; // 0-1 overall quality score
  issues: string[];
  warnings: string[];
  
  // Detailed scores
  technicalQuality: number; // Resolution, format, etc.
  visualQuality: number; // Aesthetic quality
  contentAppropriate: number; // Content filtering result
  styleConsistency: number; // Consistency with requested style
}

// Style Management Types
export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  
  // Visual characteristics
  style: AssetStyle;
  colorPalette: string[];
  artDirection: string;
  
  // Generation parameters
  defaultPromptModifiers: string[];
  negativePrompt?: string;
  preferredDimensions: { width: number; height: number }[];
  
  // Usage and performance
  usageCount: number;
  averageQuality: number;
  
  // Permissions and sharing
  createdBy: string;
  isPublic: boolean;
  isPremium: boolean;
  
  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StyleConsistencyCheck {
  consistency: number; // 0-1
  recommendations: string[];
  similarAssets: string[];
}

// Batch Generation Types
export interface BatchGenerationRequest {
  baseRequest: Omit<AssetGenerationRequest, 'prompt'>;
  prompts: string[];
  
  // Batch-specific options
  maintainConsistency: boolean;
  parallelGeneration: number; // Max concurrent generations
  stopOnFailure: boolean;
  
  // Theme and project context
  projectId?: string;
  themeContext?: {
    genre: string;
    mood: string;
    setting: string;
  };
}

export interface BatchGenerationResponse {
  success: boolean;
  results: GeneratedAsset[];
  failures: {
    prompt: string;
    error: string;
  }[];
  
  // Batch metrics
  totalGenerated: number;
  totalFailed: number;
  totalCreditsUsed: number;
  processingTime: number;
  
  // Style consistency analysis
  styleConsistency?: {
    overallScore: number;
    variations: number;
    recommendations: string[];
  };
}

// Animation Generation Types
export interface AnimationGenerationRequest extends AssetGenerationRequest {
  animationType?: "sprite_animation" | "background_animation" | "ui_animation";
  frameCount: number;
  frameRate: number; // FPS
  
  // Animation-specific parameters
  motionType?: "linear" | "ease_in" | "ease_out" | "bounce" | "elastic";
  loopType?: "seamless" | "bounce" | "once";
  keyFrames?: {
    frame: number;
    description: string;
  }[];
  
  // Additional animation properties (provider is already inherited)
  // provider?: GenerationProvider; // Inherited from AssetGenerationRequest
}

export interface AnimationResult extends GeneratedAsset {
  animationData: {
    frames: number;
    frameRate: number;
    duration: number;
    frameUrls: string[];
    spriteSheetUrl: string;
    
    // Animation metadata
    motionAnalysis: {
      smoothness: number;
      consistency: number;
      loopQuality: number;
    };
  };
}

// Error Types
export class AssetGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly providerId?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AssetGenerationError';
  }
}

// Common error codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  TIER_LIMIT_EXCEEDED: 'TIER_LIMIT_EXCEEDED',
  
  // Request Validation
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNSUPPORTED_ASSET_TYPE: 'UNSUPPORTED_ASSET_TYPE',
  UNSUPPORTED_STYLE: 'UNSUPPORTED_STYLE',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
  
  // Generation Errors
  GENERATION_FAILED: 'GENERATION_FAILED',
  PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
  ALL_PROVIDERS_FAILED: 'ALL_PROVIDERS_FAILED',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Processing Errors
  POST_PROCESSING_FAILED: 'POST_PROCESSING_FAILED',
  QUALITY_VALIDATION_FAILED: 'QUALITY_VALIDATION_FAILED',
  CONTENT_FILTERED: 'CONTENT_FILTERED',
  
  // Storage Errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // System Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Generation Job Types (for queue management)
export interface GenerationJob {
  id: string;
  userId: string;
  request: AssetGenerationRequest | BatchGenerationRequest;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  
  // Timing
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  
  // Progress tracking
  progress: number; // 0-100
  currentStep?: string;
  queuePosition?: number;
  
  // Results
  result?: AssetGenerationResponse | BatchGenerationResponse;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  
  // Retry management
  retryCount: number;
  maxRetries: number;
  
  // Cost tracking
  creditsUsed: number;
  estimatedCredits: number;
}

// Asset Library Integration Types
export interface AssetLibraryIntegration {
  // Asset organization
  collections: {
    id: string;
    name: string;
    assetIds: string[];
  }[];
  
  // Tagging and search
  searchTags: string[];
  categories: string[];
  
  // Usage tracking
  usageStats: {
    downloads: number;
    likes: number;
    shares: number;
  };
  
  // Community features
  isPublic: boolean;
  allowComments: boolean;
  license: "cc0" | "cc_by" | "cc_by_sa" | "custom" | "commercial";
}