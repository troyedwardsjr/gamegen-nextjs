/**
 * GameGen User Types
 * 
 * TypeScript type definitions for user profiles, settings, preferences,
 * and user-related functionality in the GameGen platform.
 */

import { Database, UserProfile as DBUserProfile, Game, Asset } from './database';

// Re-export database user profile type
export type UserProfile = DBUserProfile;

/**
 * User display preferences for the GameGen platform
 */
export interface UserDisplayPreferences {
  // UI Theme
  theme: 'light' | 'dark' | 'system';
  color_scheme?: 'default' | 'blue' | 'green' | 'purple' | 'red';
  
  // Layout preferences
  sidebar_collapsed: boolean;
  grid_view_default: boolean; // vs list view
  games_per_page: number;
  assets_per_page: number;
  
  // Editor preferences
  code_font_size: number;
  code_theme: 'light' | 'dark' | 'high-contrast';
  show_line_numbers: boolean;
  word_wrap: boolean;
  minimap_enabled: boolean;
  
  // Game preview preferences
  auto_save_interval: number; // seconds
  show_fps_counter: boolean;
  debug_mode_default: boolean;
  
  // Asset library preferences
  asset_preview_size: 'small' | 'medium' | 'large';
  show_asset_details: boolean;
  group_by_type: boolean;
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  // Email notifications
  email_enabled: boolean;
  email_game_published: boolean;
  email_game_featured: boolean;
  email_asset_approved: boolean;
  email_comments: boolean;
  email_followers: boolean;
  email_newsletter: boolean;
  email_tips_and_updates: boolean;
  
  // In-app notifications
  browser_enabled: boolean;
  browser_game_published: boolean;
  browser_comments: boolean;
  browser_ai_generation_complete: boolean;
  browser_export_ready: boolean;
  
  // Marketing preferences
  marketing_emails: boolean;
  partner_promotions: boolean;
  community_highlights: boolean;
}

/**
 * User privacy settings
 */
export interface UserPrivacySettings {
  // Profile visibility
  profile_public: boolean;
  show_real_name: boolean;
  show_email: boolean;
  show_join_date: boolean;
  show_game_count: boolean;
  show_asset_count: boolean;
  
  // Game visibility defaults
  games_public_default: boolean;
  allow_game_forking: boolean;
  allow_game_comments: boolean;
  
  // Asset visibility defaults
  assets_public_default: boolean;
  allow_asset_downloads: boolean;
  allow_asset_comments: boolean;
  
  // Data sharing
  analytics_tracking: boolean;
  personalized_recommendations: boolean;
  usage_data_sharing: boolean;
}

/**
 * User onboarding progress
 */
export interface UserOnboardingState {
  completed: boolean;
  current_step: number;
  steps_completed: string[];
  skipped_steps: string[];
  
  // Step-specific data
  use_case_selected: boolean;
  first_game_created: boolean;
  first_asset_uploaded: boolean;
  ai_generation_tried: boolean;
  profile_completed: boolean;
  social_connections_made: boolean;
}

/**
 * User achievement system
 */
export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: 'creation' | 'community' | 'skill' | 'milestone';
  earned_at: string;
  progress?: number; // for progressive achievements
  max_progress?: number;
}

/**
 * User statistics and metrics
 */
export interface UserStats {
  // Creation stats
  total_games_created: number;
  total_games_published: number;
  total_games_featured: number;
  total_assets_uploaded: number;
  total_assets_downloaded: number;
  total_ai_generations: number;
  
  // Engagement stats
  total_plays_received: number;
  total_likes_received: number;
  total_comments_received: number;
  total_forks_received: number;
  
  // Community stats
  total_followers: number;
  total_following: number;
  total_games_liked: number;
  total_games_forked: number;
  total_comments_made: number;
  
  // Time-based stats
  total_time_in_editor: number; // minutes
  longest_session_duration: number; // minutes
  average_session_duration: number; // minutes
  days_active_this_month: number;
  streak_days: number; // current streak
  longest_streak_days: number;
  
  // Monthly stats (current billing period)
  monthly_games_created: number;
  monthly_ai_credits_used: number;
  monthly_storage_used: number; // bytes
  monthly_exports: number;
}

/**
 * User activity feed item
 */
export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 
    | 'game_created'
    | 'game_published' 
    | 'game_updated'
    | 'game_featured'
    | 'asset_uploaded'
    | 'asset_featured'
    | 'game_liked'
    | 'game_commented'
    | 'game_forked'
    | 'user_followed'
    | 'achievement_earned'
    | 'milestone_reached';
  
  activity_data: {
    game_id?: string;
    game_title?: string;
    asset_id?: string;
    asset_name?: string;
    target_user_id?: string;
    target_username?: string;
    achievement_id?: string;
    achievement_name?: string;
    comment_text?: string;
    milestone_type?: string;
    milestone_value?: number;
  };
  
  created_at: string;
  is_public: boolean;
}

/**
 * User social connections
 */
export interface UserConnection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  notification_enabled: boolean;
}

/**
 * User favorite items
 */
export interface UserFavorite {
  id: string;
  user_id: string;
  item_type: 'game' | 'asset' | 'template' | 'user';
  item_id: string;
  created_at: string;
}

/**
 * Complete user profile with all associated data
 */
export interface UserProfileComplete {
  // Basic profile
  profile: UserProfile;
  
  // Settings and preferences
  display_preferences: UserDisplayPreferences;
  notification_preferences: UserNotificationPreferences;
  privacy_settings: UserPrivacySettings;
  
  // Progress and engagement
  onboarding_state: UserOnboardingState;
  achievements: UserAchievement[];
  stats: UserStats;
  
