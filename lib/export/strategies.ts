// Export Platform Strategies
// Platform-specific export implementations for different target platforms

import type {
  ExportJob,
  ExportArtifact,
  ExportPlatform,
  PlatformConfigData,
  ExportOptions,
} from "@/types/export";
import type { Tables } from "@/lib/supabase/database.types";

// Base export strategy interface
export interface ExportStrategy {
  platform: ExportPlatform;
  execute(
    job: ExportJob,
    gameData: Tables<"games">,
    config: PlatformConfigData,
  ): Promise<ExportResult>;
  validate(
    job: ExportJob,
    gameData: Tables<"games">,
  ): Promise<ValidationResult>;
  getEstimatedTime(gameData: Tables<"games">): number; // in minutes
  getEstimatedSize(gameData: Tables<"games">): number; // in MB
}

export interface ExportResult {
  success: boolean;
  artifacts: Omit<
    ExportArtifact,
    "id" | "export_job_id" | "created_at" | "updated_at"
  >[];
  buildLog: string;
  buildSizeBytes: number;
  error?: {
    message: string;
    details?: any;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Web platform export strategy
export class WebExportStrategy implements ExportStrategy {
  platform: ExportPlatform = "web";

  async execute(
    job: ExportJob,
    gameData: Tables<"games">,
    config: PlatformConfigData,
  ): Promise<ExportResult> {
    const buildLog: string[] = [];

    buildLog.push(
      `[${new Date().toISOString()}] Starting web export for game: ${gameData.title}`,
    );

    try {
      // Extract game data and assets
      buildLog.push("Extracting game assets and configuration...");
      const gameConfig = this.extractGameConfiguration(gameData);
      const assets = this.extractGameAssets(gameData);

      // Generate HTML5 bundle
      buildLog.push("Generating HTML5 game bundle...");
      const htmlBundle = await this.generateHTMLBundle(
        gameConfig,
        assets,
        config,
      );

      // Apply optimizations
      buildLog.push("Applying web optimizations...");
      const optimizedBundle = await this.applyOptimizations(
        htmlBundle,
        config,
        job.export_options,
      );

      // Create artifacts
      buildLog.push("Creating export artifacts...");
      const artifacts = await this.createWebArtifacts(optimizedBundle, config);

      buildLog.push("Web export completed successfully");

      return {
        success: true,
        artifacts,
        buildLog: buildLog.join("\n"),
        buildSizeBytes: artifacts.reduce(
          (sum, artifact) => sum + artifact.file_size_bytes,
          0,
        ),
      };
    } catch (error: any) {
      buildLog.push(`Error during web export: ${error.message}`);

      return {
        success: false,
        artifacts: [],
        buildLog: buildLog.join("\n"),
        buildSizeBytes: 0,
        error: {
          message: error.message,
          details: error,
        },
      };
    }
  }

  async validate(
    job: ExportJob,
    gameData: Tables<"games">,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check game data completeness
    if (!gameData.game_data || Object.keys(gameData.game_data).length === 0) {
      errors.push("Game data is empty or missing");
    }

    // Check for required assets
    if (!gameData.thumbnail_url) {
      warnings.push("No thumbnail image provided - default will be used");
    }

    // Validate export options
    const webOptions = job.export_options?.web_options;

    if (
      webOptions?.analytics_tracking_id &&
      !this.isValidAnalyticsId(webOptions.analytics_tracking_id)
    ) {
      errors.push("Invalid analytics tracking ID format");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getEstimatedTime(gameData: Tables<"games">): number {
    const baseTime = 2; // 2 minutes base
    const assetCount = gameData.screenshot_urls?.length || 0;

    return baseTime + Math.ceil(assetCount / 10); // +1 min per 10 assets
  }

  getEstimatedSize(gameData: Tables<"games">): number {
    const baseSize = 3; // 3MB base
    const assetEstimate = (gameData.screenshot_urls?.length || 0) * 0.5; // 0.5MB per asset

    return baseSize + assetEstimate;
  }

  private extractGameConfiguration(gameData: Tables<"games">): any {
    return {
      title: gameData.title,
      description: gameData.description,
      gameData: gameData.game_data,
      genre: gameData.genre,
      tags: gameData.tags,
    };
  }

  private extractGameAssets(gameData: Tables<"games">): any[] {
    return [
      { type: "thumbnail", url: gameData.thumbnail_url },
      ...gameData.screenshot_urls.map((url) => ({ type: "screenshot", url })),
    ].filter((asset) => asset.url);
  }

  private async generateHTMLBundle(
    gameConfig: any,
    assets: any[],
    config: PlatformConfigData,
  ): Promise<any> {
    // This would integrate with the actual game engine (Toxoid WASM)
    return {
      html: this.generateHTML(gameConfig, config),
      css: this.generateCSS(gameConfig, config),
      js: this.generateJavaScript(gameConfig, config),
      assets: assets,
      manifest: config.features?.offline_support
        ? this.generateWebManifest(gameConfig)
        : null,
    };
  }

  private generateHTML(gameConfig: any, config: PlatformConfigData): string {
    const customBranding = config.custom_branding || {};

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${customBranding.company_name ? `${gameConfig.title} - ${customBranding.company_name}` : gameConfig.title}</title>
    <meta name="description" content="${gameConfig.description || "A game created with GameGen"}">
    ${customBranding.custom_favicon ? `<link rel="icon" href="${customBranding.custom_favicon}">` : '<link rel="icon" href="/favicon.ico">'}
    <link rel="stylesheet" href="style.css">
    ${config.manifest ? '<link rel="manifest" href="manifest.json">' : ""}
</head>
<body>
    <div id="game-container">
        <div id="loading-screen" ${customBranding.custom_loading_screen ? `style="background-image: url('${customBranding.custom_loading_screen}')"` : ""}>
            <div class="loading-spinner"></div>
            <p>Loading ${gameConfig.title}...</p>
        </div>
        <canvas id="game-canvas"></canvas>
        <div id="game-ui"></div>
    </div>
    ${!customBranding.remove_gamegen_branding ? '<div class="gamegen-branding">Created with <a href="https://gamegen.com" target="_blank">GameGen</a></div>' : ""}
    <script src="game.js"></script>
</body>
</html>`;
  }

  private generateCSS(gameConfig: any, config: PlatformConfigData): string {
    const customBranding = config.custom_branding || {};
    const primaryColor = customBranding.primary_color || "#007bff";
    const secondaryColor = customBranding.secondary_color || "#6c757d";

    return `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

#game-container {
    max-width: 100vw;
    max-height: 100vh;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

#game-canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    background: #000;
}

#loading-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2em;
    transition: opacity 0.5s ease-out;
}

#loading-screen.hidden {
    opacity: 0;
    pointer-events: none;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.gamegen-branding {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 0.8em;
    opacity: 0.7;
}

.gamegen-branding a {
    color: ${primaryColor};
    text-decoration: none;
}

/* Responsive design */
@media (max-width: 768px) {
    body {
        padding: 0;
    }
    
    #game-container {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
    }
    
    .gamegen-branding {
        display: none;
    }
}
`;
  }

  private generateJavaScript(
    gameConfig: any,
    config: PlatformConfigData,
  ): string {
    return `
// GameGen Web Export Runtime
class GameGenWebRuntime {
    constructor(config) {
        this.config = config;
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.isLoaded = false;
        
        this.init();
    }
    
    async init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Load game
        await this.loadGame();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        
        // Start game loop
        this.startGameLoop();
        
        console.log('Game loaded successfully');
    }
    
    async loadGame() {
        // This would integrate with Toxoid WASM engine
        // For now, we'll create a simple placeholder
        
        console.log('Loading game data:', this.config);
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.isLoaded = true;
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Maintain aspect ratio (16:9 default)
        const aspectRatio = 16 / 9;
        let width = rect.width;
        let height = width / aspectRatio;
        
        if (height > rect.height) {
            height = rect.height;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }
    
    startGameLoop() {
        const loop = (timestamp) => {
            if (this.isLoaded) {
                this.update(timestamp);
                this.render();
            }
            
            this.gameLoop = requestAnimationFrame(loop);
        };
        
        this.gameLoop = requestAnimationFrame(loop);
    }
    
    update(timestamp) {
        // Game update logic would go here
        // This would integrate with the actual game engine
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game placeholder
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.config.title || 'GameGen Game',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
            'Game running in web export mode',
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );
    }
    
    destroy() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const gameConfig = ${JSON.stringify(gameConfig, null, 2)};
    window.gameRuntime = new GameGenWebRuntime(gameConfig);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.gameRuntime) {
        if (document.hidden) {
            // Pause game when tab is not visible
            console.log('Game paused');
        } else {
            // Resume game when tab becomes visible
            console.log('Game resumed');
        }
    }
});
`;
  }

  private generateWebManifest(gameConfig: any): any {
    return {
      name: gameConfig.title,
      short_name: gameConfig.title.substring(0, 12),
      description: gameConfig.description || "A game created with GameGen",
      start_url: "/",
      display: "fullscreen",
      background_color: "#1a1a1a",
      theme_color: "#007bff",
      icons: [
        {
          src: gameConfig.thumbnail || "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: gameConfig.thumbnail || "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };
  }

  private async applyOptimizations(
    bundle: any,
    config: PlatformConfigData,
    exportOptions?: ExportOptions,
  ): Promise<any> {
    // Apply minification if enabled
    if (config.minify) {
      bundle.js = this.minifyJS(bundle.js);
      bundle.css = this.minifyCSS(bundle.css);
      bundle.html = this.minifyHTML(bundle.html);
    }

    // Apply compression
    if (config.compression === "gzip" || config.compression === "brotli") {
      // In a real implementation, this would compress files
      console.log(`Applying ${config.compression} compression`);
    }

    return bundle;
  }

  private async createWebArtifacts(
    bundle: any,
    config: PlatformConfigData,
  ): Promise<
    Omit<ExportArtifact, "id" | "export_job_id" | "created_at" | "updated_at">[]
  > {
    const artifacts: Omit<
      ExportArtifact,
      "id" | "export_job_id" | "created_at" | "updated_at"
    >[] = [];

    // Main HTML file
    artifacts.push({
      file_name: "index.html",
      file_path: "/web-export/index.html",
      file_size_bytes: Buffer.byteLength(bundle.html, "utf8"),
      content_type: "text/html",
      checksum_md5: this.generateChecksum(bundle.html),
      storage_provider: "supabase",
      storage_url: "/storage/exports/web/index.html",
      public_url: undefined,
      download_count: 0,
      download_expires_at: undefined,
    });

    // CSS file
    artifacts.push({
      file_name: "style.css",
      file_path: "/web-export/style.css",
      file_size_bytes: Buffer.byteLength(bundle.css, "utf8"),
      content_type: "text/css",
      checksum_md5: this.generateChecksum(bundle.css),
      storage_provider: "supabase",
      storage_url: "/storage/exports/web/style.css",
      public_url: undefined,
      download_count: 0,
      download_expires_at: undefined,
    });

    // JavaScript file
    artifacts.push({
      file_name: "game.js",
      file_path: "/web-export/game.js",
      file_size_bytes: Buffer.byteLength(bundle.js, "utf8"),
      content_type: "application/javascript",
      checksum_md5: this.generateChecksum(bundle.js),
      storage_provider: "supabase",
      storage_url: "/storage/exports/web/game.js",
      public_url: undefined,
      download_count: 0,
      download_expires_at: undefined,
    });

    // Manifest file (if PWA)
    if (bundle.manifest) {
      const manifestJson = JSON.stringify(bundle.manifest, null, 2);

      artifacts.push({
        file_name: "manifest.json",
        file_path: "/web-export/manifest.json",
        file_size_bytes: Buffer.byteLength(manifestJson, "utf8"),
        content_type: "application/json",
        checksum_md5: this.generateChecksum(manifestJson),
        storage_provider: "supabase",
        storage_url: "/storage/exports/web/manifest.json",
        public_url: undefined,
        download_count: 0,
        download_expires_at: undefined,
      });
    }

    return artifacts;
  }

  private minifyJS(js: string): string {
    // Simple minification - in production, use a proper minifier
    return js
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
  }

  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/;\s*}/g, "}") // Remove semicolon before closing brace
      .trim();
  }

  private minifyHTML(html: string): string {
    return html
      .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .trim();
  }

  protected generateChecksum(content: string): string {
    // Simple checksum - in production, use crypto.createHash
    let hash = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);

      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  private isValidAnalyticsId(id: string): boolean {
    return /^G-[A-Z0-9]+$/.test(id) || /^UA-\d+-\d+$/.test(id);
  }
}

// PWA Export Strategy (extends Web)
export class PWAExportStrategy extends WebExportStrategy {
  platform: ExportPlatform = "pwa";

  async execute(
    job: ExportJob,
    gameData: Tables<"games">,
    config: PlatformConfigData,
  ): Promise<ExportResult> {
    const result = await super.execute(job, gameData, config);

    if (result.success) {
      // Add PWA-specific artifacts
      const serviceWorkerContent = this.generateServiceWorker(gameData, config);
      const swArtifact: Omit<
        ExportArtifact,
        "id" | "export_job_id" | "created_at" | "updated_at"
      > = {
        file_name: "sw.js",
        file_path: "/pwa-export/sw.js",
        file_size_bytes: Buffer.byteLength(serviceWorkerContent, "utf8"),
        content_type: "application/javascript",
        checksum_md5: this.generateChecksum(serviceWorkerContent),
        storage_provider: "supabase",
        storage_url: "/storage/exports/pwa/sw.js",
        public_url: undefined,
        download_count: 0,
        download_expires_at: undefined,
      };

      result.artifacts.push(swArtifact);
      result.buildSizeBytes += swArtifact.file_size_bytes;
    }

    return result;
  }

  private generateServiceWorker(
    gameData: Tables<"games">,
    config: PlatformConfigData,
  ): string {
    return `
