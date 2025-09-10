/**
 * Mock implementation of @tauri-apps/api/shell
 * Provides Jest-compatible mock functions for Tauri shell API
 */

const mockOpen = jest.fn();

// Configure default behavior
mockOpen.mockImplementation((url) => {
  return Promise.resolve();
});

export const open = mockOpen;

// Export as both named and default for compatibility
export default {
  open: mockOpen
};