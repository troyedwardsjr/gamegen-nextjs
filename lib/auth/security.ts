/**
 * Account security utilities for GameGen platform
 * Simplified implementation that works with existing database schema
 * Uses in-memory tracking and console logging instead of missing database tables
 */

import { createAuthClient } from './client'
import { createServerSupabaseClient } from './auth-utils'
import type { NextRequest } from 'next/server'

// In-memory store for security tracking (in production, use Redis)
const securityState = {
  failedAttempts: new Map<string, { count: number; lastAttempt: Date; attempts: Date[] }>(),
  lockedAccounts: new Map<string, { lockedUntil: Date; reason: string }>(),
  suspiciousActivity: new Map<string, { lastCheck: Date; riskScore: number }>(),
}

// Helper to get client IP from request
const getClientIP = (request?: NextRequest): string => {
  if (!request) return 'unknown'
  
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const real = request.headers.get('x-real-ip')
  if (real) {
    return real.trim()
  }
  
  return request.ip || 'unknown'
}

export interface SecurityEventType {
  LOGIN_SUCCESS: 'auth.login.success'
  LOGIN_FAILED: 'auth.login.failed'
  LOGIN_BLOCKED: 'auth.login.blocked'
  PASSWORD_CHANGED: 'auth.password.changed'
  MFA_ENABLED: 'auth.mfa.enabled'
  MFA_DISABLED: 'auth.mfa.disabled'
  PERMISSION_DENIED: 'auth.permission.denied'
  SUSPICIOUS_ACTIVITY: 'security.suspicious.activity'
  DATA_BREACH_ATTEMPT: 'security.breach.attempt'
  ACCOUNT_LOCKED: 'security.account.locked'
  ACCOUNT_UNLOCKED: 'security.account.unlocked'
}

export interface SecurityEvent {
  type: keyof SecurityEventType
  user_id?: string
  ip_address: string
  user_agent: string
  metadata: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

export interface AccountLockout {
  user_id: string
  locked_until: Date
  failed_attempts: number
  lock_reason: string
  created_at: Date
}

export interface SuspiciousActivityIndicator {
  multipleFailedLogins: boolean
  unusualLocation: boolean
  unusualDevice: boolean
  rapidRequests: boolean
  riskScore: number
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const EXTENDED_LOCKOUT_DURATION = 60 * 60 * 1000 // 1 hour
const PROGRESSIVE_LOCKOUT_THRESHOLD = 3

export class AccountSecurityManager {
  /**
   * Log a security event (simplified - logs to console and user_sessions table)
   */
  async logSecurityEvent(
    type: keyof SecurityEventType,
    metadata: Record<string, any>,
    request?: NextRequest,
    userId?: string
  ): Promise<void> {
    try {
      const ip_address = getClientIP(request)
      const user_agent = request?.headers.get('user-agent') || 'unknown'
      
      const event: Omit<SecurityEvent, 'timestamp'> = {
        type,
        user_id: userId || metadata.userId,
        ip_address,
        user_agent,
        metadata,
        severity: this.calculateEventSeverity(type, metadata),
      }

      // Log to console for now (in production, send to logging service)
      console.log(`[SECURITY] ${type}:`, {
        user_id: event.user_id,
        ip_address: event.ip_address,
        severity: event.severity,
        metadata: event.metadata
      })

      // Try to log to user_sessions table if we have a user
      if (userId) {
        try {
          const supabase = await createServerSupabaseClient()
          await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              ip_address: event.ip_address,
              user_agent: event.user_agent,
              platform: 'web',
              activities: [
                {
                  type: 'security_event',
                  event_type: type,
                  severity: event.severity,
                  timestamp: new Date().toISOString(),
                  metadata: event.metadata
                }
              ],
              created_at: new Date().toISOString()
            })
        } catch (dbError) {
          console.warn('Could not log to user_sessions:', dbError)
        }
      }

