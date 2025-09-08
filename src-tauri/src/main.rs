// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

mod desktop;

// Data structures for API responses
#[derive(Serialize, Deserialize, Debug)]
struct ProjectFile {
    name: String,
    path: String,
    data: serde_json::Value,
    last_modified: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ExportOptions {
    format: String,
    target_platform: String,
    optimization_level: String,
    include_assets: bool,
    compress_assets: bool,
    output_path: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ExportTask {
    id: String,
    project_id: String,
    format: String,
    status: String,
    progress: f32,
}

#[derive(Serialize, Deserialize, Debug)]
struct SystemInfo {
    platform: String,
    arch: String,
    version: String,
    #[serde(rename = "type")]
    platform_type: String,
}

// Global state for export tasks
type ExportTasks = Arc<RwLock<HashMap<String, ExportTask>>>;

// ==== FILE OPERATIONS ====

#[tauri::command]
async fn open_project_file() -> Result<Option<ProjectFile>, String> {
    // For now, return a simple message indicating the function is called
    log::info!("Open project file dialog would be shown");
    Ok(None)
}

#[tauri::command]
async fn save_project_file(
    _project_data: serde_json::Value,
    _current_path: Option<String>,
) -> Result<Option<String>, String> {
    // For now, return a simple message indicating the function is called
    log::info!("Save project file dialog would be shown");
    Ok(Some("/tmp/project.ggp".to_string()))
}

#[tauri::command]
async fn export_project(
    _project_data: serde_json::Value,
    format: String,
) -> Result<String, String> {
    // For now, return a simple message indicating the function is called
    log::info!("Export project dialog would be shown for format: {}", format);
    Ok(format!("/tmp/game.{}", format))
}

#[tauri::command]
async fn import_assets() -> Result<Vec<String>, String> {
    // For now, return a simple message indicating the function is called
    log::info!("Import assets dialog would be shown");
    Ok(vec![])
}

#[tauri::command]
async fn get_recent_projects() -> Result<Vec<serde_json::Value>, String> {
    // In a real implementation, this would read from a settings file or database
    // For now, return an empty list
    Ok(vec![])
}

// ==== GAME EXPORT ====

#[tauri::command]
async fn export_game(
    _project_data: serde_json::Value,
    options: ExportOptions,
    export_tasks: tauri::State<'_, ExportTasks>,
) -> Result<String, String> {
    let export_id = Uuid::new_v4().to_string();
    
    // Create export task
    let task = ExportTask {
        id: export_id.clone(),
        project_id: "current".to_string(),
        format: options.format.clone(),
        status: "started".to_string(),
        progress: 0.0,
    };
    
    // Store task
    {
        let mut tasks = export_tasks.write().await;
        tasks.insert(export_id.clone(), task);
    }
    
    // Start export process in background
    let export_id_clone = export_id.clone();
    let tasks_clone = export_tasks.inner().clone();
    tokio::spawn(async move {
        // Simulate export process
        for progress in (0..=100).step_by(10) {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            
            let mut tasks = tasks_clone.write().await;
            if let Some(task) = tasks.get_mut(&export_id_clone) {
                task.progress = progress as f32;
                task.status = if progress == 100 { "completed".to_string() } else { "processing".to_string() };
            }
        }
    });
    
    Ok(export_id)
}

#[tauri::command]
async fn get_export_formats() -> Result<Vec<String>, String> {
    Ok(vec![
        "html5".to_string(),
        "webgl".to_string(),
        "pwa".to_string(),
        "windows".to_string(),
        "macos".to_string(),
        "linux".to_string(),
        "android".to_string(),
        "ios".to_string(),
    ])
}

#[tauri::command]
async fn get_export_status(
    export_id: String,
    export_tasks: tauri::State<'_, ExportTasks>,
) -> Result<Option<ExportTask>, String> {
    let tasks = export_tasks.read().await;
    Ok(tasks.get(&export_id).cloned())
}

#[tauri::command]
async fn cancel_export(
    export_id: String,
    export_tasks: tauri::State<'_, ExportTasks>,
) -> Result<bool, String> {
    let mut tasks = export_tasks.write().await;
    if let Some(task) = tasks.get_mut(&export_id) {
        task.status = "cancelled".to_string();
        Ok(true)
    } else {
        Ok(false)
    }
}

// ==== SYSTEM INTEGRATION ====

#[tauri::command]
async fn show_in_folder(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    let folder_path = if path_buf.is_file() {
        path_buf.parent().unwrap_or(&path_buf)
    } else {
        &path_buf
    };
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: "1.0.0".to_string(), // Could get actual OS version
        platform_type: "desktop".to_string(),
    })
}

