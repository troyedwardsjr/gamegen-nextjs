// Environment configuration for GameGen application

export interface EnvironmentConfig {
  // App configuration
  NODE_ENV: "development" | "production" | "test";
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Claude API configuration
  ANTHROPIC_API_KEY?: string;
  NEXT_PUBLIC_CLAUDE_MODEL?: string;

  // Stripe configuration
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;

  // Game engine configuration
  NEXT_PUBLIC_TOXOID_ENGINE_URL?: string;
  NEXT_PUBLIC_ASSET_CDN_URL?: string;

  // Analytics and monitoring
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;

  // Email configuration
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;

  // Feature flags
  NEXT_PUBLIC_ENABLE_DEV_MODE?: string;
  NEXT_PUBLIC_ENABLE_AI_FEATURES?: string;
  NEXT_PUBLIC_ENABLE_MULTIPLAYER?: string;
}

// Type-safe environment variable access with validation
class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.validateAndLoadConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }

    return Environment.instance;
  }

  private validateAndLoadConfig(): EnvironmentConfig {
    // Required environment variables
    const requiredVars = {
      NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "GameGen",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    };

    // Optional environment variables
    const optionalVars = {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_CLAUDE_MODEL:
        process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-3-sonnet-20240229",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_TOXOID_ENGINE_URL:
        process.env.NEXT_PUBLIC_TOXOID_ENGINE_URL || "/toxoid",
      NEXT_PUBLIC_ASSET_CDN_URL:
        process.env.NEXT_PUBLIC_ASSET_CDN_URL || "/assets",
      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
        process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      FROM_EMAIL: process.env.FROM_EMAIL || "noreply@gamegen.app",
      NEXT_PUBLIC_ENABLE_DEV_MODE:
        process.env.NEXT_PUBLIC_ENABLE_DEV_MODE || "false",
      NEXT_PUBLIC_ENABLE_AI_FEATURES:
        process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES || "true",
      NEXT_PUBLIC_ENABLE_MULTIPLAYER:
        process.env.NEXT_PUBLIC_ENABLE_MULTIPLAYER || "false",
    };

    const config = { ...requiredVars, ...optionalVars } as EnvironmentConfig;

    // Validate required variables in production
    if (config.NODE_ENV === "production") {
      const missingVars: string[] = [];

      if (!config.NEXT_PUBLIC_SUPABASE_URL) {
        missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
      }

      if (!config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      }

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables in production: ${missingVars.join(", ")}`,
        );
      }
    }

    return config;
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === "development";
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === "production";
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === "test";
  }

  public isDevModeEnabled(): boolean {
    return this.config.NEXT_PUBLIC_ENABLE_DEV_MODE === "true";
  }

  public areAIFeaturesEnabled(): boolean {
    return this.config.NEXT_PUBLIC_ENABLE_AI_FEATURES === "true";
  }

  public isMultiplayerEnabled(): boolean {
    return this.config.NEXT_PUBLIC_ENABLE_MULTIPLAYER === "true";
  }

  public hasSupabaseConfig(): boolean {
    return !!(
      this.config.NEXT_PUBLIC_SUPABASE_URL &&
      this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  public hasClaudeConfig(): boolean {
    return !!this.config.ANTHROPIC_API_KEY;
  }

  public hasStripeConfig(): boolean {
    return !!(
      this.config.STRIPE_SECRET_KEY &&
      this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
  }
}

// Export singleton instance
export const env = Environment.getInstance();

// Export helper functions for common checks
export const isDevelopment = () => env.isDevelopment();
export const isProduction = () => env.isProduction();
export const isTest = () => env.isTest();
export const isDevModeEnabled = () => env.isDevModeEnabled();
export const areAIFeaturesEnabled = () => env.areAIFeaturesEnabled();
export const isMultiplayerEnabled = () => env.isMultiplayerEnabled();

// Export configuration getters
export const getAppUrl = () => env.get("NEXT_PUBLIC_APP_URL");
export const getAppName = () => env.get("NEXT_PUBLIC_APP_NAME");
export const getSupabaseUrl = () => env.get("NEXT_PUBLIC_SUPABASE_URL");
export const getSupabaseAnonKey = () =>
  env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const getClaudeModel = () => env.get("NEXT_PUBLIC_CLAUDE_MODEL");
export const getToxoidEngineUrl = () =>
  env.get("NEXT_PUBLIC_TOXOID_ENGINE_URL");
export const getAssetCdnUrl = () => env.get("NEXT_PUBLIC_ASSET_CDN_URL");

// Export validation helpers
export const validateEnvironment = () => {
  const config = env.getAll();
  const warnings: string[] = [];

  if (!env.hasSupabaseConfig()) {
    warnings.push(
      "Supabase configuration is missing - authentication features will be disabled",
    );
  }

  if (!env.hasClaudeConfig() && env.areAIFeaturesEnabled()) {
    warnings.push("Claude API key is missing - AI features will be disabled");
  }

  if (!env.hasStripeConfig() && env.isProduction()) {
    warnings.push(
      "Stripe configuration is missing - payment features will be disabled",
    );
  }

  if (warnings.length > 0) {
    console.warn("Environment configuration warnings:");
    warnings.forEach((warning) => console.warn(`⚠️ ${warning}`));
  }

  return {
    isValid: true,
    warnings,
    config: {
      hasSupabase: env.hasSupabaseConfig(),
      hasClaude: env.hasClaudeConfig(),
      hasStripe: env.hasStripeConfig(),
      devModeEnabled: env.isDevModeEnabled(),
      aiEnabled: env.areAIFeaturesEnabled(),
      multiplayerEnabled: env.isMultiplayerEnabled(),
    },
  };
};
