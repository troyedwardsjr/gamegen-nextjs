/**
 * Multi-Factor Authentication (MFA) implementation for GameGen platform
 * Implements TOTP, backup codes, and SMS/Email fallbacks
 */

import { createAuthClient } from './client'
import { createAuthServerClient } from './server'
import * as crypto from 'crypto'

export interface MFAConfiguration {
  enabled: boolean
  methods: ('totp' | 'sms' | 'email')[]
  backup_codes: string[] // Hashed
  enforce_for_tier: boolean
  last_verified: Date | null
  totp_secret?: string
}

export interface TOTPSetupData {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface MFAVerificationResult {
  success: boolean
  method: 'totp' | 'sms' | 'email' | 'backup_code'
  error?: string
  remaining_attempts?: number
}

export class MFAManager {
  private supabase = typeof window !== 'undefined' ? createAuthClient() : createAuthServerClient()
  
  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<TOTPSetupData | boolean> {
    try {
      if (method === 'totp') {
        return await this.setupTOTP(userId)
      } else {
        // Enable SMS/Email MFA
        const { error } = await this.supabase.auth.mfa.enroll({
          factorType: method === 'sms' ? 'phone' : 'email',
          friendlyName: method === 'sms' ? 'Phone' : 'Email',
        })

        if (error) {
          console.error('MFA enrollment error:', error)
          return false
        }

        await this.updateMFAConfiguration(userId, {
          enabled: true,
          methods: [method],
          backup_codes: [],
          enforce_for_tier: false,
          last_verified: null,
        })

        return true
      }
    } catch (error) {
      console.error('Error enabling MFA:', error)
      return false
    }
  }

  /**
   * Setup TOTP authentication
   */
  async setupTOTP(userId: string): Promise<TOTPSetupData> {
    const secret = this.generateTOTPSecret()
    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes)

    // Get user email for QR code
    const { data: { user } } = await this.supabase.auth.getUser()
    const email = user?.email || 'user@gamegen.com'

    const qrCodeUrl = this.generateQRCodeUrl(email, secret)
    const manualEntryKey = this.formatSecretForManualEntry(secret)

    // Store MFA configuration
    await this.updateMFAConfiguration(userId, {
      enabled: false, // Will be enabled after verification
      methods: ['totp'],
      backup_codes: hashedBackupCodes,
      enforce_for_tier: false,
      last_verified: null,
      totp_secret: secret,
    })

    return {
      secret,
      qrCodeUrl,
      backupCodes,
      manualEntryKey,
    }
  }

