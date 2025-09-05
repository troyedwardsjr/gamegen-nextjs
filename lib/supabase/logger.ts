// Logging utilities for Supabase operations
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  error?: Error | any
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error | any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error,
      } : undefined,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const timestamp = entry.timestamp
    const context = entry.context ? JSON.stringify(entry.context, null, 2) : ''
    const error = entry.error ? `\nError: ${JSON.stringify(entry.error, null, 2)}` : ''
    
    return `[${timestamp}] ${levelName}: ${entry.message}${context ? `\nContext: ${context}` : ''}${error}`
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    
    if (this.isDevelopment) {
      console.log(this.formatMessage(entry))
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    
    if (this.isDevelopment) {
      console.info(this.formatMessage(entry))
    }
  }

  warn(message: string, context?: Record<string, any>, error?: Error | any): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error)
    
    console.warn(this.formatMessage(entry))
  }

  error(message: string, context?: Record<string, any>, error?: Error | any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    
    console.error(this.formatMessage(entry))
    
    // In production, you might want to send this to an external logging service
    if (!this.isDevelopment) {
      this.sendToExternalLogger(entry)
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Could be Sentry, LogRocket, DataDog, etc.
    try {
      // Example: Send to your logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }
}

// Create singleton logger instance
export const logger = new Logger()

// Specialized loggers for different contexts
export class DatabaseLogger {
  static logQuery(
    tableName: string,
    operation: string,
    filters?: Record<string, any>,
    duration?: number
  ): void {
    logger.debug(`Database ${operation} on ${tableName}`, {
      table: tableName,
      operation,
      filters,
      duration: duration ? `${duration}ms` : undefined,
    })
  }

  static logError(
    tableName: string,
    operation: string,
    error: any,
    context?: Record<string, any>
  ): void {
    logger.error(`Database ${operation} failed on ${tableName}`, {
      table: tableName,
      operation,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      ...context,
    }, error)
  }

  static logPerformance(
    operation: string,
    duration: number,
    details?: Record<string, any>
  ): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG
    const message = `Database operation took ${duration}ms: ${operation}`
    
    if (level === LogLevel.WARN) {
      logger.warn(message, { duration, ...details })
    } else {
      logger.debug(message, { duration, ...details })
    }
  }
}

export class AuthLogger {
  static logSignIn(userId: string, method: string): void {
    logger.info('User signed in', {
      userId,
      method,
      timestamp: new Date().toISOString(),
    })
  }

  static logSignOut(userId: string): void {
    logger.info('User signed out', {
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  static logAuthError(error: any, context?: Record<string, any>): void {
    logger.error('Authentication error', {
      errorCode: error.code,
      errorMessage: error.message,
      ...context,
    }, error)
  }
}

export class RealtimeLogger {
  static logConnection(channel: string, status: string): void {
    logger.info(`Realtime ${status}`, {
      channel,
      status,
      timestamp: new Date().toISOString(),
    })
  }

  static logMessage(channel: string, event: string, payload?: any): void {
    logger.debug('Realtime message received', {
      channel,
      event,
      payloadSize: payload ? JSON.stringify(payload).length : 0,
    })
  }

  static logError(channel: string, error: any): void {
    logger.error('Realtime error', {
      channel,
      errorMessage: error.message,
    }, error)
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  static startTimer(operationId: string): void {
    this.timers.set(operationId, performance.now())
  }

  static endTimer(
    operationId: string,
    operation: string,
    context?: Record<string, any>
  ): number {
    const startTime = this.timers.get(operationId)
    if (!startTime) {
      logger.warn(`No timer found for operation: ${operationId}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(operationId)

    DatabaseLogger.logPerformance(operation, duration, context)
    
    return duration
  }

  static measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operationName}_${Date.now()}_${Math.random()}`
    
    this.startTimer(operationId)
    
    return fn()
      .then((result) => {
        this.endTimer(operationId, operationName, context)
        return result
      })
      .catch((error) => {
        this.endTimer(operationId, `${operationName} (failed)`, context)
        throw error
      })
  }
}

// Error boundary for database operations
export function withLogging<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`
    
    try {
      PerformanceMonitor.startTimer(operationId)
      logger.debug(`Starting ${operation}`, context)
      
      const result = await fn(...args)
      
      const duration = PerformanceMonitor.endTimer(operationId, operation, context)
      logger.debug(`Completed ${operation}`, { duration, ...context })
      
      return result
    } catch (error) {
      PerformanceMonitor.endTimer(operationId, `${operation} (failed)`, context)
      logger.error(`Failed ${operation}`, context, error)
      throw error
    }
  }
}

// Debug utilities for development
export class DebugUtils {
  static logSupabaseRequest(
    method: string,
    table: string,
    query: any,
    result: any
  ): void {
    if (process.env.NODE_ENV !== 'development') return
    
    console.group(`🔍 Supabase ${method} - ${table}`)
    console.log('Query:', query)
    console.log('Result:', result)
    console.groupEnd()
  }

  static logRealtimeEvent(channel: string, event: any): void {
    if (process.env.NODE_ENV !== 'development') return
    
    console.group(`⚡ Realtime Event - ${channel}`)
    console.log('Event:', event)
    console.groupEnd()
  }

  static logPerformanceMetrics(): void {
    if (process.env.NODE_ENV !== 'development') return
    
    // Log performance metrics like memory usage, timing, etc.
    const memory = (performance as any).memory
    if (memory) {
      console.table({
        'Used Memory': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Total Memory': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Memory Limit': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      })
    }
  }
}