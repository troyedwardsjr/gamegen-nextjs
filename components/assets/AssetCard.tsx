"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import { Asset, AssetCardProps } from "@/types/assets";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

// Asset type icons mapping
const ASSET_ICONS: Record<string, string> = {
  sprite: "🎨",
  tileset: "🧱", 
  sound: "🔊",
  music: "🎵",
  animation: "🎬",
  font: "🔤",
  shader: "✨",
  texture: "🖼️",
  model: "🗿",
  scene: "🌆",
  script: "📜",
  data: "📊",
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format dimensions for display
const formatDimensions = (asset: Asset): string => {
  if (!asset.dimensions) return '';
  const { width, height, frames, duration } = asset.dimensions;
  
  if (frames) return `${width}×${height} (${frames}f)`;
  if (duration) return `${Math.round(duration)}s`;
  return `${width}×${height}`;
};

// Get quality color for badges
const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'ultra': return 'text-purple-300 bg-purple-500/20';
    case 'high': return 'text-blue-300 bg-blue-500/20';
    case 'medium': return 'text-green-300 bg-green-500/20';
    case 'low': return 'text-orange-300 bg-orange-500/20';
    default: return 'text-gray-300 bg-gray-500/20';
  }
};

export function AssetCard({
  asset,
  isSelected = false,
  isHighlighted = false,
  showMetadata = true,
  showUsage = true,
  size = 'medium',
  onClick,
  onDoubleClick,
  onSelect,
  onDragStart,
  onPreview,
  onEdit,
  onDelete,
  showActions = true,
  customActions = [],
}: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          container: 'w-32 h-32',
          image: 'h-20',
          text: 'text-xs',
          titleText: 'text-xs',
        };
      case 'large':
        return {
          container: 'w-64 h-64',
          image: 'h-40',
          text: 'text-sm',
          titleText: 'text-sm',
        };
      default:
        return {
          container: 'w-48 h-48',
          image: 'h-28',
          text: 'text-xs',
          titleText: 'text-sm',
        };
    }
  }, [size]);

  // Handle click events
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(asset);
  }, [asset, onClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(asset);
  }, [asset, onDoubleClick]);

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(asset, !isSelected);
  }, [asset, isSelected, onSelect]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(asset);
  }, [asset, onDragStart]);

  // Action handlers
  const handlePreview = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(asset);
  }, [asset, onPreview]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(asset);
  }, [asset, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(asset);
  }, [asset, onDelete]);

  // Image load handlers
  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
  }, []);

  // Render thumbnail or fallback
  const renderThumbnail = () => {
    if (imageError || !asset.thumbnailUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
          <span className="text-3xl">{ASSET_ICONS[asset.type] || "📁"}</span>
        </div>
      );
    }

    return (
      <>
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent" />
          </div>
        )}
        <img
          src={asset.thumbnailUrl}
          alt={asset.name}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-200",
            isImageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </>
    );
  };

  // AI quality indicator
  const renderQualityIndicator = () => {
    if (!asset.ai.qualityScore) return null;
    
    const score = asset.ai.qualityScore;
    const getColor = () => {
      if (score >= 90) return "bg-purple-500";
      if (score >= 75) return "bg-blue-500";
      if (score >= 60) return "bg-green-500";
      if (score >= 40) return "bg-yellow-500";
      return "bg-orange-500";
    };

    return (
      <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ backgroundColor: getColor() }} />
    );
  };

  return (
    <div
      className={clsx(
        "group cursor-pointer relative select-none",
        sizeConfig.container,
        isHighlighted && "ring-2 ring-cyan-400/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable={true}
      onDragStart={handleDragStart}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
        className="w-full h-full"
      >
      <GlassmorphicCard
        className={clsx(
          "relative overflow-hidden h-full transition-all duration-200",
          isSelected && "ring-2 ring-purple-400/60 bg-purple-500/10",
          isHovered && !isSelected && "ring-1 ring-white/20"
        )}
        hover={true}
        variant="subtle"
      >
        {/* Selection checkbox */}
        {onSelect && (
          <button
            className={clsx(
              "absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200",
              "border-white/30 bg-black/20 backdrop-blur-sm",
              isSelected ? "bg-purple-500 border-purple-400" : "hover:border-white/50",
              (isHovered || isSelected) ? "opacity-100" : "opacity-0"
            )}
            onClick={handleSelect}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        {/* Quality indicator */}
        {renderQualityIndicator()}

        {/* Status badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          {asset.status === 'in_use' && (
            <GlassmorphicBadge size="sm" variant="success">
              In Use
            </GlassmorphicBadge>
          )}
          {asset.ai.generated && (
            <GlassmorphicBadge size="sm" variant="gaming">
              AI
            </GlassmorphicBadge>
          )}
          {asset.source === 'community' && (
            <GlassmorphicBadge size="sm" variant="default">
              Community
            </GlassmorphicBadge>
          )}
        </div>

        {/* Thumbnail */}
        <div className={clsx("relative overflow-hidden rounded-t-lg", sizeConfig.image)}>
          {renderThumbnail()}
        </div>

        {/* Asset Info */}
        <div className="p-3 flex-1 flex flex-col">
          <div className={clsx("font-medium text-white/90 truncate mb-1", sizeConfig.titleText)}>
            {asset.name}
          </div>
          
          {showMetadata && (
            <div className="flex-1 space-y-1">
              <div className={clsx("text-white/60 flex items-center justify-between", sizeConfig.text)}>
                <span>{formatFileSize(asset.size)}</span>
                {asset.dimensions && (
                  <span>{formatDimensions(asset)}</span>
                )}
              </div>

              {asset.quality && (
                <div className={clsx("inline-block px-1.5 py-0.5 rounded text-xs", getQualityColor(asset.quality))}>
                  {asset.quality}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, size === 'small' ? 1 : 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > (size === 'small' ? 1 : 3) && (
                <span className="text-xs text-white/40">
                  +{asset.tags.length - (size === 'small' ? 1 : 3)}
                </span>
              )}
            </div>
          )}

          {/* Usage info */}
          {showUsage && asset.usage.usageCount > 0 && (
            <div className={clsx("text-white/50 mt-1", sizeConfig.text)}>
              Used {asset.usage.usageCount} times
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <AnimatePresence>
          {isHovered && showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <div className="flex space-x-2">
                {onPreview && (
                  <GlassmorphicButton size="sm" variant="gaming" onClick={handlePreview}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </GlassmorphicButton>
                )}
                
                <GlassmorphicButton size="sm" variant="glass">
                  Use
                </GlassmorphicButton>

                {onEdit && (
                  <GlassmorphicButton size="sm" variant="glass" onClick={handleEdit}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </GlassmorphicButton>
                )}

                {/* Custom actions */}
                {customActions.map((action, index) => (
                  <GlassmorphicButton
                    key={index}
                    size="sm"
                    variant="glass"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(asset);
                    }}
                  >
                    {action.icon || action.label}
                  </GlassmorphicButton>
                ))}

                {onDelete && (
                  <GlassmorphicButton size="sm" variant="danger" onClick={handleDelete}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </GlassmorphicButton>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassmorphicCard>
      </motion.div>
    </div>
  );
}