"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalProps,
  useDisclosure,
} from "@heroui/modal";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export interface GlassmorphicModalProps extends Omit<ModalProps, "classNames"> {
  variant?: "default" | "gaming" | "accent" | "danger" | "success";
  blur?: "md" | "lg" | "xl" | "2xl" | "3xl";
  animated?: boolean;
  gamePattern?: boolean;
  className?: string;
  classNames?: {
    wrapper?: string;
    base?: string;
    backdrop?: string;
    header?: string;
    body?: string;
    footer?: string;
    closeButton?: string;
  };
}

export function GlassmorphicModal({
  variant = "default",
  blur = "2xl",
  animated = true,
  gamePattern = false,
  className,
  classNames,
  children,
  ...props
}: GlassmorphicModalProps) {
  const getVariantClasses = () => {
    const blurClass = `backdrop-blur-${blur}`;
    
    switch (variant) {
      case "gaming":
        return {
          base: `bg-gradient-to-br from-purple-900/30 to-purple-800/50 ${blurClass} backdrop-saturate-150 border border-purple-400/40`,
          backdrop: "bg-purple-900/20",
          header: "text-purple-100 border-b border-purple-400/30",
          body: "text-purple-50",
          footer: "border-t border-purple-400/30",
        };
      
      case "accent":
        return {
          base: `bg-gradient-to-br from-cyan-900/30 to-purple-900/40 ${blurClass} backdrop-saturate-150 border border-cyan-400/40`,
          backdrop: "bg-cyan-900/20",
          header: "text-cyan-100 border-b border-cyan-400/30",
          body: "text-cyan-50",
          footer: "border-t border-cyan-400/30",
        };
      
      case "danger":
        return {
          base: `bg-gradient-to-br from-rose-900/30 to-red-900/40 ${blurClass} backdrop-saturate-150 border border-rose-400/40`,
          backdrop: "bg-rose-900/20",
          header: "text-rose-100 border-b border-rose-400/30",
          body: "text-rose-50",
          footer: "border-t border-rose-400/30",
        };
      
      case "success":
        return {
          base: `bg-gradient-to-br from-emerald-900/30 to-green-900/40 ${blurClass} backdrop-saturate-150 border border-emerald-400/40`,
          backdrop: "bg-emerald-900/20",
          header: "text-emerald-100 border-b border-emerald-400/30",
          body: "text-emerald-50",
          footer: "border-t border-emerald-400/30",
        };
      
      default:
        return {
          base: `bg-white/20 dark:bg-black/30 ${blurClass} backdrop-saturate-150 border border-white/30 dark:border-white/20`,
          backdrop: "bg-black/20",
          header: "text-foreground border-b border-white/20 dark:border-white/10",
          body: "text-foreground",
          footer: "border-t border-white/20 dark:border-white/10",
        };
    }
  };

  const variantClasses = getVariantClasses();

  const mergedClassNames = {
    wrapper: clsx("backdrop-blur-sm", classNames?.wrapper),
    base: clsx(
      variantClasses.base,
      "shadow-2xl",
      animated && "transition-all duration-300",
      gamePattern && "relative overflow-hidden",
      classNames?.base,
      className,
    ),
    backdrop: clsx(
      variantClasses.backdrop,
      animated && "transition-opacity duration-300",
      classNames?.backdrop,
    ),
    header: clsx(
      variantClasses.header,
      "font-semibold text-lg",
      classNames?.header,
    ),
    body: clsx(
      variantClasses.body,
      classNames?.body,
    ),
    footer: clsx(
      variantClasses.footer,
      classNames?.footer,
    ),
    closeButton: clsx(
      "text-foreground/50 hover:text-foreground transition-colors",
      "hover:bg-white/10 rounded-full",
      classNames?.closeButton,
    ),
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: {
        duration: 0.2,
      },
    },
  };

  if (!animated) {
    return (
      <Modal 
        classNames={mergedClassNames}
        motionProps={{
          variants: modalVariants,
          initial: "hidden",
          animate: "visible",
          exit: "exit",
        }}
        {...props}
      >
        {gamePattern && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        )}
        {children}
      </Modal>
    );
  }

  return (
    <Modal 
      classNames={mergedClassNames}
      motionProps={{
        variants: modalVariants,
        initial: "hidden",
        animate: "visible",
        exit: "exit",
      }}
      {...props}
    >
      <ModalContent>
        {gamePattern && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        )}
        {children}
      </ModalContent>
    </Modal>
  );
}

// Convenience exports
export { ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure };

// Gaming-focused modal presets
export const GameGenModalPresets = {
  gameSettings: {
    variant: "gaming" as const,
    blur: "2xl" as const,
    animated: true,
    gamePattern: true,
    size: "lg" as const,
  },
  confirmation: {
    variant: "accent" as const,
    blur: "xl" as const,
    animated: true,
    gamePattern: false,
    size: "sm" as const,
  },
  error: {
    variant: "danger" as const,
    blur: "lg" as const,
    animated: true,
    gamePattern: false,
    size: "md" as const,
  },
  success: {
    variant: "success" as const,
    blur: "lg" as const,
    animated: true,
    gamePattern: false,
    size: "md" as const,
  },
  gameEditor: {
    variant: "default" as const,
    blur: "3xl" as const,
    animated: true,
    gamePattern: true,
    size: "5xl" as const,
  },
  assetPreview: {
    variant: "gaming" as const,
    blur: "2xl" as const,
    animated: true,
    gamePattern: true,
    size: "2xl" as const,
  },
};