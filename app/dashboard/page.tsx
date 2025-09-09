"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import Link from "next/link";

// Dashboard Components
import ProjectGrid from "@/components/dashboard/ProjectGrid";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

// Hooks
import { useDashboardProjects } from "@/hooks/useDashboardProjects";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useNotifications } from "@/hooks/useNotifications";

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
  Cog6ToothIcon,
  HomeIcon,
  FolderIcon,
  TemplateIcon,
  UsersIcon,
  CreditCardIcon,
  BackupIcon,
} from "@/components/icons";

import type {
  DashboardStats,
  ProjectGridItem,
  ActivityItem,
  GameTemplate,
  DashboardAnalytics,
  ProjectAnalytics,
  Notification,
  NotificationSettings,
  ProjectFilter,
  ProjectSort,
} from "@/types/dashboard";

interface RecentGame {
  id: string;
  title: string;
  lastModified: string;
  thumbnail?: string;
  status: "draft" | "published" | "in_review";
}

export default function EnhancedDashboardPage() {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Real data hooks
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  
  // Real notifications hook
  const {
    notifications,
    unreadCount,
    notificationSettings,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotificationSettings,
    handleNotificationAction,
  } = useNotifications();
  
  const {
    projects,
    totalCount,
    loading: projectsLoading,
    error: projectsError,
    setPage: setCurrentPage,
    setSearch: setSearchQuery,
    setFilters: setCurrentFilters,
    setSort: setCurrentSort,
    currentPage,
    currentSearch: searchQuery,
    currentFilters,
    currentSort,
  } = useDashboardProjects();

  // Get recent games for overview tab (first 3 projects)
  const recentGames: RecentGame[] = projects.slice(0, 3).map(project => ({
    id: project.id,
    title: project.title,
    lastModified: formatRelativeTime(project.lastModified),
    status: getGameStatus(project),
    thumbnail: project.thumbnail_url || undefined,
  }));

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
    // Map project status to RecentGame status
    if (project.status === 'published') return 'published';
    if (project.status === 'in_development' || project.status === 'testing') return 'in_review';
    return 'draft';
  }

  // Mock Activity Data
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'project_published',
      title: 'Project Published',
      description: 'Your game "Pixel Adventure Quest" has been successfully published and is now live!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { id: 'user1', displayName: 'You', avatarUrl: '/api/placeholder/40/40' },
      project: { id: '1', title: 'Pixel Adventure Quest', slug: 'pixel-adventure-quest' },
    },
    {
      id: '2',
      type: 'project_liked',
      title: 'Project Liked',
      description: 'GameMaster42 liked your project "Space Shooter Deluxe"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { id: 'user2', displayName: 'GameMaster42', avatarUrl: '/api/placeholder/40/40' },
      project: { id: '2', title: 'Space Shooter Deluxe', slug: 'space-shooter-deluxe' },
    },
    {
      id: '3',
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked',
      description: 'You earned the "Creator" achievement for publishing your first game!',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { id: 'user1', displayName: 'You', avatarUrl: '/api/placeholder/40/40' },
      metadata: { achievement_title: 'First Publisher' },
    },
  ];

  // Templates Data - now loaded from API
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Load templates data
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        // Import the API function dynamically to avoid SSR issues
        const { getFeaturedTemplates } = await import('@/lib/api/templates');
        const data = await getFeaturedTemplates(6); // Get 6 featured templates for QuickActions
        setTemplates(data.templates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        // Fallback to mock data if API fails
        setTemplates([{
          id: 'template1',
          title: 'Platformer Starter',
          description: 'A basic platformer template with character movement and level design',
          category: 'official',
          gameType: 'platformer',
          difficulty: 'beginner',
          thumbnailUrl: '/api/placeholder/300/200',
          screenshots: [],
          tags: ['platformer', 'starter', 'beginner'],
          usageCount: 1247,
          rating: 4.5,
          ratingCount: 89,
          author: { id: 'gamegen', displayName: 'GameGen Team', avatarUrl: '/api/placeholder/40/40' },
          isOfficial: true,
          isFeatured: true,
          estimatedTimeToComplete: 30,
          features: ['Character Movement', 'Level System', 'Collision Detection'],
          requirements: ['Basic Game Logic'],
          gameConfig: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Mock Analytics Data
  const mockAnalytics: DashboardAnalytics = {
    userId: 'user1',
    overview: {
      totalProjects: 15,
      publishedProjects: 8,
      totalPlays: 12847,
      totalLikes: 389,
      followerCount: 142,
      creditsUsed: 1200,
    },
    projectPerformance: {
      topProjects: [
        { projectId: '1', title: 'Pixel Adventure Quest', plays: 1247, growth: 23.5 },
        { projectId: '2', title: 'Space Shooter Deluxe', plays: 542, growth: 15.2 },
        { projectId: '3', title: 'Puzzle Master', plays: 201, growth: -5.3 },
      ],
      recentTrends: [],
    },
    engagement: {
      communityActivity: { likes: 389, comments: 156, shares: 42, followers: 142 },
      collaborations: { active: 3, pending: 2, completed: 5 },
    },
    usage: {
      creditsUsage: [],
      featureUsage: {},
    },
  };



  // Event Handlers - now using real API calls
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (filters: ProjectFilter) => {
    setCurrentFilters(filters);
  };

  const handleSort = (sort: ProjectSort) => {
    setCurrentSort(sort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateFromTemplate = async (templateId: string, projectData: { title: string; description: string }) => {
    try {
      // Import the API function dynamically
      const { useTemplate } = await import('@/lib/api/templates');
      
      // Record template usage
      await useTemplate(templateId, {
        usageType: 'create_project',
        metadata: {
          projectTitle: projectData.title,
          projectDescription: projectData.description,
        },
      });

      // TODO: Create actual game project from template
      // For now, redirect to creator with template data
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Store template data in localStorage for creator to use
        localStorage.setItem('selectedTemplate', JSON.stringify({
          templateId,
          templateTitle: template.title,
          projectTitle: projectData.title,
          projectDescription: projectData.description,
          gameConfig: template.gameConfig,
        }));
        
        window.location.href = '/creator?template=' + templateId;
      } else {
        window.location.href = '/creator';
      }
    } catch (error) {
      console.error('Failed to create project from template:', error);
      // Fallback to creator without template
      window.location.href = '/creator';
    }
  };

  const handleCreateBlank = () => {
    window.location.href = '/creator';
  };

  const handleImportProject = (file: File) => {
    // In real app, handle file upload and project import
    console.log('Importing project:', file.name);
  };

  // Wrapper functions to match NotificationCenter component expectations
  const handleMarkAsReadWrapper = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsReadWrapper = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotificationWrapper = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleUpdateNotificationSettingsWrapper = async (settings: NotificationSettings) => {
    await updateNotificationSettings(settings);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "in_review":
        return "warning";
      case "draft":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "in_review":
        return "In Review";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
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
            onSelectionChange={setActiveTab as any}
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
                        <p className="text-purple-400 text-sm font-medium">
                          Games Created
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? (
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
                        <p className="text-blue-400 text-sm font-medium">
                          Total Plays
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? (
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
                        <p className="text-green-400 text-sm font-medium">
                          Followers
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? (
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
                        <p className="text-yellow-400 text-sm font-medium">
                          Achievements
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {statsLoading ? (
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
                        <Link href="#" onClick={() => setActiveTab('projects')}>
                          <Button size="sm" variant="bordered" className="border-purple-500/50 text-purple-400">
                            View All
                          </Button>
                        </Link>
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
                                <h4 className="text-white font-semibold">
                                  {game.title}
                                </h4>
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
                              indicator:
                                "bg-gradient-to-r from-purple-500 to-purple-400",
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
                      <h3 className="text-lg font-bold text-white mb-4">
                        Quick Links
                      </h3>
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
              <ActivityFeed
                autoRefresh={true}
                refreshInterval={30000}
              />
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
                loading={projectsLoading}
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
              loading={loading}
              timeRange="30d"
              onTimeRangeChange={(range) => console.log('Time range changed:', range)}
            />
          )}

          {activeTab === 'templates' && (
            <div className="text-center py-12">
              <SparklesIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Template Library</h3>
              <p className="text-gray-400 mb-6">
                Browse and use our extensive collection of game templates
              </p>
              <Link href="/templates">
                <Button
                  size="lg"
                  color="primary"
                  className="bg-gradient-to-r from-purple-500 to-purple-600"
                >
                  Explore Templates
                </Button>
              </Link>
            </div>
          )}

          {activeTab === 'collaborations' && (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Collaboration Hub</h3>
              <p className="text-gray-400 mb-6">
                Manage your collaborations, invites, and team projects
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  size="lg"
                  color="primary"
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  View Collaborations
                </Button>
                <Button
                  size="lg"
                  variant="bordered"
                  className="border-blue-500/50 text-blue-400"
                >
                  Send Invite
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="text-center py-12">
              <CreditCardIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Billing & Usage</h3>
              <p className="text-gray-400 mb-6">
                Monitor your usage, manage your subscription, and view invoices
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
                  <CardBody className="p-6 text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">Credits Remaining</h4>
                    <p className="text-3xl font-bold text-green-400">
                      {statsLoading ? (
                        <Spinner size="sm" color="primary" />
                      ) : (
                        (stats?.creditsRemaining ?? 0).toLocaleString()
                      )}
                    </p>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20">
                  <CardBody className="p-6 text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">Plan</h4>
                    <p className="text-2xl font-bold text-blue-400">Pro</p>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20">
                  <CardBody className="p-6 text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">Usage This Month</h4>
                    <p className="text-2xl font-bold text-purple-400">
                      {statsLoading ? (
                        <Spinner size="sm" color="primary" />
                      ) : (
                        (stats?.creditsUsed ?? 0).toLocaleString()
                      )}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              notificationSettings={notificationSettings}
              onMarkAsRead={handleMarkAsReadWrapper}
              onMarkAllAsRead={handleMarkAllAsReadWrapper}
              onDeleteNotification={handleDeleteNotificationWrapper}
              onUpdateSettings={handleUpdateNotificationSettingsWrapper}
              onNotificationAction={handleNotificationAction}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}