/**
 * Asset utility functions for GameGen platform
 */

import { 
  Asset, 
  AssetType, 
  AssetFormat, 
  AssetQuality, 
  AssetDimensions, 
  AssetSearchQuery,
  AssetRecommendation,
  AssetCollection,
} from "@/types/assets";

// File type detection
export const detectFileType = (file: File): AssetType | null => {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;

  // Image files
  if (mimeType.startsWith('image/') || isImageExtension(extension)) {
    if (file.name.toLowerCase().includes('tileset') || 
        file.name.toLowerCase().includes('tile')) {
      return 'tileset';
    }
    if (file.name.toLowerCase().includes('texture')) {
      return 'texture';
    }
    return 'sprite';
  }

  // Audio files
  if (mimeType.startsWith('audio/') || isAudioExtension(extension)) {
    // Classify as music if file is large or has music keywords
    if (file.size > 1024 * 1024 || // > 1MB
        file.name.toLowerCase().includes('music') ||
        file.name.toLowerCase().includes('bgm') ||
        file.name.toLowerCase().includes('soundtrack')) {
      return 'music';
    }
    return 'sound';
  }

  // Font files
  if (isFontExtension(extension)) return 'font';

  // Shader files
  if (isShaderExtension(extension)) return 'shader';

  // 3D model files
  if (isModelExtension(extension)) return 'model';

  // Animation files
  if (isAnimationExtension(extension)) return 'animation';

  // Script files
  if (isScriptExtension(extension)) return 'script';

  // Data files
  if (isDataExtension(extension)) return 'data';

  return null;
};

export const detectFileFormat = (fileName: string): AssetFormat | null => {
  const extension = getFileExtension(fileName).toLowerCase();
  
  const formatMap: Record<string, AssetFormat> = {
    // Images
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    webp: 'webp',
    svg: 'svg',
    gif: 'gif',
    
    // Audio
    wav: 'wav',
    mp3: 'mp3',
    ogg: 'ogg',
    flac: 'flac',
    
    // Data
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    
    // Shaders
    glsl: 'glsl',
    hlsl: 'hlsl',
    
    // 3D Models
    fbx: 'fbx',
    obj: 'obj',
    gltf: 'gltf',
    glb: 'gltf',
    
    // Fonts
    ttf: 'ttf',
    otf: 'otf',
    woff: 'woff',
    woff2: 'woff',
    
    // Scripts
    js: 'js',
    ts: 'ts',
    lua: 'lua',
    py: 'py',
  };

  return formatMap[extension] || null;
};

// File extension helpers
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

export const isImageExtension = (ext: string): boolean => {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tiff'].includes(ext.toLowerCase());
};

export const isAudioExtension = (ext: string): boolean => {
  return ['wav', 'mp3', 'ogg', 'flac', 'aac', 'm4a'].includes(ext.toLowerCase());
};

