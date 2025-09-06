/**
 * Authentication Guards for GameGen platform
 * Server-side route protection utilities for Next.js middleware and API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSession, getUser, getProfile } from './auth-utils';
import type { Database } from '../supabase/database.types';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export interface RouteGuardOptions {
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requiredPermissions?: string[];
  requiredTier?: 'free' | 'pro' | 'max' | 'educational';
  requiredRole?: string[];
  redirectTo?: string;
  allowedPaths?: string[];
  publicPaths?: string[];
}

export interface AuthGuardResult {
  allowed: boolean;
  user?: any;
  profile?: UserProfile | null;
  redirectTo?: string;
  reason?: string;
}

/**
 * Server-side authentication guard for middleware
 * Use this in Next.js middleware to protect routes
 */
export async function authGuard(
  request: NextRequest,
  options: RouteGuardOptions = {}
): Promise<AuthGuardResult> {
  const {
    requireAuth = true,
    requireEmailVerified = false,
    requiredPermissions = [],
    requiredTier,
    requiredRole = [],
    redirectTo = '/auth/login',
    allowedPaths = [],
    publicPaths = ['/auth', '/', '/pricing', '/about'],
  } = options;

  const pathname = request.nextUrl.pathname;

  // Check if this is a public path
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return { allowed: true };
  }

  // Check if this is an allowed path (bypasses all checks)
  if (allowedPaths.some(path => pathname.startsWith(path))) {
    return { allowed: true };
  }

  try {
    const session = await getSession();
    const user = session?.user;

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      return {
        allowed: false,
        redirectTo,
        reason: 'Authentication required',
      };
    }

    // If user is not required, allow access
    if (!requireAuth) {
      return { allowed: true, user };
    }

    // Check email verification
    if (requireEmailVerified && user && !user.email_confirmed_at) {
      return {
        allowed: false,
        redirectTo: '/auth/verify-email',
        reason: 'Email verification required',
      };
    }

    // Get user profile for additional checks
    let profile: UserProfile | null = null;
    if (user && (requiredTier || requiredRole.length > 0 || requiredPermissions.length > 0)) {
      profile = await getProfile(user.id);
    }

    // Check subscription tier
    if (requiredTier && profile) {
      const tierHierarchy = { free: 0, educational: 1, pro: 2, max: 3 };
      const currentTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || 0;
      const requiredTierLevel = tierHierarchy[requiredTier];

      if (currentTierLevel < requiredTierLevel) {
        return {
          allowed: false,
          redirectTo: '/pricing',
          reason: `${requiredTier} tier required`,
        };
      }
    }

    // Check roles (if implemented in your profile structure)
    if (requiredRole.length > 0 && profile) {
      // Assuming roles are stored in user metadata or profile
      const userRoles = (user.user_metadata?.roles as string[]) || [];
      const hasRequiredRole = requiredRole.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return {
          allowed: false,
          redirectTo: '/unauthorized',
          reason: 'Insufficient permissions',
        };
      }
    }

    // Check permissions (if implemented in your profile structure)
    if (requiredPermissions.length > 0 && profile) {
      // Assuming permissions are stored in user metadata
      const userPermissions = (user.user_metadata?.permissions as string[]) || [];
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return {
          allowed: false,
          redirectTo: '/unauthorized',
          reason: 'Missing required permissions',
        };
      }
    }

    return {
      allowed: true,
      user,
      profile,
    };

  } catch (error) {
    console.error('Auth guard error:', error);
    
    return {
      allowed: false,
      redirectTo,
      reason: 'Authentication check failed',
    };
  }
}

/**
 * API route authentication guard
 * Use this in API routes to protect endpoints
 */
