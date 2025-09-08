/**
 * Toxoid Input Management System
 *
 * Handles all input events for the Toxoid game engine including:
 * - Keyboard input with key state tracking
 * - Mouse input with position and button states
 * - Touch input for mobile devices
 * - Gamepad support for controllers
 * - Input event forwarding to WASM engine
 */

import {
  KeyboardInputSingleton,
  MouseInputSingleton,
  GamepadInputSingleton,
} from "@/types/toxoid";

// =============================================================================
// INPUT STATE INTERFACES
// =============================================================================

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  pressure: number;
}

interface InputState {
  keyboard: KeyboardInputSingleton;
  mouse: MouseInputSingleton;
  gamepad: GamepadInputSingleton;
  touch: {
    points: TouchPoint[];
    isSupported: boolean;
  };
}

// =============================================================================
// KEY MAPPINGS
// =============================================================================

const KEY_MAPPINGS = {
  // Arrow keys
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",

  // WASD
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",

  // Common game keys
  Space: "space",
  ShiftLeft: "shift",
  ShiftRight: "shift",
  ControlLeft: "ctrl",
  ControlRight: "ctrl",
  AltLeft: "alt",
  AltRight: "alt",
  Enter: "enter",
  Escape: "escape",
  Tab: "tab",

  // Number keys
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",

  // Letter keys (for completeness)
  KeyQ: "q",
  KeyE: "e",
  KeyR: "r",
  KeyT: "t",
  KeyY: "y",
  KeyU: "u",
  KeyI: "i",
  KeyO: "o",
  KeyP: "p",
  KeyF: "f",
  KeyG: "g",
  KeyH: "h",
  KeyJ: "j",
  KeyK: "k",
  KeyL: "l",
  KeyZ: "z",
  KeyX: "x",
  KeyC: "c",
  KeyV: "v",
  KeyB: "b",
  KeyN: "n",
  KeyM: "m",
} as const;

// =============================================================================
// INPUT MANAGER CLASS
// =============================================================================

export class ToxoidInputManager {
  private canvas: HTMLCanvasElement | null = null;
  private inputState: InputState;
  private previousInputState: InputState;
  private eventListeners: Map<string, EventListener> = new Map();
  private isActive = false;

  constructor() {
    this.inputState = this.createDefaultInputState();
    this.previousInputState = this.createDefaultInputState();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize the input manager with a canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupEventListeners();
    this.detectInputSupport();
    this.isActive = true;

    console.log("[ToxoidInput] ✅ Input manager initialized");
    console.log(
      "[ToxoidInput] Touch support:",
      this.inputState.touch.isSupported,
    );
    console.log(
      "[ToxoidInput] Gamepad support:",
      navigator.getGamepads !== undefined,
    );
  }

  /**
   * Clean up event listeners and resources
   */
  destroy(): void {
    this.removeEventListeners();
    this.canvas = null;
    this.isActive = false;
    console.log("[ToxoidInput] 🧹 Input manager destroyed");
  }

  // ==========================================================================
  // INPUT STATE ACCESS
  // ==========================================================================

  /**
   * Get current keyboard input state
   */
  getKeyboardInput(): KeyboardInputSingleton {
    return { ...this.inputState.keyboard };
  }

  /**
   * Get current mouse input state
   */
  getMouseInput(): MouseInputSingleton {
    return { ...this.inputState.mouse };
  }

  /**
   * Get current gamepad input state
   */
  getGamepadInput(): GamepadInputSingleton {
    return { ...this.inputState.gamepad };
  }

  /**
   * Get touch input state
   */
  getTouchInput(): { points: TouchPoint[]; isSupported: boolean } {
    return {
      points: [...this.inputState.touch.points],
      isSupported: this.inputState.touch.isSupported,
    };
  }