export const isFontExtension = (ext: string): boolean => {
  return ['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext.toLowerCase());
};

export const isShaderExtension = (ext: string): boolean => {
  return ['glsl', 'hlsl', 'vert', 'frag', 'shader'].includes(ext.toLowerCase());
};

export const isModelExtension = (ext: string): boolean => {
  return ['fbx', 'obj', 'gltf', 'glb', 'dae', '3ds', 'blend'].includes(ext.toLowerCase());
};

export const isAnimationExtension = (ext: string): boolean => {
  return ['anim', 'fbx', 'bvh', 'dae'].includes(ext.toLowerCase());
};

export const isScriptExtension = (ext: string): boolean => {
  return ['js', 'ts', 'lua', 'py', 'cs', 'cpp', 'h'].includes(ext.toLowerCase());
};

export const isDataExtension = (ext: string): boolean => {
  return ['json', 'xml', 'yaml', 'yml', 'csv', 'txt', 'ini', 'cfg'].includes(ext.toLowerCase());
};

// File size formatting
export const formatFileSize = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

// Dimension formatting
export const formatDimensions = (dimensions?: AssetDimensions): string => {
  if (!dimensions) return '';
  
  const { width, height, frames, duration } = dimensions;
  
  let result = `${width}×${height}`;
  
  if (frames) {
    result += ` (${frames} frames)`;
  }
  
  if (duration) {
    result += ` (${Math.round(duration)}s)`;
  }
  
  return result;
};

// Date formatting
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months}mo ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years}y ago`;
  }
};

// Quality assessment
export const assessImageQuality = (
  dimensions: AssetDimensions, 
  fileSize: number,
  format: AssetFormat
): AssetQuality => {
  if (!dimensions.width || !dimensions.height) return 'low';
  
  const pixels = dimensions.width * dimensions.height;
  const bitsPerPixel = (fileSize * 8) / pixels;
  
  // Quality thresholds based on format and compression
  let qualityThresholds = { low: 1, medium: 4, high: 8, ultra: 16 };
  
  if (format === 'jpg') {
    qualityThresholds = { low: 0.5, medium: 2, high: 4, ultra: 8 };
  } else if (format === 'webp') {
    qualityThresholds = { low: 0.8, medium: 3, high: 6, ultra: 12 };
  }
  
  if (bitsPerPixel >= qualityThresholds.ultra) return 'ultra';
  if (bitsPerPixel >= qualityThresholds.high) return 'high';
  if (bitsPerPixel >= qualityThresholds.medium) return 'medium';
  return 'low';
};

// Asset validation
export const validateAssetName = (name: string): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Asset name is required' };
  }
  
  if (name.length > 255) {
    return { valid: false, error: 'Asset name must be less than 255 characters' };
  }
  
  if (!/^[a-zA-Z0-9._\-\s]+$/.test(name)) {
    return { valid: false, error: 'Asset name contains invalid characters' };
  }
  
  return { valid: true };
};

export const validateAssetTags = (tags: string[]): { valid: boolean; error?: string } => {
  if (tags.length > 20) {
    return { valid: false, error: 'Maximum 20 tags allowed' };
  }
  
  for (const tag of tags) {
    if (tag.length > 50) {
      return { valid: false, error: 'Tag must be less than 50 characters' };
    }
    
    if (!/^[a-zA-Z0-9_\-]+$/.test(tag)) {
      return { valid: false, error: 'Tags can only contain letters, numbers, hyphens, and underscores' };
    }
  }
  
  return { valid: true };
};

// Search utilities
export const buildSearchQuery = (
  text?: string,
  filters?: Record<string, any>
): AssetSearchQuery => {
  const query: AssetSearchQuery = {};
  
  if (text?.trim()) {
    query.text = text.trim();
  }
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        switch (key) {
          case 'types':
            if (Array.isArray(value) && value.length > 0) {
              query.types = value;
            }
            break;
          case 'sources':
            if (Array.isArray(value) && value.length > 0) {
              query.sources = value;
            }
            break;
          case 'quality':
            if (Array.isArray(value) && value.length > 0) {
              query.quality = value;
            }
            break;
          case 'tags':
            if (Array.isArray(value) && value.length > 0) {
              query.tags = value;
            }
            break;
          case 'dateRange':
            if (value.from || value.to) {
              query.dateRange = value;
            }
            break;
          case 'sizeRange':
            if (value.min !== undefined || value.max !== undefined) {
              query.sizeRange = value;
            }
            break;
        }
      }
    });
  }
  
  return query;
};

export const extractSearchTerms = (text: string): string[] => {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)
    .map(term => term.replace(/[^\w]/g, ''))
    .filter(term => term.length > 0);
};

// Asset organization
export const groupAssetsByType = (assets: Asset[]): Record<AssetType, Asset[]> => {
  return assets.reduce((groups, asset) => {
    if (!groups[asset.type]) {
      groups[asset.type] = [];
    }
    groups[asset.type].push(asset);
    return groups;
  }, {} as Record<AssetType, Asset[]>);
};

export const groupAssetsByCollection = (assets: Asset[], collections: AssetCollection[]): Record<string, Asset[]> => {
  const groups: Record<string, Asset[]> = {};
  
  collections.forEach(collection => {
    groups[collection.name] = assets.filter(asset => 
      asset.collections.includes(collection.id)
    );
  });
  
  return groups;
};

export const sortAssets = (assets: Asset[], sortBy: string, order: 'asc' | 'desc' = 'desc'): Asset[] => {
  return [...assets].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      case 'created':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case 'modified':
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
        break;
      case 'usage':
        aValue = a.usage.usageCount;
        bValue = b.usage.usageCount;
        break;
      case 'quality':
        const qualityOrder = { low: 1, medium: 2, high: 3, ultra: 4 };
        aValue = qualityOrder[a.quality];
        bValue = qualityOrder[b.quality];
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string') {
      return order === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    } else {
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    }
  });
};

// Asset filtering
export const filterAssets = (assets: Asset[], filters: Record<string, any>): Asset[] => {
  return assets.filter(asset => {
    // Type filter
    if (filters.types?.length && !filters.types.includes(asset.type)) {
      return false;
    }
    
    // Source filter
    if (filters.sources?.length && !filters.sources.includes(asset.source)) {
      return false;
    }
    
    // Quality filter
    if (filters.quality?.length && !filters.quality.includes(asset.quality)) {
      return false;
    }
    
    // Tags filter
    if (filters.tags?.length && !filters.tags.some((tag: string) => asset.tags.includes(tag))) {
      return false;
    }
    
    // Size filter
    if (filters.sizeRange) {
      if (filters.sizeRange.min && asset.size < filters.sizeRange.min) return false;
      if (filters.sizeRange.max && asset.size > filters.sizeRange.max) return false;
    }
    
    // Usage filter
    if (filters.usage?.inUse !== undefined) {
      const isInUse = asset.status === 'in_use';
      if (isInUse !== filters.usage.inUse) return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const createdAt = asset.createdAt.getTime();
      if (filters.dateRange.from && createdAt < filters.dateRange.from.getTime()) return false;
      if (filters.dateRange.to && createdAt > filters.dateRange.to.getTime()) return false;
    }
    
    return true;
  });
};

// Recommendation utilities
export const calculateAssetSimilarity = (asset1: Asset, asset2: Asset): number => {
  let similarity = 0;
  let factors = 0;
  
  // Type similarity (exact match)
  if (asset1.type === asset2.type) {
    similarity += 0.3;
  }
  factors += 0.3;
  
  // Tag similarity
  const commonTags = asset1.tags.filter(tag => asset2.tags.includes(tag));
  const tagSimilarity = commonTags.length / Math.max(asset1.tags.length, asset2.tags.length, 1);
  similarity += tagSimilarity * 0.25;
  factors += 0.25;
  
  // Quality similarity
  const qualityOrder = { low: 1, medium: 2, high: 3, ultra: 4 };
  const qualityDiff = Math.abs(qualityOrder[asset1.quality] - qualityOrder[asset2.quality]);
  const qualitySimilarity = 1 - (qualityDiff / 3);
  similarity += qualitySimilarity * 0.15;
  factors += 0.15;
  
  // Size similarity (within same order of magnitude)
  const sizeDiff = Math.abs(Math.log10(asset1.size) - Math.log10(asset2.size));
  const sizeSimilarity = Math.max(0, 1 - sizeDiff / 3);
  similarity += sizeSimilarity * 0.1;
  factors += 0.1;
  
  // Collection similarity
  const commonCollections = asset1.collections.filter(col => asset2.collections.includes(col));
  const collectionSimilarity = commonCollections.length / Math.max(asset1.collections.length, asset2.collections.length, 1);
  similarity += collectionSimilarity * 0.2;
  factors += 0.2;
  
  return similarity / factors;
};

export const generateAssetRecommendations = (
  targetAsset: Asset,
  availableAssets: Asset[],
  maxRecommendations: number = 5
): AssetRecommendation[] => {
  return availableAssets
    .filter(asset => asset.id !== targetAsset.id)
    .map(asset => {
      const similarity = calculateAssetSimilarity(targetAsset, asset);
      const score = Math.round(similarity * 100);
      
      let type: AssetRecommendation['type'] = 'similar';
      let reason = 'Similar to your current selection';
      
      if (asset.type !== targetAsset.type) {
        type = 'complementary';
        reason = `Complements your ${targetAsset.type} asset`;
      }
      
      if (similarity > 0.8) {
        reason = 'Very similar style and properties';
      } else if (similarity > 0.6) {
        reason = 'Good match for your current theme';
      }
      
      return {
        assetId: asset.id,
        score,
        reason,
        tags: asset.tags,
        similarity,
        type,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Image processing utilities
export const createImageThumbnail = (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth, newHeight;
      if (width > height) {
        newWidth = Math.min(maxWidth, width);
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = Math.min(maxHeight, height);
        newWidth = newHeight * aspectRatio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const getImageDimensions = (file: File): Promise<AssetDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Color palette extraction
export const extractColorPalette = (
  imageData: ImageData,
  maxColors: number = 8
): string[] => {
  const data = imageData.data;
  const colorMap = new Map<string, number>();
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce palette size
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    
    const color = `rgb(${quantizedR},${quantizedG},${quantizedB})`;
    colorMap.set(color, (colorMap.get(color) || 0) + 1);
  }
  
  // Sort by frequency and return top colors as hex
  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color]) => {
      const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
      return '#000000';
    });
};