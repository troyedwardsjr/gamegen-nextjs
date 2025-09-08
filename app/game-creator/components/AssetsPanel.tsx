"use client";

import React, { useState, useRef } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import { TabSystem, Tab } from "./TabSystem";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { AssetSearch } from "@/components/assets/AssetSearch";
import { AssetUpload } from "@/components/assets/AssetUpload";
import { AssetCollections } from "@/components/assets/AssetCollections";
import { useAssets } from "@/hooks/useAssets";

interface Asset {
  id: string;
  name: string;
  type: "sprite" | "tileset" | "sound" | "music" | "animation" | "font";
  size: string;
  lastModified: Date;
  thumbnail?: string;
  tags: string[];
  inUse: boolean;
  url?: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    fileSize?: number;
    format?: string;
    quality?: number;
  };
}

// Enhanced mock assets data with AI recommendations
const mockAssets: Asset[] = [
  {
    id: "1",
    name: "player_idle.png",
    type: "sprite",
    size: "32x32",
    lastModified: new Date(Date.now() - 3600000),
    tags: ["character", "player", "idle", "cyberpunk"],
    inUse: true,
    metadata: {
      dimensions: { width: 32, height: 32 },
      fileSize: 2048,
      format: "PNG",
      quality: 95
    }
  },
  {
    id: "2",
    name: "cyberpunk_tileset.png",
    type: "tileset",
    size: "512x512",
    lastModified: new Date(Date.now() - 7200000),
    tags: ["tileset", "cyberpunk", "environment", "neon"],
    inUse: true,
    metadata: {
      dimensions: { width: 512, height: 512 },
      fileSize: 65536,
      format: "PNG",
      quality: 98
    }
  },
  {
    id: "3",
    name: "jump_sound.wav",
    type: "sound",
    size: "48KB",
    lastModified: new Date(Date.now() - 1800000),
    tags: ["sfx", "jump", "action", "8bit"],
    inUse: false,
    metadata: {
      fileSize: 49152,
      format: "WAV",
      quality: 85
    }
  },
  {
    id: "4",
    name: "background_music.mp3",
    type: "music",
    size: "2.3MB",
    lastModified: new Date(Date.now() - 14400000),
    tags: ["music", "background", "cyberpunk", "ambient"],
    inUse: true,
    metadata: {
      fileSize: 2411724,
      format: "MP3",
      quality: 92
    }
  },
  {
    id: "5",
    name: "player_walk.anim",
    type: "animation",
    size: "16 frames",
    lastModified: new Date(Date.now() - 5400000),
    tags: ["animation", "player", "walk", "character"],
    inUse: false,
    metadata: {
      fileSize: 8192,
      format: "ANIM",
      quality: 88
    }
  },
];

const SpritesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sprites = mockAssets.filter(
    (asset) =>
      ["sprite", "tileset"].includes(asset.type) &&
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedTags.length === 0 ||
        selectedTags.some((tag) => asset.tags.includes(tag))),
  );

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "sprite":
        return "🎨";
      case "tileset":
        return "🧱";
      default:
        return "📁";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white/90">Sprites & Tilesets</h4>
          <GlassmorphicButton size="sm" variant="gaming" onClick={handleUpload}>
            Upload
          </GlassmorphicButton>
        </div>

        <div className="space-y-2">
          <GlassmorphicInput
            placeholder="Search assets..."
            size="sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex items-center space-x-2">
            <GlassmorphicButton size="sm" variant="glass">
              Sort: {sortBy}
            </GlassmorphicButton>

            <GlassmorphicBadge size="sm" variant="gaming">
              {sprites.length} items
            </GlassmorphicBadge>
          </div>
        </div>

        <input
          ref={fileInputRef}
          multiple
          accept="image/*"
          className="hidden"
          type="file"
          onChange={(e) => {
            // Handle file upload
            console.log("Files selected:", e.target.files);
          }}
        />
      </div>

      {/* Asset Grid */}
      <AssetGrid assets={sprites} />
    </div>
  );
};

