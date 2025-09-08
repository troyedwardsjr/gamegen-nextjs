"use client";

import React from "react";
import { Badge, BadgeProps } from "@heroui/badge";
import { clsx } from "clsx";

export interface GlassmorphicBadgeProps
  extends Omit<BadgeProps, "variant" | "color"> {
  variant?: "default" | "gaming" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  blur?: "sm" | "md" | "lg";
  glow?: boolean;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function GlassmorphicBadge({
  variant = "default",
  size = "md",
  blur = "sm",
  glow = false,
  animated = true,
  pulse = false,
  className,
  children,
  ...props
}: GlassmorphicBadgeProps) {
  const getVariantClasses = () => {
    const blurClass = `backdrop-blur-${blur}`;

    switch (variant) {
      case "gaming":
        return `bg-gradient-to-r from-purple-500/50 to-purple-600/60 ${blurClass} backdrop-saturate-150 border border-purple-400/60 text-purple-100 shadow-md`;

      case "accent":
        return `bg-gradient-to-r from-cyan-500/50 to-purple-500/50 ${blurClass} backdrop-saturate-150 border border-cyan-400/60 text-cyan-100 shadow-md`;

      case "success":
        return `bg-gradient-to-r from-emerald-500/50 to-green-500/50 ${blurClass} backdrop-saturate-150 border border-emerald-400/60 text-emerald-100 shadow-md`;

      case "warning":
        return `bg-gradient-to-r from-amber-500/50 to-yellow-500/50 ${blurClass} backdrop-saturate-150 border border-amber-400/60 text-amber-100 shadow-md`;

      case "danger":
        return `bg-gradient-to-r from-rose-500/50 to-red-500/50 ${blurClass} backdrop-saturate-150 border border-rose-400/60 text-rose-100 shadow-md`;

      default:
        return `bg-white/30 dark:bg-black/40 ${blurClass} backdrop-saturate-150 border border-white/40 dark:border-white/30 text-foreground shadow-md`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-0.5 text-xs font-medium rounded-md";
      case "lg":
        return "px-4 py-2 text-sm font-semibold rounded-lg";
      default:
        return "px-3 py-1 text-xs font-medium rounded-md";
    }
  };

  const getGlowClasses = () => {
    if (!glow) return "";

    switch (variant) {
      case "gaming":
        return "shadow-lg shadow-purple-500/40";
      case "accent":
        return "shadow-lg shadow-cyan-500/40";
      case "success":
        return "shadow-lg shadow-emerald-500/40";
      case "warning":
        return "shadow-lg shadow-amber-500/40";
      case "danger":
        return "shadow-lg shadow-rose-500/40";
      default:
        return "shadow-lg shadow-white/20";
    }
  };

  const getPulseClasses = () => {
    if (!pulse) return "";

    switch (variant) {
      case "gaming":
        return "animate-pulse";
      case "accent":
        return "animate-pulse";
      default:
        return "animate-pulse";
    }
  };

  const badgeClasses = clsx(
    getVariantClasses(),
    getSizeClasses(),
    getGlowClasses(),
    getPulseClasses(),
    "inline-flex items-center justify-center",
    "transition-all duration-300 ease-out",
    "font-mono tracking-wide",
    className,
  );

  // Use simple CSS animations instead of Framer Motion for badges
  const animationClass = animated
    ? "transition-all duration-200 hover:scale-105"
    : "";

  return (
    <Badge className={clsx(badgeClasses, animationClass)} {...props}>
      {children}
    </Badge>
  );
}

// Gaming status badge component
export interface GameStatusBadgeProps {
  status: "online" | "playing" | "idle" | "offline" | "streaming" | "creating";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function GameStatusBadge({
  status,
  size = "md",
  animated = true,
  className,
}: GameStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          variant: "success" as const,
          text: "Online",
          icon: "🟢",
          glow: true,
          pulse: false,
        };
      case "playing":
        return {
          variant: "gaming" as const,
          text: "Playing",
          icon: "🎮",
          glow: true,
          pulse: true,
        };
      case "idle":
        return {
          variant: "warning" as const,
          text: "Idle",
          icon: "🌙",
          glow: false,
          pulse: false,
        };
      case "offline":
        return {
          variant: "default" as const,
          text: "Offline",
          icon: "⚫",
          glow: false,
          pulse: false,
        };
      case "streaming":
        return {
          variant: "accent" as const,
          text: "Streaming",
          icon: "📺",
          glow: true,
          pulse: true,
        };
      case "creating":
        return {
          variant: "accent" as const,
          text: "Creating",
          icon: "✨",
          glow: true,
          pulse: true,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <GlassmorphicBadge
      animated={animated}
      className={className}
      glow={config.glow}
      pulse={config.pulse}
      size={size}
      variant={config.variant}
    >
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </GlassmorphicBadge>
  );
}

// Gaming-focused badge presets
export const GameGenBadgePresets = {
  levelBadge: {
    variant: "gaming" as const,
    size: "md" as const,
    glow: true,
    animated: true,
  },
  achievementBadge: {
    variant: "accent" as const,
    size: "lg" as const,
    glow: true,
    animated: true,
    pulse: true,
  },
  statusBadge: {
    variant: "success" as const,
    size: "sm" as const,
    glow: false,
    animated: true,
  },
  warningBadge: {
    variant: "warning" as const,
    size: "md" as const,
    glow: true,
    animated: true,
  },
  errorBadge: {
    variant: "danger" as const,
    size: "md" as const,
    glow: true,
    animated: true,
    pulse: true,
  },
};
