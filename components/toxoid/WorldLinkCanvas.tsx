"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

const NAVBAR_HEIGHT = 64; // px

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __ASSET_BASE_PATH?: string;
    __GAME_HOST?: any;
    Module?: any;
  }

  interface Navigator {
    gpu?: {
      requestAdapter(): Promise<GPUAdapter | null>;
    };
  }

  interface GPUAdapter {
    info?: any;
    features?: any;
    limits?: any;
  }
}

type GraphicsAPI = "webgpu" | "webgl" | null;

// Custom SVG icons
const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zM5 10h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const CompressIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

// Detect mobile Safari (browser-safe)
const isMobileSafari = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;

  return (
    /iPad|iPhone|iPod/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome/.test(ua) &&
    !/CriOS/.test(ua) &&
    !/FxiOS/.test(ua)
  );
};

// Check if fullscreen API is supported (browser-safe)
const supportsFullscreen = () => {
  if (typeof document === "undefined") return false;

  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).webkitRequestFullscreen ||
    (document.documentElement as any).mozRequestFullScreen ||
    (document.documentElement as any).msRequestFullscreen
  );
};

interface WorldLinkCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  showFullscreenButton?: boolean;
  onReady?: (engine: any) => void;
  onError?: (error: string) => void;
  enableDebugMode?: boolean;
}