export async function apiAuthGuard(
  request: NextRequest,
  options: Omit<RouteGuardOptions, 'redirectTo'> = {}
): Promise<{
  success: boolean;
  user?: any;
  profile?: UserProfile | null;
  error?: string;
  status?: number;
}> {
  const {
    requireAuth = true,
    requireEmailVerified = false,
    requiredPermissions = [],
    requiredTier,
    requiredRole = [],
  } = options;

  try {
    const session = await getSession();
    const user = session?.user;

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401,
      };
    }

    // If user is not required, allow access
    if (!requireAuth) {
      return { success: true, user };
    }

    // Check email verification
    if (requireEmailVerified && user && !user.email_confirmed_at) {
      return {
        success: false,
        error: 'Email verification required',
        status: 403,
      };
    }

    // Get user profile for additional checks
    let profile: UserProfile | null = null;
    if (user && (requiredTier || requiredRole.length > 0 || requiredPermissions.length > 0)) {
      profile = await getProfile(user.id);
    }

    // Check subscription tier
    if (requiredTier && profile) {
      const tierHierarchy = { free: 0, educational: 1, pro: 2, max: 3 };
      const currentTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || 0;
      const requiredTierLevel = tierHierarchy[requiredTier];

      if (currentTierLevel < requiredTierLevel) {
        return {
          success: false,
          error: `${requiredTier} tier required`,
          status: 403,
        };
      }
    }

    // Check roles
    if (requiredRole.length > 0 && profile) {
      const userRoles = (user.user_metadata?.roles as string[]) || [];
      const hasRequiredRole = requiredRole.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return {
          success: false,
          error: 'Insufficient permissions',
          status: 403,
        };
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0 && profile) {
      const userPermissions = (user.user_metadata?.permissions as string[]) || [];
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return {
          success: false,
          error: 'Missing required permissions',
          status: 403,
        };
      }
    }

    return {
      success: true,
      user,
      profile,
    };

  } catch (error) {
    console.error('API auth guard error:', error);
    
    return {
      success: false,
      error: 'Authentication check failed',
      status: 500,
    };
  }
}

/**
 * Middleware helper to create authenticated responses
 */
export function createAuthMiddleware(options: RouteGuardOptions = {}) {
  return async (request: NextRequest) => {
    const result = await authGuard(request, options);

    if (!result.allowed) {
      const url = new URL(result.redirectTo || '/auth/login', request.url);
      
      // Add return URL for post-auth redirect
      if (result.redirectTo === '/auth/login' || !result.redirectTo) {
        url.searchParams.set('returnTo', request.nextUrl.pathname);
      }

      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}

/**
 * Helper function to check if user has specific permissions
 */
export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false;
  
  const permissions = (user.user_metadata?.permissions as string[]) || [];
  return permissions.includes(permission);
}

/**
 * Helper function to check if user has specific role
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  
  const roles = (user.user_metadata?.roles as string[]) || [];
  return roles.includes(role);
}

/**
 * Helper function to check subscription tier
 */
export function hasMinimumTier(
  profile: UserProfile | null, 
  requiredTier: 'free' | 'pro' | 'max' | 'educational'
): boolean {
  if (!profile) return requiredTier === 'free';
  
  const tierHierarchy = { free: 0, educational: 1, pro: 2, max: 3 };
  const currentTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || 0;
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  return currentTierLevel >= requiredTierLevel;
}

/**
 * Pre-configured middleware for common use cases
 */
export const middleware = {
  // Protect dashboard and user areas
  protected: createAuthMiddleware({
    requireAuth: true,
    publicPaths: ['/auth', '/', '/pricing', '/about', '/api/public'],
  }),

  // Protect admin areas
  admin: createAuthMiddleware({
    requireAuth: true,
    requiredRole: ['admin'],
    publicPaths: ['/auth', '/', '/pricing', '/about'],
    redirectTo: '/unauthorized',
  }),

  // Protect pro features
  pro: createAuthMiddleware({
    requireAuth: true,
    requiredTier: 'pro',
    publicPaths: ['/auth', '/', '/pricing', '/about'],
    redirectTo: '/pricing',
  }),

  // Redirect authenticated users away from auth pages
  authPages: async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    // Only apply to auth pages
    if (!pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // Allow certain auth pages even when authenticated
    const allowedAuthPages = ['/auth/logout', '/auth/verify-email', '/auth/reset-password'];
    if (allowedAuthPages.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    try {
      const user = await getUser();
      if (user) {
        const returnTo = request.nextUrl.searchParams.get('returnTo');
        const redirectUrl = new URL(returnTo || '/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Auth redirect check failed:', error);
    }

    return NextResponse.next();
  },
};