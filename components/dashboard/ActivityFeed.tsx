"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';

import {
  GameIcon,
  PlayIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  CheckIcon,
  CloudArrowUpIcon,
  TrophyIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@/components/icons';

import type { ActivityItem, ActivityType } from '@/types/dashboard';
import { useActivities } from '@/hooks/useActivities';

interface ActivityFeedProps {
  // Optional props for initial data or overrides
  initialActivities?: ActivityItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  // New props for API integration
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  project_created: {
    icon: PlusIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Created Project',
  },
  project_updated: {
    icon: GameIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Updated Project',
  },
  project_published: {
    icon: EyeIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    label: 'Published Project',
  },
  project_played: {
    icon: PlayIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Played Game',
  },
  project_liked: {
    icon: HeartIcon,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Liked Project',
  },
  project_commented: {
    icon: ChatBubbleLeftIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Commented',
  },
  collaboration_invited: {
    icon: UserPlusIcon,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    label: 'Collaboration Invite',
  },
  collaboration_accepted: {
    icon: CheckIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Joined Collaboration',
  },
  asset_uploaded: {
    icon: CloudArrowUpIcon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    label: 'Uploaded Asset',
  },
  achievement_unlocked: {
    icon: TrophyIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Achievement Unlocked',
  },
  template_used: {
    icon: SparklesIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    label: 'Used Template',
  },
};

export default function ActivityFeed({
  initialActivities,
  loading: externalLoading = false,
  onLoadMore: externalOnLoadMore,
  hasMore: externalHasMore = false,
  autoRefresh = true,
  refreshInterval = 30000,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'projects' | 'social' | 'achievements'>('all');
  
  // Get activity type filter for API
  const getActivityTypeFilter = (filter: string): ActivityType[] | undefined => {
    switch (filter) {
      case 'projects':
        return [
          'project_created',
          'project_updated',
          'project_published',
          'asset_uploaded',
        ];
      case 'social':
        return [
          'project_played',
          'project_liked',
          'project_commented',
          'collaboration_invited',
          'collaboration_accepted',
        ];
      case 'achievements':
        return [
          'achievement_unlocked',
          'template_used',
        ];
      default:
        return undefined;
    }
  };
  
  // Use the activities hook
  const {
    activities: apiActivities,
    loading: apiLoading,
    error,
    hasMore: apiHasMore,
    totalCount,
    refresh,
    loadMore: apiLoadMore,
  } = useActivities({
    type: getActivityTypeFilter(filter),
    limit: 20,
    autoRefresh,
    refreshInterval,
  });
  
  // Use external data if provided, otherwise use API data
  const activities = initialActivities || apiActivities;
  const loading = externalLoading || apiLoading;
  const hasMore = externalHasMore || apiHasMore;
  const onLoadMore = externalOnLoadMore || apiLoadMore;

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Filter activities client-side if using external data, otherwise filtering is done server-side
  const filteredActivities = initialActivities ? activities.filter(activity => {
    switch (filter) {
      case 'projects':
        return [
          'project_created',
          'project_updated',
          'project_published',
          'asset_uploaded',
        ].includes(activity.type);
      case 'social':
        return [
          'project_played',
          'project_liked',
          'project_commented',
          'collaboration_invited',
          'collaboration_accepted',
        ].includes(activity.type);
      case 'achievements':
        return [
          'achievement_unlocked',
          'template_used',
        ].includes(activity.type);
      default:
        return true;
    }
  }) : activities; // Server-side filtering when using API
  
  // Refresh data when filter changes (only for API data)
  useEffect(() => {
    if (!initialActivities) {
      refresh();
    }
  }, [filter, refresh, initialActivities]);

  const ActivityItemComponent = ({ activity }: { activity: ActivityItem }) => {
    const config = ACTIVITY_CONFIG[activity.type];
    const IconComponent = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start space-x-3 p-4 rounded-lg hover:bg-white/5 transition-colors duration-200"
      >
        {/* Activity Icon */}
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`w-5 h-5 ${config.color}`} />
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {/* User Avatar */}
            <Avatar
              src={activity.user.avatarUrl}
              name={activity.user.displayName}
              size="sm"
              className="w-6 h-6"
            />
            <span className="text-sm font-medium text-white">
              {activity.user.displayName}
            </span>
            <span className="text-sm text-gray-400">
              {config.label.toLowerCase()}
            </span>
            {activity.project && (
              <>
                <span className="text-gray-500">•</span>
                <Link 
                  href={`/creator/${activity.project.slug}`}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors truncate"
                >
                  {activity.project.title}
                </Link>
              </>
            )}
          </div>

          {/* Activity Description */}
          <p className="text-sm text-gray-300 mb-2 line-clamp-2">
            {activity.description}
          </p>

          {/* Activity Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{formatTimeAgo(activity.timestamp)}</span>
            </div>

            {/* Specific metadata based on activity type */}
            {activity.type === 'project_played' && activity.metadata?.plays_count && (
              <div className="flex items-center space-x-1">
                <PlayIcon className="w-3 h-3" />
                <span>{activity.metadata.plays_count} plays</span>
              </div>
            )}

            {activity.type === 'collaboration_invited' && activity.metadata?.collaborator_name && (
              <div className="flex items-center space-x-1">
                <UserPlusIcon className="w-3 h-3" />
                <span>to {activity.metadata.collaborator_name}</span>
              </div>
            )}

            {activity.type === 'asset_uploaded' && activity.metadata?.asset_type && (
              <Chip size="sm" variant="flat" className="text-xs">
                {activity.metadata.asset_type}
              </Chip>
            )}

            {activity.type === 'achievement_unlocked' && activity.metadata?.achievement_title && (
              <Chip size="sm" variant="flat" color="warning" className="text-xs">
                {activity.metadata.achievement_title}
              </Chip>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-purple-400" />
            Recent Activity
          </h3>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Activity Filter Tabs */}
        <div className="mb-6">
          <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => setFilter(key as any)}
            variant="bordered"
            color="primary"
          >
            <Tab key="all" title="All" />
            <Tab key="projects" title="Projects" />
            <Tab key="social" title="Social" />
            <Tab key="achievements" title="Achievements" />
          </Tabs>
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {error ? (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Unable to load activities</h4>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button
                variant="bordered"
                onClick={() => refresh()}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </div>
          ) : loading && filteredActivities.length === 0 ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : filteredActivities.length > 0 ? (
            <>
              {filteredActivities.map((activity, index) => (
                <ActivityItemComponent
                  key={`${activity.id}-${index}`}
                  activity={activity}
                />
              ))}
              
              {/* Load More Button */}
              {hasMore && onLoadMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="bordered"
                    onClick={onLoadMore}
                    disabled={loading}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  >
                    {loading ? (
                      <Spinner size="sm" />
                    ) : (
                      'Load More Activity'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No recent activity</h4>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? "Start creating and collaborating to see your activity here"
                  : `No ${filter} activity found`
                }
              </p>
              {filter === 'all' && !initialActivities && (
                <div className="mt-4">
                  <Link href="/creator">
                    <Button
                      color="primary"
                      className="bg-gradient-to-r from-purple-500 to-purple-600"
                    >
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}