"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

import { TabSystem, Tab } from "./TabSystem";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import WorldLinkCanvas from "@/components/toxoid/WorldLinkCanvas";
import { ScriptEditor } from "@/components/toxoid/ScriptEditor";
import { ExportModal } from "@/components/export/ExportModal";
import { useGame } from "@/contexts/GameContext";

// Simple types for game state management
interface ToxoidGameState {
  isRunning: boolean;
  isPaused: boolean;
  fps: number;
  frameTime: number;
  entityCount: number;
  systemCount: number;
  memoryUsage: number;
}

interface GameScript {
  name: string;
  content: string;
  lastModified: Date;
}

// Individual Tab Components
const LivePlayTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<ToxoidGameState>({
    isRunning: false,
    isPaused: false,
    fps: 0,
    frameTime: 0,
    entityCount: 0,
    systemCount: 0,
    memoryUsage: 0,
  });
  const worldLinkEngineRef = useRef<any>(null);

  const handleWorldLinkReady = useCallback((engine: any) => {
    worldLinkEngineRef.current = engine;

    // Update game state to indicate engine is ready
    setGameState((prev: ToxoidGameState) => ({ ...prev, isRunning: true }));

    // Execute a basic demo script if the engine supports scripting
    const demoScript = `
// Create a simple demo scene
// Basic initialization - this will depend on the actual WorldLink API
if (typeof Module !== 'undefined' && Module._main) {
  // WorldLink engine initialized successfully
}
    `;

    // Demo script ready for execution when WorldLink API is available
  }, []);

  const handleWorldLinkError = useCallback((error: string) => {
    // TODO: Implement proper error handling/logging
    setGameState((prev: ToxoidGameState) => ({ ...prev, isRunning: false }));
  }, []);

  const handlePlay = useCallback(() => {
    // For now, just toggle the playing state
    // Actual play/pause functionality will depend on WorldLink API
    setIsPlaying((prev) => !prev);
    setGameState((prev: ToxoidGameState) => ({
      ...prev,
      isPaused: !isPlaying,
    }));
  }, [isPlaying]);

  const handleReset = useCallback(async () => {
    // Reset functionality will depend on WorldLink API
    setIsPlaying(false);
    setGameState((prev: ToxoidGameState) => ({ ...prev, isPaused: false }));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Game Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <GlassmorphicButton
            className="flex items-center space-x-2"
            variant={isPlaying ? "danger" : "gaming"}
            onClick={handlePlay}
          >
            {isPlaying ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>Stop</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
              </>
            )}
          </GlassmorphicButton>

          <GlassmorphicButton size="sm" variant="glass" onClick={handleReset}>
            Reset
          </GlassmorphicButton>

          <GlassmorphicBadge variant="gaming">
            Entities: {gameState.entityCount}
          </GlassmorphicBadge>
        </div>

        <div className="flex items-center space-x-2 text-sm text-white/60">
          <span>FPS: {Math.round(gameState.fps)}</span>
          <span>•</span>
          <span>Systems: {gameState.systemCount}</span>
          <span>•</span>
          <span>
            Memory: {(gameState.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </span>
        </div>
      </div>

      {/* WorldLink Engine */}
      <div className="flex-1 p-4">
        <WorldLinkCanvas
          className="w-full h-full"
          enableDebugMode={true}
          height={720}
          width={1280}
          onError={handleWorldLinkError}
          onReady={handleWorldLinkReady}
        />
      </div>

      {/* Game Instructions */}
      <div className="p-4 border-t border-white/10 text-xs text-white/60 space-y-1">
        <div>Use WASD or Arrow Keys to interact with the game</div>
        <div>Click Play to start the WorldLink engine</div>
        <div>
          This demo shows WorldLink/Toxoid engine integration with WebGPU/WebGL
          fallback
        </div>
      </div>
    </div>
  );
};

const MapEditorTab = () => {
  const [selectedTool, setSelectedTool] = useState("brush");
  const [gridSize, setGridSize] = useState(32);
  const [showGrid, setShowGrid] = useState(true);

  const tools = [
    { id: "brush", name: "Brush", icon: "🖌️" },
    { id: "eraser", name: "Eraser", icon: "🧹" },
    { id: "fill", name: "Fill", icon: "🪣" },
    { id: "select", name: "Select", icon: "⭕" },
    { id: "move", name: "Move", icon: "↔️" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {tools.map((tool) => (
              <GlassmorphicButton
                key={tool.id}
                size="sm"
                title={tool.name}
                variant={selectedTool === tool.id ? "gaming" : "glass"}
                onClick={() => setSelectedTool(tool.id)}
              >
                {tool.icon}
              </GlassmorphicButton>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-white/60">Grid:</label>
              <GlassmorphicInput
                className="w-16"
                max="64"
                min="16"
                size="sm"
                step="16"
                type="number"
                value={gridSize.toString()}
                onChange={(e) => setGridSize(Number(e.target.value))}
              />
            </div>

            <GlassmorphicButton
              size="sm"
              variant={showGrid ? "gaming" : "glass"}
              onClick={() => setShowGrid(!showGrid)}
            >
              Grid
            </GlassmorphicButton>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <GlassmorphicCard className="h-full" variant="strong">
            <div className="relative h-full rounded-lg overflow-hidden">
              <canvas
                className="w-full h-full object-contain"
                height={600}
                style={{
                  imageRendering: "pixelated",
                  background: showGrid
                    ? `repeating-conic-gradient(#333 0% 25%, transparent 0% 50%) 50% / ${gridSize}px ${gridSize}px`
                    : "#1a1a2e",
                }}
                width={800}
              />

              {/* Tool cursor */}
              <div className="absolute top-4 left-4 text-xs text-white/60">
                Tool: {tools.find((t) => t.id === selectedTool)?.name}
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Tileset Panel */}
        <div className="w-64 p-4 pl-0">
          <GlassmorphicCard className="h-full" variant="subtle">
            <div className="p-3">
              <h4 className="text-sm font-semibold mb-3 text-white/80">
                Tileset
              </h4>

              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }, (_, i) => (
                  <button
                    key={i}
                    className="aspect-square bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded border border-white/20 hover:border-purple-400/50 transition-colors"
                    title={`Tile ${i + 1}`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                      {i + 1}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <GlassmorphicButton
                  className="w-full"
                  size="sm"
                  variant="glass"
                  onClick={() => {
                    // Trigger file input for tileset import
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = false;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        console.log('Importing tileset:', files[0].name, files[0].size + ' bytes');
                        // TODO: Implement actual tileset import
                        console.log('Tileset import functionality coming soon!');
                      }
                    };
                    input.click();
                  }}
                >
                  Import Tileset
                </GlassmorphicButton>
                <GlassmorphicButton
                  className="w-full"
                  size="sm"
                  variant="glass-ghost"
                  onClick={() => {
                    console.log('Generating tiles with AI');
                    // Non-blocking notification instead of blocking alert
                    // TODO: Implement AI tile generation
                    setTimeout(() => {
                      console.log('AI tile generation started...');
                      // This could trigger a toast notification instead
                    }, 0);
                  }}
                >
                  Generate Tiles
                </GlassmorphicButton>
              </div>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
};

const CodeEditorTab = () => {
  const { currentGame, updateGameScript, addGameScript, isInitializing, isLoading } = useGame();
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const toxoidEngineRef = useRef<any>(null);

  console.log('[CodeEditorTab] Render - currentGame exists:', !!currentGame);
  console.log('[CodeEditorTab] Render - currentGame scripts length:', currentGame?.scripts?.length || 0);
  console.log('[CodeEditorTab] Render - isInitializing:', isInitializing);
  console.log('[CodeEditorTab] Render - isLoading:', isLoading);
  console.log('[CodeEditorTab] Render - selectedScriptIndex:', selectedScriptIndex);

  // Default Toxoid script (moved above useEffect to fix reference issue)
  const defaultCode = `// Toxoid Game Script
console.log("Starting new game script...");

// Register game components
Toxoid.registerComponent("Player", [
    { name: "speed", type: "number" },
    { name: "health", type: "number" },
    { name: "level", type: "number" }
]);

Toxoid.registerComponent("Enemy", [
    { name: "damage", type: "number" },
    { name: "ai_type", type: "string" }
]);

// Create player entity
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Sprite");
player.add("Player");

// Set player properties
const playerPos = player.getComponent("Position");
playerPos.x = 100;
playerPos.y = 100;

const playerData = player.getComponent("Player");
playerData.speed = 150;
playerData.health = 100;
playerData.level = 1;

// Create player movement system
Toxoid.System.create("PlayerMovement", "Position, Player", Toxoid.Phases.ON_UPDATE,
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

console.log("Game script loaded successfully!");`;

  // Ensure we have at least one script - but only after initialization is complete
  useEffect(() => {
    console.log('[CodeEditorTab] useEffect - currentGame:', !!currentGame);
    console.log('[CodeEditorTab] useEffect - scripts length:', currentGame?.scripts?.length || 0);
    console.log('[CodeEditorTab] useEffect - isInitializing:', isInitializing);
    console.log('[CodeEditorTab] useEffect - isLoading:', isLoading);
    
    // Only add default script if we're not initializing/loading and have no scripts
    if (currentGame && 
        !isInitializing && 
        !isLoading && 
        Array.isArray(currentGame.scripts) && 
        currentGame.scripts.length === 0) {
      console.log('[CodeEditorTab] Adding default script...');
      setIsLoadingScripts(true);
      addGameScript({
        name: 'Main Script',
        javascript_code: defaultCode,
        script_type: 'initialization',
        description: 'Main game initialization script',
        is_active: true,
        execution_order: 0,
        dependencies: []
      });
      setIsLoadingScripts(false);
    }
  }, [currentGame?.id, currentGame?.scripts?.length, isInitializing, isLoading, addGameScript]);

  const currentScript = currentGame?.scripts[selectedScriptIndex] || null;
  console.log('[CodeEditorTab] Current script exists:', !!currentScript);
  console.log('[CodeEditorTab] Current script name:', currentScript?.name || 'none');

  const handleScriptExecute = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        // Get the Toxoid engine from the Live Play tab
        // This is a simplified approach - in a real implementation,
        // we'd have a shared context or state management

        // For now, just validate the script syntax
        const isValid =
          !code.includes("undefined_function") && code.includes("Toxoid");

        if (isValid) {
          // TODO: Implement proper script execution feedback
          return true;
        } else {
          // TODO: Implement proper error reporting
          return false;
        }
      } catch (error) {
        // TODO: Implement proper error handling
        return false;
      }
    },
    [],
  );

  const handleScriptSave = useCallback((script: { name: string; content: string; lastModified: Date }) => {
    if (currentScript) {
      updateGameScript(selectedScriptIndex, {
        name: script.name,
        javascript_code: script.content
      });
    }
  }, [currentScript, selectedScriptIndex, updateGameScript]);

  const handleScriptChange = useCallback(
    (code: string) => {
      // Update current script content with auto-save
      if (currentScript) {
        updateGameScript(selectedScriptIndex, {
          javascript_code: code
        });
      }
    },
    [currentScript, selectedScriptIndex, updateGameScript],
  );

  // Show loading state during initialization or when game doesn't exist
  if (!currentGame || isInitializing || isLoading || isLoadingScripts) {
    const loadingMessage = isInitializing ? 
      'Initializing game from template...' : 
      isLoading ? 
      'Loading game data...' : 
      isLoadingScripts ?
      'Loading scripts...' :
      'Preparing Code Editor...';
    
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60">{loadingMessage}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Script Selector */}
      {currentGame.scripts.length > 1 && (
        <div className="p-4 border-b border-white/10">
          <select
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            value={selectedScriptIndex}
            onChange={(e) => setSelectedScriptIndex(Number(e.target.value))}
          >
            {currentGame.scripts.map((script, index) => (
              <option key={index} value={index} className="bg-gray-800">
                {script.name} ({script.script_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Script Editor */}
      <div className="flex-1">
        <ScriptEditor
          className="h-full"
          initialCode={currentScript?.javascript_code || defaultCode}
          showLineNumbers={true}
          theme="dark"
          onCodeChange={handleScriptChange}
          onExecute={handleScriptExecute}
          onSave={handleScriptSave}
        />
      </div>
    </div>
  );
};

const SettingsTab = () => {
  const { currentGame, updateGame, updateGameSettings } = useGame();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Initialize local settings from game data
  const settings = {
    gameTitle: currentGame?.title || "My Cyberpunk Platformer",
    resolution: currentGame?.game_data?.resolution || "640x480",
    fps: currentGame?.game_data?.fps || 60,
    pixelPerfect: currentGame?.game_data?.pixelPerfect || true,
    showFPS: currentGame?.game_data?.showFPS || true,
    enableSounds: currentGame?.game_data?.enableSounds || true,
    musicVolume: currentGame?.game_data?.musicVolume || 70,
    sfxVolume: currentGame?.game_data?.sfxVolume || 85,
  };

  const updateSetting = (key: string, value: any) => {
    if (key === 'gameTitle') {
      updateGame({ title: value });
    } else {
      updateGame({
        game_data: {
          ...currentGame?.game_data,
          [key]: value
        }
      });
    }
  };

  const handleExportClick = (platform: string) => {
    setSelectedPlatform(platform);
    setIsExportModalOpen(true);
  };

  const handleExportSuccess = (jobId: string) => {
    // Handle successful export - could show notification here
    // TODO: Add notification system for export success
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Game Settings */}
      <GlassmorphicCard className="p-4" variant="gaming">
        <h3 className="text-lg font-semibold mb-4 text-white/90">
          Game Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Game Title
            </label>
            <GlassmorphicInput
              placeholder="Enter your game title"
              value={settings.gameTitle}
              onChange={(e) => updateSetting("gameTitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Resolution
              </label>
              <select
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                value={settings.resolution}
                onChange={(e) => updateSetting("resolution", e.target.value)}
              >
                <option value="640x480">640 × 480</option>
                <option value="800x600">800 × 600</option>
                <option value="1024x768">1024 × 768</option>
                <option value="1280x720">1280 × 720</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Target FPS
              </label>
              <GlassmorphicInput
                max="120"
                min="30"
                step="30"
                type="number"
                value={settings.fps.toString()}
                onChange={(e) => updateSetting("fps", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "pixelPerfect", label: "Pixel Perfect Rendering" },
              { key: "showFPS", label: "Show FPS Counter" },
              { key: "enableSounds", label: "Enable Sound Effects" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  checked={settings[key as keyof typeof settings] as boolean}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 focus:ring-purple-500/50"
                  type="checkbox"
                  onChange={(e) => updateSetting(key, e.target.checked)}
                />
                <span className="text-sm text-white/70">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </GlassmorphicCard>

      {/* Audio Settings */}
      <GlassmorphicCard className="p-4" variant="accent-emerald">
        <h3 className="text-lg font-semibold mb-4 text-white/90">
          Audio Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Music Volume: {settings.musicVolume}%
            </label>
            <input
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              max="100"
              min="0"
              type="range"
              value={settings.musicVolume}
              onChange={(e) =>
                updateSetting("musicVolume", Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              SFX Volume: {settings.sfxVolume}%
            </label>
            <input
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              max="100"
              min="0"
              type="range"
              value={settings.sfxVolume}
              onChange={(e) =>
                updateSetting("sfxVolume", Number(e.target.value))
              }
            />
          </div>
        </div>
      </GlassmorphicCard>

      {/* Export Settings */}
      <GlassmorphicCard className="p-4" variant="accent-cyan">
        <h3 className="text-lg font-semibold mb-4 text-white/90">
          Export & Publishing
        </h3>

        <div className="space-y-3">
          <GlassmorphicButton 
            className="w-full" 
            variant="gaming"
            onPress={() => handleExportClick('web')}
          >
            Export to Web (HTML5)
          </GlassmorphicButton>

          <GlassmorphicButton 
            className="w-full" 
            variant="accent"
            onPress={() => handleExportClick('desktop-windows')}
          >
            Export to Desktop
          </GlassmorphicButton>

          <GlassmorphicButton 
            className="w-full" 
            variant="glass"
            onPress={() => handleExportClick('share')}
          >
            Share Project Link
          </GlassmorphicButton>
        </div>
      </GlassmorphicCard>

      {/* Export Modal */}
      {currentGame?.id && (
        <ExportModal
          gameId={currentGame.id}
          gameTitle={settings.gameTitle}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExportSuccess={handleExportSuccess}
        />
      )}
    </div>
  );
};

export function EditorPanel() {
  const [activeTab, setActiveTab] = useState("liveplay");

  const tabs: Tab[] = [
    {
      id: "liveplay",
      label: "Live Play",
      icon: ({ className }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      ),
      content: <LivePlayTab />,
    },
    {
      id: "mapeditor",
      label: "Map Editor",
      icon: ({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
      content: <MapEditorTab />,
    },
    {
      id: "codeeditor",
      label: "Code Editor",
      icon: ({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
      content: <CodeEditorTab />,
      badge: "1", // Error count
    },
    {
      id: "settings",
      label: "Settings",
      icon: ({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
      content: <SettingsTab />,
    },
  ];

  return (
    <GlassmorphicCard {...GameGenCardPresets.gameCard} className="h-full">
      <TabSystem
        activeTab={activeTab}
        className="h-full"
        contentClassName="p-0"
        tabs={tabs}
        variant="gaming"
        onTabChange={setActiveTab}
      />
    </GlassmorphicCard>
  );
}
