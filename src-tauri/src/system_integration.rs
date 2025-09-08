use std::path::PathBuf;
use tauri::{command, AppHandle};

/// Show file in system file explorer
#[command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    use tauri_plugin_shell::{ShellExt, process::CommandEvent};
    
    let path_buf = PathBuf::from(&path);
    let folder_path = if path_buf.is_file() {
        path_buf.parent().unwrap_or(&path_buf)
    } else {
        &path_buf
    };
    
    #[cfg(target_os = "windows")]
    {
        let app_handle = tauri::AppHandle::default();
        let shell = app_handle.shell();
        let (mut rx, mut child) = shell
            .command("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
            
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Terminated(_) => break,
                CommandEvent::Error(e) => return Err(e.to_string()),
                _ => {}
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let app_handle = tauri::AppHandle::default();
        let shell = app_handle.shell();
        let (mut rx, mut child) = shell
            .command("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
            
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Terminated(_) => break,
                CommandEvent::Error(e) => return Err(e.to_string()),
                _ => {}
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try different file managers
        let commands = [
            ("nautilus", vec!["--select".to_string(), path.clone()]),
            ("dolphin", vec!["--select".to_string(), path.clone()]),
            ("thunar", vec![folder_path.to_string_lossy().to_string()]),
            ("xdg-open", vec![folder_path.to_string_lossy().to_string()]),
        ];
        
        for (cmd, args) in &commands {
            let app_handle = tauri::AppHandle::default();
            let shell = app_handle.shell();
            if let Ok((mut rx, mut child)) = shell.command(cmd).args(args).spawn() {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Terminated(data) => {
                            if data.code.unwrap_or(1) == 0 {
                                return Ok(());
                            }
                            break;
                        }
                        CommandEvent::Error(_) => break,
                        _ => {}
                    }
                }
            }
        }
        
        return Err("No suitable file manager found".to_string());
    }
    
    Ok(())
}

/// Open URL in default browser
#[command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    use tauri_plugin_shell::{ShellExt, open};
    
    let app_handle = tauri::AppHandle::default();
    let shell = app_handle.shell();
    
    shell.open(&url, None).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Check for application updates
#[command]
pub async fn check_for_updates(app_handle: AppHandle) -> Result<bool, String> {
    use tauri_plugin_updater::UpdaterExt;
    
    let updater = app_handle.updater_builder().build()
        .map_err(|e| e.to_string())?;
    
    match updater.check().await {
        Ok(Some(_update)) => Ok(true),
        Ok(None) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

/// Install available update
#[command]
pub async fn install_update(app_handle: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    
    let updater = app_handle.updater_builder().build()
        .map_err(|e| e.to_string())?;
    
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        let mut downloaded = 0;
        let total = update.content_length().unwrap_or(0);
        
        update
            .download_and_install(
                |chunk_length, _content_length| {
                    downloaded += chunk_length;
                    if total > 0 {
                        let progress = (downloaded as f64 / total as f64 * 100.0) as u8;
                        log::info!("Download progress: {}%", progress);
                        
                        // Emit progress event to frontend
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.emit("update_progress", progress);
                        }
                    }
                },
                || {
                    log::info!("Update downloaded, preparing to restart...");
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.emit("update_ready", ());
                    }
                }
            )
            .await
            .map_err(|e| e.to_string())?;
    } else {
        return Err("No update available".to_string());
    }
    
    Ok(())
}

/// Set application to auto-launch on system startup
#[command]
pub async fn set_auto_launch(enabled: bool) -> Result<(), String> {
    // TODO: Implement auto-launch functionality
    // This would involve:
    // - Windows: Registry entries or startup folder
    // - macOS: Launch Agents
    // - Linux: Autostart entries
    
    log::info!("Auto-launch set to: {}", enabled);
    Ok(())
}

/// Create desktop shortcut
#[command]
pub async fn create_desktop_shortcut() -> Result<(), String> {
    // TODO: Implement desktop shortcut creation
    // This would involve creating platform-specific shortcut files
    
    #[cfg(target_os = "windows")]
    {
        // Create .lnk file on Windows
        log::info!("Creating Windows desktop shortcut");
    }
    
    #[cfg(target_os = "macos")]
    {
        // Create alias on macOS
        log::info!("Creating macOS desktop alias");
    }
    
    #[cfg(target_os = "linux")]
    {
        // Create .desktop file on Linux
        log::info!("Creating Linux desktop entry");
    }
    
    Ok(())
}

/// Register global shortcut
#[command]
pub async fn register_global_shortcut(
    app_handle: AppHandle,
    shortcut: String,
    action: String,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let shortcut_obj: Shortcut = shortcut.parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;
    
    let app_handle_clone = app_handle.clone();
    app_handle.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_shortcuts([&shortcut])
            .unwrap()
            .with_handler(move |_app, _shortcut, event| {
                if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    match action.as_str() {
                        "show_hide" => {
                            if let Some(window) = app_handle_clone.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "new_project" => {
                            if let Some(window) = app_handle_clone.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.location.href = '/game-creator'");
                            }
                        }
                        _ => {}
                    }
                }
            })
            .build(),
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Unregister global shortcut
#[command]
pub async fn unregister_global_shortcut(
    app_handle: AppHandle,
    shortcut: String,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let shortcut_obj: Shortcut = shortcut.parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;
    
    app_handle.global_shortcut()
        .unregister(&shortcut_obj)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}