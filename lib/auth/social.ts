/**
 * Social authentication providers for GameGen platform
 * Supports Google, Discord, GitHub, and Apple OAuth integration
 */

import { createAuthClient } from './client'
import type { Provider } from '@supabase/supabase-js'

export interface SocialProvider {
  name: string
  provider: Provider
  displayName: string
  icon: string
  color: string
  scopes?: string[]
  autoLinkByEmail: boolean
  requireVerifiedEmail: boolean
}

export interface SocialAuthOptions {
  redirectTo?: string
  scopes?: string[]
  queryParams?: Record<string, string>
}

export interface SocialAuthResult {
  success: boolean
  provider: string
  error?: string
  requiresEmailVerification?: boolean
}

export const SOCIAL_PROVIDERS: Record<string, SocialProvider> = {
  google: {
    name: 'google',
    provider: 'google',
    displayName: 'Google',
    icon: '🔍', // You can replace with actual icon components
    color: '#4285F4',
    scopes: ['openid', 'email', 'profile'],
    autoLinkByEmail: true,
    requireVerifiedEmail: true,
  },
  discord: {
    name: 'discord',
    provider: 'discord',
    displayName: 'Discord',
    icon: '🎮',
    color: '#5865F2',
    scopes: ['identify', 'email'],
    autoLinkByEmail: false,
    requireVerifiedEmail: true,
  },
  github: {
    name: 'github',
    provider: 'github',
    displayName: 'GitHub',
    icon: '⚡',
    color: '#171515',
    scopes: ['user:email'],
    autoLinkByEmail: true,
    requireVerifiedEmail: true,
  },
  apple: {
    name: 'apple',
    provider: 'apple',
    displayName: 'Apple',
    icon: '🍎',
    color: '#000000',
    scopes: ['name', 'email'],
    autoLinkByEmail: true,
    requireVerifiedEmail: true,
  },
}

export class SocialAuthManager {
  private supabase = createAuthClient()

  /**
   * Get all available social providers
   */
  getAvailableProviders(): SocialProvider[] {
    return Object.values(SOCIAL_PROVIDERS)
  }

  /**
   * Get a specific social provider configuration
   */
  getProvider(providerName: string): SocialProvider | null {
    return SOCIAL_PROVIDERS[providerName] || null
  }

  /**
   * Sign in with a social provider
   */
  async signInWithProvider(
    providerName: string,
    options: SocialAuthOptions = {}
  ): Promise<SocialAuthResult> {
    try {
      const providerConfig = this.getProvider(providerName)
      if (!providerConfig) {
        return {
          success: false,
          provider: providerName,
          error: 'Unsupported provider',
        }
      }

      const redirectTo = options.redirectTo || this.getDefaultRedirectUrl()
      const scopes = options.scopes || providerConfig.scopes

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: providerConfig.provider,
        options: {
          redirectTo,
          scopes: scopes?.join(' '),
          queryParams: options.queryParams,
        },
      })

      if (error) {
        console.error(`${providerName} auth error:`, error)
        return {
          success: false,
          provider: providerName,
          error: error.message,
        }
      }