      // Handle high-severity events immediately
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.handleHighSeverityEvent(event, request)
      }
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Record a failed login attempt (uses in-memory tracking)
   */
  async recordFailedLogin(
    email: string,
    request?: NextRequest,
    reason = 'invalid_credentials'
  ): Promise<{ shouldLock: boolean; attemptsRemaining: number }> {
    const ip_address = getClientIP(request)
    const key = `${email}:${ip_address}`
    
    try {
      const now = new Date()
      let attempts = securityState.failedAttempts.get(key) || { 
        count: 0, 
        lastAttempt: now, 
        attempts: [] 
      }
      
      // Clean up old attempts (older than lockout duration)
      const cutoff = new Date(now.getTime() - LOCKOUT_DURATION)
      attempts.attempts = attempts.attempts.filter(attempt => attempt > cutoff)
      
      // Add current attempt
      attempts.count = attempts.attempts.length + 1
      attempts.lastAttempt = now
      attempts.attempts.push(now)
      
      securityState.failedAttempts.set(key, attempts)

      await this.logSecurityEvent(
        'LOGIN_FAILED',
        { email, reason, attempt_count: attempts.count },
        request
      )

      const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - attempts.count)
      const shouldLock = attempts.count >= MAX_FAILED_ATTEMPTS

      if (shouldLock) {
        await this.lockAccount(email, 'too_many_failed_attempts', request)
      }

      return { shouldLock, attemptsRemaining }
    } catch (error) {
      console.error('Error recording failed login:', error)
      return { shouldLock: false, attemptsRemaining: MAX_FAILED_ATTEMPTS }
    }
  }

  /**
   * Record a successful login
   */
  async recordSuccessfulLogin(userId: string, request?: NextRequest): Promise<void> {
    const ip_address = getClientIP(request)
    
    try {
      // Clear failed attempts for this user/IP
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        const key = `${user.email}:${ip_address}`
        securityState.failedAttempts.delete(key)
      }

      // Log successful login
      await this.logSecurityEvent(
        'LOGIN_SUCCESS',
        { userId, ip_address },
        request,
        userId
      )

      // Update last login information in profiles table
      await supabase
        .from('profiles')
        .update({
          last_active_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Error recording successful login:', error)
    }
  }

  /**
   * Lock an account (uses in-memory tracking)
   */
  async lockAccount(
    identifier: string, // email or user ID
    reason: string,
    request?: NextRequest
  ): Promise<boolean> {
    try {
      const lockoutDuration = LOCKOUT_DURATION
      const lockedUntil = new Date(Date.now() + lockoutDuration)

      // Store in memory
      securityState.lockedAccounts.set(identifier, {
        lockedUntil,
        reason
      })

      await this.logSecurityEvent(
        'ACCOUNT_LOCKED',
        { 
          identifier, 
          reason, 
          locked_until: lockedUntil.toISOString(),
          duration_minutes: lockoutDuration / 60000 
        },
        request
      )

      return true
    } catch (error) {
      console.error('Error locking account:', error)
      return false
    }
  }

  /**
   * Check if an account is locked
   */
  async isAccountLocked(identifier: string): Promise<{ locked: boolean; lockedUntil?: Date; reason?: string }> {
    try {
      const lockInfo = securityState.lockedAccounts.get(identifier)
      
      if (!lockInfo) {
        return { locked: false }
      }

      // Check if lockout has expired
      const now = new Date()
      if (now >= lockInfo.lockedUntil) {
        securityState.lockedAccounts.delete(identifier)
        return { locked: false }
      }

      return {
        locked: true,
        lockedUntil: lockInfo.lockedUntil,
        reason: lockInfo.reason,
      }
    } catch (error) {
      console.error('Error checking account lock status:', error)
      return { locked: false }
    }
  }

  /**
   * Unlock an account manually (admin function)
   */
  async unlockAccount(identifier: string, adminId: string): Promise<boolean> {
    try {
      securityState.lockedAccounts.delete(identifier)

      await this.logSecurityEvent(
        'ACCOUNT_UNLOCKED',
        { identifier, admin_id: adminId, manual_unlock: true },
        undefined,
        adminId
      )

      return true
    } catch (error) {
      console.error('Error unlocking account:', error)
      return false
    }
  }

  /**
   * Analyze suspicious activity (simplified version)
   */
  async analyzeSuspiciousActivity(
    userId: string,
    request?: NextRequest
  ): Promise<SuspiciousActivityIndicator> {
    try {
      const ip_address = getClientIP(request)
      const user_agent = request?.headers.get('user-agent') || 'unknown'
      
      // Simplified analysis using in-memory data
      const key = `${userId}:${ip_address}`
      const failedAttempts = securityState.failedAttempts.get(key)
      
      const multipleFailedLogins = (failedAttempts?.count || 0) >= 3
      
      // For now, mark unusual location/device as false (would need historical data)
      const unusualLocation = false
      const unusualDevice = false
      const rapidRequests = false

      // Calculate risk score
      let riskScore = 0
      if (multipleFailedLogins) riskScore += 30

      const indicator: SuspiciousActivityIndicator = {
        multipleFailedLogins,
        unusualLocation,
        unusualDevice,
        rapidRequests,
        riskScore,
      }

      // Log suspicious activity if risk score is high
      if (riskScore >= 30) {
        await this.logSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          { 
            risk_score: riskScore,
            indicators: indicator,
            ip_address,
            user_agent,
          },
          request,
          userId
        )
      }

      return indicator
    } catch (error) {
      console.error('Error analyzing suspicious activity:', error)
      return {
        multipleFailedLogins: false,
        unusualLocation: false,
        unusualDevice: false,
        rapidRequests: false,
        riskScore: 0,
      }
    }
  }

