"use client";

import React from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { motion } from "framer-motion";
import {
  GamepadIcon,
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  Star,
  Folder,
  Upload,
  Target,
  Crown,
  Users,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { ActivityFeedItem, ActivityType } from "@/src/types/social";

interface ActivityItemProps {
  activity: ActivityFeedItem;
  currentUserId?: string;
  variant?: "default" | "compact" | "detailed";
  showInteractions?: boolean;
  className?: string;
}

export function ActivityItem({
  activity,
  currentUserId,
  variant = "default",
  showInteractions = true,
  className,
}: ActivityItemProps) {
  const isOwnActivity = currentUserId === activity.user_id;

  const getActivityIcon = (type: ActivityType) => {
    const iconMap = {
      game_created: GamepadIcon,
      game_published: Star,
      game_liked: Heart,
      game_commented: MessageCircle,
      user_followed: UserPlus,
      achievement_unlocked: Trophy,
      collection_created: Folder,
      template_shared: Upload,
      asset_uploaded: Upload,
      challenge_completed: Target,
      game_featured: Crown,
      milestone_reached: Star,
      collaboration_joined: Users,
    };

    return iconMap[type] || GamepadIcon;
  };

  const getActivityColor = (type: ActivityType) => {
    const colorMap = {
      game_created: "text-purple-500",
      game_published: "text-cyan-500",
      game_liked: "text-rose-500",
      game_commented: "text-blue-500",
      user_followed: "text-green-500",
      achievement_unlocked: "text-amber-500",
      collection_created: "text-indigo-500",
      template_shared: "text-emerald-500",
      asset_uploaded: "text-orange-500",
      challenge_completed: "text-red-500",
      game_featured: "text-yellow-500",
      milestone_reached: "text-pink-500",
      collaboration_joined: "text-teal-500",
    };

    return colorMap[type] || "text-purple-500";
  };

  const getActivityMessage = () => {
    const data = activity.activity_data as any;
    const displayName = activity.display_name || activity.username;

    switch (activity.activity_type) {
      case "game_created":
        return {
          action: `${isOwnActivity ? "You" : displayName} created`,
          target: data?.game_title || "a new game",
          targetUrl: `/games/${data?.game_id}`,
        };
      case "game_published":
        return {
          action: `${isOwnActivity ? "You" : displayName} published`,
          target: data?.game_title || "a game",
          targetUrl: `/games/${data?.game_id}`,
        };
      case "game_liked":
        return {
          action: `${isOwnActivity ? "You" : displayName} liked`,
          target: data?.game_title || "a game",
          targetUrl: `/games/${data?.game_id}`,
        };
      case "game_commented":
        return {
          action: `${isOwnActivity ? "You" : displayName} commented on`,
          target: data?.game_title || "a game",
          targetUrl: `/games/${data?.game_id}#comments`,
        };
      case "user_followed":
        return {
          action: `${isOwnActivity ? "You" : displayName} ${data?.action === "unfollow" ? "unfollowed" : "followed"}`,
          target: data?.followed_username || "someone",
          targetUrl: `/profile/${data?.followed_user_id}`,
        };
      case "achievement_unlocked":
        return {
          action: `${isOwnActivity ? "You" : displayName} unlocked`,
          target: data?.achievement_name || "an achievement",
          targetUrl: `/profile/${activity.user_id}#achievements`,
        };
      case "collection_created":
        return {
          action: `${isOwnActivity ? "You" : displayName} created a collection`,
          target: data?.collection_name || "a collection",
          targetUrl: `/collections/${data?.collection_id}`,
        };
      case "challenge_completed":
        return {
          action: `${isOwnActivity ? "You" : displayName} completed`,
          target: data?.challenge_name || "a challenge",
          targetUrl: `/challenges/${data?.challenge_id}`,
        };
      case "game_featured":
        return {
          action: `${data?.game_title || "A game"} was featured`,
          target: isOwnActivity ? "by you" : `by ${displayName}`,
          targetUrl: `/games/${data?.game_id}`,
        };
      default:
        return {
          action: `${isOwnActivity ? "You" : displayName} did something`,
          target: "interesting",
          targetUrl: null,
        };
    }
  };

  const renderActivityContent = () => {
    const message = getActivityMessage();
    const Icon = getActivityIcon(activity.activity_type);
    const iconColor = getActivityColor(activity.activity_type);

    if (variant === "compact") {
      return (
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-1.5 rounded-lg bg-white/5 dark:bg-black/5 flex-shrink-0`}
            >
              <Icon className={iconColor} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{message.action}</span>
                {message.targetUrl ? (
                  <Link
                    className="text-secondary-500 hover:text-secondary-600 ml-1"
                    href={message.targetUrl}
                    size="sm"
                  >
                    {message.target}
                  </Link>
                ) : (
                  <span className="text-foreground/70 ml-1">
                    {message.target}
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Avatar
            as={Link}
            className="flex-shrink-0"
            href={`/profile/${activity.user_id}`}
            name={activity.display_name || activity.username}
            size={variant === "detailed" ? "lg" : "md"}
            src={activity.avatar_url || undefined}
          />

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-white/5 dark:bg-black/5`}>
                <Icon className={iconColor} size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-foreground">
                  <Link
                    className="font-semibold hover:text-secondary-500"
                    href={`/profile/${activity.user_id}`}
                  >
                    {isOwnActivity
                      ? "You"
                      : activity.display_name || activity.username}
                  </Link>
                  <span className="text-foreground/80 ml-1">
                    {message.action}
                  </span>
                  {message.targetUrl ? (
                    <Link
                      className="text-secondary-500 hover:text-secondary-600 ml-1 font-medium"
                      href={message.targetUrl}
                    >
                      {message.target}
                    </Link>
                  ) : (
                    <span className="text-foreground/70 ml-1 font-medium">
                      {message.target}
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <time className="text-sm text-foreground/50 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </time>

                  {activity.activity_type === "achievement_unlocked" && (
                    <Chip
                      color="warning"
                      size="sm"
                      startContent={<Trophy size={12} />}
                      variant="flat"
                    >
                      +{(activity.activity_data as any)?.points_earned || 0} pts
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Activity Data */}
            {variant === "detailed" && activity.activity_data && (
              <div className="mt-3 p-3 rounded-lg bg-white/5 dark:bg-black/5">
                {activity.activity_type === "game_created" && (
                  <div>
                    <p className="text-sm text-foreground/70 mb-2">
                      Game Details:
                    </p>
                    <p className="text-sm">
                      <strong>Type:</strong>{" "}
                      {(activity.activity_data as any)?.game_type}
                    </p>
                    {(activity.activity_data as any)?.is_first_game && (
                      <Chip
                        className="mt-2"
                        color="success"
                        size="sm"
                        variant="flat"
                      >
                        First Game! 🎉
                      </Chip>
                    )}
                  </div>
                )}

                {activity.activity_type === "achievement_unlocked" && (
                  <div>
                    <p className="text-sm text-foreground/70 mb-2">
                      Achievement:
                    </p>
                    <p className="text-sm">
                      <strong>Points Earned:</strong>{" "}
                      {(activity.activity_data as any)?.points_earned || 0}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Interactions */}
            {showInteractions && !isOwnActivity && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  color="secondary"
                  size="sm"
                  startContent={<Heart size={14} />}
                  variant="flat"
                >
                  Like
                </Button>

                <Button
                  color="secondary"
                  size="sm"
                  startContent={<MessageCircle size={14} />}
                  variant="flat"
                >
                  Comment
                </Button>

                {message.targetUrl && (
                  <Button
                    as={Link}
                    color="secondary"
                    href={message.targetUrl}
                    size="sm"
                    startContent={<ExternalLink size={14} />}
                    variant="flat"
                  >
                    View
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className={className}
      transition={{ duration: 0.2 }}
      whileHover={
        variant !== "compact"
          ? { backgroundColor: "rgba(255, 255, 255, 0.02)" }
          : undefined
      }
    >
      {renderActivityContent()}
    </motion.div>
  );
}

// Activity item skeleton loader
export function ActivityItemSkeleton({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact" | "detailed";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div className={`p-3 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 dark:bg-black/10 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 dark:bg-black/10 rounded animate-pulse" />
            <div className="h-3 bg-white/10 dark:bg-black/10 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const avatarSize = variant === "detailed" ? "w-12 h-12" : "w-10 h-10";

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div
          className={`${avatarSize} rounded-full bg-white/10 dark:bg-black/10 animate-pulse flex-shrink-0`}
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-white/10 dark:bg-black/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 dark:bg-black/10 rounded animate-pulse" />
              <div className="h-3 bg-white/10 dark:bg-black/10 rounded animate-pulse w-3/4" />
            </div>
          </div>
          {variant === "detailed" && (
            <div className="h-12 bg-white/5 dark:bg-black/5 rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
