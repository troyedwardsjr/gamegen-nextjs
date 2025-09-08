// GameGen Export System Types
// Multi-platform game export functionality with subscription tier validation

export type ExportStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type ExportPriority = "low" | "normal" | "high" | "urgent";
export type ExportPlatform =
  | "web"
  | "pwa"
  | "desktop-windows"
  | "desktop-macos"
  | "desktop-linux"
  | "mobile-android"
  | "mobile-ios"
  | "source-code";

export type SubscriptionTier = "free" | "pro" | "max" | "educational";
export type StorageProvider = "supabase" | "cdn" | "s3";

// Core export interfaces matching database schema
export interface ExportJob {
  id: string;
  game_id: string;
  user_id: string;
  platform: ExportPlatform;
  export_options: ExportOptions;
  subscription_tier: SubscriptionTier;
  status: ExportStatus;
  priority: ExportPriority;
  progress_percentage: number;
  worker_id?: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  retry_count: number;
  max_retries: number;
  build_log?: string;
  build_artifacts: string[];
  build_size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface ExportArtifact {
  id: string;
  export_job_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  content_type: string;
  checksum_md5: string;
  storage_provider: StorageProvider;
  storage_url: string;
  public_url?: string;
  download_count: number;
  download_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportPlatformConfig {
  id: string;
  platform: ExportPlatform;
  config_name: string;
  config_data: PlatformConfigData;
  is_default: boolean;
  template_url?: string;
  optimization_settings: OptimizationSettings;
  build_commands: string[];
  required_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface ExportQueueStats {
  id: string;
  total_queued: number;
  total_processing: number;
  total_completed_today: number;
  total_failed_today: number;
  avg_processing_time_seconds: number;
  peak_queue_size: number;
  active_workers: number;
  max_workers: number;
  stats_date: string;
  last_updated: string;
}

export interface UserExportUsage {
  id: string;
  user_id: string;
  usage_date: string;
  exports_today: number;
  total_exports: number;
  web_exports: number;
  desktop_exports: number;
  mobile_exports: number;
  source_exports: number;
  total_storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface ExportAnalytics {
  id: string;
  export_job_id: string;
  queue_wait_time_seconds?: number;
  build_time_seconds?: number;
  total_time_seconds?: number;
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  disk_usage_mb?: number;
  platform_metrics: Record<string, any>;
  build_success?: boolean;
  test_results: Record<string, any>;
  quality_score?: number;
  created_at: string;
}

export interface ExportWebhook {
  id: string;
  user_id: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  on_job_started: boolean;
  on_job_completed: boolean;
  on_job_failed: boolean;
  last_triggered_at?: string;
  failure_count: number;
  max_failures: number;
  created_at: string;
  updated_at: string;
}

// Platform-specific configuration types
export interface PlatformConfigData {
  bundle_type: string;
  minify?: boolean;
  compression?: string;
  features?: Record<string, boolean | string | number>;
  white_label?: boolean;
  custom_branding?: CustomBrandingConfig;
  advanced_features?: Record<string, boolean>;
  enterprise_features?: Record<string, boolean>;
  target_browsers?: string[];
  target_arch?: string[];
  permissions?: string[];
  app_info?: AppInfoConfig;
  executable?: ExecutableConfig;
  manifest?: PWAManifestConfig;
  plist_entries?: Record<string, any>;
  structure?: SourceStructureConfig;
}

export interface CustomBrandingConfig {
  remove_gamegen_branding?: boolean;
  custom_splash_screen?: boolean;
  custom_loading_screen?: boolean;
  custom_favicon?: boolean;
  custom_meta_tags?: boolean;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name?: string;
}

export interface AppInfoConfig {
  version_code?: number;
  bundle_version?: string;
  package_name?: string;
  bundle_identifier?: string;
  app_name?: string;
  theme?: string;
  requires_fullscreen?: boolean;
}

export interface ExecutableConfig {
  icon?: string;
  company_name?: string;
  file_description?: string;
  product_name?: string;
  bundle_id?: string;
  category?: string;
  copyright?: string;
  desktop_name?: string;
  generic_name?: string;
  categories?: string[];
}

export interface PWAManifestConfig {
  theme_color?: string;
  background_color?: string;
  display?: string;
  orientation?: string;
}

export interface SourceStructureConfig {
  src_directory?: string;
  assets_directory?: string;
  docs_directory?: string;
  tests_directory?: string;
  config_files?: boolean;
}

export interface OptimizationSettings {
  image_optimization?: boolean;
  audio_compression?: boolean;
  code_splitting?: boolean;
  tree_shaking?: boolean;
  caching_strategy?: string;
  native_modules?: boolean;
  code_signing?: boolean;
  installer_creation?: boolean;
  bundle_size_optimization?: boolean;
  apk_optimization?: boolean;
  proguard_enabled?: boolean;
  resource_optimization?: boolean;
  advanced_optimization?: boolean;
  custom_cdn_integration?: boolean;
  performance_monitoring?: boolean;
  a_b_testing_ready?: boolean;
  enterprise_optimization?: boolean;
  advanced_security?: boolean;
  performance_profiling?: boolean;
}

// Export request and response types
export interface CreateExportJobRequest {
  game_id: string;
  platform: ExportPlatform;
  export_options?: Partial<ExportOptions>;
  priority?: ExportPriority;
  custom_config?: Partial<PlatformConfigData>;
}

export interface ExportOptions {
  // General options
  include_source_maps?: boolean;
  enable_debug_mode?: boolean;

  // Branding options (Max tier)
  custom_branding?: CustomBrandingConfig;

  // Performance options
  optimization_level?: "basic" | "standard" | "aggressive";
  target_file_size_mb?: number;

  // Platform-specific options
  web_options?: WebExportOptions;
  desktop_options?: DesktopExportOptions;
  mobile_options?: MobileExportOptions;
  source_options?: SourceExportOptions;
}

export interface WebExportOptions {
  enable_pwa?: boolean;
  offline_support?: boolean;
  responsive_breakpoints?: string[];
  seo_optimization?: boolean;
  analytics_tracking_id?: string;
}

export interface DesktopExportOptions {
  auto_updater_enabled?: boolean;
  system_tray_enabled?: boolean;
  file_associations?: string[];
  startup_launch?: boolean;
  installer_type?: "exe" | "msi" | "dmg" | "pkg" | "appimage" | "deb";
}

export interface MobileExportOptions {
  orientation_lock?: "portrait" | "landscape" | "any";
  status_bar_style?: "default" | "light-content" | "dark-content" | "hidden";
  splash_screen_duration?: number;
  enable_hardware_acceleration?: boolean;
}

export interface SourceExportOptions {
  documentation_level?: "minimal" | "standard" | "detailed";
  include_tests?: boolean;
  include_build_scripts?: boolean;
  code_style?: "prettier" | "eslint" | "custom";
  license_type?: "mit" | "apache" | "gpl" | "proprietary";
}

export interface ExportJobResponse {
  job: ExportJob;
  estimated_wait_time_minutes: number;
  queue_position: number;
}

export interface ExportStatusResponse {
  job: ExportJob;
  artifacts: ExportArtifact[];
  analytics?: ExportAnalytics;
  queue_position?: number;
  estimated_completion?: string;
}

export interface ExportQueueResponse {
  stats: ExportQueueStats;
  user_jobs: ExportJob[];
  available_platforms: ExportPlatform[];
  subscription_limits: SubscriptionLimits;
}

// Subscription and limits
export interface SubscriptionLimits {
  daily_export_limit: number;
  concurrent_exports: number;
  max_file_size_mb: number;
  available_platforms: ExportPlatform[];
  features: {
    source_code_export: boolean;
    white_label_exports: boolean;
    custom_branding: boolean;
    priority_queue: boolean;
    webhook_notifications: boolean;
    advanced_analytics: boolean;
  };
}

// Error handling
export interface ExportError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retry_after_seconds?: number;
  documentation_url?: string;
}

export interface ExportValidationError extends ExportError {
  field: string;
  value: any;
  constraints: string[];
}

// Webhook payload types
export interface ExportWebhookPayload {
  event: "job.started" | "job.completed" | "job.failed" | "job.cancelled";
  job: ExportJob;
  user_id: string;
  timestamp: string;
  artifacts?: ExportArtifact[];
  error?: ExportError;
}

// Real-time updates
export interface ExportProgressUpdate {
  job_id: string;
  status: ExportStatus;
  progress_percentage: number;
  current_step?: string;
  estimated_completion?: string;
  error?: ExportError;
}

// Platform capability matrix
export const PLATFORM_CAPABILITIES: Record<
  ExportPlatform,
  {
    tiers: SubscriptionTier[];
    features: string[];
    typical_size_mb: number;
    build_time_minutes: number;
  }
> = {
  web: {
    tiers: ["free", "pro", "max", "educational"],
    features: ["responsive", "touch-optimized", "gamepad-support"],
    typical_size_mb: 5,
    build_time_minutes: 2,
  },
  pwa: {
    tiers: ["free", "pro", "max", "educational"],
    features: ["offline-support", "installable", "push-notifications"],
    typical_size_mb: 8,
    build_time_minutes: 3,
  },
  "desktop-windows": {
    tiers: ["pro", "max"],
    features: ["native-menus", "file-associations", "auto-updater"],
    typical_size_mb: 150,
    build_time_minutes: 8,
  },
  "desktop-macos": {
    tiers: ["pro", "max"],
    features: ["dock-integration", "launch-services", "native-menus"],
    typical_size_mb: 120,
    build_time_minutes: 10,
  },
  "desktop-linux": {
    tiers: ["pro", "max"],
    features: ["desktop-integration", "appimage", "deb-package"],
    typical_size_mb: 140,
    build_time_minutes: 9,
  },
  "mobile-android": {
    tiers: ["pro", "max"],
    features: ["touch-optimized", "immersive-mode", "hardware-acceleration"],
    typical_size_mb: 25,
    build_time_minutes: 12,
  },
  "mobile-ios": {
    tiers: ["pro", "max"],
    features: ["touch-optimized", "status-bar-control", "fullscreen"],
    typical_size_mb: 30,
    build_time_minutes: 15,
  },
  "source-code": {
    tiers: ["pro", "max", "educational"],
    features: ["full-source", "documentation", "build-scripts"],
    typical_size_mb: 2,
    build_time_minutes: 1,
  },
};

// Utility type helpers
export type ExportJobCreate = Omit<
  ExportJob,
  | "id"
  | "status"
  | "progress_percentage"
  | "retry_count"
  | "build_artifacts"
  | "created_at"
  | "updated_at"
>;
export type ExportJobUpdate = Partial<
  Pick<
    ExportJob,
    | "status"
    | "progress_percentage"
    | "error_message"
    | "error_details"
    | "build_log"
    | "build_artifacts"
  >
>;
export type PlatformConfigUpdate = Partial<
  Pick<
    ExportPlatformConfig,
    "config_data" | "optimization_settings" | "build_commands"
  >
>;

// Queue management types
export interface QueueMetrics {
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_today: number;
  failed_today: number;
  average_wait_time_minutes: number;
  average_processing_time_minutes: number;
  success_rate_percentage: number;
}

export interface WorkerStatus {
  worker_id: string;
  status: "idle" | "busy" | "offline";
  current_job_id?: string;
  platform_specializations: ExportPlatform[];
  jobs_completed_today: number;
  average_job_time_minutes: number;
  last_heartbeat: string;
}

// Client-side hooks and utilities
export interface UseExportJobOptions {
  auto_refresh?: boolean;
  refresh_interval_ms?: number;
  subscribe_to_updates?: boolean;
}

export interface UseExportQueueOptions {
  user_jobs_only?: boolean;
  include_analytics?: boolean;
  platforms_filter?: ExportPlatform[];
}
