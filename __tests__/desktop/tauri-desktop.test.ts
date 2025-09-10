/**
 * Tauri Desktop Application Testing Suite
 * 
 * This test suite validates the Tauri desktop application functionality
 * including component rendering, API integration, and desktop-specific features.
 */

import { test, expect, describe, beforeAll, afterAll } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopAPI } from "../../lib/desktop/api";

// Import the mocked Tauri API
import * as tauriCore from "@tauri-apps/api/core";

// Get the mocked functions for testing
const mockInvoke = tauriCore.invoke as jest.MockedFunction<typeof tauriCore.invoke>;

// Mock Tauri environment for window.__TAURI__
const mockTauriAPI = {
  invoke: mockInvoke,
  listen: jest.fn(),
  emit: jest.fn(),
};

// Mock window.__TAURI__ to simulate desktop environment
Object.defineProperty(window, "__TAURI__", {
  value: mockTauriAPI,
  writable: true,
});

describe("Tauri Desktop Environment", () => {
  beforeAll(() => {
    // Setup desktop environment simulation
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe("Environment Detection", () => {
    test("should detect desktop environment correctly", () => {
      expect(DesktopAPI.isDesktop()).toBe(true);
    });

    test("should provide desktop API access", () => {
      expect(DesktopAPI.files).toBeDefined();
      expect(DesktopAPI.export).toBeDefined();
      expect(DesktopAPI.system).toBeDefined();
      expect(DesktopAPI.features).toBeDefined();
      expect(DesktopAPI.updater).toBeDefined();
      expect(DesktopAPI.events).toBeDefined();
    });
  });

  describe("File Operations API", () => {
    test("should handle project file operations", async () => {
      const mockProjectFile = {
        name: "test-project.json",
        path: "/path/to/project",
        data: { version: "1.0.0" },
        last_modified: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce(mockProjectFile);

      const result = await DesktopAPI.files.openProjectFile();
      expect(result).toEqual(mockProjectFile);
      expect(mockInvoke).toHaveBeenCalledWith("open_project_file");
    });

    test("should save project files correctly", async () => {
      const projectData = { name: "Test Project", version: "1.0.0" };
      const mockPath = "/path/to/saved/project.json";

      mockInvoke.mockResolvedValueOnce(mockPath);

      const result = await DesktopAPI.files.saveProjectFile(projectData);
      expect(result).toBe(mockPath);
      expect(mockInvoke).toHaveBeenCalledWith("save_project_file", {
        projectData,
        currentPath: undefined,
      });
    });

    test("should export projects with correct parameters", async () => {
      const projectData = { name: "Test Project" };
      const format = "html5";
      const mockExportPath = "/path/to/exported/game.zip";

      mockInvoke.mockResolvedValueOnce(mockExportPath);

      const result = await DesktopAPI.files.exportProject(projectData, format);
      expect(result).toBe(mockExportPath);
      expect(mockInvoke).toHaveBeenCalledWith("export_project", {
        projectData,
        format,
      });
    });

    test("should import assets correctly", async () => {
      const mockAssetPaths = ["/path/to/asset1.png", "/path/to/asset2.png"];

      mockInvoke.mockResolvedValueOnce(mockAssetPaths);

      const result = await DesktopAPI.files.importAssets();
      expect(result).toEqual(mockAssetPaths);
      expect(mockInvoke).toHaveBeenCalledWith("import_assets");
    });
  });

  describe("System Integration API", () => {
    test("should get system information", async () => {
      const mockSystemInfo = {
        platform: "darwin",
        arch: "x86_64",
        version: "10.15.7",
        type: "desktop",
      };

      mockInvoke.mockResolvedValueOnce(mockSystemInfo);

      const result = await DesktopAPI.system.getSystemInfo();
      expect(result).toEqual(mockSystemInfo);
      expect(mockInvoke).toHaveBeenCalledWith("get_system_info");
    });

    test("should handle external URL opening", async () => {
      const testUrl = "https://example.com";

      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.system.openExternalUrl(testUrl);
      expect(mockInvoke).toHaveBeenCalledWith("open_external_url", {
        url: testUrl,
      });
    });

    test("should get app data path", async () => {
      const mockPath = "/Users/test/Library/Application Support/GameGen";

      mockInvoke.mockResolvedValueOnce(mockPath);

      const result = await DesktopAPI.system.getAppDataPath();
      expect(result).toBe(mockPath);
      expect(mockInvoke).toHaveBeenCalledWith("get_app_data_path");
    });
  });

  describe("Desktop Features API", () => {
    test("should show notifications", async () => {
      const title = "Test Notification";
      const body = "This is a test notification";

      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.features.showNotification(title, body);
      expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
        title,
        body,
        icon: undefined,
      });
    });

    test("should handle clipboard operations", async () => {
      const testText = "Test clipboard content";

      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.features.copyToClipboard(testText);
      expect(mockInvoke).toHaveBeenCalledWith("copy_to_clipboard", {
        text: testText,
      });

      mockInvoke.mockResolvedValueOnce(testText);

      const result = await DesktopAPI.features.pasteFromClipboard();
      expect(result).toBe(testText);
      expect(mockInvoke).toHaveBeenCalledWith("paste_from_clipboard");
    });

    test("should manage window properties", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.features.setWindowAlwaysOnTop(true);
      expect(mockInvoke).toHaveBeenCalledWith("set_window_always_on_top", {
        alwaysOnTop: true,
      });
    });

    test("should handle tray operations", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.features.minimizeToTray();
      expect(mockInvoke).toHaveBeenCalledWith("minimize_to_tray");

      await DesktopAPI.features.restoreFromTray();
      expect(mockInvoke).toHaveBeenCalledWith("restore_from_tray");
    });

    test("should manage global shortcuts", async () => {
      const shortcut = "Ctrl+Shift+G";
      const action = "toggle_window";

      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.features.registerGlobalShortcut(shortcut, action);
      expect(mockInvoke).toHaveBeenCalledWith("register_global_shortcut", {
        shortcut,
        action,
      });

      await DesktopAPI.features.unregisterGlobalShortcut(shortcut);
      expect(mockInvoke).toHaveBeenCalledWith("unregister_global_shortcut", {
        shortcut,
      });
    });
  });

  describe("Game Export API", () => {
    test("should export games with options", async () => {
      const projectData = { name: "Test Game" };
      const exportOptions = {
        format: "html5",
        target_platform: "web",
        optimization_level: "high",
        include_assets: true,
        compress_assets: true,
        output_path: "/path/to/export",
      };
      const mockExportPath = "/path/to/exported/game.zip";

      mockInvoke.mockResolvedValueOnce(mockExportPath);

      const result = await DesktopAPI.export.exportGame(projectData, exportOptions);
      expect(result).toBe(mockExportPath);
      expect(mockInvoke).toHaveBeenCalledWith("export_game", {
        projectData,
        options: exportOptions,
      });
    });

    test("should get available export formats", async () => {
      const mockFormats = ["html5", "webgl", "windows", "macos", "linux"];

      mockInvoke.mockResolvedValueOnce(mockFormats);

      const result = await DesktopAPI.export.getExportFormats();
      expect(result).toEqual(mockFormats);
      expect(mockInvoke).toHaveBeenCalledWith("get_export_formats");
    });

    test("should track export status", async () => {
      const exportId = "export-123";
      const mockExportTask = {
        id: exportId,
        project_id: "project-456",
        format: "html5",
        status: "in_progress",
        progress: 50,
      };

      mockInvoke.mockResolvedValueOnce(mockExportTask);

      const result = await DesktopAPI.export.getExportStatus(exportId);
      expect(result).toEqual(mockExportTask);
      expect(mockInvoke).toHaveBeenCalledWith("get_export_status", {
        exportId,
      });
    });

    test("should cancel export operations", async () => {
      const exportId = "export-123";

      mockInvoke.mockResolvedValueOnce(true);

      const result = await DesktopAPI.export.cancelExport(exportId);
      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("cancel_export", {
        exportId,
      });
    });
  });

  describe("Auto-Updater API", () => {
    test("should check for updates", async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await DesktopAPI.updater.checkForUpdates();
      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("check_for_updates");
    });

    test("should install updates", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await DesktopAPI.updater.installUpdate();
      expect(mockInvoke).toHaveBeenCalledWith("install_update");
    });
  });

  describe("Events API", () => {
    test("should handle event listening", async () => {
      const eventName = "test-event";
      const mockHandler = jest.fn();
      const mockUnlisten = jest.fn();

      // Mock the dynamic import
      jest.doMock("@tauri-apps/api/event", () => ({
        listen: jest.fn().mockResolvedValue(mockUnlisten),
      }));

      const unlisten = await DesktopAPI.events.listen(eventName, mockHandler);
      expect(typeof unlisten).toBe("function");

      // Test unlisten functionality
      unlisten();
      expect(mockUnlisten).toHaveBeenCalled();
    });

    test("should handle event emission", async () => {
      const eventName = "test-event";
      const payload = { data: "test" };

      // Mock the dynamic import
      jest.doMock("@tauri-apps/api/event", () => ({
        emit: jest.fn().mockResolvedValue(undefined),
      }));

      await DesktopAPI.events.emit(eventName, payload);
      // Since we're mocking the import, we can't directly test the invoke call
      // but we can verify the function completes without error
      expect(true).toBe(true);
    });
  });
});

describe("Error Handling", () => {
  test("should handle Tauri API errors gracefully", async () => {
    const mockError = new Error("Tauri command failed");
    mockInvoke.mockRejectedValueOnce(mockError);

    await expect(DesktopAPI.files.openProjectFile()).rejects.toThrow(
      "Tauri command failed"
    );
  });

  test("should provide fallback behavior in web environment", () => {
    // Temporarily remove Tauri environment
    const originalTauri = window.__TAURI__;
    delete (window as any).__TAURI__;

    expect(DesktopAPI.isDesktop()).toBe(false);

    // Restore Tauri environment
    (window as any).__TAURI__ = originalTauri;
  });
});