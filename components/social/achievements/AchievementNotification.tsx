"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Share2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AchievementBadge } from "./AchievementBadge";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";

interface Achievement {
  id: string;
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  icon: string;
  points: number;
  unlocked_at?: string;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
  onViewAchievement?: (achievement: Achievement) => void;
  autoCloseDelay?: number;
  variant?: "toast" | "modal" | "banner";
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
  showConfetti?: boolean;
}

const RARITY_CONFIG = {
  common: {
    color: "#6B7280",
    bgGradient: "from-gray-500/20 to-gray-600/20",
    borderColor: "border-gray-500/30",
    celebrationDuration: 3000,
  },
  rare: {
    color: "#3B82F6",
    bgGradient: "from-blue-500/20 to-blue-600/20",
    borderColor: "border-blue-500/40",
    celebrationDuration: 4000,
  },
  epic: {
    color: "#8B5CF6",
    bgGradient: "from-purple-500/20 to-purple-600/20",
    borderColor: "border-purple-500/40",
    celebrationDuration: 5000,
  },
  legendary: {
    color: "#F59E0B",
    bgGradient: "from-amber-500/30 to-orange-600/30",
    borderColor: "border-amber-500/60",
    celebrationDuration: 6000,
  },
  mythic: {
    color: "#EF4444",
    bgGradient: "from-red-500/30 to-pink-600/30",
    borderColor: "border-red-500/60",
    celebrationDuration: 8000,
  },
};

