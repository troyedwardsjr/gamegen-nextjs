use serde_json::Value;
use std::path::PathBuf;
use tauri::{command, AppHandle, State};
use crate::AppState;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ProjectFile {
    pub name: String,
    pub path: String,
    pub data: Value,
    pub last_modified: chrono::DateTime<chrono::Utc>,
}

/// Open a project file using native file dialog
#[command]
pub async fn open_project_file(
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<Option<ProjectFile>, String> {
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    let file_path = app_handle
        .dialog()
        .file()
        .add_filter("GameGen Project", &["ggp", "json"])
        .set_title("Open GameGen Project")
        .pick_file()
        .await;
    
    if let Some(path) = file_path {
        let path_str = path.to_string_lossy().to_string();
        
        // Read file content
        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        
        // Parse JSON content
        let data: Value = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse project file: {}", e))?;
        
        // Get file metadata
        let metadata = std::fs::metadata(&path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;
        
        let last_modified = metadata
            .modified()
            .map_err(|e| format!("Failed to get modification time: {}", e))?
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to convert time: {}", e))?;
        
        let project_file = ProjectFile {
            name: path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: path_str.clone(),
            data: data.clone(),
            last_modified: chrono::DateTime::from_timestamp(last_modified.as_secs() as i64, 0)
                .unwrap_or_else(chrono::Utc::now),
        };
        
        // Cache the project
        let mut cache = state.project_cache.lock().map_err(|e| e.to_string())?;
        cache.insert(path_str, data);
        
        Ok(Some(project_file))
    } else {
        Ok(None)
    }
}

/// Save a project file using native file dialog
#[command]
pub async fn save_project_file(
    app_handle: AppHandle,
    project_data: Value,
    current_path: Option<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    let file_path = if let Some(path) = current_path {
        PathBuf::from(path)
    } else {
        let dialog_result = app_handle
            .dialog()
            .file()
            .add_filter("GameGen Project", &["ggp"])
            .set_file_name("project.ggp")
            .set_title("Save GameGen Project")
            .save_file()
            .await;
        
        if let Some(path) = dialog_result {
            path
        } else {
            return Ok(None);
        }
    };
    
    // Serialize project data
    let content = serde_json::to_string_pretty(&project_data)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    
    // Write to file
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(Some(file_path.to_string_lossy().to_string()))
}

/// Export project to various formats
#[command]
pub async fn export_project(
    app_handle: AppHandle,
    project_data: Value,
    format: String,
) -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    let default_name = match format.as_str() {
        "html5" => "game.html",
        "zip" => "game.zip",
        "exe" => "game.exe",
        _ => "game",
    };
    
    let export_path = app_handle
        .dialog()
        .file()
        .set_file_name(default_name)
        .set_title(&format!("Export Game as {}", format.to_uppercase()))
        .save_file()
        .await;
    
    if let Some(path) = export_path {
        // TODO: Implement actual export logic based on format
        match format.as_str() {
            "html5" => export_html5(&project_data, &path)?,
            "zip" => export_zip(&project_data, &path)?,
            "exe" => export_executable(&project_data, &path)?,
            _ => return Err(format!("Unsupported export format: {}", format)),
        }
        
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Export cancelled by user".to_string())
    }
}

/// Import assets (images, audio, etc.)
#[command]
pub async fn import_assets(app_handle: AppHandle) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    let file_paths = app_handle
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "bmp", "webp"])
        .add_filter("Audio", &["wav", "ogg", "mp3", "m4a"])
        .add_filter("All Files", &["*"])
        .set_title("Import Assets")
        .pick_files()
        .await;
    
    if let Some(paths) = file_paths {
        let path_strings: Vec<String> = paths
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect();
        
        Ok(path_strings)
    } else {
        Ok(vec![])
    }
}

// Helper functions for different export formats
fn export_html5(project_data: &Value, path: &PathBuf) -> Result<(), String> {
    // Create a basic HTML5 game export
    let html_content = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GameGen Game</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }}
        canvas {{
            border: 1px solid #333;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }}
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script>
        // Game data embedded from project
        const gameData = {};
        
        // Initialize game engine
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        
        // Basic game loop
        function gameLoop() {{
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Render game
            // TODO: Implement game rendering based on project data
            
            requestAnimationFrame(gameLoop);
        }}
        
        // Start game
        gameLoop();
    </script>
</body>
</html>"#,
        serde_json::to_string_pretty(project_data).unwrap_or_default()
    );
    
    std::fs::write(path, html_content)
        .map_err(|e| format!("Failed to write HTML5 export: {}", e))?;
    
    Ok(())
}

fn export_zip(project_data: &Value, path: &PathBuf) -> Result<(), String> {
    // Create a ZIP archive with game files
    // For now, just write the project data as JSON
    let content = serde_json::to_string_pretty(project_data)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    
    std::fs::write(path, content)
        .map_err(|e| format!("Failed to write ZIP export: {}", e))?;
    
    Ok(())
}

fn export_executable(project_data: &Value, path: &PathBuf) -> Result<(), String> {
    // Create an executable (placeholder implementation)
    let content = serde_json::to_string_pretty(project_data)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;
    
    std::fs::write(path, content)
        .map_err(|e| format!("Failed to write executable export: {}", e))?;
    
    Ok(())
}