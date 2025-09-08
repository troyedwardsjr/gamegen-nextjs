/**
 * Desktop API Wrapper for Tauri Commands
 * Provides a unified interface for desktop-specific functionality
 */

// Type definitions for desktop API
export interface ProjectFile {
  name: string;
  path: string;
  data: Record<string, any>;
  last_modified: string;
}

export interface ExportOptions {
  format: string;
  target_platform: string;
  optimization_level: string;
  include_assets: boolean;
  compress_assets: boolean;
  output_path?: string;
}

export interface ExportTask {
  id: string;
  project_id: string;
  format: string;
  status: string;
  progress: number;
}

export interface UpdateInfo {
  version: string;
  release_date: string;
  release_notes: string;
  download_url: string;
  size: number;
  signature: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percentage: number;
  speed: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  type: string;
}

// Check if running in Tauri desktop environment
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Lazy import Tauri API to avoid errors in web environments
const getTauriApi = async () => {
  if (!isDesktop()) {
    throw new Error('Desktop API is only available in Tauri desktop environment');
  }
  
  const { invoke } = await import('@tauri-apps/api/core');
  return { invoke };
};

/**
 * File Operations API
 */
export class FileOperationsAPI {
  static async openProjectFile(): Promise<ProjectFile | null> {
    if (!isDesktop()) return null;
    
    const { invoke } = await getTauriApi();
    return await invoke<ProjectFile | null>('open_project_file');
  }

  static async saveProjectFile(
    projectData: Record<string, any>,
    currentPath?: string
  ): Promise<string | null> {
    if (!isDesktop()) return null;
    
    const { invoke } = await getTauriApi();
    return await invoke<string | null>('save_project_file', {
      projectData,
      currentPath,
    });
  }

  static async exportProject(
    projectData: Record<string, any>,
    format: string
  ): Promise<string> {
    if (!isDesktop()) {
      throw new Error('Export functionality requires desktop environment');
    }
    
    const { invoke } = await getTauriApi();
    return await invoke<string>('export_project', {
      projectData,
      format,
    });
  }

  static async importAssets(): Promise<string[]> {
    if (!isDesktop()) return [];
    
    const { invoke } = await getTauriApi();
    return await invoke<string[]>('import_assets');
  }

  static async getRecentProjects(): Promise<Record<string, any>[]> {
    if (!isDesktop()) return [];
    
    const { invoke } = await getTauriApi();
    return await invoke<Record<string, any>[]>('get_recent_projects');
  }
}

/**
 * Game Export API
 */
export class GameExportAPI {
  static async exportGame(
    projectData: Record<string, any>,
    options: ExportOptions
  ): Promise<string> {
    if (!isDesktop()) {
      throw new Error('Game export requires desktop environment');
    }
    
    const { invoke } = await getTauriApi();
    return await invoke<string>('export_game', {
      projectData,
      options,
    });
  }

  static async getExportFormats(): Promise<string[]> {
    if (!isDesktop()) return ['html5', 'webgl', 'pwa'];
    
    const { invoke } = await getTauriApi();
    return await invoke<string[]>('get_export_formats');
  }

  static async getExportStatus(exportId: string): Promise<ExportTask | null> {
    if (!isDesktop()) return null;
    
    const { invoke } = await getTauriApi();
    return await invoke<ExportTask | null>('get_export_status', { exportId });
  }

  static async cancelExport(exportId: string): Promise<boolean> {
    if (!isDesktop()) return false;
    
    const { invoke } = await getTauriApi();
    return await invoke<boolean>('cancel_export', { exportId });
  }
}

/**
 * System Integration API
 */
export class SystemIntegrationAPI {
  static async showInFolder(path: string): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('show_in_folder', { path });
  }

  static async openExternalUrl(url: string): Promise<void> {
    if (!isDesktop()) {
      window.open(url, '_blank');
      return;
    }
    
    const { invoke } = await getTauriApi();
    await invoke('open_external_url', { url });
  }

  static async getSystemInfo(): Promise<SystemInfo> {
    if (!isDesktop()) {
      return {
        platform: 'web',
        arch: 'unknown',
        version: 'unknown',
        type: 'web',
      };
    }
    
    const { invoke } = await getTauriApi();
    return await invoke<SystemInfo>('get_system_info');
  }

  static async getAppDataPath(): Promise<string> {
    if (!isDesktop()) return '/tmp';
    
    const { invoke } = await getTauriApi();
    return await invoke<string>('get_app_data_path');
  }

  static async createDesktopShortcut(): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('create_desktop_shortcut');
  }

  static async setAutoLaunch(enabled: boolean): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('set_auto_launch', { enabled });
  }
}

/**
 * Desktop Features API
 */
export class DesktopFeaturesAPI {
  static async showNotification(
    title: string,
    body: string,
    icon?: string
  ): Promise<void> {
    if (!isDesktop()) {
      // Fallback to web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon });
      }
      return;
    }
    
    const { invoke } = await getTauriApi();
    await invoke('show_notification', { title, body, icon });
  }

  static async copyToClipboard(text: string): Promise<void> {
    if (!isDesktop()) {
      // Fallback to web clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      return;
    }
    
    const { invoke } = await getTauriApi();
    await invoke('copy_to_clipboard', { text });
  }

  static async pasteFromClipboard(): Promise<string> {
    if (!isDesktop()) {
      // Fallback to web clipboard API
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
      return '';
    }
    
    const { invoke } = await getTauriApi();
    return await invoke<string>('paste_from_clipboard');
  }

  static async setWindowAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('set_window_always_on_top', { alwaysOnTop });
  }

  static async minimizeToTray(): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('minimize_to_tray');
  }

  static async restoreFromTray(): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('restore_from_tray');
  }

  static async registerGlobalShortcut(
    shortcut: string,
    action: string
  ): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('register_global_shortcut', { shortcut, action });
  }

  static async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('unregister_global_shortcut', { shortcut });
  }
}

/**
 * Auto-Updater API
 */
export class UpdaterAPI {
  static async checkForUpdates(): Promise<boolean> {
    if (!isDesktop()) return false;
    
    const { invoke } = await getTauriApi();
    return await invoke<boolean>('check_for_updates');
  }

  static async installUpdate(): Promise<void> {
    if (!isDesktop()) return;
    
    const { invoke } = await getTauriApi();
    await invoke('install_update');
  }
}

/**
 * Desktop Event Listeners
 */
export class DesktopEventsAPI {
  private static listeners = new Map<string, Function[]>();

  static async listen(event: string, handler: Function): Promise<() => void> {
    if (!isDesktop()) {
      return () => {}; // No-op unsubscribe function
    }

    // Store handler for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);

    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen(event, handler);
    
    return () => {
      unlisten();
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  static async emit(event: string, payload?: any): Promise<void> {
    if (!isDesktop()) return;

    const { emit } = await import('@tauri-apps/api/event');
    await emit(event, payload);
  }

  static removeAllListeners(): void {
    this.listeners.clear();
  }
}

/**
 * Unified Desktop API
 * Main export combining all desktop APIs
 */
export const DesktopAPI = {
  isDesktop,
  files: FileOperationsAPI,
  export: GameExportAPI,
  system: SystemIntegrationAPI,
  features: DesktopFeaturesAPI,
  updater: UpdaterAPI,
  events: DesktopEventsAPI,
} as const;

export default DesktopAPI;