// GameGen PWA Service Worker
const CACHE_NAME = 'gamegen-${gameData.id}-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
  }
}

// Export strategy factory
export class ExportStrategyFactory {
  private static strategies: Map<ExportPlatform, ExportStrategy> = new Map([
    ["web", new WebExportStrategy()],
    ["pwa", new PWAExportStrategy()],
    // Additional strategies would be added here
  ]);

  static getStrategy(platform: ExportPlatform): ExportStrategy {
    const strategy = this.strategies.get(platform);

    if (!strategy) {
      throw new Error(`No export strategy found for platform: ${platform}`);
    }

    return strategy;
  }

  static getSupportedPlatforms(): ExportPlatform[] {
    return Array.from(this.strategies.keys());
  }
}

// Desktop export strategy placeholder (would need Electron integration)
export class DesktopExportStrategy implements ExportStrategy {
  constructor(public platform: ExportPlatform) {}

  async execute(
    job: ExportJob,
    gameData: Tables<"games">,
    config: PlatformConfigData,
  ): Promise<ExportResult> {
    // Desktop export would require Electron packaging
    return {
      success: false,
      artifacts: [],
      buildLog: "Desktop export not yet implemented",
      buildSizeBytes: 0,
      error: {
        message: "Desktop export strategy not implemented",
      },
    };
  }

  async validate(
    job: ExportJob,
    gameData: Tables<"games">,
  ): Promise<ValidationResult> {
    return {
      valid: false,
      errors: ["Desktop export not yet implemented"],
      warnings: [],
    };
  }

  getEstimatedTime(gameData: Tables<"games">): number {
    return 10; // 10 minutes estimated
  }

  getEstimatedSize(gameData: Tables<"games">): number {
    return 150; // 150MB estimated
  }
}
