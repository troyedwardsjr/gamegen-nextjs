/**
 * Toxoid Game Engine TypeScript Definitions
 *
 * Comprehensive TypeScript interfaces for the Toxoid/WorldLink
 * JavaScript scripting API, providing type safety for ECS operations,
 * system registration, observers, and rendering functions.
 */

// Core ECS Types
export interface EntityId extends Number {
  readonly brand: unique symbol;
}

export interface ComponentId extends Number {
  readonly brand: unique symbol;
}

export interface SystemId extends Number {
  readonly brand: unique symbol;
}

// Component and Entity Interfaces
export interface ComponentData {
  [key: string]: any;
}

export interface Position extends ComponentData {
  x: number;
  y: number;
}

export interface Velocity extends ComponentData {
  x: number;
  y: number;
}

export interface Health extends ComponentData {
  value: number;
  maxValue: number;
}

export interface Sprite extends ComponentData {
  path?: string;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
}

export interface Camera extends ComponentData {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface KeyboardInput extends ComponentData {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  escape: boolean;
  enter: boolean;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  [key: string]: boolean;
}

// Color interface for rendering
export interface Color {
  r: number; // 0.0 - 1.0
  g: number; // 0.0 - 1.0
  b: number; // 0.0 - 1.0
  a: number; // 0.0 - 1.0
}

// Line data for rendering
export interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

// Animation configuration for sprites
export interface AnimationConfig {
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  totalFrames: number;
  frameRate: number;
}

// Entity wrapper class interface
export interface ToxoidEntity {
  readonly id: EntityId;
  readonly name: string;

  // Component management
  add(componentName: string): boolean;
  remove(componentName: string): boolean;
  has(componentName: string): boolean;
  getComponent<T extends ComponentData>(componentName: string): T | null;

  // Custom properties (for script-specific data)
  [key: string]: any;
}

// System execution phases
export enum ToxoidPhases {
  ON_LOAD = "OnLoad",
  ON_START = "OnStart",
  PRE_UPDATE = "PreUpdate",
  ON_UPDATE = "OnUpdate",
  POST_UPDATE = "PostUpdate",
  PRE_STORE = "PreStore",
  ON_STORE = "OnStore",
  ON_VALIDATE = "OnValidate",
}

// Observer event types
export enum ToxoidEvents {
  ON_ADD = "OnAdd",
  ON_REMOVE = "OnRemove",
  ON_SET = "OnSet",
}

// System iteration interface
export interface SystemIterator {
  readonly deltaTime: number;
  readonly count: number;
  entities(): ToxoidEntity[];
  each(callback: (entity: ToxoidEntity) => void): void;
}

// System callback function type
export type SystemCallback = (iter: SystemIterator) => void;

// Observer callback function type
export type ObserverCallback = (iter: SystemIterator) => void;

// Observer configuration
export interface ObserverConfig {
  name: string;
  query: string;
  events: ToxoidEvents[];
  callback: ObserverCallback;
}

// Query interface for entity filtering
export interface ToxoidQuery {
  each(callback: (entity: ToxoidEntity) => void): void;
  entities(): ToxoidEntity[];
  count(): number;
}

// Core API namespace
export interface ToxoidAPI {
  // Entity management
  createEntity(name?: string): ToxoidEntity | null;
  getEntity(entityId: EntityId): ToxoidEntity | null;
  removeEntity(entityId: EntityId): void;

  // Sprite and image functions
  loadSprite(
    path: string,
    callback?: (entity: ToxoidEntity) => void,
  ): ToxoidEntity | null;
  createSprite(path: string): ToxoidEntity | null;
  loadAnimatedSprite(
    path: string,
    config: AnimationConfig,
  ): ToxoidEntity | null;
  loadSpineAnimation(
    atlasFile: string,
    skeletonFile: string,
    textureName: string,
    renderedOnLoad: boolean,
    callback?: (entity: ToxoidEntity) => void,
  ): ToxoidEntity | null;
  loadImage(path: string): EntityId;

  // Rendering functions
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color,
  ): EntityId;
  filledRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color,
  ): EntityId;
  lines(linesData: LineData[], color: Color): EntityId;

  // Camera functions
  setCamera(x: number, y: number, zoom: number): void;
  getCamera(): Camera | null;

  // World functions
  getSingleton<T extends ComponentData>(componentName: string): T | null;
  addSingleton(componentName: string): boolean;
  removeSingleton(componentName: string): boolean;

  // Component management
  getComponentByName<T extends ComponentData>(
    entityId: EntityId,
    componentName: string,
  ): T | null;
  updateComponent(
    entityId: EntityId,
    componentName: string,
    fieldName: string,
    newValue: any,
  ): boolean;
  listComponents(): string[];
  syncComponents(): number;
  createComponent(name: string): ComponentId;

  // Deferred operations
  isDeferred(): boolean;
  deferBegin(): boolean;
  deferEnd(): boolean;
  deferSuspend(): void;
  deferResume(): void;
}

// System namespace
export interface ToxoidSystem {
  create(
    name: string,
    query: string,
    phase: ToxoidPhases,
    callback: SystemCallback,
  ): SystemId | null;
}

// Observer namespace
export interface ToxoidObserver {
  create(config: ObserverConfig): boolean;
}

export interface ToxoidObserverEvents {
  readonly OnAdd: ToxoidEvents.ON_ADD;
  readonly OnRemove: ToxoidEvents.ON_REMOVE;
  readonly OnSet: ToxoidEvents.ON_SET;
}

