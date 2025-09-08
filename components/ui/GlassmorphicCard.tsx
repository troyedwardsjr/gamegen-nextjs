"use client";

import React from "react";
import { Card, CardProps } from "@heroui/card";
import { clsx } from "clsx";
import { motion, HTMLMotionProps } from "framer-motion";

export interface GlassmorphicCardProps
  extends Omit<CardProps, "className" | "shadow"> {
  variant?:
    | "default"
    | "subtle"
    | "strong"
    | "gradient"
    | "gaming"
    | "accent-cyan"
    | "accent-emerald"
    | "accent-rose";
  blur?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  opacity?: "light" | "medium" | "strong";
  border?: "none" | "subtle" | "visible" | "gaming";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "gaming";
  hover?: boolean;
  animated?: boolean;
  pattern?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MotionCard = motion(Card);

export function GlassmorphicCard({
  variant = "default",
  blur = "md",
  opacity = "medium",
  border = "subtle",
  shadow = "md",
  hover = true,
  animated = true,
  pattern = false,
  className,
  children,
  ...props
}: GlassmorphicCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "subtle":
        return "bg-white/10 dark:bg-black/10";
      case "strong":
        return "bg-white/25 dark:bg-black/25";
      case "gradient":
        return "bg-gradient-to-br from-white/15 to-white/25 dark:from-black/15 dark:to-black/25";
      case "gaming":
        return "bg-gradient-to-br from-purple-500/20 to-purple-700/30 dark:from-purple-400/20 dark:to-purple-600/30";
      case "accent-cyan":
        return "bg-gradient-to-br from-cyan-500/20 to-purple-600/30 dark:from-cyan-400/20 dark:to-purple-500/30";
      case "accent-emerald":
        return "bg-gradient-to-br from-emerald-500/20 to-purple-600/30 dark:from-emerald-400/20 dark:to-purple-500/30";
      case "accent-rose":
        return "bg-gradient-to-br from-rose-500/20 to-purple-600/30 dark:from-rose-400/20 dark:to-purple-500/30";
      default:
        return "bg-white/15 dark:bg-black/15";
    }
  };

  const getBlurClasses = () => {
    switch (blur) {
      case "sm":
        return "backdrop-blur-sm";
      case "lg":
        return "backdrop-blur-lg";
      case "xl":
        return "backdrop-blur-xl";
      case "2xl":
        return "backdrop-blur-2xl";
      case "3xl":
        return "backdrop-blur-3xl";
      default:
        return "backdrop-blur-md";
    }
  };

  const getBorderClasses = () => {
    switch (border) {
      case "none":
        return "border-none";
      case "visible":
        return "border border-white/30 dark:border-black/30";
      case "gaming":
        return "border border-purple-400/40 dark:border-purple-300/40";
      default:
        return "border border-white/20 dark:border-black/20";
    }
  };

  const getShadowClasses = () => {
    switch (shadow) {
      case "none":
        return "";
      case "sm":
        return "shadow-sm";
      case "lg":
        return "shadow-lg shadow-black/10";
      case "xl":
        return "shadow-xl shadow-black/15";
      case "gaming":
        return "shadow-lg shadow-purple-500/20 dark:shadow-purple-400/20";
      default:
        return "shadow-md shadow-black/8";
    }
  };

  const getHoverClasses = () => {
    if (!hover) return "";

    const hoverClass =
      variant === "gaming"
        ? "hover:shadow-xl hover:shadow-purple-500/30 hover:border-purple-400/60"
        : "hover:shadow-lg hover:shadow-black/10 hover:border-white/40 dark:hover:border-black/40";

    return `${hoverClass} hover:scale-[1.02] transition-all duration-300 cursor-pointer`;
  };

  const getPatternClasses = () => {
    if (!pattern) return "";

    return "relative overflow-hidden";
  };

  const glassClasses = clsx(
    getVariantClasses(),
    getBlurClasses(),
    getBorderClasses(),
    getShadowClasses(),
    getHoverClasses(),
    getPatternClasses(),
    "backdrop-saturate-150",
    "relative",
    className,
  );

  const motionProps: HTMLMotionProps<"div"> = animated
    ? {
        initial: { opacity: 1, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        whileHover: hover ? { y: -2 } : undefined,
        whileTap: hover ? { scale: 0.98 } : undefined,
      }
    : {};

  const CardComponent = animated ? MotionCard : Card;

  return (
    <CardComponent
      className={glassClasses}
      {...(animated ? motionProps : {})}
      {...props}
    >
      {pattern && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      )}
      {children}
    </CardComponent>
  );
}

// Gaming-focused preset configurations
export const GameGenCardPresets = {
  heroCard: {
    variant: "gaming" as const,
    blur: "xl" as const,
    shadow: "gaming" as const,
    border: "gaming" as const,
    pattern: true,
    animated: true,
  },
  gameCard: {
    variant: "gradient" as const,
    blur: "md" as const,
    shadow: "lg" as const,
    border: "subtle" as const,
    hover: true,
    animated: true,
  },
  floatingPanel: {
    variant: "default" as const,
    blur: "2xl" as const,
    shadow: "xl" as const,
    border: "visible" as const,
    hover: false,
    animated: true,
  },
  accentCard: {
    variant: "accent-cyan" as const,
    blur: "lg" as const,
    shadow: "md" as const,
    border: "gaming" as const,
    hover: true,
    animated: true,
  },
  modalCard: {
    variant: "strong" as const,
    blur: "3xl" as const,
    shadow: "xl" as const,
    border: "visible" as const,
    hover: false,
    animated: true,
  },
  chatPanel: {
    variant: "subtle" as const,
    blur: "md" as const,
    shadow: "sm" as const,
    border: "subtle" as const,
    hover: false,
    animated: false,
  },
};
