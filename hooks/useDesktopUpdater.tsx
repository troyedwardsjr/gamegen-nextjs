/**
 * React Hook for Desktop Auto-Updater Functionality
 * Provides auto-update functionality with progress tracking and event handling
 */

import { useState, useEffect, useCallback } from 'react';
import { DesktopAPI, type UpdateInfo } from '@/lib/desktop/api';

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

export default useDesktopUpdater;