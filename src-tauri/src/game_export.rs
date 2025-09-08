use serde_json::Value;
use std::collections::HashMap;
use tauri::{command, AppHandle, State};
use uuid::Uuid;
use crate::{AppState, ExportTask};

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ExportOptions {
    pub format: String,
    pub target_platform: String,
    pub optimization_level: String,
    pub include_assets: bool,
    pub compress_assets: bool,
    pub output_path: Option<String>,
}

/// Export game with advanced options
#[command]
pub async fn export_game(
    app_handle: AppHandle,
    project_data: Value,
    options: ExportOptions,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let export_id = Uuid::new_v4().to_string();
    
    // Create export task
    let task = ExportTask {
        id: export_id.clone(),
        project_id: project_data.get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string(),
        format: options.format.clone(),
        status: "starting".to_string(),
        progress: 0,
    };
    
    // Add to export queue
    {
        let mut queue = state.export_queue.lock().map_err(|e| e.to_string())?;
        queue.push(task);
    }
    
    // Start export process in background
    let app_handle_clone = app_handle.clone();
    let state_clone = state.inner().clone();
    let export_id_clone = export_id.clone();
    
    tokio::spawn(async move {
        if let Err(e) = perform_export(
            app_handle_clone,
            project_data,
            options,
            export_id_clone.clone(),
            state_clone,
        ).await {
            log::error!("Export failed: {}", e);
            
            // Update task status to failed
            if let Ok(mut queue) = state_clone.export_queue.lock() {
                if let Some(task) = queue.iter_mut().find(|t| t.id == export_id_clone) {
                    task.status = "failed".to_string();
                    task.progress = 0;
                }
            }
        }
    });
    
    Ok(export_id)
}

async fn perform_export(
    app_handle: AppHandle,
    project_data: Value,
    options: ExportOptions,
    export_id: String,
    state: AppState,
) -> Result<(), String> {
    // Update progress: Starting
    update_export_progress(&state, &export_id, "processing", 10)?;
    
    // Prepare export directory
    let export_dir = prepare_export_directory(&app_handle, &options).await?;
    update_export_progress(&state, &export_id, "processing", 20)?;
    
    // Process assets if needed
    if options.include_assets {
        process_assets(&project_data, &export_dir, &options).await?;
        update_export_progress(&state, &export_id, "processing", 40)?;
    }
    
    // Generate game files based on format
    match options.format.as_str() {
        "html5" => generate_html5_export(&project_data, &export_dir, &options).await?,
        "webgl" => generate_webgl_export(&project_data, &export_dir, &options).await?,
        "pwa" => generate_pwa_export(&project_data, &export_dir, &options).await?,
        "executable" => generate_executable_export(&project_data, &export_dir, &options).await?,
        _ => return Err(format!("Unsupported export format: {}", options.format)),
    }
    update_export_progress(&state, &export_id, "processing", 80)?;
    
    // Finalize export
    finalize_export(&export_dir, &options).await?;
    update_export_progress(&state, &export_id, "completed", 100)?;
    
    // Send completion notification
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.emit("export_completed", &export_id);
    }
    
    Ok(())
}

fn update_export_progress(
    state: &AppState,
    export_id: &str,
    status: &str,
    progress: u8,
) -> Result<(), String> {
    let mut queue = state.export_queue.lock().map_err(|e| e.to_string())?;
    if let Some(task) = queue.iter_mut().find(|t| t.id == export_id) {
        task.status = status.to_string();
        task.progress = progress;
    }
    Ok(())
}

async fn prepare_export_directory(
    app_handle: &AppHandle,
    options: &ExportOptions,
) -> Result<std::path::PathBuf, String> {
    let export_dir = if let Some(output_path) = &options.output_path {
        std::path::PathBuf::from(output_path)
    } else {
        // Use default export directory in app data
        let app_data = app_handle.path().app_data_dir()
            .map_err(|e| e.to_string())?;
        app_data.join("exports").join(&options.format)
    };
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&export_dir)
        .map_err(|e| format!("Failed to create export directory: {}", e))?;
    
    Ok(export_dir)
}

async fn process_assets(
    project_data: &Value,
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    let assets_dir = export_dir.join("assets");
    std::fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    
    // TODO: Process and copy assets from project data
    // This would involve:
    // 1. Extracting asset references from project data
    // 2. Copying/converting assets to appropriate formats
    // 3. Optimizing assets if compression is enabled
    // 4. Generating asset manifests
    
    Ok(())
}

async fn generate_html5_export(
    project_data: &Value,
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    let html_content = create_html5_template(project_data, options)?;
    let html_path = export_dir.join("index.html");
    
    std::fs::write(&html_path, html_content)
        .map_err(|e| format!("Failed to write HTML5 export: {}", e))?;
    
    // Generate game JavaScript
    let js_content = create_game_engine_js(project_data, options)?;
    let js_path = export_dir.join("game.js");
    
    std::fs::write(&js_path, js_content)
        .map_err(|e| format!("Failed to write game script: {}", e))?;
    
    Ok(())
}

async fn generate_webgl_export(
    project_data: &Value,
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    // Similar to HTML5 but with WebGL optimizations
    generate_html5_export(project_data, export_dir, options).await?;
    
    // Add WebGL-specific shaders and optimizations
    let shader_dir = export_dir.join("shaders");
    std::fs::create_dir_all(&shader_dir)
        .map_err(|e| format!("Failed to create shaders directory: {}", e))?;
    
    // TODO: Generate optimized shaders for pixel art rendering
    
    Ok(())
}

