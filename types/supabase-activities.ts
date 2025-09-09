/**
 * Extended Supabase types that include the user_activities table
 * This will be merged into the main database types once the migration is deployed
 */

export interface UserActivitiesRow {
  id: string;
  user_id: string;
  activity_type: 
    | 'project_created' 
    | 'project_updated' 
    | 'project_published'
    | 'project_played' 
    | 'project_liked' 
    | 'project_commented'
    | 'collaboration_invited' 
    | 'collaboration_accepted'
    | 'asset_uploaded' 
    | 'achievement_unlocked' 
    | 'template_used';
  title: string;
  description: string;
  related_user_id?: string | null;
  related_game_id?: string | null;
  related_asset_id?: string | null;
  related_comment_id?: string | null;
  metadata: Record<string, any>;
  visibility: 'public' | 'friends' | 'private';
  is_system_generated: boolean;
  activity_group_id?: string | null;
  is_primary_in_group: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserActivitiesInsert {
  id?: string;
  user_id: string;
  activity_type: UserActivitiesRow['activity_type'];
  title: string;
  description: string;
  related_user_id?: string | null;
  related_game_id?: string | null;
  related_asset_id?: string | null;
  related_comment_id?: string | null;
  metadata?: Record<string, any>;
  visibility?: 'public' | 'friends' | 'private';
  is_system_generated?: boolean;
  activity_group_id?: string | null;
  is_primary_in_group?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserActivitiesUpdate {
  id?: string;
  user_id?: string;
  activity_type?: UserActivitiesRow['activity_type'];
  title?: string;
  description?: string;
  related_user_id?: string | null;
  related_game_id?: string | null;
  related_asset_id?: string | null;
  related_comment_id?: string | null;
  metadata?: Record<string, any>;
  visibility?: 'public' | 'friends' | 'private';
  is_system_generated?: boolean;
  activity_group_id?: string | null;
  is_primary_in_group?: boolean;
  created_at?: string;
  updated_at?: string;
}