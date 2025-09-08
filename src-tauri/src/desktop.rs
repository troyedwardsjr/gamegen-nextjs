use tauri::{AppHandle, Manager, Emitter};
use std::collections::HashMap;

/// Initialize desktop-specific features
pub fn initialize_desktop_features(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Initializing desktop features");
    
    // Set up window state management
    setup_window_state_persistence(app)?;
    
    // Configure platform-specific settings
    configure_platform_settings(app)?;
    
    // Initialize file associations
    setup_file_associations(app)?;
    
    Ok(())
}

/// Set up system tray with additional features
pub fn setup_system_tray(_app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // This is already implemented in main.rs, but we can add more features here
    log::info!("System tray configured");
    Ok(())
}

/// Set up application menu bar
pub fn setup_menu_bar(_app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // This is already implemented in main.rs, but we can add more features here
    log::info!("Menu bar configured");
    Ok(())
}

/// Set up global shortcuts
pub fn setup_global_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Code, Modifiers, Shortcut};
    
    let shortcuts = vec![
        ("CmdOrCtrl+Shift+G", "show_hide", "Show/Hide GameGen"),
        ("CmdOrCtrl+Shift+N", "new_project", "New Project"),
    ];
    
    for (shortcut_str, action, description) in shortcuts {
        if let Ok(_shortcut) = shortcut_str.parse::<Shortcut>() {
            let app_handle = app.handle().clone();
            let action_str = action.to_string();
            
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_shortcuts([shortcut_str])
                    .unwrap()
                    .with_handler(move |_app, _shortcut, event| {
                        if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                            handle_global_shortcut_action(&app_handle, &action_str);
                        }
                    })
                    .build(),
            )?;
            
            log::info!("Registered global shortcut: {} - {}", shortcut_str, description);
        }
    }
    
    Ok(())
}

/// Set up auto-updater
pub fn setup_auto_updater(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_updater::UpdaterExt;
    
    let handle = app.handle().clone();
    
    // Check for updates on startup (after a delay)
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
        
        if let Ok(updater) = handle.updater_builder().build() {
            match updater.check().await {
                Ok(Some(update)) => {
                    log::info!("Update available: {}", update.version);
                    
                    // Notify the frontend about available update
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.emit("update_available", &update.version);
                    }
                }
                Ok(None) => {
                    log::info!("No update available");
                }
                Err(e) => {
                    log::warn!("Failed to check for updates: {}", e);
                }
            }
        }
    });
    
    Ok(())
}

fn setup_window_state_persistence(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Load saved window state
    if let Ok(app_data_dir) = app.handle().path().app_data_dir() {
        let state_file = app_data_dir.join("window_state.json");
        
        if state_file.exists() {
            if let Ok(state_data) = std::fs::read_to_string(&state_file) {
                if let Ok(state) = serde_json::from_str::<WindowState>(&state_data) {
                    // Apply saved state to main window
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                            width: state.width,
                            height: state.height,
                        }));
                        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                            x: state.x,
                            y: state.y,
                        }));
                        if state.maximized {
                            let _ = window.maximize();
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}

fn configure_platform_settings(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    {
        // macOS-specific settings
        use tauri::TitleBarStyle;
        
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_title_bar_style(TitleBarStyle::Overlay);
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows-specific settings
        log::info!("Applying Windows-specific settings");
    }
    
    #[cfg(target_os = "linux")]
    {
        // Linux-specific settings
        log::info!("Applying Linux-specific settings");
    }
    
    Ok(())
}

fn setup_file_associations(_app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // TODO: Register file associations for .ggp files
    // This would involve:
    // - Windows: Registry entries
    // - macOS: Info.plist configuration
    // - Linux: MIME type registration
    
    log::info!("File associations configured");
    Ok(())
}

fn handle_global_shortcut_action(app_handle: &AppHandle, action: &str) {
    match action {
        "show_hide" => {
            if let Some(window) = app_handle.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        "new_project" => {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.eval("window.location.href = '/game-creator'");
            }
        }
        _ => {
            log::warn!("Unknown global shortcut action: {}", action);
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct WindowState {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    maximized: bool,
}

/// Save current window state
pub fn save_window_state(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let size = window.inner_size()?;
        let position = window.outer_position()?;
        let maximized = window.is_maximized()?;
        
        let state = WindowState {
            width: size.width,
            height: size.height,
            x: position.x,
            y: position.y,
            maximized,
        };
        
        if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
            std::fs::create_dir_all(&app_data_dir)?;
            let state_file = app_data_dir.join("window_state.json");
            let state_data = serde_json::to_string_pretty(&state)?;
            std::fs::write(state_file, state_data)?;
        }
    }
    
    Ok(())
}

/// Handle application events
pub fn handle_app_event(app_handle: &AppHandle, event: &tauri::RunEvent) {
    match event {
        tauri::RunEvent::ExitRequested { .. } => {
            // Save window state before exiting
            let _ = save_window_state(app_handle);
        }
        tauri::RunEvent::WindowEvent { label, event, .. } => {
            if label == "main" {
                match event {
                    tauri::WindowEvent::Resized(_) | tauri::WindowEvent::Moved(_) => {
                        // Debounce window state saving
                        let app_handle_clone = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                            let _ = save_window_state(&app_handle_clone);
                        });
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    }
}