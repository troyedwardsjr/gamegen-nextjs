// Toxoid Engine Type Definitions
// Complete type system for Toxoid ECS API and script generation

// ============================================================================
// Core Toxoid API Types
// ============================================================================

export interface ToxoidAPI {
  createEntity(): ToxoidEntity;
  deleteEntity(entity: ToxoidEntity): void;
  getEntity(id: string): ToxoidEntity | null;
  getAllEntities(): ToxoidEntity[];
}

export interface ToxoidEntity {
  id: string;
  add<T extends ToxoidComponent>(component: T, data?: Partial<T>): void;
  get<T extends ToxoidComponent>(component: T): T | null;
  has<T extends ToxoidComponent>(component: T): boolean;
  remove<T extends ToxoidComponent>(component: T): void;
  set<T extends ToxoidComponent>(component: T, data: Partial<T>): void;
  destroy(): void;
}

export interface ToxoidComponent {
  [key: string]: any;
}

// Common ECS Components
export interface Position extends ToxoidComponent {
  x: number;
  y: number;
  z?: number;
}

export interface Velocity extends ToxoidComponent {
  x: number;
  y: number;
  z?: number;
}

export interface Health extends ToxoidComponent {
  current: number;
  max: number;
  regeneration?: number;
}

export interface Sprite extends ToxoidComponent {
  texture: string;
  width: number;
  height: number;
  scale?: number;
  rotation?: number;
}

// ============================================================================
// System Types
// ============================================================================

export type SystemPhase = 'PRE_UPDATE' | 'ON_UPDATE' | 'POST_UPDATE' | 'ON_RENDER';

export interface ToxoidSystem {
  name: string;
  phase: SystemPhase;
  callback: (deltaTime: number) => void;
  enabled: boolean;
  priority?: number;
}

export interface SystemAPI {
  create(name: string, callback: (dt: number) => void, phase?: SystemPhase): void;
  remove(name: string): void;
  enable(name: string): void;
  disable(name: string): void;
  setPriority(name: string, priority: number): void;
}

// ============================================================================
// Query Types
// ============================================================================

export interface ToxoidQuery {
  each(callback: (entity: ToxoidEntity) => void): void;
  first(): ToxoidEntity | null;
  count(): number;
  toArray(): ToxoidEntity[];
  filter(predicate: (entity: ToxoidEntity) => boolean): ToxoidEntity[];
}

export interface QueryAPI {
  create(...components: ToxoidComponent[]): ToxoidQuery;
  not(...components: ToxoidComponent[]): ToxoidQuery;
  any(...components: ToxoidComponent[]): ToxoidQuery;
  modified(...components: ToxoidComponent[]): ToxoidQuery;
}

// ============================================================================
// Observer Types
// ============================================================================

export type ObserverEvent = 'OnAdd' | 'OnSet' | 'OnRemove' | 'OnDelete';

export interface ToxoidObserver {
  id: string;
  event: ObserverEvent;
  component?: ToxoidComponent;
  callback: (entity: ToxoidEntity) => void;
  enabled: boolean;
}

export interface ObserverAPI {
  create(
    event: ObserverEvent,
    componentOrCallback: ToxoidComponent | ((entity: ToxoidEntity) => void),
    callback?: (entity: ToxoidEntity) => void
  ): string;
  remove(observerId: string): void;
  enable(observerId: string): void;
  disable(observerId: string): void;
}

// ============================================================================
// Script Generation Types
// ============================================================================

export type ScriptType = 'system' | 'component' | 'observer' | 'behavior' | 'complete';
export type GameType = 'platformer' | 'shooter' | 'puzzle' | 'rpg' | 'strategy' | 'casual';
export type ComplexityLevel = 'simple' | 'intermediate' | 'advanced';

export interface ScriptGenerationRequest {
  description: string;
  scriptType: ScriptType;
  gameType?: GameType;
  complexity?: ComplexityLevel;
  context?: ScriptContext;
  constraints?: GenerationConstraints;
  examples?: boolean;
}

export interface ScriptContext {
  existingEntities?: string[];
  availableComponents?: string[];
  gameState?: any;
  performanceRequirements?: 'low' | 'medium' | 'high';
  targetPlatform?: 'web' | 'mobile' | 'desktop';
}

export interface GenerationConstraints {
  maxMemoryUsage?: number; // in bytes
  maxExecutionTime?: number; // in ms
  useStrictMode?: boolean;
  includeComments?: boolean;
  includeErrorHandling?: boolean;
}

export interface GeneratedScript {
  id: string;
  code: string;
  metadata: ScriptMetadata;
  validation: ValidationResult;
  timestamp: Date;
}

