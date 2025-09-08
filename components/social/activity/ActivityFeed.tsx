"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";

import { ActivityItem } from "./ActivityItem";
import { ActivityFilters } from "./ActivityFilters";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import {
  ActivityFeedItem,
  ActivityType,
  ActivityVisibility,
} from "@/src/types/social";
import { useInfiniteScroll } from "@/src/hooks/useInfiniteScroll";

interface ActivityFeedProps {
  userId: string;
  feedType?: "personal" | "following" | "discover" | "global";
  filters?: {
    activityTypes?: ActivityType[];
    visibility?: ActivityVisibility[];
    dateRange?: { from: Date; to: Date };
  };
  showFilters?: boolean;
  showRefresh?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const ITEMS_PER_PAGE = 20;

export function ActivityFeed({
  userId,
  feedType = "personal",
  filters,
  showFilters = true,
  showRefresh = true,
  maxItems = 100,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  className,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filters);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchActivities = useCallback(
    async (offset = 0, reset = false) => {
      try {
        if (offset === 0 && reset) {
          setLoading(true);
          setError(null);
        }

        let query = (supabase as any).rpc("get_user_activity_feed", {
          user_id: userId,
          limit_count: ITEMS_PER_PAGE,
          offset_count: offset,
        });

        const { data, error } = await query;

        if (error) throw error;

        const newActivities = data || [];

        if (reset || offset === 0) {
          setActivities(newActivities);
        } else {
          setActivities((prev) => [...prev, ...newActivities]);
        }

        setHasMore(
          newActivities.length === ITEMS_PER_PAGE &&
            activities.length + newActivities.length < maxItems,
        );
      } catch (error) {
        console.error("Error fetching activities:", error);
        setError("Failed to load activities");
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, supabase, maxItems, activities.length],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(activities.length, false);
    }
  }, [fetchActivities, loading, hasMore, activities.length]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchActivities(0, true);
  };

  const applyFilters = (newFilters: typeof filters) => {
    setActiveFilters(newFilters);
    // In a real implementation, this would refetch with the new filters
    refresh();
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchActivities(0, true);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, refreshing, fetchActivities]);

  // Initial load
  useEffect(() => {
    fetchActivities(0, true);
  }, [userId, feedType, activeFilters]);

  // Setup infinite scroll
  const { scrollRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    threshold: 200,
  });

  const getFeedTitle = () => {
    switch (feedType) {
      case "following":
        return "Following Activity";
      case "discover":
        return "Discover";
      case "global":
        return "Global Activity";
      default:
        return "Your Activity";
    }
  };

  const getFeedDescription = () => {
    switch (feedType) {
      case "following":
        return "See what creators you follow are up to";
      case "discover":
        return "Discover trending games and creators";
      case "global":
        return "See what's happening across GameGen";
      default:
        return "Your recent activity and achievements";
    }
  };

  if (error) {
    return (
      <GlassmorphicCard
        {...GameGenCardPresets.floatingPanel}
        className={className}
      >
        <div className="p-8 text-center">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button color="secondary" variant="flat" onPress={refresh}>
            Try Again
          </Button>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Feed Header */}
      <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {getFeedTitle()}
              </h2>
              <p className="text-sm text-foreground/70">
                {getFeedDescription()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {showFilters && (
                <Button
                  color="secondary"
                  size="sm"
                  startContent={<Filter size={16} />}
                  variant="flat"
                  onPress={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  Filters
                </Button>
              )}

              {showRefresh && (
                <Button
                  isIconOnly
                  color="secondary"
                  isLoading={refreshing}
                  size="sm"
                  variant="flat"
                  onPress={refresh}
                >
                  <RefreshCw
                    className={refreshing ? "animate-spin" : ""}
                    size={16}
                  />
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFiltersPanel && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Divider className="my-4" />
                <ActivityFilters
                  initialFilters={activeFilters}
                  onFiltersChange={applyFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassmorphicCard>

      {/* Activity Feed */}
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel}>
        <div ref={scrollRef} className="max-h-screen overflow-y-auto">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner color="secondary" size="lg" />
              <p className="ml-3 text-foreground/70">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-foreground/50 mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Filter size={24} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Activities Found
              </h3>
              <p className="text-foreground/60 mb-4">
                {feedType === "following"
                  ? "Follow some creators to see their activities here"
                  : "Start creating games and interacting with the community!"}
              </p>
              {feedType === "following" && (
                <Button
                  as="a"
                  color="secondary"
                  href="/discover"
                  variant="flat"
                >
                  Discover Creators
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-divider">
              <AnimatePresence mode="popLayout">
                {activities.map((activity, index) => (
                  <motion.div
                    key={`${activity.id}-${index}`}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                  >
                    <ActivityItem
                      activity={activity}
                      currentUserId={userId}
                      showInteractions={feedType !== "personal"}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More Indicator */}
          {hasMore && activities.length > 0 && (
            <div className="p-6 text-center">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner color="secondary" size="md" />
                  <p className="ml-3 text-foreground/70">Loading more...</p>
                </div>
              ) : (
                <Button color="secondary" variant="flat" onPress={loadMore}>
                  Load More
                </Button>
              )}
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && activities.length > 0 && (
            <div className="p-6 text-center">
              <p className="text-foreground/50 text-sm">
                You've reached the end of your feed
              </p>
            </div>
          )}
        </div>
      </GlassmorphicCard>
    </div>
  );
}

// Compact activity feed for sidebars or widgets
interface CompactActivityFeedProps {
  userId: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function CompactActivityFeed({
  userId,
  limit = 5,
  showHeader = true,
  className,
}: CompactActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "get_user_activity_feed",
          {
            user_id: userId,
            limit_count: limit,
            offset_count: 0,
          },
        );

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, [userId, limit, supabase]);

  return (
    <GlassmorphicCard {...GameGenCardPresets.chatPanel} className={className}>
      {showHeader && (
        <div className="p-4 border-b border-divider">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
      )}

      <div className="divide-y divide-divider">
        {loading ? (
          <div className="p-4 text-center">
            <Spinner color="secondary" size="sm" />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-sm text-foreground/60">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              currentUserId={userId}
              showInteractions={false}
              variant="compact"
            />
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="p-4 border-t border-divider">
          <Button
            as="a"
            className="w-full"
            color="secondary"
            href="/dashboard/activity"
            size="sm"
            variant="flat"
          >
            View All Activity
          </Button>
        </div>
      )}
    </GlassmorphicCard>
  );
}