  /**
   * Verify TOTP code and complete setup
   */
  async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    try {
      const config = await this.getMFAConfiguration(userId)
      if (!config?.totp_secret) {
        return false
      }

      const isValid = this.verifyTOTPCode(config.totp_secret, code)
      if (!isValid) {
        return false
      }

      // Enable MFA after successful verification
      await this.updateMFAConfiguration(userId, {
        ...config,
        enabled: true,
        last_verified: new Date(),
      })

      return true
    } catch (error) {
      console.error('TOTP verification error:', error)
      return false
    }
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFA(userId: string, code: string, method?: 'totp' | 'backup_code'): Promise<MFAVerificationResult> {
    try {
      const config = await this.getMFAConfiguration(userId)
      if (!config?.enabled) {
        return { success: false, method: 'totp', error: 'MFA not enabled' }
      }

      // Try TOTP first or if specified
      if (!method || method === 'totp') {
        if (config.totp_secret && this.verifyTOTPCode(config.totp_secret, code)) {
          await this.updateLastVerified(userId)
          return { success: true, method: 'totp' }
        }
      }

      // Try backup codes
      if (!method || method === 'backup_code') {
        const backupCodeResult = await this.verifyBackupCode(userId, code, config.backup_codes)
        if (backupCodeResult.success) {
          await this.updateLastVerified(userId)
          return backupCodeResult
        }
      }

      return { success: false, method: method || 'totp', error: 'Invalid code' }
    } catch (error) {
      console.error('MFA verification error:', error)
      return { success: false, method: method || 'totp', error: 'Verification failed' }
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<boolean> {
    try {
      // Unenroll all factors
      const { data: factors } = await this.supabase.auth.mfa.listFactors()
      if (factors) {
        for (const factor of factors.totp || []) {
          await this.supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }

      // Remove MFA configuration
      const { error } = await this.supabase
        .from('mfa_configurations')
        .delete()
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Error disabling MFA:', error)
      return false
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes()
    const hashedCodes = await this.hashBackupCodes(newCodes)

    const config = await this.getMFAConfiguration(userId)
    if (config) {
      await this.updateMFAConfiguration(userId, {
        ...config,
        backup_codes: hashedCodes,
      })
    }

    return newCodes
  }

  /**
   * Check if MFA is required for user's tier
   */
  async isMFARequired(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      // MFA required for Max tier and educational accounts
      return profile?.subscription_tier === 'max' || profile?.subscription_tier === 'educational'
    } catch (error) {
      console.error('Error checking MFA requirement:', error)
      return false
    }
  }

  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32').replace(/=/g, '')
  }

  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString().slice(2, 10)
      codes.push(code)
    }
    return codes
  }

  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map(async (code) => {
      return crypto.createHash('sha256').update(code).digest('hex')
    }))
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    const window = 1 // Allow 1 time step tolerance (30 seconds before/after)
    const timeStep = 30
    const currentTime = Math.floor(Date.now() / 1000)
    
    for (let i = -window; i <= window; i++) {
      const time = Math.floor(currentTime / timeStep) + i
      const expectedCode = this.generateTOTPCode(secret, time)
      if (expectedCode === code) {
        return true
      }
    }
    
    return false
  }

  private generateTOTPCode(secret: string, time: number): string {
    const buffer = Buffer.alloc(8)
    buffer.writeUInt32BE(0, 0)
    buffer.writeUInt32BE(time, 4)

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'))
    hmac.update(buffer)
    const digest = hmac.digest()

    const offset = digest[digest.length - 1] & 0xf
    const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000

    return code.toString().padStart(6, '0')
  }

  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'GameGen'
    const account = `${issuer}:${email}`
    const params = new URLSearchParams({
      secret,
      issuer,
    })
    
    return `otpauth://totp/${encodeURIComponent(account)}?${params}`
  }

  private formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret
  }

  private async verifyBackupCode(userId: string, code: string, hashedCodes: string[]): Promise<MFAVerificationResult> {
    const hashedInput = crypto.createHash('sha256').update(code).digest('hex')
    const codeIndex = hashedCodes.indexOf(hashedInput)
    
    if (codeIndex === -1) {
      return { success: false, method: 'backup_code', error: 'Invalid backup code' }
    }

    // Remove used backup code
    const remainingCodes = hashedCodes.filter((_, index) => index !== codeIndex)
    const config = await this.getMFAConfiguration(userId)
    
    if (config) {
      await this.updateMFAConfiguration(userId, {
        ...config,
        backup_codes: remainingCodes,
      })
    }

    return { 
      success: true, 
      method: 'backup_code',
      remaining_attempts: remainingCodes.length
    }
  }

  private async getMFAConfiguration(userId: string): Promise<MFAConfiguration | null> {
    try {
      const { data, error } = await this.supabase
        .from('mfa_configurations')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        enabled: data.enabled,
        methods: data.methods,
        backup_codes: data.backup_codes,
        enforce_for_tier: data.enforce_for_tier,
        last_verified: data.last_verified ? new Date(data.last_verified) : null,
        totp_secret: data.totp_secret,
      }
    } catch (error) {
      console.error('Error fetching MFA configuration:', error)
      return null
    }
  }

  private async updateMFAConfiguration(userId: string, config: MFAConfiguration): Promise<void> {
    const { error } = await this.supabase
      .from('mfa_configurations')
      .upsert({
        user_id: userId,
        enabled: config.enabled,
        methods: config.methods,
        backup_codes: config.backup_codes,
        enforce_for_tier: config.enforce_for_tier,
        last_verified: config.last_verified?.toISOString(),
        totp_secret: config.totp_secret,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error updating MFA configuration:', error)
      throw error
    }
  }

  private async updateLastVerified(userId: string): Promise<void> {
    await this.supabase
      .from('mfa_configurations')
      .update({ last_verified: new Date().toISOString() })
      .eq('user_id', userId)
  }
}