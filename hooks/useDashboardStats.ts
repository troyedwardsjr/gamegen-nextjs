import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/types/dashboard';

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching dashboard statistics
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard stats from API
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view dashboard stats');
        }
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }

      const data: DashboardStats = await response.json();
      setStats(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching dashboard stats:', err);
      
      // Reset stats on error
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export default useDashboardStats;