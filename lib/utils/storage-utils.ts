/**
 * Local and session storage utilities for GameGen platform
 * Safe storage operations with error handling and type safety
 */

// Types for storage operations
export interface StorageOptions {
  expires?: Date | number; // Expiration date or milliseconds from now
  prefix?: string; // Key prefix for namespacing
}

export interface StorageItem<T = any> {
  value: T;
  expires?: number;
  timestamp: number;
}

// Storage keys constants
export const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'gamegen_onboarding_progress',
  USER_PREFERENCES: 'gamegen_user_preferences',
  GAME_EDITOR_STATE: 'gamegen_editor_state',
  RECENT_GAMES: 'gamegen_recent_games',
  TUTORIAL_PROGRESS: 'gamegen_tutorial_progress',
  THEME_SETTINGS: 'gamegen_theme_settings',
  CANVAS_SETTINGS: 'gamegen_canvas_settings',
} as const;

// Check if storage is available
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage operations
export const localStorage = {
  // Get item from localStorage with type safety and expiration check
  getItem: <T = any>(key: string): T | null => {
    if (!isStorageAvailable('localStorage')) return null;
    
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return null;
      
      const parsed: StorageItem<T> = JSON.parse(item);
      
      // Check if item has expired
      if (parsed.expires && Date.now() > parsed.expires) {
        window.localStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error(`Failed to get localStorage item "${key}":`, error);
      return null;
    }
  },

  // Set item in localStorage with optional expiration
  setItem: <T = any>(key: string, value: T, options: StorageOptions = {}): boolean => {
    if (!isStorageAvailable('localStorage')) return false;
    
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
      };
      
      // Set expiration if provided
      if (options.expires) {
        if (typeof options.expires === 'number') {
          item.expires = Date.now() + options.expires;
        } else {
          item.expires = options.expires.getTime();
        }
      }
      
      const finalKey = options.prefix ? `${options.prefix}_${key}` : key;
      window.localStorage.setItem(finalKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  },

  // Remove item from localStorage
  removeItem: (key: string, prefix?: string): boolean => {
    if (!isStorageAvailable('localStorage')) return false;
    
    try {
      const finalKey = prefix ? `${prefix}_${key}` : key;
      window.localStorage.removeItem(finalKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  },

  // Clear all localStorage items (with optional prefix filter)
  clear: (prefix?: string): boolean => {
    if (!isStorageAvailable('localStorage')) return false;
    
    try {
      if (prefix) {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            window.localStorage.removeItem(key);
          }
        });
      } else {
        window.localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  },

  // Get all keys (with optional prefix filter)
  getKeys: (prefix?: string): string[] => {
    if (!isStorageAvailable('localStorage')) return [];
    
    try {
      const keys = Object.keys(window.localStorage);
      return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
    } catch (error) {
      console.error('Failed to get localStorage keys:', error);
      return [];
    }
  },

  // Get storage usage info
  getUsageInfo: (): { used: number; available: number; total: number } => {
    if (!isStorageAvailable('localStorage')) {
      return { used: 0, available: 0, total: 0 };
    }
    
    try {
      const total = 5 * 1024 * 1024; // Typical 5MB limit
      let used = 0;
      
      for (const key in window.localStorage) {
        used += window.localStorage[key].length + key.length;
      }
      
      return {
        used,
        available: total - used,
        total,
      };
    } catch (error) {
      console.error('Failed to get localStorage usage:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
};

// Safe sessionStorage operations (similar API to localStorage)
export const sessionStorage = {
  getItem: <T = any>(key: string): T | null => {
    if (!isStorageAvailable('sessionStorage')) return null;
    
    try {
      const item = window.sessionStorage.getItem(key);
      if (!item) return null;
      
      const parsed: StorageItem<T> = JSON.parse(item);
      
      // Check if item has expired
      if (parsed.expires && Date.now() > parsed.expires) {
        window.sessionStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error(`Failed to get sessionStorage item "${key}":`, error);
      return null;
    }
  },

  setItem: <T = any>(key: string, value: T, options: StorageOptions = {}): boolean => {
    if (!isStorageAvailable('sessionStorage')) return false;
    
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
      };
      
      if (options.expires) {
        if (typeof options.expires === 'number') {
          item.expires = Date.now() + options.expires;
        } else {
          item.expires = options.expires.getTime();
        }
      }
      
      const finalKey = options.prefix ? `${options.prefix}_${key}` : key;
      window.sessionStorage.setItem(finalKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error(`Failed to set sessionStorage item "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string, prefix?: string): boolean => {
    if (!isStorageAvailable('sessionStorage')) return false;
    
    try {
      const finalKey = prefix ? `${prefix}_${key}` : key;
      window.sessionStorage.removeItem(finalKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove sessionStorage item "${key}":`, error);
      return false;
    }
  },

  clear: (prefix?: string): boolean => {
    if (!isStorageAvailable('sessionStorage')) return false;
    
    try {
      if (prefix) {
        const keys = Object.keys(window.sessionStorage);
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            window.sessionStorage.removeItem(key);
          }
        });
      } else {
        window.sessionStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      return false;
    }
  }
};

// Specific storage utilities for GameGen features

// Onboarding progress storage
export const onboardingStorage = {
  getProgress: () => localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS),
  saveProgress: (progress: any) => localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, progress),
  clearProgress: () => localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS),
};

