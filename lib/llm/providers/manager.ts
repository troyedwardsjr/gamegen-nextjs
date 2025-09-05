/**
 * LLM Provider Management System
 * 
 * Central management system for multiple LLM providers with load balancing,
 * failover, health monitoring, and intelligent provider selection.
 */

import {
  LLMProvider,
  LLMCapability,
  GenerationRequest,
  GenerationResponse,
  StreamCallback,
  ProviderSelectionCriteria,
  LoadBalancingStrategy,
  ProviderStatus,
  ProviderHealthStatus,
  LLMError,
  CircuitBreakerError,
  RateLimitError
} from '../types'
import { ClaudeProvider } from './claude'
import { CircuitBreaker } from '../circuit-breaker'
import { RateLimiter } from '../rate-limiter'

export interface ProviderManagerConfig {
  default_provider: string
  fallback_chain: string[]
  load_balancing: LoadBalancingStrategy
  health_check_interval: number
  failover_enabled: boolean
  max_concurrent_requests: number
}

export class ProviderManager {
  private providers = new Map<string, LLMProvider>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private rateLimiters = new Map<string, RateLimiter>()
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>()
  private roundRobinCounter = new Map<string, number>()
  private config: ProviderManagerConfig
  
  constructor(config: ProviderManagerConfig) {
    this.config = config
    this.log('info', 'Provider manager initialized', { config })
  }
  
