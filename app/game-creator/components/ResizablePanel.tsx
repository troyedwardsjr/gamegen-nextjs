"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface ResizablePanelProps {
  id: string;
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  direction?: "left" | "right";
  resizable?: boolean;
  className?: string;
  onResize?: (width: number) => void;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function ResizablePanel({
  id,
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  direction = "right",
  resizable = true,
  className,
  onResize,
  collapsed = false,
  onCollapse,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  // Mouse resize handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (direction === "left") {
        newWidth = panelRect.right - e.clientX;
      } else {
        newWidth = e.clientX - panelRect.left;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
      onResize?.(newWidth);
    },
    [isResizing, direction, minWidth, maxWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
  }, []);

  // Touch resize handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isResizing || !panelRef.current) return;

      const touch = e.touches[0];
      const panelRect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (direction === "left") {
        newWidth = panelRect.right - touch.clientX;
      } else {
        newWidth = touch.clientX - panelRect.left;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
      onResize?.(newWidth);
    },
    [isResizing, direction, minWidth, maxWidth, onResize]
  );

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "[":
            e.preventDefault();
            onCollapse?.(!collapsed);
            break;
          case "]":
            e.preventDefault();
            onCollapse?.(!collapsed);
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, onCollapse]);

  const toggleCollapsed = () => {
    onCollapse?.(!collapsed);
  };

  const currentWidth = collapsed ? 0 : width;
  const resizerPosition = direction === "left" ? "left-0" : "right-0";

  return (
    <motion.div
      ref={panelRef}
      className={clsx(
        "relative flex-shrink-0 overflow-hidden",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{ width: currentWidth }}
      initial={false}
      animate={{ 
        width: currentWidth,
        opacity: collapsed ? 0 : 1 
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      data-panel-id={id}
    >
      {/* Panel Content */}
      <div className={clsx("h-full", collapsed && "pointer-events-none")}>
        {children}
      </div>

      {/* Resizer Handle */}
      {resizable && !collapsed && (
        <div
          ref={resizerRef}
          className={clsx(
            "absolute top-0 bottom-0 w-1 cursor-col-resize group",
            "hover:bg-purple-400/20 active:bg-purple-400/40",
            "transition-colors duration-200",
            resizerPosition,
            isDragging && "bg-purple-400/40"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Visual Indicator */}
          <div
            className={clsx(
              "absolute top-1/2 -translate-y-1/2 w-4 h-12",
              "bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-full",
              "border border-white/20 dark:border-black/20",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              direction === "left" ? "-left-6" : "-right-6",
              isDragging && "opacity-100"
            )}
          >
            <div className="flex items-center justify-center h-full">
              <div className="w-0.5 h-6 bg-white/40 dark:bg-black/40 rounded-full" />
            </div>
          </div>

          {/* Touch Target */}
          <div
            className={clsx(
              "absolute top-0 bottom-0 w-8",
              direction === "left" ? "-left-4" : "-right-4"
            )}
          />
        </div>
      )}

      {/* Collapse Toggle Button */}
      {onCollapse && (
        <button
          onClick={toggleCollapsed}
          className={clsx(
            "absolute top-4 w-6 h-6 rounded-full",
            "bg-white/10 dark:bg-black/10 backdrop-blur-sm",
            "border border-white/20 dark:border-black/20",
            "flex items-center justify-center",
            "hover:bg-white/20 dark:hover:bg-black/20",
            "hover:border-purple-400/40",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
            "z-10",
            direction === "left" ? "left-2" : "right-2",
            collapsed && "opacity-50"
          )}
          title={collapsed ? `Expand ${id}` : `Collapse ${id}`}
          aria-label={collapsed ? `Expand ${id}` : `Collapse ${id}`}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {direction === "left" ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 1.414L9.414 11l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </motion.div>
        </button>
      )}
    </motion.div>
  );
}

export default ResizablePanel;