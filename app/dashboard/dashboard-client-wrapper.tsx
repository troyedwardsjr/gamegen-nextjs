"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Tabs, Tab } from '@heroui/tabs';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Dashboard Components
import ProjectGrid from '@/components/dashboard/ProjectGrid';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import TemplateLibrary from '@/components/dashboard/TemplateLibrary';
import CollaborationHub from '@/components/dashboard/CollaborationHub';
import BillingDashboard from '@/components/dashboard/BillingDashboard';

// Icons
import {
  GameIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  PlusIcon,
  TrophyIcon,
  ClockIcon,
  BellIcon,
  HomeIcon,
  FolderIcon,
  TemplateIcon,
  UsersIcon,
  CreditCardIcon,
} from '@/components/icons';

// Types
import type {
  DashboardStats,
  ProjectGridItem,
  Notification,
  NotificationSettings,
  GameTemplate,
  ProjectFilter,
  ProjectSort,
  DashboardAnalytics,
} from '@/types/dashboard';

interface RecentGame {
  id: string;
  title: string;
  lastModified: string;
  thumbnail?: string;
  status: "draft" | "published" | "in_review";
}

interface DashboardClientWrapperProps {
  // Server-rendered initial data
  initialActiveTab: string;
  initialStats: DashboardStats | null;
  initialStatsError: string | null;
  initialProjects: ProjectGridItem[];
  initialProjectsTotal: number;
  initialProjectsError: string | null;
  initialCurrentPage: number;
  initialSearchQuery: string;
  initialCurrentFilters: ProjectFilter;
  initialCurrentSort: ProjectSort;
  initialNotifications: Notification[];
  initialUnreadCount: number;
  initialNotificationsError: string | null;
  initialNotificationSettings: NotificationSettings | null;
  initialTemplates: GameTemplate[];
  initialTemplatesError: string | null;
}

