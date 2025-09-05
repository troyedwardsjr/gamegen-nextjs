/**
 * LLM Provider Management Types
 * 
 * Core TypeScript interfaces for the GameGen LLM provider system,
 * supporting multiple AI providers with health checking, monitoring,
 * and billing integration.
 */

// Provider capabilities and configuration
export enum LLMCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  IMAGE_GENERATION = 'image_generation',
  AUDIO_GENERATION = 'audio_generation',
  FUNCTION_CALLING = 'function_calling',
  STREAMING = 'streaming',
  EMBEDDINGS = 'embeddings'
}

export interface ProviderConfig {
  api_key: string
  endpoint: string
  model: string
  max_tokens: number
  temperature: number
  fallback_provider?: string
  rate_limit: {
    requests_per_minute: number
    tokens_per_minute: number
  }
  health_check_interval: number
  timeout: number
  retry_attempts: number
}

export interface ProviderMetrics {
  provider_id: string
  total_requests: number
  successful_requests: number
  failed_requests: number
  average_response_time: number
  total_tokens_used: number
  health_status: ProviderHealthStatus
  last_used: Date
  cost_per_token: number
}

export enum ProviderHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline'
}

// Generation request and response types
export interface GenerationRequest {
  messages: LLMMessage[]
  system_prompt?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop_sequences?: string[]
  tools?: LLMTool[]
  tool_choice?: 'auto' | 'required' | { name: string }
  stream?: boolean
  user_id?: string
  session_id?: string
  metadata?: Record<string, any>
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | LLMContentBlock[]
}

export interface LLMContentBlock {
  type: 'text' | 'image'
  text?: string
  image?: {
    source: {
      type: 'base64'
      media_type: string
      data: string
    }
  }
}

export interface LLMTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface GenerationResponse {
  id: string
  content: string
  usage: TokenUsage
  model: string
  finish_reason: 'stop' | 'max_tokens' | 'tool_use' | 'content_filter'
  tool_calls?: ToolCall[]
  provider_id: string
  response_time: number
  created_at: Date
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, any>
}

// Streaming types
export interface StreamChunk {
  type: 'content_block_delta' | 'message_delta' | 'message_stop'
  delta?: {
    type: 'text_delta'
    text: string
  }
  usage?: TokenUsage
}

export type StreamCallback = (chunk: StreamChunk) => void

// Provider interface
export interface LLMProvider {
  readonly id: string
  readonly name: string
  readonly capabilities: LLMCapability[]
  readonly config: ProviderConfig
  
  // Core functionality
  generate(request: GenerationRequest): Promise<GenerationResponse>
  generateStream(request: GenerationRequest, callback: StreamCallback): Promise<void>
  
  // Health and monitoring
  healthCheck(): Promise<boolean>
  getMetrics(): Promise<ProviderMetrics>
  
  // Configuration
  updateConfig(config: Partial<ProviderConfig>): Promise<void>
  
  // Cleanup
  destroy(): Promise<void>
}

// Provider manager types
export interface ProviderSelectionCriteria {
  capabilities: LLMCapability[]
  max_response_time?: number
  min_success_rate?: number
  cost_priority?: 'lowest' | 'balanced' | 'performance'
  exclude_providers?: string[]
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'weighted' | 'least_connections' | 'response_time'
  weights?: Record<string, number>
}

// Circuit breaker types
export interface CircuitBreakerConfig {
  failure_threshold: number
  reset_timeout: number
  monitor_window: number
  half_open_max_calls: number
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState
  failure_count: number
  last_failure_time?: Date
  success_count: number
  last_reset_time?: Date
}

// Rate limiting types
export interface RateLimitConfig {
  requests_per_minute: number
  tokens_per_minute: number
  burst_limit?: number
  user_tier_multiplier?: Record<string, number>
}

export interface RateLimitState {
  requests_used: number
  tokens_used: number
  window_start: Date
  is_exceeded: boolean
}

// Billing and usage tracking
export interface BillingRecord {
  id: string
  user_id: string
  provider_id: string
  request_id: string
  tokens_used: number
  cost: number
  request_type: string
  created_at: Date
  metadata?: Record<string, any>
}

export interface CreditBalance {
  user_id: string
  balance: number
  reserved: number
  available: number
  last_updated: Date
}

export interface UsageReport {
  user_id: string
  period_start: Date
  period_end: Date
  total_requests: number
  total_tokens: number
  total_cost: number
  provider_breakdown: Record<string, {
    requests: number
    tokens: number
    cost: number
  }>
}

// Monitoring and logging
export interface RequestLog {
  id: string
  user_id: string
  provider_id: string
  request: GenerationRequest
  response?: GenerationResponse
  error?: string
  start_time: Date
  end_time?: Date
  response_time?: number
  cost?: number
}

export interface ProviderStatus {
  provider_id: string
  health_status: ProviderHealthStatus
  last_health_check: Date
  circuit_breaker_state: CircuitBreakerState
  rate_limit_status: RateLimitState
  metrics: ProviderMetrics
}

// Configuration management
export interface ProviderConfiguration {
  id: string
  name: string
  type: 'claude' | 'openai' | 'gemini' | 'custom'
  enabled: boolean
  priority: number
  config: ProviderConfig
  circuit_breaker: CircuitBreakerConfig
  rate_limit: RateLimitConfig
  created_at: Date
  updated_at: Date
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider_id?: string,
    public readonly retryable: boolean = false
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

export class RateLimitError extends LLMError {
  constructor(provider_id: string, reset_time?: Date) {
    super(
      `Rate limit exceeded for provider ${provider_id}${reset_time ? `. Reset at ${reset_time}` : ''}`,
      'RATE_LIMIT_EXCEEDED',
      provider_id,
      true
    )
  }
}

export class CircuitBreakerError extends LLMError {
  constructor(provider_id: string) {
    super(
      `Circuit breaker is open for provider ${provider_id}`,
      'CIRCUIT_BREAKER_OPEN',
      provider_id,
      false
    )
  }
}

export class InsufficientCreditsError extends LLMError {
  constructor(user_id: string, required: number, available: number) {
    super(
      `Insufficient credits for user ${user_id}. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CREDITS',
      undefined,
      false
    )
  }
}