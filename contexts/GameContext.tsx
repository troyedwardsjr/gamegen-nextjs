"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGamePersistence, GameData, GamePersistenceState } from '@/hooks/useGamePersistence';
import { useAuth } from '@/lib/auth/context';
import { GlassmorphicCard, GameGenCardPresets } from '@/components/ui/GlassmorphicCard';
import { GlassmorphicButton } from '@/components/ui/GlassmorphicButton';
import { motion, AnimatePresence } from 'framer-motion';

interface GameContextType extends GamePersistenceState {
  // Game management
  loadGame: (id: string) => Promise<GameData | null>;
  createGame: (initialData?: Partial<GameData>) => Promise<GameData | null>;
  updateGame: (changes: Partial<GameData>) => void;
  saveGame: (gameData?: Partial<GameData>, createVersion?: boolean) => Promise<boolean>;
  forceSave: () => Promise<boolean>;
  
  // Game data helpers
  updateGameSettings: (settings: Partial<GameData['settings']>) => void;
  updateGameScript: (scriptIndex: number, updates: Partial<GameData['scripts'][0]>) => void;
  addGameScript: (script: Partial<GameData['scripts'][0]>) => void;
  removeGameScript: (scriptIndex: number) => void;
  updateGameAsset: (assetIndex: number, updates: Partial<GameData['assets'][0]>) => void;
  addGameAsset: (asset: Partial<GameData['assets'][0]>) => void;
  removeGameAsset: (assetIndex: number) => void;
  
  // Utilities
  clearError: () => void;
  resolveConflict: (useLocal: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: React.ReactNode;
  gameId?: string;
}

export function GameProvider({ children, gameId: propGameId }: GameProviderProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const gameId = propGameId || searchParams.get('gameId') || undefined;
  
  const {
    currentGame,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error,
    saveStatus,
    conflictData,
    loadGame,
    createGame,
    updateGame,
    saveGame,
    forceSave,
    clearError,
    resolveConflict
  } = useGamePersistence({
    gameId,
    autoSaveInterval: 10000, // 10 seconds
    enableRealTimeSync: true,
    enableVersionControl: true,
    onSaveSuccess: (game) => {
      console.log('Game saved successfully:', game.title);
    },
    onSaveError: (error) => {
      console.error('Failed to save game:', error);
    },
    onConflict: (localData, serverData) => {
      console.warn('Save conflict detected:', { localData, serverData });
    }
  });

  // Game data helper functions
  const updateGameSettings = (settings: Partial<GameData['settings']>) => {
    if (!currentGame) return;
    
    updateGame({
      settings: { ...currentGame.settings, ...settings },
      // Update top-level fields too for backwards compatibility
      genre: settings.genre || currentGame.genre,
      tags: settings.tags || currentGame.tags,
      visibility: settings.visibility || currentGame.visibility,
      thumbnail_url: settings.thumbnail_url || currentGame.thumbnail_url
    });
  };

  const updateGameScript = (scriptIndex: number, updates: Partial<GameData['scripts'][0]>) => {
    if (!currentGame || !currentGame.scripts[scriptIndex]) return;
    
    const updatedScripts = [...currentGame.scripts];
    updatedScripts[scriptIndex] = { ...updatedScripts[scriptIndex], ...updates };
    
    updateGame({ scripts: updatedScripts });
  };

  const addGameScript = (script: Partial<GameData['scripts'][0]>) => {
    if (!currentGame) return;
    
    const newScript = {
      name: script.name || 'New Script',
      javascript_code: script.javascript_code || '// New script\nconsole.log("Hello, GameGen!");',
      script_type: script.script_type || 'component' as const,
      description: script.description || '',
      is_active: script.is_active !== undefined ? script.is_active : true,
      execution_order: script.execution_order || currentGame.scripts.length,
      dependencies: script.dependencies || []
    };
    
    updateGame({ scripts: [...currentGame.scripts, newScript] });
  };

  const removeGameScript = (scriptIndex: number) => {
    if (!currentGame || !currentGame.scripts[scriptIndex]) return;
    
    const updatedScripts = currentGame.scripts.filter((_, index) => index !== scriptIndex);
    updateGame({ scripts: updatedScripts });
  };

  const updateGameAsset = (assetIndex: number, updates: Partial<GameData['assets'][0]>) => {
    if (!currentGame || !currentGame.assets[assetIndex]) return;
    
    const updatedAssets = [...currentGame.assets];
    updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], ...updates };
    
