/**
 * Toxoid Asset Management System
 * 
 * Handles loading, caching, and management of all game assets including:
 * - Sprites and textures
 * - Audio files
 * - Spine skeletal animations
 * - Game scripts
 * - Asset preloading and optimization
 * - Memory management and cleanup
 */

import { AssetInfo, AssetManager, SpriteLoadResult } from '@/types/toxoid';

// =============================================================================
// ASSET TYPES AND INTERFACES
// =============================================================================

interface LoadedAsset extends AssetInfo {
  data?: any;
  loadTime: number;
  lastAccessed: number;
  refCount: number;
  url?: string;
}

interface AssetLoadProgress {
  total: number;
  loaded: number;
  failed: number;
  current?: string;
}

// =============================================================================
// ASSET MANAGER IMPLEMENTATION
// =============================================================================

export class ToxoidAssetManager implements AssetManager {
  private assets: Map<string, LoadedAsset> = new Map();
  private loadingAssets: Map<string, Promise<LoadedAsset>> = new Map();
  private memoryUsage = 0;
  private maxMemoryUsage = 100 * 1024 * 1024; // 100MB default
  private onProgressCallback?: (progress: AssetLoadProgress) => void;

  constructor(maxMemoryMB = 100) {
    this.maxMemoryUsage = maxMemoryMB * 1024 * 1024;
    console.log(`[ToxoidAssets] Asset manager initialized with ${maxMemoryMB}MB memory limit`);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Load a single asset
   */
  async loadAsset(path: string, type: AssetInfo['type']): Promise<AssetInfo> {
    const assetId = this.generateAssetId(path, type);

    // Return cached asset if available
    const cached = this.assets.get(assetId);
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.refCount++;
      return cached;
    }

    // Return existing loading promise if asset is being loaded
    const loading = this.loadingAssets.get(assetId);
    if (loading) {
      return await loading;
    }

    // Start loading the asset
    const loadPromise = this.loadAssetInternal(path, type, assetId);
    this.loadingAssets.set(assetId, loadPromise);

    try {
      const asset = await loadPromise;
      this.loadingAssets.delete(assetId);
      return asset;
    } catch (error) {
      this.loadingAssets.delete(assetId);
      throw error;
    }
  }

  /**
   * Preload multiple assets
   */
  async preloadAssets(paths: string[]): Promise<AssetInfo[]> {
    const results: AssetInfo[] = [];
    const progress: AssetLoadProgress = {
      total: paths.length,
      loaded: 0,
      failed: 0,
    };

    console.log(`[ToxoidAssets] Preloading ${paths.length} assets...`);

    for (const path of paths) {
      try {
        progress.current = path;
        if (this.onProgressCallback) {
          this.onProgressCallback({ ...progress });
        }

        const type = this.inferAssetType(path);
        const asset = await this.loadAsset(path, type);
        results.push(asset);
        progress.loaded++;

        console.log(`[ToxoidAssets] ✅ Loaded: ${path} (${progress.loaded}/${progress.total})`);
      } catch (error) {
        progress.failed++;
        console.error(`[ToxoidAssets] ❌ Failed to load: ${path}`, error);
        
        // Create a failed asset entry
        results.push({
          id: this.generateAssetId(path, this.inferAssetType(path)),
          name: path.split('/').pop() || path,
          type: this.inferAssetType(path),
          path,
          size: 0,
          isLoaded: false,
        });
      }

      if (this.onProgressCallback) {
        this.onProgressCallback({ ...progress });
      }
    }

    console.log(`[ToxoidAssets] Preloading complete: ${progress.loaded} loaded, ${progress.failed} failed`);
    return results;
  }

  /**
   * Get an asset by ID
   */
  getAsset(id: string): AssetInfo | null {
    const asset = this.assets.get(id);
    if (asset) {
      asset.lastAccessed = Date.now();
      return asset;
    }
    return null;
  }

  /**
   * Unload an asset
   */
  unloadAsset(id: string): boolean {
    const asset = this.assets.get(id);
    if (!asset) return false;

    asset.refCount = Math.max(0, asset.refCount - 1);
    
    // Only actually unload if no references remain
    if (asset.refCount === 0) {
      this.memoryUsage -= asset.size;
      this.assets.delete(id);
      
      // Clean up the actual data if needed
      if (asset.data && typeof asset.data === 'object') {
        if (asset.data instanceof HTMLImageElement) {
          asset.data.src = '';
        } else if (asset.data instanceof HTMLAudioElement) {
          asset.data.src = '';
          asset.data.load();
        }
      }

      console.log(`[ToxoidAssets] Unloaded asset: ${asset.path}`);
      return true;
    }

    return false;
  }