export default function DashboardClientWrapper({
  initialActiveTab,
  initialStats,
  initialStatsError,
  initialProjects,
  initialProjectsTotal,
  initialProjectsError,
  initialCurrentPage,
  initialSearchQuery,
  initialCurrentFilters,
  initialCurrentSort,
  initialNotifications,
  initialUnreadCount,
  initialNotificationsError,
  initialNotificationSettings,
  initialTemplates,
  initialTemplatesError,
}: DashboardClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Client state (hydrated with server data)
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [stats, setStats] = useState(initialStats);
  const [statsError, setStatsError] = useState(initialStatsError);
  const [projects, setProjects] = useState(initialProjects);
  const [totalCount, setTotalCount] = useState(initialProjectsTotal);
  const [projectsError, setProjectsError] = useState(initialProjectsError);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentFilters, setCurrentFilters] = useState(initialCurrentFilters);
  const [currentSort, setCurrentSort] = useState(initialCurrentSort);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notificationsError, setNotificationsError] = useState(initialNotificationsError);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);
  const [templates, setTemplates] = useState(initialTemplates);
  const [templatesError, setTemplatesError] = useState(initialTemplatesError);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Update URL when tab changes
  const handleTabChange = (key: React.Key) => {
    const newTab = String(key);
    startTransition(() => {
      setActiveTab(newTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', newTab);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  // Helper functions
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  }

  function getGameStatus(project: ProjectGridItem): "draft" | "published" | "in_review" {
    if (project.status === 'published') return 'published';
    if (project.status === 'in_development' || project.status === 'testing') return 'in_review';
    return 'draft';
  }

  // Get recent games for overview tab
  const recentGames: RecentGame[] = projects.slice(0, 3).map(project => ({
    id: project.id,
    title: project.title,
    lastModified: formatRelativeTime(project.lastModified),
    status: getGameStatus(project),
    thumbnail: project.thumbnail_url || undefined,
  }));

  // Project management functions with optimistic updates
  const handleSearch = async (query: string) => {
    startTransition(() => {
      setSearchQuery(query);
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('search', query);
      params.set('page', '1');
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handleFilter = async (filters: ProjectFilter) => {
    startTransition(() => {
      setCurrentFilters(filters);
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('filters', encodeURIComponent(JSON.stringify(filters)));
      params.set('page', '1');
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handleSort = async (sort: ProjectSort) => {
    startTransition(() => {
      setCurrentSort(sort);
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', encodeURIComponent(JSON.stringify(sort)));
      params.set('page', '1');
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handlePageChange = async (page: number) => {
    startTransition(() => {
      setCurrentPage(page);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  // Template management
  const handleCreateFromTemplate = async (templateId: string, projectData: { title: string; description: string }) => {
    try {
      const { useTemplate } = await import('@/lib/api/templates');
      
      await useTemplate(templateId, {
        usageType: 'create_project',
        metadata: {
          projectTitle: projectData.title,
          projectDescription: projectData.description,
        },
      });

      const template = templates.find(t => t.id === templateId);
      if (template) {
        localStorage.setItem('selectedTemplate', JSON.stringify({
          templateId,
          templateTitle: template.title,
          projectTitle: projectData.title,
          projectDescription: projectData.description,
          gameConfig: template.gameConfig,
        }));
        
        router.push('/creator?template=' + templateId);
      } else {
        router.push('/creator');
      }
    } catch (error) {
      console.error('Failed to create project from template:', error);
      router.push('/creator');
    }
  };

  const handleCreateBlank = () => {
    router.push('/creator');
  };

  const handleImportProject = (file: File) => {
    console.log('Importing project:', file.name);
  };

  // Notification management
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import('@/lib/api/notifications');
      await markNotificationAsRead(notificationId);
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { markAllNotificationsAsRead } = await import('@/lib/api/notifications');
      await markAllNotificationsAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { deleteNotification } = await import('@/lib/api/notifications');
      await deleteNotification(notificationId);
      
      const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleUpdateNotificationSettings = async (settings: NotificationSettings) => {
    try {
      const { updateNotificationSettings } = await import('@/lib/api/notifications');
      await updateNotificationSettings(settings);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const handleNotificationAction = async (notificationId: string, action: string) => {
    console.log('Notification action:', notificationId, action);
  };

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "success";
      case "in_review": return "warning";
      case "draft": return "default";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published": return "Published";
      case "in_review": return "In Review";
      case "draft": return "Draft";
      default: return status;
    }
  };

  // Mock analytics data
  const mockAnalytics: DashboardAnalytics = {
    userId: 'user1',
    overview: {
      totalProjects: stats?.gamesCreated || 0,
      publishedProjects: Math.floor((stats?.gamesCreated || 0) * 0.6),
      totalPlays: stats?.totalPlays || 0,
      totalLikes: Math.floor((stats?.totalPlays || 0) * 0.1),
      followerCount: stats?.communityFollowers || 0,
      creditsUsed: stats?.creditsUsed || 0,
    },
    projectPerformance: {
      topProjects: projects.slice(0, 5).map(project => ({
        projectId: project.id,
        title: project.title,
        plays: project.analyticsPreview?.plays || 0,
        growth: Math.random() * 40 - 20, // Random growth for demo
      })),
      recentTrends: [],
    },
    engagement: {
      communityActivity: { 
        likes: stats?.totalPlays ? Math.floor(stats.totalPlays * 0.1) : 0,
        comments: stats?.totalPlays ? Math.floor(stats.totalPlays * 0.05) : 0,
        shares: stats?.totalPlays ? Math.floor(stats.totalPlays * 0.02) : 0,
        followers: stats?.communityFollowers || 0,
      },
      collaborations: { active: 3, pending: 2, completed: 5 },
    },
    usage: {
      creditsUsage: [],
      featureUsage: {},
    },
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Header */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, Creator!
              </h1>
              <p className="text-gray-400 text-lg">
                Ready to continue building amazing games?
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2 bg-purple-900/50 border border-purple-500/30 rounded-lg px-4 py-2"
              >
                <BellIcon className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">
                  {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Dashboard Tabs */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
            variant="bordered"
            color="primary"
            size="lg"
            classNames={{
              tabList: "bg-gray-900/50 backdrop-blur-xl border-purple-500/20",
              tab: "text-gray-400 hover:text-white",
              cursor: "bg-purple-500",
            }}
          >
            <Tab 
              key="overview" 
              title={
                <div className="flex items-center space-x-2">
                  <HomeIcon className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              }
            />
            <Tab 
              key="projects" 
              title={
                <div className="flex items-center space-x-2">
                  <FolderIcon className="w-4 h-4" />
                  <span>Projects</span>
                </div>
              }
            />
            <Tab 
              key="analytics" 
              title={
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Analytics</span>
                </div>
              }
            />
            <Tab 
              key="templates" 
              title={
                <div className="flex items-center space-x-2">
                  <TemplateIcon className="w-4 h-4" />
                  <span>Templates</span>
                </div>
              }
            />
            <Tab 
              key="collaborations" 
              title={
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-4 h-4" />
                  <span>Collaborations</span>
                </div>
              }
            />
            <Tab 
              key="billing" 
              title={
                <div className="flex items-center space-x-2">
                  <CreditCardIcon className="w-4 h-4" />
                  <span>Billing</span>
                </div>
              }
            />
            <Tab 
              key="notifications" 
              title={
                <div className="flex items-center space-x-2">
                  <BellIcon className="w-4 h-4" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              }
            />
          </Tabs>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <QuickActions
                templates={templates}
                loading={templatesLoading}
                onCreateFromTemplate={handleCreateFromTemplate}
                onCreateBlank={handleCreateBlank}
                onImportProject={handleImportProject}
              />

              {/* Stats Cards */}
              {statsError && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400 font-medium">Error loading statistics</p>
                  <p className="text-red-300 text-sm">{statsError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 backdrop-blur-xl">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-400 text-sm font-medium">Games Created</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading || isPending ? (
                            <Spinner size="sm" color="primary" />
                          ) : (
                            stats?.gamesCreated ?? 0
                          )}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <GameIcon className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 backdrop-blur-xl">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-400 text-sm font-medium">Total Plays</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading || isPending ? (
                            <Spinner size="sm" color="primary" />
                          ) : (
                            (stats?.totalPlays ?? 0).toLocaleString()
                          )}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 backdrop-blur-xl">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-sm font-medium">Followers</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading || isPending ? (
                            <Spinner size="sm" color="primary" />
                          ) : (
                            stats?.communityFollowers ?? 0
                          )}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 backdrop-blur-xl">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-400 text-sm font-medium">Achievements</p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading || isPending ? (
                            <Spinner size="sm" color="primary" />
                          ) : (
                            stats?.achievementsUnlocked ?? 0
                          )}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Projects */}
                <div className="lg:col-span-2">
                  <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <GameIcon className="w-5 h-5 text-purple-400" />
                          Recent Projects
                        </h3>
                        <Button 
                          size="sm" 
                          variant="bordered" 
                          className="border-purple-500/50 text-purple-400"
                          onClick={() => handleTabChange('projects')}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardBody className="p-6 pt-0">
                      <div className="space-y-4">
                        {recentGames.map((game, index) => (
                          <motion.div
                            key={game.id}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-transparent rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <GameIcon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">{game.title}</h4>
                                <p className="text-gray-400 text-sm flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  {game.lastModified}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  game.status === "published"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : game.status === "in_review"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                }`}
                              >
                                {getStatusText(game.status)}
                              </span>
                              <Button
                                className="text-purple-400 hover:text-purple-300"
                                size="sm"
                                variant="ghost"
                              >
                                Edit
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Link href="/creator">
                          <Button
                            className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            variant="bordered"
                          >
                            Create New Game
                          </Button>
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Activity & Progress */}
                <div className="space-y-6">
                  {/* Progress Card */}
                  <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-400" />
                        Creator Progress
                      </h3>
                    </CardHeader>
                    <CardBody className="p-6 pt-0">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Level Progress</span>
                            <span className="text-purple-400">Level 3 - 65%</span>
                          </div>
                          <Progress
                            className="mb-4"
                            classNames={{
                              indicator: "bg-gradient-to-r from-purple-500 to-purple-400",
                              track: "bg-gray-700/50",
                            }}
                            color="secondary"
                            value={65}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Monthly Goals</span>
                            <span className="text-blue-400">2/3 Goals</span>
                          </div>
                          <Progress
                            className="mb-4"
                            classNames={{
                              indicator: "bg-gradient-to-r from-blue-500 to-blue-400",
                              track: "bg-gray-700/50",
                            }}
                            color="primary"
                            value={66}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Quick Links */}
                  <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                      <div className="space-y-3">
                        <Link href="/profile">
                          <Button
                            className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                            startContent={<UserGroupIcon className="w-4 h-4" />}
                            variant="ghost"
                          >
                            My Profile
                          </Button>
                        </Link>
                        <Link href="/achievements">
                          <Button
                            className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                            startContent={<TrophyIcon className="w-4 h-4" />}
                            variant="ghost"
                          >
                            Achievements
                          </Button>
                        </Link>
                        <Link href="/community">
                          <Button
                            className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                            startContent={<SparklesIcon className="w-4 h-4" />}
                            variant="ghost"
                          >
                            Community
                          </Button>
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <ActivityFeed autoRefresh={true} refreshInterval={30000} />
            </div>
          )}

          {activeTab === 'projects' && (
            <>
              {projectsError && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-4">
                  <p className="text-red-400 font-medium">Error loading projects</p>
                  <p className="text-red-300 text-sm">{projectsError}</p>
                </div>
              )}
              <ProjectGrid
                projects={projects}
                totalCount={totalCount}
                loading={projectsLoading || isPending}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onSort={handleSort}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                pageSize={12}
                searchQuery={searchQuery}
                currentFilters={currentFilters}
                currentSort={currentSort}
              />
            </>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              dashboardAnalytics={mockAnalytics}
              projectAnalytics={[]}
              loading={isPending}
              timeRange="30d"
              onTimeRangeChange={(range) => console.log('Time range changed:', range)}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateLibrary 
              onCreateFromTemplate={(templateId, projectData) => {
                console.log('Creating project from template:', templateId, projectData);
                // Handle template-based project creation
              }}
              onPreviewTemplate={(template) => {
                console.log('Previewing template:', template);
                // Handle template preview
              }}
              enableInfiniteScroll={true}
              showCreateFromGame={true}
            />
          )}

          {activeTab === 'collaborations' && (
            <CollaborationHub />
          )}

          {activeTab === 'billing' && (
            <BillingDashboard />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading || isPending}
              notificationSettings={notificationSettings || {
                email: {
                  collaborations: true,
                  socialActivity: true,
                  achievements: true,
                  billing: true,
                  system: true,
                },
                inApp: {
                  collaborations: true,
                  socialActivity: true,
                  achievements: true,
                  billing: true,
                  system: true,
                },
                push: {
                  collaborations: true,
                  socialActivity: true,
                  achievements: true,
                  billing: true,
                  system: true,
                },
              }}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDeleteNotification={handleDeleteNotification}
              onUpdateSettings={handleUpdateNotificationSettings}
              onNotificationAction={handleNotificationAction}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}