  // Social
  followers_count: number;
  following_count: number;
  is_following?: boolean; // if viewing another user's profile
  is_follower?: boolean;
  
  // Recent activity
  recent_activity: UserActivity[];
  recent_games: Game[];
  recent_assets: Asset[];
  
  // Favorites
  favorite_games: UserFavorite[];
  favorite_assets: UserFavorite[];
  
  // Computed fields
  member_since: string;
  last_active: string;
  reputation_score: number;
  creator_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * User profile update requests
 */
export interface UserProfileUpdateRequest {
  // Basic info
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  
  // Profile details
  bio?: string;
  location?: string;
  website_url?: string;
  twitter_handle?: string;
  github_username?: string;
  discord_username?: string;
  
  // Preferences
  timezone?: string;
  language_preference?: string;
  use_case?: UserProfile['use_case'];
}

/**
 * User settings update requests
 */
export interface UserSettingsUpdateRequest {
  display_preferences?: Partial<UserDisplayPreferences>;
  notification_preferences?: Partial<UserNotificationPreferences>;
  privacy_settings?: Partial<UserPrivacySettings>;
}

/**
 * User search filters
 */
export interface UserSearchFilters {
  query?: string;
  use_case?: UserProfile['use_case'][];
  creator_level?: ('beginner' | 'intermediate' | 'advanced' | 'expert')[];
  has_published_games?: boolean;
  has_public_assets?: boolean;
  location?: string;
  joined_after?: string;
  joined_before?: string;
  min_reputation_score?: number;
  sort_by?: 'relevance' | 'created_at' | 'reputation_score' | 'games_count' | 'followers_count';
  sort_order?: 'asc' | 'desc';
}

/**
 * User portfolio item for public profile
 */
export interface UserPortfolioItem {
  id: string;
  type: 'game' | 'asset';
  title: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  stats: {
    plays?: number;
    likes?: number;
    downloads?: number;
    forks?: number;
  };
  featured: boolean;
  tags: string[];
}

/**
 * User badge system
 */
export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  color: string;
  category: 'achievement' | 'role' | 'special' | 'subscription';
  requirements?: string;
  earned_at?: string;
  is_visible: boolean;
}

/**
 * User export data (for GDPR compliance)
 */
export interface UserDataExport {
  user_profile: UserProfile;
  settings: {
    display_preferences: UserDisplayPreferences;
    notification_preferences: UserNotificationPreferences;
    privacy_settings: UserPrivacySettings;
  };
  games: Game[];
  assets: Asset[];
  activities: UserActivity[];
  achievements: UserAchievement[];
  connections: {
    followers: UserConnection[];
    following: UserConnection[];
  };
  usage_stats: UserStats;
  export_generated_at: string;
  export_expires_at: string;
}

/**
 * User deletion request
 */
export interface UserDeletionRequest {
  user_id: string;
  reason?: string;
  feedback?: string;
  keep_published_content: boolean;
  transfer_ownership_to?: string; // user ID
  scheduled_for?: string; // date string for delayed deletion
  confirmation_token: string;
}

/**
 * API response types for user operations
 */
export interface UserApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetUserProfileResponse extends UserApiResponse {
  data?: UserProfileComplete;
}

export interface GetUserStatsResponse extends UserApiResponse {
  data?: UserStats;
}

export interface GetUserActivitiesResponse extends UserApiResponse {
  data?: UserActivity[];
}

export interface SearchUsersResponse extends UserApiResponse {
  data?: {
    users: UserProfileComplete[];
    total: number;
    filters: UserSearchFilters;
  };
}

/**
 * User preferences for different contexts
 */
export interface GameEditorPreferences {
  auto_save: boolean;
  auto_save_interval: number;
  show_grid: boolean;
  snap_to_grid: boolean;
  grid_size: number;
  zoom_level: number;
  show_rulers: boolean;
  show_guides: boolean;
  panel_layout: 'default' | 'minimal' | 'custom';
  keyboard_shortcuts: Record<string, string>;
}

export interface AssetManagerPreferences {
  view_mode: 'grid' | 'list';
  sort_by: 'name' | 'date' | 'size' | 'type';
  sort_order: 'asc' | 'desc';
  filter_by_type: boolean;
  group_by_category: boolean;
  show_previews: boolean;
  preview_size: 'small' | 'medium' | 'large';
  auto_tag_uploads: boolean;
}

// Type guards and utility functions
export const isCompleteUserProfile = (profile: any): profile is UserProfileComplete => {
  return profile && 
         'profile' in profile && 
         'display_preferences' in profile && 
         'stats' in profile;
};

export const hasAchievement = (
  achievements: UserAchievement[], 
  achievementId: string
): boolean => {
  return achievements.some(achievement => achievement.id === achievementId);
};

export const calculateCreatorLevel = (stats: UserStats): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  const totalCreations = stats.total_games_created + stats.total_assets_uploaded;
  const totalEngagement = stats.total_plays_received + stats.total_likes_received;
  
  if (totalCreations >= 50 && totalEngagement >= 1000) return 'expert';
  if (totalCreations >= 20 && totalEngagement >= 200) return 'advanced';
  if (totalCreations >= 5 && totalEngagement >= 50) return 'intermediate';
  return 'beginner';
};

export const calculateReputationScore = (stats: UserStats): number => {
  // Simple reputation algorithm - can be enhanced
  const creationScore = (stats.total_games_published * 10) + (stats.total_assets_uploaded * 2);
  const engagementScore = (stats.total_likes_received * 3) + (stats.total_comments_made * 1);
  const communityScore = (stats.total_followers * 5) + (stats.total_games_forked * 2);
  
  return creationScore + engagementScore + communityScore;
};