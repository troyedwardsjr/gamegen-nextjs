/**
 * Email verification system for GameGen platform
 * Handles email confirmation, resending verification emails, and email change verification
 */

import { createAuthClient } from './client'
import { createAuthServerClient } from './server'

export interface EmailVerificationResult {
  success: boolean
  error?: string
  requiresVerification?: boolean
}

export interface EmailVerificationStatus {
  isVerified: boolean
  email: string
  verificationSent?: Date
  canResend: boolean
  nextResendTime?: Date
}

export class EmailVerificationManager {
  private supabase = typeof window !== 'undefined' ? createAuthClient() : createAuthServerClient()
  private readonly RESEND_COOLDOWN = 60000 // 1 minute cooldown between resends

  /**
   * Send email verification to the current user
   */
  async sendVerificationEmail(email?: string): Promise<EmailVerificationResult> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { 
          success: false, 
          error: 'User must be authenticated to send verification email' 
        }
      }

      const targetEmail = email || user.email
      if (!targetEmail) {
        return { success: false, error: 'No email address found' }
      }

      // Check rate limiting
      const canSend = await this.canSendVerificationEmail(user.id)
      if (!canSend.allowed) {
        return { 
          success: false, 
          error: `Please wait ${Math.ceil(canSend.waitTime / 1000)} seconds before requesting another verification email` 
        }
      }

      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${this.getBaseUrl()}/auth/verify-email`,
        },
      })

      if (error) {
        console.error('Email verification send error:', error)
        return { success: false, error: error.message }
      }

      // Log the verification email send attempt
      await this.logVerificationAttempt(user.id, targetEmail)

      return { success: true }
    } catch (error) {
      console.error('Unexpected email verification error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send verification email' 
      }
    }
  }

  /**
   * Verify email with token (typically called from verification link)
   */
  async verifyEmailWithToken(token: string, email: string): Promise<EmailVerificationResult> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      })

      if (error) {
        console.error('Email verification error:', error)
        
        // Provide specific error messages
        if (error.message.includes('expired')) {
          return { success: false, error: 'Verification link has expired. Please request a new one.' }
        }
        
        if (error.message.includes('invalid')) {
          return { success: false, error: 'Invalid verification link. Please request a new one.' }
        }

        return { success: false, error: error.message }
      }

      if (data.user) {
        await this.logSuccessfulVerification(data.user.id, email)
        return { success: true }
      }

      return { success: false, error: 'Verification failed. Please try again.' }
    } catch (error) {
      console.error('Unexpected email verification error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email verification failed' 
      }
    }
  }

  /**
   * Get email verification status for current user
   */
  async getVerificationStatus(): Promise<EmailVerificationStatus | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      const isVerified = !!user.email_confirmed_at
      const lastVerificationAttempt = await this.getLastVerificationAttempt(user.id)
      
      let canResend = true
      let nextResendTime: Date | undefined

      if (lastVerificationAttempt) {
        const timeSinceLastSend = Date.now() - lastVerificationAttempt.getTime()
        canResend = timeSinceLastSend >= this.RESEND_COOLDOWN
        
        if (!canResend) {
          nextResendTime = new Date(lastVerificationAttempt.getTime() + this.RESEND_COOLDOWN)
        }
      }

      return {
        isVerified,
        email: user.email || '',
        verificationSent: lastVerificationAttempt,
        canResend,
        nextResendTime,
      }
    } catch (error) {
      console.error('Error getting verification status:', error)
      return null
    }
  }

  /**
   * Send verification email for email change
   */
  async sendEmailChangeVerification(newEmail: string): Promise<EmailVerificationResult> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { 
          success: false, 
          error: 'User must be authenticated to change email' 
        }
      }

      // Check if email is already in use
      const emailExists = await this.checkEmailExists(newEmail)
      if (emailExists) {
        return { success: false, error: 'Email address is already in use' }
      }

      // Check rate limiting
      const canSend = await this.canSendVerificationEmail(user.id)
      if (!canSend.allowed) {
        return { 
          success: false, 
          error: `Please wait ${Math.ceil(canSend.waitTime / 1000)} seconds before requesting another verification email` 
        }
      }

      const { error } = await this.supabase.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: `${this.getBaseUrl()}/auth/verify-email-change`,
        }
      )

      if (error) {
        console.error('Email change verification error:', error)
        return { success: false, error: error.message }
      }

      await this.logVerificationAttempt(user.id, newEmail)
      return { success: true, requiresVerification: true }
    } catch (error) {
      console.error('Unexpected email change verification error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email change verification' 
      }
    }
  }

  /**
   * Confirm email change with verification token
   */
  async confirmEmailChange(token: string): Promise<EmailVerificationResult> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email_change',
      })

      if (error) {
        console.error('Email change confirmation error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        await this.logSuccessfulVerification(data.user.id, data.user.email || '')
        return { success: true }
      }

      return { success: false, error: 'Email change confirmation failed' }
    } catch (error) {
      console.error('Unexpected email change confirmation error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email change confirmation failed' 
      }
    }
  }

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Server-side check for specific user
        const { data, error } = await this.supabase
          .from('auth.users')
          .select('email_confirmed_at')
          .eq('id', userId)
          .single()

        return !error && !!data?.email_confirmed_at
      } else {
        // Client-side check for current user
        const { data: { user }, error } = await this.supabase.auth.getUser()
        return !error && !!user?.email_confirmed_at
      }
    } catch (error) {
      console.error('Error checking email verification status:', error)
      return false
    }
  }

  private async canSendVerificationEmail(userId: string): Promise<{ allowed: boolean; waitTime: number }> {
    const lastAttempt = await this.getLastVerificationAttempt(userId)
    
    if (!lastAttempt) {
      return { allowed: true, waitTime: 0 }
    }

    const timeSinceLastSend = Date.now() - lastAttempt.getTime()
    const allowed = timeSinceLastSend >= this.RESEND_COOLDOWN
    const waitTime = allowed ? 0 : this.RESEND_COOLDOWN - timeSinceLastSend

    return { allowed, waitTime }
  }

  private async getLastVerificationAttempt(userId: string): Promise<Date | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_verification_attempts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return new Date(data.created_at)
    } catch (error) {
      return null
    }
  }

  private async logVerificationAttempt(userId: string, email: string): Promise<void> {
    try {
      await this.supabase
        .from('email_verification_attempts')
        .insert({
          user_id: userId,
          email,
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error logging verification attempt:', error)
    }
  }

  private async logSuccessfulVerification(userId: string, email: string): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          event_type: 'EMAIL_VERIFIED',
          user_id: userId,
          metadata: { email },
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error logging successful verification:', error)
    }
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      // This would typically use a server-side function to check
      // since we can't directly query auth.users from client
      const { data, error } = await this.supabase.rpc('check_email_exists', {
        email_to_check: email
      })

      return !error && data === true
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  /**
   * Clean up expired verification attempts (should be called periodically)
   */
  async cleanupExpiredAttempts(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      await this.supabase
        .from('email_verification_attempts')
        .delete()
        .lt('created_at', oneHourAgo)
    } catch (error) {
      console.error('Error cleaning up expired verification attempts:', error)
    }
  }
}

// Utility function to extract token from URL
export function extractVerificationTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const token = urlObj.searchParams.get('token') || 
                  urlObj.searchParams.get('token_hash') ||
                  urlObj.hash.split('#token=')[1]?.split('&')[0]
    
    return token || null
  } catch (error) {
    console.error('Error extracting token from URL:', error)
    return null
  }
}

// Utility function to extract email from URL
export function extractEmailFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const email = urlObj.searchParams.get('email')
    
    return email || null
  } catch (error) {
    console.error('Error extracting email from URL:', error)
    return null
  }
}