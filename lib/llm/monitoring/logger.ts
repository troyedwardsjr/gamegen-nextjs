/**
 * LLM Request/Response Monitoring and Logging
 * 
 * Comprehensive logging system for LLM provider requests and responses,
 * including performance metrics, error tracking, and audit trails.
 */

import {
  GenerationRequest,
  GenerationResponse,
  RequestLog,
  LLMError,
  TokenUsage
} from '../types'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface LoggerConfig {
  enabled: boolean
  log_requests: boolean
  log_responses: boolean
  log_errors: boolean
  log_performance: boolean
  sensitive_data_masking: boolean
  retention_days: number
  max_payload_size: number
  async_logging: boolean
  buffer_size: number
  flush_interval: number
}

export interface PerformanceMetrics {
  request_id: string
  provider_id: string
  user_id?: string
  start_time: Date
  end_time: Date
  response_time: number
  tokens_used: TokenUsage
  cost: number
  success: boolean
  error_code?: string
  error_message?: string
  request_size: number
  response_size: number
}

export interface SecurityEvent {
  event_type: 'rate_limit_exceeded' | 'authentication_failed' | 'content_filtered' | 'suspicious_activity'
  user_id?: string
  provider_id: string
  timestamp: Date
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class LLMLogger {
  private config: LoggerConfig
  private supabase: SupabaseClient
  private logBuffer: RequestLog[] = []
  private performanceBuffer: PerformanceMetrics[] = []
  private securityBuffer: SecurityEvent[] = []
  private flushTimer?: NodeJS.Timeout
  
  constructor(config: LoggerConfig) {
    this.config = config
    this.supabase = createClient()
    
    if (this.config.async_logging) {
      this.startPeriodicFlush()
    }
    
    console.info('[LLMLogger] Logger initialized', { config: this.config })
  }
  
  /**
   * Log a request/response cycle
   */
  async logRequest(
    request: GenerationRequest,
    response?: GenerationResponse,
    error?: LLMError,
    providerId?: string,
    userId?: string
  ): Promise<void> {
    if (!this.config.enabled) {
      return
    }
    
    const requestId = this.generateRequestId()
    const startTime = new Date()
    const endTime = response?.created_at || new Date()
    
    // Create log entry
    const logEntry: RequestLog = {
      id: requestId,
      user_id: userId || request.user_id || 'anonymous',
      provider_id: providerId || response?.provider_id || 'unknown',
      request: this.config.log_requests ? this.sanitizeRequest(request) : ({} as GenerationRequest),
      response: this.config.log_responses && response ? this.sanitizeResponse(response) : undefined,
      error: this.config.log_errors && error ? error.message : undefined,
      start_time: startTime,
      end_time: endTime,
      response_time: endTime.getTime() - startTime.getTime(),
      cost: this.calculateCost(response?.usage)
    }
    
    // Log performance metrics
    if (this.config.log_performance && response) {
      await this.logPerformance({
        request_id: requestId,
        provider_id: logEntry.provider_id,
        user_id: logEntry.user_id,
        start_time: startTime,
        end_time: endTime,
        response_time: logEntry.response_time || 0,
        tokens_used: response.usage,
        cost: logEntry.cost || 0,
        success: !error,
        error_code: error?.code,
        error_message: error?.message,
        request_size: this.calculatePayloadSize(request),
        response_size: this.calculatePayloadSize(response)
      })
    }
    
    // Buffer or immediately store
    if (this.config.async_logging) {
      this.logBuffer.push(logEntry)
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.config.buffer_size) {
        await this.flushLogs()
      }
    } else {
      await this.storeLogs([logEntry])
    }
  }
  
  /**
   * Log performance metrics
   */
  async logPerformance(metrics: PerformanceMetrics): Promise<void> {
    if (!this.config.enabled || !this.config.log_performance) {
      return
    }
    
    if (this.config.async_logging) {
      this.performanceBuffer.push(metrics)
      
      // Flush if buffer is full
      if (this.performanceBuffer.length >= this.config.buffer_size) {
        await this.flushPerformanceMetrics()
      }
    } else {
      await this.storePerformanceMetrics([metrics])
    }
  }
  
