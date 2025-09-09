"use client";

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
// GameAsset interface - matches the one in GameContext
export interface GameAsset {
  id?: string;
  name: string;
  asset_type: 'sprite' | 'audio' | 'texture' | 'animation' | 'font' | 'data';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  properties?: Record<string, any>;
  generated_by_ai?: boolean;
  generation_prompt?: string;
}

export interface AssetUploadProgress {
  assetId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UseAssetManagementOptions {
  gameId?: string;
  onUploadProgress?: (progress: AssetUploadProgress) => void;
  onUploadComplete?: (asset: GameAsset) => void;
  onUploadError?: (error: string) => void;
}

export function useAssetManagement(options: UseAssetManagementOptions = {}) {
  const { gameId, onUploadProgress, onUploadComplete, onUploadError } = options;
  const { user } = useAuth();
  const supabase = createClient();
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, AssetUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const uploadQueueRef = useRef<Array<{ file: File; assetData: Partial<GameAsset> }>>([]);

  // Upload single asset
  const uploadAsset = useCallback(async (
    file: File,
    assetData: Partial<GameAsset>
  ): Promise<GameAsset | null> => {
    if (!user || !gameId) return null;

    const assetId = `${Date.now()}-${file.name}`;
    const bucketPath = `games/${gameId}/assets/${assetId}`;

    try {
      // Initialize progress tracking
      const progressData: AssetUploadProgress = {
        assetId,
        progress: 0,
        status: 'uploading'
      };

      setUploadProgresses(prev => ({ ...prev, [assetId]: progressData }));
      onUploadProgress?.(progressData);
      setIsUploading(true);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(bucketPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update progress
      progressData.progress = 50;
      progressData.status = 'processing';
      setUploadProgresses(prev => ({ ...prev, [assetId]: progressData }));
      onUploadProgress?.(progressData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('game-assets')
        .getPublicUrl(bucketPath);

      // Create asset record in database
      const { data: assetRecord, error: dbError } = await supabase
        .from('game_assets')
        .insert({
          game_id: gameId,
          creator_id: user.id,
          name: assetData.name || file.name,
          asset_type: assetData.asset_type || detectAssetType(file),
          file_path: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          properties: assetData.properties || {},
          generated_by_ai: assetData.generated_by_ai || false,
          generation_prompt: assetData.generation_prompt
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      const completedAsset: GameAsset = {
        id: assetRecord.id,
        name: assetRecord.name,
        asset_type: assetRecord.asset_type as GameAsset['asset_type'],
        file_path: assetRecord.file_path,
        file_size: assetRecord.file_size || undefined,
        mime_type: assetRecord.mime_type || undefined,
        properties: (assetRecord.properties as Record<string, any>) || undefined,
        generated_by_ai: assetRecord.generated_by_ai || undefined,
        generation_prompt: assetRecord.generation_prompt || undefined
      };

      // Complete progress
      progressData.progress = 100;
      progressData.status = 'completed';
      setUploadProgresses(prev => ({ ...prev, [assetId]: progressData }));
      onUploadProgress?.(progressData);
      onUploadComplete?.(completedAsset);

      return completedAsset;
    } catch (error: any) {
      // Error handling
      const errorProgress: AssetUploadProgress = {
        assetId,
        progress: 0,
        status: 'error',
        error: error.message
      };

      setUploadProgresses(prev => ({ ...prev, [assetId]: errorProgress }));
      onUploadProgress?.(errorProgress);
      onUploadError?.(error.message);

      return null;
    } finally {
      setIsUploading(false);

      // Clean up progress after delay
      setTimeout(() => {
        setUploadProgresses(prev => {
          const newProgress = { ...prev };
          delete newProgress[assetId];
          return newProgress;
        });
      }, 5000);
    }
  }, [user, gameId, supabase, onUploadProgress, onUploadComplete, onUploadError]);

  // Upload multiple assets
  const uploadMultipleAssets = useCallback(async (
    files: File[],
    commonAssetData: Partial<GameAsset> = {}
  ): Promise<GameAsset[]> => {
    if (!user || !gameId) return [];

    const results: GameAsset[] = [];

    // Process files one by one to avoid overwhelming the server
    for (const file of files) {
      const asset = await uploadAsset(file, {
        ...commonAssetData,
        name: commonAssetData.name || file.name
      });

      if (asset) {
        results.push(asset);
      }
    }

    return results;
  }, [uploadAsset, user, gameId]);

  // Delete asset
  const deleteAsset = useCallback(async (asset: GameAsset): Promise<boolean> => {
    if (!user || !asset.id) return false;

    try {
      // Delete from storage if it's a user-uploaded file
      if (asset.file_path.includes('game-assets/')) {
        const filePath = asset.file_path.split('/game-assets/')[1];
        await supabase.storage
          .from('game-assets')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('game_assets')
        .delete()
        .eq('id', asset.id);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error: any) {
      onUploadError?.(error.message);
      return false;
    }
  }, [user, supabase, onUploadError]);

  // Generate AI asset
  const generateAIAsset = useCallback(async (
    prompt: string,
    assetType: GameAsset['asset_type'],
    additionalData: Partial<GameAsset> = {}
  ): Promise<GameAsset | null> => {
    if (!user || !gameId) return null;

    try {
      setIsUploading(true);

      // Call AI generation API
      const response = await fetch('/api/ai/generate-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          asset_type: assetType,
          game_id: gameId,
          ...additionalData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI asset');
      }

      const generatedAsset = await response.json();

      // Create asset record
      const { data: assetRecord, error: dbError } = await supabase
        .from('game_assets')
        .insert({
          game_id: gameId,
          creator_id: user.id,
          name: additionalData.name || `Generated ${assetType}`,
          asset_type: assetType,
          file_path: generatedAsset.file_path,
          file_size: generatedAsset.file_size,
          mime_type: generatedAsset.mime_type,
          properties: generatedAsset.properties || {},
          generated_by_ai: true,
          generation_prompt: prompt,
          generation_model: generatedAsset.model_used
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      const asset: GameAsset = {
        id: assetRecord.id,
        name: assetRecord.name,
        asset_type: assetRecord.asset_type as GameAsset['asset_type'],
        file_path: assetRecord.file_path,
        file_size: assetRecord.file_size || undefined,
        mime_type: assetRecord.mime_type || undefined,
        properties: (assetRecord.properties as Record<string, any>) || undefined,
        generated_by_ai: assetRecord.generated_by_ai || undefined,
        generation_prompt: assetRecord.generation_prompt || undefined
      };

      onUploadComplete?.(asset);
      return asset;
    } catch (error: any) {
      onUploadError?.(error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, gameId, supabase, onUploadComplete, onUploadError]);

  // Utility function to detect asset type from file
  const detectAssetType = (file: File): GameAsset['asset_type'] => {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/')) {
      return 'sprite';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.includes('font')) {
      return 'font';
    } else if (mimeType === 'application/json' || mimeType === 'text/plain') {
      return 'data';
    } else {
      return 'texture'; // Default fallback
    }
  };

  // Get asset URL with caching
  const getAssetUrl = useCallback((asset: GameAsset): string => {
    // If it's already a full URL, return as-is
    if (asset.file_path.startsWith('http')) {
      return asset.file_path;
    }

    // Generate signed URL for private assets
    const { data } = supabase.storage
      .from('game-assets')
      .getPublicUrl(asset.file_path);

    return data.publicUrl;
  }, [supabase]);

  return {
    // State
    uploadProgresses,
    isUploading,

    // Actions
    uploadAsset,
    uploadMultipleAssets,
    deleteAsset,
    generateAIAsset,

    // Utilities
    getAssetUrl,
    detectAssetType,
    clearProgress: (assetId: string) => {
      setUploadProgresses(prev => {
        const newProgress = { ...prev };
        delete newProgress[assetId];
        return newProgress;
      });
    }
  };
}