    updateGame({ assets: updatedAssets });
  };

  const addGameAsset = (asset: Partial<GameData['assets'][0]>) => {
    if (!currentGame) return;
    
    const newAsset = {
      name: asset.name || 'New Asset',
      asset_type: asset.asset_type || 'sprite' as const,
      file_path: asset.file_path || '',
      file_size: asset.file_size,
      mime_type: asset.mime_type,
      properties: asset.properties || {},
      generated_by_ai: asset.generated_by_ai || false,
      generation_prompt: asset.generation_prompt
    };
    
    updateGame({ assets: [...currentGame.assets, newAsset] });
  };

  const removeGameAsset = (assetIndex: number) => {
    if (!currentGame || !currentGame.assets[assetIndex]) return;
    
    const updatedAssets = currentGame.assets.filter((_, index) => index !== assetIndex);
    updateGame({ assets: updatedAssets });
  };

  // Create default game if none provided and user is authenticated
  useEffect(() => {
    if (user && !gameId && !currentGame && !isLoading) {
      // Check for URL parameters from creator page
      const template = searchParams.get('template');
      const title = searchParams.get('title');
      
      // Create game with template data if available
      createGame({
        title: title || 'New Game',
        description: template ? `A ${template} game created with GameGen` : 'A new game created with GameGen',
        game_data: {
          template,
          // Add template-specific configurations
          ...(template === 'platformer' && {
            physics: { gravity: 9.8, friction: 0.1 },
            controls: { jumpHeight: 10, moveSpeed: 5 }
          }),
          ...(template === 'puzzle' && {
            gridSize: 8,
            moveLimit: 100
          }),
          ...(template === 'shooter' && {
            playerSpeed: 7,
            bulletSpeed: 15
          }),
          ...(template === 'rpg' && {
            startingLevel: 1,
            skillPoints: 10
          }),
          ...(template === 'racing' && {
            trackCount: 3,
            maxSpeed: 200
          })
        },
        settings: {
          genre: template || 'platformer',
          tags: template ? [template] : [],
          visibility: 'private'
        },
        scripts: [],
        assets: []
      });
    }
  }, [user, gameId, currentGame, isLoading, createGame, searchParams]);

  const contextValue: GameContextType = {
    // State
    currentGame,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error,
    saveStatus,
    conflictData,
    
    // Actions
    loadGame,
    createGame,
    updateGame,
    saveGame,
    forceSave,
    
    // Helpers
    updateGameSettings,
    updateGameScript,
    addGameScript,
    removeGameScript,
    updateGameAsset,
    addGameAsset,
    removeGameAsset,
    
    // Utilities
    clearError,
    resolveConflict
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
      
      {/* Save Conflict Resolution Modal */}
      <AnimatePresence>
        {saveStatus === 'conflict' && conflictData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
            >
              <GlassmorphicCard {...GameGenCardPresets.modalCard} className="max-w-2xl w-full">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Save Conflict Detected</h3>
                      <p className="text-white/60">
                        Someone else has modified this game. Choose which version to keep.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Your Version</h4>
                      <div className="bg-white/10 rounded-lg p-3 text-sm">
                        <p><strong>Title:</strong> {currentGame?.title}</p>
                        <p><strong>Last Modified:</strong> {lastSaved?.toLocaleString()}</p>
                        <p><strong>Scripts:</strong> {currentGame?.scripts.length || 0}</p>
                        <p><strong>Assets:</strong> {currentGame?.assets.length || 0}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Server Version</h4>
                      <div className="bg-white/10 rounded-lg p-3 text-sm">
                        <p><strong>Title:</strong> {conflictData.title}</p>
                        <p><strong>Last Modified:</strong> Recent</p>
                        <p><strong>Scripts:</strong> {conflictData.scripts.length || 0}</p>
                        <p><strong>Assets:</strong> {conflictData.assets.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <GlassmorphicButton
                      variant="glass"
                      onClick={() => resolveConflict(false)}
                    >
                      Use Server Version
                    </GlassmorphicButton>
                    <GlassmorphicButton
                      variant="gaming"
                      onClick={() => resolveConflict(true)}
                    >
                      Use My Version
                    </GlassmorphicButton>
                  </div>
                </div>
              </GlassmorphicCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-50"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <GlassmorphicCard variant="accent-rose" className="p-4 max-w-sm">
              <div className="flex items-start space-x-3">
                <div className="text-red-400">⚠️</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-200">Save Error</h4>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
                <button
                  className="text-red-300 hover:text-red-100 transition-colors"
                  onClick={clearError}
                >
                  ✕
                </button>
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}