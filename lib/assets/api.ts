/**
 * Asset API integration for GameGen platform
 * Handles communication with Supabase backend and external services
 */

import { 
  Asset, 
  AssetCollection,
  AssetSearchQuery, 
  AssetSearchResult,
  AssetUploadConfig,
  AssetUploadResult,
  AssetBatchOperation,
  AssetBatchResult,
  AssetRecommendation,
  AssetRecommendationContext,
  AssetError,
} from "@/types/assets";
import { createClient } from "@/lib/supabase/client";

// Initialize Supabase client
const supabase = createClient();

// API endpoints configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  endpoints: {
    assets: '/assets',
    collections: '/collections',
    upload: '/assets/upload',
    search: '/assets/search',
    recommendations: '/assets/recommendations',
    ai: '/assets/ai',
    batch: '/assets/batch',
  },
  timeout: 30000, // 30 seconds
};

// Custom fetch wrapper with error handling
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new AssetError(
        errorData.message || `HTTP ${response.status}`,
        `HTTP_${response.status}`,
        errorData
      );
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof AssetError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AssetError('Request timeout', 'REQUEST_TIMEOUT');
      }
      throw new AssetError(error.message, 'NETWORK_ERROR');
    }
    
    throw new AssetError('Unknown error occurred', 'UNKNOWN_ERROR');
  }
};

// Asset CRUD operations
export const assetApi = {
  // Get asset by ID
  async getById(id: string): Promise<Asset> {
    return apiRequest<Asset>(`${API_CONFIG.endpoints.assets}/${id}`);
  },

  // Search assets
  async search(query: AssetSearchQuery): Promise<AssetSearchResult> {
    return apiRequest<AssetSearchResult>(API_CONFIG.endpoints.search, {
      method: 'POST',
      body: JSON.stringify(query),
    });
  },

  // Create new asset
  async create(assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    return apiRequest<Asset>(API_CONFIG.endpoints.assets, {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  },

  // Update asset
  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    return apiRequest<Asset>(`${API_CONFIG.endpoints.assets}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete asset
  async delete(id: string): Promise<void> {
    await apiRequest(`${API_CONFIG.endpoints.assets}/${id}`, {
      method: 'DELETE',
    });
  },

  // Batch operations
  async batchOperation(operation: AssetBatchOperation): Promise<AssetBatchResult> {
    return apiRequest<AssetBatchResult>(API_CONFIG.endpoints.batch, {
      method: 'POST',
      body: JSON.stringify(operation),
    });
  },

  // Get asset usage analytics
  async getUsageAnalytics(id: string): Promise<any> {
    return apiRequest(`${API_CONFIG.endpoints.assets}/${id}/analytics`);
  },

  // Get similar assets
  async getSimilar(id: string, limit: number = 5): Promise<Asset[]> {
    return apiRequest<Asset[]>(`${API_CONFIG.endpoints.assets}/${id}/similar?limit=${limit}`);
  },
};

// Asset upload operations
export const uploadApi = {
  // Upload single or multiple files
  async uploadFiles(
    files: File[], 
    config?: Partial<AssetUploadConfig>,
    onProgress?: (progress: any) => void
  ): Promise<AssetUploadResult[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    if (config) {
      formData.append('config', JSON.stringify(config));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes for uploads

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.upload}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let browser set it for FormData
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new AssetError(
          errorData.message || 'Upload failed',
          'UPLOAD_FAILED',
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AssetError) {
        throw error;
      }
      
      throw new AssetError(
        error instanceof Error ? error.message : 'Upload failed',
        'UPLOAD_ERROR'
      );
    }
  },

  // Get upload progress
  async getUploadProgress(uploadId: string): Promise<any> {
    return apiRequest(`${API_CONFIG.endpoints.upload}/${uploadId}/progress`);
  },

  // Cancel upload
  async cancelUpload(uploadId: string): Promise<void> {
    await apiRequest(`${API_CONFIG.endpoints.upload}/${uploadId}/cancel`, {
      method: 'DELETE',
    });
  },
};

// Asset collections operations
export const collectionsApi = {
  // Get all collections for user
  async getAll(): Promise<AssetCollection[]> {
    return apiRequest<AssetCollection[]>(API_CONFIG.endpoints.collections);
  },

  // Get collection by ID
  async getById(id: string): Promise<AssetCollection> {
    return apiRequest<AssetCollection>(`${API_CONFIG.endpoints.collections}/${id}`);
  },

  // Create new collection
  async create(collection: Omit<AssetCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetCollection> {
    return apiRequest<AssetCollection>(API_CONFIG.endpoints.collections, {
      method: 'POST',
      body: JSON.stringify(collection),
    });
  },

  // Update collection
  async update(id: string, updates: Partial<AssetCollection>): Promise<AssetCollection> {
    return apiRequest<AssetCollection>(`${API_CONFIG.endpoints.collections}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete collection
  async delete(id: string): Promise<void> {
    await apiRequest(`${API_CONFIG.endpoints.collections}/${id}`, {
      method: 'DELETE',
    });
  },

  // Add assets to collection
  async addAssets(collectionId: string, assetIds: string[]): Promise<AssetCollection> {
    return apiRequest<AssetCollection>(`${API_CONFIG.endpoints.collections}/${collectionId}/assets`, {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  },

  // Remove assets from collection
  async removeAssets(collectionId: string, assetIds: string[]): Promise<AssetCollection> {
    return apiRequest<AssetCollection>(`${API_CONFIG.endpoints.collections}/${collectionId}/assets`, {
      method: 'DELETE',
      body: JSON.stringify({ assetIds }),
    });
  },

  // Get collection assets
  async getAssets(collectionId: string): Promise<Asset[]> {
    return apiRequest<Asset[]>(`${API_CONFIG.endpoints.collections}/${collectionId}/assets`);
  },
};

// AI and recommendation operations
export const aiApi = {
  // Get asset recommendations
  async getRecommendations(context: AssetRecommendationContext): Promise<AssetRecommendation[]> {
    return apiRequest<AssetRecommendation[]>(API_CONFIG.endpoints.recommendations, {
      method: 'POST',
      body: JSON.stringify(context),
    });
  },

  // Generate asset with AI
  async generateAsset(prompt: string, type: string, options?: any): Promise<AssetUploadResult> {
    return apiRequest<AssetUploadResult>(`${API_CONFIG.endpoints.ai}/generate`, {
      method: 'POST',
      body: JSON.stringify({ prompt, type, ...options }),
    });
  },

  // Enhance asset with AI
  async enhanceAsset(assetId: string, enhancement: string): Promise<Asset> {
    return apiRequest<Asset>(`${API_CONFIG.endpoints.ai}/enhance`, {
      method: 'POST',
      body: JSON.stringify({ assetId, enhancement }),
    });
  },

  // Auto-tag asset with AI
  async autoTag(assetId: string): Promise<string[]> {
    return apiRequest<string[]>(`${API_CONFIG.endpoints.ai}/tag`, {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    });
  },

  // Get asset quality score
  async getQualityScore(assetId: string): Promise<number> {
    const response = await apiRequest<{ score: number }>(`${API_CONFIG.endpoints.ai}/quality`, {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    });
    return response.score;
  },

  // Semantic search
  async semanticSearch(query: string, limit: number = 20): Promise<Asset[]> {
    return apiRequest<Asset[]>(`${API_CONFIG.endpoints.ai}/search`, {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  },
};

// Supabase integration helpers
export const supabaseApi = {
  // Initialize real-time subscriptions
  subscribeToAssetChanges(
    callback: (payload: any) => void,
    filter?: { userId?: string; collectionId?: string }
  ) {
    let subscription = supabase
      .channel('asset-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          ...(filter?.userId && { filter: `owner_id=eq.${filter.userId}` }),
        },
        callback
      );

    if (filter?.collectionId) {
      subscription = subscription.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_collections',
          filter: `id=eq.${filter.collectionId}`,
        },
        callback
      );
    }

    subscription.subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  // Upload file to Supabase Storage
  async uploadToStorage(
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ): Promise<{ url: string; path: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
      });

    if (error) {
      throw new AssetError(error.message, 'STORAGE_UPLOAD_FAILED', error);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  },

  // Delete file from Supabase Storage
  async deleteFromStorage(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new AssetError(error.message, 'STORAGE_DELETE_FAILED', error);
    }
  },

  // Get file URL from Supabase Storage
  getStorageUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Create signed URL for private files
  async createSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new AssetError(error.message, 'SIGNED_URL_FAILED', error);
    }

    return data.signedUrl;
  },
};

// Cache management
class AssetCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create global cache instance
export const assetCache = new AssetCache();

// Set up automatic cache cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    assetCache.cleanup();
  }, 60000); // Clean up every minute
}