  /**
   * Get security events for a user (simplified - returns empty array)
   */
  async getUserSecurityEvents(
    userId: string,
    limit = 50,
    eventType?: keyof SecurityEventType
  ): Promise<SecurityEvent[]> {
    // This would return events from a logging service in production
    console.log(`[SECURITY] Requested security events for user ${userId}, type: ${eventType}`)
    return []
  }

  private calculateEventSeverity(
    type: keyof SecurityEventType,
    metadata: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return 'low'
      case 'LOGIN_FAILED':
        return metadata.attempt_count > 3 ? 'medium' : 'low'
      case 'LOGIN_BLOCKED':
      case 'ACCOUNT_LOCKED':
        return 'high'
      case 'SUSPICIOUS_ACTIVITY':
        return metadata.risk_score > 80 ? 'critical' : 'high'
      case 'DATA_BREACH_ATTEMPT':
        return 'critical'
      case 'PASSWORD_CHANGED':
      case 'MFA_ENABLED':
      case 'MFA_DISABLED':
        return 'medium'
      case 'PERMISSION_DENIED':
        return 'medium'
      default:
        return 'low'
    }
  }

  private async handleHighSeverityEvent(
    event: Omit<SecurityEvent, 'timestamp'>,
    request?: NextRequest
  ): Promise<void> {
    // In a production environment, this would integrate with alerting systems
    console.warn('[SECURITY] High severity security event:', event)
    
    // For critical events, consider additional automated responses
    if (event.severity === 'critical' && event.user_id) {
      if (event.type === 'DATA_BREACH_ATTEMPT') {
        // Automatically lock account for data breach attempts
        await this.lockAccount(event.user_id, 'data_breach_attempt', request)
      }
    }
  }

  /**
   * Clean up old security data (simplified)
   */
  async cleanupOldSecurityData(): Promise<void> {
    try {
      const now = new Date()
      
      // Clean up expired lockouts
      for (const [key, lockInfo] of securityState.lockedAccounts.entries()) {
        if (now >= lockInfo.lockedUntil) {
          securityState.lockedAccounts.delete(key)
        }
      }

      // Clean up old failed attempts
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours
      for (const [key, attempts] of securityState.failedAttempts.entries()) {
        attempts.attempts = attempts.attempts.filter(attempt => attempt > cutoff)
        if (attempts.attempts.length === 0) {
          securityState.failedAttempts.delete(key)
        } else {
          attempts.count = attempts.attempts.length
          securityState.failedAttempts.set(key, attempts)
        }
      }

      console.log('[SECURITY] Cleaned up old security data')
    } catch (error) {
      console.error('Error cleaning up old security data:', error)
    }
  }
}