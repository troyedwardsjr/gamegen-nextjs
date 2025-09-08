"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  closable?: boolean;
  loading?: boolean;
}

export interface TabSystemProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "pills" | "underline" | "gaming";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
  className?: string;
  tabListClassName?: string;
  contentClassName?: string;
}

export function TabSystem({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  onTabClose,
  orientation = "horizontal",
  variant = "gaming",
  size = "md",
  scrollable = true,
  className,
  tabListClassName,
  contentClassName,
}: TabSystemProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || "",
  );

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const tabListRef = useRef<HTMLDivElement>(null);
  const [focusedTab, setFocusedTab] = useState<string | null>(null);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabs.find((tab) => tab.id === tabId)?.disabled) return;

      setInternalActiveTab(tabId);
      onTabChange?.(tabId);
    },
    [tabs, onTabChange],
  );

  const handleTabClose = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onTabClose?.(tabId);
    },
    [onTabClose],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedTab) return;

      const currentIndex = tabs.findIndex((tab) => tab.id === focusedTab);
      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleTabChange(focusedTab);

          return;
        default:
          return;
      }

      // Skip disabled tabs
      while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex) {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          nextIndex = nextIndex > 0 ? nextIndex - 1 : tabs.length - 1;
        } else {
          nextIndex = nextIndex < tabs.length - 1 ? nextIndex + 1 : 0;
        }
      }

      setFocusedTab(tabs[nextIndex]?.id || null);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedTab, tabs, handleTabChange]);

  // Tab size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-3 py-1.5 h-8";
      case "lg":
        return "text-base px-6 py-3 h-12";
      default:
        return "text-sm px-4 py-2 h-10";
    }
  };

  // Variant styles
  const getVariantClasses = (
    tab: Tab,
    isActive: boolean,
    isFocused: boolean,
  ) => {
    const baseClasses = clsx(
      "relative flex items-center gap-2 font-medium transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
      getSizeClasses(),
      tab.disabled && "opacity-50 cursor-not-allowed",
    );

    switch (variant) {
      case "pills":
        return clsx(
          baseClasses,
          "rounded-full",
          isActive
            ? "bg-purple-500/20 text-purple-100 border border-purple-400/50"
            : "bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20",
          isFocused && !isActive && "ring-2 ring-purple-500/30",
        );

      case "underline":
        return clsx(
          baseClasses,
          "border-b-2",
          isActive
            ? "border-purple-400 text-purple-100"
            : "border-transparent hover:border-white/30 dark:hover:border-black/30",
          isFocused && !isActive && "ring-2 ring-purple-500/30",
        );

      case "gaming":
        return clsx(
          baseClasses,
          "rounded-lg backdrop-blur-sm",
          isActive
            ? "bg-gradient-to-r from-purple-500/30 to-purple-600/40 border border-purple-400/50 text-purple-100 shadow-lg shadow-purple-500/20"
            : "bg-white/10 dark:bg-black/10 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-600/30 border border-transparent hover:border-purple-400/30",
          isFocused && !isActive && "ring-2 ring-purple-500/30",
        );

      default:
        return clsx(
          baseClasses,
          "rounded-md",
          isActive
            ? "bg-white/20 dark:bg-black/20 text-foreground"
            : "hover:bg-white/10 dark:hover:bg-black/10",
          isFocused && !isActive && "ring-2 ring-purple-500/30",
        );
    }
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div
      className={clsx(
        "flex",
        orientation === "vertical" ? "flex-col" : "flex-col",
        className,
      )}
    >
      {/* Tab List */}
      <div
        ref={tabListRef}
        aria-orientation={orientation}
        className={clsx(
          "flex",
          orientation === "vertical" ? "flex-col space-y-1" : "space-x-1",
          scrollable &&
            orientation === "horizontal" &&
            "overflow-x-auto scrollbar-hide",
          scrollable &&
            orientation === "vertical" &&
            "overflow-y-auto scrollbar-hide",
          "backdrop-blur-sm",
          tabListClassName,
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isFocused = tab.id === focusedTab;

          return (
            <button
              key={tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              className={getVariantClasses(tab, isActive, isFocused)}
              disabled={tab.disabled}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              onBlur={() => setFocusedTab(null)}
              onClick={() => handleTabChange(tab.id)}
              onFocus={() => setFocusedTab(tab.id)}
            >
              {/* Icon */}
              {tab.icon && (
                <tab.icon
                  className={clsx(
                    "flex-shrink-0",
                    size === "sm" ? "w-3 h-3" : "w-4 h-4",
                  )}
                />
              )}

              {/* Loading Spinner */}
              {tab.loading && (
                <div
                  className={clsx(
                    "animate-spin rounded-full border-2 border-current border-t-transparent",
                    size === "sm" ? "w-3 h-3" : "w-4 h-4",
                  )}
                />
              )}

              {/* Label */}
              <span className="flex-grow text-left">{tab.label}</span>

              {/* Badge */}
              {tab.badge && (
                <span
                  className={clsx(
                    "flex items-center justify-center rounded-full bg-purple-500/20 text-purple-200 font-semibold",
                    size === "sm" ? "w-4 h-4 text-xs" : "w-5 h-5 text-xs",
                  )}
                >
                  {tab.badge}
                </span>
              )}

              {/* Close Button */}
              {tab.closable && onTabClose && (
                <button
                  aria-label={`Close ${tab.label}`}
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                  onClick={(e) => handleTabClose(tab.id, e)}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </button>
              )}

              {/* Active Indicator */}
              {variant === "gaming" && isActive && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-400/20 to-purple-500/10 rounded-lg pointer-events-none"
                  exit={{ opacity: 0 }}
                  initial={false}
                  layoutId="activeTab"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className={clsx(
          "flex-1 relative overflow-hidden",
          orientation === "vertical" ? "ml-2" : "mt-2",
          contentClassName,
        )}
      >
        <AnimatePresence mode="wait">
          {currentTab && (
            <motion.div
              key={currentTab.id}
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby={`tab-${currentTab.id}`}
              className="h-full"
              exit={{ opacity: 0, y: -10 }}
              id={`tabpanel-${currentTab.id}`}
              initial={{ opacity: 0, y: 10 }}
              role="tabpanel"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentTab.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TabSystem;
