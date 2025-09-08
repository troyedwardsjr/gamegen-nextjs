"use client";

import React, { useState } from "react";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Crown,
  Target,
  Award,
  Calendar,
  Info,
  Share2,
  Check,
} from "lucide-react";

import { AchievementBadge } from "./AchievementBadge";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";

export type AchievementType =
  | "gameplay"
  | "creation"
  | "social"
  | "milestone"
  | "special";
export type AchievementRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";
export type AchievementStatus = "locked" | "in_progress" | "completed";

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  status: AchievementStatus;
  icon: string;
  progress?: {
    current: number;
    target: number;
    unit?: string;
  };
  unlocked_at?: string | null;
  points: number;
  secret?: boolean;
  prerequisites?: string[];
  category?: string;
  metadata?: {
    game_id?: string;
    action_type?: string;
    threshold?: number;
  };
}

interface AchievementCardProps {
  achievement: Achievement;
  variant?: "default" | "compact" | "minimal" | "showcase";
  showProgress?: boolean;
  showActions?: boolean;
  className?: string;
  onClick?: (achievement: Achievement) => void;
  onShare?: (achievement: Achievement) => void;
}

const ACHIEVEMENT_ICONS = {
  first_game: Trophy,
  game_played: Star,
  games_created: Crown,
  likes_received: Target,
  community_member: Award,
} as const;

const RARITY_CONFIG = {
  common: {
    color: "#6B7280",
    bgColor: "from-gray-500/20 to-gray-600/20",
    borderColor: "border-gray-500/30",
    label: "Common",
    points: 10,
  },
  rare: {
    color: "#3B82F6",
    bgColor: "from-blue-500/20 to-blue-600/20",
    borderColor: "border-blue-500/30",
    label: "Rare",
    points: 25,
  },
  epic: {
    color: "#8B5CF6",
    bgColor: "from-purple-500/20 to-purple-600/20",
    borderColor: "border-purple-500/30",
    label: "Epic",
    points: 50,
  },
  legendary: {
    color: "#F59E0B",
    bgColor: "from-amber-500/20 to-orange-600/20",
    borderColor: "border-amber-500/30",
    label: "Legendary",
    points: 100,
  },
  mythic: {
    color: "#EF4444",
    bgColor: "from-red-500/20 to-pink-600/20",
    borderColor: "border-red-500/30",
    label: "Mythic",
    points: 250,
  },
};

