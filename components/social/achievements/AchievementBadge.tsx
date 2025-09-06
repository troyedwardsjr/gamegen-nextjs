"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Crown, 
  Target, 
  Award,
  Medal,
  Shield,
  Zap,
  Heart,
  Gamepad2,
  Users,
  Book,
  Lock,
  Sparkles
} from "lucide-react";
import { AchievementRarity, AchievementStatus } from "./AchievementCard";

interface Achievement {
  id: string;
  title: string;
  icon: string;
  rarity: AchievementRarity;
  status: AchievementStatus;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showRarity?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const ACHIEVEMENT_ICONS = {
  // Gameplay achievements
  first_game: Trophy,
  games_played: Gamepad2,
  high_score: Target,
  speed_run: Zap,
  perfectionist: Star,
  
  // Creation achievements  
  first_creation: Crown,
  prolific_creator: Book,
  featured_game: Medal,
  viral_game: Sparkles,
  innovative: Shield,
  
  // Social achievements
  likes_received: Heart,
  community_favorite: Users,
  helpful_creator: Award,
  mentor: Book,
  collaborator: Users,
  
  // Milestone achievements
  veteran: Shield,
  legendary: Crown,
  master: Trophy,
  
  // Special achievements
  early_adopter: Star,
  beta_tester: Zap,
  contributor: Award,
  supporter: Heart,
} as const;

const RARITY_CONFIG = {
  common: {
    color: "#6B7280",
    bgGradient: "from-gray-400 to-gray-500",
    shadowColor: "shadow-gray-500/20",
    glowColor: "drop-shadow-[0_0_8px_rgba(107,114,128,0.3)]",
  },
  rare: {
    color: "#3B82F6", 
    bgGradient: "from-blue-400 to-blue-600",
    shadowColor: "shadow-blue-500/30",
    glowColor: "drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]",
  },
  epic: {
    color: "#8B5CF6",
    bgGradient: "from-purple-400 to-purple-600", 
    shadowColor: "shadow-purple-500/30",
    glowColor: "drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]",
  },
  legendary: {
    color: "#F59E0B",
    bgGradient: "from-amber-400 to-orange-500",
    shadowColor: "shadow-amber-500/40",
    glowColor: "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
  },
  mythic: {
    color: "#EF4444", 
    bgGradient: "from-red-400 to-pink-500",
    shadowColor: "shadow-red-500/40",
    glowColor: "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]",
  },
};

const SIZE_CONFIG = {
  xs: {
    container: "w-6 h-6",
    icon: 12,
    text: "text-xs",
  },
  sm: {
    container: "w-8 h-8", 
    icon: 14,
    text: "text-xs",
  },
  md: {
    container: "w-12 h-12",
    icon: 18,
    text: "text-sm", 
  },
  lg: {
    container: "w-16 h-16",
    icon: 24,
    text: "text-base",
  },
  xl: {
    container: "w-20 h-20",
    icon: 32,
    text: "text-lg",
  },
};

export function AchievementBadge({
  achievement,
  size = "md",
  showRarity = false,
  animated = false,
  className,
  onClick,
}: AchievementBadgeProps) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon as keyof typeof ACHIEVEMENT_ICONS] || Trophy;
  
  const isLocked = achievement.status === "locked";
  const isCompleted = achievement.status === "completed";

  const badgeVariants = {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: { 
      scale: 1, 
      rotate: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.6,
      }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const iconVariants = {
    locked: {
      opacity: 0.3,
      scale: 0.8,
    },
    completed: {
      opacity: 1,
      scale: 1,
      rotate: [0, 10, -10, 0],
      transition: {
        rotate: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }
    },
    progress: {
      opacity: 0.7,
      scale: 0.9,
    }
  };

  const sparkleVariants = {
    animate: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        staggerChildren: 0.2,
      }
    }
  };

  const renderSparkles = () => (
    <motion.div
      variants={sparkleVariants}
      animate="animate"
      className="absolute inset-0 pointer-events-none"
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2"
          style={{
            top: `${20 + i * 15}%`,
            left: `${15 + i * 25}%`,
            transform: `rotate(${i * 45}deg)`,
          }}
          variants={{
            animate: {
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }
            }
          }}
        >
          <Sparkles 
            size={8} 
            className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" 
          />
        </motion.div>
      ))}
    </motion.div>
  );

  const renderBadge = () => (
    <motion.div
      variants={badgeVariants}
      initial={animated ? "initial" : false}
      animate={animated && isCompleted ? "animate" : "pulse"}
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      className={`
        relative ${sizeConfig.container} 
        cursor-${onClick ? 'pointer' : 'default'} 
        ${className}
      `}
      onClick={onClick}
    >
      {/* Main Badge Container */}
      <div className={`
        relative w-full h-full rounded-full
        bg-gradient-to-br ${rarityConfig.bgGradient}
        shadow-lg ${rarityConfig.shadowColor}
        ${isCompleted && (achievement.rarity === 'legendary' || achievement.rarity === 'mythic') 
          ? rarityConfig.glowColor 
          : ''
        }
        ${isLocked 
          ? 'grayscale brightness-50' 
          : ''
        }
        overflow-hidden
      `}>
        {/* Inner glow effect for high rarity */}
        {(achievement.rarity === 'legendary' || achievement.rarity === 'mythic') && isCompleted && (
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        )}

        {/* Icon */}
        <motion.div
          variants={iconVariants}
          animate={
            isLocked ? "locked" : 
            isCompleted ? "completed" : 
            "progress"
          }
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          {isLocked ? (
            <Lock size={sizeConfig.icon} />
          ) : (
            <IconComponent size={sizeConfig.icon} />
          )}
        </motion.div>

        {/* Sparkle effects for mythic achievements */}
        {achievement.rarity === 'mythic' && isCompleted && renderSparkles()}

        {/* Animated border for legendary/mythic */}
        {(achievement.rarity === 'legendary' || achievement.rarity === 'mythic') && isCompleted && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </div>

      {/* Rarity indicator */}
      {showRarity && !isLocked && (
        <div className="absolute -bottom-1 -right-1">
          <div 
            className={`
              w-4 h-4 rounded-full border-2 border-background
              bg-gradient-to-br ${rarityConfig.bgGradient}
              flex items-center justify-center
            `}
          >
            {achievement.rarity === 'mythic' && <Crown size={8} className="text-white" />}
            {achievement.rarity === 'legendary' && <Trophy size={8} className="text-white" />}
            {achievement.rarity === 'epic' && <Star size={8} className="text-white" />}
            {achievement.rarity === 'rare' && <Medal size={8} className="text-white" />}
            {achievement.rarity === 'common' && <div className="w-1 h-1 bg-white rounded-full" />}
          </div>
        </div>
      )}

      {/* Progress indicator for in-progress achievements */}
      {achievement.status === "in_progress" && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );

  return renderBadge();
}

export default AchievementBadge;