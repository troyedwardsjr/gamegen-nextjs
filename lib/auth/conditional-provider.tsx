'use client'

/**
 * Conditional Authentication Provider
 * 
 * Automatically switches between development mode (mock auth) and 
 * production mode (real auth) based on environment configuration
 */

import React from 'react'
import { AuthProvider } from './context'
import { DevAuthProvider } from './dev-provider'
import { isDevModeEnabled, logDevModeActivation } from '../dev-mode'

interface ConditionalAuthProviderProps {
  children: React.ReactNode
}

export function ConditionalAuthProvider({ children }: ConditionalAuthProviderProps) {
  const devMode = isDevModeEnabled();

  if (devMode) {
    logDevModeActivation("ConditionalAuthProvider - Using DevAuthProvider");
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }

  // Production mode - use normal Supabase authentication
  return <AuthProvider>{children}</AuthProvider>;
}