/**
 * React Hook for Core Desktop Functionality
 * Provides desktop-specific features with graceful web fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DesktopAPI, type ExportOptions, type SystemInfo } from '@/lib/desktop/api';

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

export default useDesktop;