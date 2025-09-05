// Main exports for Supabase integration
export { createClient } from './client'
export { createClient as createServerClient } from './server'
export { createAdminClient } from './admin'
export { updateSession } from './middleware'

// Database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Json,
  Profile,
  Game,
  GameAsset,
  GameScript,
  User,
  GameComment,
  Collection,
  PlaySession,
} from './database.types'

// Utility classes and functions
export {
  DatabaseError,
  SupabaseService,
  GameService,
  ProfileService,
  MigrationRunner,
  handleSupabaseError,
  withErrorHandling,
  checkDatabaseConnection,
} from './utils'

// React hooks
export {
  useSupabaseQuery,
  useUser,
  useProfile,
  useProfileByUsername,
  useGame,
  usePublicGames,
  useUserGames,
  useMyGames,
  useRealtimeSubscription,
  useCollaborationSession,
  useGameAnalytics,
  useCredits,
  useGameSearch,
  useInfiniteScroll,
} from './hooks'

// Logging utilities
export {
  logger,
  LogLevel,
  DatabaseLogger,
  AuthLogger,
  RealtimeLogger,
  PerformanceMonitor,
  withLogging,
  DebugUtils,
} from './logger'

export type { LogEntry } from './logger'

// Common patterns and helpers
export const SUPABASE_CONFIG = {
  POOL_CONFIG: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000'),
  },
  REALTIME_CONFIG: {
    reconnectAfterMs: 1000,
    heartbeatIntervalMs: 30000,
    longpollingTimeout: 20000,
  },
  STORAGE_CONFIG: {
    buckets: {
      gameAssets: 'game-assets',
      userContent: 'user-content',
      templates: 'templates',
      communityAssets: 'community-assets',
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      data: ['application/json', 'text/plain'],
    },
  },
}

// Migration utilities are exported above in the utils section

// Error handling helpers
export function isSupabaseError(error: any): boolean {
  return error && error.code && error.message
}

export function getErrorMessage(error: any): string {
  if (error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Type guards
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Environment validation
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = required.filter(key => !process.env[key])
  
  return {
    valid: missing.length === 0,
    missing,
  }
}

// Initialize and validate environment on import
if (typeof window === 'undefined') {
  const envCheck = validateEnvironment()
  if (!envCheck.valid) {
    console.warn(
      'Missing required Supabase environment variables:',
      envCheck.missing.join(', ')
    )
  }
}

// Export version for debugging
export const SUPABASE_CLIENT_VERSION = '2.57.0' // Keep in sync with package.json