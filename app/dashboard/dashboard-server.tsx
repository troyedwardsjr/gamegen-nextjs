import React, { Suspense } from 'react';
import { Metadata } from 'next';

// Server Components for data fetching
import DashboardClientWrapper from './dashboard-client-wrapper';
import DashboardLoadingSkeleton from '@/components/dashboard/DashboardLoadingSkeleton';

// API functions for server-side data fetching
import { getDashboardStats } from '@/lib/api/dashboard';
import { getProjects } from '@/lib/api/projects';
import { getNotifications } from '@/lib/api/notifications';
import { getFeaturedTemplates } from '@/lib/api/templates';

// Types
import type {
  DashboardStats,
  ProjectGridItem,
  Notification,
  NotificationSettings,
  GameTemplate,
} from '@/types/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard - GameGen',
  description: 'Your creative hub for building amazing games with AI assistance',
  keywords: ['game development', 'ai games', 'dashboard', 'game creator'],
};

interface DashboardServerProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    search?: string;
    filters?: string;
    sort?: string;
  }>;
}

// Server-side data fetching functions
async function fetchDashboardData() {
  try {
    // Parallel data fetching for better performance
    const [stats, projects, notifications, templates] = await Promise.allSettled([
      getDashboardStats(),
      getProjects({ page: 1, limit: 12, includeAnalytics: true }),
      getNotifications({ limit: 20, includeSettings: true }),
      getFeaturedTemplates(6),
    ]);

    return {
      stats: stats.status === 'fulfilled' ? stats.value : null,
      statsError: stats.status === 'rejected' ? stats.reason.message : null,
      projects: projects.status === 'fulfilled' ? projects.value : { projects: [], totalCount: 0 },
      projectsError: projects.status === 'rejected' ? projects.reason.message : null,
      notifications: notifications.status === 'fulfilled' ? notifications.value : { notifications: [], unreadCount: 0 },
      notificationsError: notifications.status === 'rejected' ? notifications.reason.message : null,
      templates: templates.status === 'fulfilled' ? templates.value : { templates: [] },
      templatesError: templates.status === 'rejected' ? templates.reason.message : null,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: null,
      statsError: 'Failed to load dashboard statistics',
      projects: { projects: [], totalCount: 0 },
      projectsError: 'Failed to load projects',
      notifications: { notifications: [], unreadCount: 0 },
      notificationsError: 'Failed to load notifications',
      templates: { templates: [] },
      templatesError: 'Failed to load templates',
    };
  }
}

async function fetchProjectsWithParams(searchParams: Awaited<DashboardServerProps['searchParams']>) {
  try {
    const page = parseInt(searchParams.page || '1', 10);
    const search = searchParams.search || '';
    const filters = searchParams.filters ? JSON.parse(decodeURIComponent(searchParams.filters)) : {};
    const sort = searchParams.sort ? JSON.parse(decodeURIComponent(searchParams.sort)) : { field: 'updated_at', direction: 'desc' };

    const projectsData = await getProjects({
      page,
      limit: 12,
      search,
      filters,
      sort,
      includeAnalytics: true,
    });

    return {
      projects: projectsData.projects,
      totalCount: projectsData.totalCount,
      currentPage: page,
      searchQuery: search,
      currentFilters: filters,
      currentSort: sort,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching projects with params:', error);
    return {
      projects: [],
      totalCount: 0,
      currentPage: 1,
      searchQuery: '',
      currentFilters: {},
      currentSort: { field: 'updated_at', direction: 'desc' },
      error: error instanceof Error ? error.message : 'Failed to load projects',
    };
  }
}

// Main server component
export default async function DashboardServer({ searchParams }: DashboardServerProps) {
  // Await search params since they're a Promise in Next.js 15
  const resolvedSearchParams = await searchParams;
  
  // Get initial tab from search params
  const activeTab = resolvedSearchParams.tab || 'overview';

  // Fetch initial dashboard data
  const dashboardData = await fetchDashboardData();

  // If we're on the projects tab, fetch projects with current filters
  const projectsData = activeTab === 'projects' 
    ? await fetchProjectsWithParams(resolvedSearchParams)
    : {
        projects: dashboardData.projects.projects,
        totalCount: dashboardData.projects.totalCount,
        currentPage: 1,
        searchQuery: '',
        currentFilters: {},
        currentSort: { field: 'updated_at', direction: 'desc' },
        error: dashboardData.projectsError,
      };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardClientWrapper
          // Server-rendered data
          initialActiveTab={activeTab}
          initialStats={dashboardData.stats}
          initialStatsError={dashboardData.statsError}
          initialProjects={projectsData.projects}
          initialProjectsTotal={projectsData.totalCount}
          initialProjectsError={projectsData.error}
          initialCurrentPage={projectsData.currentPage}
          initialSearchQuery={projectsData.searchQuery}
          initialCurrentFilters={projectsData.currentFilters}
          initialCurrentSort={projectsData.currentSort}
          initialNotifications={dashboardData.notifications.notifications}
          initialUnreadCount={dashboardData.notifications.unreadCount}
          initialNotificationsError={dashboardData.notificationsError}
          initialNotificationSettings={dashboardData.notifications.settings || null}
          initialTemplates={dashboardData.templates.templates}
          initialTemplatesError={dashboardData.templatesError}
        />
      </Suspense>
    </div>
  );
}

// Static props for better caching
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Ensure fresh data for user-specific content