"use client";

/**
 * Authentication React Hooks for GameGen platform
 * Provides specialized hooks for auth state management and error handling
 */

import type { AuthError } from "@supabase/supabase-js";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./context";
import { getAuthErrorMessage } from "./auth-utils";

// Hook to handle auth errors with user-friendly messages
export function useAuthError() {
  const handleAuthError = useCallback((error: AuthError | any): string => {
    return getAuthErrorMessage(error);
  }, []);

  return { handleAuthError };
}

// Hook to redirect authenticated users away from auth pages
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, redirectTo, router]);

  return { user, loading, initialized };
}

// Hook to redirect unauthenticated users to login
export function useRequireAuth(redirectTo: string = "/auth/login") {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, redirectTo, router]);

  return { user, loading, initialized };
}

// Hook to handle protected routes
export function useProtectedRoute(redirectTo: string = "/auth/login") {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, redirectTo, router]);

  // Return loading state and whether user is authenticated
  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    isLoading: loading || !initialized,
  };
}

// Hook for handling form loading states
export function useFormLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await asyncFn();
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, withLoading, setIsLoading };
}

// Hook for managing auth-related redirects after successful actions
export function useAuthRedirect() {
  const router = useRouter();

  const redirectAfterAuth = useCallback(
    (path: string = "/dashboard") => {
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        router.push(path);
      }, 100);
    },
    [router],
  );

  const redirectAfterLogout = useCallback(
    (path: string = "/") => {
      router.push(path);
    },
    [router],
  );

  return { redirectAfterAuth, redirectAfterLogout };
}

// Hook for managing authentication state with enhanced error handling
export function useAuthState() {
  const auth = useAuth();
  const { handleAuthError } = useAuthError();
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (authError: any) => {
      const message = handleAuthError(authError);

      setError(message);

      return message;
    },
    [handleAuthError],
  );

  return {
    ...auth,
    error,
    clearError,
    handleError,
  };
}

// Hook for permission-based access control
export function usePermissions() {
  const { user, hasPermission, getUserTier, getSubscriptionStatus } = useAuth();

  const checkPermissions = useCallback(
    (requiredPermissions: string[]) => {
      if (!user) return false;

      return requiredPermissions.every((permission) =>
        hasPermission(permission),
      );
    },
    [user, hasPermission],
  );

  const checkTier = useCallback(
    (requiredTier: "free" | "pro" | "max" | "educational") => {
      const currentTier = getUserTier();
      const tierHierarchy = { free: 0, educational: 1, pro: 2, max: 3 };

      return (
        tierHierarchy[currentTier as keyof typeof tierHierarchy] >=
        tierHierarchy[requiredTier]
      );
    },
    [getUserTier],
  );

  const hasActiveSubscription = useCallback(() => {
    const status = getSubscriptionStatus();

    return status === "active";
  }, [getSubscriptionStatus]);

  return {
    user,
    checkPermissions,
    checkTier,
    hasActiveSubscription,
    currentTier: getUserTier(),
    subscriptionStatus: getSubscriptionStatus(),
  };
}

// Hook for handling authentication flows (signup, signin, etc.)
export function useAuthFlow() {
  const auth = useAuth();
  const { handleAuthError } = useAuthError();
  const { isLoading, withLoading } = useFormLoading();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      return withLoading(async () => {
        clearMessages();
        try {
          const result = await auth.signIn(email, password, rememberMe);

          if (!result.success) {
            if (result.requiresMFA) {
              setSuccess("Please complete MFA verification to continue.");

              return { success: false, requiresMFA: true };
            }

            const errorMessage = result.error || "Sign in failed";

            setError(errorMessage);

            return { success: false, error: errorMessage };
          }

          setSuccess("Successfully signed in!");

          return { success: true };
        } catch (error) {
          const errorMessage = handleAuthError(error);

          setError(errorMessage);

          return { success: false, error: errorMessage };
        }
      });
    },
    [auth, withLoading, clearMessages, handleAuthError],
  );

  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      return withLoading(async () => {
        clearMessages();
        try {
          const result = await auth.signUp(email, password, metadata);

          if (!result.success) {
            const errorMessage = result.error || "Sign up failed";

            setError(errorMessage);

            return { success: false, error: errorMessage };
          }

          if (result.requiresEmailVerification) {
            setSuccess(
              "Please check your email and verify your account before signing in.",
            );

            return { success: true, requiresEmailVerification: true };
          }

          setSuccess("Account created successfully!");

          return { success: true };
        } catch (error) {
          const errorMessage = handleAuthError(error);

          setError(errorMessage);

          return { success: false, error: errorMessage };
        }
      });
    },
    [auth, withLoading, clearMessages, handleAuthError],
  );

  const signOut = useCallback(async () => {
    return withLoading(async () => {
      clearMessages();
      try {
        await auth.signOut();
        setSuccess("Successfully signed out!");

        return { success: true };
      } catch (error) {
        const errorMessage = handleAuthError(error);

        setError(errorMessage);

        return { success: false, error: errorMessage };
      }
    });
  }, [auth, withLoading, clearMessages, handleAuthError]);

  const resetPassword = useCallback(
    async (email: string) => {
      return withLoading(async () => {
        clearMessages();
        try {
          const result = await auth.resetPassword(email);

          if (!result.success) {
            const errorMessage = result.error || "Password reset failed";

            setError(errorMessage);

            return { success: false, error: errorMessage };
          }

          setSuccess(
            "Password reset email sent! Check your inbox for instructions.",
          );

          return { success: true };
        } catch (error) {
          const errorMessage = handleAuthError(error);

          setError(errorMessage);

          return { success: false, error: errorMessage };
        }
      });
    },
    [auth, withLoading, clearMessages, handleAuthError],
  );

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoading,
    error,
    success,
    clearMessages,
  };
}

// Hook for session management utilities
export function useSession() {
  const { session, refreshSession } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } catch (error) {
      console.error("Session refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSession]);

  const isExpired = useCallback(() => {
    if (!session?.expires_at) return false;

    return new Date(session.expires_at * 1000) <= new Date();
  }, [session]);

  const expiresIn = useCallback(() => {
    if (!session?.expires_at) return null;
    const expiryTime = new Date(session.expires_at * 1000);
    const now = new Date();

    return Math.max(0, expiryTime.getTime() - now.getTime());
  }, [session]);

  return {
    session,
    refresh,
    refreshing,
    isExpired: isExpired(),
    expiresIn: expiresIn(),
  };
}
