"use client";

import React, { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import { ResizablePanel } from "./ResizablePanel";
import { ChatPanel } from "./ChatPanel";
import { EditorPanel } from "./EditorPanel";
import { AssetsPanel } from "./AssetsPanel";

import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { SaveStatusIndicator, CompactSaveStatus } from "@/components/game/SaveStatusIndicator";
import { useGame } from "@/contexts/GameContext";

interface PanelState {
  chatCollapsed: boolean;
  assetsCollapsed: boolean;
  chatWidth: number;
  assetsWidth: number;
}

type MobileView = "chat" | "editor" | "assets";

export function GameCreatorLayout() {
  // Game context for save status and data management
  const { currentGame, forceSave, hasUnsavedChanges } = useGame();
  
  // Panel state management
  const [panelState, setPanelState] = useState<PanelState>({
    chatCollapsed: false,
    assetsCollapsed: false,
    chatWidth: 320,
    assetsWidth: 300,
  });

  // Mobile view state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("editor");

  // Collaboration indicators
  const [collaborators] = useState([
    { id: "1", name: "Alice", avatar: "A", color: "cyan" },
    { id: "2", name: "Bob", avatar: "B", color: "emerald" },
  ]);

  const [isOnline, setIsOnline] = useState(true);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("gameCreator-panelState");

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as PanelState;

        setPanelState(parsed);
      } catch (error) {
        console.warn("Failed to parse saved panel state:", error);
      }
    }
  }, []);

  // Save panel state to localStorage
  const updatePanelState = useCallback((updates: Partial<PanelState>) => {
    setPanelState((current) => {
      const newState = { ...current, ...updates };

      localStorage.setItem("gameCreator-panelState", JSON.stringify(newState));

      return newState;
    });
  }, []);

  // Panel handlers
  const handleChatResize = useCallback(
    (width: number) => {
      updatePanelState({ chatWidth: width });
    },
    [updatePanelState],
  );

  const handleAssetsResize = useCallback(
    (width: number) => {
      updatePanelState({ assetsWidth: width });
    },
    [updatePanelState],
  );

  const handleChatCollapse = useCallback(
    (collapsed: boolean) => {
      updatePanelState({ chatCollapsed: collapsed });
    },
    [updatePanelState],
  );

  const handleAssetsCollapse = useCallback(
    (collapsed: boolean) => {
      updatePanelState({ assetsCollapsed: collapsed });
    },
    [updatePanelState],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s": // Save shortcut
            e.preventDefault();
            forceSave();
            break;
          case "1":
            e.preventDefault();
            if (isMobile) {
              setMobileView("chat");
            } else {
              handleChatCollapse(!panelState.chatCollapsed);
            }
            break;
          case "2":
            e.preventDefault();
            if (isMobile) {
              setMobileView("editor");
            }
            break;
          case "3":
            e.preventDefault();
            if (isMobile) {
              setMobileView("assets");
            } else {
              handleAssetsCollapse(!panelState.assetsCollapsed);
            }
            break;
          case "\\": // Toggle all panels
            e.preventDefault();
            if (!isMobile) {
              const allCollapsed =
                panelState.chatCollapsed && panelState.assetsCollapsed;

              updatePanelState({
                chatCollapsed: !allCollapsed,
                assetsCollapsed: !allCollapsed,
              });
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isMobile,
    panelState,
    handleChatCollapse,
    handleAssetsCollapse,
    updatePanelState,
    forceSave,
  ]);

  // Online status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1); // 90% chance of being online
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        {/* Mobile Navigation */}
        <GlassmorphicCard
          {...GameGenCardPresets.floatingPanel}
          className="m-2 mb-0 flex-shrink-0"
        >
          <div className="flex items-center justify-between p-2">
            {/* Panel Navigation */}
            <div className="flex space-x-1">
              {[
                { id: "chat", label: "Chat", icon: "💬" },
                { id: "editor", label: "Editor", icon: "🎮" },
                { id: "assets", label: "Assets", icon: "🎨" },
              ].map((panel) => (
                <GlassmorphicButton
                  key={panel.id}
                  size="sm"
                  variant={mobileView === panel.id ? "gaming" : "glass"}
                  onClick={() => setMobileView(panel.id as MobileView)}
                >
                  <span className="mr-1">{panel.icon}</span>
                  {panel.label}
                </GlassmorphicButton>
              ))}
            </div>

            {/* Collaboration Status */}
            <div className="flex items-center space-x-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-emerald-400" : "bg-red-400",
                )}
              />
              <div className="flex -space-x-2">
                {collaborators.map((user) => (
                  <div
                    key={user.id}
                    className={clsx(
                      "w-6 h-6 rounded-full border-2 border-white/20",
                      "flex items-center justify-center text-xs font-bold",
                      `bg-${user.color}-500/20 text-${user.color}-200`,
                    )}
                    title={user.name}
                  >
                    {user.avatar}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassmorphicCard>

        {/* Mobile Panel Content */}
        <div className="flex-1 m-2 mt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileView}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {mobileView === "chat" && <ChatPanel />}
              {mobileView === "editor" && <EditorPanel />}
              {mobileView === "assets" && <AssetsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop Header */}
      <GlassmorphicCard
        {...GameGenCardPresets.floatingPanel}
        className="m-4 mb-2 flex-shrink-0"
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {currentGame?.title || 'GameGen Creator'}
              </h1>
              <CompactSaveStatus />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <GlassmorphicButton 
                size="sm" 
                variant={hasUnsavedChanges ? "gaming" : "glass-ghost"}
                onClick={() => forceSave()}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? "Save Changes" : "Saved"} (Ctrl+S)
              </GlassmorphicButton>
              <GlassmorphicButton size="sm" variant="gaming">
                Play Test
              </GlassmorphicButton>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Collaboration Status */}
            <div className="flex items-center space-x-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full animate-pulse",
                  isOnline ? "bg-emerald-400" : "bg-red-400",
                )}
              />
              <span className="text-sm text-white/60">
                {isOnline ? "Online" : "Offline"}
              </span>
              <div className="flex -space-x-2">
                {collaborators.map((user) => (
                  <div
                    key={user.id}
                    className={clsx(
                      "w-8 h-8 rounded-full border-2 border-white/20",
                      "flex items-center justify-center text-sm font-bold",
                      `bg-${user.color}-500/20 text-${user.color}-200`,
                    )}
                    title={user.name}
                  >
                    {user.avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-xs text-white/40">
              Ctrl+1/2/3 to toggle panels
            </div>
          </div>
        </div>
      </GlassmorphicCard>

      {/* Desktop Three-Panel Layout */}
      <div className="flex-1 mx-4 mb-4 flex gap-2 min-h-0">
        {/* Left Panel - Chat */}
        <ResizablePanel
          className="h-full"
          collapsed={panelState.chatCollapsed}
          defaultWidth={panelState.chatWidth}
          direction="right"
          id="chat"
          maxWidth={500}
          minWidth={250}
          onCollapse={handleChatCollapse}
          onResize={handleChatResize}
        >
          <ChatPanel />
        </ResizablePanel>

        {/* Center Panel - Editor */}
        <div className="flex-1 min-w-0">
          <EditorPanel />
        </div>

        {/* Right Panel - Assets */}
        <ResizablePanel
          className="h-full"
          collapsed={panelState.assetsCollapsed}
          defaultWidth={panelState.assetsWidth}
          direction="left"
          id="assets"
          maxWidth={500}
          minWidth={250}
          onCollapse={handleAssetsCollapse}
          onResize={handleAssetsResize}
        >
          <AssetsPanel />
        </ResizablePanel>
      </div>
    </div>
  );
}
