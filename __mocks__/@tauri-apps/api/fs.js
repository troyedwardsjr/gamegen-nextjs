/**
 * Mock implementation of @tauri-apps/api/fs
 * Provides Jest-compatible mock functions for Tauri filesystem API
 */

const mockReadTextFile = jest.fn();
const mockWriteTextFile = jest.fn();
const mockReadDir = jest.fn();

// Configure default behavior
mockReadTextFile.mockImplementation((path) => {
  return Promise.resolve('mock file content');
});

mockWriteTextFile.mockImplementation((path, content, options) => {
  return Promise.resolve();
});

mockReadDir.mockImplementation((path, options) => {
  return Promise.resolve([
    { name: 'file1.txt', path: '/path/to/file1.txt' },
    { name: 'file2.txt', path: '/path/to/file2.txt' }
  ]);
});

export const readTextFile = mockReadTextFile;
export const writeTextFile = mockWriteTextFile;
export const readDir = mockReadDir;

// Export as both named and default for compatibility
export default {
  readTextFile: mockReadTextFile,
  writeTextFile: mockWriteTextFile,
  readDir: mockReadDir
};