"use client";

import React from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export interface GlassmorphicAlertProps {
  variant?: "info" | "success" | "warning" | "error" | "gaming";
  title?: string;
  message: string;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  blur?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const defaultIcons = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  gaming: "🎮",
};

export function GlassmorphicAlert({
  variant = "info",
  title,
  message,
  icon,
  closable = false,
  onClose,
  blur = "md",
  animated = true,
  className,
  children,
}: GlassmorphicAlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    if (animated) {
      setIsVisible(false);
      // Wait for animation to complete before calling onClose
      setTimeout(() => onClose?.(), 300);
    } else {
      onClose?.();
    }
  };

  const getVariantClasses = () => {
    const blurClass = `backdrop-blur-${blur}`;
    
    switch (variant) {
      case "success":
        return `bg-gradient-to-r from-emerald-500/20 to-green-500/30 ${blurClass} backdrop-saturate-150 border border-emerald-400/50 text-emerald-100 shadow-md shadow-emerald-500/20`;
      
      case "warning":
        return `bg-gradient-to-r from-amber-500/20 to-yellow-500/30 ${blurClass} backdrop-saturate-150 border border-amber-400/50 text-amber-100 shadow-md shadow-amber-500/20`;
      
      case "error":
        return `bg-gradient-to-r from-rose-500/20 to-red-500/30 ${blurClass} backdrop-saturate-150 border border-rose-400/50 text-rose-100 shadow-md shadow-rose-500/20`;
      
      case "gaming":
        return `bg-gradient-to-r from-purple-500/20 to-purple-600/30 ${blurClass} backdrop-saturate-150 border border-purple-400/50 text-purple-100 shadow-md shadow-purple-500/20`;
      
      default: // info
        return `bg-gradient-to-r from-cyan-500/20 to-blue-500/30 ${blurClass} backdrop-saturate-150 border border-cyan-400/50 text-cyan-100 shadow-md shadow-cyan-500/20`;
    }
  };

  const alertVariants = {
    hidden: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const alertContent = (
    <div
      className={clsx(
        getVariantClasses(),
        "rounded-lg p-4 relative",
        "transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || (
            <span className="text-lg">
              {defaultIcons[variant]}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm opacity-90">
            {message}
          </p>
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>

        {/* Close button */}
        {closable && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close alert"
          >
            <span className="text-sm opacity-70 hover:opacity-100">✕</span>
          </button>
        )}
      </div>

      {/* Gaming pattern overlay */}
      {variant === "gaming" && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );

  if (!animated) {
    return alertContent;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={alertVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {alertContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Gaming notification component
export interface GameNotificationProps {
  type: "achievement" | "level_up" | "friend_online" | "game_invite" | "system";
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  animated?: boolean;
  className?: string;
}

export function GameNotification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  animated = true,
  className,
}: GameNotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getNotificationConfig = () => {
    switch (type) {
      case "achievement":
        return {
          variant: "gaming" as const,
          icon: "🏆",
          title: title || "Achievement Unlocked!",
        };
      case "level_up":
        return {
          variant: "success" as const,
          icon: "⭐",
          title: title || "Level Up!",
        };
      case "friend_online":
        return {
          variant: "info" as const,
          icon: "👥",
          title: title || "Friend Online",
        };
      case "game_invite":
        return {
          variant: "gaming" as const,
          icon: "🎮",
          title: title || "Game Invitation",
        };
      case "system":
        return {
          variant: "warning" as const,
          icon: "⚙️",
          title: title || "System Message",
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <GlassmorphicAlert
            variant={config.variant}
            title={config.title}
            message={message}
            icon={config.icon}
            closable={true}
            onClose={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            animated={false} // We handle animation externally
            className={className}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Gaming-focused alert presets
export const GameGenAlertPresets = {
  saveSuccess: {
    variant: "success" as const,
    title: "Game Saved",
    icon: "💾",
    closable: true,
  },
  connectionError: {
    variant: "error" as const,
    title: "Connection Error",
    icon: "🔌",
    closable: true,
  },
  newFeature: {
    variant: "gaming" as const,
    title: "New Feature Available",
    icon: "✨",
    closable: true,
  },
  lowCredits: {
    variant: "warning" as const,
    title: "Low Credits",
    icon: "⚡",
    closable: true,
  },
  tutorial: {
    variant: "info" as const,
    title: "Tutorial",
    icon: "📚",
    closable: true,
  },
};