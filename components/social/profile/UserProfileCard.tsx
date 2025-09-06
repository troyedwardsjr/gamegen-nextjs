"use client";

import React from "react";
import { Avatar, Button, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { CompactFollowButton } from "./FollowButton";
import { UserStats } from "./UserStats";
import { MapPin, ExternalLink, Crown, Star, Verified } from "lucide-react";
import { Database } from "@/lib/supabase/database.types";
import { UserSocialStats } from "@/src/types/social";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserProfileCardProps {
  profile: Profile;
  currentUserId?: string;
  socialStats?: UserSocialStats;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: "default" | "minimal" | "featured" | "leaderboard";
  size?: "sm" | "md" | "lg";
  showStats?: boolean;
  showFollowButton?: boolean;
  showBio?: boolean;
  interactive?: boolean;
  className?: string;
  badges?: Array<{
    type: "featured" | "verified" | "top_creator" | "early_adopter" | "staff";
    label?: string;
  }>;
}

export function UserProfileCard({
  profile,
  currentUserId,
  socialStats,
  isFollowing = false,
  onFollowChange,
  variant = "default",
  size = "md",
  showStats = true,
  showFollowButton = true,
  showBio = true,
  interactive = true,
  className,
  badges = [],
}: UserProfileCardProps) {
  const isOwnProfile = currentUserId === profile.id;
  
  const getBadgeConfig = (type: string) => {
    const configs = {
      featured: { color: "secondary", icon: Star, label: "Featured" },
      verified: { color: "success", icon: Verified, label: "Verified" },
      top_creator: { color: "warning", icon: Crown, label: "Top Creator" },
      early_adopter: { color: "primary", icon: Star, label: "Early Adopter" },
      staff: { color: "danger", icon: Crown, label: "Staff" },
    };
    return configs[type as keyof typeof configs] || configs.featured;
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "p-4",
          avatar: "w-12 h-12" as const,
          title: "text-base",
          subtitle: "text-xs",
          spacing: "gap-3",
        };
      case "lg":
        return {
          container: "p-8",
          avatar: "w-20 h-20" as const,
          title: "text-xl",
          subtitle: "text-sm",
          spacing: "gap-6",
        };
      default:
        return {
          container: "p-6",
          avatar: "w-16 h-16" as const,
          title: "text-lg",
          subtitle: "text-sm",
          spacing: "gap-4",
        };
    }
  };

  const getVariantProps = () => {
    switch (variant) {
      case "minimal":
        return { ...GameGenCardPresets.chatPanel, hover: interactive };
      case "featured":
        return { ...GameGenCardPresets.accentCard, pattern: true };
      case "leaderboard":
        return { ...GameGenCardPresets.heroCard, pattern: true };
      default:
        return { ...GameGenCardPresets.gameCard, hover: interactive };
    }
  };

  const sizeClasses = getSizeClasses();
  const variantProps = getVariantProps();

  const cardContent = (
    <GlassmorphicCard
      {...variantProps}
      className={`relative ${className}`}
    >
      <div className={`${sizeClasses.container}`}>
        {/* Header with Avatar and Basic Info */}
        <div className={`flex items-start ${sizeClasses.spacing}`}>
          <Avatar
            src={profile.avatar_url || undefined}
            name={profile.display_name || profile.username || "User"}
            size={sizeClasses.avatar}
            isBordered
            color="secondary"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-foreground truncate ${sizeClasses.title}`}>
                  {profile.display_name || profile.username}
                </h3>
                {profile.display_name && (
                  <p className={`text-foreground/60 truncate ${sizeClasses.subtitle}`}>
                    @{profile.username}
                  </p>
                )}
              </div>
              
              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {badges.slice(0, 2).map((badge, index) => {
                    const config = getBadgeConfig(badge.type);
                    const Icon = config.icon;
                    return (
                      <Chip
                        key={index}
                        size="sm"
                        variant="flat"
                        color={config.color as any}
                        startContent={<Icon size={12} />}
                        className="text-xs"
                      >
                        {badge.label || config.label}
                      </Chip>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-1 text-foreground/60 mb-2">
                <MapPin size={12} />
                <span className={`truncate ${sizeClasses.subtitle}`}>
                  {profile.location}
                </span>
              </div>
            )}
            
            {/* Bio */}
            {showBio && profile.bio && size !== "sm" && (
              <p className={`text-foreground/70 line-clamp-2 mb-3 ${sizeClasses.subtitle}`}>
                {profile.bio}
              </p>
            )}
            
            {/* Stats */}
            {showStats && socialStats && size !== "sm" && (
              <div className="mb-3">
                <UserStats stats={socialStats} variant="compact" />
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-between gap-2 mt-3">
              {interactive && (
                <Button
                  as={Link}
                  href={`/profile/${profile.id}`}
                  size="sm"
                  variant="flat"
                  color="secondary"
                  endContent={<ExternalLink size={14} />}
                >
                  View Profile
                </Button>
              )}
              
              {showFollowButton && !isOwnProfile && currentUserId && (
                <CompactFollowButton
                  targetUserId={profile.id}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  onFollowChange={onFollowChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );

  if (!interactive) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {cardContent}
    </motion.div>
  );
}

// Grid layout for multiple profile cards
interface UserProfileGridProps {
  profiles: Array<{
    profile: Profile;
    socialStats?: UserSocialStats;
    isFollowing?: boolean;
    badges?: Array<{
      type: "featured" | "verified" | "top_creator" | "early_adopter" | "staff";
      label?: string;
    }>;
  }>;
  currentUserId?: string;
  onFollowChange?: (profileId: string, isFollowing: boolean) => void;
  variant?: "default" | "minimal" | "featured" | "leaderboard";
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function UserProfileGrid({
  profiles,
  currentUserId,
  onFollowChange,
  variant = "default",
  columns = 3,
  className,
}: UserProfileGridProps) {
  const getGridClasses = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-foreground/60">No profiles found</div>
      </div>
    );
  }

  return (
    <div className={`grid ${getGridClasses()} gap-4 ${className}`}>
      {profiles.map((item, index) => (
        <UserProfileCard
          key={item.profile.id}
          profile={item.profile}
          currentUserId={currentUserId}
          socialStats={item.socialStats}
          isFollowing={item.isFollowing}
          onFollowChange={(isFollowing) => onFollowChange?.(item.profile.id, isFollowing)}
          variant={variant}
          badges={item.badges}
        />
      ))}
    </div>
  );
}

// Skeleton loader
export function UserProfileCardSkeleton({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string; 
}) {
  const sizeClasses = {
    sm: { container: "p-4", avatar: "w-12 h-12", spacing: "gap-3" },
    md: { container: "p-6", avatar: "w-16 h-16", spacing: "gap-4" },
    lg: { container: "p-8", avatar: "w-20 h-20", spacing: "gap-6" },
  }[size];

  return (
    <GlassmorphicCard {...GameGenCardPresets.gameCard} className={className}>
      <div className={sizeClasses.container}>
        <div className={`flex items-start ${sizeClasses.spacing}`}>
          <div className={`${sizeClasses.avatar} rounded-full bg-white/10 dark:bg-black/10 animate-pulse flex-shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-white/10 dark:bg-black/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 dark:bg-black/10 rounded animate-pulse w-3/4" />
            {size !== "sm" && (
              <>
                <div className="h-3 bg-white/10 dark:bg-black/10 rounded animate-pulse w-1/2" />
                <div className="flex gap-4 mt-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-6 h-4 bg-white/10 dark:bg-black/10 rounded animate-pulse mb-1" />
                      <div className="w-8 h-3 bg-white/10 dark:bg-black/10 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );
}