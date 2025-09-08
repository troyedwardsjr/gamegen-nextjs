/**
 * Session management utilities for GameGen platform
 * Implements secure session handling with JWT tokens and refresh token rotation
 */

import type { User, Session } from "@supabase/supabase-js";

import { createAuthClient } from "./client";

export interface SessionConfiguration {
  accessTokenExpiry: number; // 15 minutes in seconds
  refreshTokenExpiry: number; // 30 days in seconds
  maxConcurrentSessions: number; // Varies by tier
  sessionTimeout: number; // 2 hours in seconds
  rememberMeDuration: number; // 90 days in seconds
}

export interface ExtendedSession extends Session {
  tier?: "free" | "pro" | "max" | "educational";
  permissions?: string[];
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  ip?: string;
  fingerprint?: string;
  lastActive: Date;
}

export interface SessionState {
  user: User | null;
  session: ExtendedSession | null;
  loading: boolean;
  error: string | null;
}

const SESSION_CONFIG: Record<string, SessionConfiguration> = {
  free: {
    accessTokenExpiry: 900, // 15 minutes
    refreshTokenExpiry: 2592000, // 30 days
    maxConcurrentSessions: 5,
    sessionTimeout: 7200, // 2 hours
    rememberMeDuration: 7776000, // 90 days
  },
  pro: {
    accessTokenExpiry: 900,
    refreshTokenExpiry: 2592000,
    maxConcurrentSessions: 10,
    sessionTimeout: 14400, // 4 hours
    rememberMeDuration: 7776000,
  },
  max: {
    accessTokenExpiry: 1800, // 30 minutes for max tier
    refreshTokenExpiry: 2592000,
    maxConcurrentSessions: 20,
    sessionTimeout: 28800, // 8 hours
    rememberMeDuration: 7776000,
  },
  educational: {
    accessTokenExpiry: 900,
    refreshTokenExpiry: 1209600, // 14 days for educational
    maxConcurrentSessions: 15,
    sessionTimeout: 10800, // 3 hours
    rememberMeDuration: 2592000, // 30 days
  },
};

export class SessionManager {
  private supabase = createAuthClient();
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private lastActivity = Date.now();

  constructor() {
    this.setupActivityTracking();
    this.setupPeriodicSessionCheck();
  }

  /**
   * Initialize session with automatic refresh
   */
  async initializeSession(): Promise<SessionState> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.error("Session initialization error:", error);