export default function WorldLinkCanvas({
  width = 1280,
  height = 720,
  className = "",
  showFullscreenButton = false,
  onReady,
  onError,
  enableDebugMode = false,
}: WorldLinkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState({
    isFullscreen: false,
    isLoading: true,
    error: "",
  });
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [containerHeight, setContainerHeight] = useState<string>(
    `calc(100vh - ${NAVBAR_HEIGHT}px)`,
  );
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  console.log("WorldLinkCanvas component rendered");

  // Calculate optimal canvas size based on container - use fixed size to prevent WebGPU errors
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) {
      return { width, height };
    }

    const container = containerRef.current;

    // Get container dimensions
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;

    if (isMobileSafari()) {
      // Mobile Safari specific handling
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const visualHeight = window.visualViewport
        ? window.visualViewport.height
        : windowHeight;

      console.log("🔍 Mobile Safari viewport debugging:", {
        windowInner: `${windowWidth}x${windowHeight}`,
        visualViewport: `${windowWidth}x${visualHeight}`,
        container: `${containerWidth}x${containerHeight}`,
      });

      containerWidth = Math.min(windowWidth, containerWidth);
      containerHeight = Math.min(visualHeight, containerHeight);
    }

    // Apply padding for safe areas and UI space
    const padding = isMobileSafari() ? 40 : 20;
    const availableWidth = Math.max(400, containerWidth - padding);
    const availableHeight = Math.max(300, containerHeight - padding);

    // Use fixed canvas size to prevent WebGPU render target mismatches
    // Only scale down if container is significantly smaller than target size
    const targetAspectRatio = width / height;
    const containerAspectRatio = availableWidth / availableHeight;

    let canvasWidth = width;
    let canvasHeight = height;

    // Set minimum canvas dimensions to prevent shrinking too much
    const minWidth = Math.min(800, width);
    const minHeight = Math.min(600, height);

    // Only scale down if the container is significantly smaller than our target size
    // and we have reliable container dimensions
    if (
      availableWidth > 0 &&
      availableHeight > 0 &&
      (availableWidth < width * 0.8 || availableHeight < height * 0.8)
    ) {
      if (containerAspectRatio > targetAspectRatio) {
        // Container is wider than target aspect ratio
        canvasHeight = Math.max(minHeight, availableHeight);
        canvasWidth = Math.max(minWidth, canvasHeight * targetAspectRatio);
      } else {
        // Container is taller than target aspect ratio
        canvasWidth = Math.max(minWidth, availableWidth);
        canvasHeight = Math.max(minHeight, canvasWidth / targetAspectRatio);
      }
    }

    const newSize = {
      width: Math.floor(canvasWidth),
      height: Math.floor(canvasHeight),
    };

    console.log("🎯 Canvas size calculated:", newSize);

    return newSize;
  }, [width, height]);

  // Update canvas size with debouncing - use longer delays to prevent constant resizing
  const updateCanvasSize = useCallback(() => {
    // Clear previous timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Use longer debounce to prevent WebGPU render target conflicts
    const debounceDelay = isMobileSafari() ? 500 : 300;

    resizeTimeoutRef.current = setTimeout(() => {
      const newSize = calculateCanvasSize();
      // Only update if size actually changed significantly
      const currentSize = canvasSize;
      const widthDiff = Math.abs(newSize.width - currentSize.width);
      const heightDiff = Math.abs(newSize.height - currentSize.height);

      if (widthDiff > 50 || heightDiff > 50) {
        console.log(
          "📏 Significant size change detected, updating canvas:",
          newSize,
        );
        setCanvasSize(newSize);
      }
    }, debounceDelay);
  }, [calculateCanvasSize, canvasSize]);

  // Effect to track canvas size state changes and force style updates
  useEffect(() => {
    const updateCanvasStyles = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;

        console.log("🎨 Forcing canvas style update:", canvasSize);
        canvas.style.width = `${canvasSize.width}px`;
        canvas.style.height = `${canvasSize.height}px`;
        console.log(
          "✅ Canvas styles applied:",
          canvas.style.width,
          "x",
          canvas.style.height,
        );
      }
    };

    updateCanvasStyles();
    const timeoutId = setTimeout(updateCanvasStyles, 100);

    return () => clearTimeout(timeoutId);
  }, [canvasSize]);

  // Effect to monitor and fix canvas style drift
  useEffect(() => {
    if (!canvasRef.current) return;

    // Disable style drift monitoring to prevent WebGPU render target conflicts
    // The WASM engine will handle its own canvas sizing
    console.log(
      "🎯 Canvas style monitoring disabled to prevent WebGPU conflicts",
    );

    return () => {
      // No cleanup needed since we're not using the observer
    };
  }, [canvasSize]);

  // Effect to track container ref availability
  useEffect(() => {
    const initCanvasSize = () => {
      if (containerRef.current) {
        console.log("📦 Container ready");
        updateCanvasSize();
      } else {
        setTimeout(() => {
          if (containerRef.current) {
            console.log("📦 Container ready (delayed)");
            updateCanvasSize();
          }
        }, 100);
      }
    };

    initCanvasSize();
  }, [updateCanvasSize]);

  // Handle fullscreen toggle and canvas resize
  const handleFullscreenChange = useCallback(() => {
    const isFullscreen = !!document.fullscreenElement;

    console.log("Fullscreen changed:", isFullscreen ? "entering" : "exiting");
    setGameState((prev) => ({ ...prev, isFullscreen }));
    setTimeout(updateCanvasSize, 100);
  }, [updateCanvasSize]);

  // Function to execute scripts via WASM
  const executeScriptViaWasm = useCallback(
    (scriptContent: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          // Check if WASM is loaded and scripting is available
          if (!window.__GAME_HOST) {
            reject(new Error("WASM module not loaded yet"));

            return;
          }

          // Try to execute through the dynamic script loader if available
          if (typeof window.__GAME_HOST._worldlink_eval_script === "function") {
            // Convert script to C string format
            const encoder = new TextEncoder();
            const scriptBytes = encoder.encode(scriptContent + "\0"); // Null-terminated

            // Allocate memory in WASM heap
            const scriptPtr = window.__GAME_HOST._r_alloc(scriptBytes.length);

            window.__GAME_HOST.HEAPU8.set(scriptBytes, scriptPtr);

            // Call the script execution function
            const resultPtr =
              window.__GAME_HOST._worldlink_eval_script(scriptPtr);

            // Free the input memory
            window.__GAME_HOST._r_free(scriptPtr);

            // Get the result
            if (resultPtr !== 0) {
              const result = window.__GAME_HOST.UTF8ToString(resultPtr);

              window.__GAME_HOST._worldlink_free_string(resultPtr);
              resolve(result);
            } else {
              resolve("Script executed successfully (no return value)");
            }
          } else {
            reject(
              new Error(
                "Script execution function not available in WASM module",
              ),
            );
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    [],
  );

  // Function to load and execute snake_game.js
  const loadSnakeGameScript = useCallback(async () => {
    console.log("[Auto-loader] Attempting to preload snake_game.js...");

    try {
      // Check if we have the assets directory structure
      const scriptPaths = [
        "/assets/scripts/examples/snake_game.js", // Correct path based on public directory
        "/snake_game.js", // Fallback to public root
        "/toxoid/snake_game.js", // Another fallback
      ];

      let scriptContent = null;
      let usedPath = null;

      // Try each path until we find the script
      for (const path of scriptPaths) {
        try {
          const response = await fetch(path);

          if (response.ok) {
            scriptContent = await response.text();
            usedPath = path;
            break;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          console.log(
            `[Auto-loader] Could not fetch from ${path}:`,
            errorMessage,
          );
        }
      }

      if (!scriptContent) {
        console.warn(
          "[Auto-loader] Could not find snake_game.js in any expected location",
        );

        return;
      }

      console.log(
        `[Auto-loader] Successfully fetched snake_game.js from ${usedPath}`,
      );

      // Execute the script via WASM
      const result = await executeScriptViaWasm(scriptContent);

      if (result.includes("error")) {
        console.error("[Auto-loader] Script execution error:", result);
      } else {
        console.log("[Auto-loader] snake_game.js loaded successfully!");
        console.log("[Auto-loader] Result:", result);
      }
    } catch (error) {
      console.error("[Auto-loader] Failed to auto-load snake_game.js:", error);
    }
  }, [executeScriptViaWasm]);

  // Main WASM initialization effect
  useEffect(() => {
    console.log("useEffect running - setting up canvas and WASM loading");

    const initializeGame = async () => {
      // Wait for canvas to be available and determine graphics API support
      const checkCanvasAndGraphicsSupport = () => {
        return new Promise<{
          canvas: HTMLCanvasElement;
          graphicsAPI: GraphicsAPI;
        }>((resolve, reject) => {
          const maxAttempts = 100;
          let attempts = 0;

          const check = async () => {
            if (canvasRef.current) {
              console.log("Canvas found:", canvasRef.current);

              // Test WebGPU support first
              if (navigator.gpu) {
                console.log("WebGPU API available, testing adapter...");
                try {
                  const adapter = await navigator.gpu.requestAdapter();

                  if (adapter) {
                    console.log("WebGPU adapter found successfully:", adapter);
                    resolve({
                      canvas: canvasRef.current!,
                      graphicsAPI: "webgpu",
                    });

                    return;
                  } else {
                    console.log(
                      "WebGPU adapter not available, falling back to WebGL...",
                    );
                  }
                } catch (error) {
                  console.log(
                    "WebGPU initialization failed, falling back to WebGL:",
                    error,
                  );
                }
              } else {
                console.log("WebGPU not supported, falling back to WebGL...");
              }

              // Test WebGL support as fallback
              const testCanvas = document.createElement("canvas");
              const webglContext =
                testCanvas.getContext("webgl2") ||
                testCanvas.getContext("webgl");

              if (webglContext) {
                console.log("WebGL support detected");
                resolve({ canvas: canvasRef.current!, graphicsAPI: "webgl" });

                return;
              } else {
                reject(
                  new Error(
                    "Neither WebGPU nor WebGL is supported on this device/browser. Please use a modern browser that supports at least WebGL (most browsers since 2012) or enable hardware acceleration in your browser settings.",
                  ),
                );

                return;
              }
            } else if (attempts < maxAttempts) {
              attempts++;
              console.log(
                `Waiting for canvas... attempt ${attempts}/${maxAttempts}`,
              );
              setTimeout(check, 50);
            } else {
              reject(new Error("Canvas not found after maximum attempts"));
            }
          };

          check();
        });
      };

      try {
        console.log(
          "Waiting for canvas to be ready and checking graphics support...",
        );
        const { canvas, graphicsAPI } = await checkCanvasAndGraphicsSupport();

        console.log(
          `Canvas is ready, using ${graphicsAPI?.toUpperCase()} graphics API`,
        );

        // Validate WebGL context before proceeding (especially for mobile)
        if (graphicsAPI === "webgl") {
          const testContext =
            canvas.getContext("webgl2") || canvas.getContext("webgl");

          if (!testContext) {
            throw new Error("Failed to get WebGL context after detection");
          }

          // Comprehensive WebGL error clearing and state reset
          console.log(
            "🔧 Performing comprehensive WebGL reset for mobile Safari...",
          );

          // Clear all WebGL errors
          let error;

          while ((error = testContext.getError()) !== testContext.NO_ERROR) {
            console.log("🚮 Cleared WebGL error:", error);
          }

          // Reset WebGL state to prevent sokol crashes
          testContext.bindBuffer(testContext.ARRAY_BUFFER, null);
          testContext.bindBuffer(testContext.ELEMENT_ARRAY_BUFFER, null);
          testContext.useProgram(null);
          testContext.bindTexture(testContext.TEXTURE_2D, null);
          testContext.bindTexture(testContext.TEXTURE_CUBE_MAP, null);
          testContext.bindFramebuffer(testContext.FRAMEBUFFER, null);
          testContext.bindRenderbuffer(testContext.RENDERBUFFER, null);

          // Set conservative defaults for mobile Safari
          testContext.disable(testContext.DEPTH_TEST);
          testContext.disable(testContext.STENCIL_TEST);
          testContext.disable(testContext.BLEND);
          testContext.disable(testContext.CULL_FACE);
          testContext.disable(testContext.SCISSOR_TEST);

          // Clear the canvas
          testContext.clearColor(0.0, 0.0, 0.0, 1.0);
          testContext.clear(testContext.COLOR_BUFFER_BIT);

          // Final error check
          error = testContext.getError();
          if (error !== testContext.NO_ERROR) {
            console.warn("⚠️ WebGL error after reset:", error);
          } else {
            console.log("✅ WebGL context reset successfully");
          }
        }

        // Set up asset path based on graphics API (use current public/ files)
        const baseUrl = window.location.origin;

        window.__ASSET_BASE_PATH = `${baseUrl}/assets`;
        console.log("Asset base path set to:", window.__ASSET_BASE_PATH);

        // Check if host.js exists in public directory
        console.log("Checking if /host.js exists...");
        const checkResponse = await fetch("/host.js");

        if (!checkResponse.ok) {
          throw new Error(
            `Host.js not found: ${checkResponse.status} ${checkResponse.statusText}`,
          );
        }
        console.log("host.js file confirmed to exist");

        // Load WASM module
        console.log(`Loading ${graphicsAPI?.toUpperCase()} WASM module...`);
        const script = document.createElement("script");

        script.type = "module";
        script.textContent = `
					import wasmModule from '/host.js';
					
					(async () => {
						try {
							console.log('Initializing WASM with canvas available...');
							
							// Get the canvas element
							const canvas = document.getElementById('worldlink-canvas');
							if (!canvas) {
								throw new Error('Canvas element not found during WASM initialization');
							}
							
							console.log('Found canvas element:', canvas);
							
							// Configure Module object for Emscripten WASM
							const moduleConfig = {
								canvas: canvas,
								print: console.log,
								printErr: console.error,
								locateFile: (path) => {
									console.log('Locating file:', path);
									if (path.endsWith('.wasm')) {
										return '/' + path;
									}
									return path;
								}
							};
							
							console.log('Module configuration:', moduleConfig);
							
							// Initialize WASM with proper configuration
							const wasmInstance = await wasmModule(moduleConfig);
							window.__GAME_HOST = wasmInstance;
							
							console.log('WASM instance created successfully:', wasmInstance);
							window.dispatchEvent(new CustomEvent('wasmLoaded'));
						} catch (error) {
							console.error('WASM initialization failed:', error);
							window.dispatchEvent(new CustomEvent('wasmError', { detail: error }));
						}
					})();
				`;

        // Event handlers
        const handleWasmLoaded = async () => {
          console.log("WASM loaded successfully");
          setGameState((prev) => ({ ...prev, isLoading: false }));

          // Re-apply canvas sizing after WASM loads
          setTimeout(() => {
            const newSize = calculateCanvasSize();

            setCanvasSize(newSize);

            // Force canvas style update for mobile Safari
            if (isMobileSafari() && canvasRef.current) {
              const canvas = canvasRef.current;

              canvas.style.width = `${newSize.width}px`;
              canvas.style.height = `${newSize.height}px`;
            }
          }, 200);

          // Auto-load snake_game.js after WASM initialization
          setTimeout(async () => {
            await loadSnakeGameScript();
          }, 2000); // Wait 2 seconds for full initialization

          // Call onReady callback if provided
          if (onReady && window.__GAME_HOST) {
            onReady(window.__GAME_HOST);
          }

          cleanup();
        };

        const handleWasmError = (event: Event) => {
          const customEvent = event as CustomEvent;

          console.error("WASM loading failed:", customEvent.detail);
          const errorMsg = customEvent.detail?.message || "Unknown WASM error";

          setGameState((prev) => ({
            ...prev,
            error: errorMsg,
            isLoading: false,
          }));

          if (onError) {
            onError(errorMsg);
          }

          cleanup();
        };

        const cleanup = () => {
          window.removeEventListener("wasmLoaded", handleWasmLoaded);
          window.removeEventListener("wasmError", handleWasmError);
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };

        window.addEventListener("wasmLoaded", handleWasmLoaded);
        window.addEventListener("wasmError", handleWasmError);

        document.head.appendChild(script);

        return cleanup;
      } catch (error) {
        console.error("Error in game initialization:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);

        setGameState((prev) => ({
          ...prev,
          error: errorMsg,
          isLoading: false,
        }));

        if (onError) {
          onError(errorMsg);
        }
      }
    };

    let cleanupFn: (() => void) | undefined;

    initializeGame()
      .then((cleanup) => {
        cleanupFn = cleanup;
      })
      .catch((error) => {
        console.error("Failed to initialize game:", error);
      });

    return () => {
      console.log("Cleaning up...");
      if (cleanupFn) {
        cleanupFn();
      }
      delete window.__ASSET_BASE_PATH;
      delete window.__GAME_HOST;
    };
  }, [calculateCanvasSize, onReady, onError]);

  // Effect for fullscreen handling and window resize
  useEffect(() => {
    console.log(
      "🔍 Mobile Safari:",
      isMobileSafari(),
      "Fullscreen supported:",
      supportsFullscreen(),
    );

    // Add error handler for WebGL crashes
    const handleWebGLError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("glGetError")) {
        console.error("🚨 WebGL error caught:", event.message);
        // Try to recover by reloading the page on mobile Safari
        if (isMobileSafari()) {
          console.log("🔄 Attempting to recover from WebGL error...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    };

    window.addEventListener("error", handleWebGLError);

    // Add proper viewport meta tag for mobile Safari if missing
    if (isMobileSafari()) {
      const existingViewport = document.querySelector('meta[name="viewport"]');

      if (existingViewport) {
        const content = existingViewport.getAttribute("content") || "";

        if (!content.includes("shrink-to-fit=no")) {
          existingViewport.setAttribute(
            "content",
            content + ", shrink-to-fit=no",
          );
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Reduce resize listeners to prevent WebGPU conflicts - only listen to major changes
    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("orientationchange", updateCanvasSize);

    // Minimal Mobile Safari event listeners
    if (isMobileSafari()) {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateCanvasSize);
      }
    }

    return () => {
      window.removeEventListener("error", handleWebGLError);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("orientationchange", updateCanvasSize);

      if (isMobileSafari()) {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", updateCanvasSize);
        }
      }

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleFullscreenChange, updateCanvasSize]);

  // Disable right-click context menu when game is active
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Add event listener to disable right-click
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      // Clean up event listener
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  console.log(
    "Current state - isLoading:",
    gameState.isLoading,
    "error:",
    gameState.error,
  );

  const toggleFullscreen = async () => {
    if (!containerRef.current || !showFullscreenButton) return;

    // Check if fullscreen is supported (not on mobile Safari)
    if (!supportsFullscreen()) {
      console.log("Fullscreen not supported on this device");

      return;
    }

    try {
      if (!gameState.isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  if (gameState.error) {
    return (
      <div
        className={`flex items-center justify-center text-red-500 ${className}`}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
        }}
      >
        <div className="text-center p-4">
          <h3 className="text-lg font-bold mb-2">
            Error Loading WorldLink Engine
          </h3>
          <p className="text-sm mb-4">{gameState.error}</p>
          <button
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${
        gameState.isFullscreen ? "fixed inset-0 z-50" : ""
      } ${className}`}
      style={{
        backgroundColor: "#11100E",
        width: "100%",
        height: gameState.isFullscreen ? "100vh" : "100%",
        minHeight: "400px",
      }}
    >
      {/* Loading Overlay */}
      {gameState.isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">
              Loading WorldLink Engine...
            </h3>
            <p className="text-sm text-white/60">Initializing game engine...</p>
          </div>
        </div>
      )}

      {/* Fullscreen Toggle Button */}
      {showFullscreenButton && (
        <GlassmorphicButton
          isIconOnly
          className={`absolute top-4 right-4 z-50 transition-opacity opacity-50 hover:opacity-100 ${!supportsFullscreen() ? "cursor-not-allowed opacity-30" : ""}`}
          disabled={!supportsFullscreen()}
          title={
            !supportsFullscreen()
              ? "Fullscreen not supported on this device"
              : gameState.isFullscreen
                ? "Exit Fullscreen"
                : "Enter Fullscreen"
          }
          variant="glass"
          onClick={toggleFullscreen}
        >
          {gameState.isFullscreen ? <CompressIcon /> : <ExpandIcon />}
        </GlassmorphicButton>
      )}

      {/* Canvas container with centering */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          className="border border-purple-400/30 rounded-lg"
          height={canvasSize.height}
          id="worldlink-canvas"
          style={{
            touchAction: "none",
            outline: "none",
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            display: "block",
            imageRendering: "pixelated",
            backgroundColor: "#000",
          }}
          tabIndex={1}
          width={canvasSize.width}
        />

        {/* Debug info overlay */}
        {enableDebugMode && !gameState.isLoading && !gameState.error && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs p-2 rounded">
            <div>
              Canvas: {canvasSize.width}×{canvasSize.height}
            </div>
            <div>Mobile Safari: {isMobileSafari() ? "Yes" : "No"}</div>
            <div>Fullscreen: {supportsFullscreen() ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
