/**
 * Mock implementation of @tauri-apps/api/os
 * Provides Jest-compatible mock functions for Tauri OS API
 */

const mockPlatform = jest.fn();
const mockArch = jest.fn();
const mockVersion = jest.fn();

// Configure default behavior
mockPlatform.mockImplementation(() => Promise.resolve('linux'));
mockArch.mockImplementation(() => Promise.resolve('x86_64'));
mockVersion.mockImplementation(() => Promise.resolve('1.0.0'));

export const platform = mockPlatform;
export const arch = mockArch;
export const version = mockVersion;

// Export as both named and default for compatibility
export default {
  platform: mockPlatform,
  arch: mockArch,
  version: mockVersion
};