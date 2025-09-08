use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub release_date: String,
    pub release_notes: String,
    pub download_url: String,
    pub size: u64,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
    pub speed: String,
}

/// Enhanced updater functionality beyond the plugin
pub struct GameGenUpdater {
    app_handle: AppHandle,
}

impl GameGenUpdater {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Check for updates with enhanced metadata
    pub async fn check_for_updates(&self) -> Result<Option<UpdateInfo>, String> {
        use tauri_plugin_updater::UpdaterExt;
        
        let updater = self.app_handle
            .updater_builder()
            .build()
            .map_err(|e| e.to_string())?;

        match updater.check().await {
            Ok(Some(update)) => {
                let update_info = UpdateInfo {
                    version: update.version.to_string(),
                    release_date: update.date.unwrap_or_default(),
                    release_notes: update.body.unwrap_or_default(),
                    download_url: "".to_string(), // Not directly available from updater
                    size: update.content_length().unwrap_or(0),
                    signature: update.signature.clone(),
                };
                
                // Cache update information
                self.cache_update_info(&update_info).await?;
                
                Ok(Some(update_info))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    /// Install update with progress tracking
    pub async fn install_update(&self, show_progress: bool) -> Result<(), String> {
        use tauri_plugin_updater::UpdaterExt;
        
        let updater = self.app_handle
            .updater_builder()
            .build()
            .map_err(|e| e.to_string())?;

        if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
            let total_size = update.content_length().unwrap_or(0);
            let mut downloaded = 0u64;
            let start_time = std::time::Instant::now();

            // Emit update start event
            if let Some(window) = self.app_handle.get_webview_window("main") {
                let _ = window.emit("update_start", &total_size);
            }

            update
                .download_and_install(
                    |chunk_length, _content_length| {
                        downloaded += chunk_length as u64;
                        
                        if show_progress && total_size > 0 {
                            let percentage = (downloaded as f64 / total_size as f64) * 100.0;
                            let elapsed = start_time.elapsed().as_secs_f64();
                            let speed = if elapsed > 0.0 {
                                format!("{:.1} KB/s", (downloaded as f64 / 1024.0) / elapsed)
                            } else {
                                "calculating...".to_string()
                            };
                            
                            let progress = UpdateProgress {
                                downloaded,
                                total: total_size,
                                percentage,
                                speed,
                            };
                            
                            // Emit progress update
                            if let Some(window) = self.app_handle.get_webview_window("main") {
                                let _ = window.emit("update_progress", &progress);
                            }
                            
                            log::info!("Update progress: {:.1}% ({} / {} bytes)", 
                                percentage, downloaded, total_size);
                        }
                    },
                    || {
                        log::info!("Update downloaded successfully, preparing to restart...");
                        
                        // Emit update ready event
                        if let Some(window) = self.app_handle.get_webview_window("main") {
                            let _ = window.emit("update_ready", ());
                        }
                        
                        // Save application state before restart
                        let _ = self.save_pre_restart_state();
                    }
                )
                .await
                .map_err(|e| e.to_string())?;
        } else {
            return Err("No update available".to_string());
        }

        Ok(())
    }

    /// Schedule update check
    pub async fn schedule_update_check(&self, interval_hours: u64) {
        let app_handle = self.app_handle.clone();
        
        tauri::async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(
                tokio::time::Duration::from_secs(interval_hours * 3600)
            );
            
            loop {
                interval.tick().await;
                
                let updater = GameGenUpdater::new(app_handle.clone());
                
                match updater.check_for_updates().await {
                    Ok(Some(update_info)) => {
                        log::info!("Scheduled update check found new version: {}", update_info.version);
                        
                        // Show notification about available update
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.emit("update_available_background", &update_info);
                        }
                        
                        // Show system notification
                        let _ = updater.show_update_notification(&update_info).await;
                    }
                    Ok(None) => {
                        log::debug!("Scheduled update check: no updates available");
                    }
                    Err(e) => {
                        log::warn!("Scheduled update check failed: {}", e);
                    }
                }
            }
        });
    }

    /// Show system notification about available update
    async fn show_update_notification(&self, update_info: &UpdateInfo) -> Result<(), String> {
        use tauri_plugin_notification::{NotificationExt, PermissionState};
        
        let permission = tauri_plugin_notification::check_permissions().await
            .map_err(|e| e.to_string())?;
        
        if permission == PermissionState::Granted {
            let notification = tauri_plugin_notification::NotificationBuilder::new(
                &format!("GameGen Update Available - v{}", update_info.version)
            )
            .body(&format!(
                "A new version of GameGen is available. Click to update.\n\n{}",
                update_info.release_notes.chars().take(100).collect::<String>()
            ))
            .icon("icons/icon.png");
            
            notification.show().map_err(|e| e.to_string())?;
        }
        
        Ok(())
    }

    /// Cache update information for offline access
    async fn cache_update_info(&self, update_info: &UpdateInfo) -> Result<(), String> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let cache_dir = app_data_dir.join("update_cache");
            std::fs::create_dir_all(&cache_dir)
                .map_err(|e| format!("Failed to create cache directory: {}", e))?;
            
            let cache_file = cache_dir.join("latest_update.json");
            let cache_data = serde_json::to_string_pretty(update_info)
                .map_err(|e| format!("Failed to serialize update info: {}", e))?;
            
            std::fs::write(cache_file, cache_data)
                .map_err(|e| format!("Failed to write cache file: {}", e))?;
        }
        
        Ok(())
    }

    /// Get cached update information
    pub async fn get_cached_update_info(&self) -> Option<UpdateInfo> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let cache_file = app_data_dir.join("update_cache").join("latest_update.json");
            
            if let Ok(cache_data) = std::fs::read_to_string(cache_file) {
                if let Ok(update_info) = serde_json::from_str::<UpdateInfo>(&cache_data) {
                    return Some(update_info);
                }
            }
        }
        
        None
    }

    /// Save application state before restart
    fn save_pre_restart_state(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let state_dir = app_data_dir.join("pre_restart_state");
            std::fs::create_dir_all(&state_dir)?;
            
            // Save current window state
            crate::desktop::save_window_state(&self.app_handle)?;
            
            // Save any pending work
            let state_file = state_dir.join("app_state.json");
            let app_state = serde_json::json!({
                "timestamp": chrono::Utc::now(),
                "version": env!("CARGO_PKG_VERSION"),
                "restart_reason": "update"
            });
            
            std::fs::write(state_file, serde_json::to_string_pretty(&app_state)?)?;
        }
        
        Ok(())
    }

    /// Restore application state after restart
    pub async fn restore_post_restart_state(&self) -> Result<(), String> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let state_file = app_data_dir.join("pre_restart_state").join("app_state.json");
            
            if state_file.exists() {
                if let Ok(state_data) = std::fs::read_to_string(&state_file) {
                    if let Ok(state) = serde_json::from_str::<serde_json::Value>(&state_data) {
                        if let Some(restart_reason) = state.get("restart_reason")
                            .and_then(|v| v.as_str()) {
                            
                            if restart_reason == "update" {
                                // Show update success notification
                                if let Some(window) = self.app_handle.get_webview_window("main") {
                                    let _ = window.emit("update_completed", ());
                                }
                                
                                log::info!("Application updated successfully");
                            }
                        }
                    }
                }
                
                // Clean up state file
                let _ = std::fs::remove_file(state_file);
            }
        }
        
        Ok(())
    }

    /// Configure auto-update settings
    pub async fn configure_auto_update(&self, enabled: bool, check_interval: u64) -> Result<(), String> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let config_dir = app_data_dir.join("config");
            std::fs::create_dir_all(&config_dir)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
            
            let config_file = config_dir.join("auto_update.json");
            let config = serde_json::json!({
                "enabled": enabled,
                "check_interval_hours": check_interval,
                "last_check": chrono::Utc::now(),
                "auto_install": false  // For security, require user confirmation
            });
            
            std::fs::write(config_file, serde_json::to_string_pretty(&config).unwrap())
                .map_err(|e| format!("Failed to write auto-update config: {}", e))?;
            
            if enabled {
                self.schedule_update_check(check_interval).await;
            }
        }
        
        Ok(())
    }

    /// Get auto-update configuration
    pub async fn get_auto_update_config(&self) -> Result<serde_json::Value, String> {
        if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
            let config_file = app_data_dir.join("config").join("auto_update.json");
            
            if config_file.exists() {
                let config_data = std::fs::read_to_string(config_file)
                    .map_err(|e| format!("Failed to read auto-update config: {}", e))?;
                
                let config = serde_json::from_str(&config_data)
                    .map_err(|e| format!("Failed to parse auto-update config: {}", e))?;
                
                return Ok(config);
            }
        }
        
        // Return default config
        Ok(serde_json::json!({
            "enabled": true,
            "check_interval_hours": 24,
            "auto_install": false
        }))
    }
}