  /**
   * Log security events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    if (!this.config.enabled) {
      return
    }
    
    // Always log security events immediately for high severity
    if (event.severity === 'critical' || event.severity === 'high') {
      await this.storeSecurityEvents([event])
      
      // Send alert for critical events
      if (event.severity === 'critical') {
        await this.sendSecurityAlert(event)
      }
    } else {
      if (this.config.async_logging) {
        this.securityBuffer.push(event)
        
        if (this.securityBuffer.length >= this.config.buffer_size) {
          await this.flushSecurityEvents()
        }
      } else {
        await this.storeSecurityEvents([event])
      }
    }
  }
  
  /**
   * Get request logs with filtering
   */
  async getRequestLogs(filters: {
    user_id?: string
    provider_id?: string
    start_date?: Date
    end_date?: Date
    success_only?: boolean
    limit?: number
    offset?: number
  }): Promise<{ logs: RequestLog[]; total_count: number }> {
    let query = this.supabase
      .from('llm_request_logs')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    
    if (filters.provider_id) {
      query = query.eq('provider_id', filters.provider_id)
    }
    
    if (filters.start_date) {
      query = query.gte('start_time', filters.start_date.toISOString())
    }
    
    if (filters.end_date) {
      query = query.lte('end_time', filters.end_date.toISOString())
    }
    
    if (filters.success_only) {
      query = query.is('error', null)
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }
    
    // Order by most recent first
    query = query.order('start_time', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to fetch request logs: ${error.message}`)
    }
    
    return {
      logs: data || [],
      total_count: count || 0
    }
  }
  
  /**
   * Get performance metrics with aggregation
   */
  async getPerformanceMetrics(filters: {
    provider_id?: string
    start_date?: Date
    end_date?: Date
    aggregation?: 'hour' | 'day' | 'week'
  }): Promise<{
    metrics: PerformanceMetrics[]
    aggregated: {
      avg_response_time: number
      total_requests: number
      success_rate: number
      total_tokens: number
      total_cost: number
    }
  }> {
    let query = this.supabase
      .from('llm_performance_metrics')
      .select('*')
    
    if (filters.provider_id) {
      query = query.eq('provider_id', filters.provider_id)
    }
    
    if (filters.start_date) {
      query = query.gte('start_time', filters.start_date.toISOString())
    }
    
    if (filters.end_date) {
      query = query.lte('end_time', filters.end_date.toISOString())
    }
    
    const { data, error } = await query.order('start_time', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`)
    }
    
    const metrics = data || []
    
    // Calculate aggregated metrics
    const aggregated = this.aggregatePerformanceMetrics(metrics)
    
