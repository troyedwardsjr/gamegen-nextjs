"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Heart, Trophy, GamepadIcon, Target, Star } from "lucide-react";

import { UserSocialStats } from "@/src/types/social";

interface UserStatsProps {
  stats: UserSocialStats;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function UserStats({
  stats,
  className,
  variant = "default",
}: UserStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }

    return num.toString();
  };

  const statItems = [
    {
      icon: GamepadIcon,
      label: "Games",
      value: formatNumber(stats.games_created),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      key: "games_created",
    },
    {
      icon: Users,
      label: "Followers",
      value: formatNumber(stats.followers_count),
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      key: "followers_count",
    },
    {
      icon: Heart,
      label: "Likes",
      value: formatNumber(stats.total_likes_received),
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      key: "total_likes_received",
    },
    {
      icon: Trophy,
      label: "Achievements",
      value: formatNumber(stats.total_achievements),
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      key: "total_achievements",
    },
    {
      icon: Target,
      label: "Challenges",
      value: formatNumber(stats.challenges_completed),
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      key: "challenges_completed",
    },
    {
      icon: Star,
      label: "Following",
      value: formatNumber(stats.following_count),
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      key: "following_count",
    },
  ];

  if (variant === "compact") {
    return (
      <div className={`flex gap-4 ${className}`}>
        {statItems.slice(0, 4).map((item, index) => (
          <motion.div
            key={item.key}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-lg font-bold text-foreground">
              {item.value}
            </div>
            <div className="text-xs text-foreground/60">{item.label}</div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-4 ${className}`}>
        {statItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-black/10"
              initial={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={item.color} size={20} />
                </div>
                <span className="text-foreground/80">{item.label}</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                {item.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`grid grid-cols-3 md:grid-cols-6 gap-4 ${className}`}>
      {statItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.key}
            animate={{ opacity: 1, y: 0 }}
            className="text-center group"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={`
              inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2 
              ${item.bgColor} 
              group-hover:scale-110 transition-transform duration-200
            `}
            >
              <Icon className={item.color} size={20} />
            </div>
            <div className="text-lg font-bold text-foreground">
              {item.value}
            </div>
            <div className="text-xs text-foreground/60">{item.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Skeleton loader for stats
export function UserStatsSkeleton({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact" | "detailed";
  className?: string;
}) {
  const count = variant === "compact" ? 4 : 6;

  if (variant === "detailed") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/10 dark:bg-black/10 animate-pulse" />
              <div className="w-20 h-4 rounded bg-white/10 dark:bg-black/10 animate-pulse" />
            </div>
            <div className="w-12 h-6 rounded bg-white/10 dark:bg-black/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="text-center">
            <div className="w-8 h-6 rounded bg-white/10 dark:bg-black/10 animate-pulse mb-1" />
            <div className="w-12 h-3 rounded bg-white/10 dark:bg-black/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 md:grid-cols-6 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-black/10 animate-pulse mb-2 mx-auto" />
          <div className="w-8 h-5 rounded bg-white/10 dark:bg-black/10 animate-pulse mb-1 mx-auto" />
          <div className="w-12 h-3 rounded bg-white/10 dark:bg-black/10 animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );
}