// Cached API wrappers
export const cachedApi = {
  async getAsset(id: string): Promise<Asset> {
    const cacheKey = `asset:${id}`;
    const cached = assetCache.get<Asset>(cacheKey);
    if (cached) return cached;

    const asset = await assetApi.getById(id);
    assetCache.set(cacheKey, asset, 5 * 60 * 1000); // 5 minutes
    return asset;
  },

  async getCollection(id: string): Promise<AssetCollection> {
    const cacheKey = `collection:${id}`;
    const cached = assetCache.get<AssetCollection>(cacheKey);
    if (cached) return cached;

    const collection = await collectionsApi.getById(id);
    assetCache.set(cacheKey, collection, 10 * 60 * 1000); // 10 minutes
    return collection;
  },

  async searchAssets(query: AssetSearchQuery): Promise<AssetSearchResult> {
    const cacheKey = `search:${JSON.stringify(query)}`;
    const cached = assetCache.get<AssetSearchResult>(cacheKey);
    if (cached) return cached;

    const result = await assetApi.search(query);
    assetCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
    return result;
  },
};

// Error boundary helpers
export const handleApiError = (error: unknown): AssetError => {
  if (error instanceof AssetError) {
    return error;
  }

  if (error instanceof Error) {
    return new AssetError(error.message, 'API_ERROR');
  }

  return new AssetError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

// Retry logic for failed requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
};