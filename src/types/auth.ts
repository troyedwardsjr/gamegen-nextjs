/**
 * GameGen Authentication Types
 * 
 * TypeScript type definitions for authentication, authorization,
 * and user session management in the GameGen platform.
 */

import { Database } from './database';

// Base authentication status
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

// Authentication providers supported by GameGen
export type AuthProvider = 'google' | 'github' | 'discord' | 'email';

// User profile from database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Supabase Auth User object with metadata
 */
export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };
  user_metadata: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    username?: string;
    [key: string]: any;
  };
  aud: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  created_at: string;
  email_confirmed_at?: string;
  identities?: any[];
  last_sign_in_at?: string;
  phone_confirmed_at?: string;
  recovery_sent_at?: string;
  role?: string;
  updated_at?: string;
}

/**
 * Complete user session with profile data
 */
export interface UserSession {
  user: AuthUser;
  profile?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  expiresIn?: number;
}

/**
 * Authentication context state
 */
export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication actions for context/store
 */
export interface AuthActions {
  signIn: (provider: AuthProvider, credentials?: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

/**
 * Sign in credentials for email/password
 */
export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Sign up credentials with GameGen-specific fields
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  use_case?: UserProfile['use_case'];
  terms_accepted: boolean;
  marketing_consent?: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  redirect_url?: string;
}

/**
 * Password update request
 */
export interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  timezone?: string;
  language_preference?: string;
  theme_preference?: string;
  notification_preferences?: any;
  use_case?: UserProfile['use_case'];
}

/**
 * Authentication error types specific to GameGen
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'email_already_registered'
  | 'weak_password'
  | 'rate_limited'
  | 'provider_error'
  | 'network_error'
  | 'session_expired'
  | 'account_suspended'
  | 'subscription_required'
  | 'terms_not_accepted'
  | 'unknown_error';

/**
 * Authentication error with additional context
 */
export interface AuthError extends Error {
  type: AuthErrorType;
  code?: string;
  status?: number;
  details?: Record<string, any>;
  retryable?: boolean;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  provider: AuthProvider;
  client_id: string;
  redirect_uri: string;
  scopes?: string[];
  additional_params?: Record<string, string>;
}

/**
 * Magic link authentication options
 */
export interface MagicLinkOptions {
  email: string;
  redirect_to?: string;
  should_create_user?: boolean;
  data?: Record<string, any>;
}

/**
 * Account verification status
 */
export interface VerificationStatus {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  account_locked: boolean;
  requires_verification: boolean;
  verification_methods: ('email' | 'phone' | 'identity')[];
}

/**
 * User permissions for GameGen features
 */
export interface UserPermissions {
  // Game creation permissions
  can_create_games: boolean;
  can_publish_games: boolean;
  can_export_games: boolean;
  can_white_label: boolean;
  
  // Asset permissions
  can_upload_assets: boolean;
  can_download_assets: boolean;
  can_use_ai_generation: boolean;
  
  // Community permissions
  can_comment: boolean;
  can_rate_games: boolean;
  can_create_templates: boolean;
  can_fork_games: boolean;
  
  // Admin permissions
  can_moderate_content: boolean;
  can_manage_users: boolean;
  can_access_analytics: boolean;
  
  // Subscription limits
  monthly_game_limit: number;
  monthly_ai_credits: number;
  storage_limit_gb: number;
}

/**
 * User role definitions for GameGen
 */
export type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin';

/**
 * Role-based access control
 */
export interface RoleConfig {
  role: UserRole;
  permissions: UserPermissions;
  subscription_required: boolean;
  subscription_tiers: UserProfile['subscription_tier'][];
}

/**
 * Session management configuration
 */
export interface SessionConfig {
  access_token_lifetime: number; // seconds
  refresh_token_lifetime: number; // seconds
  remember_session_lifetime: number; // seconds
  auto_refresh_threshold: number; // seconds before expiry
  max_concurrent_sessions: number;
}

/**
 * Authentication event types for analytics
 */
export type AuthEventType =
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'sign_in_attempted'
  | 'sign_in_succeeded'
  | 'sign_in_failed'
  | 'sign_out'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'profile_updated'
  | 'account_deleted'
  | 'session_refreshed'
  | 'email_verified'
  | 'provider_linked'
  | 'provider_unlinked';

/**
 * Authentication analytics event
 */
export interface AuthEvent {
  type: AuthEventType;
  user_id?: string;
  provider?: AuthProvider;
  metadata?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Multi-factor authentication types
 */
export type MFAType = 'totp' | 'sms' | 'email';

/**
 * Multi-factor authentication factor
 */
export interface MFAFactor {
  id: string;
  type: MFAType;
  status: 'unverified' | 'verified';
  friendly_name?: string;
  phone?: string; // for SMS
  created_at: string;
  updated_at: string;
}

/**
 * MFA challenge response
 */
export interface MFAChallenge {
  factor_id: string;
  challenge_id: string;
  type: MFAType;
  expires_at: string;
}

/**
 * MFA verification request
 */
export interface MFAVerificationRequest {
  factor_id: string;
  challenge_id: string;
  code: string;
}

/**
 * Account deletion request with confirmation
 */
export interface AccountDeletionRequest {
  password?: string;
  reason?: string;
  feedback?: string;
  transfer_data_to?: string; // email for data export
  confirm_deletion: boolean;
}

/**
 * Auth hook return type for React components
 */
export interface UseAuthReturn extends AuthState, AuthActions {
  // Additional computed properties
  isSignedIn: boolean;
  isSignedOut: boolean;
  hasProfile: boolean;
  permissions: UserPermissions;
  canAccess: (feature: keyof UserPermissions) => boolean;
  isSubscribed: boolean;
  subscriptionTier: UserProfile['subscription_tier'];
}

/**
 * Auth provider component props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: UserSession | null;
  sessionConfig?: Partial<SessionConfig>;
  onAuthStateChange?: (state: AuthState) => void;
  onError?: (error: AuthError) => void;
}

/**
 * Protected route component props
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredSubscription?: boolean;
  minimumTier?: UserProfile['subscription_tier'];
  redirectTo?: string;
}

/**
 * Social auth button props
 */
export interface SocialAuthButtonProps {
  provider: AuthProvider;
  text?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: AuthError) => void;
}

// Type guards for authentication
export const isAuthUser = (user: any): user is AuthUser => {
  return user && typeof user === 'object' && 'id' in user && 'email' in user;
};

export const isAuthError = (error: any): error is AuthError => {
  return error && typeof error === 'object' && 'type' in error && error.type;
};

export const hasPermission = (
  permissions: UserPermissions | undefined,
  permission: keyof UserPermissions
): boolean => {
  return Boolean(permissions?.[permission]);
};

export const isSubscribed = (profile: UserProfile | null): boolean => {
  return Boolean(profile?.subscription_tier && profile.subscription_tier !== 'free');
};

export const canAccessFeature = (
  profile: UserProfile | null,
  requiredTier: UserProfile['subscription_tier']
): boolean => {
  if (!profile?.subscription_tier || !requiredTier) return false;
  
  const tierOrder = ['free', 'pro', 'max', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(profile.subscription_tier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
};