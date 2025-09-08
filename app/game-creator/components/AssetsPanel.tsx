"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import { TabSystem, Tab } from "./TabSystem";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { AssetSearch } from "@/components/assets/AssetSearch";
import { AssetPreview } from "@/components/assets/AssetPreview";
import { AssetUpload } from "@/components/assets/AssetUpload";
import { AssetCollections } from "@/components/assets/AssetCollections";
import { useAssets } from "@/hooks/useAssets";
import { useAssetUpload } from "@/hooks/useAssetUpload";
import { useAssetRecommendations } from "@/hooks/useAssetRecommendations";
import { 
  Asset, 
  AssetSearchQuery, 
  AssetType 
} from "@/types/assets";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

// Smart Asset Library with AI Search - Enhanced AssetsPanel
// Features: Virtual scrolling, semantic search, AI recommendations, collections

// Enhanced Sprites & Tilesets tab with AI features
const SpritesTab = ({ 
  assets, 
  loading, 
  onAssetClick, 
  onAssetPreview, 
  selectedAssetIds, 
  onSelectionChange 
}: {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  onAssetPreview: (asset: Asset) => void;
  selectedAssetIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const { upload } = useAssetUpload();

  const sprites = useMemo(() => 
    assets.filter(asset => 
      asset.type === 'sprite' || asset.type === 'tileset'
    ), [assets]
  );

  const handleUploadComplete = useCallback((results: any[]) => {
    console.log('Upload completed:', results);
    setShowUpload(false);
    // Refresh assets would be called here
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white/90">Sprites & Tilesets</h4>
            <GlassmorphicBadge size="sm" variant="gaming">
              {sprites.length} items
            </GlassmorphicBadge>
          </div>
          <GlassmorphicButton 
            size="sm" 
            variant="gaming" 
            onClick={() => setShowUpload(true)}
          >
            Upload
          </GlassmorphicButton>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1">
        <AssetGrid
          assets={sprites}
          loading={loading}
          selectedIds={selectedAssetIds}
          onAssetClick={onAssetClick}
          onAssetDoubleClick={onAssetPreview}
          onSelectionChange={onSelectionChange}
          enableSelection={true}
          enableDragDrop={true}
          virtualScrolling={true}
          itemSize="medium"
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white/90">Upload Sprites & Tilesets</h3>
                  <GlassmorphicButton 
                    size="sm" 
                    variant="glass-ghost" 
                    onClick={() => setShowUpload(false)}
                  >
                    ×
                  </GlassmorphicButton>
                </div>
                <AssetUpload
                  config={{
                    allowedFormats: ['png', 'jpg', 'webp', 'gif'],
                    allowedTypes: ['sprite', 'tileset'],
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                    autoOptimize: true,
                    generateThumbnail: true,
                  }}
                  onUploadComplete={handleUploadComplete}
                  multiple={true}
                />
              </GlassmorphicCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Audio tab with preview capabilities
const SoundsTab = ({ 
  assets, 
  loading, 
  onAssetClick, 
  onAssetPreview, 
  selectedAssetIds, 
  onSelectionChange 
}: {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  onAssetPreview: (asset: Asset) => void;
  selectedAssetIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const { upload } = useAssetUpload();

  const audioAssets = useMemo(() => 
    assets.filter(asset => 
      asset.type === 'sound' || asset.type === 'music'
    ), [assets]
  );

  const handleUploadComplete = useCallback((results: any[]) => {
    console.log('Audio upload completed:', results);
    setShowUpload(false);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white/90">Audio Assets</h4>
            <GlassmorphicBadge size="sm" variant="gaming">
              {audioAssets.length} items
            </GlassmorphicBadge>
          </div>
          <GlassmorphicButton 
            size="sm" 
            variant="gaming"
            onClick={() => setShowUpload(true)}
          >
            Upload
          </GlassmorphicButton>
        </div>
      </div>

      {/* Audio Grid */}
      <div className="flex-1">
        <AssetGrid
          assets={audioAssets}
          loading={loading}
          selectedIds={selectedAssetIds}
          onAssetClick={onAssetClick}
          onAssetDoubleClick={onAssetPreview}
          onSelectionChange={onSelectionChange}
          enableSelection={true}
          enableDragDrop={true}
          virtualScrolling={true}
          itemSize="medium"
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white/90">Upload Audio Assets</h3>
                  <GlassmorphicButton 
                    size="sm" 
                    variant="glass-ghost" 
                    onClick={() => setShowUpload(false)}
                  >
                    ×
                  </GlassmorphicButton>
                </div>
                <AssetUpload
                  config={{
                    allowedFormats: ['wav', 'mp3', 'ogg', 'flac'],
                    allowedTypes: ['sound', 'music'],
                    maxFileSize: 50 * 1024 * 1024, // 50MB
                    autoOptimize: true,
                    extractMetadata: true,
                  }}
                  onUploadComplete={handleUploadComplete}
                  multiple={true}
                />
              </GlassmorphicCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Animations tab
const AnimationsTab = ({ 
  assets, 
  loading, 
  onAssetClick, 
  onAssetPreview, 
  selectedAssetIds, 
  onSelectionChange 
}: {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  onAssetPreview: (asset: Asset) => void;
  selectedAssetIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) => {
  const animations = useMemo(() => 
    assets.filter(asset => asset.type === 'animation'), [assets]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white/90">Animations</h4>
            <GlassmorphicBadge size="sm" variant="gaming">
              {animations.length} items
            </GlassmorphicBadge>
          </div>
          <GlassmorphicButton size="sm" variant="gaming">
            Create
          </GlassmorphicButton>
        </div>
      </div>

      {/* Animation Grid */}
      <div className="flex-1">
        <AssetGrid
          assets={animations}
          loading={loading}
          selectedIds={selectedAssetIds}
          onAssetClick={onAssetClick}
          onAssetDoubleClick={onAssetPreview}
          onSelectionChange={onSelectionChange}
          enableSelection={true}
          enableDragDrop={true}
          virtualScrolling={true}
          itemSize="medium"
        />
      </div>
    </div>
  );
};

// Enhanced Collections & Search tab
const CollectionsTab = ({ 
  selectedCollectionId, 
  onCollectionSelect 
}: { 
  selectedCollectionId?: string; 
  onCollectionSelect: (id: string) => void; 
}) => {
  return (
    <div className="h-full">
      <AssetCollections
        selectedCollectionId={selectedCollectionId}
        onCollectionSelect={onCollectionSelect}
        onCollectionCreate={(data) => console.log('Create collection:', data)}
        onCollectionEdit={(id, data) => console.log('Edit collection:', id, data)}
        onCollectionDelete={(id) => console.log('Delete collection:', id)}
        onCollectionShare={(id) => console.log('Share collection:', id)}
      />
    </div>
  );
};

// Smart Search tab with AI features
const SmartSearchTab = ({ onSearch }: { onSearch: (query: AssetSearchQuery) => void }) => {
  const { recommendations, getRecommendations } = useAssetRecommendations();

  useEffect(() => {
    // Get initial recommendations
    getRecommendations({
      gameGenre: 'action',
      gameStyle: 'pixel',
      targetAudience: 'indie',
    });
  }, [getRecommendations]);

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Advanced Search */}
      <div className="flex-shrink-0">
        <AssetSearch
          onSearch={onSearch}
          onClear={() => console.log('Clear search')}
          suggestions={['cyberpunk theme', 'character sprites', 'background music']}
          loading={false}
          resultCount={0}
        />
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-semibold text-white/90">AI Recommendations</h3>
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((rec) => (
              <GlassmorphicCard key={rec.assetId} className="p-3" variant="subtle">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">
                      Score: {rec.score}%
                    </div>
                    <div className="text-xs text-white/70 mt-1">
                      {rec.reason}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <GlassmorphicBadge size="sm" variant="gaming">
                    {rec.type}
                  </GlassmorphicBadge>
                </div>
              </GlassmorphicCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function AssetsPanel() {
  // State management
  const [activeTab, setActiveTab] = useState("sprites");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>('system-all');
  
  // Hooks
  const { assets, loading, search, error } = useAssets();
  const { recommendations, getRecommendations } = useAssetRecommendations();

  // Handlers
  const handleAssetClick = useCallback((asset: Asset) => {
    console.log('Asset clicked:', asset);
  }, []);

  const handleAssetPreview = useCallback((asset: Asset) => {
    setPreviewAsset(asset);
  }, []);

  const handleSearch = useCallback((query: AssetSearchQuery) => {
    search(query);
  }, [search]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedAssetIds(ids);
  }, []);

  const handleCollectionSelect = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    // Filter assets by collection
    search({ collections: [collectionId] });
  }, [search]);

  // Tab configuration
  const tabs: Tab[] = [
    {
      id: "sprites",
      label: "Sprites",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🎨</span>
      ),
      content: (
        <SpritesTab
          assets={assets}
          loading={loading}
          onAssetClick={handleAssetClick}
          onAssetPreview={handleAssetPreview}
          selectedAssetIds={selectedAssetIds}
          onSelectionChange={handleSelectionChange}
        />
      ),
      badge: assets.filter(a => a.type === 'sprite' || a.type === 'tileset').length,
    },
    {
      id: "audio",
      label: "Audio",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🔊</span>
      ),
      content: (
        <SoundsTab
          assets={assets}
          loading={loading}
          onAssetClick={handleAssetClick}
          onAssetPreview={handleAssetPreview}
          selectedAssetIds={selectedAssetIds}
          onSelectionChange={handleSelectionChange}
        />
      ),
      badge: assets.filter(a => a.type === 'sound' || a.type === 'music').length,
    },
    {
      id: "animations",
      label: "Anims",
      icon: ({ className }) => (
        <span className={clsx(className, "text-sm")}>🎬</span>
      ),
      content: (
        <AnimationsTab
          assets={assets}
          loading={loading}
          onAssetClick={handleAssetClick}
          onAssetPreview={handleAssetPreview}
          selectedAssetIds={selectedAssetIds}
          onSelectionChange={handleSelectionChange}
        />
      ),
      badge: assets.filter(a => a.type === 'animation').length,
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
      content: (
        <CollectionsTab
          selectedCollectionId={selectedCollectionId}
          onCollectionSelect={handleCollectionSelect}
        />
      ),
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
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      content: <SmartSearchTab onSearch={handleSearch} />,
      badge: recommendations.length > 0 ? recommendations.length : undefined,
    },
  ];

  return (
    <>
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

      {/* Asset Preview Modal */}
      <AssetPreview
        asset={previewAsset}
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        onEdit={(asset) => console.log('Edit asset:', asset)}
        onDelete={(asset) => console.log('Delete asset:', asset)}
        onDownload={(asset) => console.log('Download asset:', asset)}
        onAddToCollection={(asset) => console.log('Add to collection:', asset)}
        showMetadata={true}
        showUsage={true}
        showAIInfo={true}
        enableZoom={true}
        enablePlayback={true}
      />
    </>
  );
}
