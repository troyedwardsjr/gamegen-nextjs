"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { 
  Asset, 
  AssetSearchQuery, 
  AssetSearchResult, 
  AssetBatchOperation, 
  AssetBatchResult, 
  UseAssetsReturn,
  AssetError,
} from "@/types/assets";

// Mock data - replace with actual API calls
const mockAssets: Asset[] = [
  {
    id: "1",
    name: "player_idle.png",
    type: "sprite",
    format: "png",
    source: "user",
    status: "in_use",
    url: "/assets/mock/player_idle.png",
    thumbnailUrl: "/assets/mock/player_idle_thumb.png",
    size: 2048,
    dimensions: { width: 32, height: 32 },
    quality: "high",
    tags: ["character", "player", "idle"],
    collections: ["user-characters"],
    categories: ["characters"],
    usage: {
      usageCount: 5,
      lastUsed: new Date(),
      usedInScenes: ["scene-1", "scene-2"],
      usedInComponents: ["player-component"],
      dependencies: [],
    },
    metadata: {
      author: "Game Artist",
      description: "Main player character idle animation",
      keywords: ["pixel", "art", "character"],
      rating: 5,
      downloads: 120,
    },
    optimization: {
      originalSize: 3072,
      compressedSize: 2048,
      compressionRatio: 0.67,
      formats: ["png", "webp"],
      optimizationLevel: "medium",
      webOptimized: true,
      mobileOptimized: true,
    },
    ai: {
      generated: false,
      qualityScore: 85,
      recommendationScore: 90,
      tags: ["character", "sprite"],
      smartCategory: "player-characters",
      similar: ["5"],
      variations: [],
    },
    versioning: {
      version: "1.0",
      isLatest: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: "user-1",
    isPublic: false,
    isEditable: true,
    isDeletable: true,
  },
  {
    id: "2",
    name: "cyberpunk_tileset.png",
    type: "tileset",
    format: "png",
    source: "ai_generated",
    status: "ready",
    url: "/assets/mock/cyberpunk_tileset.png",
    thumbnailUrl: "/assets/mock/cyberpunk_tileset_thumb.png",
    size: 524288,
    dimensions: { width: 512, height: 512 },
    quality: "ultra",
    tags: ["tileset", "cyberpunk", "environment"],
    collections: ["user-cyberpunk"],
    categories: ["environments"],
    usage: {
      usageCount: 3,
      lastUsed: new Date(Date.now() - 3600000),
      usedInScenes: ["scene-1"],
      usedInComponents: [],
      dependencies: [],
    },
    metadata: {
      description: "Cyberpunk themed tileset with neon elements",
      keywords: ["cyberpunk", "neon", "futuristic"],
      rating: 4,
    },
    optimization: {
      originalSize: 1048576,
      compressedSize: 524288,
      compressionRatio: 0.5,
      formats: ["png", "webp"],
      optimizationLevel: "aggressive",
      webOptimized: true,
      mobileOptimized: true,
    },
    ai: {
      generated: true,
      aiModel: "DALL-E 3",
      prompt: "cyberpunk tileset with neon lights and futuristic buildings",
      qualityScore: 92,
      recommendationScore: 88,
      tags: ["cyberpunk", "tileset", "neon"],
      smartCategory: "environments",
    },
    versioning: {
      version: "1.0",
      isLatest: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: "user-1",
    isPublic: true,
    isEditable: true,
    isDeletable: true,
  },
  // Add more mock assets as needed
];

// Simulate API delay
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock search function
const mockSearch = async (query: AssetSearchQuery): Promise<AssetSearchResult> => {
  await simulateDelay(300 + Math.random() * 500);
  
  let filteredAssets = [...mockAssets];

  // Text search
  if (query.text) {
    const searchTerm = query.text.toLowerCase();
    filteredAssets = filteredAssets.filter(asset =>
      asset.name.toLowerCase().includes(searchTerm) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      asset.metadata.description?.toLowerCase().includes(searchTerm) ||
      asset.metadata.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }

  // Type filter
  if (query.types && query.types.length > 0) {
    filteredAssets = filteredAssets.filter(asset => query.types!.includes(asset.type));
  }

  // Source filter
  if (query.sources && query.sources.length > 0) {
    filteredAssets = filteredAssets.filter(asset => query.sources!.includes(asset.source));
  }

  // Quality filter
  if (query.quality && query.quality.length > 0) {
    filteredAssets = filteredAssets.filter(asset => query.quality!.includes(asset.quality));
  }

  // Size filter
  if (query.sizeRange) {
    filteredAssets = filteredAssets.filter(asset => {
      if (query.sizeRange!.min && asset.size < query.sizeRange!.min) return false;
      if (query.sizeRange!.max && asset.size > query.sizeRange!.max) return false;
      return true;
    });
  }

  // Usage filter
  if (query.usage) {
    if (query.usage.inUse !== undefined) {
      const inUse = query.usage.inUse;
      filteredAssets = filteredAssets.filter(asset => 
        (asset.status === 'in_use') === inUse
      );
    }
  }

  // Date range filter
  if (query.dateRange) {
    filteredAssets = filteredAssets.filter(asset => {
      const createdAt = asset.createdAt.getTime();
      if (query.dateRange!.from && createdAt < query.dateRange!.from.getTime()) return false;
      if (query.dateRange!.to && createdAt > query.dateRange!.to.getTime()) return false;
      return true;
    });
  }

  // Sort results
  if (query.sortBy) {
    filteredAssets.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (query.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'usageCount':
          aValue = a.usage.usageCount;
          bValue = b.usage.usageCount;
          break;
        case 'qualityScore':
          aValue = a.ai.qualityScore || 0;
          bValue = b.ai.qualityScore || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return query.sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      } else {
        return query.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
    });
  }

  // Pagination
  const offset = query.offset || 0;
  const limit = query.limit || 50;
  const paginatedAssets = filteredAssets.slice(offset, offset + limit);

  return {
    assets: paginatedAssets,
    total: filteredAssets.length,
    searchTime: Math.random() * 500 + 100,
    suggestions: query.text ? ["character sprites", "cyberpunk theme", "environment tiles"] : [],
    facets: {
      types: {
        sprite: filteredAssets.filter(a => a.type === 'sprite').length,
        tileset: filteredAssets.filter(a => a.type === 'tileset').length,
        sound: filteredAssets.filter(a => a.type === 'sound').length,
        music: filteredAssets.filter(a => a.type === 'music').length,
        animation: filteredAssets.filter(a => a.type === 'animation').length,
        font: filteredAssets.filter(a => a.type === 'font').length,
        shader: filteredAssets.filter(a => a.type === 'shader').length,
        texture: filteredAssets.filter(a => a.type === 'texture').length,
        model: filteredAssets.filter(a => a.type === 'model').length,
        scene: filteredAssets.filter(a => a.type === 'scene').length,
        script: filteredAssets.filter(a => a.type === 'script').length,
        data: filteredAssets.filter(a => a.type === 'data').length,
      },
      formats: {
        png: filteredAssets.filter(a => a.format === 'png').length,
        jpg: filteredAssets.filter(a => a.format === 'jpg').length,
        webp: filteredAssets.filter(a => a.format === 'webp').length,
        svg: filteredAssets.filter(a => a.format === 'svg').length,
        gif: filteredAssets.filter(a => a.format === 'gif').length,
        wav: filteredAssets.filter(a => a.format === 'wav').length,
        mp3: filteredAssets.filter(a => a.format === 'mp3').length,
        ogg: filteredAssets.filter(a => a.format === 'ogg').length,
        flac: filteredAssets.filter(a => a.format === 'flac').length,
        json: filteredAssets.filter(a => a.format === 'json').length,
        xml: filteredAssets.filter(a => a.format === 'xml').length,
        yaml: filteredAssets.filter(a => a.format === 'yaml').length,
        glsl: filteredAssets.filter(a => a.format === 'glsl').length,
        hlsl: filteredAssets.filter(a => a.format === 'hlsl').length,
        fbx: filteredAssets.filter(a => a.format === 'fbx').length,
        obj: filteredAssets.filter(a => a.format === 'obj').length,
        gltf: filteredAssets.filter(a => a.format === 'gltf').length,
        ttf: filteredAssets.filter(a => a.format === 'ttf').length,
        otf: filteredAssets.filter(a => a.format === 'otf').length,
        woff: filteredAssets.filter(a => a.format === 'woff').length,
        js: filteredAssets.filter(a => a.format === 'js').length,
        ts: filteredAssets.filter(a => a.format === 'ts').length,
        lua: filteredAssets.filter(a => a.format === 'lua').length,
        py: filteredAssets.filter(a => a.format === 'py').length,
      },
      sources: {
        user: filteredAssets.filter(a => a.source === 'user').length,
        ai_generated: filteredAssets.filter(a => a.source === 'ai_generated').length,
        template: filteredAssets.filter(a => a.source === 'template').length,
        community: filteredAssets.filter(a => a.source === 'community').length,
        marketplace: filteredAssets.filter(a => a.source === 'marketplace').length,
      },
      tags: filteredAssets.reduce((acc, asset) => {
        asset.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      collections: filteredAssets.reduce((acc, asset) => {
        asset.collections.forEach(collection => {
          acc[collection] = (acc[collection] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      quality: {
        low: filteredAssets.filter(a => a.quality === 'low').length,
        medium: filteredAssets.filter(a => a.quality === 'medium').length,
        high: filteredAssets.filter(a => a.quality === 'high').length,
        ultra: filteredAssets.filter(a => a.quality === 'ultra').length,
      },
    },
  };
};

export function useAssets(initialQuery?: AssetSearchQuery): UseAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<AssetSearchQuery>(initialQuery || {});
  
  const abortController = useRef<AbortController | null>(null);
  const currentOffset = useRef(0);

  // Search function
  const search = useCallback(async (query: AssetSearchQuery) => {
    // Cancel any ongoing request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);
    setError(null);
    currentOffset.current = 0;

    try {
      const searchQuery = { ...query, offset: 0 };
      const result = await mockSearch(searchQuery);
      
      if (abortController.current?.signal.aborted) return;

      setAssets(result.assets);
      setTotal(result.total);
      setCurrentQuery(query);
      setHasMore(result.assets.length < result.total);
      currentOffset.current = result.assets.length;
    } catch (err) {
      if (!abortController.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search assets';
        setError(errorMessage);
        setAssets([]);
        setTotal(0);
        setHasMore(false);
      }
    } finally {
      if (!abortController.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const searchQuery = { 
        ...currentQuery, 
        offset: currentOffset.current,
        limit: currentQuery.limit || 50,
      };
      const result = await mockSearch(searchQuery);

      setAssets(prev => [...prev, ...result.assets]);
      setHasMore(currentOffset.current + result.assets.length < result.total);
      currentOffset.current += result.assets.length;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more assets';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentQuery]);

  // Refresh function
  const refresh = useCallback(async () => {
    await search(currentQuery);
  }, [search, currentQuery]);

  // Delete asset function
  const deleteAsset = useCallback(async (id: string) => {
    try {
      await simulateDelay(500); // Simulate API call
      setAssets(prev => prev.filter(asset => asset.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      throw new AssetError(errorMessage, 'ASSET_DELETE_FAILED');
    }
  }, []);

  // Update asset function
  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    try {
      await simulateDelay(300); // Simulate API call
      setAssets(prev => prev.map(asset => 
        asset.id === id 
          ? { ...asset, ...updates, updatedAt: new Date() }
          : asset
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      throw new AssetError(errorMessage, 'ASSET_UPDATE_FAILED');
    }
  }, []);

  // Bulk operation function
  const bulkOperation = useCallback(async (operation: AssetBatchOperation): Promise<AssetBatchResult> => {
    try {
      await simulateDelay(1000); // Simulate API call
      
      const successful: string[] = [];
      const failed: Array<{ assetId: string; error: string }> = [];

      for (const assetId of operation.assetIds) {
        // Simulate some operations failing randomly
        if (Math.random() > 0.1) { // 90% success rate
          successful.push(assetId);
          
          switch (operation.type) {
            case 'delete':
              setAssets(prev => prev.filter(asset => asset.id !== assetId));
              break;
            case 'tag':
              const newTags = operation.parameters?.tags as string[] || [];
              setAssets(prev => prev.map(asset => 
                asset.id === assetId 
                  ? { ...asset, tags: Array.from(new Set([...asset.tags, ...newTags])), updatedAt: new Date() }
                  : asset
              ));
              break;
            // Add more operation types as needed
          }
        } else {
          failed.push({
            assetId,
            error: `Failed to ${operation.type} asset`,
          });
        }
      }

      return {
        successful,
        failed,
        summary: `${operation.type} operation completed. ${successful.length} succeeded, ${failed.length} failed.`,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk operation failed';
      throw new AssetError(errorMessage, 'ASSET_BATCH_OPERATION_FAILED');
    }
  }, []);

  // Initialize with default search
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    } else {
      search({});
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    assets,
    loading,
    error,
    total,
    hasMore,
    search,
    loadMore,
    refresh,
    deleteAsset,
    updateAsset,
    bulkOperation,
  };
}