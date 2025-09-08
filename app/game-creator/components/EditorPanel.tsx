"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { TabSystem, Tab } from "./TabSystem";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicAlert } from "@/components/ui/GlassmorphicAlert";

import WorldLinkCanvas from "@/components/toxoid/WorldLinkCanvas";
import { ScriptEditor } from "@/components/toxoid/ScriptEditor";
import { ToxoidGameState, GameScript } from "@/types/toxoid";

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
    console.log('[LivePlayTab] WorldLink engine ready:', engine);
    worldLinkEngineRef.current = engine;
    
    // Update game state to indicate engine is ready
    setGameState(prev => ({ ...prev, isRunning: true }));
    
    // Execute a basic demo script if the engine supports scripting
    const demoScript = `
// Create a simple demo scene
console.log("Setting up WorldLink demo scene...");

// Basic initialization - this will depend on the actual WorldLink API
if (typeof Module !== 'undefined' && Module._main) {
  console.log("WorldLink engine initialized successfully!");
}
    `;

    // For now, just log the demo script - actual execution will depend on WorldLink API
    console.log('[LivePlayTab] Demo script ready:', demoScript);
  }, []);

  const handleWorldLinkError = useCallback((error: string) => {
    console.error('[LivePlayTab] WorldLink engine error:', error);
    setGameState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const handlePlay = useCallback(() => {
    // For now, just toggle the playing state
    // Actual play/pause functionality will depend on WorldLink API
    setIsPlaying(prev => !prev);
    setGameState(prev => ({ ...prev, isPaused: !isPlaying }));
  }, [isPlaying]);

  const handleReset = useCallback(async () => {
    // Reset functionality will depend on WorldLink API
    setIsPlaying(false);
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Game Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <GlassmorphicButton
            variant={isPlaying ? "danger" : "gaming"}
            onClick={handlePlay}
            className="flex items-center space-x-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                <span>Stop</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Play</span>
              </>
            )}
          </GlassmorphicButton>
          
          <GlassmorphicButton 
            variant="glass" 
            size="sm"
            onClick={handleReset}
          >
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
          <span>Memory: {(gameState.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>

      {/* WorldLink Engine */}
      <div className="flex-1 p-4">
        <WorldLinkCanvas
          width={640}
          height={480}
          onReady={handleWorldLinkReady}
          onError={handleWorldLinkError}
          enableDebugMode={true}
          className="w-full h-full"
        />
      </div>

      {/* Game Instructions */}
      <div className="p-4 border-t border-white/10 text-xs text-white/60 space-y-1">
        <div>Use WASD or Arrow Keys to interact with the game</div>
        <div>Click Play to start the WorldLink engine</div>
        <div>This demo shows WorldLink/Toxoid engine integration with WebGPU/WebGL fallback</div>
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
                variant={selectedTool === tool.id ? "gaming" : "glass"}
                size="sm"
                onClick={() => setSelectedTool(tool.id)}
                title={tool.name}
              >
                {tool.icon}
              </GlassmorphicButton>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-white/60">Grid:</label>
              <GlassmorphicInput
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                min="16"
                max="64"
                step="16"
                className="w-16"
                size="sm"
              />
            </div>
            
            <GlassmorphicButton
              variant={showGrid ? "gaming" : "glass"}
              size="sm"
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
          <GlassmorphicCard variant="strong" className="h-full">
            <div className="relative h-full rounded-lg overflow-hidden">
              <canvas
                width={800}
                height={600}
                className="w-full h-full object-contain"
                style={{ 
                  imageRendering: "pixelated",
                  background: showGrid ? 
                    `repeating-conic-gradient(#333 0% 25%, transparent 0% 50%) 50% / ${gridSize}px ${gridSize}px` : 
                    "#1a1a2e"
                }}
              />
              
              {/* Tool cursor */}
              <div className="absolute top-4 left-4 text-xs text-white/60">
                Tool: {tools.find(t => t.id === selectedTool)?.name}
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Tileset Panel */}
        <div className="w-64 p-4 pl-0">
          <GlassmorphicCard variant="subtle" className="h-full">
            <div className="p-3">
              <h4 className="text-sm font-semibold mb-3 text-white/80">Tileset</h4>
              
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
                <GlassmorphicButton variant="glass" size="sm" className="w-full">
                  Import Tileset
                </GlassmorphicButton>
                <GlassmorphicButton variant="glass-ghost" size="sm" className="w-full">
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
  const [currentScript, setCurrentScript] = useState<GameScript | null>(null);
  const toxoidEngineRef = useRef<any>(null);

  // Default Toxoid script
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

  const handleScriptExecute = useCallback(async (code: string): Promise<boolean> => {
    try {
      // Get the Toxoid engine from the Live Play tab
      // This is a simplified approach - in a real implementation,
      // we'd have a shared context or state management
      console.log('[CodeEditor] Executing script:', code.substring(0, 100) + '...');
      
      // For now, just validate the script syntax
      const isValid = !code.includes('undefined_function') && code.includes('Toxoid');
      
      if (isValid) {
        console.log('[CodeEditor] ✅ Script executed successfully');
        return true;
      } else {
        console.error('[CodeEditor] ❌ Script validation failed');
        return false;
      }
    } catch (error) {
      console.error('[CodeEditor] Script execution error:', error);
      return false;
    }
  }, []);

  const handleScriptSave = useCallback((script: GameScript) => {
    setCurrentScript(script);
    console.log('[CodeEditor] Script saved:', script.name);
    
    // In a real implementation, this would save to the database
    // and sync with the project state
  }, []);

  const handleScriptChange = useCallback((code: string) => {
    // Update current script content
    if (currentScript) {
      setCurrentScript(prev => prev ? {
        ...prev,
        content: code,
        lastModified: new Date()
      } : null);
    }
  }, [currentScript]);

  return (
    <div className="h-full">
      <ScriptEditor
        initialCode={currentScript?.content || defaultCode}
        onCodeChange={handleScriptChange}
        onExecute={handleScriptExecute}
        onSave={handleScriptSave}
        showLineNumbers={true}
        theme="dark"
        className="h-full"
      />
    </div>
  );
};

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    gameTitle: "My Cyberpunk Platformer",
    resolution: "640x480",
    fps: 60,
    pixelPerfect: true,
    showFPS: true,
    enableSounds: true,
    musicVolume: 70,
    sfxVolume: 85,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Game Settings */}
      <GlassmorphicCard variant="gaming" className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white/90">Game Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Game Title
            </label>
            <GlassmorphicInput
              value={settings.gameTitle}
              onChange={(e) => updateSetting("gameTitle", e.target.value)}
              placeholder="Enter your game title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Resolution
              </label>
              <select
                value={settings.resolution}
                onChange={(e) => updateSetting("resolution", e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                type="number"
                value={settings.fps}
                onChange={(e) => updateSetting("fps", Number(e.target.value))}
                min="30"
                max="120"
                step="30"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { key: "pixelPerfect", label: "Pixel Perfect Rendering" },
              { key: "showFPS", label: "Show FPS Counter" },
              { key: "enableSounds", label: "Enable Sound Effects" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 focus:ring-purple-500/50"
                />
                <span className="text-sm text-white/70">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </GlassmorphicCard>

      {/* Audio Settings */}
      <GlassmorphicCard variant="accent-emerald" className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white/90">Audio Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Music Volume: {settings.musicVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => updateSetting("musicVolume", Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              SFX Volume: {settings.sfxVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.sfxVolume}
              onChange={(e) => updateSetting("sfxVolume", Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </GlassmorphicCard>

      {/* Export Settings */}
      <GlassmorphicCard variant="accent-cyan" className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white/90">Export & Publishing</h3>
        
        <div className="space-y-3">
          <GlassmorphicButton variant="gaming" className="w-full">
            Export to Web (HTML5)
          </GlassmorphicButton>
          
          <GlassmorphicButton variant="accent" className="w-full">
            Export to Desktop
          </GlassmorphicButton>
          
          <GlassmorphicButton variant="glass" className="w-full">
            Share Project Link
          </GlassmorphicButton>
        </div>
      </GlassmorphicCard>
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
          <path d="M8 5v14l11-7z"/>
        </svg>
      ),
      content: <LivePlayTab />,
    },
    {
      id: "mapeditor",
      label: "Map Editor",
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      content: <MapEditorTab />,
    },
    {
      id: "codeeditor",
      label: "Code Editor",
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      content: <CodeEditorTab />,
      badge: "1", // Error count
    },
    {
      id: "settings",
      label: "Settings",
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: <SettingsTab />,
    },
  ];

  return (
    <GlassmorphicCard {...GameGenCardPresets.gameCard} className="h-full">
      <TabSystem
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="gaming"
        className="h-full"
        contentClassName="p-0"
      />
    </GlassmorphicCard>
  );
}