export interface ScriptMetadata {
  type: ScriptType;
  description: string;
  dependencies: string[];
  toxoidAPIs: string[];
  componentsUsed: string[];
  estimatedMemory: number;
  performanceScore: number;
  complexity: ComplexityLevel;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRequest {
  code: string;
  scriptType?: ScriptType;
  context?: ScriptContext;
  strictMode?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  analysis: ScriptAnalysis;
  score: number; // 0-100
}

export interface ValidationError {
  type: 'syntax' | 'runtime' | 'security' | 'api' | 'memory';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'critical';
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'memory' | 'best-practice' | 'deprecated';
  message: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface ScriptAnalysis {
  syntaxValid: boolean;
  toxoidCompatible: boolean;
  memoryUsage: MemoryAnalysis;
  performanceMetrics: PerformanceMetrics;
  securityIssues: SecurityIssue[];
  apiUsage: APIUsageAnalysis;
}

export interface MemoryAnalysis {
  estimated: number; // bytes
  breakdown: {
    variables: number;
    functions: number;
    objects: number;
    closures: number;
  };
  withinLimits: boolean;
  recommendations: string[];
}

export interface PerformanceMetrics {
  estimatedExecutionTime: number; // ms
  complexity: 'O(1)' | 'O(n)' | 'O(n²)' | 'O(n³)' | 'O(log n)' | 'O(n log n)';
  loopDepth: number;
  functionCalls: number;
  recursivePatterns: boolean;
  recommendations: string[];
}

export interface SecurityIssue {
  type: 'injection' | 'unsafe-eval' | 'prototype-pollution' | 'resource-exhaustion' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  recommendation: string;
}

export interface APIUsageAnalysis {
  toxoidAPIs: string[];
  unsupportedAPIs: string[];
  deprecatedAPIs: string[];
  recommendations: string[];
}

// ============================================================================
// Optimization Types
// ============================================================================

export interface OptimizationRequest {
  code: string;
  targetMetrics?: OptimizationTarget[];
  preserveComments?: boolean;
  aggressiveMode?: boolean;
}

export type OptimizationTarget = 'memory' | 'performance' | 'size' | 'readability';

export interface OptimizationResult {
  optimizedCode: string;
  improvements: OptimizationMetrics;
  applied: OptimizationTechnique[];
  warnings: string[];
}

export interface OptimizationMetrics {
  memorySaved: number; // bytes
  performanceGain: number; // percentage
  sizereduction: number; // percentage
  complexityReduction: number; // percentage
}

export type OptimizationTechnique = 
  | 'dead-code-elimination'
  | 'constant-folding'
  | 'loop-unrolling'
  | 'function-inlining'
  | 'variable-minification'
  | 'whitespace-removal'
  | 'comment-removal'
  | 'cache-optimization'
  | 'memory-pooling';

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
  sessionId?: string;
}

export type WebSocketMessageType =
  | 'script-update'
  | 'script-validate'
  | 'script-execute'
  | 'script-error'
  | 'script-result'
  | 'hot-reload'
  | 'version-update'
  | 'rollback'
  | 'sync-state';

export interface ScriptUpdatePayload {
  scriptId: string;
  code: string;
  version: number;
  changes?: CodeChange[];
}

export interface CodeChange {
  type: 'add' | 'modify' | 'delete';
  path: string;
  oldValue?: any;
  newValue?: any;
  line?: number;
}

export interface HotReloadPayload {
  scriptId: string;
  code: string;
  immediate: boolean;
  preserveState?: boolean;
}

export interface ScriptExecutionResult {
  scriptId: string;
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  memoryUsed: number;
}

// ============================================================================
// Template Types
// ============================================================================

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: ScriptType;
  code: string;
  parameters?: TemplateParameter[];
  tags: string[];
  difficulty: ComplexityLevel;
  examples?: TemplateExample[];
}

export type TemplateCategory = 
  | 'movement'
  | 'combat'
  | 'physics'
  | 'ai'
  | 'ui'
  | 'audio'
  | 'particles'
  | 'animation'
  | 'input'
  | 'networking';

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
  required?: boolean;
  description?: string;
  validation?: string; // regex or validation function as string
}

export interface TemplateExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutput?: string;
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityScanResult {
  safe: boolean;
  issues: SecurityViolation[];
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface SecurityViolation {
  type: SecurityViolationType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: CodeLocation;
  mitigation: string;
}

export type SecurityViolationType =
  | 'code-injection'
  | 'xss-vulnerability'
  | 'prototype-pollution'
  | 'unsafe-eval'
  | 'infinite-loop'
  | 'memory-leak'
  | 'resource-exhaustion'
  | 'unauthorized-api'
  | 'sandbox-escape'
  | 'timing-attack';

export interface CodeLocation {
  line: number;
  column: number;
  length: number;
  snippet: string;
}

// ============================================================================
// Performance Profiling Types
// ============================================================================

export interface PerformanceProfile {
  scriptId: string;
  timestamp: Date;
  metrics: ProfileMetrics;
  bottlenecks: Bottleneck[];
  recommendations: PerformanceRecommendation[];
}

export interface ProfileMetrics {
  totalExecutionTime: number;
  averageFrameTime: number;
  peakMemoryUsage: number;
  gcPauses: GCPause[];
  functionProfiles: FunctionProfile[];
}

export interface GCPause {
  timestamp: number;
  duration: number;
  reason: string;
  memoryFreed: number;
}

export interface FunctionProfile {
  name: string;
  calls: number;
  totalTime: number;
  averageTime: number;
  selfTime: number;
}

export interface Bottleneck {
  type: 'cpu' | 'memory' | 'io';
  location: string;
  impact: number; // 0-100
  description: string;
  suggestion: string;
}

export interface PerformanceRecommendation {
  category: 'algorithm' | 'memory' | 'caching' | 'batching' | 'async';
  description: string;
  expectedImprovement: number; // percentage
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// Export Main Interfaces
// ============================================================================

export interface ToxoidScriptGenerator {
  generate(request: ScriptGenerationRequest): Promise<GeneratedScript>;
  validate(request: ValidationRequest): Promise<ValidationResult>;
  optimize(request: OptimizationRequest): Promise<OptimizationResult>;
  getTemplate(id: string): ScriptTemplate | null;
  listTemplates(category?: TemplateCategory): ScriptTemplate[];
}

export interface ToxoidWebSocketManager {
  connect(gameId: string, userId: string): Promise<void>;
  disconnect(): void;
  sendScript(payload: ScriptUpdatePayload): void;
  hotReload(payload: HotReloadPayload): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error';
}