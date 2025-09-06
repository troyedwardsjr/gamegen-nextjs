/**
 * GameGen Database Schema Configuration
 * Defines the database structure and types for the GameGen application
 * Based on Supabase PostgreSQL with real-time subscriptions
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          use_case: 
            | "indie_developer"
            | "student" 
            | "hobbyist"
            | "game_studio"
            | "educator"
            | "streamer";
          subscription_tier:
            | "free"
            | "pro"
            | "max"
            | null;
          subscription_status: string | null;
          subscription_period_start: string | null;
          subscription_period_end: string | null;
          stripe_customer_id: string | null;
          timezone: string | null;
          language_preference: string | null;
          theme_preference: string | null;
          notification_preferences: Json | null;
          onboarding_completed: boolean | null;
          onboarding_step: number | null;
          is_active: boolean | null;
          last_active_at: string | null;
          total_games_created: number | null;
          total_assets_created: number | null;
          total_playtime_hours: number | null;
          credits_remaining: number | null;
          monthly_credits_limit: number | null;
          api_key_hash: string | null;
          api_calls_this_month: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          use_case?: 
            | "indie_developer"
            | "student" 
            | "hobbyist"
            | "game_studio"
            | "educator"
            | "streamer";
          subscription_tier?:
            | "free"
            | "pro"
            | "max"
            | null;
          subscription_status?: string | null;
          subscription_period_start?: string | null;
          subscription_period_end?: string | null;
          stripe_customer_id?: string | null;
          timezone?: string | null;
          language_preference?: string | null;
          theme_preference?: string | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          is_active?: boolean | null;
          last_active_at?: string | null;
          total_games_created?: number | null;
          total_assets_created?: number | null;
          total_playtime_hours?: number | null;
          credits_remaining?: number | null;
          monthly_credits_limit?: number | null;
          api_key_hash?: string | null;
          api_calls_this_month?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          use_case?: 
            | "indie_developer"
            | "student" 
            | "hobbyist"
            | "game_studio"
            | "educator"
            | "streamer";
          subscription_tier?:
            | "free"
            | "pro"
            | "max"
            | null;
          subscription_status?: string | null;
          subscription_period_start?: string | null;
          subscription_period_end?: string | null;
          stripe_customer_id?: string | null;
          timezone?: string | null;
          language_preference?: string | null;
          theme_preference?: string | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          is_active?: boolean | null;
          last_active_at?: string | null;
          total_games_created?: number | null;
          total_assets_created?: number | null;
          total_playtime_hours?: number | null;
          credits_remaining?: number | null;
          monthly_credits_limit?: number | null;
          api_key_hash?: string | null;
          api_calls_this_month?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      game_projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          slug: string;
          game_type:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "platformer"
            | "puzzle"
            | "racing"
            | "strategy"
            | "simulation"
            | "other";
          genre_tags: string[] | null;
          target_audience: string | null;
          difficulty_level: "beginner" | "intermediate" | "advanced" | null;
          estimated_playtime_minutes: number | null;
          game_config: Json | null;
          source_code: Json | null;
          compiled_game_url: string | null;
          thumbnail_url: string | null;
          screenshots: string[] | null;
          status:
            | "draft"
            | "in_development"
            | "testing"
            | "published"
            | "archived"
            | "deleted"
            | null;
          visibility: "private" | "unlisted" | "public" | null;
          is_template: boolean | null;
          template_category: string | null;
          play_count: number | null;
          like_count: number | null;
          comment_count: number | null;
          rating_average: number | null;
          rating_count: number | null;
          featured_at: string | null;
          published_at: string | null;
          last_played_at: string | null;
          version: number | null;
          toxoid_version: string | null;
          build_status: "pending" | "building" | "success" | "failed" | null;
          build_log: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          slug: string;
          game_type:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "platformer"
            | "puzzle"
            | "racing"
            | "strategy"
            | "simulation"
            | "other";
          genre_tags?: string[] | null;
          target_audience?: string | null;
          difficulty_level?: "beginner" | "intermediate" | "advanced" | null;
          estimated_playtime_minutes?: number | null;
          game_config?: Json | null;
          source_code?: Json | null;
          compiled_game_url?: string | null;
          thumbnail_url?: string | null;
          screenshots?: string[] | null;
          status?:
            | "draft"
            | "in_development"
            | "testing"
            | "published"
            | "archived"
            | "deleted"
            | null;
          visibility?: "private" | "unlisted" | "public" | null;
          is_template?: boolean | null;
          template_category?: string | null;
          play_count?: number | null;
          like_count?: number | null;
          comment_count?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          featured_at?: string | null;
          published_at?: string | null;
          last_played_at?: string | null;
          version?: number | null;
          toxoid_version?: string | null;
          build_status?: "pending" | "building" | "success" | "failed" | null;
          build_log?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          slug?: string;
          game_type?:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "platformer"
            | "puzzle"
            | "racing"
            | "strategy"
            | "simulation"
            | "other";
          genre_tags?: string[] | null;
          target_audience?: string | null;
          difficulty_level?: "beginner" | "intermediate" | "advanced" | null;
          estimated_playtime_minutes?: number | null;
          game_config?: Json | null;
          source_code?: Json | null;
          compiled_game_url?: string | null;
          thumbnail_url?: string | null;
          screenshots?: string[] | null;
          status?:
            | "draft"
            | "in_development"
            | "testing"
            | "published"
            | "archived"
            | "deleted"
            | null;
          visibility?: "private" | "unlisted" | "public" | null;
          is_template?: boolean | null;
          template_category?: string | null;
          play_count?: number | null;
          like_count?: number | null;
          comment_count?: number | null;
          rating_average?: number | null;
          rating_count?: number | null;
          featured_at?: string | null;
          published_at?: string | null;
          last_played_at?: string | null;
          version?: number | null;
          toxoid_version?: string | null;
          build_status?: "pending" | "building" | "success" | "failed" | null;
          build_log?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_assets: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          name: string;
          description: string | null;
          asset_type: 
            | "sprite"
            | "tileset"
            | "background"
            | "audio"
            | "script"
            | "animation"
            | "font"
            | "shader"
            | "other";
          file_path: string;
          file_size: number | null;
          file_format: string | null;
          dimensions: Json | null; // {width: number, height: number}
          metadata: Json | null;
          tags: string[] | null;
          is_public: boolean | null;
          is_featured: boolean | null;
          download_count: number | null;
          like_count: number | null;
          thumbnail_url: string | null;
          license_type: "public_domain" | "cc0" | "cc_by" | "custom" | "proprietary" | null;
          attribution_required: boolean | null;
          attribution_text: string | null;
          price: number | null; // Credits cost for premium assets
          ai_generated: boolean | null;
          ai_prompt: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          name: string;
          description?: string | null;
          asset_type: 
            | "sprite"
            | "tileset"
            | "background"
            | "audio"
            | "script"
            | "animation"
            | "font"
            | "shader"
            | "other";
          file_path: string;
          file_size?: number | null;
          file_format?: string | null;
          dimensions?: Json | null;
          metadata?: Json | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          is_featured?: boolean | null;
          download_count?: number | null;
          like_count?: number | null;
          thumbnail_url?: string | null;
          license_type?: "public_domain" | "cc0" | "cc_by" | "custom" | "proprietary" | null;
          attribution_required?: boolean | null;
          attribution_text?: string | null;
          price?: number | null;
          ai_generated?: boolean | null;
          ai_prompt?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          name?: string;
          description?: string | null;
          asset_type?: 
            | "sprite"
            | "tileset"
            | "background"
            | "audio"
            | "script"
            | "animation"
            | "font"
            | "shader"
            | "other";
          file_path?: string;
          file_size?: number | null;
          file_format?: string | null;
          dimensions?: Json | null;
          metadata?: Json | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          is_featured?: boolean | null;
          download_count?: number | null;
          like_count?: number | null;
          thumbnail_url?: string | null;
          license_type?: "public_domain" | "cc0" | "cc_by" | "custom" | "proprietary" | null;
          attribution_required?: boolean | null;
          attribution_text?: string | null;
          price?: number | null;
          ai_generated?: boolean | null;
          ai_prompt?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_assets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_assets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "game_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string | null;
          context_type: "game_creation" | "asset_generation" | "code_help" | "general" | null;
          model_config: Json | null;
          total_messages: number | null;
          total_tokens_used: number | null;
          credits_used: number | null;
          status: "active" | "archived" | "deleted" | null;
          last_message_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title?: string | null;
          context_type?: "game_creation" | "asset_generation" | "code_help" | "general" | null;
          model_config?: Json | null;
          total_messages?: number | null;
          total_tokens_used?: number | null;
          credits_used?: number | null;
          status?: "active" | "archived" | "deleted" | null;
          last_message_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string | null;
          context_type?: "game_creation" | "asset_generation" | "code_help" | "general" | null;
          model_config?: Json | null;
          total_messages?: number | null;
          total_tokens_used?: number | null;
          credits_used?: number | null;
          status?: "active" | "archived" | "deleted" | null;
          last_message_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_sessions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "game_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json | null;
          tokens_used: number | null;
          response_time_ms: number | null;
          model_version: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json | null;
          tokens_used?: number | null;
          response_time_ms?: number | null;
          model_version?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: Json | null;
          tokens_used?: number | null;
          response_time_ms?: number | null;
          model_version?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_analytics: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          event_type: string;
          event_category: 
            | "authentication"
            | "game_creation"
            | "asset_management" 
            | "ai_interaction"
            | "billing"
            | "social"
            | "performance";
          event_data: Json | null;
          timestamp: string | null;
          user_agent: string | null;
          ip_address: string | null;
          page_url: string | null;
          referrer: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_type: string;
          event_category: 
            | "authentication"
            | "game_creation"
            | "asset_management" 
            | "ai_interaction"
            | "billing"
            | "social"
            | "performance";
          event_data?: Json | null;
          timestamp?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          page_url?: string | null;
          referrer?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_type?: string;
          event_category?: 
            | "authentication"
            | "game_creation"
            | "asset_management" 
            | "ai_interaction"
            | "billing"
            | "social"
            | "performance";
          event_data?: Json | null;
          timestamp?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          page_url?: string | null;
          referrer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_use_case:
        | "indie_developer"
        | "student" 
        | "hobbyist"
        | "game_studio"
        | "educator"
        | "streamer";
      subscription_tier: "free" | "pro" | "max";
      game_type:
        | "bullet_hell"
        | "rpg"
        | "action_adventure"
        | "team_deathmatch"
        | "platformer"
        | "puzzle"
        | "racing"
        | "strategy"
        | "simulation"
        | "other";
      game_status: "draft" | "in_development" | "testing" | "published" | "archived" | "deleted";
      asset_type: "sprite" | "tileset" | "background" | "audio" | "script" | "animation" | "font" | "shader" | "other";
      visibility: "private" | "unlisted" | "public";
      build_status: "pending" | "building" | "success" | "failed";
      chat_role: "user" | "assistant" | "system";
      event_category:
        | "authentication"
        | "game_creation"
        | "asset_management" 
        | "ai_interaction"
        | "billing"
        | "social"
        | "performance";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper type extractors
export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;

// GameGen-specific type aliases
export type UserProfile = Tables<"user_profiles">;
export type GameProject = Tables<"game_projects">;
export type GameAsset = Tables<"game_assets">;
export type ChatSession = Tables<"chat_sessions">;
export type ChatMessage = Tables<"chat_messages">;
export type UsageAnalytics = Tables<"usage_analytics">;

// Insert and Update types
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;
export type GameProjectInsert = TablesInsert<"game_projects">;
export type GameProjectUpdate = TablesUpdate<"game_projects">;
export type GameAssetInsert = TablesInsert<"game_assets">;
export type GameAssetUpdate = TablesUpdate<"game_assets">;

// Enum types
export type UserUseCase = Enums<"user_use_case">;
export type SubscriptionTier = Enums<"subscription_tier">;
export type GameType = Enums<"game_type">;
export type GameStatus = Enums<"game_status">;
export type AssetType = Enums<"asset_type">;
export type Visibility = Enums<"visibility">;
export type EventCategory = Enums<"event_category">;

// Database configuration constants
export const DB_CONFIG = {
  maxConnections: 20,
  idleTimeoutSeconds: 60,
  realtimeEnabled: true,
  logQueries: process.env.NODE_ENV === 'development',
  tables: {
    userProfiles: 'user_profiles',
    gameProjects: 'game_projects', 
    gameAssets: 'game_assets',
    chatSessions: 'chat_sessions',
    chatMessages: 'chat_messages',
    usageAnalytics: 'usage_analytics',
  },
  buckets: {
    gameAssets: 'game-assets',
    userAvatars: 'user-avatars',
    gameScreenshots: 'game-screenshots',
    gameThumbnails: 'game-thumbnails',
  },
} as const;