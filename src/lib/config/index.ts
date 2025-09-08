/**
 * GameGen Configuration Index
 * Centralized exports for all configuration modules
 */

// Re-export all configuration modules
export * from "./env";
export * from "./site";
export * from "./api-endpoints";
export * from "./database";
export * from "./supabase";

// Default exports for convenience
export { siteConfig } from "./site";
export { env, validateEnvironment } from "./env";
export { ENDPOINTS, API_CONFIG } from "./api-endpoints";
export { DB_CONFIG } from "./database";
export {
  supabase,
  createClientInstance,
  createServerSupabaseClient,
  getSession,
  getUser,
  isSupabaseAvailable,
} from "./supabase";