const POSITION_STYLES = {
  "top-right": "top-4 right-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

export function AchievementNotification({
  achievement,
  isVisible,
  onClose,
  onShare,
  onViewAchievement,
  autoCloseDelay,
  variant = "toast",
  position = "top-right",
  showConfetti = true,
}: AchievementNotificationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const rarityConfig = RARITY_CONFIG[achievement.rarity];

  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true);

      // Auto close if delay is specified
      if (autoCloseDelay) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }

      // Auto stop celebration
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(false);
      }, rarityConfig.celebrationDuration);

      return () => clearTimeout(celebrationTimer);
    }
  }, [isVisible, autoCloseDelay, rarityConfig.celebrationDuration, onClose]);

  const handleShare = () => {
    if (onShare) {
      onShare(achievement);
    } else {
      // Default sharing behavior
      const shareText = `🏆 Achievement Unlocked: ${achievement.title}! (+${achievement.points} points) #GameGen #Achievement`;
      const shareUrl = `${window.location.origin}/achievements/${achievement.id}`;

      if (navigator.share) {
        navigator.share({
          title: `Achievement Unlocked: ${achievement.title}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success("Achievement shared to clipboard!");
      }
    }
  };

  const handleViewAchievement = () => {
    if (onViewAchievement) {
      onViewAchievement(achievement);
    }
    onClose();
  };

  const renderConfetti = () => {
    if (!showConfetti || !showCelebration) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 360, 720],
              y: [0, -100, -200],
              opacity: [0, 1, 0],
            }}
            className="absolute w-3 h-3 rounded-full"
            initial={{ scale: 0, rotate: 0, y: 0 }}
            style={{
              backgroundColor:
                i % 4 === 0
                  ? rarityConfig.color
                  : i % 4 === 1
                    ? "#FFD700"
                    : i % 4 === 2
                      ? "#FF6B6B"
                      : "#4ECDC4",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    );
  };

  const renderSparkles = () => {
    if (achievement.rarity !== "legendary" && achievement.rarity !== "mythic")
      return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={
              showCelebration
                ? {
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }
                : {}
            }
            className="absolute"
            style={{
              left: `${20 + i * 10}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: showCelebration ? 3 : 0,
            }}
          >
            <Sparkles
              className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              size={12}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  const notificationVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: variant === "banner" ? -100 : position.includes("bottom") ? 100 : -100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: position.includes("right")
        ? 100
        : position.includes("left")
          ? -100
          : 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: showCelebration ? Infinity : 0,
        ease: "easeInOut",
      },
    },
  };

  const renderToastView = () => (
    <motion.div
      animate="visible"
      className={`fixed ${POSITION_STYLES[position]} z-[9999] max-w-sm`}
      exit="exit"
      initial="hidden"
      variants={notificationVariants}
    >
      <motion.div animate="animate" initial="initial" variants={pulseVariants}>
        <GlassmorphicCard
          {...GameGenCardPresets.modalCard}
          className={`relative overflow-hidden ${rarityConfig.borderColor} border-2`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${rarityConfig.bgGradient}`}
          />

          {renderConfetti()}
          {renderSparkles()}

          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} style={{ color: rarityConfig.color }} />
                <span className="text-sm font-semibold text-foreground/80">
                  Achievement Unlocked!
                </span>
              </div>

              <Button
                isIconOnly
                className="opacity-70 hover:opacity-100"
                size="sm"
                variant="flat"
                onPress={onClose}
              >
                <X size={14} />
              </Button>
            </div>

            {/* Achievement Info */}
            <div className="flex items-center gap-3 mb-4">
              <AchievementBadge
                animated
                showRarity
                achievement={{
                  ...achievement,
                  status: "completed",
                }}
                size="lg"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-semibold">
                    +{achievement.points} points
                  </span>
                  <span className="text-xs text-foreground/60">Just now</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                color="primary"
                size="sm"
                startContent={<Share2 size={14} />}
                variant="flat"
                onPress={handleShare}
              >
                Share
              </Button>
              <Button
                className="flex-1"
                size="sm"
                startContent={<ExternalLink size={14} />}
                variant="flat"
                onPress={handleViewAchievement}
              >
                View
              </Button>
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </motion.div>
  );

  const renderModalView = () => (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        animate="visible"
        className="relative z-10 w-full max-w-md"
        exit="exit"
        initial="hidden"
        variants={notificationVariants}
      >
        <GlassmorphicCard
          {...GameGenCardPresets.modalCard}
          className={`relative overflow-hidden ${rarityConfig.borderColor} border-2`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${rarityConfig.bgGradient}`}
          />

          {renderConfetti()}
          {renderSparkles()}

          <div className="relative p-8 text-center">
            {/* Close Button */}
            <Button
              isIconOnly
              className="absolute top-4 right-4 opacity-70 hover:opacity-100"
              size="sm"
              variant="flat"
              onPress={onClose}
            >
              <X size={16} />
            </Button>

            {/* Achievement Unlocked Header */}
            <motion.div
              animate={{ scale: 1, rotate: 0 }}
              className="mb-6"
              initial={{ scale: 0, rotate: -180 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Trophy size={20} style={{ color: rarityConfig.color }} />
                <span className="font-bold text-lg">Achievement Unlocked!</span>
              </div>
            </motion.div>

            {/* Achievement Badge */}
            <div className="mb-6">
              <AchievementBadge
                animated
                showRarity
                achievement={{
                  ...achievement,
                  status: "completed",
                }}
                size="xl"
              />
            </div>

            {/* Achievement Details */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3">{achievement.title}</h2>
              <p className="text-foreground/80 mb-4">
                {achievement.description}
              </p>

              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Trophy size={16} />
                <span className="font-semibold">
                  +{achievement.points} Points Earned
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                color="primary"
                startContent={<Share2 size={18} />}
                variant="solid"
                onPress={handleShare}
              >
                Share Achievement
              </Button>
              <Button
                className="flex-1"
                startContent={<ExternalLink size={18} />}
                variant="flat"
                onPress={handleViewAchievement}
              >
                View All
              </Button>
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </motion.div>
  );

  const renderBannerView = () => (
    <motion.div
      animate="visible"
      className="fixed top-0 left-0 right-0 z-[9999]"
      exit="exit"
      initial="hidden"
      variants={notificationVariants}
    >
      <div
        className={`relative overflow-hidden ${rarityConfig.borderColor} border-b-2`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${rarityConfig.bgGradient} backdrop-blur-md`}
        />

        {renderConfetti()}

        <div className="relative p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AchievementBadge
                animated
                showRarity
                achievement={{
                  ...achievement,
                  status: "completed",
                }}
                size="md"
              />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy size={16} style={{ color: rarityConfig.color }} />
                  <span className="text-sm font-semibold">
                    Achievement Unlocked!
                  </span>
                </div>
                <h3 className="font-bold text-lg">{achievement.title}</h3>
                <p className="text-sm text-foreground/70">
                  {achievement.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm font-semibold text-primary">
                  +{achievement.points} points
                </span>
              </div>

              <Button
                color="primary"
                size="sm"
                startContent={<Share2 size={14} />}
                variant="flat"
                onPress={handleShare}
              >
                Share
              </Button>

              <Button isIconOnly size="sm" variant="flat" onPress={onClose}>
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {variant === "toast" && renderToastView()}
      {variant === "modal" && renderModalView()}
      {variant === "banner" && renderBannerView()}
    </AnimatePresence>
  );
}

export default AchievementNotification;
