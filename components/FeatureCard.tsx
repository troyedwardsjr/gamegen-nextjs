"use client";

import React, { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onClick?: () => void;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const FeatureCard = memo(({
  icon,
  title,
  description,
  index = 0,
  className,
  onKeyDown,
  onClick,
  tabIndex = 0,
  role = "article",
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: FeatureCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  // Handle keyboard interactions
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
    onKeyDown?.(event);
  };

  // Generate unique IDs for accessibility
  const titleId = `feature-title-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const descriptionId = `feature-desc-${title.toLowerCase().replace(/\s+/g, '-')}`;

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 50,
      scale: shouldReduceMotion ? 1 : 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.6,
        delay: shouldReduceMotion ? 0 : index * 0.1,
        ease: "easeOut",
      },
    },
  };

  const hoverVariants = shouldReduceMotion ? undefined : {
    hover: {
      scale: 1.03,
      y: -8,
      boxShadow: '0 16px 64px rgba(132,61,255,0.25), inset 0 1px 2px rgba(255,255,255,0.12)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(132,61,255,0.12) 20%, rgba(168,85,247,0.08) 50%, rgba(132,61,255,0.12) 80%, rgba(255,255,255,0.08) 100%)',
      borderColor: 'rgba(132,61,255,0.4)',
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const focusVariants = shouldReduceMotion ? undefined : {
    focus: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  const iconVariants = shouldReduceMotion ? undefined : {
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      },
    },
  };

  const glowVariants = shouldReduceMotion ? undefined : {
    hover: {
      boxShadow: [
        "0 0 0 rgba(147, 51, 234, 0)",
        "0 0 20px rgba(147, 51, 234, 0.3)",
        "0 0 40px rgba(147, 51, 234, 0.2)",
      ],
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      whileFocus="focus"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel || `${title} feature`}
      aria-describedby={ariaDescribedBy || descriptionId}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      style={{
        outline: 'none', // We'll use custom focus styles
      }}
    >
      <motion.div
        variants={hoverVariants}
        className="h-full"
      >
        <motion.div
          variants={glowVariants}
          className="h-full"
        >
          <div
            className="h-full p-6 sm:p-8 rounded-2xl backdrop-blur-xl transition-all duration-500 group touch-target relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(132,61,255,0.08) 20%, rgba(168,85,247,0.05) 50%, rgba(132,61,255,0.08) 80%, rgba(255,255,255,0.06) 100%)',
              border: '1px solid rgba(132,61,255,0.25)',
              boxShadow: '0 8px 32px rgba(132,61,255,0.15), inset 0 1px 2px rgba(255,255,255,0.08)',
            }}
          >
            {/* Animated hover glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/8 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            
            {/* Subtle animated particles */}
            <div className="absolute top-4 right-4 w-1 h-1 bg-purple-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-violet-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            <div className="flex flex-col h-full space-y-6 relative z-10">
              {/* Icon */}
              <motion.div
                variants={iconVariants}
                className="flex-shrink-0"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden group/icon"
                  style={{
                    background: 'linear-gradient(135deg, rgba(132,61,255,0.3) 0%, rgba(168,85,247,0.25) 50%, rgba(139,92,246,0.3) 100%)',
                    border: '1px solid rgba(132,61,255,0.4)',
                    boxShadow: '0 4px 16px rgba(132,61,255,0.2), inset 0 1px 2px rgba(255,255,255,0.15)',
                  }}
                >
                  {/* Icon background glow */}
                  <div className="absolute inset-0 bg-purple-400/10 group-hover/icon:bg-purple-300/20 transition-colors duration-300 rounded-xl" />
                  
                  {/* Icon shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60 group-hover/icon:opacity-80 transition-opacity duration-300 rounded-xl" />
                  
                  <div className="w-7 h-7 text-purple-300 group-hover:text-purple-200 transition-colors duration-300 relative z-10 drop-shadow-sm">
                    {icon}
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <h3 
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold text-white/95 group-hover:text-white transition-colors duration-300 drop-shadow-sm"
                >
                  {title}
                </h3>
                <p 
                  id={descriptionId}
                  className="text-sm sm:text-base text-white/70 group-hover:text-white/85 transition-colors duration-300 leading-relaxed"
                >
                  {description}
                </p>
              </div>

              {/* Enhanced hover indicator */}
              <div className="absolute bottom-4 right-4 w-6 h-0.5 bg-gradient-to-r from-purple-400/0 via-purple-400/60 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

FeatureCard.displayName = "FeatureCard";