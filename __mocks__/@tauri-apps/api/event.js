/**
 * Mock implementation of @tauri-apps/api/event
 * Provides Jest-compatible mock functions for Tauri event API
 */

const mockListen = jest.fn();
const mockEmit = jest.fn();
const mockUnlisten = jest.fn();

// Configure default behavior
mockListen.mockImplementation((event, handler) => {
  // Return a promise that resolves to an unlisten function
  return Promise.resolve(mockUnlisten);
});

mockEmit.mockImplementation((event, payload) => {
  return Promise.resolve();
});

mockUnlisten.mockImplementation(() => {
  // Mock implementation for unlisten function
});

export const listen = mockListen;
export const emit = mockEmit;

// Export as both named and default for compatibility
export default {
  listen: mockListen,
  emit: mockEmit
};