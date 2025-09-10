/**
 * Mock implementation of @tauri-apps/api/core
 * Provides Jest-compatible mock functions for Tauri core API
 */

const mockInvoke = jest.fn();

// Configure default behavior
mockInvoke.mockImplementation((command, args) => {
  // Default successful responses for common commands
  const responses = {
    'get_system_info': Promise.resolve({
      platform: 'linux',
      arch: 'x86_64', 
      version: '1.0.0',
      type: 'desktop'
    }),
    'open_project_file': Promise.resolve({
      name: 'test-project.json',
      path: '/path/to/project',
      data: { version: '1.0.0' },
      last_modified: new Date().toISOString()
    }),
    'save_project_file': Promise.resolve('/path/to/saved/project.json'),
    'export_project': Promise.resolve('/path/to/exported/game.zip'),
    'import_assets': Promise.resolve(['/path/to/asset1.png', '/path/to/asset2.png']),
    'show_notification': Promise.resolve(),
    'copy_to_clipboard': Promise.resolve(),
    'paste_from_clipboard': Promise.resolve('clipboard content'),
    'set_window_always_on_top': Promise.resolve(),
    'minimize_to_tray': Promise.resolve(),
    'restore_from_tray': Promise.resolve(),
    'register_global_shortcut': Promise.resolve(),
    'unregister_global_shortcut': Promise.resolve(),
    'export_game': Promise.resolve('/path/to/exported/game.zip'),
    'get_export_formats': Promise.resolve(['html5', 'webgl', 'windows', 'macos', 'linux']),
    'get_export_status': Promise.resolve({
      id: 'export-123',
      project_id: 'project-456',
      format: 'html5',
      status: 'in_progress',
      progress: 50
    }),
    'cancel_export': Promise.resolve(true),
    'check_for_updates': Promise.resolve(true),
    'install_update': Promise.resolve(),
    'open_external_url': Promise.resolve(),
    'get_app_data_path': Promise.resolve('/Users/test/Library/Application Support/GameGen'),
    'show_in_folder': Promise.resolve(),
    'create_desktop_shortcut': Promise.resolve(),
    'set_auto_launch': Promise.resolve()
  };

  return responses[command] || Promise.resolve();
});

export const invoke = mockInvoke;

// Export as both named and default for compatibility
export default {
  invoke: mockInvoke
};