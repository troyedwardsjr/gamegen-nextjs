"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGamePersistence, GameData, GamePersistenceState } from '@/hooks/useGamePersistence';
import { useAuth } from '@/lib/auth/context';
import { GlassmorphicCard, GameGenCardPresets } from '@/components/ui/GlassmorphicCard';
import { GlassmorphicButton } from '@/components/ui/GlassmorphicButton';
import { motion, AnimatePresence } from 'framer-motion';

interface GameContextType extends GamePersistenceState {
  // Additional state
  isInitializing: boolean;
  
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

  // Helper function to get template script content
  const getTemplateScript = (template: string): GameData['scripts'][0] | null => {
    console.log('[GameContext] Getting template script for:', template);
    
    switch (template) {
      case 'platformer':
        return {
          name: 'Platformer Game Script',
          javascript_code: `// Simple Platformer Template
class SimplePlatformer {
  constructor() {
    this.GRAVITY = 800;
    this.JUMP_FORCE = -350;
    this.MOVE_SPEED = 200;
    
    console.log("Initializing Simple Platformer...");
    this.init();
  }
  
  init() {
    // Create components
    Toxoid.API.createComponent("Player");
    Toxoid.API.createComponent("Platform");
    Toxoid.API.createComponent("Gravity");
    Toxoid.API.createComponent("Grounded");
    
    // Register systems
    this.createInputSystem();
    this.createGravitySystem();
    this.createPlatformCollisionSystem();
    
    // Create world
    this.createPlayer();
    this.createPlatforms();
    
    console.log("Simple Platformer initialized!");
  }
  
  createPlayer() {
    const player = Toxoid.API.createEntity("Player");
    player.add("Position");
    player.add("Velocity");
    player.add("Player");
    player.add("Gravity");
    player.add("Collider");
    
    const position = player.getComponent("Position");
    position.x = 100;
    position.y = 400;
    
    const collider = player.getComponent("Collider");
    collider.width = 32;
    collider.height = 48;
    
    console.log("Player created at:", position.x, position.y);
    return player;
  }
  
  createPlatforms() {
    const platformData = [
      {x: 200, y: 500, width: 200, height: 20},
      {x: 500, y: 400, width: 150, height: 20},
      {x: 50, y: 300, width: 100, height: 20},
      {x: 600, y: 250, width: 180, height: 20}
    ];
    
    platformData.forEach(data => {
      const platform = Toxoid.API.createEntity("Platform");
      platform.add("Position");
      platform.add("Platform");
      platform.add("Collider");
      
      const position = platform.getComponent("Position");
      position.x = data.x + data.width / 2;
      position.y = data.y + data.height / 2;
      
      const collider = platform.getComponent("Collider");
      collider.width = data.width;
      collider.height = data.height;
    });
    
    console.log("Platforms created:", platformData.length);
  }
  
  createInputSystem() {
    Toxoid.System.create("PlatformerInputSystem", "Position, Player", Toxoid.Phases.PRE_UPDATE,
      (iter) => {
        const keyboard = Toxoid.API.getSingleton("KeyboardInput");
        if (!keyboard) return;
        
        iter.entities().forEach(player => {
          let velocity = player.getComponent("Velocity");
          if (!velocity) {
            player.add("Velocity");
            velocity = player.getComponent("Velocity");
          }
          
          // Horizontal movement
          velocity.x = 0;
          if (keyboard.left) velocity.x = -this.MOVE_SPEED;
          if (keyboard.right) velocity.x = this.MOVE_SPEED;
          
          // Jumping (only if grounded)
          if (keyboard.space && player.has("Grounded")) {
            velocity.y = this.JUMP_FORCE;
            player.remove("Grounded");
          }
        });
      }
    );
  }
  
  createGravitySystem() {
    Toxoid.System.create("GravitySystem", "Velocity, Gravity", Toxoid.Phases.ON_UPDATE,
      (iter) => {
        iter.entities().forEach(entity => {
          const velocity = entity.getComponent("Velocity");
          if (velocity) {
            velocity.y += this.GRAVITY * iter.deltaTime;
            
            // Terminal velocity
            if (velocity.y > 600) velocity.y = 600;
          }
        });
      }
    );
  }
  
  createPlatformCollisionSystem() {
    Toxoid.System.create("PlatformCollisionSystem", "Position, Velocity, Player", Toxoid.Phases.POST_UPDATE,
      (iter) => {
        const platforms = Toxoid.Query.create("Position, Platform, Collider");
        
        iter.entities().forEach(player => {
          const playerPos = player.getComponent("Position");
          const playerVel = player.getComponent("Velocity");
          const playerCol = player.getComponent("Collider");
          
          if (!playerPos || !playerVel || !playerCol) return;
          
          player.remove("Grounded");
          
          platforms.each(platform => {
            const platPos = platform.getComponent("Position");
            const platCol = platform.getComponent("Collider");
            
            if (this.checkAABB(playerPos, playerCol, platPos, platCol)) {
              // Simple collision resolution - landing on top
              if (playerVel.y > 0 && playerPos.y < platPos.y) {
                playerPos.y = platPos.y - platCol.height / 2 - playerCol.height / 2;
                playerVel.y = 0;
                player.add("Grounded");
              }
            }
          });
        });
      }
    );
  }
  
  checkAABB(posA, colA, posB, colB) {
    return Math.abs(posA.x - posB.x) < (colA.width + colB.width) / 2 &&
           Math.abs(posA.y - posB.y) < (colA.height + colB.height) / 2;
  }
}

// Initialize the platformer
const platformer = new SimplePlatformer();`,
          script_type: 'initialization' as const,
          description: 'Complete platformer game with player movement, gravity, and platform collision',
          is_active: true,
          execution_order: 0,
          dependencies: []
        };
      
      case 'shooter':
        return {
          name: 'Shooter Game Script',
          javascript_code: `// Basic Shooter Game
console.log("Starting Shooter Game...");

// Create player
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Velocity");
player.add("Player");

const playerPos = player.getComponent("Position");
playerPos.x = 400;
playerPos.y = 500;

const playerData = player.getComponent("Player");
playerData.speed = 200;
playerData.health = 100;

// Player movement system
Toxoid.System.create("ShooterInputSystem", "Position, Player", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    const keyboard = Toxoid.API.getKeyboardInput();
    
    iter.entities().forEach(entity => {
      const pos = entity.getComponent("Position");
      const playerData = entity.getComponent("Player");
      const speed = playerData.speed;
      
      if (keyboard && keyboard.isKeyPressed) {
        if (keyboard.isKeyPressed("ArrowLeft") || keyboard.isKeyPressed("a")) {
          pos.x -= speed * iter.deltaTime;
        }
        if (keyboard.isKeyPressed("ArrowRight") || keyboard.isKeyPressed("d")) {
          pos.x += speed * iter.deltaTime;
        }
        if (keyboard.isKeyPressed("ArrowUp") || keyboard.isKeyPressed("w")) {
          pos.y -= speed * iter.deltaTime;
        }
        if (keyboard.isKeyPressed("ArrowDown") || keyboard.isKeyPressed("s")) {
          pos.y += speed * iter.deltaTime;
        }
      }
    });
  }
);

console.log("Shooter game initialized!");`,
          script_type: 'initialization' as const,
          description: 'Basic shooter game with player movement',
          is_active: true,
          execution_order: 0,
          dependencies: []
        };
      
      default:
        return {
          name: 'Game Script',
          javascript_code: `// Basic Game Template
console.log("Starting new game...");

// Create a simple entity with position and movement
const entity = Toxoid.API.createEntity("GameEntity");
entity.add("Position");
entity.add("Velocity");

const position = entity.getComponent("Position");
position.x = 100;
position.y = 100;

console.log("Game initialized!");`,
          script_type: 'initialization' as const,
          description: 'Basic game initialization script',
          is_active: true,
          execution_order: 0,
          dependencies: []
        };
    }
  };

  // State to track if we're initializing from template
  const [isInitializing, setIsInitializing] = useState(false);

  // Create default game if none provided and user is authenticated
  useEffect(() => {
    if (user && !gameId && !currentGame && !isLoading && !isInitializing) {
      // Check for URL parameters from creator page
      const template = searchParams.get('template');
      const title = searchParams.get('title');
      
      console.log('[GameContext] Creating game from template:', template, 'with title:', title);
      
      // Set initializing state
      setIsInitializing(true);
      
      // Get template script if available
      const templateScript = template ? getTemplateScript(template) : null;
      const scripts = templateScript ? [templateScript] : [];
      
      console.log('[GameContext] Template scripts to include:', scripts.length);
      if (scripts.length > 0) {
        console.log('[GameContext] First script name:', scripts[0].name);
      }
      
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
        scripts,
        assets: []
      }).then((gameData) => {
        console.log('[GameContext] Game creation completed with scripts:', gameData?.scripts?.length || 0);
        setIsInitializing(false);
      }).catch((error) => {
        console.error('[GameContext] Game creation failed:', error);
        setIsInitializing(false);
      });
    }
  }, [user, gameId, currentGame, isLoading, isInitializing, createGame, searchParams]);

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
    isInitializing,
    
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