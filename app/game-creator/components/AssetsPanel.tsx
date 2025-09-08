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
import { GlassmorphicDropdown } from "@/components/ui/GlassmorphicDropdown";

interface Asset {
  id: string;
  name: string;
  type: "sprite" | "tileset" | "sound" | "music" | "animation" | "font";
  size: string;
  lastModified: Date;
  thumbnail?: string;
  tags: string[];
  inUse: boolean;
}

// Mock assets data
const mockAssets: Asset[] = [
  {
    id: "1",
    name: "player_idle.png",
    type: "sprite",
    size: "32x32",
    lastModified: new Date(Date.now() - 3600000),
    tags: ["character", "player", "idle"],
    inUse: true,
  },
  {
    id: "2",
    name: "cyberpunk_tileset.png",
    type: "tileset",
    size: "512x512",
    lastModified: new Date(Date.now() - 7200000),
    tags: ["tileset", "cyberpunk", "environment"],
    inUse: true,
  },
  {
    id: "3",
    name: "jump_sound.wav",
    type: "sound",
    size: "48KB",
    lastModified: new Date(Date.now() - 1800000),
    tags: ["sfx", "jump", "action"],
    inUse: false,
  },
  {
    id: "4",
    name: "background_music.mp3",
    type: "music",
    size: "2.3MB",
    lastModified: new Date(Date.now() - 14400000),
    tags: ["music", "background", "cyberpunk"],
    inUse: true,
  },
  {
    id: "5",
    name: "player_walk.anim",
    type: "animation",
    size: "16 frames",
    lastModified: new Date(Date.now() - 5400000),
    tags: ["animation", "player", "walk"],
    inUse: false,
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
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {sprites.map((asset) => (
              <motion.div
                key={asset.id}
                animate={{ opacity: 1, scale: 1 }}
                className="group cursor-pointer"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
              >
                <GlassmorphicCard
                  className="relative overflow-hidden"
                  hover={true}
                  variant="subtle"
                >
                  {/* Asset Preview */}
                  <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-t-lg relative">
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      {getAssetIcon(asset.type)}
                    </div>

                    {asset.inUse && (
                      <GlassmorphicBadge
                        className="absolute top-2 right-2"
                        size="sm"
                        variant="success"
                      >
                        In Use
                      </GlassmorphicBadge>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <GlassmorphicButton size="sm" variant="gaming">
                          Use
                        </GlassmorphicButton>
                        <GlassmorphicButton size="sm" variant="glass">
                          Edit
                        </GlassmorphicButton>
                      </div>
                    </div>
                  </div>

                  {/* Asset Info */}
                  <div className="p-2">
                    <div className="font-medium text-xs text-white/90 truncate">
                      {asset.name}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {asset.size}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 2 && (
                        <span className="text-xs text-white/40">
                          +{asset.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassmorphicCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SoundsTab = () => {
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

const LibraryTab = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Assets", count: mockAssets.length },
    {
      id: "sprites",
      label: "Sprites",
      count: mockAssets.filter((a) => a.type === "sprite").length,
    },
    {
      id: "tilesets",
      label: "Tilesets",
      count: mockAssets.filter((a) => a.type === "tileset").length,
    },
    {
      id: "audio",
      label: "Audio",
      count: mockAssets.filter((a) => ["sound", "music"].includes(a.type))
        .length,
    },
    {
      id: "animations",
      label: "Animations",
      count: mockAssets.filter((a) => a.type === "animation").length,
    },
  ];

  const filteredAssets =
    selectedCategory === "all"
      ? mockAssets
      : mockAssets.filter((asset) => {
          switch (selectedCategory) {
            case "sprites":
              return asset.type === "sprite";
            case "tilesets":
              return asset.type === "tileset";
            case "audio":
              return ["sound", "music"].includes(asset.type);
            case "animations":
              return asset.type === "animation";
            default:
              return true;
          }
        });

  return (
    <div className="h-full flex flex-col">
      {/* Categories */}
      <div className="p-3 border-b border-white/10">
        <div className="grid grid-cols-2 gap-1">
          {categories.map((category) => (
            <GlassmorphicButton
              key={category.id}
              className="flex items-center justify-between"
              size="sm"
              variant={selectedCategory === category.id ? "gaming" : "glass"}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span>{category.label}</span>
              <GlassmorphicBadge size="sm" variant="default">
                {category.count}
              </GlassmorphicBadge>
            </GlassmorphicButton>
          ))}
        </div>
      </div>

      {/* Asset Usage Stats */}
      <div className="p-3 border-b border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-white/60">Total</div>
            <div className="text-sm font-semibold text-white/90">
              {mockAssets.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/60">In Use</div>
            <div className="text-sm font-semibold text-emerald-400">
              {mockAssets.filter((a) => a.inUse).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/60">Unused</div>
            <div className="text-sm font-semibold text-orange-400">
              {mockAssets.filter((a) => !a.inUse).length}
            </div>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className={clsx(
              "flex items-center space-x-3 p-2 rounded-lg",
              "hover:bg-white/5 transition-colors cursor-pointer",
              "border border-transparent hover:border-white/10",
            )}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded flex items-center justify-center text-sm">
              {asset.type === "sprite" && "🎨"}
              {asset.type === "tileset" && "🧱"}
              {asset.type === "sound" && "🔊"}
              {asset.type === "music" && "🎵"}
              {asset.type === "animation" && "🎬"}
              {asset.type === "font" && "🔤"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white/90 truncate">
                {asset.name}
              </div>
              <div className="text-xs text-white/50">{asset.size}</div>
            </div>

            {asset.inUse && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export function AssetsPanel() {
  const [activeTab, setActiveTab] = useState("sprites");

  const tabs: Tab[] = [
    {
      id: "sprites",
      label: "Sprites",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🎨</span>
      ),
      content: <SpritesTab />,
    },
    {
      id: "sounds",
      label: "Audio",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🔊</span>
      ),
      content: <SoundsTab />,
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
      id: "library",
      label: "Library",
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
      content: <LibraryTab />,
    },
  ];

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
