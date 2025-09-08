export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: string;
  url?: string;
  thumbnail?: string;
  lastModified: Date;
  createdAt: Date;
  tags: string[];
  inUse: boolean;
  usageCount: number;
  collections: string[];
  metadata: AssetMetadata;
  source: AssetSource;
  licensing?: AssetLicensing;
  version: number;
  parentId?: string;
  variants?: string[];
}

export type AssetType = 
  | "sprite" 
  | "tileset" 
  | "sound" 
  | "music" 
  | "animation" 
  | "font" 
  | "texture" 
  | "model" 
  | "shader" 
  | "script";

export interface AssetMetadata {
  fileSize: number;
  format: string;
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
  duration?: number; // for audio/video assets
  frameCount?: number; // for animations
  fps?: number;
  quality: number; // 0-100 quality score
  compression?: string;
  colorDepth?: number;
  hasTransparency?: boolean;
  channels?: number; // audio channels
  sampleRate?: number;
  bitRate?: number;
  checksum: string;
  aiGenerated: boolean;
  processingSteps?: string[];
}

export interface AssetSource {
  type: "upload" | "generated" | "imported" | "template" | "marketplace";
  origin?: string;
  generator?: {
    model: string;
    prompt?: string;
    settings?: Record<string, any>;
    seed?: number;
  };
  uploader?: {
    userId: string;
    username: string;
  };
  importSource?: {
    url: string;
    platform: string;
  };
}

export interface AssetLicensing {
  type: "free" | "commercial" | "restricted" | "custom";
  attribution?: string;
  commercialUse: boolean;
  modification: boolean;
  distribution: boolean;
  license: string;
  cost?: number;
  currency?: string;
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  type: "user" | "system" | "shared" | "template";
  assets: string[];
  tags: string[];
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  collaborators?: string[];
  metadata?: Record<string, any>;
}

export interface AssetSearchQuery {
  text?: string;
  types?: AssetType[];
  tags?: string[];
  collections?: string[];
  inUse?: boolean;
  source?: AssetSource['type'][];
  quality?: {
    min: number;
    max: number;
  };
  sizeRange?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minFileSize?: number;
    maxFileSize?: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  aiGenerated?: boolean;
  sortBy: AssetSortOption;
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
  semanticSearch?: boolean;
  embedding?: number[];
}

export type AssetSortOption = 
  | "name"
  | "type"
  | "size"
  | "created"
  | "modified"
  | "usage"
  | "quality"
  | "relevance";

export interface AssetRecommendation {
  asset: Asset;
  confidence: number;
  reasoning: string;
  category: "similar" | "complementary" | "trending" | "contextual";
  metadata: {
    baseAssets?: string[];
    projectContext?: Record<string, any>;
    userPreferences?: Record<string, any>;
    styleAnalysis?: Record<string, any>;
  };
}

export interface AssetUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: AssetUploadStatus;
  error?: string;
  asset?: Asset;
  processing?: {
    stage: AssetProcessingStage;
    progress: number;
    message: string;
  };
}

export type AssetUploadStatus = 
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type AssetProcessingStage = 
  | "validation"
  | "upload"
  | "analysis"
  | "optimization"
  | "thumbnail"
  | "metadata"
  | "indexing"
  | "completed";

export interface AssetValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: Partial<AssetMetadata>;
  suggestions?: string[];
}

export interface AssetAnalytics {
  assetId: string;
  views: number;
  downloads: number;
  uses: number;
  ratings: {
    average: number;
    count: number;
    distribution: Record<number, number>;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
  usage: {
    projects: string[];
    lastUsed: Date;
    frequency: number;
  };
  trends: {
    period: string;
    metric: string;
    values: number[];
    dates: Date[];
  }[];
}

export interface AssetCache {
  id: string;
  url: string;
  blob?: Blob;
  thumbnail?: string;
  metadata: AssetMetadata;
  cachedAt: Date;
  expiresAt: Date;
  size: number;
  accessCount: number;
  lastAccessed: Date;
}

export interface AssetPreviewOptions {
  zoom?: number;
  fit?: "contain" | "cover" | "fill";
  background?: string;
  showMetadata?: boolean;
  allowEdit?: boolean;
  autoPlay?: boolean; // for animations/audio
  loop?: boolean;
  volume?: number;
}

export interface AssetDragData {
  asset: Asset;
  type: "asset";
  action: "copy" | "move" | "reference";
  metadata?: Record<string, any>;
}

export interface AssetFilter {
  id: string;
  name: string;
  type: "text" | "select" | "multiselect" | "range" | "date" | "boolean";
  field: keyof Asset | string;
  options?: { label: string; value: any }[];
  value: any;
  operator?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "notIn";
  enabled: boolean;
}

export interface AssetLibraryState {
  assets: Asset[];
  collections: AssetCollection[];
  selectedAssets: string[];
  selectedCollection: string | null;
  query: AssetSearchQuery;
  filters: AssetFilter[];
  recommendations: AssetRecommendation[];
  uploads: AssetUploadProgress[];
  loading: boolean;
  error: string | null;
  cache: Map<string, AssetCache>;
  preferences: {
    gridSize: "small" | "medium" | "large";
    showMetadata: boolean;
    autoPreview: boolean;
    defaultSort: AssetSortOption;
    previewOptions: AssetPreviewOptions;
  };
}
