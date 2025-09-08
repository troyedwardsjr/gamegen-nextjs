/**
 * GameGen Database Types
 *
 * Comprehensive TypeScript type definitions for the GameGen pixel art
 * game creation platform database schema using Supabase.
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
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          use_case:
            | "indie_dev"
            | "student"
            | "hobbyist"
            | "studio"
            | "enterprise";
          subscription_tier: "free" | "pro" | "max" | "enterprise" | null;
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
          // GameGen-specific usage metrics
          total_games_created: number | null;
          total_assets_uploaded: number | null;
          total_ai_generations: number | null;
          total_storage_bytes: number | null;
          monthly_game_limit: number | null;
          monthly_ai_credits: number | null;
          storage_limit_gb: number | null;
          api_key_hash: string | null;
          api_calls_this_month: number | null;
          api_rate_limit: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          use_case?:
            | "indie_dev"
            | "student"
            | "hobbyist"
            | "studio"
            | "enterprise";
          subscription_tier?: "free" | "pro" | "max" | "enterprise" | null;
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
          total_assets_uploaded?: number | null;
          total_ai_generations?: number | null;
          total_storage_bytes?: number | null;
          monthly_game_limit?: number | null;
          monthly_ai_credits?: number | null;
          storage_limit_gb?: number | null;
          api_key_hash?: string | null;
          api_calls_this_month?: number | null;
          api_rate_limit?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          use_case?:
            | "indie_dev"
            | "student"
            | "hobbyist"
            | "studio"
            | "enterprise";
          subscription_tier?: "free" | "pro" | "max" | "enterprise" | null;
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
          total_assets_uploaded?: number | null;
          total_ai_generations?: number | null;
          total_storage_bytes?: number | null;
          monthly_game_limit?: number | null;
          monthly_ai_credits?: number | null;
          storage_limit_gb?: number | null;
          api_key_hash?: string | null;
          api_calls_this_month?: number | null;
          api_rate_limit?: number | null;
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
      games: {
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
            | "puzzle"
            | "platformer";
          genre: string | null;
          target_audience: string | null;
          game_config: Json | null; // Toxoid engine configuration
          script_files: Json | null; // JavaScript game scripts
          asset_manifest: Json | null; // List of used assets
          thumbnail_url: string | null;
          cover_image_url: string | null;
          demo_url: string | null; // Playable demo URL
          export_settings: Json | null;
          status:
            | "draft"
            | "in_development"
            | "completed"
            | "published"
            | "archived"
            | "deleted"
            | null;
          is_public: boolean | null;
          is_template: boolean | null;
          play_count: number | null;
          like_count: number | null;
          fork_count: number | null;
          version: string | null;
          engine_version: string | null; // Toxoid engine version used
          seo_title: string | null;
          seo_description: string | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
          last_worked_on: string | null;
          published_at: string | null;
          archived_at: string | null;
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
            | "puzzle"
            | "platformer";
          genre?: string | null;
          target_audience?: string | null;
          game_config?: Json | null;
          script_files?: Json | null;
          asset_manifest?: Json | null;
          thumbnail_url?: string | null;
          cover_image_url?: string | null;
          demo_url?: string | null;
          export_settings?: Json | null;
          status?:
            | "draft"
            | "in_development"
            | "completed"
            | "published"
            | "archived"
            | "deleted"
            | null;
          is_public?: boolean | null;
          is_template?: boolean | null;
          play_count?: number | null;
          like_count?: number | null;
          fork_count?: number | null;
          version?: string | null;
          engine_version?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_worked_on?: string | null;
          published_at?: string | null;
          archived_at?: string | null;
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
            | "puzzle"
            | "platformer";
          genre?: string | null;
          target_audience?: string | null;
          game_config?: Json | null;
          script_files?: Json | null;
          asset_manifest?: Json | null;
          thumbnail_url?: string | null;
          cover_image_url?: string | null;
          demo_url?: string | null;
          export_settings?: Json | null;
          status?:
            | "draft"
            | "in_development"
            | "completed"
            | "published"
            | "archived"
            | "deleted"
            | null;
          is_public?: boolean | null;
          is_template?: boolean | null;
          play_count?: number | null;
          like_count?: number | null;
          fork_count?: number | null;
          version?: string | null;
          engine_version?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_worked_on?: string | null;
          published_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          asset_type:
            | "sprite"
            | "tileset"
            | "background"
            | "sound"
            | "music"
            | "font"
            | "script";
          category: string | null; // character, environment, ui, etc.
          file_url: string;
          file_path: string;
          filename: string;
          file_size: number | null;
          mime_type: string | null;
          dimensions: Json | null; // {width, height} for images
          pixel_art_metadata: Json | null; // pixel density, color palette, etc.
          tags: string[] | null;
          is_public: boolean | null;
          is_featured: boolean | null;
          download_count: number | null;
          like_count: number | null;
          license_type:
            | "cc0"
            | "cc_by"
            | "cc_by_sa"
            | "proprietary"
            | "custom"
            | null;
          license_details: string | null;
          ai_generated: boolean | null;
          generation_prompt: string | null;
          vector_embedding: string | null; // For AI-powered asset search
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          asset_type:
            | "sprite"
            | "tileset"
            | "background"
            | "sound"
            | "music"
            | "font"
            | "script";
          category?: string | null;
          file_url: string;
          file_path: string;
          filename: string;
          file_size?: number | null;
          mime_type?: string | null;
          dimensions?: Json | null;
          pixel_art_metadata?: Json | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          is_featured?: boolean | null;
          download_count?: number | null;
          like_count?: number | null;
          license_type?:
            | "cc0"
            | "cc_by"
            | "cc_by_sa"
            | "proprietary"
            | "custom"
            | null;
          license_details?: string | null;
          ai_generated?: boolean | null;
          generation_prompt?: string | null;
          vector_embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          asset_type?:
            | "sprite"
            | "tileset"
            | "background"
            | "sound"
            | "music"
            | "font"
            | "script";
          category?: string | null;
          file_url?: string;
          file_path?: string;
          filename?: string;
          file_size?: number | null;
          mime_type?: string | null;
          dimensions?: Json | null;
          pixel_art_metadata?: Json | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          is_featured?: boolean | null;
          download_count?: number | null;
          like_count?: number | null;
          license_type?:
            | "cc0"
            | "cc_by"
            | "cc_by_sa"
            | "proprietary"
            | "custom"
            | null;
          license_details?: string | null;
          ai_generated?: boolean | null;
          generation_prompt?: string | null;
          vector_embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_templates: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          game_type:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "puzzle"
            | "platformer";
          difficulty_level: "beginner" | "intermediate" | "advanced";
          template_config: Json; // Complete game configuration
          preview_assets: Json | null; // Asset previews for template showcase
          thumbnail_url: string | null;
          is_official: boolean | null; // Created by GameGen team
          is_public: boolean | null;
          usage_count: number | null;
          rating: number | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          game_type:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "puzzle"
            | "platformer";
          difficulty_level?: "beginner" | "intermediate" | "advanced";
          template_config: Json;
          preview_assets?: Json | null;
          thumbnail_url?: string | null;
          is_official?: boolean | null;
          is_public?: boolean | null;
          usage_count?: number | null;
          rating?: number | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          game_type?:
            | "bullet_hell"
            | "rpg"
            | "action_adventure"
            | "team_deathmatch"
            | "puzzle"
            | "platformer";
          difficulty_level?: "beginner" | "intermediate" | "advanced";
          template_config?: Json;
          preview_assets?: Json | null;
          thumbnail_url?: string | null;
          is_official?: boolean | null;
          is_public?: boolean | null;
          usage_count?: number | null;
          rating?: number | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          game_id: string | null;
          generation_type:
            | "asset"
            | "code"
            | "game_logic"
            | "level_design"
            | "story"
            | "sound";
          prompt: string;
          ai_model: string; // claude-4-sonnet, etc.
          generation_config: Json | null;
          output_data: Json | null; // Generated content
          output_files: Json | null; // Generated file URLs
          status:
            | "queued"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          error_message: string | null;
          credits_used: number | null;
          processing_time_ms: number | null;
          quality_rating: number | null; // User feedback
          created_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id?: string | null;
          generation_type:
            | "asset"
            | "code"
            | "game_logic"
            | "level_design"
            | "story"
            | "sound";
          prompt: string;
          ai_model: string;
          generation_config?: Json | null;
          output_data?: Json | null;
          output_files?: Json | null;
          status?:
            | "queued"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          error_message?: string | null;
          credits_used?: number | null;
          processing_time_ms?: number | null;
          quality_rating?: number | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string | null;
          generation_type?:
            | "asset"
            | "code"
            | "game_logic"
            | "level_design"
            | "story"
            | "sound";
          prompt?: string;
          ai_model?: string;
          generation_config?: Json | null;
          output_data?: Json | null;
          output_files?: Json | null;
          status?:
            | "queued"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          error_message?: string | null;
          credits_used?: number | null;
          processing_time_ms?: number | null;
          quality_rating?: number | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid";
          plan_id: string;
          current_period_start: string | null;
          current_period_end: string | null;
          ai_credits_included: number;
          ai_credits_used: number;
          game_limit: number;
          storage_limit_gb: number;
          can_export: boolean;
          can_white_label: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid";
          plan_id: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          ai_credits_included: number;
          ai_credits_used?: number;
          game_limit: number;
          storage_limit_gb: number;
          can_export?: boolean;
          can_white_label?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid";
          plan_id?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          ai_credits_included?: number;
          ai_credits_used?: number;
          game_limit?: number;
          storage_limit_gb?: number;
          can_export?: boolean;
          can_white_label?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
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
        | "indie_dev"
        | "student"
        | "hobbyist"
        | "studio"
        | "enterprise";
      subscription_tier: "free" | "pro" | "max" | "enterprise";
      game_type:
        | "bullet_hell"
        | "rpg"
        | "action_adventure"
        | "team_deathmatch"
        | "puzzle"
        | "platformer";
      game_status:
        | "draft"
        | "in_development"
        | "completed"
        | "published"
        | "archived"
        | "deleted";
      asset_type:
        | "sprite"
        | "tileset"
        | "background"
        | "sound"
        | "music"
        | "font"
        | "script";
      license_type: "cc0" | "cc_by" | "cc_by_sa" | "proprietary" | "custom";
      generation_type:
        | "asset"
        | "code"
        | "game_logic"
        | "level_design"
        | "story"
        | "sound";
      generation_status:
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled";
      subscription_status:
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "trialing"
        | "unpaid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier table access
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

// Commonly used table row types for GameGen
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type GameTemplate =
  Database["public"]["Tables"]["game_templates"]["Row"];
export type AIGeneration =
  Database["public"]["Tables"]["ai_generations"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

// Insert types for creating new records
export type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
export type GameTemplateInsert =
  Database["public"]["Tables"]["game_templates"]["Insert"];
export type AIGenerationInsert =
  Database["public"]["Tables"]["ai_generations"]["Insert"];
export type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];

// Update types for modifying existing records
export type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];
export type AssetUpdate = Database["public"]["Tables"]["assets"]["Update"];
export type GameTemplateUpdate =
  Database["public"]["Tables"]["game_templates"]["Update"];
export type AIGenerationUpdate =
  Database["public"]["Tables"]["ai_generations"]["Update"];
export type SubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];
