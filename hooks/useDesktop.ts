/**
 * React Hook for Desktop Functionality
 * Provides desktop-specific features with graceful web fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DesktopAPI, type ExportOptions, type UpdateInfo, type SystemInfo } from '@/lib/desktop/api';

interface UseDesktopReturn {
  isDesktop: boolean;
  systemInfo: SystemInfo | null;
  openProjectFile: () => Promise<any>;
  saveProjectFile: (data: any, path?: string) => Promise<string | null>;
  exportGame: (data: any, options: ExportOptions) => Promise<string | null>;
  importAssets: () => Promise<string[]>;
  showNotification: (title: string, body: string, icon?: string) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  pasteFromClipboard: () => Promise<string>;
  showInFolder: (path: string) => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  setWindowAlwaysOnTop: (enabled: boolean) => Promise<void>;
  minimizeToTray: () => Promise<void>;
  restoreFromTray: () => Promise<void>;
  createDesktopShortcut: () => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
}

export const useDesktop = (): UseDesktopReturn => {
  const [isDesktop] = useState(() => DesktopAPI.isDesktop());
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const eventListenersRef = useRef<(() => void)[]>([]);

  // Initialize system info on mount
  useEffect(() => {
    if (isDesktop) {
      DesktopAPI.system.getSystemInfo().then(setSystemInfo).catch(console.error);
    }
  }, [isDesktop]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach(unlisten => unlisten());
      eventListenersRef.current = [];
      DesktopAPI.events.removeAllListeners();
    };
  }, []);

  const openProjectFile = useCallback(async () => {
    try {
      return await DesktopAPI.files.openProjectFile();
    } catch (error) {
      console.error('Failed to open project file:', error);
      return null;
    }
  }, []);

  const saveProjectFile = useCallback(async (data: any, path?: string) => {
    try {
      return await DesktopAPI.files.saveProjectFile(data, path);
    } catch (error) {
      console.error('Failed to save project file:', error);
      return null;
    }
  }, []);

  const exportGame = useCallback(async (data: any, options: ExportOptions) => {
    try {
      return await DesktopAPI.export.exportGame(data, options);
    } catch (error) {
      console.error('Failed to export game:', error);
      return null;
    }
  }, []);

  const importAssets = useCallback(async () => {
    try {
      return await DesktopAPI.files.importAssets();
    } catch (error) {
      console.error('Failed to import assets:', error);
      return [];
    }
  }, []);

  const showNotification = useCallback(async (title: string, body: string, icon?: string) => {
    try {
      await DesktopAPI.features.showNotification(title, body, icon);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await DesktopAPI.features.copyToClipboard(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      return await DesktopAPI.features.pasteFromClipboard();
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      return '';
    }
  }, []);

  const showInFolder = useCallback(async (path: string) => {
    try {
      await DesktopAPI.system.showInFolder(path);
    } catch (error) {
      console.error('Failed to show in folder:', error);
    }
  }, []);

  const openExternalUrl = useCallback(async (url: string) => {
    try {
      await DesktopAPI.system.openExternalUrl(url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      return await DesktopAPI.updater.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      await DesktopAPI.updater.installUpdate();
    } catch (error) {
      console.error('Failed to install update:', error);
    }
  }, []);

  const setWindowAlwaysOnTop = useCallback(async (enabled: boolean) => {
    try {
      await DesktopAPI.features.setWindowAlwaysOnTop(enabled);
    } catch (error) {
      console.error('Failed to set always on top:', error);
    }
  }, []);

  const minimizeToTray = useCallback(async () => {
    try {
      await DesktopAPI.features.minimizeToTray();
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  }, []);

  const restoreFromTray = useCallback(async () => {
    try {
      await DesktopAPI.features.restoreFromTray();
    } catch (error) {
      console.error('Failed to restore from tray:', error);
    }
  }, []);

  const createDesktopShortcut = useCallback(async () => {
    try {
      await DesktopAPI.system.createDesktopShortcut();
    } catch (error) {
      console.error('Failed to create desktop shortcut:', error);
    }
  }, []);

  const setAutoLaunch = useCallback(async (enabled: boolean) => {
    try {
      await DesktopAPI.system.setAutoLaunch(enabled);
    } catch (error) {
      console.error('Failed to set auto launch:', error);
    }
  }, []);

  return {
    isDesktop,
    systemInfo,
    openProjectFile,
    saveProjectFile,
    exportGame,
    importAssets,
    showNotification,
    copyToClipboard,
    pasteFromClipboard,
    showInFolder,
    openExternalUrl,
    checkForUpdates,
    installUpdate,
    setWindowAlwaysOnTop,
    minimizeToTray,
    restoreFromTray,
    createDesktopShortcut,
    setAutoLaunch,
  };
};

/**
 * Hook for managing desktop export functionality
 */
