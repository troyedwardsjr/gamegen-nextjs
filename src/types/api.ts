/**
 * GameGen API Types
 *
 * TypeScript type definitions for API requests, responses, and error handling
 * in the GameGen pixel art game creation platform.
 */

import {
  UserProfile,
  Game,
  Asset,
  GameTemplate,
  AIGeneration,
} from "./database";

/**
 * HTTP status codes commonly used in GameGen API
 */
export type HTTPStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503; // Service Unavailable

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  request_id: string;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_cursor?: string;
  previous_cursor?: string;
}

/**
 * API error types specific to GameGen
 */
export type ApiErrorType =
  | "validation_error"
  | "authentication_error"
  | "authorization_error"
  | "not_found_error"
  | "conflict_error"
  | "rate_limit_error"
  | "quota_exceeded_error"
  | "file_upload_error"
  | "processing_error"
  | "external_service_error"
  | "database_error"
  | "network_error"
  | "timeout_error"
  | "maintenance_error"
  | "unknown_error";

/**
 * API error structure
 */
export interface ApiError {
  type: ApiErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  field_errors?: Record<string, string[]>;
  suggestion?: string;
  documentation_url?: string;
  retry_after?: number; // seconds for rate limiting
  request_id: string;
}

/**
 * Base API request with common fields
 */
export interface BaseApiRequest {
  request_id?: string;
  idempotency_key?: string;
  correlation_id?: string;
}

/**
 * File upload request
 */
export interface FileUploadRequest extends BaseApiRequest {
  file: File | Blob;
  filename?: string;
  content_type?: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, any>;

  // Processing options
  auto_optimize?: boolean;
  generate_variants?: boolean;
  extract_colors?: boolean; // for pixel art analysis
}

/**
 * File upload response
 */
export interface FileUploadResponse extends ApiResponse {
  data?: {
    id: string;
    url: string;
    filename: string;
    size: number;
    content_type: string;
    metadata?: Record<string, any>;
    processing_status?: "pending" | "processing" | "completed" | "failed";
  };
}

/**
 * Search request parameters
 */
export interface SearchRequest extends BaseApiRequest {
  query?: string;
  filters?: Record<string, any>;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
  facets?: string[];
  include_facets?: boolean;
}

/**
 * Search response with facets
 */