const AudioTab = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const sounds = mockAssets.filter((asset) =>
    ["sound", "music"].includes(asset.type),
  );

  const handlePlay = (assetId: string) => {
    if (isPlaying === assetId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(assetId);
      // Stop after 3 seconds (demo)
      setTimeout(() => setIsPlaying(null), 3000);
    }
  };

  const getAudioIcon = (type: string) => {
    return type === "music" ? "🎵" : "🔊";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white/90">Audio Assets</h4>
          <GlassmorphicButton size="sm" variant="gaming">
            Upload
          </GlassmorphicButton>
        </div>

        {/* AI Recommendations */}
        <div className="mt-3 p-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
          <div className="text-xs font-medium text-purple-200 mb-1">🤖 AI Recommendations</div>
          <div className="text-xs text-white/70">Perfect match for cyberpunk theme in your current project</div>
          <div className="flex items-center mt-1">
            <div className="text-xs text-emerald-400">95% confidence</div>
            <div className="ml-2 h-1 flex-1 bg-white/20 rounded">
              <div className="h-full w-[95%] bg-gradient-to-r from-emerald-400 to-cyan-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sounds.map((asset) => (
          <GlassmorphicCard key={asset.id} className="p-3" variant="subtle">
            <div className="flex items-center space-x-3">
              <div className="text-xl">{getAudioIcon(asset.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-white/90 truncate">
                  {asset.name}
                </div>
                <div className="text-xs text-white/60">
                  {asset.size} • {asset.type}
                </div>
                <div className="flex space-x-1 mt-1">
                  {asset.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {asset.inUse && (
                  <GlassmorphicBadge size="sm" variant="success">
                    In Use
                  </GlassmorphicBadge>
                )}

                <GlassmorphicButton
                  size="sm"
                  variant={isPlaying === asset.id ? "danger" : "gaming"}
                  onClick={() => handlePlay(asset.id)}
                >
                  {isPlaying === asset.id ? (
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </GlassmorphicButton>
              </div>
            </div>

            {isPlaying === asset.id && (
              <motion.div
                animate={{ height: "auto" }}
                className="mt-3 overflow-hidden"
                exit={{ height: 0 }}
                initial={{ height: 0 }}
              >
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: "100%" }}
                    className="h-full bg-gradient-to-r from-purple-400 to-cyan-400"
                    initial={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}
          </GlassmorphicCard>
        ))}
      </div>
    </div>
  );
};

const AnimationsTab = () => {
  const animations = mockAssets.filter((asset) => asset.type === "animation");
  const [previewingAnimation, setPreviewingAnimation] = useState<string | null>(
    null,
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white/90">Animations</h4>
          <GlassmorphicButton size="sm" variant="gaming">
            Create
          </GlassmorphicButton>
        </div>
      </div>

      {/* Animations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {animations.map((asset) => (
          <GlassmorphicCard key={asset.id} className="p-3" variant="subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎬</span>
                </div>

                <div>
                  <div className="font-medium text-sm text-white/90">
                    {asset.name}
                  </div>
                  <div className="text-xs text-white/60">{asset.size}</div>
                  <div className="flex space-x-1 mt-1">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {asset.inUse && (
                  <GlassmorphicBadge size="sm" variant="success">
                    In Use
                  </GlassmorphicBadge>
                )}

                <GlassmorphicButton
                  size="sm"
                  variant="gaming"
                  onClick={() =>
                    setPreviewingAnimation(
                      previewingAnimation === asset.id ? null : asset.id,
                    )
                  }
                >
                  {previewingAnimation === asset.id ? "Stop" : "Preview"}
                </GlassmorphicButton>
              </div>
            </div>
          </GlassmorphicCard>
        ))}
      </div>
    </div>
  );
};

const CollectionsTab = () => {
  return <AssetCollections />;
};

const SearchTab = () => {
  return <AssetSearch assets={mockAssets} />;
};

export function AssetsPanel() {
  const [activeTab, setActiveTab] = useState("sprites");
  const { assets, loading, error } = useAssets();

  const tabs: Tab[] = [
    {
      id: "sprites",
      label: "Sprites",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🎨</span>
      ),
      content: <SpritesTab />,
      badge: mockAssets.filter((a) => ["sprite", "tileset"].includes(a.type)).length,
    },
    {
      id: "audio",
      label: "Audio",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🔊</span>
      ),
      content: <AudioTab />,
      badge: mockAssets.filter((a) => ["sound", "music"].includes(a.type))
        .length,
    },
    {
      id: "animations",
      label: "Anims",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🎬</span>
      ),
      content: <AnimationsTab />,
    },
    {
      id: "collections",
      label: "Collections",
      icon: ({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
      content: <CollectionsTab />,
    },
    {
      id: "search",
      label: "Search",
      icon: ({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      ),
      content: <SearchTab />,
    },
  ];

  if (error) {
    return (
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className="h-full p-4">
        <div className="text-center text-red-400">
          <div className="text-lg mb-2">⚠️</div>
          <div className="text-sm">Error loading assets</div>
          <div className="text-xs text-white/60 mt-1">{error}</div>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className="h-full">
      <TabSystem
        activeTab={activeTab}
        className="h-full"
        contentClassName="p-0"
        size="sm"
        tabs={tabs}
        variant="gaming"
        onTabChange={setActiveTab}
      />
    </GlassmorphicCard>
  );
}
