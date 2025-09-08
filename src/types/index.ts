/**
 * GameGen Types - Main Export Index
 *
 * Central export file for all TypeScript type definitions in the GameGen
 * pixel art game creation platform.
 */

// =========================
// Database Types
// =========================
export * from "./database";

// =========================
// Social Features Types
// =========================
export * from "./social";

// =========================
// Authentication Types
// =========================
export * from "./auth";

// =========================
// User Types
// =========================
export {
  UserDisplayPreferences,
  UserNotificationPreferences,
  UserPrivacySettings,
  UserOnboardingState,
  UserAchievement,
  UserStats,
  UserActivity,
  UserConnection,
  UserFavorite,
  UserProfileComplete,
  UserProfileUpdateRequest,
  UserSettingsUpdateRequest,
  UserSearchFilters,
  UserPortfolioItem,
  UserBadge,
  UserDataExport,
  UserDeletionRequest,
  UserApiResponse,
  GetUserProfileResponse,
  GetUserStatsResponse,
  GetUserActivitiesResponse,
  SearchUsersResponse,
  GameEditorPreferences,
  AssetManagerPreferences,
  isCompleteUserProfile,
  hasAchievement,
  calculateCreatorLevel,
  calculateReputationScore,
} from "./user";

// Re-export UserProfile from database to avoid conflicts
export type { UserProfile } from "./database";

// =========================
// Subscription & Billing Types
// =========================
export {
  PlanTier,
  SubscriptionStatus,
  AIOperationType,
  BillingCycle,
  PlanConfig,
  SubscriptionWithDetails,
  AIUsage,
  UsageStatistics,
  Invoice,
  InvoiceLineItem,
  PaymentMethod,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  PlanComparison,
  CreditPackage,
  TeamSubscription,
  BillingErrorType,
  BillingError,
  StripeWebhookEventType,
  BillingDashboardData,
  BillingApiResponse,
  CreateSubscriptionResponse,
  UpdateSubscriptionResponse,
  PurchaseCreditsResponse,
  isActiveSubscription,
  hasFeature,
  canUpgradeTo,
  calculateUsagePercentage,
  getNextBillingDate,
  formatCurrency,
} from "./subscription";

// Re-export Subscription from database to avoid conflicts
export type { Subscription } from "./database";

// =========================
// API Types
// =========================
export * from "./api";

// =========================
// UI Component Types
// =========================
export * from "./ui";

// =========================
// Common Type Aliases
// =========================

// React component type for better reusability
import { FunctionComponent, ComponentType } from "react";

export type FC<P = {}> = FunctionComponent<P>;
export type Component<P = {}> = ComponentType<P>;

// Common ID types used throughout the application
export type UserId = string;
export type GameId = string;
export type AssetId = string;
export type TemplateId = string;
export type SubscriptionId = string;
export type GenerationId = string;

// Common timestamp type
export type Timestamp = string; // ISO 8601 format

// Common configuration object
export type Config<T = Record<string, any>> = T;

// File-related types
export interface FileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  lastModified: Date;
}

// Coordinate and dimension types for pixel art/game development
export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Rectangle extends Point, Dimensions {}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: Color[];
  description?: string;
}

// Game development specific types
export interface Transform {
  position: Point;
  rotation: number; // in degrees
  scale: Point;
}

export interface Sprite {
  id: string;
  name: string;
  texture_url: string;
  frames: Rectangle[];
  animations?: Record<string, number[]>;
  pivot?: Point;
}

export interface TileSet {
  id: string;
  name: string;
  texture_url: string;
  tile_size: Dimensions;
  tiles: Array<{
    id: number;
    properties?: Record<string, any>;
  }>;
}

// Audio types for game development
export interface AudioClip {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
  loop: boolean;
  volume: number; // 0.0 to 1.0
}

// Level/Scene data structure
export interface GameLevel {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  layers: Array<{
    id: string;
    name: string;
    type: "tile" | "object" | "collision";
    data: any;
    visible: boolean;
    opacity: number;
  }>;
  entities: Array<{
    id: string;
    type: string;
    transform: Transform;
    properties: Record<string, any>;
  }>;
  background_music?: string;
  ambient_sounds?: string[];
}

// Input handling types
export type InputKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "w"
  | "a"
  | "s"
  | "d"
  | "Space"
  | "Enter"
  | "Escape"
  | "Mouse0"
  | "Mouse1"
  | "Mouse2";

export interface InputMapping {
  [action: string]: InputKey[];
}

// Performance monitoring types
export interface PerformanceMetrics {
  fps: number;
  frame_time: number; // milliseconds
  memory_usage: number; // bytes
  draw_calls: number;
  entities_count: number;
}

