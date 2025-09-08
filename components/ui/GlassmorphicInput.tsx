"use client";

import React, { forwardRef } from "react";
import { Input, InputProps } from "@heroui/input";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface GlassmorphicInputProps extends Omit<InputProps, "variant"> {
  variant?: "default" | "gaming" | "accent" | "subtle" | "strong";
  blur?: "sm" | "md" | "lg";
  glow?: boolean;
  animated?: boolean;
  className?: string;
  classNames?: InputProps["classNames"];
}

const MotionDiv = motion.div;

export const GlassmorphicInput = forwardRef<
  HTMLInputElement,
  GlassmorphicInputProps
>(
  (
    {
      variant = "default",
      blur = "md",
      glow = false,
      animated = true,
      className,
      classNames,
      ...props
    },
    ref,
  ) => {
    const getVariantClasses = () => {
      const blurClass = `backdrop-blur-${blur}`;

      switch (variant) {
        case "gaming":
          return {
            inputWrapper: `bg-gradient-to-r from-purple-500/20 to-purple-600/30 ${blurClass} backdrop-saturate-150 border border-purple-400/50 hover:border-purple-300/60 focus-within:border-purple-300/80`,
            input:
              "text-purple-100 dark:text-purple-200 placeholder:text-purple-300/60",
            label: "text-purple-200 dark:text-purple-300",
          };

        case "accent":
          return {
            inputWrapper: `bg-gradient-to-r from-cyan-500/20 to-purple-500/25 ${blurClass} backdrop-saturate-150 border border-cyan-400/50 hover:border-cyan-300/60 focus-within:border-cyan-300/80`,
            input:
              "text-cyan-100 dark:text-cyan-200 placeholder:text-cyan-300/60",
            label: "text-cyan-200 dark:text-cyan-300",
          };

        case "subtle":
          return {
            inputWrapper: `bg-white/10 dark:bg-black/10 ${blurClass} backdrop-saturate-120 border border-white/20 dark:border-black/20 hover:border-white/30 dark:hover:border-black/30 focus-within:border-white/40 dark:focus-within:border-black/40`,
            input: "text-foreground placeholder:text-foreground/40",
            label: "text-foreground/80",
          };

        case "strong":
          return {
            inputWrapper: `bg-white/25 dark:bg-black/25 ${blurClass} backdrop-saturate-150 border border-white/40 dark:border-black/40 hover:border-white/50 dark:hover:border-black/50 focus-within:border-white/60 dark:focus-within:border-black/60`,
            input: "text-foreground placeholder:text-foreground/50",
            label: "text-foreground/90",
          };

        default:
          return {
            inputWrapper: `bg-white/15 dark:bg-black/15 ${blurClass} backdrop-saturate-150 border border-white/30 dark:border-black/30 hover:border-white/40 dark:hover:border-black/40 focus-within:border-white/50 dark:focus-within:border-black/50`,
            input: "text-foreground placeholder:text-foreground/60",
            label: "text-foreground/80",
          };
      }
    };

    const getGlowClasses = () => {
      if (!glow) return "";

      switch (variant) {
        case "gaming":
          return "shadow-lg shadow-purple-500/20 focus-within:shadow-purple-400/30";
        case "accent":
          return "shadow-lg shadow-cyan-500/20 focus-within:shadow-cyan-400/30";
        default:
          return "shadow-lg shadow-white/10 focus-within:shadow-white/20";
      }
    };

    const variantClasses = getVariantClasses();
    const glowClasses = getGlowClasses();

    const mergedClassNames = {
      ...classNames,
      inputWrapper: clsx(
        variantClasses.inputWrapper,
        glowClasses,
        "transition-all duration-300 ease-out",
        "group-data-[focus=true]:scale-[1.02]",
        classNames?.inputWrapper,
      ),
      input: clsx(variantClasses.input, "bg-transparent", classNames?.input),
      label: clsx(
        variantClasses.label,
        "group-data-[filled-within=true]:text-foreground",
        classNames?.label,
      ),
    };

    const inputComponent = (
      <Input
        ref={ref}
        className={clsx("transition-all duration-300", className)}
        classNames={mergedClassNames}
        variant="flat"
        {...props}
      />
    );

    if (!animated) {
      return inputComponent;
    }

    return (
      <MotionDiv
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileFocus={{ scale: 1.02 }}
      >
        {inputComponent}
      </MotionDiv>
    );
  },
);

GlassmorphicInput.displayName = "GlassmorphicInput";

// Gaming-focused input presets
export const GameGenInputPresets = {
  search: {
    variant: "gaming" as const,
    blur: "md" as const,
    glow: true,
    animated: true,
    placeholder: "Search games, assets, or templates...",
    startContent: "🔍",
  },
  chat: {
    variant: "accent" as const,
    blur: "md" as const,
    glow: false,
    animated: true,
    placeholder: "Type your message...",
  },
  login: {
    variant: "default" as const,
    blur: "lg" as const,
    glow: true,
    animated: true,
  },
  subtle: {
    variant: "subtle" as const,
    blur: "sm" as const,
    glow: false,
    animated: true,
  },
  strong: {
    variant: "strong" as const,
    blur: "xl" as const,
    glow: true,
    animated: true,
  },
};
