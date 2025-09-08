/**
 * ToxoidEngine React Component
 *
 * A React wrapper for the Toxoid WASM game engine that provides:
 * - Automatic initialization and cleanup
 * - Canvas management
 * - Game state monitoring
 * - Script execution
 * - Error handling and loading states
 */

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ToxoidWasmLoader } from "@/lib/toxoid/wasm-loader";
import {
  ToxoidInputManager,
  initializeInput,
} from "@/lib/toxoid/input-manager";
import {
  ToxoidEngine as ToxoidEngineType,
  ToxoidInitConfig,
  ToxoidGameState,
} from "@/types/toxoid";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

// =============================================================================
// TYPES
// =============================================================================

export interface ToxoidEngineProps {
  width?: number;
  height?: number;
  className?: string;
  enableScripting?: boolean;
  debugMode?: boolean;
  autoStart?: boolean;
  initialScript?: string;
  onReady?: (engine: ToxoidEngineType) => void;
  onError?: (error: string) => void;
  onGameStateChange?: (state: ToxoidGameState) => void;
  onScriptError?: (error: string) => void;
}

export interface ToxoidEngineRef {
  getEngine(): ToxoidEngineType | null;
  getGameState(): ToxoidGameState;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  executeScript(code: string): Promise<boolean>;
  reset(): Promise<void>;
}

// =============================================================================
// LOADING COMPONENT
// =============================================================================

const LoadingOverlay: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div
    animate={{ opacity: 1 }}
    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10"
    exit={{ opacity: 0 }}
    initial={{ opacity: 0 }}
  >
    <div className="text-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full"
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      <div className="space-y-2">
        <div className="text-lg font-semibold">Loading Toxoid Engine</div>
        <div className="text-sm text-white/60">
          {progress < 0.2
            ? "Initializing WASM..."
            : progress < 0.6
              ? "Loading game engine..."
              : progress < 0.9
                ? "Setting up scripting..."
                : "Almost ready..."}
        </div>
      </div>

      <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="text-xs text-white/40">{Math.round(progress * 100)}%</div>
    </div>
  </motion.div>
);

// =============================================================================
// DEBUG OVERLAY COMPONENT
// =============================================================================

