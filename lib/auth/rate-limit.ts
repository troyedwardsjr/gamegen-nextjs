/**
 * Rate limiting implementation for GameGen platform
 * Provides multi-layer rate limiting with different strategies
 */

import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  window: number; // Time window in seconds
  max: number; // Max requests in window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest, key: string) => void;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// In-memory store for development (use Redis in production)
class MemoryStore {
  private store = new Map<string, { count: number; reset: number }>();

  async get(key: string): Promise<{ count: number; reset: number } | null> {
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if window has expired
    if (Date.now() > entry.reset) {
      this.store.delete(key);

      return null;
    }

    return entry;
  }

  async set(key: string, count: number, window: number): Promise<void> {
    const reset = Date.now() + window * 1000;

    this.store.set(key, { count, reset });
  }

  async increment(
    key: string,
    window: number,
  ): Promise<{ count: number; reset: number }> {
    const existing = await this.get(key);

    if (existing) {
      existing.count++;
      this.store.set(key, existing);

      return existing;
    }

    const newEntry = { count: 1, reset: Date.now() + window * 1000 };

    this.store.set(key, newEntry);

    return newEntry;
  }

  // Cleanup expired entries (call periodically)
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.reset) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
const store = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    store.cleanup();
  },
  5 * 60 * 1000,
);

// Pre-configured rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Global rate limits
  global: { window: 60, max: 1000 },

  // Per-user rate limits
  authenticated: { window: 60, max: 100 },

  // Per-IP rate limits
  anonymous: { window: 60, max: 20 },

  // Endpoint-specific limits
  auth: {
    window: 900, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    keyGenerator: (req) => `auth:${getClientIP(req)}`,
  },

  // AI generation limits by tier
  ai_generation_free: { window: 3600, max: 10 }, // 10 generations per hour
  ai_generation_pro: { window: 3600, max: 100 }, // 100 generations per hour
  ai_generation_max: { window: 3600, max: 1000 }, // 1000 generations per hour

  // API endpoints
  api_general: { window: 60, max: 60 },
  api_upload: { window: 300, max: 10 }, // 10 uploads per 5 minutes
  api_export: { window: 600, max: 5 }, // 5 exports per 10 minutes

  // Password reset
  password_reset: {
    window: 3600, // 1 hour
    max: 3, // 3 attempts per hour
    keyGenerator: (req) => `password_reset:${getClientIP(req)}`,
  },

  // Email verification
  email_verification: {
    window: 300, // 5 minutes
    max: 3, // 3 attempts per 5 minutes
    keyGenerator: (req) => `email_verification:${getClientIP(req)}`,
  },
};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(request: NextRequest, userId?: string): Promise<RateLimitResult> {
    const key = this.generateKey(request, userId);
    const { count, reset } = await store.increment(key, this.config.window);

    const remaining = Math.max(0, this.config.max - count);
    const resetTime = Math.ceil(reset / 1000);

    if (count <= this.config.max) {
      return {
        success: true,
        limit: this.config.max,
        remaining,
        reset: resetTime,
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    if (this.config.onLimitReached) {
      this.config.onLimitReached(request, key);
    }

    return {
      success: false,
      limit: this.config.max,
      remaining: 0,
      reset: resetTime,
      retryAfter,
    };
  }

  private generateKey(request: NextRequest, userId?: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default key generation strategy
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (userId) {
      return `user:${userId}`;
    }

    // Use IP + partial user agent as fallback
    const agentHash = hashString(userAgent).substring(0, 8);

    return `ip:${ip}:${agentHash}`;
  }
}

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");

  if (realIP) {
    return realIP;
  }

  return request.ip || "unknown";
}

// Helper function to hash strings
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);

    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

// Middleware factory for applying rate limits
export function createRateLimitMiddleware(
  configName: keyof typeof RATE_LIMITS,
  customConfig?: Partial<RateLimitConfig>,
) {
  return async (request: NextRequest, userId?: string) => {
    const baseConfig = RATE_LIMITS[configName];

    if (!baseConfig) {
      console.warn(`Rate limit config '${configName}' not found`);

      return { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    const config = { ...baseConfig, ...customConfig };
    const rateLimiter = new RateLimiter(config);
    const result = await rateLimiter.check(request, userId);

    return result;
  };
}

// Middleware function for NextJS
export async function rateLimitMiddleware(
  request: NextRequest,
  configName: keyof typeof RATE_LIMITS,
  userId?: string,
): Promise<NextResponse | null> {
  const checkLimit = createRateLimitMiddleware(configName);
  const result = await checkLimit(request, userId);

  if (!result.success) {
    const response = NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      { status: 429 },
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.reset.toString());
    response.headers.set("Retry-After", result.retryAfter!.toString());

    return response;
  }

  return null; // No rate limit hit, continue with request
}

// Enhanced rate limiter with sliding window for more accurate limiting
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(request: NextRequest, userId?: string): Promise<RateLimitResult> {
    const key = this.generateKey(request, userId);
    const now = Date.now();
    const windowMs = this.config.window * 1000;

    // Get or create window for this key
    let timestamps = this.windows.get(key) || [];

    // Remove timestamps outside the current window
    timestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

    // Check if we're within the limit
    if (timestamps.length >= this.config.max) {
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return {
        success: false,
        limit: this.config.max,
        remaining: 0,
        reset: Math.ceil((oldestTimestamp + windowMs) / 1000),
        retryAfter,
      };
    }

    // Add current timestamp and update window
    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      success: true,
      limit: this.config.max,
      remaining: this.config.max - timestamps.length,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  private generateKey(request: NextRequest, userId?: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    const ip = getClientIP(request);

    if (userId) {
      return `sliding:user:${userId}`;
    }

    return `sliding:ip:${ip}`;
  }

  // Cleanup old windows periodically
  cleanup(): void {
    const now = Date.now();
    const windowMs = this.config.window * 1000;

    for (const [key, timestamps] of this.windows.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (validTimestamps.length === 0) {
        this.windows.delete(key);
      } else if (validTimestamps.length !== timestamps.length) {
        this.windows.set(key, validTimestamps);
      }
    }
  }
}

// Utility to check multiple rate limits
export async function checkMultipleRateLimits(
  request: NextRequest,
  limits: (keyof typeof RATE_LIMITS)[],
  userId?: string,
): Promise<RateLimitResult> {
  for (const limitName of limits) {
    const checkLimit = createRateLimitMiddleware(limitName);
    const result = await checkLimit(request, userId);

    if (!result.success) {
      return result;
    }
  }

  return { success: true, limit: 0, remaining: 0, reset: 0 };
}
