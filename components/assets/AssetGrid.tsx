"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { AssetPreview } from "./AssetPreview";
import type { Asset } from "@/types/assets";

interface AssetGridProps {
  assets: Asset[];
  loading?: boolean;
  onAssetSelect?: (asset: Asset) => void;
  onAssetAction?: (asset: Asset, action: string) => void;
  selectedAssets?: string[];
  selectionMode?: boolean;
  gridSize?: "small" | "medium" | "large";
  showMetadata?: boolean;
  className?: string;
}

const GRID_CONFIGS = {
  small: {
    columns: "grid-cols-4",
    cardSize: "aspect-square",
    textSize: "text-xs",
  },
  medium: {
    columns: "grid-cols-3",
    cardSize: "aspect-[4/3]",
    textSize: "text-sm",
  },
  large: {
    columns: "grid-cols-2",
    cardSize: "aspect-[3/2]",
    textSize: "text-sm",
  },
};

export function AssetGrid({
  assets,
  loading = false,
  onAssetSelect,
  onAssetAction,
  selectedAssets = [],
  selectionMode = false,
  gridSize = "medium",
  showMetadata = true,
  className,
}: AssetGridProps) {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const config = GRID_CONFIGS[gridSize];

  const handleAssetClick = useCallback((asset: Asset) => {
    if (selectionMode) {
      onAssetSelect?.(asset);
    } else {
      setPreviewAsset(asset);
    }
  }, [selectionMode, onAssetSelect]);

  const handleAssetDoubleClick = useCallback((asset: Asset) => {
    onAssetAction?.(asset, "use");
  }, [onAssetAction]);

  const handleDragStart = useCallback((e: React.DragEvent, asset: Asset) => {
    setDraggedAsset(asset);
    e.dataTransfer.setData("application/json", JSON.stringify(asset));
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedAsset(null);
  }, []);

  const getAssetIcon = (type: string) => {
    const icons = {
      sprite: "🎨",
      tileset: "🧱",
      sound: "🔊",
      music: "🎵",
      animation: "🎬",
      font: "🔤",
    };
    return icons[type as keyof typeof icons] || "📁";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className={clsx("flex-1 p-3", className)}>
        <div className={clsx("grid gap-2", config.columns)}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={clsx(
                "bg-white/5 rounded-lg animate-pulse",
                config.cardSize
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className={clsx("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center text-white/60">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-sm font-medium mb-1">No assets found</div>
          <div className="text-xs">Try adjusting your search or filters</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={gridRef}
        className={clsx("flex-1 overflow-y-auto p-3", className)}
      >
        <div className={clsx("grid gap-2", config.columns)}>
          <AnimatePresence mode="popLayout">
            {assets.map((asset) => {
              const isSelected = selectedAssets.includes(asset.id);
              const isDragged = draggedAsset?.id === asset.id;
              
              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: isDragged ? 0.5 : 1, 
                    scale: isDragged ? 0.95 : 1 
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAssetClick(asset)}
                  onDoubleClick={() => handleAssetDoubleClick(asset)}
                >
                  <GlassmorphicCard
                    className={clsx(
                      "relative overflow-hidden transition-all duration-200",
                      isSelected && "ring-2 ring-purple-400/50 bg-purple-500/10",
                      "hover:border-purple-400/30"
                    )}
                    variant="subtle"
                  >
                    {/* Selection indicator */}
                    {selectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <div 
                          className={clsx(
                            "w-4 h-4 rounded border-2 flex items-center justify-center text-xs",
                            isSelected 
                              ? "bg-purple-500 border-purple-500 text-white"
                              : "border-white/30 bg-white/10"
                          )}
                        >
                          {isSelected && "✓"}
                        </div>
                      </div>
                    )}

                    {/* Asset Preview */}
                    <div 
                      className={clsx(
                        "bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-t-lg relative",
                        config.cardSize
                      )}
                    >
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-full h-full object-cover rounded-t-lg"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                          {getAssetIcon(asset.type)}
                        </div>
                      )}

                      {/* Status badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {asset.inUse && (
                          <GlassmorphicBadge
                            size="sm"
                            variant="success"
                            className="text-xs"
                          >
                            In Use
                          </GlassmorphicBadge>
                        )}
                        
                        {asset.metadata?.quality && asset.metadata.quality > 90 && (
                          <GlassmorphicBadge
                            size="sm"
                            variant="gaming"
                            className="text-xs"
                          >
                            HQ
                          </GlassmorphicBadge>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          <GlassmorphicButton 
                            size="sm" 
                            variant="gaming"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssetAction?.(asset, "use");
                            }}
                          >
                            Use
                          </GlassmorphicButton>
                          <GlassmorphicButton 
                            size="sm" 
                            variant="glass"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewAsset(asset);
                            }}
                          >
                            Preview
                          </GlassmorphicButton>
                        </div>
                      </div>
                    </div>

                    {/* Asset Info */}
                    {showMetadata && (
                      <div className="p-2">
                        <div className={clsx(
                          "font-medium text-white/90 truncate",
                          config.textSize
                        )}>
                          {asset.name}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {asset.size} • {formatFileSize(asset.metadata?.fileSize)}
                        </div>

                        {/* Tags */}
                        {asset.tags.length > 0 && (
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
                        )}

                        {/* Quality indicator */}
                        {asset.metadata?.quality && (
                          <div className="mt-1 flex items-center gap-1">
                            <div className="text-xs text-white/50">Quality:</div>
                            <div className="flex-1 h-1 bg-white/20 rounded-full">
                              <div 
                                className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"
                                style={{ width: `${asset.metadata.quality}%` }}
                              />
                            </div>
                            <div className="text-xs text-white/60">{asset.metadata.quality}%</div>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassmorphicCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <AssetPreview
          asset={previewAsset}
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          onAction={onAssetAction}
        />
      )}
    </>
  );
}