const DebugOverlay: React.FC<{ gameState: ToxoidGameState }> = ({
  gameState,
}) => (
  <div className="absolute top-2 left-2 space-y-1 z-20">
    <GlassmorphicBadge
      size="sm"
      variant={gameState.isRunning ? "success" : "danger"}
    >
      {gameState.isRunning
        ? gameState.isPaused
          ? "PAUSED"
          : "RUNNING"
        : "STOPPED"}
    </GlassmorphicBadge>

    <GlassmorphicBadge size="sm" variant="accent">
      FPS: {Math.round(gameState.fps)}
    </GlassmorphicBadge>

    <GlassmorphicBadge size="sm" variant="accent">
      Entities: {gameState.entityCount}
    </GlassmorphicBadge>

    <GlassmorphicBadge size="sm" variant="accent">
      Systems: {gameState.systemCount}
    </GlassmorphicBadge>

    <GlassmorphicBadge size="sm" variant="accent">
      Memory: {(gameState.memoryUsage / 1024 / 1024).toFixed(1)}MB
    </GlassmorphicBadge>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ToxoidEngine = forwardRef<ToxoidEngineRef, ToxoidEngineProps>(
  (
    {
      width = 640,
      height = 480,
      className = "",
      enableScripting = true,
      debugMode = process.env.NODE_ENV === "development",
      autoStart = false,
      initialScript = "",
      onReady,
      onError,
      onGameStateChange,
      onScriptError,
    },
    ref,
  ) => {
    // ==========================================================================
    // STATE
    // ==========================================================================

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ToxoidEngineType | null>(null);
    const loaderRef = useRef<ToxoidWasmLoader | null>(null);
    const inputManagerRef = useRef<ToxoidInputManager | null>(null);
    const gameLoopRef = useRef<number | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<ToxoidGameState>({
      isRunning: false,
      isPaused: false,
      fps: 0,
      frameTime: 0,
      entityCount: 0,
      systemCount: 0,
      memoryUsage: 0,
    });

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    const initializeEngine = useCallback(async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const config: ToxoidInitConfig = {
          canvas: canvasRef.current,
          width,
          height,
          enableScripting,
          debugMode,
          onReady: () => {
            const engine = ToxoidWasmLoader.getInstance().getEngine();

            engineRef.current = engine;

            // Initialize input manager
            if (canvasRef.current) {
              inputManagerRef.current = initializeInput(canvasRef.current);
              console.log("[ToxoidEngine] ✅ Input manager initialized");
            }

            if (engine && onReady) {
              onReady(engine);
            }

            // Execute initial script if provided
            if (initialScript && engine) {
              executeScript(initialScript).catch((err) => {
                const errorMsg = `Initial script error: ${err}`;

                setError(errorMsg);
                if (onScriptError) onScriptError(errorMsg);
              });
            }

            // Auto-start if requested
            if (autoStart && engine) {
              startGameLoop();
            }

            setIsLoading(false);
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setIsLoading(false);
            if (onError) onError(errorMsg);
          },
          onProgress: (progress) => {
            setLoadingProgress(progress);
          },
        };

        loaderRef.current = ToxoidWasmLoader.getInstance();
        await loaderRef.current.initialize(config);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        setError(errorMsg);
        setIsLoading(false);
        if (onError) onError(errorMsg);
      }
    }, [
      width,
      height,
      enableScripting,
      debugMode,
      autoStart,
      initialScript,
      onReady,
      onError,
      onScriptError,
    ]);

    // ==========================================================================
    // GAME LOOP
    // ==========================================================================

    const startGameLoop = useCallback(() => {
      if (!engineRef.current || !loaderRef.current) return;

      loaderRef.current.start();

      const loop = () => {
        if (!engineRef.current || !loaderRef.current) return;

        // Update input state
        if (inputManagerRef.current) {
          inputManagerRef.current.update();
        }

        const newGameState = loaderRef.current.getGameState();

        // Update FPS calculation (simplified)
        const now = performance.now();
        const deltaTime = (now - (gameLoopRef.current || now)) / 1000;

        newGameState.fps = deltaTime > 0 ? 1 / deltaTime : 60;
        newGameState.frameTime = deltaTime * 1000;

        setGameState(newGameState);

        if (onGameStateChange) {
          onGameStateChange(newGameState);
        }

        if (newGameState.isRunning && !newGameState.isPaused) {
          gameLoopRef.current = requestAnimationFrame(loop);
        }
      };

      gameLoopRef.current = requestAnimationFrame(loop);
    }, [onGameStateChange]);

    const stopGameLoop = useCallback(() => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }

      if (loaderRef.current) {
        loaderRef.current.stop();
      }
    }, []);

    // ==========================================================================
    // SCRIPT EXECUTION
    // ==========================================================================

    const executeScript = useCallback(
      async (code: string): Promise<boolean> => {
        if (!loaderRef.current) {
          throw new Error("Engine not initialized");
        }

        try {
          const result = await loaderRef.current.executeScript(code);

          if (!result && onScriptError) {
            onScriptError("Script execution failed");
          }

          return result;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Script error";

          if (onScriptError) onScriptError(errorMsg);
          throw error;
        }
      },
      [onScriptError],
    );

    // ==========================================================================
    // IMPERATIVE HANDLE
    // ==========================================================================

    useImperativeHandle(
      ref,
      () => ({
        getEngine: () => engineRef.current,
        getGameState: () => gameState,
        start: startGameLoop,
        stop: stopGameLoop,
        pause: () => loaderRef.current?.setPaused(true),
        resume: () => loaderRef.current?.setPaused(false),
        executeScript,
        reset: async () => {
          stopGameLoop();
          if (loaderRef.current) {
            loaderRef.current.destroy();
          }
          await initializeEngine();
        },
      }),
      [gameState, startGameLoop, stopGameLoop, executeScript, initializeEngine],
    );

    // ==========================================================================
    // EFFECTS
    // ==========================================================================

    // Initialize engine on mount
    useEffect(() => {
      initializeEngine();

      // Cleanup on unmount
      return () => {
        stopGameLoop();
        if (loaderRef.current) {
          loaderRef.current.destroy();
        }
        if (inputManagerRef.current) {
          inputManagerRef.current.destroy();
          inputManagerRef.current = null;
        }
      };
    }, [initializeEngine, stopGameLoop]);

    // Handle resize
    useEffect(() => {
      if (canvasRef.current && !isLoading) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    }, [width, height, isLoading]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (error) {
      return (
        <GlassmorphicCard className={`relative ${className}`} variant="accent-rose">
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[320px]">
            <div className="text-red-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Engine Error
            </h3>
            <p className="text-sm text-white/60 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
              onClick={initializeEngine}
            >
              Retry
            </button>
          </div>
        </GlassmorphicCard>
      );
    }

    return (
      <GlassmorphicCard
        className={`relative overflow-hidden ${className}`}
        variant="strong"
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          height={height}
          style={{
            imageRendering: "crisp-edges",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          width={width}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && <LoadingOverlay progress={loadingProgress} />}
        </AnimatePresence>

        {/* Debug Overlay */}
        {debugMode && !isLoading && !error && (
          <DebugOverlay gameState={gameState} />
        )}

        {/* Game Status Indicator */}
        {!isLoading && !error && gameState.isRunning && (
          <motion.div
            animate={{ opacity: [1, 0.3] }}
            className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full z-20"
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        )}
      </GlassmorphicCard>
    );
  },
);

ToxoidEngine.displayName = "ToxoidEngine";

export default ToxoidEngine;
