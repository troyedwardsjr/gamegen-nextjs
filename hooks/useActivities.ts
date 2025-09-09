'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityItem, ActivityType } from '@/types/dashboard';

interface UseActivitiesParams {
  page?: number;
  limit?: number;
  type?: ActivityType | ActivityType[];
  since?: Date;
  until?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ActivitiesResponse {
  activities: ActivityItem[];
  totalCount: number;
  hasNextPage: boolean;
  page: number;
  limit: number;
}

interface UseActivitiesReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useActivities(params: UseActivitiesParams = {}): UseActivitiesReturn {
  const {
    page = 1,
    limit = 20,
    type,
    since,
    until,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = params;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchActivities = useCallback(async (pageToFetch: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set('page', pageToFetch.toString());
      searchParams.set('limit', limit.toString());

      if (type) {
        const types = Array.isArray(type) ? type : [type];
        searchParams.set('type', types.join(','));
      }
      if (since) searchParams.set('since', since.toISOString());
      if (until) searchParams.set('until', until.toISOString());

      const response = await fetch(`/api/dashboard/activities?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data: ActivitiesResponse = await response.json();
      
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
  }, [limit, type, since, until]);

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
    fetchActivities(page, false);
  }, [fetchActivities, page]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    activities,
    loading,
    error,
    hasMore,
    totalCount,
    refresh,
    loadMore,
  };
}