'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ActivityItem, ActivityType } from '@/types/dashboard';
import { useAuthState } from '@/lib/auth/auth-hooks';

interface UseRealtimeActivitiesProps {
  onActivityReceived?: (activity: any) => void;
  enabled?: boolean;
}

export function useRealtimeActivities({
  onActivityReceived,
  enabled = true,
}: UseRealtimeActivitiesProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthState();

  const handleActivityInsert = useCallback((payload: any) => {
    const newActivity = payload.new;
    
    // Only process activities that are public or from the current user
    if (newActivity.visibility === 'public' || newActivity.user_id === user?.id) {
      onActivityReceived?.(newActivity);
    }
  }, [onActivityReceived, user?.id]);

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const supabase = createClient();
    
    // Subscribe to real-time activity updates
    const channel = supabase
      .channel('user_activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
        },
        handleActivityInsert
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Failed to connect to real-time updates');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Connection timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [enabled, user, handleActivityInsert]);

  return {
    isConnected,
    error,
  };
}

/**
 * Enhanced activities hook with real-time updates
 */
export function useActivitiesWithRealtime(params: {
  page?: number;
  limit?: number;
  type?: ActivityType | ActivityType[];
  since?: Date;
  until?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(params.page || 1);

  const { user } = useAuthState();

  // Handle new activities from real-time subscription
  const handleNewActivity = useCallback(async (newActivityData: any) => {
    try {
      // Fetch the complete activity data with related user and game info
      const supabase = createClient();
      
      // Get user info
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', newActivityData.user_id)
        .single();

      // Get game info if related
      let gameData = null;
      if (newActivityData.related_game_id) {
        const { data } = await supabase
          .from('games')
          .select('id, title, creator_id, visibility')
          .eq('id', newActivityData.related_game_id)
          .single();
        gameData = data;
      }

      // Transform to ActivityItem
      const transformedActivity: ActivityItem = {
        id: newActivityData.id,
        type: newActivityData.activity_type as ActivityType,
        title: newActivityData.title,
        description: newActivityData.description,
        timestamp: newActivityData.created_at,
        user: {
          id: userData?.id || newActivityData.user_id,
          displayName: userData?.display_name || userData?.username || 'Unknown User',
          avatarUrl: userData?.avatar_url || undefined,
        },
        project: gameData ? {
          id: gameData.id,
          title: gameData.title,
          slug: gameData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        } : undefined,
        metadata: newActivityData.metadata || {},
      };

      // Add to the top of activities list
      setActivities(prevActivities => [transformedActivity, ...prevActivities]);
      setTotalCount(prev => prev + 1);

    } catch (error) {
      console.error('Error processing new activity:', error);
    }
  }, []);

  // Set up real-time subscription
  const { isConnected, error: realtimeError } = useRealtimeActivities({
    onActivityReceived: handleNewActivity,
    enabled: !!user,
  });

  // Fetch initial activities
  const fetchActivities = useCallback(async (pageToFetch: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set('page', pageToFetch.toString());
      searchParams.set('limit', (params.limit || 20).toString());

      if (params.type) {
        const types = Array.isArray(params.type) ? params.type : [params.type];
        searchParams.set('type', types.join(','));
      }
      if (params.since) searchParams.set('since', params.since.toISOString());
      if (params.until) searchParams.set('until', params.until.toISOString());

      const response = await fetch(`/api/dashboard/activities?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      
      setActivities(prevActivities => 
        append ? [...prevActivities, ...data.activities] : data.activities
      );
      setHasMore(data.hasNextPage);
      setTotalCount(data.totalCount);
      setCurrentPage(pageToFetch);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.type, params.since, params.until]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await fetchActivities(1, false);
  }, [fetchActivities]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      await fetchActivities(nextPage, true);
    }
  }, [hasMore, loading, currentPage, fetchActivities]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchActivities(params.page || 1, false);
    }
  }, [fetchActivities, params.page, user]);

  return {
    activities,
    loading,
    error: error || realtimeError,
    hasMore,
    totalCount,
    refresh,
    loadMore,
    isRealtimeConnected: isConnected,
  };
}