/**
 * React Hook for Desktop Export Functionality
 * Provides game export functionality with progress tracking and format management
 */

import { useState, useEffect, useCallback } from 'react';
import { DesktopAPI, type ExportOptions } from '@/lib/desktop/api';

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

export default useDesktopExport;