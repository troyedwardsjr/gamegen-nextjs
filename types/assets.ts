/**
 * Comprehensive Asset Types for GameGen Platform
 * Supports pixel art game creation with AI integration
 */

import { ReactNode } from "react";

// Base asset types
export type AssetType =
  | "sprite"
  | "tileset"
  | "sound"
  | "music"
  | "animation"
  | "font"
  | "shader"
  | "texture"
  | "model"
  | "scene"
  | "script"
  | "data";

export type AssetFormat =
  | "png"
  | "jpg"
  | "webp"
  | "svg"
  | "gif"
  | "wav"
  | "mp3"
  | "ogg"
  | "flac"
  | "json"
  | "xml"
  | "yaml"
  | "glsl"
  | "hlsl"
  | "fbx"
  | "obj"
  | "gltf"
  | "ttf"
  | "otf"
  | "woff"
  | "js"
  | "ts"
  | "lua"
  | "py";

export type AssetSource =
  | "user"
  | "ai_generated"
  | "template"
  | "community"
  | "marketplace";
export type AssetStatus =
  | "draft"
  | "ready"
  | "in_use"
  | "archived"
  | "deprecated";
export type AssetQuality = "low" | "medium" | "high" | "ultra";

// Asset metadata interfaces
export interface AssetDimensions {
  width: number;
  height: number;
  depth?: number;
  frames?: number; // for animations
  duration?: number; // for audio/video in seconds
}

export interface AssetUsage {
  usageCount: number;
  lastUsed?: Date;
  usedInScenes: string[]; // scene IDs where asset is used
  usedInComponents: string[]; // component IDs
  dependencies: string[]; // dependent asset IDs
}

export interface AssetMetadata {
  author?: string;
  license?: string;
  copyright?: string;
  version?: string;
  description?: string;
  keywords: string[];
  style?: string;
  theme?: string;
  genre?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  rating?: number; // 1-5 stars
  downloads?: number;
  likes?: number;
}

export interface AssetOptimization {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  formats: AssetFormat[];
  optimizationLevel: "none" | "light" | "medium" | "aggressive";
  webOptimized: boolean;
  mobileOptimized: boolean;
}

export interface AssetAI {
  generated: boolean;
  aiModel?: string;
  prompt?: string;
  seed?: number;
  confidence?: number;
  qualityScore?: number; // 0-100
  recommendationScore?: number; // 0-100
  tags: string[]; // AI-generated tags
  smartCategory?: string;
  similar?: string[]; // similar asset IDs
  variations?: string[]; // variation asset IDs
}

export interface AssetVersioning {
  version: string;
  changelog?: string;
  previousVersion?: string;
  isLatest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Main Asset interface
export interface Asset {
  // Core identification
  id: string;
  name: string;
  type: AssetType;
  format: AssetFormat;
  source: AssetSource;
  status: AssetStatus;

  // File information
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  size: number; // in bytes
  checksum?: string;
  path?: string; // local file path

  // Visual/Audio properties
  dimensions?: AssetDimensions;
  quality: AssetQuality;
  colorPalette?: string[]; // hex colors
  hasTransparency?: boolean;
  isAnimated?: boolean;
  hasAudio?: boolean;

  // Organization and search
  tags: string[];
  collections: string[]; // collection IDs
  categories: string[];
  searchableText?: string;
  vectorEmbedding?: number[]; // for semantic search

  // Usage and analytics
  usage: AssetUsage;
  metadata: AssetMetadata;
  optimization: AssetOptimization;
  ai: AssetAI;
  versioning: AssetVersioning;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;

  // User permissions
  ownerId: string;
  isPublic: boolean;
  isEditable: boolean;
  isDeletable: boolean;
  sharedWith?: string[]; // user IDs
}

// Collection interfaces
export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isSystem: boolean; // system collections vs user collections
  ownerId: string;
  assetIds: string[];
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  assetCount: number;
}

// Search and filter interfaces
export interface AssetSearchQuery {
  text?: string;
  semanticSearch?: boolean;
  tags?: string[];
  categories?: string[];
  types?: AssetType[];
  formats?: AssetFormat[];
  sources?: AssetSource[];
  statuses?: AssetStatus[];
  collections?: string[];
  quality?: AssetQuality[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sizeRange?: {
    min?: number;
    max?: number;
  };
  dimensionRange?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  usage?: {
    inUse?: boolean;
    unused?: boolean;
    minUsageCount?: number;
  };
  ai?: {
    generated?: boolean;
    minQualityScore?: number;
    minRecommendationScore?: number;
  };
  sortBy?: AssetSortField;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export type AssetSortField =
  | "name"
  | "createdAt"
  | "updatedAt"
  | "lastAccessedAt"
  | "size"
  | "usageCount"
  | "rating"
  | "qualityScore"
  | "relevance";

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  facets?: AssetSearchFacets;
  suggestions?: string[];
  searchTime: number;
}

export interface AssetSearchFacets {
  types: Record<AssetType, number>;
  formats: Record<AssetFormat, number>;
  sources: Record<AssetSource, number>;
  tags: Record<string, number>;
  collections: Record<string, number>;
  quality: Record<AssetQuality, number>;
}

// Filter interfaces
export interface AssetFilter {
  id: string;
  label: string;
  type: "checkbox" | "radio" | "range" | "date" | "multiselect";
  options?: AssetFilterOption[];
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  isAdvanced?: boolean;
}

export interface AssetFilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  color?: string;
}

