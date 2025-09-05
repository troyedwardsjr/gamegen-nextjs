/**
 * Circuit Breaker Implementation
 * 
 * Implements the circuit breaker pattern for LLM providers to prevent
 * cascading failures and provide fast failure for unhealthy services.
 */

import {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitBreakerMetrics,
  CircuitBreakerError
} from './types'

export class CircuitBreaker {
  private config: CircuitBreakerConfig
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime?: Date
  private lastResetTime?: Date
  private halfOpenCallCount: number = 0
  
  constructor(
    private readonly providerId: string,
    config: CircuitBreakerConfig
  ) {
    this.config = config
    this.lastResetTime = new Date()
  }
  
  /**
   * Check if the circuit breaker allows execution
   */
  canExecute(): boolean {
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true
        
      case CircuitBreakerState.OPEN:
        return this.shouldAttemptReset()
        
      case CircuitBreakerState.HALF_OPEN:
        return this.halfOpenCallCount < this.config.half_open_max_calls
        
      default:
        return false
    }
  }
  
  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.successCount++
    
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        // Reset failure count on success in closed state
        this.failureCount = 0
        break
        
      case CircuitBreakerState.HALF_OPEN:
        this.halfOpenCallCount++
        
        // If we've had enough successes in half-open, close the circuit
        if (this.halfOpenCallCount >= this.config.half_open_max_calls) {
          this.closeCircuit()
        }
        break
        
      case CircuitBreakerState.OPEN:
        // Success in open state means we're transitioning to half-open
        this.state = CircuitBreakerState.HALF_OPEN
        this.halfOpenCallCount = 1
        break
    }
    
    this.logStateChange('success')
  }
  
  /**
   * Record a failed execution
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()
    
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        // Open circuit if failure threshold exceeded
        if (this.failureCount >= this.config.failure_threshold) {
          this.openCircuit()
        }
        break
        
      case CircuitBreakerState.HALF_OPEN:
        // Any failure in half-open state reopens the circuit
        this.openCircuit()
        break
        
      case CircuitBreakerState.OPEN:
        // Already open, just update metrics
        break
    }
    
    this.logStateChange('failure')
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failure_count: this.failureCount,
      last_failure_time: this.lastFailureTime,
      success_count: this.successCount,
      last_reset_time: this.lastResetTime
    }
  }
  
  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.closeCircuit()
    this.logStateChange('manual_reset')
  }
  
  /**
   * Force the circuit breaker to open
   */
  forceOpen(): void {
    this.openCircuit()
    this.logStateChange('forced_open')
  }
  
  /**
   * Get time until reset (for open circuits)
   */
  getTimeUntilReset(): number {
    if (this.state !== CircuitBreakerState.OPEN || !this.lastFailureTime) {
      return 0
    }
    
    const elapsed = Date.now() - this.lastFailureTime.getTime()
    const remaining = this.config.reset_timeout - elapsed
    
    return Math.max(0, remaining)
  }
  
  /**
   * Check if circuit should transition from open to half-open
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false
    }
    
    const elapsed = Date.now() - this.lastFailureTime.getTime()
    
    if (elapsed >= this.config.reset_timeout) {
      this.state = CircuitBreakerState.HALF_OPEN
      this.halfOpenCallCount = 0
      this.logStateChange('attempting_reset')
      return true
    }
    
    return false
  }
  
  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN
    this.halfOpenCallCount = 0
    
    // Schedule automatic reset attempt
    setTimeout(() => {
      if (this.state === CircuitBreakerState.OPEN) {
        this.shouldAttemptReset()
      }
    }, this.config.reset_timeout)
  }
  
  /**
   * Close the circuit breaker
   */
  private closeCircuit(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.halfOpenCallCount = 0
    this.lastResetTime = new Date()
  }
  
  /**
   * Log state changes
   */
  private logStateChange(trigger: string): void {
    console.info(`[CircuitBreaker:${this.providerId}] State: ${this.state}, Trigger: ${trigger}`, {
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenCallCount: this.halfOpenCallCount
    })
  }
}

/**
 * Circuit Breaker Manager
 * 
 * Manages multiple circuit breakers and provides centralized monitoring
 */
export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  /**
   * Create or get a circuit breaker for a provider
   */
  getCircuitBreaker(providerId: string, config: CircuitBreakerConfig): CircuitBreaker {
    let circuitBreaker = this.circuitBreakers.get(providerId)
    
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(providerId, config)
      this.circuitBreakers.set(providerId, circuitBreaker)
    }
    
    return circuitBreaker
  }
  
  /**
   * Remove a circuit breaker
   */
  removeCircuitBreaker(providerId: string): void {
    this.circuitBreakers.delete(providerId)
  }
  
  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {}
    
    for (const [providerId, circuitBreaker] of this.circuitBreakers) {
      metrics[providerId] = circuitBreaker.getMetrics()
    }
    
    return metrics
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    total_breakers: number
    open_breakers: number
    half_open_breakers: number
    closed_breakers: number
  } {
    let open = 0
    let halfOpen = 0
    let closed = 0
    
    for (const circuitBreaker of this.circuitBreakers.values()) {
      switch (circuitBreaker.getState()) {
        case CircuitBreakerState.OPEN:
          open++
          break
        case CircuitBreakerState.HALF_OPEN:
          halfOpen++
          break
        case CircuitBreakerState.CLOSED:
          closed++
          break
      }
    }
    
    return {
      total_breakers: this.circuitBreakers.size,
      open_breakers: open,
      half_open_breakers: halfOpen,
      closed_breakers: closed
    }
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset()
    }
    
    console.info('[CircuitBreakerManager] All circuit breakers reset')
  }
  
  /**
   * Get unhealthy providers (open or half-open circuits)
   */
  getUnhealthyProviders(): string[] {
    const unhealthy: string[] = []
    
    for (const [providerId, circuitBreaker] of this.circuitBreakers) {
      const state = circuitBreaker.getState()
      if (state === CircuitBreakerState.OPEN || state === CircuitBreakerState.HALF_OPEN) {
        unhealthy.push(providerId)
      }
    }
    
    return unhealthy
  }
  
  /**
   * Check if any providers are available (not open)
   */
  hasAvailableProviders(): boolean {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      if (circuitBreaker.canExecute()) {
        return true
      }
    }
    
    return false
  }
}