// Error handling types specific to GameGen
export interface GameGenError extends Error {
  code: string;
  context?: Record<string, any>;
  timestamp: Date;
  user_id?: UserId;
  session_id?: string;
  recoverable: boolean;
}

// Event system types for the game engine
export interface GameEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
  source?: string;
}

export type EventListener<T = any> = (event: GameEvent<T>) => void;

// Plugin/Extension system types
export interface GameGenPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;

  // Lifecycle hooks
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;

  // Feature extensions
  components?: Record<string, any>;
  systems?: Record<string, any>;
  tools?: Record<string, any>;

  // Dependencies
  dependencies?: string[];
  peerDependencies?: string[];
}

// Asset processing types
export interface AssetProcessingOptions {
  optimize: boolean;
  generate_mipmaps: boolean;
  compress: boolean;
  format?: "png" | "jpeg" | "webp";
  quality?: number; // 0-100 for lossy formats
  max_width?: number;
  max_height?: number;
  preserve_metadata: boolean;
}

// Version control for games/assets
export interface Version {
  id: string;
  version: string;
  description: string;
  created_at: Timestamp;
  created_by: UserId;
  parent_version?: string;
  is_published: boolean;
  changelog?: string;
}

// Collaboration types
export interface Collaborator {
  user_id: UserId;
  role: "owner" | "editor" | "viewer";
  permissions: string[];
  invited_at: Timestamp;
  joined_at?: Timestamp;
  last_active?: Timestamp;
}

export interface CollaborationSession {
  id: string;
  game_id: GameId;
  participants: Array<{
    user_id: UserId;
    cursor_position?: Point;
    selected_entities?: string[];
    is_active: boolean;
  }>;
  created_at: Timestamp;
  last_activity: Timestamp;
}

// Export/publishing types
export interface ExportTarget {
  platform: "web" | "desktop" | "mobile";
  format: "html5" | "electron" | "apk" | "ipa";
  settings: Record<string, any>;
}

export interface PublishingOptions {
  title: string;
  description: string;
  tags: string[];
  category: string;
  age_rating: "everyone" | "teen" | "mature";
  screenshots: string[];
  trailer_url?: string;
  release_notes?: string;
  visibility: "public" | "unlisted" | "private";
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Promise types for async operations
export type AsyncResult<T, E = GameGenError> = Promise<
  { data: T } | { error: E }
>;
export type PromiseValue<T> = T extends Promise<infer V> ? V : T;

// Collection types
export type Collection<T> = T[];
export type Dictionary<T> = Record<string, T>;
export type KeyValuePair<T> = { key: string; value: T };

// Validation types
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Configuration types
export interface GameGenConfig {
  app: {
    name: string;
    version: string;
    environment: "development" | "staging" | "production";
    debug_mode: boolean;
  };
  api: {
    base_url: string;
    timeout: number;
    retry_attempts: number;
  };
  storage: {
    max_file_size: number;
    allowed_formats: string[];
    cdn_url: string;
  };
  ai: {
    enabled: boolean;
    models: Record<string, any>;
    rate_limits: Record<string, number>;
  };
  editor: {
    auto_save_interval: number;
    max_undo_steps: number;
    grid_snap_size: number;
  };
  game_engine: {
    max_entities: number;
    target_fps: number;
    physics_steps: number;
  };
}

// Type guards for runtime type checking
export const isGameGenError = (error: any): error is GameGenError => {
  return error instanceof Error && "code" in error && "recoverable" in error;
};

export const isValidPoint = (value: any): value is Point => {
  return value && typeof value.x === "number" && typeof value.y === "number";
};

export const isValidDimensions = (value: any): value is Dimensions => {
  return (
    value && typeof value.width === "number" && typeof value.height === "number"
  );
};

export const isValidColor = (value: any): value is Color => {
  return (
    value &&
    typeof value.r === "number" &&
    typeof value.g === "number" &&
    typeof value.b === "number" &&
    value.r >= 0 &&
    value.r <= 255 &&
    value.g >= 0 &&
    value.g <= 255 &&
    value.b >= 0 &&
    value.b <= 255
  );
};

// Constants for common values
export const GAME_TYPES = [
  "bullet_hell",
  "rpg",
  "action_adventure",
  "team_deathmatch",
  "puzzle",
  "platformer",
] as const;

export const ASSET_TYPES = [
  "sprite",
  "tileset",
  "background",
  "sound",
  "music",
  "font",
  "script",
] as const;

export const SUBSCRIPTION_TIERS = ["free", "pro", "max", "enterprise"] as const;

export const AI_OPERATION_TYPES = [
  "sprite_generation",
  "background_generation",
  "sound_generation",
  "music_generation",
  "code_generation",
  "game_logic_generation",
  "level_design_generation",
  "story_generation",
  "asset_enhancement",
  "asset_variation",
] as const;