  /**
   * Get all loaded assets
   */
  getLoadedAssets(): AssetInfo[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get current memory usage in bytes
   */
  getMemoryUsage(): number {
    return this.memoryUsage;
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: AssetLoadProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Clean up unused assets based on memory pressure
   */
  cleanup(forceCleanup = false): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    let cleanedUp = 0;

    for (const [id, asset] of this.assets.entries()) {
      const shouldCleanup = forceCleanup || 
                           (asset.refCount === 0 && (now - asset.lastAccessed > maxAge)) ||
                           (this.memoryUsage > this.maxMemoryUsage * 0.8);

      if (shouldCleanup && asset.refCount === 0) {
        this.unloadAsset(id);
        cleanedUp++;
      }
    }

    if (cleanedUp > 0) {
      console.log(`[ToxoidAssets] Cleaned up ${cleanedUp} unused assets`);
    }
  }

  /**
   * Destroy the asset manager and clean up all resources
   */
  destroy(): void {
    for (const [id] of this.assets.entries()) {
      this.unloadAsset(id);
    }
    
    this.assets.clear();
    this.loadingAssets.clear();
    this.memoryUsage = 0;
    
    console.log('[ToxoidAssets] Asset manager destroyed');
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private async loadAssetInternal(
    path: string, 
    type: AssetInfo['type'], 
    assetId: string
  ): Promise<LoadedAsset> {
    const startTime = Date.now();
    console.log(`[ToxoidAssets] Loading ${type}: ${path}`);

    try {
      let data: any;
      let size = 0;

      switch (type) {
        case 'sprite':
          const spriteResult = await this.loadSprite(path);
          data = spriteResult;
          size = this.estimateImageSize(spriteResult.width, spriteResult.height);
          break;

        case 'audio':
          data = await this.loadAudio(path);
          size = await this.getFileSize(path);
          break;

        case 'spine':
          data = await this.loadSpineAnimation(path);
          size = await this.getFileSize(path);
          break;

        case 'script':
          data = await this.loadScript(path);
          size = new Blob([data]).size;
          break;

        default:
          throw new Error(`Unsupported asset type: ${type}`);
      }

      // Check memory limits
      if (this.memoryUsage + size > this.maxMemoryUsage) {
        console.warn('[ToxoidAssets] Memory limit approaching, cleaning up...');
        this.cleanup(true);
      }

      const asset: LoadedAsset = {
        id: assetId,
        name: path.split('/').pop() || path,
        type,
        path,
        size,
        isLoaded: true,
        data,
        loadTime: Date.now() - startTime,
        lastAccessed: Date.now(),
        refCount: 1,
      };

      this.assets.set(assetId, asset);
      this.memoryUsage += size;

      console.log(`[ToxoidAssets] ✅ Loaded ${type}: ${path} (${size} bytes, ${asset.loadTime}ms)`);
      return asset;

    } catch (error) {
      console.error(`[ToxoidAssets] ❌ Failed to load ${type}: ${path}`, error);
      throw error;
    }
  }

  private async loadSprite(path: string): Promise<SpriteLoadResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          id: Date.now(), // Simple ID for mock
          width: img.naturalWidth,
          height: img.naturalHeight,
          success: true,
        });
      };

      img.onerror = () => {
        reject(new Error(`Failed to load sprite: ${path}`));
      };

      // Handle CORS for external images
      img.crossOrigin = 'anonymous';
      img.src = path;
    });
  }

  private async loadAudio(path: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        resolve(audio);
      };

      audio.onerror = () => {
        reject(new Error(`Failed to load audio: ${path}`));
      };

      audio.src = path;
      audio.load();
    });
  }

  private async loadSpineAnimation(path: string): Promise<any> {
    // This would integrate with the actual Spine loader in the WASM engine
    // For now, return a mock structure
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch spine animation: ${path}`);
    }
    
    return await response.json();
  }

  private async loadScript(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${path}`);
    }
    
    return await response.text();
  }

  private async getFileSize(path: string): Promise<number> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0; // Fallback if can't get size
    }
  }

  private estimateImageSize(width: number, height: number): number {
    // Rough estimate: RGBA * width * height
    return width * height * 4;
  }

  private generateAssetId(path: string, type: AssetInfo['type']): string {
    return `${type}:${path}`;
  }

  private inferAssetType(path: string): AssetInfo['type'] {
    const ext = path.toLowerCase().split('.').pop();
    
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return 'sprite';
      
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'aac':
        return 'audio';
      
      case 'json':
        // Could be spine or other data - check if it's in a spine directory
        if (path.includes('spine') || path.includes('skeletal')) {
          return 'spine';
        }
        return 'script';
      
      case 'js':
      case 'ts':
        return 'script';
      
      default:
        return 'sprite'; // Default fallback
    }
  }
}

// =============================================================================
// GLOBAL ASSET MANAGER
// =============================================================================

let globalAssetManager: ToxoidAssetManager | null = null;

/**
 * Get the global asset manager instance
 */
export function getAssetManager(): ToxoidAssetManager {
  if (!globalAssetManager) {
    globalAssetManager = new ToxoidAssetManager();
  }
  return globalAssetManager;
}

/**
 * Initialize asset manager with custom memory limit
 */
export function initializeAssetManager(maxMemoryMB = 100): ToxoidAssetManager {
  if (globalAssetManager) {
    globalAssetManager.destroy();
  }
  globalAssetManager = new ToxoidAssetManager(maxMemoryMB);
  return globalAssetManager;
}

/**
 * Clean up global asset manager
 */
export function destroyAssetManager(): void {
  if (globalAssetManager) {
    globalAssetManager.destroy();
    globalAssetManager = null;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Load a sprite asset
 */
export async function loadSprite(path: string): Promise<AssetInfo> {
  return getAssetManager().loadAsset(path, 'sprite');
}

/**
 * Load an audio asset
 */
export async function loadAudio(path: string): Promise<AssetInfo> {
  return getAssetManager().loadAsset(path, 'audio');
}

/**
 * Load a script asset
 */
export async function loadScript(path: string): Promise<AssetInfo> {
  return getAssetManager().loadAsset(path, 'script');
}

/**
 * Preload common game assets
 */
export async function preloadGameAssets(): Promise<AssetInfo[]> {
  const commonAssets = [
    '/assets/toxoid/sprites/player.png',
    '/assets/toxoid/sprites/enemy.png',
    '/assets/toxoid/sprites/tileset.png',
    '/assets/toxoid/audio/jump.wav',
    '/assets/toxoid/audio/coin.wav',
    '/assets/toxoid/scripts/examples/movement.js',
  ];

  return getAssetManager().preloadAssets(commonAssets);
}

export default ToxoidAssetManager;