"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import { Asset, AssetPreviewProps } from "@/types/assets";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

// Asset type specific preview components
const ImagePreview = ({ 
  asset, 
  zoom, 
  onZoomChange 
}: { 
  asset: Asset; 
  zoom: number; 
  onZoomChange: (zoom: number) => void; 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      e.preventDefault();
    }
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setDragOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    onZoomChange(1);
    setDragOffset({ x: 0, y: 0 });
  }, [onZoomChange]);

  if (imageError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg">
        <div className="text-center space-y-2">
          <div className="text-4xl">🖼️</div>
          <p className="text-white/60">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-black/20 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
        </div>
      )}
      
      <div
        ref={containerRef}
        className={clsx(
          "w-full h-full flex items-center justify-center overflow-hidden",
          zoom > 1 && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={asset.previewUrl || asset.url}
          alt={asset.name}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            transformOrigin: 'center',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <GlassmorphicButton size="sm" onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}>
          -
        </GlassmorphicButton>
        <span className="text-sm text-white/80 min-w-[4rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <GlassmorphicButton size="sm" onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}>
          +
        </GlassmorphicButton>
        {zoom !== 1 && (
          <GlassmorphicButton size="sm" variant="glass" onClick={resetView}>
            Reset
          </GlassmorphicButton>
        )}
      </div>
    </div>
  );
};

