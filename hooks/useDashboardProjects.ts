import { useState, useEffect, useCallback } from 'react';
import { ProjectGridItem, ProjectFilter, ProjectSort, ProjectSearchResult } from '@/types/dashboard';

interface UseDashboardProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: ProjectFilter;
  sort?: ProjectSort;
  autoFetch?: boolean;
}

interface UseDashboardProjectsReturn {
  projects: ProjectGridItem[];
  totalCount: number;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: ProjectFilter) => void;
  setSort: (sort: ProjectSort) => void;
  currentPage: number;
  currentSearch: string;
  currentFilters: ProjectFilter;
  currentSort: ProjectSort;
}

/**
 * Custom hook for fetching and managing dashboard project data
 */
export function useDashboardProjects({
  page = 1,
  limit = 12,
  search = '',
  filters = {},
  sort = { field: 'updated_at', direction: 'desc' },
  autoFetch = true,
}: UseDashboardProjectsParams = {}): UseDashboardProjectsReturn {
  // State management
  const [projects, setProjects] = useState<ProjectGridItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current parameters
  const [currentPage, setCurrentPage] = useState(page);
  const [currentSearch, setCurrentSearch] = useState(search);
  const [currentFilters, setCurrentFilters] = useState<ProjectFilter>(filters);
  const [currentSort, setCurrentSort] = useState<ProjectSort>(sort);

  /**
   * Build query parameters for API call
   */
  const buildQueryParams = useCallback((
    page: number,
    search: string,
    filters: ProjectFilter,
    sort: ProjectSort
  ) => {
    const params = new URLSearchParams();
    
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    if (search) {
      params.set('search', search);
    }
    
    if (filters.status?.length) {
      params.set('status', filters.status.join(','));
    }
    
    if (filters.gameType?.length) {
      params.set('gameType', filters.gameType.join(','));
    }
    
    if (filters.visibility?.length) {
      params.set('visibility', filters.visibility.join(','));
    }
    
    if (filters.tags?.length) {
      params.set('tags', filters.tags.join(','));
    }
    
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        params.set('dateStart', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        params.set('dateEnd', filters.dateRange.end.toISOString());
      }
    }
    
    params.set('sortField', sort.field);
    params.set('sortDirection', sort.direction);
    
    return params;
  }, [limit]);

  /**
   * Fetch projects from API
   */
  const fetchProjects = useCallback(async (
    page: number = currentPage,
    search: string = currentSearch,
    filters: ProjectFilter = currentFilters,
    sort: ProjectSort = currentSort
  ) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(page, search, filters, sort);
      const response = await fetch(`/api/dashboard/projects?${queryParams.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view your projects');
        }
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data: ProjectSearchResult = await response.json();

      setProjects(data.projects);
      setTotalCount(data.totalCount);
      setHasNextPage(data.hasNextPage);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching dashboard projects:', err);
      
      // Reset data on error
      setProjects([]);
      setTotalCount(0);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentSearch, currentFilters, currentSort, buildQueryParams]);

  /**
   * Refetch with current parameters
   */
  const refetch = useCallback(() => {
    return fetchProjects();
  }, [fetchProjects]);

  /**
   * Set page and trigger fetch
   */
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchProjects(page);
  }, [fetchProjects]);

  /**
   * Set search and trigger fetch (reset to page 1)
   */
  const setSearch = useCallback((search: string) => {
    setCurrentSearch(search);
    setCurrentPage(1);
    fetchProjects(1, search);
  }, [fetchProjects]);

  /**
   * Set filters and trigger fetch (reset to page 1)
   */
  const setFilters = useCallback((filters: ProjectFilter) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    fetchProjects(1, currentSearch, filters);
  }, [fetchProjects, currentSearch]);

  /**
   * Set sort and trigger fetch (reset to page 1)
   */
  const setSort = useCallback((sort: ProjectSort) => {
    setCurrentSort(sort);
    setCurrentPage(1);
    fetchProjects(1, currentSearch, currentFilters, sort);
  }, [fetchProjects, currentSearch, currentFilters]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
    }
  }, [autoFetch, fetchProjects]);

  return {
    projects,
    totalCount,
    hasNextPage,
    loading,
    error,
    refetch,
    setPage,
    setSearch,
    setFilters,
    setSort,
    currentPage,
    currentSearch,
    currentFilters,
    currentSort,
  };
}

export default useDashboardProjects;