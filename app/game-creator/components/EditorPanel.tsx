"use client";

import React, { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { TabSystem, Tab } from "./TabSystem";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicAlert } from "@/components/ui/GlassmorphicAlert";

// Individual Tab Components
const LivePlayTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        // Simple placeholder game simulation
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, 640, 480);
        
        // Draw grid
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 480);
          ctx.stroke();
        }
        for (let y = 0; y < 480; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(640, y);
          ctx.stroke();
        }
        
        // Draw player character (placeholder)
        ctx.fillStyle = "#ff6b6b";
        ctx.fillRect(304, 224, 32, 32);
        
        // Draw some platforms
        ctx.fillStyle = "#4ecdc4";
        ctx.fillRect(256, 320, 128, 32);
        ctx.fillRect(128, 256, 96, 32);
        ctx.fillRect(416, 192, 160, 32);
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Game Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <GlassmorphicButton
            variant={isPlaying ? "danger" : "gaming"}
            onClick={() => setIsPlaying(!isPlaying)}
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
          
          <GlassmorphicButton variant="glass" size="sm">
            Reset
          </GlassmorphicButton>
          
          <GlassmorphicBadge variant="gaming">
            Score: {score}
          </GlassmorphicBadge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-white/60">
          <span>FPS: 60</span>
          <span>•</span>
          <span>Objects: 12</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <GlassmorphicCard variant="strong" className="relative">
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="rounded-lg"
            style={{ imageRendering: "pixelated" }}
          />
          {isPlaying && (
            <motion.div
              className="absolute top-2 left-2 bg-red-500 w-3 h-3 rounded-full"
              animate={{ opacity: [1, 0.3] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            />
          )}
        </GlassmorphicCard>
      </div>

      {/* Debug Info */}
      <div className="p-4 border-t border-white/10 text-xs text-white/60 space-y-1">
        <div>Use WASD or Arrow Keys to move</div>
        <div>Space to jump, Shift to run</div>
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
  const [code, setCode] = useState(`// Game Logic
function update() {
  // Update game state
  player.update();
  
  // Handle collisions
  if (checkCollision(player, platforms)) {
    player.onGround = true;
  }
  
  // Update camera
  camera.follow(player);
}

function render() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  drawBackground();
  
  // Draw game objects
  platforms.forEach(platform => platform.draw());
  player.draw();
  
  // Draw UI
  drawUI();
}`);

  const [errors, setErrors] = useState([
    { line: 15, message: "Variable 'ctx' is not defined", type: "error" },
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <GlassmorphicButton variant="gaming" size="sm">
            Run Code
          </GlassmorphicButton>
          <GlassmorphicButton variant="glass" size="sm">
            Format
          </GlassmorphicButton>
          <GlassmorphicButton variant="glass" size="sm">
            Save
          </GlassmorphicButton>
        </div>
        
        <div className="flex items-center space-x-4">
          <GlassmorphicBadge variant={errors.length > 0 ? "danger" : "success"}>
            {errors.length > 0 ? `${errors.length} Error${errors.length > 1 ? "s" : ""}` : "No Errors"}
          </GlassmorphicBadge>
          
          <div className="text-sm text-white/60">
            JavaScript
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <GlassmorphicCard variant="strong" className="h-full">
            <div className="relative h-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none outline-none"
                style={{ 
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  lineHeight: "1.5",
                  tabSize: "2"
                }}
                spellCheck={false}
                placeholder="Write your game code here..."
              />
              
              {/* Line numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/20 flex flex-col p-4 text-xs text-white/40 font-mono">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Error Panel */}
        {errors.length > 0 && (
          <div className="w-80 p-4 pl-0">
            <GlassmorphicCard variant="subtle" className="h-full">
              <div className="p-3">
                <h4 className="text-sm font-semibold mb-3 text-red-400">Errors & Warnings</h4>
                
                <div className="space-y-2">
                  {errors.map((error, i) => (
                    <GlassmorphicAlert
                      key={i}
                      variant="danger"
                      title={`Line ${error.line}`}
                      description={error.message}
                    />
                  ))}
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        )}
      </div>
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