const AudioPreview = ({ asset }: { asset: Asset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="flex-1 bg-black/20 rounded-lg p-8">
      <div className="flex flex-col items-center space-y-6">
        {/* Waveform visualization placeholder */}
        <div className="w-full h-32 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Animated waveform bars */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-purple-400 to-cyan-400 rounded-full"
                style={{ height: Math.random() * 60 + 10 }}
                animate={isPlaying ? {
                  height: [Math.random() * 60 + 10, Math.random() * 60 + 10],
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
          
          {/* Large play/pause icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-20">
              {asset.type === 'music' ? '🎵' : '🔊'}
            </div>
          </div>
        </div>

        {/* Audio controls */}
        <div className="w-full max-w-md space-y-4">
          {/* Play/pause and time */}
          <div className="flex items-center space-x-4">
            <GlassmorphicButton onClick={handlePlay} variant="gaming">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </GlassmorphicButton>
            
            <div className="flex-1 space-y-2">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={asset.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

const AnimationPreview = ({ asset }: { asset: Asset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const frameCount = asset.dimensions?.frames || 8;

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, 100); // 10 FPS

    return () => clearInterval(interval);
  }, [isPlaying, frameCount]);

  return (
    <div className="flex-1 bg-black/20 rounded-lg p-8">
      <div className="flex flex-col items-center space-y-6">
        {/* Animation display */}
        <div className="w-64 h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center relative">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            className="text-8xl"
          >
            🎬
          </motion.div>
          
          {/* Frame indicator */}
          <div className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded text-xs text-white/80">
            Frame {currentFrame + 1}/{frameCount}
          </div>
        </div>

        {/* Animation controls */}
        <div className="flex items-center space-x-4">
          <GlassmorphicButton onClick={handlePlayPause} variant="gaming">
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </GlassmorphicButton>

          <input
            type="range"
            min="0"
            max={frameCount - 1}
            value={currentFrame}
            onChange={(e) => {
              setCurrentFrame(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
};

const GenericPreview = ({ asset }: { asset: Asset }) => {
  const getIcon = () => {
    switch (asset.type) {
      case 'font': return '🔤';
      case 'shader': return '✨';
      case 'model': return '🗿';
      case 'scene': return '🌆';
      case 'script': return '📜';
      case 'data': return '📊';
      default: return '📁';
    }
  };

  return (
    <div className="flex-1 bg-black/20 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-8xl opacity-60">{getIcon()}</div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white/90">{asset.name}</h3>
          <p className="text-white/60 capitalize">{asset.type} asset</p>
        </div>
      </div>
    </div>
  );
};

export function AssetPreview({
  asset,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  onAddToCollection,
  showMetadata = true,
  showUsage = true,
  showAIInfo = true,
  enableZoom = true,
  enablePlayback = true,
}: AssetPreviewProps) {
  const [zoom, setZoom] = useState(1);

  // Reset zoom when asset changes
  useEffect(() => {
    setZoom(1);
  }, [asset?.id]);

  const renderPreview = useCallback(() => {
    if (!asset) return null;

    switch (asset.type) {
      case 'sprite':
      case 'tileset':
      case 'texture':
        return enableZoom ? (
          <ImagePreview asset={asset} zoom={zoom} onZoomChange={setZoom} />
        ) : (
          <div className="flex-1 bg-black/20 rounded-lg flex items-center justify-center">
            <img
              src={asset.previewUrl || asset.url}
              alt={asset.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );
      
      case 'sound':
      case 'music':
        return enablePlayback ? (
          <AudioPreview asset={asset} />
        ) : (
          <GenericPreview asset={asset} />
        );
      
      case 'animation':
        return enablePlayback ? (
          <AnimationPreview asset={asset} />
        ) : (
          <GenericPreview asset={asset} />
        );
      
      default:
        return <GenericPreview asset={asset} />;
    }
  }, [asset, zoom, enableZoom, enablePlayback]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen || !asset) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-6xl h-full max-h-[90vh] bg-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassmorphicCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">
                    {asset.type === 'sprite' && '🎨'}
                    {asset.type === 'tileset' && '🧱'}
                    {asset.type === 'sound' && '🔊'}
                    {asset.type === 'music' && '🎵'}
                    {asset.type === 'animation' && '🎬'}
                    {asset.type === 'font' && '🔤'}
                    {asset.type === 'shader' && '✨'}
                    {asset.type === 'texture' && '🖼️'}
                    {asset.type === 'model' && '🗿'}
                    {asset.type === 'scene' && '🌆'}
                    {asset.type === 'script' && '📜'}
                    {asset.type === 'data' && '📊'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white/90">{asset.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <GlassmorphicBadge size="sm" variant="default">
                      {asset.type}
                    </GlassmorphicBadge>
                    <GlassmorphicBadge size="sm" variant="default">
                      {formatFileSize(asset.size)}
                    </GlassmorphicBadge>
                    {asset.status === 'in_use' && (
                      <GlassmorphicBadge size="sm" variant="success">
                        In Use
                      </GlassmorphicBadge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onDownload && (
                  <GlassmorphicButton size="sm" variant="glass" onClick={() => onDownload(asset)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m5-5a2 2 0 00-2-2H9a2 2 0 00-2 2v1M5 13a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H5z" />
                    </svg>
                  </GlassmorphicButton>
                )}
                {onAddToCollection && (
                  <GlassmorphicButton size="sm" variant="glass" onClick={() => onAddToCollection(asset)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </GlassmorphicButton>
                )}
                {onEdit && asset.isEditable && (
                  <GlassmorphicButton size="sm" variant="gaming" onClick={() => onEdit(asset)}>
                    Edit
                  </GlassmorphicButton>
                )}
                {onDelete && asset.isDeletable && (
                  <GlassmorphicButton size="sm" variant="danger" onClick={() => onDelete(asset)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </GlassmorphicButton>
                )}
                <GlassmorphicButton size="sm" variant="glass" onClick={onClose}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </GlassmorphicButton>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Preview */}
              <div className="flex-1 p-6">
                {renderPreview()}
              </div>

              {/* Sidebar */}
              {(showMetadata || showUsage || showAIInfo) && (
                <div className="w-80 border-l border-white/10 p-6 overflow-y-auto">
                  {showMetadata && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-white/90">Details</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-white/60">Format</label>
                          <p className="text-white/90 capitalize">{asset.format}</p>
                        </div>
                        {asset.dimensions && (
                          <div>
                            <label className="text-sm text-white/60">Dimensions</label>
                            <p className="text-white/90">
                              {asset.dimensions.width} × {asset.dimensions.height}
                              {asset.dimensions.frames && ` (${asset.dimensions.frames} frames)`}
                              {asset.dimensions.duration && ` (${Math.round(asset.dimensions.duration)}s)`}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-white/60">Quality</label>
                          <p className="text-white/90 capitalize">{asset.quality}</p>
                        </div>
                        <div>
                          <label className="text-sm text-white/60">Created</label>
                          <p className="text-white/90">{formatDate(asset.createdAt)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-white/60">Last Modified</label>
                          <p className="text-white/90">{formatDate(asset.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {showUsage && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-white/90">Usage</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-white/60">Used in</label>
                          <p className="text-white/90">{asset.usage.usageCount} places</p>
                        </div>
                        {asset.usage.lastUsed && (
                          <div>
                            <label className="text-sm text-white/60">Last Used</label>
                            <p className="text-white/90">{formatDate(asset.usage.lastUsed)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showAIInfo && asset.ai.generated && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-white/90">AI Information</h3>
                      <div className="space-y-3">
                        {asset.ai.qualityScore && (
                          <div>
                            <label className="text-sm text-white/60">Quality Score</label>
                            <p className="text-white/90">{asset.ai.qualityScore}/100</p>
                          </div>
                        )}
                        {asset.ai.prompt && (
                          <div>
                            <label className="text-sm text-white/60">Generation Prompt</label>
                            <p className="text-white/90 text-sm">{asset.ai.prompt}</p>
                          </div>
                        )}
                        {asset.ai.aiModel && (
                          <div>
                            <label className="text-sm text-white/60">AI Model</label>
                            <p className="text-white/90">{asset.ai.aiModel}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white/90">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-md text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassmorphicCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}