"use client";

/**
 * Authentication Context Provider for GameGen platform
 * Provides centralized authentication state management with JWT tokens,
 * session handling, and automatic refresh functionality
 */

import type { User, Session } from "@supabase/supabase-js";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { SessionManager, SessionState } from "./session";
import { MFAManager } from "./mfa";
import { SocialAuthManager } from "./social";

export interface AuthContextType {
  // Authentication state
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  // Authentication methods
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // Social authentication
  signInWithProvider: (provider: string, options?: any) => Promise<AuthResult>;
  linkProvider: (provider: string, options?: any) => Promise<AuthResult>;
  unlinkProvider: (provider: string) => Promise<boolean>;
  getLinkedProviders: () => Promise<string[]>;

  // Multi-factor authentication
  enableMFA: (method: "totp" | "sms" | "email") => Promise<any>;
  verifyMFA: (code: string, method?: "totp" | "backup_code") => Promise<any>;
  disableMFA: () => Promise<boolean>;
  isMFARequired: () => Promise<boolean>;

  // Password management
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;

  // Profile management
  updateProfile: (updates: Record<string, any>) => Promise<AuthResult>;
  resendEmailVerification: () => Promise<AuthResult>;

  // Utility methods
  hasPermission: (permission: string) => boolean;
  getUserTier: () => string;
  getSubscriptionStatus: () => "active" | "canceled" | "past_due" | "none";
}

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  requiresMFA?: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<SessionState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });
  const [initialized, setInitialized] = useState(false);

  // Managers
  const [sessionManager] = useState(() => new SessionManager());
  const [mfaManager] = useState(() => new MFAManager());
  const [socialManager] = useState(() => new SocialAuthManager());

  // Initialize authentication state
  const initialize = useCallback(async () => {
    try {
      const sessionState = await sessionManager.initializeSession();

      setState(sessionState);
    } catch (error) {
      console.error("Auth initialization error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to initialize authentication",
      }));
    } finally {
      setInitialized(true);
    }
  }, [sessionManager]);

  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      sessionManager.destroy();
    };
  }, [initialize, sessionManager]);

  // Authentication methods
  const signIn = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false,
    ): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await sessionManager.signIn(email, password, rememberMe);

      setState(result);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Check if MFA is required
      if (result.user) {
        const mfaRequired = await mfaManager.isMFARequired(result.user.id);

        if (mfaRequired) {
          // Don't complete login until MFA is verified
          return { success: false, requiresMFA: true };
        }
      }

      return { success: true };
    },
    [sessionManager, mfaManager],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, any>,
    ): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await sessionManager.signUp(email, password, metadata);

      setState(result);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Check if email verification is required
      if (result.user && !result.session) {
        return { success: true, requiresEmailVerification: true };
      }

      return { success: true };
    },
    [sessionManager],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    await sessionManager.signOut();
    setState({ user: null, session: null, loading: false, error: null });
  }, [sessionManager]);

  const refreshSession = useCallback(async (): Promise<void> => {
    const result = await sessionManager.refreshSession();

    setState(result);
  }, [sessionManager]);

  // Social authentication methods
  const signInWithProvider = useCallback(
    async (provider: string, options?: any): Promise<AuthResult> => {
      const result = await socialManager.signInWithProvider(provider, options);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [socialManager],
  );

  const linkProvider = useCallback(
    async (provider: string, options?: any): Promise<AuthResult> => {
      const result = await socialManager.linkProvider(provider, options);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [socialManager],
  );

  const unlinkProvider = useCallback(
    async (provider: string): Promise<boolean> => {
      return await socialManager.unlinkProvider(provider);
    },
    [socialManager],
  );

  const getLinkedProviders = useCallback(async (): Promise<string[]> => {
    return await socialManager.getLinkedProviders();
  }, [socialManager]);

  // MFA methods
  const enableMFA = useCallback(
    async (method: "totp" | "sms" | "email") => {
      if (!state.user) {
        throw new Error("User must be authenticated to enable MFA");
      }

      return await mfaManager.enableMFA(state.user.id, method);
    },
    [mfaManager, state.user],
  );

  const verifyMFA = useCallback(
    async (code: string, method?: "totp" | "backup_code") => {
      if (!state.user) {
        throw new Error("User must be authenticated to verify MFA");
      }

      return await mfaManager.verifyMFA(state.user.id, code, method);
    },
    [mfaManager, state.user],
  );

  const disableMFA = useCallback(async (): Promise<boolean> => {
    if (!state.user) {
      throw new Error("User must be authenticated to disable MFA");
    }

    return await mfaManager.disableMFA(state.user.id);
  }, [mfaManager, state.user]);

  const isMFARequired = useCallback(async (): Promise<boolean> => {
    if (!state.user) return false;

    return await mfaManager.isMFARequired(state.user.id);
  }, [mfaManager, state.user]);

  // Password management
  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        const { error } =
          await sessionManager.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Password reset failed",
        };
      }
    },
    [sessionManager],
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      try {
        const { error } = await sessionManager.supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Password update failed",
        };
      }
    },
    [sessionManager],
  );

  // Profile management
  const updateProfile = useCallback(
    async (updates: Record<string, any>): Promise<AuthResult> => {
      try {
        const { error } = await sessionManager.supabase.auth.updateUser({
          data: updates,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Refresh session to get updated data
        await refreshSession();

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Profile update failed",
        };
      }
    },
    [sessionManager, refreshSession],
  );

  const resendEmailVerification = useCallback(async (): Promise<AuthResult> => {
    try {
      if (!state.user?.email) {
        return { success: false, error: "No email address found" };
      }

      const { error } = await sessionManager.supabase.auth.resend({
        type: "signup",
        email: state.user.email,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend verification",
      };
    }
  }, [sessionManager, state.user]);

  // Utility methods
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!state.session || !("permissions" in state.session)) {
        return false;
      }

      const sessionPermissions =
        ((state.session as any).permissions as string[]) || [];

      return sessionPermissions.includes(permission);
    },
    [state.session],
  );

  const getUserTier = useCallback((): string => {
    if (!state.session || !("tier" in state.session)) {
      return "free";
    }

    return ((state.session as any).tier as string) || "free";
  }, [state.session]);

  const getSubscriptionStatus = useCallback(():
    | "active"
    | "canceled"
    | "past_due"
    | "none" => {
    // This would typically come from Stripe subscription data
    // For now, we'll derive it from the user tier
    const tier = getUserTier();

    return tier === "free" ? "none" : "active";
  }, [getUserTier]);

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    session: state.session,
    loading: state.loading,
    initialized,

    // Authentication methods
    signIn,
    signUp,
    signOut,
    refreshSession,

    // Social authentication
    signInWithProvider,
    linkProvider,
    unlinkProvider,
    getLinkedProviders,

    // Multi-factor authentication
    enableMFA,
    verifyMFA,
    disableMFA,
    isMFARequired,

    // Password management
    resetPassword,
    updatePassword,

    // Profile management
    updateProfile,
    resendEmailVerification,

    // Utility methods
    hasPermission,
    getUserTier,
    getSubscriptionStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectTo?: string; requirePermission?: string } = {},
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, initialized, hasPermission } = useAuth();

    useEffect(() => {
      if (!loading && initialized) {
        if (!user) {
          const redirectTo = options.redirectTo || "/auth";

          window.location.href = redirectTo;

          return;
        }

        if (
          options.requirePermission &&
          !hasPermission(options.requirePermission)
        ) {
          window.location.href = "/unauthorized";

          return;
        }
      }
    }, [user, loading, initialized, hasPermission]);

    if (loading || !initialized) {
      return <div>Loading...</div>; // You can customize this loading state
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    if (
      options.requirePermission &&
      !hasPermission(options.requirePermission)
    ) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
}
