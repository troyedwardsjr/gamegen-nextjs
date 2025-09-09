// Temporary extended Supabase client with notification tables
// This file should be removed once the database migration is applied

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { NotificationRow, NotificationSettingsRow } from './temp-notification-types';

// Extend the existing database interface with notification tables
export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: Omit<NotificationSettingsRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<NotificationSettingsRow>;
        Relationships: [];
      };
    };
  };
}

export const createExtendedClient = (supabaseUrl: string, supabaseKey: string) => {
  return createSupabaseClient<ExtendedDatabase>(supabaseUrl, supabaseKey);
};