/**
 * Client-side Activity Logger
 * 
 * Provides functions for logging activities from the browser.
 * Uses the activities API endpoint for secure server-side processing.
 */

import { ActivityType } from '@/types/dashboard';

export interface ClientLogActivityParams {
  type: ActivityType;
  title: string;
  description: string;
  relatedGameId?: string;
  metadata?: Record<string, any>;
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Log an activity from the client-side
 */
export async function logActivity({
  type,
  title,
  description,
  relatedGameId,
  metadata = {},
  visibility = 'public'
}: ClientLogActivityParams): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const response = await fetch('/api/dashboard/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        description,
        relatedGameId,
        metadata,
        visibility,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Failed to log activity'
      };
    }

    const { activity } = await response.json();
    return {
      success: true,
      activityId: activity.id
    };
  } catch (error) {
    console.error('Client activity logging error:', error);
    return {
      success: false,
      error: 'Network error'
    };
  }
}

/**
 * Log achievement unlocked (client-side)
 */
export async function logAchievementUnlocked(
  achievementTitle: string,
  achievementDescription?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    type: 'achievement_unlocked',
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
 * Log template usage (client-side)
 */
export async function logTemplateUsed(
  templateName: string,
  gameId?: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    type: 'template_used',
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
 * Fetch activities from the API
 */
export async function fetchActivities(params?: {
  page?: number;
  limit?: number;
  type?: ActivityType | ActivityType[];
  since?: Date;
  until?: Date;
}) {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) {
      const types = Array.isArray(params.type) ? params.type : [params.type];
      searchParams.set('type', types.join(','));
    }
    if (params?.since) searchParams.set('since', params.since.toISOString());
    if (params?.until) searchParams.set('until', params.until.toISOString());

    const response = await fetch(`/api/dashboard/activities?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch activities error:', error);
    throw error;
  }
}

/**
 * React hook for fetching activities
 */
export function useActivities(params?: {
  page?: number;
  limit?: number;
  type?: ActivityType | ActivityType[];
  since?: Date;
  until?: Date;
}) {
  // This would typically use SWR or React Query in a real implementation
  // For now, providing a basic structure
  
  return {
    activities: [],
    loading: false,
    error: null,
    mutate: async () => {},
    hasMore: false,
  };
}

/**
 * Activity event emitter for real-time updates
 */
export class ActivityEventEmitter extends EventTarget {
  private static instance: ActivityEventEmitter;
  
  static getInstance(): ActivityEventEmitter {
    if (!ActivityEventEmitter.instance) {
      ActivityEventEmitter.instance = new ActivityEventEmitter();
    }
    return ActivityEventEmitter.instance;
  }
  
  emitActivity(activity: any) {
    this.dispatchEvent(new CustomEvent('activity-created', {
      detail: activity
    }));
  }
  
  onActivity(callback: (activity: any) => void) {
    const handler = (event: any) => callback(event.detail);
    this.addEventListener('activity-created', handler);
    
    return () => this.removeEventListener('activity-created', handler);
  }
}

/**
 * Utility to trigger activity events after logging
 */
export async function logActivityAndNotify(params: ClientLogActivityParams) {
  const result = await logActivity(params);
  
  if (result.success) {
    // Emit event for real-time updates
    ActivityEventEmitter.getInstance().emitActivity({
      id: result.activityId,
      ...params,
      timestamp: new Date().toISOString(),
    });
  }
  
  return result;
}