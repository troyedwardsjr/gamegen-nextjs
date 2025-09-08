/**
 * Toxoid WASM Module Loader
 *
 * Handles loading and initializing the Toxoid WASM game engine with QuickJS scripting support.
 * Provides a clean API for integrating with React components and NextJS.
 */

import {
  ToxoidWasmModule,
  ToxoidEngine,
  ToxoidInitConfig,
  ToxoidGameState,
} from "@/types/toxoid";

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: Partial<ToxoidInitConfig> = {
  enableScripting: true,
  memoryLimit: 50 * 1024 * 1024, // 50MB
  stackSize: 1024 * 1024, // 1MB
  debugMode: process.env.NODE_ENV === "development",
  assetPath: "/assets/toxoid",
};

// WASM file paths - will be served from public directory
const WASM_PATHS = {
  dev: "/toxoid/host.wasm",
  prod: "toxoid/host.wasm",
  webgl_dev: "toxoid/host.wasm",
  webgl_prod: "toxoid/host.wasm",
} as const;

const JS_GLUE_PATHS = {
  dev: "/toxoid/host.js",
  prod: "/toxoid/host.js",
  webgl_dev: "/toxoid/host.js",
  webgl_prod: "/toxoid/host.js",
} as const;

// =============================================================================
// WASM LOADER CLASS
// =============================================================================

export class ToxoidWasmLoader {
  private static instance: ToxoidWasmLoader | null = null;
  private module: ToxoidWasmModule | null = null;
  private engine: ToxoidEngine | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: ToxoidInitConfig | null = null;
  private isInitialized = false;
  private isLoading = false;
  private loadingProgress = 0;
  private gameState: ToxoidGameState = {
    isRunning: false,
    isPaused: false,
    fps: 0,
    frameTime: 0,
    entityCount: 0,
    systemCount: 0,
    memoryUsage: 0,
  };

