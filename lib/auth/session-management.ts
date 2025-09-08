/**
 * Session Management Utilities for GameGen platform
 * Advanced session handling with persistence, refresh logic, and cleanup
 */

import type { Database } from "../supabase/database.types";

import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export interface SessionData {
  user: any;
  profile?: UserProfile | null;
  expires_at?: number;
  access_token?: string;
  refresh_token?: string;
}

export interface SessionOptions {
  persistSession?: boolean;
  autoRefresh?: boolean;
  refreshThreshold?: number; // minutes before expiry to auto-refresh
  maxRetries?: number;
  storage?: "localStorage" | "sessionStorage" | "cookie";
}

/**
 * Client-side session manager
 */
export class ClientSessionManager {
  private supabase: any;
  private options: Required<SessionOptions>;
  private refreshTimer?: NodeJS.Timeout;
  private refreshPromise?: Promise<any>;

  constructor(options: SessionOptions = {}) {
    this.options = {
      persistSession: true,
      autoRefresh: true,
      refreshThreshold: 10, // 10 minutes
      maxRetries: 3,
      storage: "localStorage",
      ...options,
    };

    this.supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: this.options.autoRefresh,
          persistSession: this.options.persistSession,
          detectSessionInUrl: true,
        },
      },
    );

    // Setup auto-refresh if enabled
    if (this.options.autoRefresh) {
      this.setupAutoRefresh();
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.error("Session retrieval error:", error);

        return null;
      }

      return session;
    } catch (error) {
      console.error("Session error:", error);

      return null;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        console.error("User retrieval error:", error);

        return null;
      }

      return user;
    } catch (error) {
      console.error("User error:", error);

      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile retrieval error:", error);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Profile error:", error);

      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._refreshSession();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  private async _refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);
        throw error;
      }

      // Reset auto-refresh timer
      if (this.options.autoRefresh && data.session) {
        this.scheduleAutoRefresh(data.session.expires_at);
      }

      return data;
    } catch (error) {
      console.error("Session refresh failed:", error);
      throw error;
    }
  }

  /**
   * Sign out and cleanup
   */
  async signOut() {
    try {
      // Clear auto-refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = undefined;
      }

      // Clear any pending refresh
      this.refreshPromise = undefined;

      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }

      // Clear local storage if needed
      this.clearLocalSession();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  }

  /**
   * Check if session is expired or about to expire
   */
  isSessionExpired(session: any, bufferMinutes = 5): boolean {
    if (!session?.expires_at) return true;

    const now = Date.now() / 1000;
    const expiresAt = session.expires_at;
    const buffer = bufferMinutes * 60; // Convert to seconds

    return expiresAt - buffer <= now;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeToExpiry(session: any): number | null {
    if (!session?.expires_at) return null;

    const now = Date.now();
    const expiresAt = session.expires_at * 1000;

    return Math.max(0, expiresAt - now);
  }

  /**
   * Setup automatic session refresh
   */
  private setupAutoRefresh() {
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.expires_at) {
          this.scheduleAutoRefresh(session.expires_at);
        }
      } else if (event === "SIGNED_OUT") {
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
          this.refreshTimer = undefined;
        }
      }
    });
  }

  /**
   * Schedule automatic refresh before expiry
   */
  private scheduleAutoRefresh(expiresAt: number) {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const now = Date.now() / 1000;
    const refreshAt = expiresAt - this.options.refreshThreshold * 60; // Convert minutes to seconds
    const delay = Math.max(0, (refreshAt - now) * 1000); // Convert to milliseconds

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshSession();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, delay);
  }

  /**
   * Clear local session data
   */
  private clearLocalSession() {
    try {
      if (typeof window === "undefined") return;
      
      if (this.options.storage === "localStorage" && window.localStorage) {
        window.localStorage.removeItem("sb-auth-token");
      } else if (this.options.storage === "sessionStorage" && window.sessionStorage) {
        window.sessionStorage.removeItem("sb-auth-token");
      }
    } catch (error) {
      console.error("Failed to clear local session:", error);
    }
  }

  /**
   * Reset password for email
   */
  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    return this.supabase.auth.resetPasswordForEmail(email, options);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.refreshPromise = undefined;
  }
}

/**
 * Server-side session utilities
 */
export class ServerSessionManager {
  /**
   * Create server-side Supabase client with cookie handling
   */
  static async createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      },
    );
  }

  /**
   * Get server-side session
   */
  static async getSession() {
    try {
      const supabase = await this.createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Server session error:", error);

        return null;
      }

      return session;
    } catch (error) {
      console.error("Server session retrieval failed:", error);

      return null;
    }
  }

  /**
   * Get server-side user
   */
  static async getUser() {
    try {
      const supabase = await this.createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Server user error:", error);

        return null;
      }

      return user;
    } catch (error) {
      console.error("Server user retrieval failed:", error);

      return null;
    }
  }

  /**
   * Get server-side user profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = await this.createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Server profile error:", error);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Server profile retrieval failed:", error);

      return null;
    }
  }

  /**
   * Check if user has valid session
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();

    return !!user;
  }

  /**
   * Check if user has specific permissions
   */
  static async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getUser();

    if (!user) return false;

    const permissions = (user.user_metadata?.permissions as string[]) || [];

    return permissions.includes(permission);
  }

  /**
   * Check user subscription tier
   */
  static async getUserTier(): Promise<string> {
    const user = await this.getUser();

    if (!user) return "free";

    const profile = await this.getUserProfile(user.id);

    return profile?.subscription_tier || "free";
  }
}

/**
 * Session storage utilities
 */
export const sessionStorage = {
  /**
   * Store session data in localStorage
   */
  store(key: string, data: SessionData) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to store session data:", error);
    }
  },

  /**
   * Retrieve session data from localStorage
   */
  retrieve(key: string): SessionData | null {
    try {
      const data = localStorage.getItem(key);

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to retrieve session data:", error);

      return null;
    }
  },

  /**
   * Remove session data from localStorage
   */
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove session data:", error);
    }
  },

  /**
   * Clear all session data
   */
  clear() {
    try {
      // Remove common Supabase keys
      const keysToRemove = [
        "sb-auth-token",
        "supabase.auth.token",
        "sb-localhost-auth-token",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Failed to clear session storage:", error);
    }
  },
};
