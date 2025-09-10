/**
 * Mock implementation of @tauri-apps/api/dialog
 * Provides Jest-compatible mock functions for Tauri dialog API
 */

const mockOpen = jest.fn();
const mockSave = jest.fn();

// Configure default behavior
mockOpen.mockImplementation((options) => {
  if (options?.multiple) {
    return Promise.resolve(['/path/to/file1.txt', '/path/to/file2.txt']);
  }
  return Promise.resolve('/path/to/selected/file.txt');
});

mockSave.mockImplementation((options) => {
  return Promise.resolve('/path/to/saved/file.txt');
});

export const open = mockOpen;
export const save = mockSave;

// Export as both named and default for compatibility
export default {
  open: mockOpen,
  save: mockSave
};