  /**
   * Register a new provider
   */
  registerProvider(provider: LLMProvider): void {
    // Store provider
    this.providers.set(provider.id, provider)
    
    // Create circuit breaker for provider
    const circuitBreaker = new CircuitBreaker(provider.id, {
      failure_threshold: 5,
      reset_timeout: 60000, // 1 minute
      monitor_window: 300000, // 5 minutes
      half_open_max_calls: 3
    })
    this.circuitBreakers.set(provider.id, circuitBreaker)
    
    // Create rate limiter for provider
    const rateLimiter = new RateLimiter(provider.config.rate_limit)
    this.rateLimiters.set(provider.id, rateLimiter)
    
    // Start health check monitoring
    this.startHealthChecking(provider.id)
    
    this.log('info', 'Provider registered', { providerId: provider.id })
  }
  
  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new LLMError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND')
    }
    
    // Stop health checking
    const interval = this.healthCheckIntervals.get(providerId)
    if (interval) {
      clearInterval(interval)
      this.healthCheckIntervals.delete(providerId)
    }
    
    // Cleanup provider resources
    await provider.destroy()
    
    // Remove from maps
    this.providers.delete(providerId)
    this.circuitBreakers.delete(providerId)
    this.rateLimiters.delete(providerId)
    this.roundRobinCounter.delete(providerId)
    
    this.log('info', 'Provider unregistered', { providerId })
  }
  
  /**
   * Generate text using best available provider
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const criteria: ProviderSelectionCriteria = {
      capabilities: [LLMCapability.TEXT_GENERATION, LLMCapability.CODE_GENERATION],
      cost_priority: 'balanced'
    }
    
    // Add streaming capability if requested
    if (request.stream) {
      criteria.capabilities.push(LLMCapability.STREAMING)
    }
    
    // Add function calling if tools are provided
    if (request.tools && request.tools.length > 0) {
      criteria.capabilities.push(LLMCapability.FUNCTION_CALLING)
    }
    
    const selectedProvider = await this.selectProvider(criteria)
    
    try {
      // Check rate limits
      await this.checkRateLimit(selectedProvider.id, request)
      
      // Check circuit breaker
      this.checkCircuitBreaker(selectedProvider.id)
      
      // Generate with selected provider
      const response = await selectedProvider.generate(request)
      
      // Record success in circuit breaker
      this.circuitBreakers.get(selectedProvider.id)?.recordSuccess()
      
      return response
      
    } catch (error) {
      // Record failure in circuit breaker
      this.circuitBreakers.get(selectedProvider.id)?.recordFailure()
      
      // Attempt failover if enabled and error is retryable
      if (this.config.failover_enabled && this.shouldAttemptFailover(error)) {
        return this.attemptFailover(request, selectedProvider.id, error)
      }
      
      throw error
    }
  }
  
  /**
   * Generate streaming text using best available provider
   */
  async generateStream(
    request: GenerationRequest,
    callback: StreamCallback
  ): Promise<void> {
    const criteria: ProviderSelectionCriteria = {
      capabilities: [LLMCapability.STREAMING, LLMCapability.TEXT_GENERATION],
      cost_priority: 'balanced'
    }
    
    // Add function calling if tools are provided
    if (request.tools && request.tools.length > 0) {
      criteria.capabilities.push(LLMCapability.FUNCTION_CALLING)
    }
    
    const selectedProvider = await this.selectProvider(criteria)
    
    try {
      // Check rate limits
      await this.checkRateLimit(selectedProvider.id, request)
      
      // Check circuit breaker
      this.checkCircuitBreaker(selectedProvider.id)
      
      // Generate stream with selected provider
      await selectedProvider.generateStream(request, callback)
      
      // Record success in circuit breaker
      this.circuitBreakers.get(selectedProvider.id)?.recordSuccess()
      
    } catch (error) {
      // Record failure in circuit breaker
      this.circuitBreakers.get(selectedProvider.id)?.recordFailure()
      
      // For streaming, we can't easily failover mid-stream
      throw error
    }
  }
  
  /**
   * Select the best provider based on criteria
   */
  async selectProvider(criteria: ProviderSelectionCriteria): Promise<LLMProvider> {
    // Get all providers that meet the capability requirements
    const eligibleProviders = Array.from(this.providers.values()).filter(provider => {
      // Check capabilities
      const hasRequiredCapabilities = criteria.capabilities.every(cap => 
        provider.capabilities.includes(cap)
      )
      
      if (!hasRequiredCapabilities) {
        return false
      }
      
      // Check exclusions
      if (criteria.exclude_providers?.includes(provider.id)) {
        return false
      }
      
      return true
    })
    
    if (eligibleProviders.length === 0) {
      throw new LLMError(
        `No providers available with capabilities: ${criteria.capabilities.join(', ')}`,
        'NO_PROVIDERS_AVAILABLE'
      )
    }
    
    // Filter by health status
    const healthyProviders = await this.filterByHealth(eligibleProviders)
    
    if (healthyProviders.length === 0) {
      throw new LLMError('No healthy providers available', 'NO_HEALTHY_PROVIDERS')
    }
    
    // Filter by circuit breaker status
    const availableProviders = healthyProviders.filter(provider => {
      const circuitBreaker = this.circuitBreakers.get(provider.id)
      return circuitBreaker ? circuitBreaker.canExecute() : true
    })
    
    if (availableProviders.length === 0) {
      throw new LLMError('All providers are circuit broken', 'ALL_PROVIDERS_CIRCUIT_BROKEN')
    }
    
    // Apply load balancing strategy
    return this.applyLoadBalancing(availableProviders, criteria)
  }
  
  /**
   * Get status of all providers
   */
  async getAllProviderStatus(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = []
    
    for (const [providerId, provider] of this.providers) {
      const circuitBreaker = this.circuitBreakers.get(providerId)
      const rateLimiter = this.rateLimiters.get(providerId)
      const metrics = await provider.getMetrics()
      
      const status: ProviderStatus = {
        provider_id: providerId,
        health_status: metrics.health_status,
        last_health_check: new Date(), // This would be tracked separately in a real implementation
        circuit_breaker_state: circuitBreaker?.getState() || 'closed' as any,
        rate_limit_status: rateLimiter?.getStatus() || {
          requests_used: 0,
          tokens_used: 0,
          window_start: new Date(),
          is_exceeded: false
        },
        metrics
      }
      
      statuses.push(status)
    }
    
    return statuses
  }
  
  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId)
  }
  
  /**
   * Get all registered providers
   */
  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values())
  }
  
  /**
   * Update provider configuration
   */
  async updateProviderConfig(providerId: string, config: any): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new LLMError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND')
    }
    
    await provider.updateConfig(config)
    
    // Update rate limiter if rate limits changed
    if (config.rate_limit) {
      const rateLimiter = new RateLimiter(config.rate_limit)
      this.rateLimiters.set(providerId, rateLimiter)
    }
    
    this.log('info', 'Provider configuration updated', { providerId })
  }
  
  /**
   * Cleanup all resources
   */
  async destroy(): Promise<void> {
    // Clear health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval)
    }
    this.healthCheckIntervals.clear()
    
    // Destroy all providers
    const destroyPromises = Array.from(this.providers.values()).map(p => p.destroy())
    await Promise.allSettled(destroyPromises)
    
    // Clear maps
    this.providers.clear()
    this.circuitBreakers.clear()
    this.rateLimiters.clear()
    this.roundRobinCounter.clear()
    
    this.log('info', 'Provider manager destroyed')
  }
  
  /**
   * Filter providers by health status
   */
  private async filterByHealth(providers: LLMProvider[]): Promise<LLMProvider[]> {
    const healthChecks = await Promise.allSettled(
      providers.map(provider => provider.healthCheck())
    )
    
    return providers.filter((_, index) => {
      const result = healthChecks[index]
      return result.status === 'fulfilled' && result.value === true
    })
  }
  
  /**
   * Apply load balancing strategy
   */
  private applyLoadBalancing(
    providers: LLMProvider[],
    criteria: ProviderSelectionCriteria
  ): LLMProvider {
    switch (this.config.load_balancing.type) {
      case 'round_robin':
        return this.roundRobinSelection(providers)
        
      case 'weighted':
        return this.weightedSelection(providers)
        
      case 'response_time':
        return this.responseTimeSelection(providers)
        
      case 'least_connections':
        // For simplicity, fall back to round robin
        return this.roundRobinSelection(providers)
        
      default:
        return providers[0]
    }
  }
  
  /**
   * Round robin provider selection
   */
  private roundRobinSelection(providers: LLMProvider[]): LLMProvider {
    const key = providers.map(p => p.id).sort().join(',')
    const currentCount = this.roundRobinCounter.get(key) || 0
    const selectedIndex = currentCount % providers.length
    
    this.roundRobinCounter.set(key, currentCount + 1)
    
    return providers[selectedIndex]
  }
  
  /**
   * Weighted provider selection
   */
  private weightedSelection(providers: LLMProvider[]): LLMProvider {
    const weights = this.config.load_balancing.weights || {}
    
    // If no weights defined, use equal weighting
    if (Object.keys(weights).length === 0) {
      return providers[Math.floor(Math.random() * providers.length)]
    }
    
    // Calculate weighted selection
    const totalWeight = providers.reduce((sum, provider) => {
      return sum + (weights[provider.id] || 1)
    }, 0)
    
    let random = Math.random() * totalWeight
    
    for (const provider of providers) {
      const weight = weights[provider.id] || 1
      random -= weight
      
      if (random <= 0) {
        return provider
      }
    }
    
    // Fallback to first provider
    return providers[0]
  }
  
  /**
   * Response time based selection (prefer fastest)
   */
  private async responseTimeSelection(providers: LLMProvider[]): Promise<LLMProvider> {
    const metricsPromises = providers.map(async provider => {
      const metrics = await provider.getMetrics()
      return { provider, responseTime: metrics.average_response_time }
    })
    
    const results = await Promise.allSettled(metricsPromises)
    const validResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    
    if (validResults.length === 0) {
      return providers[0]
    }
    
    // Sort by response time (ascending)
    validResults.sort((a, b) => a.responseTime - b.responseTime)
    
    return validResults[0].provider
  }
  
  /**
   * Check rate limits for a provider
   */
  private async checkRateLimit(providerId: string, request: GenerationRequest): Promise<void> {
    const rateLimiter = this.rateLimiters.get(providerId)
    if (!rateLimiter) {
      return
    }
    
    // Estimate token usage for rate limiting
    const estimatedTokens = this.estimateTokenUsage(request)
    
    const allowed = await rateLimiter.checkLimit(1, estimatedTokens, request.user_id)
    if (!allowed) {
      throw new RateLimitError(providerId)
    }
  }
  
  /**
   * Check circuit breaker status
   */
  private checkCircuitBreaker(providerId: string): void {
    const circuitBreaker = this.circuitBreakers.get(providerId)
    if (circuitBreaker && !circuitBreaker.canExecute()) {
      throw new CircuitBreakerError(providerId)
    }
  }
  
  /**
   * Attempt failover to another provider
   */
  private async attemptFailover(
    request: GenerationRequest,
    failedProviderId: string,
    originalError: any
  ): Promise<GenerationResponse> {
    this.log('warn', 'Attempting failover', { failedProvider: failedProviderId, error: originalError.message })
    
    // Try fallback chain
    for (const fallbackId of this.config.fallback_chain) {
      if (fallbackId === failedProviderId) {
        continue // Skip the failed provider
      }
      
      const fallbackProvider = this.providers.get(fallbackId)
      if (!fallbackProvider) {
        continue
      }
      
      try {
        // Check if fallback provider can handle the request
        const hasCapabilities = request.tools 
          ? fallbackProvider.capabilities.includes(LLMCapability.FUNCTION_CALLING)
          : true
          
        if (!hasCapabilities) {
          continue
        }
        
        // Check health
        const isHealthy = await fallbackProvider.healthCheck()
        if (!isHealthy) {
          continue
        }
        
        // Check circuit breaker
        const circuitBreaker = this.circuitBreakers.get(fallbackId)
        if (circuitBreaker && !circuitBreaker.canExecute()) {
          continue
        }
        
        // Try the failover
        const response = await fallbackProvider.generate(request)
        
        this.log('info', 'Failover successful', { 
          failedProvider: failedProviderId,
          fallbackProvider: fallbackId 
        })
        
        return response
        
      } catch (fallbackError) {
        this.log('warn', 'Failover attempt failed', { 
          fallbackProvider: fallbackId,
          error: fallbackError.message 
        })
        
        // Record failure in circuit breaker
        this.circuitBreakers.get(fallbackId)?.recordFailure()
        
        continue
      }
    }
    
    // If all failovers failed, throw the original error
    this.log('error', 'All failover attempts failed', { originalError: originalError.message })
    throw originalError
  }
  
  /**
   * Start health checking for a provider
   */
  private startHealthChecking(providerId: string): void {
    const interval = setInterval(async () => {
      const provider = this.providers.get(providerId)
      if (provider) {
        try {
          await provider.healthCheck()
        } catch (error) {
          this.log('warn', 'Health check failed', { providerId, error: error.message })
        }
      }
    }, this.config.health_check_interval)
    
    this.healthCheckIntervals.set(providerId, interval)
  }
  
  /**
   * Determine if we should attempt failover for an error
   */
  private shouldAttemptFailover(error: any): boolean {
    if (error instanceof LLMError) {
      return error.retryable
    }
    
    // Attempt failover for common transient errors
    return ['RATE_LIMIT_EXCEEDED', 'SERVER_ERROR', 'NETWORK_ERROR', 'TIMEOUT'].includes(error.code)
  }
  
  /**
   * Estimate token usage for rate limiting
   */
  private estimateTokenUsage(request: GenerationRequest): number {
    // Simple estimation: ~4 characters per token
    const messagesText = request.messages
      .map(msg => typeof msg.content === 'string' ? msg.content : '')
      .join(' ')
    
    const systemPromptText = request.system_prompt || ''
    const totalText = messagesText + systemPromptText
    
    return Math.ceil(totalText.length / 4)
  }
  
  /**
   * Logging utility
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = `[ProviderManager] ${message}`
    
    switch (level) {
      case 'info':
        console.info(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'error':
        console.error(logMessage, data)
        break
    }
  }
}