"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon } from "@/components/icons";
import { Button } from "@heroui/button";

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  actions?: React.ReactNode;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Mobile navigation menu component with glassmorphic design
 * Provides a full-screen overlay menu for mobile devices
 */
export function MobileNavMenu({
  isOpen,
  onClose,
  title,
  showBackButton = false,
  onBackPress,
  actions,
  subtitle,
  className = '',
  children,
}: MobileNavMenuProps) {
  // Handle escape key to close menu
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Container */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className={`
              fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm
              bg-gradient-to-br from-black/80 via-purple-900/30 to-black/80
              backdrop-blur-3xl border-r border-purple-500/20
              shadow-2xl shadow-purple-500/10
              ${className}
            `}
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(132,61,255,0.2) 20%, rgba(168,85,247,0.15) 50%, rgba(132,61,255,0.2) 80%, rgba(0,0,0,0.9) 100%)',
            }}
          >
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-6 border-b border-purple-500/20"
            >
              {/* Left section - Back button or spacer */}
              <div className="flex items-center min-w-[44px]">
                {showBackButton ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      isIconOnly
                      variant="ghost"
                      className="w-10 h-10 text-white/70 hover:text-white hover:bg-white/10"
                      onPress={onBackPress}
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="w-10" />
                )}
              </div>

              {/* Center section - Title */}
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-lg font-semibold text-center truncate max-w-full"
                >
                  {title}
                </motion.h1>
                
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/60 text-xs text-center truncate max-w-full"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {/* Right section - Actions */}
              <div className="flex items-center justify-end min-w-[44px]">
                {actions ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center space-x-2"
                  >
                    {actions}
                  </motion.div>
                ) : (
                  <div className="w-10" />
                )}
              </div>
            </motion.header>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 overflow-y-auto p-6"
            >
              {children}
            </motion.div>

            {/* Glassmorphic shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-30 pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Specialized mobile header for different page types
 */
export function MobilePageHeader({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightAction,
  className = '',
}: {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className={`
        fixed top-0 left-0 right-0 z-40 
        bg-black/20 backdrop-blur-xl border-b border-white/10
        safe-area-pt
        ${className}
      `}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section - Back button or spacer */}
          <div className="flex items-center min-w-[44px]">
            {showBackButton ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  isIconOnly
                  variant="ghost"
                  className="w-10 h-10 text-white/70 hover:text-white hover:bg-white/10"
                  onPress={onBackPress}
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </Button>
              </motion.div>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Center section - Title */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white text-lg font-semibold text-center truncate max-w-full"
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-xs text-center truncate max-w-full"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center justify-end min-w-[44px]">
            {rightAction ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-2"
              >
                {rightAction}
              </motion.div>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>
      </div>

      {/* Glassmorphic shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-50" />
    </motion.header>
  );
}