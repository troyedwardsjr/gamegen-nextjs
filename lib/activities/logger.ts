/**
 * Activity Logger Utilities
 * 
 * Provides functions for logging user activities throughout the application.
 * These functions work alongside the database triggers for comprehensive activity tracking.
 */

import { createClient } from '@/lib/supabase/server';
import { ActivityType } from '@/types/dashboard';

export interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  title: string;
  description: string;
  relatedUserId?: string;
  relatedGameId?: string;
  relatedAssetId?: string;
  relatedCommentId?: string;
  metadata?: Record<string, any>;
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Log an activity to the database
 */
export async function logActivity({
  userId,
  activityType,
  title,
  description,
  relatedUserId,
  relatedGameId,
  relatedAssetId,
  relatedCommentId,
  metadata = {},
  visibility = 'public'
}: LogActivityParams): Promise<string | null> {
  try {
    // For now, just log to console until user_activities table is deployed
    console.log('Activity logged:', {
      userId,
      activityType,
      title,
      description,
      relatedUserId,
      relatedGameId,
      relatedAssetId,
      relatedCommentId,
      metadata,
      visibility,
    });
    
    // Return a mock ID
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  } catch (error) {
    console.error('Activity logging error:', error);
    return null;
  }
}

/**
 * Log achievement unlocked activity
 */
export async function logAchievementUnlocked(
  userId: string,
  achievementTitle: string,
  achievementDescription?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    userId,
    activityType: 'achievement_unlocked',
    title: `Unlocked "${achievementTitle}"`,
    description: achievementDescription || `Earned the "${achievementTitle}" achievement!`,
    metadata: {
      achievement_title: achievementTitle,
      ...metadata,
    },
    visibility: 'public',
  });
}

/**
 * Log template usage activity
 */
export async function logTemplateUsed(
  userId: string,
  templateName: string,
  gameId?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    userId,
    activityType: 'template_used',
    title: `Used template "${templateName}"`,
    description: `Created a new project using the "${templateName}" template`,
    relatedGameId: gameId,
    metadata: {
      template_name: templateName,
      ...metadata,
    },
    visibility: 'public',
  });
}

/**
 * Log collaboration invitation activity
 */
export async function logCollaborationInvited(
  inviterUserId: string,
  inviteeUserId: string,
  gameId: string,
  gameTitle: string,
  role?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    userId: inviterUserId,
    activityType: 'collaboration_invited',
    title: `Invited collaborator to "${gameTitle}"`,
    description: `Invited a collaborator to work on "${gameTitle}"`,
    relatedUserId: inviteeUserId,
    relatedGameId: gameId,
    metadata: {
      role,
      game_title: gameTitle,
      ...metadata,
    },
    visibility: 'public',
  });
}

/**
 * Log collaboration accepted activity
 */
export async function logCollaborationAccepted(
  collaboratorUserId: string,
  gameId: string,
  gameTitle: string,
  inviterUserId?: string,
  role?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    userId: collaboratorUserId,
    activityType: 'collaboration_accepted',
    title: `Joined "${gameTitle}" collaboration`,
    description: `Started collaborating on "${gameTitle}"`,
    relatedUserId: inviterUserId,
    relatedGameId: gameId,
    metadata: {
      role,
      game_title: gameTitle,
      ...metadata,
    },
    visibility: 'public',
  });
}

/**
 * Batch log multiple activities (useful for bulk operations)
 */
export async function logActivities(activities: LogActivityParams[]): Promise<string[]> {
  try {
    // TODO: Implement after user_activities table is deployed
    console.log('Batch activity logging (mock):', activities.length, 'activities');
    
    // Return mock IDs for now
    return activities.map((_, index) => 
      `mock-batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    );

    /* UNCOMMENT AFTER MIGRATION DEPLOYMENT:
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_activities')
      .insert(
        activities.map(activity => ({
          user_id: activity.userId,
          activity_type: activity.activityType,
          title: activity.title,
          description: activity.description,
          related_user_id: activity.relatedUserId || null,
          related_game_id: activity.relatedGameId || null,
          related_asset_id: activity.relatedAssetId || null,
          related_comment_id: activity.relatedCommentId || null,
          metadata: activity.metadata || {},
          visibility: activity.visibility || 'public',
        }))
      )
      .select('id');

    if (error) {
      console.error('Error batch logging activities:', error);
      return [];
    }

    return data.map(item => item.id);
    */
  } catch (error) {
    console.error('Batch activity logging error:', error);
    return [];
  }
}

/**
 * Get recent activities for a user (for quick checks)
 */
export async function getUserRecentActivities(
  userId: string,
  limit: number = 10,
  activityTypes?: ActivityType[]
): Promise<any[]> {
  try {
    // TODO: Implement after user_activities table is deployed
    console.log('Get recent activities (mock):', userId, limit, activityTypes);
    return [];

    /* UNCOMMENT AFTER MIGRATION DEPLOYMENT:
    const supabase = await createClient();
    
    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityTypes?.length) {
      query = query.in('activity_type', activityTypes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }

    return data || [];
    */
  } catch (error) {
    console.error('Get recent activities error:', error);
    return [];
  }
}

/**
 * Delete activities (for cleanup or user privacy)
 */
export async function deleteActivities(
  userId: string,
  activityIds: string[]
): Promise<boolean> {
  try {
    // TODO: Implement after user_activities table is deployed
    console.log('Delete activities (mock):', userId, activityIds.length);
    return true;

    /* UNCOMMENT AFTER MIGRATION DEPLOYMENT:
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_activities')
      .delete()
      .eq('user_id', userId)
      .in('id', activityIds);

    if (error) {
      console.error('Error deleting activities:', error);
      return false;
    }

    return true;
    */
  } catch (error) {
    console.error('Delete activities error:', error);
    return false;
  }
}

/**
 * Update activity visibility
 */
export async function updateActivityVisibility(
  userId: string,
  activityId: string,
  visibility: 'public' | 'friends' | 'private'
): Promise<boolean> {
  try {
    // TODO: Implement after user_activities table is deployed
    console.log('Update activity visibility (mock):', userId, activityId, visibility);
    return true;

    /* UNCOMMENT AFTER MIGRATION DEPLOYMENT:
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_activities')
      .update({ visibility })
      .eq('user_id', userId)
      .eq('id', activityId);

    if (error) {
      console.error('Error updating activity visibility:', error);
      return false;
    }

    return true;
    */
  } catch (error) {
    console.error('Update activity visibility error:', error);
    return false;
  }
}