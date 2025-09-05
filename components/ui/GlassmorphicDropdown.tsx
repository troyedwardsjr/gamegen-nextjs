"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownProps,
} from "@heroui/dropdown";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface GlassmorphicDropdownProps extends Omit<DropdownProps, "classNames"> {
  variant?: "default" | "gaming" | "accent" | "subtle";
  blur?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  classNames?: DropdownProps["classNames"];
}

export function GlassmorphicDropdown({
  variant = "default",
  blur = "md",
  animated = true,
  className,
  classNames,
  children,
  ...props
}: GlassmorphicDropdownProps) {
  const getVariantClasses = () => {
    const blurClass = `backdrop-blur-${blur}`;
    
    switch (variant) {
      case "gaming":
        return {
          content: `bg-gradient-to-br from-purple-900/40 to-purple-800/60 ${blurClass} backdrop-saturate-150 border border-purple-400/40 shadow-xl shadow-purple-500/20`,
        };
      
      case "accent":
        return {
          content: `bg-gradient-to-br from-cyan-900/40 to-purple-900/50 ${blurClass} backdrop-saturate-150 border border-cyan-400/40 shadow-xl shadow-cyan-500/20`,
        };
      
      case "subtle":
        return {
          content: `bg-white/10 dark:bg-black/20 ${blurClass} backdrop-saturate-120 border border-white/20 dark:border-white/15 shadow-lg`,
        };
      
      default:
        return {
          content: `bg-white/20 dark:bg-black/30 ${blurClass} backdrop-saturate-150 border border-white/30 dark:border-white/20 shadow-xl`,
        };
    }
  };

  const variantClasses = getVariantClasses();

  const mergedClassNames = {
    ...classNames,
    content: clsx(
      variantClasses.content,
      "min-w-[200px] p-2 rounded-lg",
      animated && "transition-all duration-200",
      classNames?.content,
    ),
  };

  const motionProps = animated ? {
    motionProps: {
      variants: {
        enter: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1],
          },
        },
        exit: {
          opacity: 0,
          y: -10,
          scale: 0.95,
          transition: {
            duration: 0.1,
            ease: [0.4, 0, 1, 1],
          },
        },
      },
      initial: { opacity: 0, y: -10, scale: 0.95 },
      animate: "enter",
      exit: "exit",
    },
  } : {};

  return (
    <Dropdown
      classNames={mergedClassNames}
      className={className}
      {...motionProps}
      {...props}
    >
      {children}
    </Dropdown>
  );
}

// Gaming-focused dropdown item component
export interface GlassmorphicDropdownItemProps {
  variant?: "default" | "gaming" | "accent" | "danger" | "success";
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export function GlassmorphicDropdownItem({
  variant = "default",
  className,
  children,
  ...props
}: GlassmorphicDropdownItemProps) {
  const getItemClasses = () => {
    switch (variant) {
      case "gaming":
        return "text-purple-100 hover:bg-purple-500/20 focus:bg-purple-500/30 data-[hover=true]:bg-purple-500/20 data-[focus=true]:bg-purple-500/30";
      
      case "accent":
        return "text-cyan-100 hover:bg-cyan-500/20 focus:bg-cyan-500/30 data-[hover=true]:bg-cyan-500/20 data-[focus=true]:bg-cyan-500/30";
      
      case "danger":
        return "text-rose-100 hover:bg-rose-500/20 focus:bg-rose-500/30 data-[hover=true]:bg-rose-500/20 data-[focus=true]:bg-rose-500/30";
      
      case "success":
        return "text-emerald-100 hover:bg-emerald-500/20 focus:bg-emerald-500/30 data-[hover=true]:bg-emerald-500/20 data-[focus=true]:bg-emerald-500/30";
      
      default:
        return "text-foreground hover:bg-white/10 focus:bg-white/15 data-[hover=true]:bg-white/10 data-[focus=true]:bg-white/15 dark:hover:bg-black/10 dark:focus:bg-black/15 dark:data-[hover=true]:bg-black/10 dark:data-[focus=true]:bg-black/15";
    }
  };

  return (
    <DropdownItem
      className={clsx(
        getItemClasses(),
        "rounded-md transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownItem>
  );
}

// Re-export components for convenience
export { DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection };

// Gaming-focused dropdown presets
export const GameGenDropdownPresets = {
  userMenu: {
    variant: "gaming" as const,
    blur: "lg" as const,
    animated: true,
    placement: "bottom-end" as const,
  },
  gameOptions: {
    variant: "accent" as const,
    blur: "md" as const,
    animated: true,
    placement: "bottom-start" as const,
  },
  contextMenu: {
    variant: "default" as const,
    blur: "md" as const,
    animated: true,
    placement: "right-start" as const,
  },
  toolMenu: {
    variant: "subtle" as const,
    blur: "sm" as const,
    animated: true,
    placement: "bottom" as const,
  },
};