export function AchievementCard({
  achievement,
  variant = "default",
  showProgress = true,
  showActions = true,
  className,
  onClick,
  onShare,
}: AchievementCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const IconComponent =
    ACHIEVEMENT_ICONS[achievement.icon as keyof typeof ACHIEVEMENT_ICONS] ||
    Trophy;
  const isCompleted = achievement.status === "completed";
  const isLocked = achievement.status === "locked";
  const progressPercentage = achievement.progress
    ? (achievement.progress.current / achievement.progress.target) * 100
    : 0;

  const cardVariants = {
    hover: {
      scale: variant === "compact" ? 1.02 : 1.03,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  const handleClick = () => {
    onClick?.(achievement);
  };

  const handleShare = () => {
    onShare?.(achievement);
  };

  const renderMinimalView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
        <AchievementBadge
          achievement={achievement}
          showRarity={false}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium text-sm truncate ${isLocked ? "text-foreground/50" : ""}`}
          >
            {achievement.secret && isLocked ? "???" : achievement.title}
          </h4>

          {achievement.progress && showProgress && (
            <div className="mt-1">
              <Progress
                className="max-w-[120px]"
                color={isCompleted ? "success" : "primary"}
                size="sm"
                value={progressPercentage}
              />
            </div>
          )}
        </div>

        {isCompleted && (
          <motion.div
            animate={{ scale: 1, rotate: 0 }}
            initial={{ scale: 0, rotate: -180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Check className="w-4 h-4 text-success" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderCompactView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
    >
      <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <AchievementBadge
              achievement={achievement}
              showRarity={true}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={`font-semibold text-sm truncate ${isLocked ? "text-foreground/50" : ""}`}
                >
                  {achievement.secret && isLocked
                    ? "Secret Achievement"
                    : achievement.title}
                </h4>

                <Chip
                  className="text-xs"
                  color={
                    rarityConfig.color === "#6B7280" ? "default" : "primary"
                  }
                  size="sm"
                  variant="flat"
                >
                  {achievement.points} pts
                </Chip>
              </div>

              <p
                className={`text-xs text-foreground/70 line-clamp-1 ${isLocked ? "text-foreground/40" : ""}`}
              >
                {achievement.secret && isLocked
                  ? "Complete the prerequisites to reveal this achievement"
                  : achievement.description}
              </p>

              {achievement.progress && showProgress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-foreground/60 mb-1">
                    <span>Progress</span>
                    <span>
                      {achievement.progress.current} /{" "}
                      {achievement.progress.target}
                      {achievement.progress.unit &&
                        ` ${achievement.progress.unit}`}
                    </span>
                  </div>
                  <Progress
                    className="w-full"
                    color={isCompleted ? "success" : "primary"}
                    size="sm"
                    value={progressPercentage}
                  />
                </div>
              )}
            </div>

            {isCompleted && (
              <motion.div
                animate={{ scale: 1, rotate: 0 }}
                initial={{ scale: 0, rotate: -180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Check className="w-5 h-5 text-success" />
              </motion.div>
            )}
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );

  const renderShowcaseView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${rarityConfig.bgColor} opacity-50`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent`}
        />

        <GlassmorphicCard
          {...GameGenCardPresets.gameCard}
          className={`relative ${rarityConfig.borderColor} border-2`}
        >
          <div className="p-6 text-center">
            {/* Rarity Badge */}
            <div className="absolute top-3 right-3">
              <Chip
                className="text-white font-semibold"
                size="sm"
                style={{ backgroundColor: rarityConfig.color }}
                variant="solid"
              >
                {rarityConfig.label}
              </Chip>
            </div>

            {/* Achievement Badge - Large */}
            <div className="mb-4">
              <AchievementBadge
                achievement={achievement}
                animated={isCompleted}
                showRarity={false}
                size="xl"
              />
            </div>

            {/* Title and Description */}
            <h3
              className={`text-lg font-bold mb-2 ${isLocked ? "text-foreground/50" : ""}`}
            >
              {achievement.secret && isLocked
                ? "Secret Achievement"
                : achievement.title}
            </h3>

            <p
              className={`text-sm text-foreground/70 mb-4 ${isLocked ? "text-foreground/40" : ""}`}
            >
              {achievement.secret && isLocked
                ? "Complete the prerequisites to reveal this achievement"
                : achievement.description}
            </p>

            {/* Progress */}
            {achievement.progress && showProgress && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-foreground/70 mb-2">
                  <span>Progress</span>
                  <span>
                    {achievement.progress.current} /{" "}
                    {achievement.progress.target}
                    {achievement.progress.unit &&
                      ` ${achievement.progress.unit}`}
                  </span>
                </div>
                <Progress
                  className="w-full"
                  color={isCompleted ? "success" : "primary"}
                  size="md"
                  value={progressPercentage}
                />
              </div>
            )}

            {/* Points and Status */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Chip
                color="warning"
                startContent={<Trophy size={14} />}
                variant="flat"
              >
                {achievement.points} Points
              </Chip>

              {achievement.unlocked_at && (
                <Chip
                  className="text-xs"
                  color="default"
                  startContent={<Calendar size={14} />}
                  variant="flat"
                >
                  Unlocked{" "}
                  {new Date(achievement.unlocked_at).toLocaleDateString()}
                </Chip>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex justify-center gap-2">
                {isCompleted && (
                  <Button
                    size="sm"
                    startContent={<Share2 size={14} />}
                    variant="flat"
                    onPress={handleShare}
                  >
                    Share
                  </Button>
                )}

                <Button
                  size="sm"
                  startContent={<Info size={14} />}
                  variant="flat"
                  onPress={() => setShowDetails(!showDetails)}
                >
                  Details
                </Button>
              </div>
            )}

            {/* Details Panel */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-white/10"
                  exit={{ opacity: 0, height: 0 }}
                  initial={{ opacity: 0, height: 0 }}
                >
                  <div className="text-left space-y-2 text-sm text-foreground/70">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {achievement.type}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {achievement.category || "General"}
                    </div>
                    {achievement.prerequisites &&
                      achievement.prerequisites.length > 0 && (
                        <div>
                          <span className="font-medium">Prerequisites:</span>
                          <div className="mt-1 space-y-1">
                            {achievement.prerequisites.map((prereq, index) => (
                              <div
                                key={index}
                                className="text-xs bg-background/50 rounded px-2 py-1"
                              >
                                {prereq}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassmorphicCard>
      </div>
    </motion.div>
  );

  const renderDefaultView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
    >
      <GlassmorphicCard
        {...GameGenCardPresets.gameCard}
        className={isCompleted ? `${rarityConfig.borderColor} border` : ""}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Achievement Badge */}
            <div className="flex-shrink-0">
              <AchievementBadge
                achievement={achievement}
                animated={isCompleted}
                showRarity={true}
                size="lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3
                    className={`font-semibold text-lg ${isLocked ? "text-foreground/50" : ""}`}
                  >
                    {achievement.secret && isLocked
                      ? "Secret Achievement"
                      : achievement.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: `${rarityConfig.color}20`,
                        color: rarityConfig.color,
                      }}
                      variant="flat"
                    >
                      {rarityConfig.label}
                    </Chip>

                    <Chip
                      color="warning"
                      size="sm"
                      startContent={<Trophy size={12} />}
                      variant="flat"
                    >
                      {achievement.points} pts
                    </Chip>

                    {achievement.unlocked_at && (
                      <Tooltip
                        content={`Unlocked on ${new Date(achievement.unlocked_at).toLocaleDateString()}`}
                      >
                        <Calendar className="w-4 h-4 text-foreground/50" />
                      </Tooltip>
                    )}
                  </div>
                </div>

                {isCompleted && (
                  <motion.div
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex-shrink-0"
                    initial={{ scale: 0, rotate: -180 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  >
                    <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-success" />
                    </div>
                  </motion.div>
                )}
              </div>

              <p
                className={`text-foreground/70 mb-4 ${isLocked ? "text-foreground/40" : ""}`}
              >
                {achievement.secret && isLocked
                  ? "Complete the prerequisites to reveal this achievement"
                  : achievement.description}
              </p>

              {/* Progress Bar */}
              {achievement.progress && showProgress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-foreground/70 mb-2">
                    <span>Progress</span>
                    <span>
                      {achievement.progress.current.toLocaleString()} /{" "}
                      {achievement.progress.target.toLocaleString()}
                      {achievement.progress.unit &&
                        ` ${achievement.progress.unit}`}
                    </span>
                  </div>
                  <Progress
                    className="w-full"
                    color={isCompleted ? "success" : "primary"}
                    size="md"
                    value={progressPercentage}
                  />
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Share2 size={14} />}
                      variant="flat"
                      onPress={handleShare}
                    >
                      Share Achievement
                    </Button>
                  )}

                  <Button
                    size="sm"
                    startContent={<Info size={14} />}
                    variant="flat"
                    onPress={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Hide" : "Show"} Details
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-white/10"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Type:</span>
                    <span className="ml-2 capitalize">{achievement.type}</span>
                  </div>
                  <div>
                    <span className="text-foreground/60">Category:</span>
                    <span className="ml-2">
                      {achievement.category || "General"}
                    </span>
                  </div>

                  {achievement.prerequisites &&
                    achievement.prerequisites.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-foreground/60 block mb-2">
                          Prerequisites:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {achievement.prerequisites.map((prereq, index) => (
                            <Chip key={index} size="sm" variant="flat">
                              {prereq}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );

  // Render based on variant
  switch (variant) {
    case "minimal":
      return renderMinimalView();
    case "compact":
      return renderCompactView();
    case "showcase":
      return renderShowcaseView();
    default:
      return renderDefaultView();
  }
}

export default AchievementCard;
