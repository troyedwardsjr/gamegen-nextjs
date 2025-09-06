'use client'

/**
 * Development Mode Authentication Provider
 * 
 * This provider bypasses normal authentication in development mode,
 * providing mock user data for testing purposes.
 * 
 * WARNING: This should ONLY be used in development environments
 */

import React, { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { 
  createMockDevUser, 
  createMockDevSession, 
  createMockDevProfile,
  logDevModeActivation 
} from '../dev-mode'
import type { AuthContextType, AuthResult } from './context'
import { AuthContext } from './context'

// Mock auth functions that always succeed
const mockAuthFunction = async (): Promise<AuthResult> => {
  logDevModeActivation("Mock auth function called");
  return { success: true };
};

const mockVoidFunction = async (): Promise<void> => {
  logDevModeActivation("Mock void function called");
};

const mockPermissionFunction = (permission: string): boolean => {
  // In dev mode, grant all permissions
  return true;
};

const mockStringFunction = (): string => 'max';

const mockSubscriptionFunction = (): 'active' | 'canceled' | 'past_due' | 'none' => 'active';

const mockProviderFunction = async (provider: string, options?: any): Promise<AuthResult> => {
  logDevModeActivation(`Mock ${provider} provider auth called`);
  return { success: true };
};

const mockBooleanFunction = async (): Promise<boolean> => true;
const mockStringArrayFunction = async (): Promise<string[]> => ['dev-mode'];
const mockMFAFunction = async (): Promise<any> => ({ success: true });

// Development mode banner component
function DevModeBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const mockProfile = createMockDevProfile();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-bold">🚧 GAMEGEN DEV MODE</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-orange-600 rounded"
            title="Toggle details"
          >
            ⚙️
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm opacity-90">
            Logged in as: {mockProfile.display_name}
          </span>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-orange-600 rounded text-lg"
            title="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 py-3 bg-orange-600 border-t border-orange-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🧪 Mock User Details</h4>
              <ul className="space-y-1 opacity-90">
                <li>ID: {mockProfile.id}</li>
                <li>Email: {mockProfile.email}</li>
                <li>Username: {mockProfile.username}</li>
                <li>Tier: {mockProfile.subscription_tier}</li>
                <li>Games Created: {mockProfile.total_games_created}</li>
                <li>Reputation: {mockProfile.reputation_score}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚠️ Security Warnings</h4>
              <ul className="space-y-1 opacity-90">
                <li>• Authentication bypassed</li>
                <li>• All permissions granted</li>
                <li>• Mock data being used</li>
                <li>• Development environment only</li>
                <li>• Never enable in production</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  
  // Mock user and session data
  const user = createMockDevUser();
  const session = createMockDevSession();
  const profile = createMockDevProfile();

  useEffect(() => {
    logDevModeActivation("DevAuthProvider initialized");
    
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const value: AuthContextType = {
    // State
    user,
    session,
    loading,
    initialized: true,

    // Authentication methods (all mocked)
    signIn: mockAuthFunction,
    signUp: mockAuthFunction,
    signOut: mockVoidFunction,
    refreshSession: mockVoidFunction,

    // Social authentication (all mocked)
    signInWithProvider: mockProviderFunction,
    linkProvider: mockProviderFunction,
    unlinkProvider: mockBooleanFunction,
    getLinkedProviders: mockStringArrayFunction,

    // Multi-factor authentication (all mocked)
    enableMFA: mockMFAFunction,
    verifyMFA: mockMFAFunction,
    disableMFA: mockBooleanFunction,
    isMFARequired: mockBooleanFunction,

    // Password management (all mocked)
    resetPassword: mockAuthFunction,
    updatePassword: mockAuthFunction,

    // Profile management (all mocked)
    updateProfile: mockAuthFunction,
    resendEmailVerification: mockAuthFunction,

    // Utility methods (all return dev-friendly values)
    hasPermission: mockPermissionFunction,
    getUserTier: mockStringFunction,
    getSubscriptionStatus: mockSubscriptionFunction,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Dev Mode Banner */}
      <DevModeBanner />
      <div style={{ marginTop: '60px' }}>
        {children}
      </div>
    </AuthContext.Provider>
  );
}