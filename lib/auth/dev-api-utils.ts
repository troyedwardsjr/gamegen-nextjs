/**
 * Development Mode API Utilities
 * 
 * Provides utilities for API routes to handle dev mode authentication bypass
 */

import { NextRequest } from 'next/server';
import { isDevModeEnabled, createMockDevUser, logDevModeBypass } from '../dev-mode';
import type { User } from '@supabase/supabase-js';

/**
 * Checks if the request should bypass authentication in dev mode
 */
export function shouldBypassAuth(request: NextRequest): boolean {
  if (!isDevModeEnabled()) {
    return false;
  }

  const pathname = request.nextUrl.pathname;
  logDevModeBypass(`API: ${pathname}`);
  return true;
}

/**
 * Gets the current user for API routes, handling dev mode
 * Returns mock user in dev mode, otherwise should get real user from session
 */
export function getApiUser(request: NextRequest, realUser?: User | null): User | null {
  if (shouldBypassAuth(request)) {
    return createMockDevUser();
  }
  
  return realUser || null;
}

/**
 * Middleware helper for API routes that need authentication
 * Returns mock user in dev mode, otherwise validates real authentication
 */
export async function requireAuth(
  request: NextRequest,
  authCheckFn?: () => Promise<User | null>
): Promise<{ user: User | null; isDevMode: boolean }> {
  const isDevMode = isDevModeEnabled();
  
  if (isDevMode) {
    const pathname = request.nextUrl.pathname;
    logDevModeBypass(`API Auth: ${pathname}`);
    return {
      user: createMockDevUser(),
      isDevMode: true
    };
  }

  // In production mode, use the provided auth check function
  const user = authCheckFn ? await authCheckFn() : null;
  
  return {
    user,
    isDevMode: false
  };
}

/**
 * Creates a standard API error response
 */
export function createApiErrorResponse(
  message: string, 
  status: number = 401,
  details?: any
) {
  return Response.json(
    {
      success: false,
      error: {
        message,
        status,
        details,
        timestamp: new Date().toISOString()
      }
    },
    { status }
  );
}

/**
 * Creates a standard API success response
 */
export function createApiSuccessResponse(data: any, metadata?: any) {
  return Response.json({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}