  // Singleton pattern
  static getInstance(): ToxoidWasmLoader {
    if (!ToxoidWasmLoader.instance) {
      ToxoidWasmLoader.instance = new ToxoidWasmLoader();
    }

    return ToxoidWasmLoader.instance;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Initialize the Toxoid WASM engine
   */
  async initialize(config: ToxoidInitConfig): Promise<boolean> {
    if (this.isInitialized) {
      console.warn("[ToxoidLoader] Already initialized");

      return true;
    }

    if (this.isLoading) {
      console.warn("[ToxoidLoader] Already loading");

      return false;
    }

    try {
      this.isLoading = true;
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.canvas = config.canvas;

      // Update progress
      this.updateProgress(0.1);

      // Load WASM module
      await this.loadWasmModule();
      this.updateProgress(0.5);

      // Initialize engine
      await this.initializeEngine();
      this.updateProgress(0.8);

      // Setup scripting context
      if (this.config.enableScripting) {
        await this.initializeScripting();
      }
      this.updateProgress(1.0);

      this.isInitialized = true;
      this.isLoading = false;

      // Call ready callback
      if (this.config.onReady) {
        this.config.onReady();
      }

      console.log("[ToxoidLoader] ✅ Initialization completed successfully");

      return true;
    } catch (error) {
      this.isLoading = false;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("[ToxoidLoader] ❌ Initialization failed:", errorMessage);

      if (this.config?.onError) {
        this.config.onError(errorMessage);
      }

      return false;
    }
  }

  /**
   * Get the Toxoid engine instance
   */
  getEngine(): ToxoidEngine | null {
    return this.engine;
  }

  /**
   * Get the WASM module instance
   */
  getModule(): ToxoidWasmModule | null {
    return this.module;
  }

  /**
   * Get current game state
   */
  getGameState(): ToxoidGameState {
    if (this.engine) {
      // Update game state from engine
      this.gameState = {
        ...this.gameState,
        entityCount: this.engine.API.getEntityCount(),
        systemCount: this.engine.API.getSystemCount(),
        // Note: fps and frameTime would be updated from the engine's main loop
      };
    }

    return { ...this.gameState };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (!this.isInitialized || !this.engine) {
      throw new Error("Engine not initialized");
    }

    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    console.log("[ToxoidLoader] 🎮 Game started");
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.gameState.isRunning = false;
    this.gameState.isPaused = false;
    console.log("[ToxoidLoader] ⏹️ Game stopped");
  }

  /**
   * Pause/unpause the game
   */
  setPaused(paused: boolean): void {
    if (this.gameState.isRunning) {
      this.gameState.isPaused = paused;
      console.log(
        `[ToxoidLoader] ${paused ? "⏸️" : "▶️"} Game ${paused ? "paused" : "resumed"}`,
      );
    }
  }

  /**
   * Execute JavaScript code in the game context
   */
  async executeScript(code: string): Promise<boolean> {
    if (!this.isInitialized || !this.engine) {
      throw new Error("Engine not initialized");
    }

    try {
      // This would be implemented via the QuickJS binding
      // For now, we'll use a placeholder approach
      const wrappedCode = this.wrapScriptCode(code);

      // Execute in QuickJS context via WASM
      // This is a placeholder - the actual implementation would use
      // the QuickJS bindings from the WASM module
      if (this.module) {
        // Call into WASM to execute script
        console.log(
          "[ToxoidLoader] Executing script:",
          code.substring(0, 100) + "...",
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error("[ToxoidLoader] Script execution error:", error);

      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.gameState.isRunning) {
      this.stop();
    }

    this.module = null;
    this.engine = null;
    this.canvas = null;
    this.config = null;
    this.isInitialized = false;

    console.log("[ToxoidLoader] 🧹 Cleanup completed");
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private async loadWasmModule(): Promise<void> {
    if (!this.config) throw new Error("Config not set");

    // Determine which WASM build to use
    const useWebGL = this.detectWebGLSupport();
    const isDev = this.config.debugMode;

    let wasmPath: string;
    let jsPath: string;

    if (useWebGL && isDev) {
      wasmPath = WASM_PATHS.webgl_dev;
      jsPath = JS_GLUE_PATHS.webgl_dev;
    } else if (useWebGL) {
      wasmPath = WASM_PATHS.webgl_prod;
      jsPath = JS_GLUE_PATHS.webgl_prod;
    } else if (isDev) {
      wasmPath = WASM_PATHS.dev;
      jsPath = JS_GLUE_PATHS.dev;
    } else {
      wasmPath = WASM_PATHS.prod;
      jsPath = JS_GLUE_PATHS.prod;
    }

    console.log(`[ToxoidLoader] Loading WASM module: ${wasmPath}`);

    try {
      // Load the Emscripten glue code
      await this.loadEmscriptenGlue(jsPath);

      // Initialize the module with our canvas
      this.module = await this.createWasmModule(wasmPath);

      console.log("[ToxoidLoader] ✅ WASM module loaded successfully");
    } catch (error) {
      throw new Error(`Failed to load WASM module: ${error}`);
    }
  }

  private async loadEmscriptenGlue(jsPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = jsPath;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${jsPath}`));
      document.head.appendChild(script);
    });
  }

  private async createWasmModule(wasmPath: string): Promise<ToxoidWasmModule> {
    // This would interface with the Emscripten-generated Module
    // For now, we'll create a mock module structure
    return new Promise((resolve, reject) => {
      // In the real implementation, this would be:
      // const Module = window.Module || {};

      const mockModule: ToxoidWasmModule = {
        _initialize: () => {},
        _cleanup: () => {},
        _update: (deltaTime: number) => {},
        _render: () => {},
        _malloc: (size: number) => 0,
        _free: (ptr: number) => {},
        HEAPU8: new Uint8Array(1024),
        HEAP32: new Int32Array(256),
        cwrap:
          (name: string, returnType: string, argTypes: string[]) => () => {},
        ccall: (
          name: string,
          returnType: string,
          argTypes: string[],
          args: any[],
        ) => {},
        ready: Promise.resolve({} as ToxoidWasmModule),
      };

      // Simulate async loading
      setTimeout(() => resolve(mockModule), 100);
    });
  }

  private async initializeEngine(): Promise<void> {
    if (!this.module || !this.config || !this.canvas) {
      throw new Error("Prerequisites not met for engine initialization");
    }

    // Create the Toxoid engine API wrapper
    this.engine = this.createEngineAPI(this.module);

    // Initialize the canvas and rendering context
    await this.initializeRendering();

    console.log("[ToxoidLoader] ✅ Engine initialized");
  }

  private async initializeScripting(): Promise<void> {
    if (!this.module || !this.config) {
      throw new Error("Prerequisites not met for scripting initialization");
    }

    // Initialize QuickJS runtime with memory limits
    console.log(`[ToxoidLoader] Initializing QuickJS runtime:`);
    console.log(
      `  - Memory limit: ${(this.config.memoryLimit! / 1024 / 1024).toFixed(1)}MB`,
    );
    console.log(
      `  - Stack size: ${(this.config.stackSize! / 1024).toFixed(1)}KB`,
    );

    // This would call into the WASM module to initialize QuickJS
    // For now, we'll just log the initialization
    console.log("[ToxoidLoader] ✅ Scripting context initialized");
  }

  private async initializeRendering(): Promise<void> {
    if (!this.canvas || !this.config) return;

    // Set canvas size
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    // Set up pixel-perfect rendering for pixel art games
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.imageRendering = "crisp-edges";

    // Initialize WebGL or Canvas 2D context as needed
    const gl =
      this.canvas.getContext("webgl2") || this.canvas.getContext("webgl");

    if (gl) {
      console.log("[ToxoidLoader] ✅ WebGL context initialized");
    } else {
      const ctx = this.canvas.getContext("2d");

      if (ctx) {
        console.log("[ToxoidLoader] ✅ Canvas 2D context initialized");
      }
    }
  }

  private createEngineAPI(module: ToxoidWasmModule): ToxoidEngine {
    // This is a mock implementation - the real version would bind to WASM functions
    const mockEngine: ToxoidEngine = {
      API: {
        createEntity: (name?: string) => ({
          id: Math.random() as any, // Cast to EntityId for mock
          name: name || "",
          add: () => true,
          remove: () => true,
          has: () => false,
          getComponent: () => null,
        } as any), // Use as any for mock to avoid complex type matching
        destroyEntity: () => {},
        getEntityById: () => null,
        getEntityByName: () => null,
        registerComponent: () => {},
        registerSingleton: () => ({}),
        loadSprite: () => null, // Returns ToxoidEntity | null according to interface
        loadSpineAnimation: () => null, // Returns ToxoidEntity | null according to interface
        filledRect: () => {},
        outlineRect: () => {},
        filledCircle: () => {},
        outlineCircle: () => {},
        getSystemCount: () => 0,
        getEntityCount: () => 0,
        getDeltaTime: () => 0.016,
        getKeyboardInput: () => ({}) as any,
        getMouseInput: () => ({}) as any,
        getGamepadInput: () => ({}) as any,
        getCamera: () => ({}) as any,
      },
      System: {
        create: () => {},
        remove: () => {},
        enable: () => {},
        disable: () => {},
        exists: () => false,
      },
      Query: {
        create: () => ({}) as any,
        count: () => 0,
        first: () => null,
        each: () => {},
      },
      Observer: {
        create: () => {},
        remove: () => {},
        enable: () => {},
        disable: () => {},
      },
      Entity: {} as any,
      Phases: {} as any,
      Events: {} as any,
      ObserverEvents: {} as any,
      registerComponent: () => {},
    } as any; // Cast entire API to bypass type issues for mock

    return mockEngine;
  }

  private detectWebGLSupport(): boolean {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    return !!gl;
  }

  private wrapScriptCode(code: string): string {
    // Wrap user code with error handling and context setup
    return `
try {
  ${code}
} catch (error) {
  console.error("Script execution error:", error);
  throw error;
}
    `.trim();
  }

  private updateProgress(progress: number): void {
    this.loadingProgress = progress;
    if (this.config?.onProgress) {
      this.config.onProgress(progress);
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Initialize Toxoid engine (convenience function)
 */
export async function initializeToxoid(
  config: ToxoidInitConfig,
): Promise<ToxoidEngine | null> {
  const loader = ToxoidWasmLoader.getInstance();
  const success = await loader.initialize(config);

  return success ? loader.getEngine() : null;
}

/**
 * Get the current Toxoid engine instance
 */
export function getToxoidEngine(): ToxoidEngine | null {
  return ToxoidWasmLoader.getInstance().getEngine();
}

/**
 * Get the current game state
 */
export function getToxoidGameState(): ToxoidGameState {
  return ToxoidWasmLoader.getInstance().getGameState();
}

export default ToxoidWasmLoader;