#[tauri::command]
async fn get_app_data_path(app: AppHandle) -> Result<String, String> {
    let app_data = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(app_data.to_string_lossy().to_string())
}

#[tauri::command]
async fn create_desktop_shortcut() -> Result<(), String> {
    // Platform-specific desktop shortcut creation would go here
    // This is a simplified implementation
    log::info!("Desktop shortcut creation requested");
    Ok(())
}

#[tauri::command]
async fn set_auto_launch(enabled: bool) -> Result<(), String> {
    // Auto-launch functionality would be implemented here
    log::info!("Auto-launch setting: {}", enabled);
    Ok(())
}

// ==== DESKTOP FEATURES ====

#[tauri::command]
async fn show_notification(
    title: String,
    body: String,
    _icon: Option<String>,
) -> Result<(), String> {
    // Tauri v2 notification implementation
    log::info!("Showing notification: {} - {}", title, body);
    Ok(())
}

#[tauri::command]
async fn copy_to_clipboard(text: String) -> Result<(), String> {
    // Clipboard implementation would go here
    log::info!("Copying to clipboard: {}", text);
    Ok(())
}

#[tauri::command]
async fn paste_from_clipboard() -> Result<String, String> {
    // Clipboard implementation would go here
    log::info!("Pasting from clipboard");
    Ok("".to_string())
}

#[tauri::command]
async fn set_window_always_on_top(
    always_on_top: bool,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(always_on_top)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn minimize_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn restore_from_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn register_global_shortcut(
    shortcut: String,
    action: String,
) -> Result<(), String> {
    // Global shortcut registration would go here
    log::info!("Registering global shortcut: {} -> {}", shortcut, action);
    Ok(())
}

#[tauri::command]
async fn unregister_global_shortcut(shortcut: String) -> Result<(), String> {
    // Global shortcut unregistration would go here
    log::info!("Unregistering global shortcut: {}", shortcut);
    Ok(())
}

// ==== AUTO-UPDATER ====

#[tauri::command]
async fn check_for_updates() -> Result<bool, String> {
    // Auto-updater check would go here
    log::info!("Checking for updates");
    Ok(false) // No updates available
}

#[tauri::command]
async fn install_update() -> Result<(), String> {
    // Auto-updater installation would go here
    log::info!("Installing update");
    Ok(())
}

// ==== MAIN FUNCTION ====

fn main() {
    env_logger::init();
    
    let export_tasks: ExportTasks = Arc::new(RwLock::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .manage(export_tasks)
        .setup(|app| {
            log::info!("GameGen Desktop Application initialized successfully");
            
            // Initialize desktop features
            if let Err(e) = desktop::initialize_desktop_features(app) {
                log::error!("Failed to initialize desktop features: {}", e);
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File Operations
            open_project_file,
            save_project_file,
            export_project,
            import_assets,
            get_recent_projects,
            // Game Export
            export_game,
            get_export_formats,
            get_export_status,
            cancel_export,
            // System Integration
            show_in_folder,
            open_external_url,
            get_system_info,
            get_app_data_path,
            create_desktop_shortcut,
            set_auto_launch,
            // Desktop Features
            show_notification,
            copy_to_clipboard,
            paste_from_clipboard,
            set_window_always_on_top,
            minimize_to_tray,
            restore_from_tray,
            register_global_shortcut,
            unregister_global_shortcut,
            // Auto-Updater
            check_for_updates,
            install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}