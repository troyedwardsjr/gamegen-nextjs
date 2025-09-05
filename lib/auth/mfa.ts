/**
 * Multi-Factor Authentication (MFA) implementation for GameGen platform
 * Implements TOTP, backup codes, and SMS/Email fallbacks
 */

import { createAuthClient } from './client'
import { randomBytes, toBase32, fromBase32, sha256, hmacSha1, generateSecureRandomString } from './crypto-utils'

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
  private supabase = createAuthClient()
  
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

      const isValid = await this.verifyTOTPCode(config.totp_secret, code)
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
        if (config.totp_secret && await this.verifyTOTPCode(config.totp_secret, code)) {
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
    return toBase32(randomBytes(20)).replace(/=/g, '')
  }

  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup codes
      const code = generateSecureRandomString(8)
      codes.push(code)
    }
    return codes
  }

  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map(async (code) => {
      return await sha256(code)
    }))
  }

  private async verifyTOTPCode(secret: string, code: string): Promise<boolean> {
    const window = 1 // Allow 1 time step tolerance (30 seconds before/after)
    const timeStep = 30
    const currentTime = Math.floor(Date.now() / 1000)
    
    for (let i = -window; i <= window; i++) {
      const time = Math.floor(currentTime / timeStep) + i
      const expectedCode = await this.generateTOTPCode(secret, time)
      if (expectedCode === code) {
        return true
      }
    }
    
    return false
  }

  private async generateTOTPCode(secret: string, time: number): Promise<string> {
    // Create time buffer (8 bytes)
    const timeBuffer = new Uint8Array(8)
    const dataView = new DataView(timeBuffer.buffer)
    dataView.setUint32(0, 0)
    dataView.setUint32(4, time)

    // Convert base32 secret to bytes
    const secretBytes = fromBase32(secret)
    
    // Generate HMAC-SHA1
    const digest = await hmacSha1(secretBytes, timeBuffer)

    // Extract dynamic binary code
    const offset = digest[digest.length - 1] & 0xf
    const binaryCode = ((digest[offset] & 0x7f) << 24) |
                      ((digest[offset + 1] & 0xff) << 16) |
                      ((digest[offset + 2] & 0xff) << 8) |
                      (digest[offset + 3] & 0xff)

    const code = binaryCode % 1000000
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
    const hashedInput = await sha256(code)
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