      // OAuth flow initiated successfully
      return {
        success: true,
        provider: providerName,
      }
    } catch (error) {
      console.error(`Unexpected ${providerName} auth error:`, error)
      return {
        success: false,
        provider: providerName,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }
    }
  }

  /**
   * Handle OAuth callback and complete authentication
   */
  async handleOAuthCallback(): Promise<SocialAuthResult> {
    try {
      const { data, error } = await this.supabase.auth.getSession()

      if (error) {
        console.error('OAuth callback error:', error)
        return {
          success: false,
          provider: 'unknown',
          error: error.message,
        }
      }

      if (data.session?.user) {
        const provider = this.extractProviderFromUser(data.session.user)
        
        // Check if email verification is required
        if (!data.session.user.email_confirmed_at) {
          return {
            success: false,
            provider,
            error: 'Email verification required',
            requiresEmailVerification: true,
          }
        }

        // Log successful OAuth login
        await this.logSocialAuth(data.session.user.id, provider, 'SUCCESS')

        return {
          success: true,
          provider,
        }
      }

      return {
        success: false,
        provider: 'unknown',
        error: 'No session created',
      }
    } catch (error) {
      console.error('OAuth callback handling error:', error)
      return {
        success: false,
        provider: 'unknown',
        error: error instanceof Error ? error.message : 'Callback handling failed',
      }
    }
  }

  /**
   * Link a social provider to an existing account
   */
  async linkProvider(
    providerName: string,
    options: SocialAuthOptions = {}
  ): Promise<SocialAuthResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return {
          success: false,
          provider: providerName,
          error: 'User must be authenticated to link provider',
        }
      }

      const providerConfig = this.getProvider(providerName)
      if (!providerConfig) {
        return {
          success: false,
          provider: providerName,
          error: 'Unsupported provider',
        }
      }

      const redirectTo = options.redirectTo || this.getDefaultRedirectUrl()
      const scopes = options.scopes || providerConfig.scopes

      const { data, error } = await this.supabase.auth.linkIdentity({
        provider: providerConfig.provider,
        options: {
          redirectTo,
          scopes: scopes?.join(' '),
          queryParams: options.queryParams,
        },
      })

      if (error) {
        console.error(`${providerName} linking error:`, error)
        return {
          success: false,
          provider: providerName,
          error: error.message,
        }
      }

      return {
        success: true,
        provider: providerName,
      }
    } catch (error) {
      console.error(`Unexpected ${providerName} linking error:`, error)
      return {
        success: false,
        provider: providerName,
        error: error instanceof Error ? error.message : 'Linking failed',
      }
    }
  }

  /**
   * Unlink a social provider from the current account
   */
  async unlinkProvider(providerName: string): Promise<boolean> {
    try {
      const providerConfig = this.getProvider(providerName)
      if (!providerConfig) {
        return false
      }

      const { error } = await this.supabase.auth.unlinkIdentity({
        provider: providerConfig.provider,
      })

      if (error) {
        console.error(`${providerName} unlinking error:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Unexpected ${providerName} unlinking error:`, error)
      return false
    }
  }

  /**
   * Get linked providers for the current user
   */
  async getLinkedProviders(): Promise<string[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user?.identities) {
        return []
      }

      return user.identities.map(identity => identity.provider).filter(Boolean)
    } catch (error) {
      console.error('Error fetching linked providers:', error)
      return []
    }
  }

  /**
   * Check if a specific provider is linked
   */
  async isProviderLinked(providerName: string): Promise<boolean> {
    const linkedProviders = await this.getLinkedProviders()
    return linkedProviders.includes(providerName)
  }

  private getDefaultRedirectUrl(): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    return `${baseUrl}/auth/callback`
  }

  private extractProviderFromUser(user: any): string {
    // Extract provider from user metadata or identities
    const providers = user.identities?.map((identity: any) => identity.provider) || []
    return providers[0] || 'unknown'
  }

  private async logSocialAuth(
    userId: string,
    provider: string,
    status: 'SUCCESS' | 'FAILED'
  ): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          event_type: `SOCIAL_AUTH_${status}`,
          user_id: userId,
          metadata: { provider },
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error logging social auth event:', error)
    }
  }

  /**
   * Get provider-specific user information after authentication
   */
  async getProviderUserInfo(providerName: string): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session?.provider_token) {
        return null
      }

      // This would typically call the provider's API to get additional user info
      // Implementation depends on specific provider requirements
      switch (providerName) {
        case 'github':
          return this.fetchGitHubUserInfo(session.provider_token)
        case 'discord':
          return this.fetchDiscordUserInfo(session.provider_token)
        default:
          return null
      }
    } catch (error) {
      console.error('Error fetching provider user info:', error)
      return null
    }
  }

  private async fetchGitHubUserInfo(token: string): Promise<any> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'GameGen-App',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub user info')
      }
      
      return response.json()
    } catch (error) {
      console.error('GitHub API error:', error)
      return null
    }
  }

  private async fetchDiscordUserInfo(token: string): Promise<any> {
    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch Discord user info')
      }
      
      return response.json()
    } catch (error) {
      console.error('Discord API error:', error)
      return null
    }
  }
}