    return { metrics, aggregated }
  }
  
  /**
   * Get security events
   */
  async getSecurityEvents(filters: {
    event_type?: string
    severity?: string
    start_date?: Date
    end_date?: Date
    limit?: number
  }): Promise<SecurityEvent[]> {
    let query = this.supabase
      .from('llm_security_events')
      .select('*')
    
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type)
    }
    
    if (filters.severity) {
      query = query.eq('severity', filters.severity)
    }
    
    if (filters.start_date) {
      query = query.gte('timestamp', filters.start_date.toISOString())
    }
    
    if (filters.end_date) {
      query = query.lte('timestamp', filters.end_date.toISOString())
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query.order('timestamp', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch security events: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs(): Promise<{ deleted_logs: number; deleted_metrics: number; deleted_events: number }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days)
    
    // Delete old request logs
    const { count: deletedLogs } = await this.supabase
      .from('llm_request_logs')
      .delete({ count: 'exact' })
      .lt('start_time', cutoffDate.toISOString())
    
    // Delete old performance metrics
    const { count: deletedMetrics } = await this.supabase
      .from('llm_performance_metrics')
      .delete({ count: 'exact' })
      .lt('start_time', cutoffDate.toISOString())
    
    // Delete old security events (keep security events longer - 90 days)
    const securityCutoff = new Date()
    securityCutoff.setDate(securityCutoff.getDate() - 90)
    
    const { count: deletedEvents } = await this.supabase
      .from('llm_security_events')
      .delete({ count: 'exact' })
      .lt('timestamp', securityCutoff.toISOString())
    
    console.info('[LLMLogger] Cleanup completed', {
      deleted_logs: deletedLogs || 0,
      deleted_metrics: deletedMetrics || 0,
      deleted_events: deletedEvents || 0,
      cutoff_date: cutoffDate
    })
    
    return {
      deleted_logs: deletedLogs || 0,
      deleted_metrics: deletedMetrics || 0,
      deleted_events: deletedEvents || 0
    }
  }
  
  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Restart periodic flush if async logging settings changed
    if ('async_logging' in config || 'flush_interval' in config) {
      this.stopPeriodicFlush()
      
      if (this.config.async_logging) {
        this.startPeriodicFlush()
      }
    }
    
    console.info('[LLMLogger] Configuration updated', { config: this.config })
  }
  
  /**
   * Flush all buffers and cleanup
   */
  async destroy(): Promise<void> {
    this.stopPeriodicFlush()
    
    // Flush all remaining logs
    if (this.logBuffer.length > 0) {
      await this.flushLogs()
    }
    
    if (this.performanceBuffer.length > 0) {
      await this.flushPerformanceMetrics()
    }
    
    if (this.securityBuffer.length > 0) {
      await this.flushSecurityEvents()
    }
    
    console.info('[LLMLogger] Logger destroyed')
  }
  
  /**
   * Flush log buffer to database
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return
    }
    
    const logs = this.logBuffer.splice(0, this.logBuffer.length)
    await this.storeLogs(logs)
  }
  
  /**
   * Flush performance metrics buffer to database
   */
  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceBuffer.length === 0) {
      return
    }
    
    const metrics = this.performanceBuffer.splice(0, this.performanceBuffer.length)
    await this.storePerformanceMetrics(metrics)
  }
  
  /**
   * Flush security events buffer to database
   */
  private async flushSecurityEvents(): Promise<void> {
    if (this.securityBuffer.length === 0) {
      return
    }
    
    const events = this.securityBuffer.splice(0, this.securityBuffer.length)
    await this.storeSecurityEvents(events)
  }
  
  /**
   * Store logs in database
   */
  private async storeLogs(logs: RequestLog[]): Promise<void> {
    const { error } = await this.supabase
      .from('llm_request_logs')
      .insert(logs)
    
    if (error) {
      console.error('[LLMLogger] Failed to store logs:', error)
      
      // Re-add to buffer for retry (with size limit)
      if (this.config.async_logging && this.logBuffer.length < this.config.buffer_size * 2) {
        this.logBuffer.unshift(...logs)
      }
    }
  }
  
  /**
   * Store performance metrics in database
   */
  private async storePerformanceMetrics(metrics: PerformanceMetrics[]): Promise<void> {
    const { error } = await this.supabase
      .from('llm_performance_metrics')
      .insert(metrics)
    
    if (error) {
      console.error('[LLMLogger] Failed to store performance metrics:', error)
      
      // Re-add to buffer for retry
      if (this.config.async_logging && this.performanceBuffer.length < this.config.buffer_size * 2) {
        this.performanceBuffer.unshift(...metrics)
      }
    }
  }
  
  /**
   * Store security events in database
   */
  private async storeSecurityEvents(events: SecurityEvent[]): Promise<void> {
    const { error } = await this.supabase
      .from('llm_security_events')
      .insert(events)
    
    if (error) {
      console.error('[LLMLogger] Failed to store security events:', error)
      
      // Re-add to buffer for retry
      if (this.config.async_logging && this.securityBuffer.length < this.config.buffer_size * 2) {
        this.securityBuffer.unshift(...events)
      }
    }
  }
  
  /**
   * Start periodic buffer flushing
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await Promise.allSettled([
        this.flushLogs(),
        this.flushPerformanceMetrics(),
        this.flushSecurityEvents()
      ])
    }, this.config.flush_interval)
  }
  
  /**
   * Stop periodic buffer flushing
   */
  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }
  
  /**
   * Sanitize request data for logging
   */
  private sanitizeRequest(request: GenerationRequest): GenerationRequest {
    if (!this.config.sensitive_data_masking) {
      return request
    }
    
    // Create deep copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(request))
    
    // Mask potentially sensitive content in messages
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map((msg: any) => ({
        ...msg,
        content: typeof msg.content === 'string' && msg.content.length > this.config.max_payload_size
          ? msg.content.substring(0, this.config.max_payload_size) + '...[truncated]'
          : msg.content
      }))
    }
    
    // Mask system prompt if too long
    if (sanitized.system_prompt && sanitized.system_prompt.length > this.config.max_payload_size) {
      sanitized.system_prompt = sanitized.system_prompt.substring(0, this.config.max_payload_size) + '...[truncated]'
    }
    
    return sanitized
  }
  
  /**
   * Sanitize response data for logging
   */
  private sanitizeResponse(response: GenerationResponse): GenerationResponse {
    if (!this.config.sensitive_data_masking) {
      return response
    }
    
    const sanitized = JSON.parse(JSON.stringify(response))
    
    // Truncate long responses
    if (sanitized.content && sanitized.content.length > this.config.max_payload_size) {
      sanitized.content = sanitized.content.substring(0, this.config.max_payload_size) + '...[truncated]'
    }
    
    return sanitized
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Calculate request/response cost (placeholder)
   */
  private calculateCost(usage?: TokenUsage): number {
    if (!usage) return 0
    
    // Placeholder cost calculation - would integrate with billing system
    const inputCost = usage.prompt_tokens * 0.000003 // $3 per million tokens
    const outputCost = usage.completion_tokens * 0.000015 // $15 per million tokens
    
    return inputCost + outputCost
  }
  
  /**
   * Calculate payload size in bytes
   */
  private calculatePayloadSize(payload: any): number {
    return new TextEncoder().encode(JSON.stringify(payload)).length
  }
  
  /**
   * Aggregate performance metrics
   */
  private aggregatePerformanceMetrics(metrics: PerformanceMetrics[]): {
    avg_response_time: number
    total_requests: number
    success_rate: number
    total_tokens: number
    total_cost: number
  } {
    if (metrics.length === 0) {
      return {
        avg_response_time: 0,
        total_requests: 0,
        success_rate: 0,
        total_tokens: 0,
        total_cost: 0
      }
    }
    
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.response_time, 0)
    const successfulRequests = metrics.filter(m => m.success).length
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokens_used.total_tokens, 0)
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)
    
    return {
      avg_response_time: totalResponseTime / metrics.length,
      total_requests: metrics.length,
      success_rate: successfulRequests / metrics.length,
      total_tokens: totalTokens,
      total_cost: totalCost
    }
  }
  
  /**
   * Send security alert for critical events
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Placeholder for security alerting system
    console.error('[SECURITY ALERT]', {
      event_type: event.event_type,
      severity: event.severity,
      details: event.details,
      timestamp: event.timestamp
    })
    
    // In a real implementation, this would:
    // - Send email/SMS alerts
    // - Post to Slack/Discord
    // - Trigger incident response
    // - Update security dashboards
  }
}