interface UseDesktopExportReturn {
  exportFormats: string[];
  isExporting: boolean;
  exportProgress: number;
  exportGame: (data: any, options: ExportOptions) => Promise<string | null>;
  cancelExport: (exportId: string) => Promise<boolean>;
  getExportStatus: (exportId: string) => Promise<any>;
}

export const useDesktopExport = (): UseDesktopExportReturn => {
  const [exportFormats, setExportFormats] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (DesktopAPI.isDesktop()) {
      DesktopAPI.export.getExportFormats().then(setExportFormats).catch(console.error);
    } else {
      // Web fallback formats
      setExportFormats(['html5', 'webgl', 'pwa']);
    }
  }, []);

  const exportGame = useCallback(async (data: any, options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportId = await DesktopAPI.export.exportGame(data, options);
      
      // Set up progress monitoring if desktop
      if (DesktopAPI.isDesktop() && exportId) {
        const progressInterval = setInterval(async () => {
          try {
            const status = await DesktopAPI.export.getExportStatus(exportId);
            if (status) {
              setExportProgress(status.progress);
              if (status.status === 'completed' || status.status === 'failed') {
                clearInterval(progressInterval);
                setIsExporting(false);
                if (status.status === 'completed') {
                  setExportProgress(100);
                }
              }
            }
          } catch (error) {
            console.error('Failed to get export status:', error);
            clearInterval(progressInterval);
            setIsExporting(false);
          }
        }, 1000);
      }

      return exportId;
    } catch (error) {
      console.error('Failed to start export:', error);
      setIsExporting(false);
      return null;
    }
  }, []);

  const cancelExport = useCallback(async (exportId: string) => {
    try {
      const cancelled = await DesktopAPI.export.cancelExport(exportId);
      if (cancelled) {
        setIsExporting(false);
        setExportProgress(0);
      }
      return cancelled;
    } catch (error) {
      console.error('Failed to cancel export:', error);
      return false;
    }
  }, []);

  const getExportStatus = useCallback(async (exportId: string) => {
    try {
      return await DesktopAPI.export.getExportStatus(exportId);
    } catch (error) {
      console.error('Failed to get export status:', error);
      return null;
    }
  }, []);

  return {
    exportFormats,
    isExporting,
    exportProgress,
    exportGame,
    cancelExport,
    getExportStatus,
  };
};

/**
 * Hook for managing desktop update functionality
 */
interface UseDesktopUpdaterReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  isUpdating: boolean;
  updateProgress: number;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

export const useDesktopUpdater = (): UseDesktopUpdaterReturn => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Listen for update events
  useEffect(() => {
    if (!DesktopAPI.isDesktop()) return;

    const setupEventListeners = async () => {
      const unlistenUpdateAvailable = await DesktopAPI.events.listen(
        'update_available',
        (event: any) => {
          setUpdateAvailable(true);
          setUpdateInfo(event.payload);
        }
      );

      const unlistenUpdateProgress = await DesktopAPI.events.listen(
        'update_progress',
        (event: any) => {
          setUpdateProgress(event.payload.percentage);
        }
      );

      const unlistenUpdateReady = await DesktopAPI.events.listen(
        'update_ready',
        () => {
          setIsUpdating(false);
          setUpdateProgress(100);
        }
      );

      const unlistenUpdateCompleted = await DesktopAPI.events.listen(
        'update_completed',
        () => {
          setUpdateAvailable(false);
          setUpdateInfo(null);
          setIsUpdating(false);
          setUpdateProgress(0);
        }
      );

      return () => {
        unlistenUpdateAvailable();
        unlistenUpdateProgress();
        unlistenUpdateReady();
        unlistenUpdateCompleted();
      };
    };

    setupEventListeners();
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      const hasUpdate = await DesktopAPI.updater.checkForUpdates();
      setUpdateAvailable(hasUpdate);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      await DesktopAPI.updater.installUpdate();
    } catch (error) {
      console.error('Failed to install update:', error);
      setIsUpdating(false);
    }
  }, []);

  return {
    updateAvailable,
    updateInfo,
    isUpdating,
    updateProgress,
    checkForUpdates,
    installUpdate,
  };
};

export default useDesktop;