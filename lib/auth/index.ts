/**
 * GameGen Authentication System
 * Comprehensive authentication and security solution
 *
 * This module provides all authentication utilities including:
 * - JWT token management with automatic refresh
 * - Multi-factor authentication (TOTP, SMS, Email)
 * - Social OAuth providers (Google, Discord, GitHub, Apple)
 * - Password strength validation and security
 * - Account lockout and security event logging
 * - Rate limiting and DDoS protection
 * - Email verification system
 * - Row-level security policies
 * - Protected routes and access control
 */

// Core authentication clients
export { createAuthClient } from "./client";
export { createAuthServerClient } from "./server";
export type { AuthClient } from "./client";
export type { AuthServerClient } from "./server";

// Authentication context and hooks (Note: import these directly for React components)
// export { AuthProvider, useAuth, withAuth } from './context'
// export type { AuthContextType, AuthResult } from './context'

// Session management
export { SessionManager } from "./session";
export type {
  SessionConfiguration,
  ExtendedSession,
  DeviceInfo,
  SessionState,
} from "./session";

// Multi-factor authentication
export { MFAManager } from "./mfa";
export type {
  MFAConfiguration,
  TOTPSetupData,
  MFAVerificationResult,
} from "./mfa";

// Social authentication
export { SocialAuthManager, SOCIAL_PROVIDERS } from "./social";
export type {
  SocialProvider,
  SocialAuthOptions,
  SocialAuthResult,
} from "./social";

// Password validation and security
export {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthProgress,
  generateSecurePassword,
} from "./password";

// Import password validation for internal use
import { validatePassword } from "./password";
export type {
  PasswordValidationResult,
  PasswordRequirements,
} from "./password";

// Account security and monitoring
export { AccountSecurityManager } from "./security";
export type {
  SecurityEventType,
  SecurityEvent,
  AccountLockout,
  SuspiciousActivityIndicator,
} from "./security";

// Rate limiting
export {
  RateLimiter,
  SlidingWindowRateLimiter,
  rateLimitMiddleware,
  createRateLimitMiddleware,
  checkMultipleRateLimits,
  getClientIP,
  RATE_LIMITS,
} from "./rate-limit";
export type { RateLimitConfig, RateLimitResult } from "./rate-limit";

// Email verification
export { EmailVerificationManager } from "./email-verification";
export type {
  EmailVerificationResult,
  EmailVerificationStatus,
} from "./email-verification";

// Security middleware
export { SecurityMiddleware, createSecurityMiddleware } from "./middleware";
export type { SecurityMiddlewareOptions, SecurityContext } from "./middleware";

// Protected routes (Note: import these directly for React components)
// export {
//   ProtectedRoute,
//   withProtection,
//   useRouteAccess,
//   AdminOnlyRoute,
//   ProTierRoute,
//   EducationalRoute
// } from './protected-route'
// export type { ProtectedRouteProps } from './protected-route'

// Constants and configurations
export const AUTH_CONSTANTS = {
  // Token expiration times (in seconds)
  ACCESS_TOKEN_EXPIRY: 900, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 2592000, // 30 days
  SESSION_TIMEOUT: 7200, // 2 hours

  // Rate limits
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900, // 15 minutes

  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_STRENGTH_THRESHOLD: 50,

  // MFA settings
  TOTP_WINDOW: 1, // 30 seconds tolerance
  BACKUP_CODES_COUNT: 10,

  // Session limits by tier
  MAX_SESSIONS: {
    free: 5,
    pro: 10,
    max: 20,
    educational: 15,
  },
} as const;

// Permission constants
export const PERMISSIONS = {
  // Game permissions
  GAME_CREATE: "game:create",
  GAME_EDIT_OWN: "game:edit:own",
  GAME_DELETE_OWN: "game:delete:own",
  GAME_EXPORT: "game:export",
  GAME_COLLABORATE: "game:collaborate",

  // Asset permissions
  ASSET_UPLOAD: "asset:upload",
  ASSET_SELL: "asset:sell",
  ASSET_DOWNLOAD: "asset:download",

  // AI permissions
  AI_GENERATE_BASIC: "ai:generate:basic",
  AI_GENERATE_ADVANCED: "ai:generate:advanced",
  AI_UNLIMITED: "ai:unlimited",

  // Community permissions
  COMMUNITY_POST: "community:post",
  COMMUNITY_COMMENT: "community:comment",
  COMMUNITY_MODERATE: "community:moderate",

  // Admin permissions
  USER_MANAGE: "user:manage",
  CONTENT_MODERATE: "content:moderate",
  ANALYTICS_VIEW: "analytics:view",
} as const;

// Subscription tier permissions mapping
export const TIER_PERMISSIONS = {
  free: [
    PERMISSIONS.GAME_CREATE,
    PERMISSIONS.GAME_EDIT_OWN,
    PERMISSIONS.GAME_DELETE_OWN,
    PERMISSIONS.AI_GENERATE_BASIC,
    PERMISSIONS.COMMUNITY_POST,
    PERMISSIONS.COMMUNITY_COMMENT,
  ] as string[],
  pro: [
    PERMISSIONS.GAME_EXPORT,
    PERMISSIONS.GAME_COLLABORATE,
    PERMISSIONS.ASSET_UPLOAD,
    PERMISSIONS.AI_GENERATE_ADVANCED,
  ] as string[],
  max: [
    PERMISSIONS.ASSET_SELL,
    PERMISSIONS.AI_UNLIMITED,
    PERMISSIONS.ANALYTICS_VIEW,
  ] as string[],
  educational: [
    PERMISSIONS.USER_MANAGE,
    "edu:bulk_create",
    "edu:progress_track",
  ] as string[],
};

