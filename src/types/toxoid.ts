/**
 * Toxoid WASM Engine TypeScript Type Definitions
 *
 * This file provides comprehensive TypeScript bindings for the Toxoid WASM game engine,
 * including the QuickJS scripting API and all ECS functionality.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface ToxoidEntity {
  id: number;
  name?: string;
  add(component: string): ToxoidEntity;
  remove(component: string): ToxoidEntity;
  has(component: string): boolean;
  getComponent(component: string): any;
  setComponent(component: string, data: any): void;
  destroy(): void;
}

export interface ToxoidComponent {
  [key: string]: any;
}

export interface ToxoidVector2 {
  x: number;
  y: number;
}

export interface ToxoidVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ToxoidColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// =============================================================================
// COMPONENT SCHEMA TYPES
// =============================================================================

export type ComponentPropertyType =
  | "number"
  | "boolean"
  | "string"
  | "entity"
  | "u32"
  | "f32"
  | "u64"
  | "i32"
  | "i64";

export interface ComponentProperty {
  name: string;
  type: ComponentPropertyType;
  default?: any;
}

// =============================================================================
// BUILT-IN COMPONENTS
// =============================================================================

export interface PositionComponent extends ToxoidComponent {
  x: number;
  y: number;
  z?: number;
}

export interface VelocityComponent extends ToxoidComponent {
  x: number;
  y: number;
  z?: number;
}

export interface SpriteComponent extends ToxoidComponent {
  texture_id?: number;
  width: number;
  height: number;
  scale_x: number;
  scale_y: number;
  rotation: number;
  visible: boolean;
}

export interface HealthComponent extends ToxoidComponent {
  value: number;
  max_value: number;
}

export interface CameraComponent extends ToxoidComponent {
  x: number;
  y: number;
  zoom: number;
  follow_entity?: number;
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

export interface KeyboardInputSingleton {
  pressedKeys: Set<string>;
  keys: { [key: string]: boolean };
  isKeyPressed: (key: string) => boolean;
  isKeyJustPressed: (key: string) => boolean;
  isKeyJustReleased: (key: string) => boolean;
}

export interface MouseInputSingleton {
  position: { x: number; y: number };
  previousPosition: { x: number; y: number };
  leftButton: boolean;
  rightButton: boolean;
  middleButton: boolean;
  wheelDelta: number;
  isButtonPressed: (button: "left" | "right" | "middle") => boolean;
  isButtonJustPressed: (button: "left" | "right" | "middle") => boolean;
  isButtonJustReleased: (button: "left" | "right" | "middle") => boolean;
}

export interface GamepadInput {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: { [key: string]: boolean };
  triggers: { left: number; right: number };
}

export interface GamepadInputSingleton {
  gamepads: GamepadInput[];
  buttons: boolean[];
  axes: number[];
  connected: boolean;
  getGamepad: (index: number) => GamepadInput | null;
  isConnected: (index: number) => boolean;
  getButtonValue: (gamepadIndex: number, button: string) => number;
  isButtonPressed: (gamepadIndex: number, button: string) => boolean;
}

// =============================================================================
// SYSTEM AND OBSERVER TYPES
// =============================================================================

export interface ToxoidIterator {
  entities(): ToxoidEntity[];
  deltaTime: number;
  count(): number;
  first(): ToxoidEntity | null;
}

export type SystemCallback = (iter: ToxoidIterator) => void;

export enum ToxoidPhases {
  ON_START = "OnStart",
  ON_UPDATE = "OnUpdate",
  ON_VALIDATE = "OnValidate",
  POST_UPDATE = "PostUpdate",
  PRE_STORE = "PreStore",
  ON_STORE = "OnStore",
}

export enum ToxoidEvents {
  ON_ADD = "OnAdd",
  ON_REMOVE = "OnRemove",
  ON_SET = "OnSet",
}

export interface ObserverConfig {
  name: string;
  query: string;
  events: ToxoidEvents[];
  callback: SystemCallback;
}

// =============================================================================
// RENDERING TYPES
// =============================================================================

export interface SpriteLoadResult {
  id: number;
  width: number;
  height: number;
  success: boolean;
}

export interface SpineAnimationConfig {
  atlas_path: string;
  skeleton_path: string;
  texture_path: string;
  premultiplied_alpha: boolean;
}

export interface ShapeDrawConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: ToxoidColor;
  filled?: boolean;
  border_width?: number;
}

// =============================================================================
// TOXOID API INTERFACES
// =============================================================================

export interface ToxoidCoreAPI {
  // Entity Management
  createEntity(name?: string): ToxoidEntity;
  destroyEntity(entity: ToxoidEntity): void;
  getEntityById(id: number): ToxoidEntity | null;
  getEntityByName(name: string): ToxoidEntity | null;

  // Component Registration
  registerComponent(name: string, properties?: ComponentProperty[]): void;
  registerSingleton(name: string, properties?: ComponentProperty[]): any;

  // Rendering
  loadSprite(path: string): SpriteLoadResult;
  loadSpineAnimation(config: SpineAnimationConfig): number;
  filledRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: ToxoidColor,
  ): void;
  outlineRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: ToxoidColor,
    border_width: number,
  ): void;
  filledCircle(x: number, y: number, radius: number, color: ToxoidColor): void;
  outlineCircle(
    x: number,
    y: number,
    radius: number,
    color: ToxoidColor,
    border_width: number,
  ): void;

  // System Management
  getSystemCount(): number;
  getEntityCount(): number;
  getDeltaTime(): number;

  // Singletons
  getKeyboardInput(): KeyboardInputSingleton;
  getMouseInput(): MouseInputSingleton;
  getGamepadInput(): GamepadInputSingleton;
  getCamera(): CameraComponent;
}

export interface ToxoidSystemAPI {
  create(
    name: string,
    query: string,
    phase: ToxoidPhases,
    callback: SystemCallback,
  ): void;
  remove(name: string): void;
  enable(name: string): void;
  disable(name: string): void;
  exists(name: string): boolean;
}

export interface ToxoidQueryAPI {
  create(query: string): ToxoidIterator;
  count(query: string): number;
  first(query: string): ToxoidEntity | null;
  each(query: string, callback: (entity: ToxoidEntity) => void): void;
}

export interface ToxoidObserverAPI {
  create(config: ObserverConfig): void;
  remove(name: string): void;
  enable(name: string): void;
  disable(name: string): void;
}

// =============================================================================
// MAIN TOXOID INTERFACE
// =============================================================================

export interface ToxoidEngine {
  API: ToxoidCoreAPI;
  System: ToxoidSystemAPI;
  Query: ToxoidQueryAPI;
  Observer: ToxoidObserverAPI;
  Entity: ToxoidEntity;
  Phases: typeof ToxoidPhases;
  Events: typeof ToxoidEvents;
  ObserverEvents: typeof ToxoidEvents; // Alias for cleaner code

  // Component registration shorthand
  registerComponent: ToxoidCoreAPI["registerComponent"];
}

// =============================================================================
// WASM MODULE INTERFACE
// =============================================================================

export interface ToxoidWasmModule {
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAPU8: Uint8Array;
  HEAP32: Int32Array;
  cwrap: (name: string, returnType: string, argTypes: string[]) => Function;
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: any[],
  ) => any;
}

// =============================================================================
// INITIALIZATION AND CONFIGURATION
// =============================================================================

export interface ToxoidInitConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  enableScripting?: boolean;
  memoryLimit?: number; // Default 50MB
  stackSize?: number; // Default 1MB
  debugMode?: boolean;
  assetPath?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface ToxoidGameState {
  isRunning: boolean;
  isPaused: boolean;
  fps: number;
  frameTime: number;
  entityCount: number;
  systemCount: number;
  memoryUsage: number;
}

// =============================================================================
// GAME SCRIPT INTERFACE
// =============================================================================

export interface GameScript {
  id: string;
  name: string;
  content: string;
  isEnabled: boolean;
  hasErrors: boolean;
  errorMessage?: string;
  lastModified: Date;
}

export interface ScriptingContext {
  execute(script: GameScript): Promise<boolean>;
  executeCode(code: string): Promise<boolean>;
  getErrors(): string[];
  clearErrors(): void;
  hotReload(script: GameScript): Promise<boolean>;
  getGlobalScope(): any;
}

// =============================================================================
// ASSET MANAGEMENT
// =============================================================================

export interface AssetInfo {
  id: string;
  name: string;
  type: "sprite" | "audio" | "spine" | "script";
  path: string;
  size: number;
  isLoaded: boolean;
}

export interface AssetManager {
  loadAsset(path: string, type: AssetInfo["type"]): Promise<AssetInfo>;
  preloadAssets(paths: string[]): Promise<AssetInfo[]>;
  getAsset(id: string): AssetInfo | null;
  unloadAsset(id: string): boolean;
  getLoadedAssets(): AssetInfo[];
  getMemoryUsage(): number;
}

// Global declarations are handled in /types/toxoid.ts to avoid conflicts
