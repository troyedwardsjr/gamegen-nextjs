export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          website_url: string | null;
          social_links: Json;
          subscription_tier: "free" | "pro" | "max" | "educational";
          subscription_status: "active" | "cancelled" | "expired" | "trialing";
          subscription_ends_at: string | null;
          stripe_customer_id: string | null;
          credits_remaining: number;
          credits_used_today: number;
          credits_reset_date: string;
          preferences: Json;
          is_verified: boolean;
          is_educator: boolean;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          social_links?: Json;
          subscription_tier?: "free" | "pro" | "max" | "educational";
          subscription_status?: "active" | "cancelled" | "expired" | "trialing";
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          credits_remaining?: number;
          credits_used_today?: number;
          credits_reset_date?: string;
          preferences?: Json;
          is_verified?: boolean;
          is_educator?: boolean;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          social_links?: Json;
          subscription_tier?: "free" | "pro" | "max" | "educational";
          subscription_status?: "active" | "cancelled" | "expired" | "trialing";
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          credits_remaining?: number;
          credits_used_today?: number;
          credits_reset_date?: string;
          preferences?: Json;
          is_verified?: boolean;
          is_educator?: boolean;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          session_start: string;
          session_end: string | null;
          ip_address: unknown | null;
          user_agent: string | null;
          platform: string | null;
          activities: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_start?: string;
          session_end?: string | null;
          ip_address?: unknown | null;
          user_agent?: string | null;
          platform?: string | null;
          activities?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_start?: string;
          session_end?: string | null;
          ip_address?: unknown | null;
          user_agent?: string | null;
          platform?: string | null;
          activities?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          tags: string[];
          genre:
            | "platformer"
            | "shooter"
            | "puzzle"
            | "rpg"
            | "racing"
            | "strategy"
            | "casual"
            | "educational"
            | null;
          game_data: Json;
          thumbnail_url: string | null;
          screenshot_urls: string[];
          generation_prompt: string | null;
          generation_metadata: Json;
          visibility: "private" | "unlisted" | "public" | "educational";
          is_template: boolean;
          is_featured: boolean;
          published_at: string | null;
          play_count: number;
          like_count: number;
          fork_count: number;
          forked_from: string | null;
          template_id: string | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          tags?: string[];
          genre?:
            | "platformer"
            | "shooter"
            | "puzzle"
            | "rpg"
            | "racing"
            | "strategy"
            | "casual"
            | "educational"
            | null;
          game_data?: Json;
          thumbnail_url?: string | null;
          screenshot_urls?: string[];
          generation_prompt?: string | null;
          generation_metadata?: Json;
          visibility?: "private" | "unlisted" | "public" | "educational";
          is_template?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          play_count?: number;
          like_count?: number;
          fork_count?: number;
          forked_from?: string | null;
          template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          tags?: string[];
          genre?:
            | "platformer"
            | "shooter"
            | "puzzle"
            | "rpg"
            | "racing"
            | "strategy"
            | "casual"
            | "educational"
            | null;
          game_data?: Json;
          thumbnail_url?: string | null;
          screenshot_urls?: string[];
          generation_prompt?: string | null;
          generation_metadata?: Json;
          visibility?: "private" | "unlisted" | "public" | "educational";
          is_template?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          play_count?: number;
          like_count?: number;
          fork_count?: number;
          forked_from?: string | null;
          template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_forked_from_fkey";
            columns: ["forked_from"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_versions: {
        Row: {
          id: string;
          game_id: string;
          version_number: number;
          creator_id: string;
          game_data: Json;
          change_summary: string | null;
          is_major_version: boolean;
          parent_version_id: string | null;
          merge_parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          version_number: number;
          creator_id: string;
          game_data: Json;
          change_summary?: string | null;
          is_major_version?: boolean;
          parent_version_id?: string | null;
          merge_parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          version_number?: number;
          creator_id?: string;
          game_data?: Json;
          change_summary?: string | null;
          is_major_version?: boolean;
          parent_version_id?: string | null;
          merge_parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_versions_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_versions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_versions_merge_parent_id_fkey";
            columns: ["merge_parent_id"];
            isOneToOne: false;
            referencedRelation: "game_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_versions_parent_version_id_fkey";
            columns: ["parent_version_id"];
            isOneToOne: false;
            referencedRelation: "game_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      collaboration_sessions: {
        Row: {
          id: string;
          game_id: string;
          host_user_id: string;
          max_participants: number;
          allow_anonymous: boolean;
          participants: Json;
          active_locks: Json;
          started_at: string;
          last_activity: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          host_user_id: string;
          max_participants?: number;
          allow_anonymous?: boolean;
          participants?: Json;
          active_locks?: Json;
          started_at?: string;
          last_activity?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          host_user_id?: string;
          max_participants?: number;
          allow_anonymous?: boolean;
          participants?: Json;
          active_locks?: Json;
          started_at?: string;
          last_activity?: string;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collaboration_sessions_host_user_id_fkey";
            columns: ["host_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_assets: {
        Row: {
          id: string;
          game_id: string | null;
          creator_id: string;
          name: string;
          asset_type:
            | "sprite"
            | "audio"
            | "texture"
            | "animation"
            | "font"
            | "data";
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          properties: Json;
          generated_by_ai: boolean;
          generation_prompt: string | null;
          generation_model: string | null;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id?: string | null;
          creator_id: string;
          name: string;
          asset_type:
            | "sprite"
            | "audio"
            | "texture"
            | "animation"
            | "font"
            | "data";
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          properties?: Json;
          generated_by_ai?: boolean;
          generation_prompt?: string | null;
          generation_model?: string | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string | null;
          creator_id?: string;
          name?: string;
          asset_type?:
            | "sprite"
            | "audio"
            | "texture"
            | "animation"
            | "font"
            | "data";
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          properties?: Json;
          generated_by_ai?: boolean;
          generation_prompt?: string | null;
          generation_model?: string | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_assets_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_assets_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_scripts: {
        Row: {
          id: string;
          game_id: string;
          creator_id: string;
          name: string;
          script_type:
            | "system"
            | "component"
            | "observer"
            | "behavior"
            | "initialization";
          description: string | null;
          javascript_code: string;
          source_hash: string;
          toxoid_metadata: Json;
          generated_by_ai: boolean;
          generation_prompt: string | null;
          generation_model: string | null;
          rag_context_used: Json;
          is_active: boolean;
          execution_order: number;
          dependencies: string[];
          validation_status: "pending" | "valid" | "invalid" | "warning";
          validation_errors: Json;
          security_analysis: Json;
          average_execution_time: number;
          memory_usage_peak: number;
          error_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          creator_id: string;
          name: string;
          script_type:
            | "system"
            | "component"
            | "observer"
            | "behavior"
            | "initialization";
          description?: string | null;
          javascript_code: string;
          source_hash: string;
          toxoid_metadata?: Json;
          generated_by_ai?: boolean;
          generation_prompt?: string | null;
          generation_model?: string | null;
          rag_context_used?: Json;
          is_active?: boolean;
          execution_order?: number;
          dependencies?: string[];
          validation_status?: "pending" | "valid" | "invalid" | "warning";
          validation_errors?: Json;
          security_analysis?: Json;
          average_execution_time?: number;
          memory_usage_peak?: number;
          error_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          creator_id?: string;
          name?: string;
          script_type?:
            | "system"
            | "component"
            | "observer"
            | "behavior"
            | "initialization";
          description?: string | null;
          javascript_code?: string;
          source_hash?: string;
          toxoid_metadata?: Json;
          generated_by_ai?: boolean;
          generation_prompt?: string | null;
          generation_model?: string | null;
          rag_context_used?: Json;
          is_active?: boolean;
          execution_order?: number;
          dependencies?: string[];
          validation_status?: "pending" | "valid" | "invalid" | "warning";
          validation_errors?: Json;
          security_analysis?: Json;
          average_execution_time?: number;
          memory_usage_peak?: number;
          error_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_scripts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_scripts_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      script_execution_logs: {
        Row: {
          id: string;
          script_id: string;
          game_id: string;
          user_id: string | null;
          execution_start: string;
          execution_duration: number | null;
          execution_phase:
            | "initialization"
            | "pre_update"
            | "update"
            | "post_update"
            | null;
          success: boolean;
          error_message: string | null;
          console_output: string | null;
          memory_used: number | null;
          entities_processed: number;
          execution_context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          script_id: string;
          game_id: string;
          user_id?: string | null;
          execution_start: string;
          execution_duration?: number | null;
          execution_phase?:
            | "initialization"
            | "pre_update"
            | "update"
            | "post_update"
            | null;
          success: boolean;
          error_message?: string | null;
          console_output?: string | null;
          memory_used?: number | null;
          entities_processed?: number;
          execution_context?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          script_id?: string;
          game_id?: string;
          user_id?: string | null;
          execution_start?: string;
          execution_duration?: number | null;
          execution_phase?:
            | "initialization"
            | "pre_update"
            | "update"
            | "post_update"
            | null;
          success?: boolean;
          error_message?: string | null;
          console_output?: string | null;
          memory_used?: number | null;
          entities_processed?: number;
          execution_context?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "script_execution_logs_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "script_execution_logs_script_id_fkey";
            columns: ["script_id"];
            isOneToOne: false;
            referencedRelation: "game_scripts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "script_execution_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      script_versions: {
        Row: {
          id: string;
          script_id: string;
          version_number: number;
          creator_id: string;
          javascript_code: string;
          source_hash: string;
          change_summary: string | null;
          toxoid_metadata: Json;
          validation_status: string;
          performance_diff: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          script_id: string;
          version_number: number;
          creator_id: string;
          javascript_code: string;
          source_hash: string;
          change_summary?: string | null;
          toxoid_metadata: Json;
          validation_status: string;
          performance_diff?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          script_id?: string;
          version_number?: number;
          creator_id?: string;
          javascript_code?: string;
          source_hash?: string;
          change_summary?: string | null;
          toxoid_metadata?: Json;
          validation_status?: string;
          performance_diff?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "script_versions_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "script_versions_script_id_fkey";
            columns: ["script_id"];
            isOneToOne: false;
            referencedRelation: "game_scripts";
            referencedColumns: ["id"];
          },
        ];
      };
      community_assets: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          asset_type: string;
          tags: string[];
          file_path: string;
          preview_path: string | null;
          file_size: number | null;
          license: "cc_by" | "cc_by_sa" | "cc0" | "custom" | "commercial";
          license_details: string | null;
          price: number;
          download_count: number;
          rating: number | null;
          rating_count: number;
          status: "pending" | "approved" | "rejected" | "featured";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          description?: string | null;
          asset_type: string;
          tags?: string[];
          file_path: string;
          preview_path?: string | null;
          file_size?: number | null;
          license?: "cc_by" | "cc_by_sa" | "cc0" | "custom" | "commercial";
          license_details?: string | null;
          price?: number;
          download_count?: number;
          rating?: number | null;
          rating_count?: number;
          status?: "pending" | "approved" | "rejected" | "featured";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          description?: string | null;
          asset_type?: string;
          tags?: string[];
          file_path?: string;
          preview_path?: string | null;
          file_size?: number | null;
          license?: "cc_by" | "cc_by_sa" | "cc0" | "custom" | "commercial";
          license_details?: string | null;
          price?: number;
          download_count?: number;
          rating?: number | null;
          rating_count?: number;
          status?: "pending" | "approved" | "rejected" | "featured";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_assets_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_assets_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_likes: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_likes_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_comments: {
        Row: {
          id: string;
          game_id: string;
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          is_edited: boolean;
          is_deleted: boolean;
          is_flagged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          is_edited?: boolean;
          is_deleted?: boolean;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          is_edited?: boolean;
          is_deleted?: boolean;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_comments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "game_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          is_collaborative: boolean;
          game_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          is_collaborative?: boolean;
          game_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          is_collaborative?: boolean;
          game_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_games: {
        Row: {
          id: string;
          collection_id: string;
          game_id: string;
          added_by: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          game_id: string;
          added_by: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          game_id?: string;
          added_by?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_games_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_games_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_games_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      play_sessions: {
        Row: {
          id: string;
          game_id: string;
          player_id: string | null;
          session_duration: number | null;
          completion_percentage: number | null;
          final_score: number | null;
          levels_completed: number;
          platform: "web" | "desktop" | "mobile" | null;
          device_info: Json;
          referrer: string | null;
          events: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id?: string | null;
          session_duration?: number | null;
          completion_percentage?: number | null;
          final_score?: number | null;
          levels_completed?: number;
          platform?: "web" | "desktop" | "mobile" | null;
          device_info?: Json;
          referrer?: string | null;
          events?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_id?: string | null;
          session_duration?: number | null;
          completion_percentage?: number | null;
          final_score?: number | null;
          levels_completed?: number;
          platform?: "web" | "desktop" | "mobile" | null;
          device_info?: Json;
          referrer?: string | null;
          events?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "play_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "play_sessions_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_analytics: {
        Row: {
          id: string;
          creator_id: string;
          date: string;
          games_created: number;
          assets_generated: number;
          credits_used: number;
          total_plays: number;
          new_followers: number;
          likes_received: number;
          comments_received: number;
          games_forked: number;
        };
        Insert: {
          id?: string;
          creator_id: string;
          date: string;
          games_created?: number;
          assets_generated?: number;
          credits_used?: number;
          total_plays?: number;
          new_followers?: number;
          likes_received?: number;
          comments_received?: number;
          games_forked?: number;
        };
        Update: {
          id?: string;
          creator_id?: string;
          date?: string;
          games_created?: number;
          assets_generated?: number;
          credits_used?: number;
          total_plays?: number;
          new_followers?: number;
          likes_received?: number;
          comments_received?: number;
          games_forked?: number;
        };
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          generation_type: "game" | "asset" | "code" | "audio";
          prompt: string;
          model_used: string;
          success: boolean;
          generation_time: number | null;
          credits_consumed: number;
          output_data: Json | null;
          game_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generation_type: "game" | "asset" | "code" | "audio";
          prompt: string;
          model_used: string;
          success: boolean;
          generation_time?: number | null;
          credits_consumed: number;
          output_data?: Json | null;
          game_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          generation_type?: "game" | "asset" | "code" | "audio";
          prompt?: string;
          model_used?: string;
          success?: boolean;
          generation_time?: number | null;
          credits_consumed?: number;
          output_data?: Json | null;
          game_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          id: string;
          creator_id: string;
          game_id: string;
          name: string;
          description: string | null;
          category:
            | "educational"
            | "commercial"
            | "entertainment"
            | "tutorial"
            | null;
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          price: number;
          currency: string;
          download_count: number;
          rating: number | null;
          rating_count: number;
          status: "draft" | "pending" | "approved" | "rejected" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          game_id: string;
          name: string;
          description?: string | null;
          category?:
            | "educational"
            | "commercial"
            | "entertainment"
            | "tutorial"
            | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          price?: number;
          currency?: string;
          download_count?: number;
          rating?: number | null;
          rating_count?: number;
          status?: "draft" | "pending" | "approved" | "rejected" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          game_id?: string;
          name?: string;
          description?: string | null;
          category?:
            | "educational"
            | "commercial"
            | "entertainment"
            | "tutorial"
            | null;
          difficulty?: "beginner" | "intermediate" | "advanced" | null;
          price?: number;
          currency?: string;
          download_count?: number;
          rating?: number | null;
          rating_count?: number;
          status?: "draft" | "pending" | "approved" | "rejected" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "templates_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          buyer_id: string;
          item_type: "template" | "asset_pack" | "credits" | "subscription";
          item_id: string | null;
          quantity: number;
          amount: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          item_type: "template" | "asset_pack" | "credits" | "subscription";
          item_id?: string | null;
          quantity?: number;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          item_type?: "template" | "asset_pack" | "credits" | "subscription";
          item_id?: string | null;
          quantity?: number;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_earnings: {
        Row: {
          id: string;
          creator_id: string;
          purchase_id: string;
          gross_amount: number;
          platform_fee: number;
          net_amount: number;
          payout_status: "pending" | "processing" | "paid" | "failed";
          payout_date: string | null;
          payout_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          purchase_id: string;
          gross_amount: number;
          platform_fee: number;
          net_amount: number;
          payout_status?: "pending" | "processing" | "paid" | "failed";
          payout_date?: string | null;
          payout_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          purchase_id?: string;
          gross_amount?: number;
          platform_fee?: number;
          net_amount?: number;
          payout_status?: "pending" | "processing" | "paid" | "failed";
          payout_date?: string | null;
          payout_reference?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creator_earnings_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
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
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Type helpers
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
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

// Convenience types
export type Profile = Tables<"profiles">;
export type Game = Tables<"games">;
export type GameAsset = Tables<"game_assets">;
export type GameScript = Tables<"game_scripts">;
export type User = Profile;
export type GameComment = Tables<"game_comments">;
export type Collection = Tables<"collections">;
export type PlaySession = Tables<"play_sessions">;