// Utility functions
export const AuthUtils = {
  /**
   * Check if user has required permission
   */
  hasPermission: (
    userPermissions: string[],
    requiredPermission: string,
  ): boolean => {
    return userPermissions.includes(requiredPermission);
  },

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions: (
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean => {
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  },

  /**
   * Get permissions for a subscription tier
   */
  getPermissionsForTier: (tier: keyof typeof TIER_PERMISSIONS): string[] => {
    const tierPerms = TIER_PERMISSIONS[tier] || [];
    const inheritedPerms = tier !== "free" ? [...TIER_PERMISSIONS.free] : [];

    if (tier === "pro" || tier === "max" || tier === "educational") {
      inheritedPerms.push(...TIER_PERMISSIONS.pro);
    }

    if (tier === "max") {
      inheritedPerms.push(...TIER_PERMISSIONS.max);
    }

    return Array.from(new Set([...inheritedPerms, ...tierPerms]));
  },

  /**
   * Check if tier has sufficient access level
   */
  tierHasAccess: (userTier: string, requiredTier: string): boolean => {
    const tierHierarchy = { free: 0, pro: 1, educational: 2, max: 3 };

    return (
      (tierHierarchy[userTier as keyof typeof tierHierarchy] || 0) >=
      (tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0)
    );
  },

  /**
   * Generate secure session ID
   */
  generateSessionId: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Check if password meets minimum requirements
   */
  meetsPasswordRequirements: (password: string): boolean => {
    const validation = validatePassword(password);

    return validation.isValid;
  },

  /**
   * Format user display name
   */
  formatUserName: (
    firstName?: string,
    lastName?: string,
    email?: string,
  ): string => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (email) {
      return email.split("@")[0];
    }

    return "User";
  },

  /**
   * Check if account is educational
   */
  isEducationalAccount: (tier: string): boolean => {
    return tier === "educational";
  },

  /**
   * Check if feature is available for tier
   */
  isFeatureAvailable: (tier: string, feature: string): boolean => {
    const permissions = AuthUtils.getPermissionsForTier(
      tier as keyof typeof TIER_PERMISSIONS,
    );

    return permissions.includes(feature);
  },
};

// Authentication utilities from unrest_app migration
export {
  isValidEmail,
  isValidPassword,
  validatePassword as validatePasswordStrength,
  getPasswordStrength,
  manageFocus,
  createServerSupabaseClient,
  getSession,
  getUser,
  getProfile,
  getAuthErrorMessage,
} from "./auth-utils";
export type { UserProfile } from "./auth-utils";

// Authentication hooks from unrest_app migration
export {
  useAuthError,
  useRedirectIfAuthenticated,
  useRequireAuth,
  useProtectedRoute,
  useFormLoading,
  useAuthRedirect,
  useAuthState,
  usePermissions,
  useAuthFlow,
  useSession,
} from "./auth-hooks";

// Authentication guards from unrest_app migration
export {
  authGuard,
  apiAuthGuard,
  createAuthMiddleware as createAuthGuardMiddleware,
  hasPermission,
  hasRole,
  hasMinimumTier,
  middleware as authMiddleware,
} from "./auth-guards";
export type { RouteGuardOptions, AuthGuardResult } from "./auth-guards";

// Session management from unrest_app migration
export {
  ClientSessionManager,
  ServerSessionManager,
  sessionStorage,
} from "./session-management";
export type { SessionData, SessionOptions } from "./session-management";

// Export everything for convenience (React components commented out for TS compatibility)
export * from "./client";
export * from "./server";
// export * from './context'  // React component - import directly
export * from "./session";
export * from "./mfa";
export * from "./social";
export * from "./password";
export * from "./security";
export * from "./rate-limit";
export * from "./email-verification";
export * from "./middleware";
// export * from './protected-route'  // React component - import directly
export * from "./auth-utils";
// export * from './auth-hooks'  // React hooks - import directly
export * from "./auth-guards";
export * from "./session-management";

// Type definitions for external use
export type UserTier = "free" | "pro" | "max" | "educational";
export type AuthProvider = "google" | "discord" | "github" | "apple";
export type MFAMethod = "totp" | "sms" | "email";

// Import the classes
import { SessionManager } from "./session";
import { MFAManager } from "./mfa";
import { SocialAuthManager } from "./social";
import { AccountSecurityManager } from "./security";
import { EmailVerificationManager } from "./email-verification";
import { SecurityMiddleware } from "./middleware";

// Default export for easy importing
const GameGenAuth = {
  // Core components (commented out - import React components directly)
  // AuthProvider,
  // ProtectedRoute,

  // Managers
  SessionManager,
  MFAManager,
  SocialAuthManager,
  AccountSecurityManager,
  EmailVerificationManager,
  SecurityMiddleware,

  // Utilities
  AuthUtils,
  validatePassword,

  // Constants
  AUTH_CONSTANTS,
  PERMISSIONS,
  TIER_PERMISSIONS,
};

export default GameGenAuth;