export interface SearchResponse<T = any> extends PaginatedApiResponse<T> {
  facets?: Record<
    string,
    Array<{
      value: string;
      count: number;
      selected: boolean;
    }>
  >;
  query_info?: {
    query: string;
    took_ms: number;
    total_hits: number;
    max_score: number;
  };
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T = any> extends BaseApiRequest {
  operations: Array<{
    operation: "create" | "update" | "delete";
    data: T;
    id?: string;
  }>;
  options?: {
    continue_on_error?: boolean;
    return_results?: boolean;
    validate_only?: boolean;
  };
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse extends ApiResponse {
  data?: {
    success_count: number;
    error_count: number;
    results: Array<{
      operation: string;
      id?: string;
      success: boolean;
      data?: any;
      error?: ApiError;
    }>;
  };
}

// =========================
// Game API Types
// =========================

export interface CreateGameRequest extends BaseApiRequest {
  title: string;
  description?: string;
  game_type: Game["game_type"];
  template_id?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface UpdateGameRequest extends BaseApiRequest {
  title?: string;
  description?: string;
  game_config?: any;
  script_files?: any;
  thumbnail_url?: string;
  cover_image_url?: string;
  status?: Game["status"];
  is_public?: boolean;
  tags?: string[];
}

export interface GameSearchRequest extends SearchRequest {
  filters?: {
    game_type?: Game["game_type"][];
    status?: Game["status"][];
    tags?: string[];
    is_public?: boolean;
    created_after?: string;
    created_before?: string;
    min_play_count?: number;
    min_like_count?: number;
  };
}

export interface PublishGameRequest extends BaseApiRequest {
  game_id: string;
  version?: string;
  release_notes?: string;
  publish_settings?: {
    allow_comments?: boolean;
    allow_forks?: boolean;
    age_rating?: string;
    content_warnings?: string[];
  };
}

// =========================
// Asset API Types
// =========================

export interface CreateAssetRequest extends BaseApiRequest {
  name: string;
  description?: string;
  asset_type: Asset["asset_type"];
  category?: string;
  file: File | Blob;
  tags?: string[];
  license_type?: Asset["license_type"];
  is_public?: boolean;
}

export interface UpdateAssetRequest extends BaseApiRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  license_type?: Asset["license_type"];
  is_public?: boolean;
}

export interface AssetSearchRequest extends SearchRequest {
  filters?: {
    asset_type?: Asset["asset_type"][];
    category?: string[];
    tags?: string[];
    license_type?: Asset["license_type"][];
    is_public?: boolean;
    ai_generated?: boolean;
    min_download_count?: number;
    file_size_min?: number;
    file_size_max?: number;
  };
}

// =========================
// AI Generation API Types
// =========================

export interface AIGenerationRequest extends BaseApiRequest {
  generation_type: AIGeneration["generation_type"];
  prompt: string;
  game_id?: string;

  // Generation parameters
  style_params?: {
    art_style?: "pixel_art" | "low_poly" | "cartoon" | "realistic";
    color_palette?: string[];
    resolution?: string;
    pixel_density?: number;
  };

  // Code generation parameters
  code_params?: {
    language?: "javascript" | "typescript";
    framework?: "toxoid" | "vanilla";
    complexity?: "simple" | "moderate" | "complex";
    include_comments?: boolean;
  };

  // Audio generation parameters
  audio_params?: {
    duration_seconds?: number;
    tempo?: number;
    key?: string;
    genre?: string;
    mood?: string;
  };

  // Advanced options
  reference_images?: string[];
  negative_prompts?: string[];
  seed?: number;
  variations_count?: number;
  priority?: "low" | "normal" | "high";
}

export interface AIGenerationResponse extends ApiResponse {
  data?: {
    generation_id: string;
    status: AIGeneration["status"];
    estimated_completion_time?: string;
    credits_used: number;
    queue_position?: number;
  };
}

export interface AIGenerationStatusRequest extends BaseApiRequest {
  generation_id: string;
}

export interface AIGenerationStatusResponse extends ApiResponse {
  data?: AIGeneration & {
    progress_percentage?: number;
    current_step?: string;
    output_preview_url?: string;
  };
}

// =========================
// Template API Types
// =========================

export interface CreateTemplateRequest extends BaseApiRequest {
  name: string;
  description?: string;
  game_type: GameTemplate["game_type"];
  difficulty_level: GameTemplate["difficulty_level"];
  template_config: any;
  preview_assets?: any;
  thumbnail_url?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface TemplateSearchRequest extends SearchRequest {
  filters?: {
    game_type?: GameTemplate["game_type"][];
    difficulty_level?: GameTemplate["difficulty_level"][];
    is_official?: boolean;
    tags?: string[];
    min_usage_count?: number;
    min_rating?: number;
  };
}

// =========================
// User API Types
// =========================

export interface UpdateUserProfileRequest extends BaseApiRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  timezone?: string;
  language_preference?: string;
  theme_preference?: string;
  use_case?: UserProfile["use_case"];
}

export interface UserSearchRequest extends SearchRequest {
  filters?: {
    use_case?: UserProfile["use_case"][];
    subscription_tier?: UserProfile["subscription_tier"][];
    has_published_games?: boolean;
    has_public_assets?: boolean;
    min_reputation?: number;
    location?: string;
    joined_after?: string;
  };
}

// =========================
// Analytics API Types
// =========================

export interface AnalyticsRequest extends BaseApiRequest {
  metric: string;
  start_date: string;
  end_date: string;
  granularity?: "hour" | "day" | "week" | "month";
  filters?: Record<string, any>;
  group_by?: string[];
}

export interface AnalyticsResponse extends ApiResponse {
  data?: {
    metric: string;
    period: { start: string; end: string };
    total_value: number;
    data_points: Array<{
      timestamp: string;
      value: number;
      dimensions?: Record<string, string>;
    }>;
    comparison?: {
      previous_period: number;
      change_percentage: number;
      change_direction: "up" | "down" | "flat";
    };
  };
}

// =========================
// Export API Types
// =========================

export interface GameExportRequest extends BaseApiRequest {
  game_id: string;
  export_format: "web" | "desktop" | "mobile" | "source";
  export_options?: {
    minify_code?: boolean;
    include_assets?: boolean;
    include_source?: boolean;
    custom_branding?: boolean;
    target_platform?: string;
    optimization_level?: "none" | "basic" | "aggressive";
  };
}

export interface GameExportResponse extends ApiResponse {
  data?: {
    export_id: string;
    status: "queued" | "processing" | "completed" | "failed";
    estimated_completion_time?: string;
    download_url?: string;
    expires_at?: string;
  };
}

// =========================
// Webhook API Types
// =========================

export interface WebhookEvent<T = any> {
  id: string;
  type: string;
  created_at: string;
  data: T;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookRequest extends BaseApiRequest {
  url: string;
  events: string[];
  secret?: string;
  metadata?: Record<string, any>;
}

// =========================
// Utility Types and Functions
// =========================

/**
 * API client configuration
 */
export interface ApiClientConfig {
  base_url: string;
  api_key?: string;
  timeout_ms: number;
  retry_attempts: number;
  retry_delay_ms: number;
  user_agent?: string;
  default_headers?: Record<string, string>;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  abort_signal?: AbortSignal;
  headers?: Record<string, string>;
  cache?: "no-cache" | "force-cache" | "default";
  credentials?: "same-origin" | "include" | "omit";
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: string;
  retry_after?: number;
}

// Type guards
export const isApiError = (error: any): error is ApiError => {
  return (
    error && typeof error === "object" && "type" in error && "code" in error
  );
};

export const isValidationError = (
  error: ApiError,
): error is ApiError & { field_errors: Record<string, string[]> } => {
  return error.type === "validation_error" && "field_errors" in error;
};

export const isRateLimitError = (
  error: ApiError,
): error is ApiError & { retry_after: number } => {
  return error.type === "rate_limit_error" && "retry_after" in error;
};

// Utility functions
export const createApiError = (
  type: ApiErrorType,
  code: string,
  message: string,
  details?: Record<string, any>,
): ApiError => ({
  type,
  code,
  message,
  details,
  request_id: crypto.randomUUID(),
});

export const formatApiResponse = <T>(
  data: T,
  success = true,
  message?: string,
): ApiResponse<T> => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString(),
  request_id: crypto.randomUUID(),
});

export const extractErrorMessage = (error: ApiError | Error): string => {
  if (isApiError(error)) {
    return error.message || error.code || "An API error occurred";
  }

  return error.message || "An unexpected error occurred";
};