// User preferences storage
export const preferencesStorage = {
  getPreferences: () => localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
  savePreferences: (prefs: any) => localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, prefs),
  clearPreferences: () => localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
};

// Game editor state storage
export const editorStorage = {
  getState: () => sessionStorage.getItem(STORAGE_KEYS.GAME_EDITOR_STATE),
  saveState: (state: any) => sessionStorage.setItem(STORAGE_KEYS.GAME_EDITOR_STATE, state),
  clearState: () => sessionStorage.removeItem(STORAGE_KEYS.GAME_EDITOR_STATE),
};

// Recent games storage
export const recentGamesStorage = {
  getRecentGames: (): any[] => localStorage.getItem(STORAGE_KEYS.RECENT_GAMES) || [],
  addRecentGame: (game: any) => {
    const recent = recentGamesStorage.getRecentGames();
    const filtered = recent.filter((g: any) => g.id !== game.id);
    const updated = [game, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem(STORAGE_KEYS.RECENT_GAMES, updated);
  },
  clearRecentGames: () => localStorage.removeItem(STORAGE_KEYS.RECENT_GAMES),
};

// Canvas settings storage
export const canvasStorage = {
  getSettings: () => localStorage.getItem(STORAGE_KEYS.CANVAS_SETTINGS),
  saveSettings: (settings: any) => localStorage.setItem(STORAGE_KEYS.CANVAS_SETTINGS, settings),
  clearSettings: () => localStorage.removeItem(STORAGE_KEYS.CANVAS_SETTINGS),
};

// Storage cleanup utility - removes expired items
export const cleanupExpiredItems = (storageType: 'localStorage' | 'sessionStorage' = 'localStorage'): number => {
  if (!isStorageAvailable(storageType)) return 0;
  
  const storage = window[storageType];
  const keys = Object.keys(storage);
  let cleanedCount = 0;
  
  keys.forEach(key => {
    try {
      const item = storage.getItem(key);
      if (!item) return;
      
      const parsed: StorageItem = JSON.parse(item);
      if (parsed.expires && Date.now() > parsed.expires) {
        storage.removeItem(key);
        cleanedCount++;
      }
    } catch {
      // If we can't parse the item, it might be from an old format
      // We'll leave it alone to avoid breaking other code
    }
  });
  
  return cleanedCount;
};

// Auto-cleanup expired items on module load (if in browser)
if (typeof window !== 'undefined') {
  // Clean up expired items on page load
  setTimeout(() => {
    cleanupExpiredItems('localStorage');
    cleanupExpiredItems('sessionStorage');
  }, 1000);
}