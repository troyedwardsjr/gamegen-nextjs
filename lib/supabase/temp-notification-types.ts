// Temporary type definitions for notification system
// This file should be removed once the database migration is applied
// and proper types are generated from the database schema

export interface NotificationRow {
  id: string;
  recipient_id: string;
  sender_id?: string;
  notification_type: string;
  title: string;
  content?: string;
  category: 'collaboration' | 'social' | 'achievements' | 'billing' | 'system' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  action_label?: string;
  notification_data?: Record<string, any>;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationSettingsRow {
  id: string;
  user_id: string;
  email_collaborations: boolean;
  email_social_activity: boolean;
  email_achievements: boolean;
  email_billing: boolean;
  email_system: boolean;
  in_app_collaborations: boolean;
  in_app_social_activity: boolean;
  in_app_achievements: boolean;
  in_app_billing: boolean;
  in_app_system: boolean;
  push_collaborations: boolean;
  push_social_activity: boolean;
  push_achievements: boolean;
  push_billing: boolean;
  push_system: boolean;
  created_at: string;
  updated_at: string;
}