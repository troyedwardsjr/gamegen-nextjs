"use client";

import React from "react";
import { Button, ButtonProps } from "@heroui/button";
import { clsx } from "clsx";
import { motion, HTMLMotionProps } from "framer-motion";

export interface GlassmorphicButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "glass" | "glass-filled" | "glass-bordered" | "glass-ghost" | "gaming" | "accent" | "danger" | "success";
  blur?: "sm" | "md" | "lg";
  intensity?: "subtle" | "medium" | "strong";
  glow?: boolean;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MotionButton = motion(Button);

export function GlassmorphicButton({
  variant = "glass",
  blur = "md",
  intensity = "medium",
  glow = false,
  animated = true,
  className,
  children,
  ...props
}: GlassmorphicButtonProps) {
  const getIntensityValues = () => {
    switch (intensity) {
      case "subtle":
        return {
          background: "bg-white/20 dark:bg-black/20",
          border: "border-white/20 dark:border-black/20",
          hover: "hover:bg-white/30 dark:hover:bg-black/30",
        };
      case "strong":
        return {
          background: "bg-white/40 dark:bg-black/40",
          border: "border-white/40 dark:border-black/40",
          hover: "hover:bg-white/50 dark:hover:bg-black/50",
        };
      default: // medium
        return {
          background: "bg-white/30 dark:bg-black/30",
          border: "border-white/30 dark:border-black/30",
          hover: "hover:bg-white/40 dark:hover:bg-black/40",
        };
    }
  };

  const getVariantClasses = () => {
    const intensityClasses = getIntensityValues();
    const blurClass = `backdrop-blur-${blur}`;
    
    switch (variant) {
      case "glass-filled":
        return `${intensityClasses.background} ${blurClass} backdrop-saturate-150 border ${intensityClasses.border} ${intensityClasses.hover}`;
      
      case "glass-bordered":
        return `bg-transparent ${blurClass} border-2 ${intensityClasses.border} hover:bg-white/10 dark:hover:bg-black/10`;
      
      case "glass-ghost":
        return `bg-transparent ${blurClass} hover:${intensityClasses.background}`;
      
      case "gaming":
        return `bg-gradient-to-r from-purple-500/30 to-purple-600/40 ${blurClass} backdrop-saturate-150 border border-purple-400/50 hover:from-purple-400/40 hover:to-purple-500/50 hover:border-purple-300/60`;
      
      case "accent":
        return `bg-gradient-to-r from-cyan-500/30 to-purple-500/30 ${blurClass} backdrop-saturate-150 border border-cyan-400/50 hover:from-cyan-400/40 hover:to-purple-400/40 hover:border-cyan-300/60`;
      
      case "danger":
        return `bg-gradient-to-r from-rose-500/30 to-red-500/30 ${blurClass} backdrop-saturate-150 border border-rose-400/50 hover:from-rose-400/40 hover:to-red-400/40 hover:border-rose-300/60`;
      
      case "success":
        return `bg-gradient-to-r from-emerald-500/30 to-green-500/30 ${blurClass} backdrop-saturate-150 border border-emerald-400/50 hover:from-emerald-400/40 hover:to-green-400/40 hover:border-emerald-300/60`;
      
      default: // glass
        return `${intensityClasses.background} ${blurClass} backdrop-saturate-150 ${intensityClasses.hover}`;
    }
  };

  const getGlowClasses = () => {
    if (!glow) return "";
    
    switch (variant) {
      case "gaming":
        return "shadow-lg shadow-purple-500/25 hover:shadow-purple-400/40";
      case "accent":
        return "shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40";
      case "danger":
        return "shadow-lg shadow-rose-500/25 hover:shadow-rose-400/40";
      case "success":
        return "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40";
      default:
        return "shadow-lg shadow-white/10 hover:shadow-white/20";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "gaming":
        return "text-purple-100 dark:text-purple-200";
      case "accent":
        return "text-cyan-100 dark:text-cyan-200";
      case "danger":
        return "text-rose-100 dark:text-rose-200";
      case "success":
        return "text-emerald-100 dark:text-emerald-200";
      default:
        return "text-foreground";
    }
  };

  const glassClasses = clsx(
    getVariantClasses(),
    getGlowClasses(),
    getTextColor(),
    "transition-all duration-300 ease-out",
    "transform hover:scale-105 active:scale-95",
    "font-medium relative overflow-hidden",
    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
    className,
  );

  const motionProps: HTMLMotionProps<"button"> = animated ? {
    whileHover: { scale: 1.05, y: -1 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  } : {};

  const ButtonComponent = animated ? MotionButton : Button;

  return (
    <ButtonComponent 
      className={glassClasses} 
      variant="light"
      {...(animated ? motionProps : {})}
      {...props}
    >
      {/* Gaming ripple effect on click */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      {children}
    </ButtonComponent>
  );
}

// Gaming-focused button presets
export const GameGenButtonPresets = {
  primary: {
    variant: "gaming" as const,
    intensity: "medium" as const,
    blur: "md" as const,
    glow: true,
    animated: true,
  },
  secondary: {
    variant: "glass-bordered" as const,
    intensity: "subtle" as const,
    blur: "sm" as const,
    glow: false,
    animated: true,
  },
  accent: {
    variant: "accent" as const,
    intensity: "medium" as const,
    blur: "md" as const,
    glow: true,
    animated: true,
  },
  danger: {
    variant: "danger" as const,
    intensity: "medium" as const,
    blur: "md" as const,
    glow: true,
    animated: true,
  },
  success: {
    variant: "success" as const,
    intensity: "medium" as const,
    blur: "md" as const,
    glow: true,
    animated: true,
  },
  ghost: {
    variant: "glass-ghost" as const,
    intensity: "subtle" as const,
    blur: "sm" as const,
    glow: false,
    animated: true,
  },
  floating: {
    variant: "glass" as const,
    intensity: "medium" as const,
    blur: "lg" as const,
    glow: false,
    animated: true,
  },
};