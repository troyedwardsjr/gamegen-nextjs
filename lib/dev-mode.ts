/**
 * Development Mode Utilities for GameGen Platform
 *
 * Provides utilities for enabling dev mode with mocked authentication
 * WARNING: This should ONLY be used in development environments
 */

import type { User, Session } from "@supabase/supabase-js";

/**
 * Checks if dev mode is enabled
 * Validates multiple conditions for security:
 * - NODE_ENV must be 'development'
 * - Both server and client dev mode flags must be true
 * - Must be running on localhost or .local domain
 */
export function isDevModeEnabled(): boolean {
  // Client-side vs Server-side environment handling
  const isClient = typeof window !== "undefined";

  if (isClient) {
    // Client-side: Only NEXT_PUBLIC_ variables are available
    const clientDevMode = process.env.NEXT_PUBLIC_DEV_MODE_ENABLED === "true";

    if (!clientDevMode) {
      return false;
    }

    // Client-side hostname validation
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isLocalDomain = hostname.endsWith(".local");

    if (!isLocalhost && !isLocalDomain) {
      console.warn(
        "🚧 DEV MODE: Blocked - not running on localhost or .local domain",
      );

      return false;
    }

    return true;
  } else {
    // Server-side: All environment variables are available
    if (process.env.NODE_ENV !== "development") {
      return false;
    }

    const serverDevMode = process.env.DEV_MODE_ENABLED === "true";
    const clientDevMode = process.env.NEXT_PUBLIC_DEV_MODE_ENABLED === "true";

    if (!serverDevMode || !clientDevMode) {
      return false;
    }

    return true;
  }
}

/**
 * Creates a mock user for dev mode (GameGen specific)
 */
export function createMockDevUser(): User {
  return {
    id: "dev-user-gamegen-123456789",
    aud: "authenticated",
    email: "developer@gamegen.com",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
    confirmed_at: "2025-01-01T00:00:00.000Z",
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "dev-mode",
      providers: ["dev-mode"],
    },
    user_metadata: {
      email: "developer@gamegen.com",
      full_name: "GameGen Developer",
      username: "dev_creator",
      display_name: "Development User",
      provider: "dev-mode",
    },
    identities: [
      {
        id: "dev-user-gamegen-123456789",
        user_id: "dev-user-gamegen-123456789",
        identity_id: "dev-user-gamegen-123456789",
        identity_data: {
          email: "developer@gamegen.com",
          sub: "dev-user-gamegen-123456789",
        },
        provider: "dev-mode",
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
      },
    ],
    role: "authenticated",
    phone: "",
    email_confirmed_at: "2025-01-01T00:00:00.000Z",
    phone_confirmed_at: undefined,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    is_anonymous: false,
  };
}

/**
 * Creates a mock session for dev mode
 */
export function createMockDevSession(): Session {
  const user = createMockDevUser();

  return {
    access_token: "dev-mode-access-token-gamegen",
    refresh_token: "dev-mode-refresh-token-gamegen",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
}

/**
 * Creates a mock user profile for dev mode (GameGen specific)
 */
export function createMockDevProfile() {
  return {
    id: "dev-user-gamegen-123456789",
    email: "developer@gamegen.com",
    username: "dev_creator",
    display_name: "GameGen Developer",
    full_name: "Development User",
    avatar_url: null,
    bio: "Development user for testing GameGen platform features",
    subscription_tier: "max",
    subscription_status: "active",
    subscription_period_start: "2025-01-01T00:00:00.000Z",
    subscription_period_end: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    stripe_customer_id: null,
    is_verified: true,
    verification_level: "full",
    total_games_created: 15,
    total_games_published: 12,
    total_community_posts: 8,
    total_likes_received: 247,
    total_followers: 89,
    total_following: 34,
    reputation_score: 850,
    preferred_genres: ["platformer", "puzzle", "adventure"],
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    timezone: "America/New_York",
    language: "en",
    notification_preferences: {
      email_notifications: true,
      push_notifications: true,
      community_updates: true,
      game_updates: true,
    },
    privacy_settings: {
      profile_visibility: "public",
      show_activity: true,
      show_games: true,
    },
    onboarding_completed: true,
    onboarding_step: null,
    feature_flags: {
      beta_features: true,
      advanced_editor: true,
      ai_assistance: true,
      collaboration: true,
    },
  };
}

/**
 * Logs dev mode activation with security warnings
 */
export function logDevModeActivation(context: string): void {
  console.warn("🚧 GAMEGEN DEV MODE ACTIVATED 🚧");
  console.warn(`Context: ${context}`);
  console.warn("⚠️  WARNING: Authentication is bypassed");
  console.warn("⚠️  WARNING: Never enable in production");
  console.warn("🔒 Environment checks passed: development + localhost");
}

/**
 * Logs dev mode bypass actions
 */
export function logDevModeBypass(route: string): void {
  console.log(
    `🚧 GAMEGEN DEV MODE: Bypassing authentication middleware for ${route}`,
  );
}

/**
 * Creates mock game data for dev mode testing
 */
export function createMockGameData() {
  return [
    {
      id: "game-dev-1",
      title: "Pixel Adventure Demo",
      description: "A sample platformer game created in development mode",
      thumbnail_url: null,
      status: "published",
      genre: "platformer",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 23,
      plays_count: 156,
      creator_id: "dev-user-gamegen-123456789",
    },
    {
      id: "game-dev-2",
      title: "Puzzle Master",
      description: "A brain-teasing puzzle game for testing",
      thumbnail_url: null,
      status: "draft",
      genre: "puzzle",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      plays_count: 0,
      creator_id: "dev-user-gamegen-123456789",
    },
  ];
}