  // ==========================================================================
  // INPUT QUERIES
  // ==========================================================================

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    return this.inputState.keyboard[normalizedKey] || false;
  }

  /**
   * Check if a key was just pressed this frame
   */
  isKeyJustPressed(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    return (
      (this.inputState.keyboard[normalizedKey] || false) &&
      !(this.previousInputState.keyboard[normalizedKey] || false)
    );
  }

  /**
   * Check if a key was just released this frame
   */
  isKeyJustReleased(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    return (
      !(this.inputState.keyboard[normalizedKey] || false) &&
      (this.previousInputState.keyboard[normalizedKey] || false)
    );
  }

  /**
   * Get mouse position relative to canvas
   */
  getMousePosition(): { x: number; y: number } {
    return {
      x: this.inputState.mouse.x,
      y: this.inputState.mouse.y,
    };
  }

  /**
   * Check if mouse button is pressed
   */
  isMouseButtonPressed(button: "left" | "right" | "middle"): boolean {
    switch (button) {
      case "left":
        return this.inputState.mouse.left_button;
      case "right":
        return this.inputState.mouse.right_button;
      case "middle":
        return this.inputState.mouse.middle_button;
      default:
        return false;
    }
  }

  // ==========================================================================
  // FRAME UPDATE
  // ==========================================================================

  /**
   * Update input state - call this every frame
   */
  update(): void {
    if (!this.isActive) return;

    // Store previous state for just-pressed/released detection
    this.previousInputState = this.deepCloneInputState(this.inputState);

    // Update gamepad state
    this.updateGamepadState();

    // Reset mouse wheel
    this.inputState.mouse.wheel_delta = 0;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private createDefaultInputState(): InputState {
    return {
      keyboard: {
        isKeyPressed: (key: string) => this.isKeyPressed(key),
        isKeyJustPressed: (key: string) => this.isKeyJustPressed(key),
        isKeyJustReleased: (key: string) => this.isKeyJustReleased(key),
      } as KeyboardInputSingleton,
      mouse: {
        x: 0,
        y: 0,
        left_button: false,
        right_button: false,
        middle_button: false,
        wheel_delta: 0,
      },
      gamepad: {
        connected: false,
        buttons: [],
        axes: [],
      },
      touch: {
        points: [],
        isSupported: false,
      },
    };
  }

  private deepCloneInputState(state: InputState): InputState {
    return {
      keyboard: { ...state.keyboard },
      mouse: { ...state.mouse },
      gamepad: {
        ...state.gamepad,
        buttons: [...state.gamepad.buttons],
        axes: [...state.gamepad.axes],
      },
      touch: {
        ...state.touch,
        points: state.touch.points.map((p) => ({ ...p })),
      },
    };
  }

  private normalizeKey(key: string): string {
    // Handle both event.code and event.key formats
    if (KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS]) {
      return KEY_MAPPINGS[key as keyof typeof KEY_MAPPINGS];
    }

    return key.toLowerCase();
  }

  private detectInputSupport(): void {
    this.inputState.touch.isSupported =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Keyboard events
    const keyDownListener = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = this.normalizeKey(e.code || e.key);

      this.inputState.keyboard[key] = true;
    };

    const keyUpListener = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = this.normalizeKey(e.code || e.key);

      this.inputState.keyboard[key] = false;
    };

    // Mouse events
    const mouseDownListener = (e: MouseEvent) => {
      e.preventDefault();
      this.updateMousePosition(e);
      switch (e.button) {
        case 0:
          this.inputState.mouse.left_button = true;
          break;
        case 1:
          this.inputState.mouse.middle_button = true;
          break;
        case 2:
          this.inputState.mouse.right_button = true;
          break;
      }
    };

    const mouseUpListener = (e: MouseEvent) => {
      e.preventDefault();
      this.updateMousePosition(e);
      switch (e.button) {
        case 0:
          this.inputState.mouse.left_button = false;
          break;
        case 1:
          this.inputState.mouse.middle_button = false;
          break;
        case 2:
          this.inputState.mouse.right_button = false;
          break;
      }
    };

    const mouseMoveListener = (e: MouseEvent) => {
      this.updateMousePosition(e);
    };

    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      this.inputState.mouse.wheel_delta = e.deltaY > 0 ? -1 : 1;
    };

    // Touch events
    const touchStartListener = (e: TouchEvent) => {
      e.preventDefault();
      this.updateTouchPoints(e);
    };

    const touchMoveListener = (e: TouchEvent) => {
      e.preventDefault();
      this.updateTouchPoints(e);
    };

    const touchEndListener = (e: TouchEvent) => {
      e.preventDefault();
      this.updateTouchPoints(e);
    };

    // Add event listeners
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);

    this.canvas.addEventListener("mousedown", mouseDownListener);
    this.canvas.addEventListener("mouseup", mouseUpListener);
    this.canvas.addEventListener("mousemove", mouseMoveListener);
    this.canvas.addEventListener("wheel", wheelListener);
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    if (this.inputState.touch.isSupported) {
      this.canvas.addEventListener("touchstart", touchStartListener);
      this.canvas.addEventListener("touchmove", touchMoveListener);
      this.canvas.addEventListener("touchend", touchEndListener);
      this.canvas.addEventListener("touchcancel", touchEndListener);
    }

    // Store listeners for cleanup
    this.eventListeners.set("keydown", keyDownListener);
    this.eventListeners.set("keyup", keyUpListener);
    this.eventListeners.set("mousedown", mouseDownListener);
    this.eventListeners.set("mouseup", mouseUpListener);
    this.eventListeners.set("mousemove", mouseMoveListener);
    this.eventListeners.set("wheel", wheelListener);

    if (this.inputState.touch.isSupported) {
      this.eventListeners.set("touchstart", touchStartListener);
      this.eventListeners.set("touchmove", touchMoveListener);
      this.eventListeners.set("touchend", touchEndListener);
    }
  }

  private removeEventListeners(): void {
    if (!this.canvas) return;

    // Remove all stored event listeners
    const keyDownListener = this.eventListeners.get("keydown");
    const keyUpListener = this.eventListeners.get("keyup");

    if (keyDownListener)
      document.removeEventListener("keydown", keyDownListener);
    if (keyUpListener) document.removeEventListener("keyup", keyUpListener);

    const mouseListeners = ["mousedown", "mouseup", "mousemove", "wheel"];

    mouseListeners.forEach((event) => {
      const listener = this.eventListeners.get(event);

      if (listener) this.canvas!.removeEventListener(event, listener);
    });

    const touchListeners = ["touchstart", "touchmove", "touchend"];

    touchListeners.forEach((event) => {
      const listener = this.eventListeners.get(event);

      if (listener) this.canvas!.removeEventListener(event, listener);
    });

    this.eventListeners.clear();
  }

  private updateMousePosition(e: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.inputState.mouse.x = (e.clientX - rect.left) * scaleX;
    this.inputState.mouse.y = (e.clientY - rect.top) * scaleY;
  }

  private updateTouchPoints(e: TouchEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.inputState.touch.points = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
      pressure: touch.force || 1.0,
    }));
  }

  private updateGamepadState(): void {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first connected gamepad

    if (gamepad) {
      this.inputState.gamepad.connected = true;
      this.inputState.gamepad.buttons = Array.from(gamepad.buttons).map(
        (button) => button.pressed,
      );
      this.inputState.gamepad.axes = Array.from(gamepad.axes);
    } else {
      this.inputState.gamepad.connected = false;
      this.inputState.gamepad.buttons = [];
      this.inputState.gamepad.axes = [];
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

let globalInputManager: ToxoidInputManager | null = null;

/**
 * Get the global input manager instance
 */
export function getInputManager(): ToxoidInputManager {
  if (!globalInputManager) {
    globalInputManager = new ToxoidInputManager();
  }

  return globalInputManager;
}

/**
 * Initialize input for a canvas element
 */
export function initializeInput(canvas: HTMLCanvasElement): ToxoidInputManager {
  const manager = getInputManager();

  manager.initialize(canvas);

  return manager;
}

/**
 * Clean up global input manager
 */
export function destroyInput(): void {
  if (globalInputManager) {
    globalInputManager.destroy();
    globalInputManager = null;
  }
}

export default ToxoidInputManager;