async fn generate_pwa_export(
    project_data: &Value,
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    // Start with HTML5 export
    generate_html5_export(project_data, export_dir, options).await?;
    
    // Add PWA manifest
    let manifest = create_pwa_manifest(project_data)?;
    let manifest_path = export_dir.join("manifest.json");
    
    std::fs::write(&manifest_path, manifest)
        .map_err(|e| format!("Failed to write PWA manifest: {}", e))?;
    
    // Add service worker
    let service_worker = create_service_worker(project_data)?;
    let sw_path = export_dir.join("sw.js");
    
    std::fs::write(&sw_path, service_worker)
        .map_err(|e| format!("Failed to write service worker: {}", e))?;
    
    Ok(())
}

async fn generate_executable_export(
    project_data: &Value,
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    // TODO: Generate standalone executable
    // This would involve bundling the game with a runtime engine
    // For now, create a launcher script
    
    let launcher_content = create_launcher_script(project_data, options)?;
    let launcher_path = export_dir.join(if cfg!(target_os = "windows") {
        "game.bat"
    } else {
        "game.sh"
    });
    
    std::fs::write(&launcher_path, launcher_content)
        .map_err(|e| format!("Failed to write launcher script: {}", e))?;
    
    Ok(())
}

async fn finalize_export(
    export_dir: &std::path::Path,
    options: &ExportOptions,
) -> Result<(), String> {
    // Create README with instructions
    let readme_content = create_export_readme(options)?;
    let readme_path = export_dir.join("README.md");
    
    std::fs::write(&readme_path, readme_content)
        .map_err(|e| format!("Failed to write README: {}", e))?;
    
    // If compression is enabled, create archive
    if options.compress_assets {
        // TODO: Create ZIP archive of the export
    }
    
    Ok(())
}

// Helper functions for creating export content
fn create_html5_template(project_data: &Value, _options: &ExportOptions) -> Result<String, String> {
    let game_title = project_data.get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("GameGen Game");
    
    Ok(format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: monospace;
        }}
        #gameContainer {{
            position: relative;
            border: 2px solid #333;
        }}
        canvas {{
            display: block;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }}
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
    </div>
    <script src="game.js"></script>
</body>
</html>"#,
        game_title
    ))
}

fn create_game_engine_js(project_data: &Value, _options: &ExportOptions) -> Result<String, String> {
    Ok(format!(
        r#"// GameGen Exported Game
const gameData = {};

class GameEngine {{
    constructor(canvasId) {{
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.lastTime = 0;
        
        // Set up pixel perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.init();
    }}
    
    init() {{
        // Initialize game systems
        this.setupInput();
        this.start();
    }}
    
    setupInput() {{
        const keys = {{}};
        
        window.addEventListener('keydown', (e) => {{
            keys[e.code] = true;
        }});
        
        window.addEventListener('keyup', (e) => {{
            keys[e.code] = false;
        }});
        
        this.keys = keys;
    }}
    
    start() {{
        this.running = true;
        this.gameLoop(0);
    }}
    
    gameLoop(currentTime) {{
        if (!this.running) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }}
    
    update(deltaTime) {{
        // Update game logic
    }}
    
    render() {{
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game objects
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('GameGen Game - Press any key to start', 20, 50);
    }}
}}

// Start the game
const game = new GameEngine('gameCanvas');
"#,
        serde_json::to_string_pretty(project_data).unwrap_or_default()
    ))
}

fn create_pwa_manifest(project_data: &Value) -> Result<String, String> {
    let name = project_data.get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("GameGen Game");
    
    let description = project_data.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("A game created with GameGen");
    
    let manifest = serde_json::json!({
        "name": name,
        "short_name": name,
        "description": description,
        "start_url": "/",
        "display": "fullscreen",
        "background_color": "#000000",
        "theme_color": "#333333",
        "orientation": "landscape",
        "icons": [
            {
                "src": "icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    });
    
    serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize PWA manifest: {}", e))
}

fn create_service_worker(_project_data: &Value) -> Result<String, String> {
    Ok(r#"const CACHE_NAME = 'gamegen-game-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/game.js',
    '/assets/'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
"#.to_string())
}

fn create_launcher_script(project_data: &Value, _options: &ExportOptions) -> Result<String, String> {
    let game_title = project_data.get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("GameGen Game");
    
    if cfg!(target_os = "windows") {
        Ok(format!(
            r#"@echo off
echo Starting {}...
start "" "index.html"
"#,
            game_title
        ))
    } else {
        Ok(format!(
            r#"#!/bin/bash
echo "Starting {}..."
if command -v xdg-open > /dev/null; then
    xdg-open index.html
elif command -v open > /dev/null; then
    open index.html
else
    echo "Please open index.html in your web browser"
fi
"#,
            game_title
        ))
    }
}

fn create_export_readme(options: &ExportOptions) -> Result<String, String> {
    Ok(format!(
        r#"# GameGen Exported Game

This game was exported from GameGen in {} format.

## How to Run

### {format} Export
{instructions}

## System Requirements

- Modern web browser with HTML5 support
- JavaScript enabled

## Files Included

- `index.html` - Main game file
- `game.js` - Game engine and logic
- `assets/` - Game assets (images, audio, etc.)
- `README.md` - This file

## Troubleshooting

If the game doesn't start:
1. Make sure you're opening the files from a web server (not file://)
2. Check that your browser supports the required features
3. Open browser developer tools to check for errors

---

Created with GameGen - Pixel Art Game Creator
"#,
        options.format.to_uppercase(),
        format = options.format.to_uppercase(),
        instructions = match options.format.as_str() {
            "html5" | "webgl" => "Open `index.html` in your web browser.",
            "pwa" => "Serve the files from a web server and visit the URL. The game can be installed as a Progressive Web App.",
            "executable" => if cfg!(target_os = "windows") {
                "Run `game.bat` to start the game."
            } else {
                "Run `./game.sh` to start the game."
            },
            _ => "Follow the platform-specific instructions."
        }
    ))
}