// Query namespace
export interface ToxoidQueryNamespace {
  create(query: string): ToxoidQuery;
}

// Main Toxoid global interface
export interface Toxoid {
  readonly API: ToxoidAPI;
  readonly System: ToxoidSystem;
  readonly Observer: ToxoidObserver;
  readonly ObserverEvents: ToxoidObserverEvents;
  readonly Query: ToxoidQueryNamespace;
  readonly Entity: typeof ToxoidEntity;
  readonly Phases: typeof ToxoidPhases;
  readonly Events: typeof ToxoidEvents;
}

// Script Generation Types
export interface ScriptGenerationRequest {
  prompt: string;
  gameType:
    | "bullet_hell"
    | "rpg"
    | "platformer"
    | "puzzle"
    | "racing"
    | "custom";
  complexity: "simple" | "intermediate" | "advanced";
  features: string[];
  existingCode?: string;
  constraints?: ScriptConstraints;
  userId?: string;
  sessionId?: string;
}

export interface ScriptConstraints {
  maxMemoryMB: number; // Default 50MB
  maxStackMB: number; // Default 1MB
  allowedAPIs: string[];
  forbiddenPatterns: string[];
  maxExecutionTime?: number;
  maxLoops?: number;
}

export interface ScriptValidationRequest {
  script: string;
  constraints?: ScriptConstraints;
  performanceCheck?: boolean;
}

export interface ScriptValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ScriptMetrics;
  suggestions: string[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "critical";
  code: string;
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface ScriptMetrics {
  estimatedMemoryUsage: number;
  cyclomaticComplexity: number;
  apiUsageCount: Record<string, number>;
  performanceScore: number; // 0-100
  securityScore: number; // 0-100
  maintainabilityScore: number; // 0-100
}

export interface ScriptOptimizationRequest {
  script: string;
  optimizationLevel: "basic" | "aggressive" | "minify";
  preserveComments?: boolean;
  targetRuntime: "quickjs" | "v8" | "both";
}

export interface ScriptOptimizationResult {
  originalScript: string;
  optimizedScript: string;
  compressionRatio: number;
  optimizationsApplied: string[];
  performanceGains: {
    memoryReduction: number;
    sizeReduction: number;
    estimatedSpeedImprovement: number;
  };
}

// Template Types
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: "system" | "component" | "observer" | "behavior" | "complete_game";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  code: string;
  dependencies: string[];
  requiredComponents: string[];
  documentation: string;
  examples: TemplateExample[];
}

export interface TemplateExample {
  name: string;
  description: string;
  code: string;
  expectedOutput?: string;
}

// ECS Pattern Templates
export interface SystemTemplate {
  name: string;
  query: string;
  phase: ToxoidPhases;
  description: string;
  codeTemplate: string;
  parameters: TemplateParameter[];
}

export interface ComponentTemplate {
  name: string;
  fields: ComponentField[];
  description: string;
  defaultValues: ComponentData;
}

export interface ComponentField {
  name: string;
  type: "number" | "string" | "boolean" | "object";
  default: any;
  description: string;
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

export interface TemplateParameter {
  name: string;
  type: string;
  description: string;
  default?: any;
  options?: string[];
}

// Hot-reload Types
export interface ScriptHotReloadEvent {
  type: "script_updated" | "script_error" | "script_validated";
  scriptId: string;
  script?: string;
  error?: string;
  version: number;
  timestamp: Date;
}

export interface WebSocketScriptMessage {
  action: "update_script" | "validate_script" | "subscribe" | "unsubscribe";
  scriptId?: string;
  script?: string;
  userId?: string;
  sessionId?: string;
}

// Security Types
export interface SecurityCheck {
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  pattern: RegExp | ((code: string) => boolean);
  suggestion?: string;
}

export interface SecurityScanResult {
  passed: boolean;
  issues: SecurityIssue[];
  riskScore: number; // 0-100, higher is more risky
}

export interface SecurityIssue {
  check: string;
  severity: "low" | "medium" | "high" | "critical";
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  codeSnippet?: string;
}

// Performance Types
export interface PerformanceProfile {
  memoryUsage: MemoryUsage;
  executionTime: ExecutionMetrics;
  apiCallFrequency: Record<string, number>;
  loopComplexity: LoopMetrics[];
  optimizationOpportunities: OptimizationSuggestion[];
}

export interface MemoryUsage {
  estimatedHeapSize: number;
  estimatedStackSize: number;
  objectCount: number;
  stringMemory: number;
  arrayMemory: number;
}

export interface ExecutionMetrics {
  estimatedTotalTime: number;
  hotPaths: HotPath[];
  systemCallCounts: Record<string, number>;
}

export interface HotPath {
  functionName: string;
  estimatedTime: number;
  callCount: number;
  optimizationPriority: number;
}

export interface LoopMetrics {
  line: number;
  type: "for" | "while" | "forEach";
  estimatedIterations: number;
  complexity: "constant" | "linear" | "quadratic" | "exponential";
  optimization: string;
}

export interface OptimizationSuggestion {
  type: "memory" | "performance" | "api_usage";
  priority: number;
  description: string;
  before: string;
  after: string;
  estimatedGain: string;
}

// Export everything for easy importing
export default Toxoid;

// Global declarations for script runtime
declare global {
  const Toxoid: Toxoid;
  const console: Console;
}