// Upload interfaces
export interface AssetUploadConfig {
  maxFileSize: number; // bytes
  allowedFormats: AssetFormat[];
  allowedTypes: AssetType[];
  requiresSubscription?: boolean;
  autoOptimize: boolean;
  generateThumbnail: boolean;
  extractMetadata: boolean;
  runAIAnalysis: boolean;
  virusScan: boolean;
}

export interface AssetUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  stage: AssetUploadStage;
  error?: string;
  estimatedTimeRemaining?: number; // seconds
}

export type AssetUploadStage =
  | "queued"
  | "uploading"
  | "processing"
  | "optimizing"
  | "analyzing"
  | "generating_thumbnail"
  | "extracting_metadata"
  | "virus_scanning"
  | "finalizing"
  | "completed"
  | "failed";

export interface AssetUploadResult {
  asset: Asset;
  warnings?: string[];
  optimizationReport?: {
    originalSize: number;
    finalSize: number;
    sizeSaved: number;
    formatChanged?: boolean;
  };
}

// Batch operations
export interface AssetBatchOperation {
  type: "delete" | "move" | "tag" | "optimize" | "export" | "analyze";
  assetIds: string[];
  parameters?: Record<string, unknown>;
}

export interface AssetBatchResult {
  successful: string[]; // asset IDs
  failed: Array<{
    assetId: string;
    error: string;
  }>;
  summary: string;
}

// Preview and interaction
export interface AssetPreviewConfig {
  type: AssetType;
  canZoom: boolean;
  canPlay: boolean;
  canEdit: boolean;
  canDownload: boolean;
  showMetadata: boolean;
  showUsage: boolean;
  showAIInfo: boolean;
  enableDragDrop: boolean;
}

// AI recommendation interfaces
export interface AssetRecommendation {
  assetId: string;
  score: number; // 0-100
  reason: string;
  tags: string[];
  similarity: number; // 0-1
  type: "similar" | "complementary" | "style_match" | "usage_pattern";
}

export interface AssetRecommendationContext {
  currentAssets?: string[]; // currently selected/used assets
  gameGenre?: string;
  gameStyle?: string;
  targetAudience?: string;
  preferences?: string[];
  excludeIds?: string[];
}

// Analytics and insights
export interface AssetAnalytics {
  assetId: string;
  views: number;
  downloads: number;
  uses: number;
  shares: number;
  likes: number;
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
  trends: {
    viewsOverTime: Array<{ date: Date; count: number }>;
    usageOverTime: Array<{ date: Date; count: number }>;
  };
}

// Component prop interfaces
export interface AssetCardProps {
  asset: Asset;
  isSelected?: boolean;
  isHighlighted?: boolean;
  showMetadata?: boolean;
  showUsage?: boolean;
  size?: "small" | "medium" | "large";
  onClick?: (asset: Asset) => void;
  onDoubleClick?: (asset: Asset) => void;
  onSelect?: (asset: Asset, selected: boolean) => void;
  onDragStart?: (asset: Asset) => void;
  onPreview?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  showActions?: boolean;
  customActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: (asset: Asset) => void;
  }>;
}

export interface AssetGridProps {
  assets: Asset[];
  selectedIds?: string[];
  highlightedId?: string;
  loading?: boolean;
  error?: string;
  emptyState?: ReactNode;
  columns?: number;
  gap?: number;
  itemSize?: "small" | "medium" | "large";
  virtualScrolling?: boolean;
  enableSelection?: boolean;
  enableDragDrop?: boolean;
  onAssetClick?: (asset: Asset) => void;
  onAssetDoubleClick?: (asset: Asset) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onDragStart?: (asset: Asset) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface AssetPreviewProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onAddToCollection?: (asset: Asset) => void;
  showMetadata?: boolean;
  showUsage?: boolean;
  showAIInfo?: boolean;
  enableZoom?: boolean;
  enablePlayback?: boolean;
}

// Hook return types
export interface UseAssetsReturn {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  search: (query: AssetSearchQuery) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  bulkOperation: (operation: AssetBatchOperation) => Promise<AssetBatchResult>;
}

export interface UseAssetUploadReturn {
  upload: (
    files: File[],
    config?: Partial<AssetUploadConfig>,
  ) => Promise<AssetUploadResult[]>;
  progress: AssetUploadProgress[];
  isUploading: boolean;
  cancel: (fileId: string) => void;
  clear: () => void;
}

export interface UseAssetRecommendationsReturn {
  recommendations: AssetRecommendation[];
  loading: boolean;
  error: string | null;
  getRecommendations: (context: AssetRecommendationContext) => Promise<void>;
  refresh: () => Promise<void>;
}

// Error types
export class AssetError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "AssetError";
    this.code = code;
    this.details = details;
  }
}

export type AssetErrorCode =
  | "ASSET_NOT_FOUND"
  | "ASSET_ACCESS_DENIED"
  | "ASSET_UPLOAD_FAILED"
  | "ASSET_FORMAT_UNSUPPORTED"
  | "ASSET_SIZE_EXCEEDED"
  | "ASSET_QUOTA_EXCEEDED"
  | "ASSET_PROCESSING_FAILED"
  | "ASSET_OPTIMIZATION_FAILED"
  | "ASSET_AI_ANALYSIS_FAILED"
  | "ASSET_SEARCH_FAILED";
