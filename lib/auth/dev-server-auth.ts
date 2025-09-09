/**
 * Development Mode Server-Side Authentication Utilities
 * 
 * This module provides utilities for handling authentication in server-side 
 * API routes when dev mode is enabled, allowing API routes to work with 
 * mock authentication data.
 * 
 * WARNING: This should ONLY be used in development environments
 */

import type { User } from "@supabase/supabase-js";
import { isDevModeEnabled, createMockDevUser, logDevModeActivation } from "../dev-mode";

/**
 * Mock user data specifically for server-side dev authentication
 * This ensures consistent user data across client and server in dev mode
 */
export function getMockDevUser(): User {
  return createMockDevUser();
}

/**
 * Check if the request should use dev mode authentication
 * This examines request headers, cookies, or other indicators to determine
 * if the request is coming from a dev mode client
 */
export function shouldUseDevAuth(request?: Request): boolean {
  if (!isDevModeEnabled()) {
    return false;
  }

  // In dev mode, we'll allow all requests to use dev auth
  // You could add more sophisticated checks here if needed
  // such as checking for specific headers or cookies
  
  return true;
}

/**
 * Get authenticated user for API routes, with dev mode support
 * This function should be used in API routes instead of direct supabase.auth.getUser()
 */
export async function getAuthenticatedUser(
  supabase: any,
  request?: Request
): Promise<{ user: User | null; error: any }> {
  // Check if we should use dev mode authentication
  if (shouldUseDevAuth(request)) {
    logDevModeActivation("Server-side API authentication bypass");
    
    const mockUser = getMockDevUser();
    return {
      user: mockUser,
      error: null
    };
  }

  // Normal Supabase authentication flow
  return await supabase.auth.getUser();
}

/**
 * Create a development-aware response for authentication errors
 * In dev mode, provide helpful debugging information
 */
export function createAuthErrorResponse(error: any, devMode: boolean = false) {
  if (devMode && isDevModeEnabled()) {
    return {
      error: 'Authentication failed in dev mode - this should not happen',
      devModeInfo: {
        message: 'Dev mode is enabled but auth failed',
        mockUserId: '00000000-0000-4000-8000-000000000001',
        hint: 'Check dev mode configuration'
      },
      originalError: error
    };
  }

  return {
    error: 'Unauthorized'
  };
}

/**
 * Validate that the authenticated user matches expected dev mode user
 * This helps ensure consistency in dev mode operations
 */
export function isDevModeUser(user: User | null): boolean {
  if (!user) return false;
  
  const mockUser = getMockDevUser();
  return user.id === mockUser.id;
}

/**
 * Get the user ID for database operations, with dev mode awareness
 * This ensures we always get the correct user ID for RLS policies
 */
export function getUserIdForDatabase(user: User | null): string | null {
  if (!user) return null;
  
  // In dev mode, always return the consistent dev user ID
  if (isDevModeEnabled() && isDevModeUser(user)) {
    return getMockDevUser().id;
  }
  
  return user.id;
}