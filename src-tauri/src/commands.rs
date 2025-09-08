use serde_json::Value;
use std::collections::HashMap;
use tauri::{command, AppHandle, State};
use crate::AppState;

/// Get recent projects from application state
#[command]
pub async fn get_recent_projects(
    state: State<'_, AppState>,
) -> Result<Vec<Value>, String> {
    let cache = state.project_cache.lock().map_err(|e| e.to_string())?;
    let recent: Vec<Value> = cache.values().cloned().collect();
    Ok(recent)
}

/// Get supported export formats
#[command]
pub async fn get_export_formats() -> Result<Vec<String>, String> {
    Ok(vec![
        "html5".to_string(),
        "webgl".to_string(),
        "pwa".to_string(),
        "executable".to_string(),
        "steam".to_string(),
    ])
}

/// Get current export status
#[command]
pub async fn get_export_status(
    export_id: String,
    state: State<'_, AppState>,
) -> Result<Option<crate::ExportTask>, String> {
    let queue = state.export_queue.lock().map_err(|e| e.to_string())?;
    let task = queue.iter().find(|t| t.id == export_id).cloned();
    Ok(task)
}

/// Cancel an export operation
#[command]
pub async fn cancel_export(
    export_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut queue = state.export_queue.lock().map_err(|e| e.to_string())?;
    if let Some(pos) = queue.iter().position(|t| t.id == export_id) {
        queue.remove(pos);
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Get system information
#[command]
pub async fn get_system_info() -> Result<HashMap<String, String>, String> {
    use tauri_plugin_os::{platform, arch, version, type_ as os_type};
    
    let mut info = HashMap::new();
    info.insert("platform".to_string(), platform());
    info.insert("arch".to_string(), arch());
    info.insert("version".to_string(), version().unwrap_or_else(|| "unknown".to_string()));
    info.insert("type".to_string(), os_type());
    
    Ok(info)
}

/// Get application data path
#[command]
pub async fn get_app_data_path(app_handle: AppHandle) -> Result<String, String> {
    let path = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    Ok(path.to_string_lossy().to_string())
}

/// Show notification to user
#[command]
pub async fn show_notification(
    title: String,
    body: String,
    icon: Option<String>,
) -> Result<(), String> {
    use tauri_plugin_notification::{NotificationExt, PermissionState};
    
    let permission = tauri_plugin_notification::check_permissions().await
        .map_err(|e| e.to_string())?;
    
    if permission == PermissionState::Granted {
        let mut notification = tauri_plugin_notification::NotificationBuilder::new(&title)
            .body(&body);
            
        if let Some(icon_path) = icon {
            notification = notification.icon(&icon_path);
        }
        
        notification.show().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

/// Copy text to clipboard
#[command]
pub async fn copy_to_clipboard(text: String) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    
    tauri_plugin_clipboard_manager::write_text(text)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Paste text from clipboard
#[command]
pub async fn paste_from_clipboard() -> Result<String, String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    
    let text = tauri_plugin_clipboard_manager::read_text()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(text.unwrap_or_default())
}

/// Set window always on top
#[command]
pub async fn set_window_always_on_top(
    app_handle: AppHandle,
    always_on_top: bool,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.set_always_on_top(always_on_top)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Minimize window to tray
#[command]
pub async fn minimize_to_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Restore window from tray
#[command]
pub async fn restore_from_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}