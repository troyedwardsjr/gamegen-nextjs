export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string | null
          credits_consumed: number
          game_id: string | null
          generation_time: number | null
          generation_type: string
          id: string
          model_used: string
          output_data: Json | null
          prompt: string
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_consumed: number
          game_id?: string | null
          generation_time?: number | null
          generation_type: string
          id?: string
          model_used: string
          output_data?: Json | null
          prompt: string
          success: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_consumed?: number
          game_id?: string | null
          generation_time?: number | null
          generation_type?: string
          id?: string
          model_used?: string
          output_data?: Json | null
          prompt?: string
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_embeddings: {
        Row: {
          asset_id: string
          asset_source: string
          id: string
          style_embedding: string | null
          updated_at: string | null
          visual_embedding: string | null
        }
        Insert: {
          asset_id: string
          asset_source: string
          id?: string
          style_embedding?: string | null
          updated_at?: string | null
          visual_embedding?: string | null
        }
        Update: {
          asset_id?: string
          asset_source?: string
          id?: string
          style_embedding?: string | null
          updated_at?: string | null
          visual_embedding?: string | null
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          completion_tokens: number | null
          content: string
          cost_cents: number | null
          created_at: string | null
          delivered_at: string | null
          edit_history: Json | null
          id: string
          is_edited: boolean | null
          is_favorite: boolean | null
          is_streaming: boolean | null
          message_type: string
          metadata: Json | null
          model_used: string | null
          parent_message_id: string | null
          prompt_tokens: number | null
          provider_id: string | null
          raw_content: string | null
          sequence_number: number
          session_id: string
          status: string
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          completion_tokens?: number | null
          content: string
          cost_cents?: number | null
          created_at?: string | null
          delivered_at?: string | null
          edit_history?: Json | null
          id?: string
          is_edited?: boolean | null
          is_favorite?: boolean | null
          is_streaming?: boolean | null
          message_type: string
          metadata?: Json | null
          model_used?: string | null
          parent_message_id?: string | null
          prompt_tokens?: number | null
          provider_id?: string | null
          raw_content?: string | null
          sequence_number?: number
          session_id: string
          status?: string
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          completion_tokens?: number | null
          content?: string
          cost_cents?: number | null
          created_at?: string | null
          delivered_at?: string | null
          edit_history?: Json | null
          id?: string
          is_edited?: boolean | null
          is_favorite?: boolean | null
          is_streaming?: boolean | null
          message_type?: string
          metadata?: Json | null
          model_used?: string | null
          parent_message_id?: string | null
          prompt_tokens?: number | null
          provider_id?: string | null
          raw_content?: string | null
          sequence_number?: number
          session_id?: string
          status?: string
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_prompt_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          prompt_text: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          prompt_text: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          prompt_text?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          archived_at: string | null
          context_type: string
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          settings: Json | null
          status: string
          title: string
          total_cost_cents: number | null
          total_messages: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          context_type?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          settings?: Json | null
          status?: string
          title?: string
          total_cost_cents?: number | null
          total_messages?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          context_type?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          settings?: Json | null
          status?: string
          title?: string
          total_cost_cents?: number | null
          total_messages?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          active_locks: Json | null
          allow_anonymous: boolean | null
          ended_at: string | null
          game_id: string
          host_user_id: string
          id: string
          last_activity: string | null
          max_participants: number | null
          participants: Json | null
          started_at: string | null
        }
        Insert: {
          active_locks?: Json | null
          allow_anonymous?: boolean | null
          ended_at?: string | null
          game_id: string
          host_user_id: string
          id?: string
          last_activity?: string | null
          max_participants?: number | null
          participants?: Json | null
          started_at?: string | null
        }
        Update: {
          active_locks?: Json | null
          allow_anonymous?: boolean | null
          ended_at?: string | null
          game_id?: string
          host_user_id?: string
          id?: string
          last_activity?: string | null
          max_participants?: number | null
          participants?: Json | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_sessions_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_games: {
        Row: {
          added_by: string
          collection_id: string
          created_at: string | null
          game_id: string
          id: string
          order_index: number | null
        }
        Insert: {
          added_by: string
          collection_id: string
          created_at?: string | null
          game_id: string
          id?: string
          order_index?: number | null
        }
        Update: {
          added_by?: string
          collection_id?: string
          created_at?: string | null
          game_id?: string
          id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_games_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_games_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          game_count: number | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          game_count?: number | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          game_count?: number | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          creator_id: string
          description: string | null
          download_count: number | null
          file_path: string
          file_size: number | null
          id: string
          license: string | null
          license_details: string | null
          name: string
          preview_path: string | null
          price: number | null
          rating: number | null
          rating_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          download_count?: number | null
          file_path: string
          file_size?: number | null
          id?: string
          license?: string | null
          license_details?: string | null
          name: string
          preview_path?: string | null
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          download_count?: number | null
          file_path?: string
          file_size?: number | null
          id?: string
          license?: string | null
          license_details?: string | null
          name?: string
          preview_path?: string | null
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_assets_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_analytics: {
        Row: {
          assets_generated: number | null
          comments_received: number | null
          creator_id: string
          credits_used: number | null
          date: string
          games_created: number | null
          games_forked: number | null
          id: string
          likes_received: number | null
          new_followers: number | null
          total_plays: number | null
        }
        Insert: {
          assets_generated?: number | null
          comments_received?: number | null
          creator_id: string
          credits_used?: number | null
          date: string
          games_created?: number | null
          games_forked?: number | null
          id?: string
          likes_received?: number | null
          new_followers?: number | null
          total_plays?: number | null
        }
        Update: {
          assets_generated?: number | null
          comments_received?: number | null
          creator_id?: string
          credits_used?: number | null
          date?: string
          games_created?: number | null
          games_forked?: number | null
          id?: string
          likes_received?: number | null
          new_followers?: number | null
          total_plays?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          created_at: string | null
          creator_id: string
          gross_amount: number
          id: string
          net_amount: number
          payout_date: string | null
          payout_reference: string | null
          payout_status: string | null
          platform_fee: number
          purchase_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          gross_amount: number
          id?: string
          net_amount: number
          payout_date?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          platform_fee: number
          purchase_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          payout_date?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          platform_fee?: number
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      export_analytics: {
        Row: {
          build_success: boolean | null
          build_time_seconds: number | null
          cpu_usage_percent: number | null
          created_at: string | null
          disk_usage_mb: number | null
          export_job_id: string
          id: string
          memory_usage_mb: number | null
          platform_metrics: Json | null
          quality_score: number | null
          queue_wait_time_seconds: number | null
          test_results: Json | null
          total_time_seconds: number | null
        }
        Insert: {
          build_success?: boolean | null
          build_time_seconds?: number | null
          cpu_usage_percent?: number | null
          created_at?: string | null
          disk_usage_mb?: number | null
          export_job_id: string
          id?: string
          memory_usage_mb?: number | null
          platform_metrics?: Json | null
          quality_score?: number | null
          queue_wait_time_seconds?: number | null
          test_results?: Json | null
          total_time_seconds?: number | null
        }
        Update: {
          build_success?: boolean | null
          build_time_seconds?: number | null
          cpu_usage_percent?: number | null
          created_at?: string | null
          disk_usage_mb?: number | null
          export_job_id?: string
          id?: string
          memory_usage_mb?: number | null
          platform_metrics?: Json | null
          quality_score?: number | null
          queue_wait_time_seconds?: number | null
          test_results?: Json | null
          total_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "export_analytics_export_job_id_fkey"
            columns: ["export_job_id"]
            isOneToOne: false
            referencedRelation: "export_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      export_artifacts: {
        Row: {
          checksum_md5: string
          content_type: string
          created_at: string | null
          download_count: number | null
          download_expires_at: string | null
          export_job_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          id: string
          public_url: string | null
          storage_provider: string | null
          storage_url: string
          updated_at: string | null
        }
        Insert: {
          checksum_md5: string
          content_type: string
          created_at?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          export_job_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          id?: string
          public_url?: string | null
          storage_provider?: string | null
          storage_url: string
          updated_at?: string | null
        }
        Update: {
          checksum_md5?: string
          content_type?: string
          created_at?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          export_job_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          public_url?: string | null
          storage_provider?: string | null
          storage_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_artifacts_export_job_id_fkey"
            columns: ["export_job_id"]
            isOneToOne: false
            referencedRelation: "export_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          build_artifacts: Json | null
          build_log: string | null
          build_size_bytes: number | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          estimated_completion: string | null
          export_options: Json | null
          game_id: string
          id: string
          max_retries: number | null
          platform: Database["public"]["Enums"]["export_platform"]
          priority: Database["public"]["Enums"]["export_priority"]
          progress_percentage: number | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["export_status"]
          subscription_tier: string
          updated_at: string | null
          user_id: string
          worker_id: string | null
        }
        Insert: {
          build_artifacts?: Json | null
          build_log?: string | null
          build_size_bytes?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_completion?: string | null
          export_options?: Json | null
          game_id: string
          id?: string
          max_retries?: number | null
          platform: Database["public"]["Enums"]["export_platform"]
          priority?: Database["public"]["Enums"]["export_priority"]
          progress_percentage?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          subscription_tier: string
          updated_at?: string | null
          user_id: string
          worker_id?: string | null
        }
        Update: {
          build_artifacts?: Json | null
          build_log?: string | null
          build_size_bytes?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_completion?: string | null
          export_options?: Json | null
          game_id?: string
          id?: string
          max_retries?: number | null
          platform?: Database["public"]["Enums"]["export_platform"]
          priority?: Database["public"]["Enums"]["export_priority"]
          progress_percentage?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_platform_configs: {
        Row: {
          build_commands: Json | null
          config_data: Json
          config_name: string
          created_at: string | null
          id: string
          is_default: boolean | null
          optimization_settings: Json | null
          platform: Database["public"]["Enums"]["export_platform"]
          required_tier: string
          template_url: string | null
          updated_at: string | null
        }
        Insert: {
          build_commands?: Json | null
          config_data?: Json
          config_name: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          optimization_settings?: Json | null
          platform: Database["public"]["Enums"]["export_platform"]
          required_tier: string
          template_url?: string | null
          updated_at?: string | null
        }
        Update: {
          build_commands?: Json | null
          config_data?: Json
          config_name?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          optimization_settings?: Json | null
          platform?: Database["public"]["Enums"]["export_platform"]
          required_tier?: string
          template_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      export_queue_stats: {
        Row: {
          active_workers: number | null
          avg_processing_time_seconds: number | null
          id: string
          last_updated: string | null
          max_workers: number | null
          peak_queue_size: number | null
          stats_date: string | null
          total_completed_today: number | null
          total_failed_today: number | null
          total_processing: number | null
          total_queued: number | null
        }
        Insert: {
          active_workers?: number | null
          avg_processing_time_seconds?: number | null
          id?: string
          last_updated?: string | null
          max_workers?: number | null
          peak_queue_size?: number | null
          stats_date?: string | null
          total_completed_today?: number | null
          total_failed_today?: number | null
          total_processing?: number | null
          total_queued?: number | null
        }
        Update: {
          active_workers?: number | null
          avg_processing_time_seconds?: number | null
          id?: string
          last_updated?: string | null
          max_workers?: number | null
          peak_queue_size?: number | null
          stats_date?: string | null
          total_completed_today?: number | null
          total_failed_today?: number | null
          total_processing?: number | null
          total_queued?: number | null
        }
        Relationships: []
      }
      export_webhooks: {
        Row: {
          created_at: string | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          max_failures: number | null
          on_job_completed: boolean | null
          on_job_failed: boolean | null
          on_job_started: boolean | null
          updated_at: string | null
          user_id: string
          webhook_secret: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_failures?: number | null
          on_job_completed?: boolean | null
          on_job_failed?: boolean | null
          on_job_started?: boolean | null
          updated_at?: string | null
          user_id: string
          webhook_secret: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_failures?: number | null
          on_job_completed?: boolean | null
          on_job_failed?: boolean | null
          on_job_started?: boolean | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          creator_id: string
          file_path: string
          file_size: number | null
          game_id: string | null
          generated_by_ai: boolean | null
          generation_model: string | null
          generation_prompt: string | null
          id: string
          mime_type: string | null
          name: string
          properties: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          creator_id: string
          file_path: string
          file_size?: number | null
          game_id?: string | null
          generated_by_ai?: boolean | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          mime_type?: string | null
          name: string
          properties?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          creator_id?: string
          file_path?: string
          file_size?: number | null
          game_id?: string | null
          generated_by_ai?: boolean | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          properties?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_assets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          game_id: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_flagged: boolean | null
          parent_comment_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          game_id: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          game_id?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_comments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "game_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      game_embeddings: {
        Row: {
          description_embedding: string | null
          game_id: string
          gameplay_embedding: string | null
          id: string
          mechanics_embedding: string | null
          title_embedding: string | null
          updated_at: string | null
          visual_style_embedding: string | null
        }
        Insert: {
          description_embedding?: string | null
          game_id: string
          gameplay_embedding?: string | null
          id?: string
          mechanics_embedding?: string | null
          title_embedding?: string | null
          updated_at?: string | null
          visual_style_embedding?: string | null
        }
        Update: {
          description_embedding?: string | null
          game_id?: string
          gameplay_embedding?: string | null
          id?: string
          mechanics_embedding?: string | null
          title_embedding?: string | null
          updated_at?: string | null
          visual_style_embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_embeddings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_likes: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_likes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scripts: {
        Row: {
          average_execution_time: number | null
          created_at: string | null
          creator_id: string
          dependencies: string[] | null
          description: string | null
          error_count: number | null
          execution_order: number | null
          game_id: string
          generated_by_ai: boolean | null
          generation_model: string | null
          generation_prompt: string | null
          id: string
          is_active: boolean | null
          javascript_code: string
          memory_usage_peak: number | null
          name: string
          rag_context_used: Json | null
          script_type: string
          security_analysis: Json | null
          source_hash: string
          toxoid_metadata: Json | null
          updated_at: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          average_execution_time?: number | null
          created_at?: string | null
          creator_id: string
          dependencies?: string[] | null
          description?: string | null
          error_count?: number | null
          execution_order?: number | null
          game_id: string
          generated_by_ai?: boolean | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          is_active?: boolean | null
          javascript_code: string
          memory_usage_peak?: number | null
          name: string
          rag_context_used?: Json | null
          script_type: string
          security_analysis?: Json | null
          source_hash: string
          toxoid_metadata?: Json | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          average_execution_time?: number | null
          created_at?: string | null
          creator_id?: string
          dependencies?: string[] | null
          description?: string | null
          error_count?: number | null
          execution_order?: number | null
          game_id?: string
          generated_by_ai?: boolean | null
          generation_model?: string | null
          generation_prompt?: string | null
          id?: string
          is_active?: boolean | null
          javascript_code?: string
          memory_usage_peak?: number | null
          name?: string
          rag_context_used?: Json | null
          script_type?: string
          security_analysis?: Json | null
          source_hash?: string
          toxoid_metadata?: Json | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_scripts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scripts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          creator_id: string
          game_data: Json
          game_id: string
          id: string
          is_major_version: boolean | null
          merge_parent_id: string | null
          parent_version_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          creator_id: string
          game_data: Json
          game_id: string
          id?: string
          is_major_version?: boolean | null
          merge_parent_id?: string | null
          parent_version_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          creator_id?: string
          game_data?: Json
          game_id?: string
          id?: string
          is_major_version?: boolean | null
          merge_parent_id?: string | null
          parent_version_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_versions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_versions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_versions_merge_parent_id_fkey"
            columns: ["merge_parent_id"]
            isOneToOne: false
            referencedRelation: "game_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "game_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          fork_count: number | null
          forked_from: string | null
          game_data: Json
          generation_metadata: Json | null
          generation_prompt: string | null
          genre: string | null
          id: string
          is_featured: boolean | null
          is_template: boolean | null
          like_count: number | null
          play_count: number | null
          published_at: string | null
          screenshot_urls: string[] | null
          search_vector: unknown | null
          tags: string[] | null
          template_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          fork_count?: number | null
          forked_from?: string | null
          game_data?: Json
          generation_metadata?: Json | null
          generation_prompt?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          is_template?: boolean | null
          like_count?: number | null
          play_count?: number | null
          published_at?: string | null
          screenshot_urls?: string[] | null
          search_vector?: unknown | null
          tags?: string[] | null
          template_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          fork_count?: number | null
          forked_from?: string | null
          game_data?: Json
          generation_metadata?: Json | null
          generation_prompt?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          is_template?: boolean | null
          like_count?: number | null
          play_count?: number | null
          published_at?: string | null
          screenshot_urls?: string[] | null
          search_vector?: unknown | null
          tags?: string[] | null
          template_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_forked_from_fkey"
            columns: ["forked_from"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      play_sessions: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          device_info: Json | null
          events: Json | null
          final_score: number | null
          game_id: string
          id: string
          levels_completed: number | null
          platform: string | null
          player_id: string | null
          referrer: string | null
          session_duration: number | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          device_info?: Json | null
          events?: Json | null
          final_score?: number | null
          game_id: string
          id?: string
          levels_completed?: number | null
          platform?: string | null
          player_id?: string | null
          referrer?: string | null
          session_duration?: number | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          device_info?: Json | null
          events?: Json | null
          final_score?: number | null
          game_id?: string
          id?: string
          levels_completed?: number | null
          platform?: string | null
          player_id?: string | null
          referrer?: string | null
          session_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "play_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          credits_remaining: number | null
          credits_reset_date: string | null
          credits_used_today: number | null
          display_name: string | null
          id: string
          is_educator: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          preferences: Json | null
          social_links: Json | null
          stripe_customer_id: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          credits_reset_date?: string | null
          credits_used_today?: number | null
          display_name?: string | null
          id: string
          is_educator?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          preferences?: Json | null
          social_links?: Json | null
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          credits_reset_date?: string | null
          credits_used_today?: number | null
          display_name?: string | null
          id?: string
          is_educator?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          preferences?: Json | null
          social_links?: Json | null
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          currency: string | null
          id: string
          item_id: string | null
          item_type: string
          quantity: number | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          quantity?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          quantity?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      script_embeddings: {
        Row: {
          api_usage_embedding: string | null
          code_embedding: string | null
          embedding_model: string
          embedding_version: string
          functionality_embedding: string | null
          id: string
          pattern_embedding: string | null
          performance_embedding: string | null
          script_id: string
          updated_at: string | null
        }
        Insert: {
          api_usage_embedding?: string | null
          code_embedding?: string | null
          embedding_model: string
          embedding_version: string
          functionality_embedding?: string | null
          id?: string
          pattern_embedding?: string | null
          performance_embedding?: string | null
          script_id: string
          updated_at?: string | null
        }
        Update: {
          api_usage_embedding?: string | null
          code_embedding?: string | null
          embedding_model?: string
          embedding_version?: string
          functionality_embedding?: string | null
          id?: string
          pattern_embedding?: string | null
          performance_embedding?: string | null
          script_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_embeddings_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: true
            referencedRelation: "game_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_execution_logs: {
        Row: {
          console_output: string | null
          created_at: string | null
          entities_processed: number | null
          error_message: string | null
          execution_context: Json | null
          execution_duration: number | null
          execution_phase: string | null
          execution_start: string
          game_id: string
          id: string
          memory_used: number | null
          script_id: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          console_output?: string | null
          created_at?: string | null
          entities_processed?: number | null
          error_message?: string | null
          execution_context?: Json | null
          execution_duration?: number | null
          execution_phase?: string | null
          execution_start: string
          game_id: string
          id?: string
          memory_used?: number | null
          script_id: string
          success: boolean
          user_id?: string | null
        }
        Update: {
          console_output?: string | null
          created_at?: string | null
          entities_processed?: number | null
          error_message?: string | null
          execution_context?: Json | null
          execution_duration?: number | null
          execution_phase?: string | null
          execution_start?: string
          game_id?: string
          id?: string
          memory_used?: number | null
          script_id?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_execution_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_execution_logs_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "game_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      script_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          creator_id: string
          id: string
          javascript_code: string
          performance_diff: Json | null
          script_id: string
          source_hash: string
          toxoid_metadata: Json
          validation_status: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          javascript_code: string
          performance_diff?: Json | null
          script_id: string
          source_hash: string
          toxoid_metadata: Json
          validation_status: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          javascript_code?: string
          performance_diff?: Json | null
          script_id?: string
          source_hash?: string
          toxoid_metadata?: Json
          validation_status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_versions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_versions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "game_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_shares: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          ip_address: unknown | null
          platform_data: Json | null
          referrer: string | null
          share_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          ip_address?: unknown | null
          platform_data?: Json | null
          referrer?: string | null
          share_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          ip_address?: unknown | null
          platform_data?: Json | null
          referrer?: string | null
          share_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_shares_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          currency: string | null
          description: string | null
          difficulty: string | null
          download_count: number | null
          game_id: string
          id: string
          name: string
          price: number | null
          rating: number | null
          rating_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          download_count?: number | null
          game_id: string
          id?: string
          name: string
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          download_count?: number | null
          game_id?: string
          id?: string
          name?: string
          price?: number | null
          rating?: number | null
          rating_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      toxoid_patterns: {
        Row: {
          best_practices: string | null
          complexity_level: string | null
          cpu_impact: string | null
          created_at: string | null
          created_by: string | null
          description: string
          description_embedding: string | null
          example_code: string
          id: string
          is_official: boolean | null
          memory_impact: string | null
          name: string
          pattern_embedding: string | null
          pattern_type: string
          success_rate: number | null
          updated_at: string | null
          usage_count: number | null
          use_cases: string[] | null
        }
        Insert: {
          best_practices?: string | null
          complexity_level?: string | null
          cpu_impact?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          description_embedding?: string | null
          example_code: string
          id?: string
          is_official?: boolean | null
          memory_impact?: string | null
          name: string
          pattern_embedding?: string | null
          pattern_type: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
          use_cases?: string[] | null
        }
        Update: {
          best_practices?: string | null
          complexity_level?: string | null
          cpu_impact?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          description_embedding?: string | null
          example_code?: string
          id?: string
          is_official?: boolean | null
          memory_impact?: string | null
          name?: string
          pattern_embedding?: string | null
          pattern_type?: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
          use_cases?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "toxoid_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_group_id: string | null
          activity_type: string
          created_at: string | null
          description: string
          id: string
          is_primary_in_group: boolean | null
          is_system_generated: boolean | null
          metadata: Json | null
          related_asset_id: string | null
          related_comment_id: string | null
          related_game_id: string | null
          related_user_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          activity_group_id?: string | null
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          is_primary_in_group?: boolean | null
          is_system_generated?: boolean | null
          metadata?: Json | null
          related_asset_id?: string | null
          related_comment_id?: string | null
          related_game_id?: string | null
          related_user_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          activity_group_id?: string | null
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          is_primary_in_group?: boolean | null
          is_system_generated?: boolean | null
          metadata?: Json | null
          related_asset_id?: string | null
          related_comment_id?: string | null
          related_game_id?: string | null
          related_user_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_related_asset_id_fkey"
            columns: ["related_asset_id"]
            isOneToOne: false
            referencedRelation: "game_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_related_comment_id_fkey"
            columns: ["related_comment_id"]
            isOneToOne: false
            referencedRelation: "game_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_related_game_id_fkey"
            columns: ["related_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_embeddings: {
        Row: {
          confidence_score: number | null
          creation_preferences: string | null
          id: string
          play_preferences: string | null
          social_preferences: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          creation_preferences?: string | null
          id?: string
          play_preferences?: string | null
          social_preferences?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          creation_preferences?: string | null
          id?: string
          play_preferences?: string | null
          social_preferences?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_export_usage: {
        Row: {
          created_at: string | null
          desktop_exports: number | null
          exports_today: number | null
          id: string
          mobile_exports: number | null
          source_exports: number | null
          total_exports: number | null
          total_storage_used_bytes: number | null
          updated_at: string | null
          usage_date: string | null
          user_id: string
          web_exports: number | null
        }
        Insert: {
          created_at?: string | null
          desktop_exports?: number | null
          exports_today?: number | null
          id?: string
          mobile_exports?: number | null
          source_exports?: number | null
          total_exports?: number | null
          total_storage_used_bytes?: number | null
          updated_at?: string | null
          usage_date?: string | null
          user_id: string
          web_exports?: number | null
        }
        Update: {
          created_at?: string | null
          desktop_exports?: number | null
          exports_today?: number | null
          id?: string
          mobile_exports?: number | null
          source_exports?: number | null
          total_exports?: number | null
          total_storage_used_bytes?: number | null
          updated_at?: string | null
          usage_date?: string | null
          user_id?: string
          web_exports?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_export_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          activities: Json | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          platform: string | null
          session_end: string | null
          session_start: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activities?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activities?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_user_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
          p_related_asset_id?: string
          p_related_comment_id?: string
          p_related_game_id?: string
          p_related_user_id?: string
          p_title: string
          p_user_id: string
          p_visibility?: string
        }
        Returns: string
      }
      record_social_share: {
        Args: {
          p_game_id: string
          p_platform_data?: Json
          p_referrer?: string
          p_share_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      export_platform:
        | "web"
        | "pwa"
        | "desktop-windows"
        | "desktop-macos"
        | "desktop-linux"
        | "mobile-android"
        | "mobile-ios"
        | "source-code"
      export_priority: "low" | "normal" | "high" | "urgent"
      export_status:
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      export_platform: [
        "web",
        "pwa",
        "desktop-windows",
        "desktop-macos",
        "desktop-linux",
        "mobile-android",
        "mobile-ios",
        "source-code",
      ],
      export_priority: ["low", "normal", "high", "urgent"],
      export_status: [
        "queued",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
