/**
 * Mock implementation of @tauri-apps/api/notification
 * Provides Jest-compatible mock functions for Tauri notification API
 */

const mockSendNotification = jest.fn();

// Configure default behavior
mockSendNotification.mockImplementation((options) => {
  return Promise.resolve();
});

export const sendNotification = mockSendNotification;

// Export as both named and default for compatibility
export default {
  sendNotification: mockSendNotification
};