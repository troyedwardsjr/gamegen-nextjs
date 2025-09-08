"use client";

/**
 * Protected Route component for GameGen platform
 * Provides flexible route protection with role-based access control
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/react";

import { useAuth } from "./context";

export interface ProtectedRouteProps {
  children: React.ReactNode;

  // Authentication requirements
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requireMFA?: boolean;

  // Permission requirements
  requiredPermissions?: string[];
  requiredTier?: "free" | "pro" | "max" | "educational";
  requiredRole?: string[];

  // Redirect settings
  redirectTo?: string;
  unauthorizedRedirect?: string;

  // Loading and error components
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;

  // Callback functions
  onUnauthorized?: () => void;
  onAuthRequired?: () => void;
}

interface RouteGuardState {
  loading: boolean;
  authorized: boolean;
  reason?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerified = false,
  requireMFA = false,
  requiredPermissions = [],
  requiredTier,
  requiredRole = [],
  redirectTo = "/auth/login",
  unauthorizedRedirect = "/unauthorized",
  loadingComponent,
  unauthorizedComponent,
  onUnauthorized,
  onAuthRequired,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    user,
    loading,
    initialized,
    hasPermission,
    getUserTier,
    isMFARequired,
  } = useAuth();

  const [guardState, setGuardState] = useState<RouteGuardState>({
    loading: true,
    authorized: false,
  });

  useEffect(() => {
    async function checkAccess() {
      if (!initialized || loading) {
        setGuardState({ loading: true, authorized: false });

        return;
      }

      try {
        // Check authentication requirement
        if (requireAuth && !user) {
          setGuardState({
            loading: false,
            authorized: false,
            reason: "Authentication required",
          });

          onAuthRequired?.();
          router.push(redirectTo);

          return;
        }

        // If not requiring auth and no user, allow access
        if (!requireAuth && !user) {
          setGuardState({ loading: false, authorized: true });

          return;
        }

        // If we reach here, user exists
        if (user) {
          // Check email verification requirement
          if (requireEmailVerified && !user.email_confirmed_at) {
            setGuardState({
              loading: false,
              authorized: false,
              reason: "Email verification required",
            });

            router.push("/auth/verify-email");

            return;
          }

          // Check MFA requirement
          const mfaRequired = await isMFARequired();

          if ((requireMFA || mfaRequired) && !user.aud) {
            // This is a simplified MFA check - in reality you'd check MFA verification status
            setGuardState({
              loading: false,
              authorized: false,
              reason: "Multi-factor authentication required",
            });

            router.push("/auth/mfa");

            return;
          }

          // Check subscription tier requirement
          if (requiredTier) {
            const userTier = getUserTier();
            const tierHierarchy = { free: 0, pro: 1, educational: 2, max: 3 };

            if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
              setGuardState({
                loading: false,
                authorized: false,
                reason: `${requiredTier} subscription required`,
              });

              onUnauthorized?.();
              router.push(unauthorizedRedirect);

              return;
            }
          }

          // Check permission requirements
          if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every((permission) =>
              hasPermission(permission),
            );

            if (!hasAllPermissions) {
              setGuardState({
                loading: false,
                authorized: false,
                reason: "Insufficient permissions",
              });

              onUnauthorized?.();
              router.push(unauthorizedRedirect);

              return;
            }
          }

          // Check role requirements
          if (requiredRole.length > 0) {
            // This would require extending the auth context to include roles
            // For now, we'll skip this check
            console.warn("Role-based access control not fully implemented");
          }
        }

        // If all checks pass
        setGuardState({ loading: false, authorized: true });
      } catch (error) {
        console.error("Error checking route access:", error);
        setGuardState({
          loading: false,
          authorized: false,
          reason: "Access check failed",
        });
      }
    }

    checkAccess();
  }, [
    initialized,
    loading,
    user,
    requireAuth,
    requireEmailVerified,
    requireMFA,
    requiredPermissions,
    requiredTier,
    requiredRole,
    redirectTo,
    unauthorizedRedirect,
    onUnauthorized,
    onAuthRequired,
    router,
    hasPermission,
    getUserTier,
    isMFARequired,
  ]);

  // Show loading state
  if (guardState.loading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show unauthorized state
  if (!guardState.authorized) {
    return (
      unauthorizedComponent || (
        <DefaultUnauthorizedComponent reason={guardState.reason} />
      )
    );
  }

  // Render protected content
  return <>{children}</>;
}

// Default loading component
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner color="primary" size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Default unauthorized component
function DefaultUnauthorizedComponent({ reason }: { reason?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          {reason || "You do not have permission to access this page."}
        </p>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

// Higher-order component version for convenience
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  protectionOptions: Omit<ProtectedRouteProps, "children">,
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protectionOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Utility hook for checking access without redirecting
export function useRouteAccess(options: Omit<ProtectedRouteProps, "children">) {
  const {
    user,
    loading,
    initialized,
    hasPermission,
    getUserTier,
    isMFARequired,
  } = useAuth();

  const [access, setAccess] = useState({
    canAccess: false,
    loading: true,
    reason: "",
  });

  useEffect(() => {
    async function checkAccess() {
      if (!initialized || loading) {
        setAccess((prev) => ({ ...prev, loading: true }));

        return;
      }

      try {
        let canAccess = true;
        let reason = "";

        // Authentication check
        if (options.requireAuth && !user) {
          canAccess = false;
          reason = "Authentication required";
        }

        // Email verification check
        if (
          canAccess &&
          options.requireEmailVerified &&
          user &&
          !user.email_confirmed_at
        ) {
          canAccess = false;
          reason = "Email verification required";
        }

        // MFA check
        if (canAccess && options.requireMFA && user) {
          const mfaRequired = await isMFARequired();

          if (mfaRequired) {
            canAccess = false;
            reason = "Multi-factor authentication required";
          }
        }

        // Tier check
        if (canAccess && options.requiredTier && user) {
          const userTier = getUserTier();
          const tierHierarchy = { free: 0, pro: 1, educational: 2, max: 3 };

          if (tierHierarchy[userTier] < tierHierarchy[options.requiredTier]) {
            canAccess = false;
            reason = `${options.requiredTier} subscription required`;
          }
        }

        // Permission check
        if (canAccess && options.requiredPermissions?.length) {
          const hasAllPermissions = options.requiredPermissions.every(
            (permission) => hasPermission(permission),
          );

          if (!hasAllPermissions) {
            canAccess = false;
            reason = "Insufficient permissions";
          }
        }

        setAccess({ canAccess, loading: false, reason });
      } catch (error) {
        console.error("Error checking route access:", error);
        setAccess({
          canAccess: false,
          loading: false,
          reason: "Access check failed",
        });
      }
    }

    checkAccess();
  }, [
    initialized,
    loading,
    user,
    options.requireAuth,
    options.requireEmailVerified,
    options.requireMFA,
    options.requiredPermissions,
    options.requiredTier,
    hasPermission,
    getUserTier,
    isMFARequired,
  ]);

  return access;
}

// Specialized components for common protection patterns
export function AdminOnlyRoute({
  children,
  ...props
}: { children: React.ReactNode } & Partial<ProtectedRouteProps>) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requiredPermissions={["admin"]}
      unauthorizedRedirect="/admin/login"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function ProTierRoute({
  children,
  ...props
}: { children: React.ReactNode } & Partial<ProtectedRouteProps>) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requiredTier="pro"
      unauthorizedRedirect="/pricing"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function EducationalRoute({
  children,
  ...props
}: { children: React.ReactNode } & Partial<ProtectedRouteProps>) {
  return (
    <ProtectedRoute
      requireAuth={true}
      requiredTier="educational"
      unauthorizedRedirect="/educational"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}