        return {
          user: null,
          session: null,
          loading: false,
          error: error.message,
        };
      }

      if (session?.user) {
        const extendedSession = await this.enrichSession(session);

        this.updateLastActivity();

        return {
          user: session.user,
          session: extendedSession,
          loading: false,
          error: null,
        };
      }

      return { user: null, session: null, loading: false, error: null };
    } catch (error) {
      console.error("Unexpected session error:", error);

      return {
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<SessionState> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await this.logSecurityEvent("LOGIN_FAILED", {
          email,
          error: error.message,
        });

        return {
          user: null,
          session: null,
          loading: false,
          error: error.message,
        };
      }

      if (data.session?.user) {
        const extendedSession = await this.enrichSession(data.session);

        // Set session persistence based on remember me
        if (rememberMe) {
          await this.setSessionPersistence("local");
        } else {
          await this.setSessionPersistence("session");
        }

        await this.logSecurityEvent("LOGIN_SUCCESS", { userId: data.user.id });
        this.updateLastActivity();

        return {
          user: data.user,
          session: extendedSession,
          loading: false,
          error: null,
        };
      }

      return {
        user: null,
        session: null,
        loading: false,
        error: "Authentication failed",
      };
    } catch (error) {
      console.error("Sign in error:", error);

      return {
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ): Promise<SessionState> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return {
          user: null,
          session: null,
          loading: false,
          error: error.message,
        };
      }

      // For email confirmation flow, user might not have a session immediately
      if (data.session?.user) {
        const extendedSession = await this.enrichSession(data.session);

        this.updateLastActivity();

        return {
          user: data.user,
          session: extendedSession,
          loading: false,
          error: null,
        };
      }

      // User created but needs email verification
      return {
        user: data.user,
        session: null,
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error("Sign up error:", error);

      return {
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  }

  /**
   * Sign out and cleanup
   */
  async signOut(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (session?.user) {
        await this.logSecurityEvent("LOGOUT", { userId: session.user.id });
      }

      await this.supabase.auth.signOut();
      this.cleanup();
    } catch (error) {
      console.error("Sign out error:", error);
      this.cleanup();
    }
  }

  /**
   * Refresh session manually
   */
  async refreshSession(): Promise<SessionState> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);

        return {
          user: null,
          session: null,
          loading: false,
          error: error.message,
        };
      }

      if (data.session?.user) {
        const extendedSession = await this.enrichSession(data.session);

        this.updateLastActivity();

        return {
          user: data.user,
          session: extendedSession,
          loading: false,
          error: null,
        };
      }

      return { user: null, session: null, loading: false, error: null };
    } catch (error) {
      console.error("Session refresh error:", error);

      return {
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      };
    }
  }

  /**
   * Check if session is expired or about to expire
   */
  isSessionExpiring(session: Session, bufferMinutes = 5): boolean {
    if (!session.expires_at) return false;

    const expiresAt = new Date(session.expires_at * 1000);
    const bufferTime = bufferMinutes * 60 * 1000;

    return Date.now() > expiresAt.getTime() - bufferTime;
  }

  /**
   * Get device fingerprint for session tracking
   */
  getDeviceFingerprint(): string {
    // Only run in browser environment
    if (typeof window === "undefined") {
      return "server-side";
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("Device fingerprint", 2, 2);
      }

      const fingerprint = [
        navigator.userAgent || "",
        navigator.language || "",
        `${screen.width}x${screen.height}` || "0x0",
        new Date().getTimezoneOffset().toString(),
        canvas.toDataURL(),
      ].join("|");

      // Simple hash function
      let hash = 0;

      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);

        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return hash.toString(36);
    } catch (error) {
      console.warn("Error generating device fingerprint:", error);

      return "fallback-" + Math.random().toString(36).substr(2, 9);
    }
  }

  private async enrichSession(session: Session): Promise<ExtendedSession> {
    try {
      // Get user profile to determine tier (permissions column doesn't exist in current schema)
      const { data: profile, error } = await this.supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);

        return {
          ...session,
          tier: "free",
          permissions: [],
        };
      }

      // Generate permissions based on subscription tier
      const tier: ExtendedSession["tier"] = profile.subscription_tier || "free";
      const permissions = this.getPermissionsForTier(tier);

      return {
        ...session,
        tier,
        permissions,
        deviceInfo: {
          userAgent:
            typeof window !== "undefined" ? navigator.userAgent : "server-side",
          fingerprint: this.getDeviceFingerprint(),
          lastActive: new Date(),
        },
      };
    } catch (error) {
      console.error("Error enriching session:", error);

      return {
        ...session,
        tier: "free",
        permissions: [],
      };
    }
  }

  private getPermissionsForTier(
    tier: "free" | "pro" | "max" | "educational",
  ): string[] {
    // Define permissions based on subscription tier
    const tierPermissions = {
      free: ["game:create_basic", "game:publish_public", "asset:use_basic"],
      educational: [
        "game:create_basic",
        "game:publish_public",
        "game:publish_educational",
        "asset:use_basic",
        "collaboration:basic",
      ],
      pro: [
        "game:create_basic",
        "game:create_advanced",
        "game:publish_public",
        "game:export",
        "asset:use_basic",
        "asset:use_premium",
        "collaboration:basic",
        "analytics:basic",
      ],
      max: [
        "game:create_basic",
        "game:create_advanced",
        "game:publish_public",
        "game:export",
        "game:white_label",
        "asset:use_basic",
        "asset:use_premium",
        "asset:create_commercial",
        "collaboration:advanced",
        "analytics:advanced",
        "api:access",
      ],
    };

    return tierPermissions[tier] || tierPermissions.free;
  }

  private async setSessionPersistence(
    type: "local" | "session",
  ): Promise<void> {
    // This is handled automatically by Supabase based on cookie settings
    // Additional persistence logic can be added here if needed
  }

  private updateLastActivity(): void {
    this.lastActivity = Date.now();
  }

  private setupActivityTracking(): void {
    // Only set up activity tracking in browser environment
    if (typeof window === "undefined") {
      return;
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      document.addEventListener(
        event,
        () => {
          this.updateLastActivity();
        },
        { passive: true },
      );
    });
  }

  private setupPeriodicSessionCheck(): void {
    this.sessionCheckInterval = setInterval(async () => {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (session) {
        // Check for session timeout based on inactivity
        const inactivityTime = Date.now() - this.lastActivity;
        const tier = (session as ExtendedSession).tier || "free";
        const sessionTimeout = SESSION_CONFIG[tier].sessionTimeout * 1000;

        if (inactivityTime > sessionTimeout) {
          await this.signOut();

          return;
        }

        // Auto-refresh if expiring soon
        if (this.isSessionExpiring(session)) {
          await this.refreshSession();
        }
      }
    }, 60000); // Check every minute
  }

  private async logSecurityEvent(
    type: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      // Log security event to console (in production, send to logging service)
      console.log(`[SECURITY] ${type}:`, metadata);

      // Try to log to user_sessions table if we have a user ID
      if (metadata.userId) {
        await this.supabase.from("user_sessions").insert({
          user_id: metadata.userId,
          ip_address: metadata.ip_address || "unknown",
          user_agent: metadata.user_agent || "unknown",
          platform: "web",
          activities: [
            {
              type: "security_event",
              event_type: type,
              timestamp: new Date().toISOString(),
              metadata,
            },
          ],
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  }

  /**
   * Reset password for email
   */
  async resetPasswordForEmail(
    email: string,
    options?: { redirectTo?: string },
  ) {
    return this.supabase.auth.resetPasswordForEmail(email, options);
  }

  /**
   * Update user data
   */
  async updateUser(attributes: {
    password?: string;
    email?: string;
    data?: object;
  }) {
    return this.supabase.auth.updateUser(attributes);
  }

  /**
   * Resend verification email
   */
  async resend(options: {
    type: "signup" | "recovery";
    email?: string;
    phone?: string;
  }) {
    if (options.type === "recovery") {
      // For password recovery, we need to use resetPasswordForEmail
      if (!options.email) {
        throw new Error("Email is required for password recovery");
      }

      return this.supabase.auth.resetPasswordForEmail(options.email);
    } else {
      // For signup verification
      return this.supabase.auth.resend({
        type: "signup",
        email: options.email!,
      });
    }
  }

  private cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  destroy(): void {
    this.cleanup();
  }
}
