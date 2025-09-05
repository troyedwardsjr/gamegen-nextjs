/**
 * Account security utilities for GameGen platform
 * Implements account lockout, suspicious activity detection, and security event logging
 */

import { createAuthClient } from './client'
import { createAuthServerClient } from './server'
import { getClientIP } from './rate-limit'
import type { NextRequest } from 'next/server'

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
  private supabase = typeof window !== 'undefined' ? createAuthClient() : createAuthServerClient()

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: keyof SecurityEventType,
    metadata: Record<string, any>,
    request?: NextRequest,
    userId?: string
  ): Promise<void> {
    try {
      const ip_address = request ? getClientIP(request) : 'unknown'
      const user_agent = request?.headers.get('user-agent') || 'unknown'
      
      const event: Omit<SecurityEvent, 'timestamp'> = {
        type,
        user_id: userId || metadata.userId,
        ip_address,
        user_agent,
        metadata,
        severity: this.calculateEventSeverity(type, metadata),
      }

      await this.supabase
        .from('security_events')
        .insert({
          event_type: type,
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          metadata: event.metadata,
          severity: event.severity,
          created_at: new Date().toISOString(),
        })

      // Handle high-severity events immediately
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.handleHighSeverityEvent(event, request)
      }
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedLogin(
    email: string,
    request?: NextRequest,
    reason = 'invalid_credentials'
  ): Promise<{ shouldLock: boolean; attemptsRemaining: number }> {
    const ip_address = request ? getClientIP(request) : 'unknown'
    
    try {
      // Get or create failed attempts record
      const { data: existingAttempts, error: selectError } = await this.supabase
        .from('failed_login_attempts')
        .select('*')
        .eq('email', email)
        .eq('ip_address', ip_address)
        .gte('created_at', new Date(Date.now() - LOCKOUT_DURATION).toISOString())
        .order('created_at', { ascending: false })

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching failed attempts:', selectError)
      }

      const currentAttempts = (existingAttempts?.length || 0) + 1
      
      // Record this attempt
      await this.supabase
        .from('failed_login_attempts')
        .insert({
          email,
          ip_address,
          user_agent: request?.headers.get('user-agent') || 'unknown',
          reason,
          created_at: new Date().toISOString(),
        })

      await this.logSecurityEvent(
        'LOGIN_FAILED',
        { email, reason, attempt_count: currentAttempts },
        request
      )

      const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts)
      const shouldLock = currentAttempts >= MAX_FAILED_ATTEMPTS

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
    const ip_address = request ? getClientIP(request) : 'unknown'
    
    try {
      // Clear failed attempts for this user/IP
      const { data: { user } } = await this.supabase.auth.getUser()
      if (user?.email) {
        await this.supabase
          .from('failed_login_attempts')
          .delete()
          .eq('email', user.email)
          .eq('ip_address', ip_address)
      }

      // Log successful login
      await this.logSecurityEvent(
        'LOGIN_SUCCESS',
        { userId, ip_address },
        request,
        userId
      )

      // Update last login information
      await this.supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_ip: ip_address,
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Error recording successful login:', error)
    }
  }

  /**
   * Lock an account
   */
  async lockAccount(
    identifier: string, // email or user ID
    reason: string,
    request?: NextRequest
  ): Promise<boolean> {
    try {
      // Determine if identifier is email or user ID
      const isEmail = identifier.includes('@')
      let userId: string | undefined
      
      if (isEmail) {
        // Look up user ID by email (this requires a server-side function)
        const { data } = await this.supabase.rpc('get_user_id_by_email', {
          email_address: identifier
        })
        userId = data
      } else {
        userId = identifier
      }

      if (!userId) {
        console.warn('Could not find user ID for account lock')
        return false
      }

      // Check for progressive lockout (longer duration for repeat offenders)
      const recentLockouts = await this.getRecentLockouts(userId)
      const lockoutDuration = recentLockouts >= PROGRESSIVE_LOCKOUT_THRESHOLD 
        ? EXTENDED_LOCKOUT_DURATION 
        : LOCKOUT_DURATION

      const lockedUntil = new Date(Date.now() + lockoutDuration)

      // Insert lockout record
      const { error } = await this.supabase
        .from('account_lockouts')
        .insert({
          user_id: userId,
          locked_until: lockedUntil.toISOString(),
          lock_reason: reason,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error creating account lockout:', error)
        return false
      }

      await this.logSecurityEvent(
        'ACCOUNT_LOCKED',
        { 
          userId, 
          reason, 
          locked_until: lockedUntil.toISOString(),
          duration_minutes: lockoutDuration / 60000 
        },
        request,
        userId
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
  async isAccountLocked(userId: string): Promise<{ locked: boolean; lockedUntil?: Date; reason?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('account_lockouts')
        .select('locked_until, lock_reason')
        .eq('user_id', userId)
        .gte('locked_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking account lockout:', error)
        return { locked: false }
      }

      if (!data) {
        return { locked: false }
      }

      return {
        locked: true,
        lockedUntil: new Date(data.locked_until),
        reason: data.lock_reason,
      }
    } catch (error) {
      console.error('Error checking account lock status:', error)
      return { locked: false }
    }
  }

  /**
   * Unlock an account manually (admin function)
   */
  async unlockAccount(userId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('account_lockouts')
        .update({ locked_until: new Date().toISOString() })
        .eq('user_id', userId)
        .gte('locked_until', new Date().toISOString())

      if (error) {
        console.error('Error unlocking account:', error)
        return false
      }

      await this.logSecurityEvent(
        'ACCOUNT_UNLOCKED',
        { userId, admin_id: adminId, manual_unlock: true },
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
   * Analyze suspicious activity for a user
   */
  async analyzeSuspiciousActivity(
    userId: string,
    request?: NextRequest
  ): Promise<SuspiciousActivityIndicator> {
    try {
      const ip_address = request ? getClientIP(request) : 'unknown'
      const user_agent = request?.headers.get('user-agent') || 'unknown'
      
      // Check for multiple failed logins
      const { data: failedLogins } = await this.supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'LOGIN_FAILED')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

      const multipleFailedLogins = (failedLogins?.length || 0) >= 3

      // Check for unusual location (IP address)
      const { data: recentLogins } = await this.supabase
        .from('security_events')
        .select('ip_address')
        .eq('user_id', userId)
        .eq('event_type', 'LOGIN_SUCCESS')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      const knownIPs = new Set(recentLogins?.map(login => login.ip_address) || [])
      const unusualLocation = !knownIPs.has(ip_address) && knownIPs.size > 0

      // Check for unusual device (simplified user agent check)
      const { data: recentDevices } = await this.supabase
        .from('security_events')
        .select('user_agent')
        .eq('user_id', userId)
        .eq('event_type', 'LOGIN_SUCCESS')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      const knownDevices = new Set(recentDevices?.map(device => device.user_agent) || [])
      const unusualDevice = !knownDevices.has(user_agent) && knownDevices.size > 0

      // Check for rapid requests (basic implementation)
      const { data: recentEvents } = await this.supabase
        .from('security_events')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      const rapidRequests = (recentEvents?.length || 0) > 20 // More than 20 events in 5 minutes

      // Calculate risk score
      let riskScore = 0
      if (multipleFailedLogins) riskScore += 30
      if (unusualLocation) riskScore += 25
      if (unusualDevice) riskScore += 20
      if (rapidRequests) riskScore += 25

      const indicator: SuspiciousActivityIndicator = {
        multipleFailedLogins,
        unusualLocation,
        unusualDevice,
        rapidRequests,
        riskScore,
      }

      // Log suspicious activity if risk score is high
      if (riskScore >= 60) {
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
   * Get security events for a user
   */
  async getUserSecurityEvents(
    userId: string,
    limit = 50,
    eventType?: keyof SecurityEventType
  ): Promise<SecurityEvent[]> {
    try {
      let query = this.supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (eventType) {
        query = query.eq('event_type', eventType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching security events:', error)
        return []
      }

      return data?.map(event => ({
        type: event.event_type,
        user_id: event.user_id,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        metadata: event.metadata,
        severity: event.severity,
        timestamp: new Date(event.created_at),
      })) || []
    } catch (error) {
      console.error('Error fetching security events:', error)
      return []
    }
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
    console.warn('High severity security event:', event)
    
    // For critical events, consider additional automated responses
    if (event.severity === 'critical' && event.user_id) {
      if (event.type === 'DATA_BREACH_ATTEMPT') {
        // Automatically lock account for data breach attempts
        await this.lockAccount(event.user_id, 'data_breach_attempt', request)
      }
      
      if (event.type === 'SUSPICIOUS_ACTIVITY' && event.metadata.risk_score > 90) {
        // Require MFA verification for extremely suspicious activity
        await this.requireMFAVerification(event.user_id)
      }
    }
  }

  private async getRecentLockouts(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('account_lockouts')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      return data?.length || 0
    } catch (error) {
      console.error('Error fetching recent lockouts:', error)
      return 0
    }
  }

  private async requireMFAVerification(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('mfa_configurations')
        .update({ requires_reverification: true })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error requiring MFA reverification:', error)
    }
  }

  /**
   * Clean up old security events and failed attempts
   */
  async cleanupOldSecurityData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Clean up old security events (keep high/critical events longer)
      await this.supabase
        .from('security_events')
        .delete()
        .lt('created_at', thirtyDaysAgo)
        .in('severity', ['low', 'medium'])

      // Clean up old failed login attempts
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      await this.supabase
        .from('failed_login_attempts')
        .delete()
        .lt('created_at', oneDayAgo)

      // Clean up expired lockouts
      await this.supabase
        .from('account_lockouts')
        .delete()
        .lt('locked_until', new Date().toISOString())
    } catch (error) {
      console.error('Error cleaning up old security data:', error)
    }
  }
}