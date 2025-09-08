/**
 * Rate Limiter Implementation
 *
 * Implements rate limiting for LLM providers with support for different
 * user tiers, token-based limiting, and sliding window algorithms.
 */

import { RateLimitConfig, RateLimitState } from "./types";

interface RateLimitWindow {
  start: Date;
  requests: number;
  tokens: number;
}

interface UserRateLimit {
  windows: RateLimitWindow[];
  current_window: RateLimitWindow;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private userLimits = new Map<string, UserRateLimit>();
  private globalWindow: RateLimitWindow;
  private readonly windowSizeMs = 60000; // 1 minute

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.globalWindow = this.createWindow();
  }

  /**
   * Check if a request is within rate limits
   */
  async checkLimit(
    requestCount: number = 1,
    tokenCount: number = 0,
    userId?: string,
  ): Promise<boolean> {
    const now = new Date();

    // Clean up old windows
    this.cleanupOldWindows(now);

    // Check global limits
    if (!this.checkGlobalLimit(requestCount, tokenCount, now)) {
      return false;
    }

    // Check user-specific limits if userId provided
    if (userId && !this.checkUserLimit(userId, requestCount, tokenCount, now)) {
      return false;
    }

    return true;
  }

  /**
   * Record usage after successful request
   */
  recordUsage(
    requestCount: number = 1,
    tokenCount: number = 0,
    userId?: string,
  ): void {
    const now = new Date();

    // Update global usage
    this.updateGlobalUsage(requestCount, tokenCount, now);

    // Update user usage if userId provided
    if (userId) {
      this.updateUserUsage(userId, requestCount, tokenCount, now);
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(userId?: string): RateLimitState {
    const now = new Date();

    this.cleanupOldWindows(now);

    if (userId) {
      const userLimit = this.userLimits.get(userId);

      if (userLimit) {
        const totalRequests = userLimit.windows.reduce(
          (sum, w) => sum + w.requests,
          0,
        );
        const totalTokens = userLimit.windows.reduce(
          (sum, w) => sum + w.tokens,
          0,
        );

        const userMultiplier = this.getUserTierMultiplier(userId);
        const maxRequests = this.config.requests_per_minute * userMultiplier;
        const maxTokens = this.config.tokens_per_minute * userMultiplier;

        return {
          requests_used: totalRequests,
          tokens_used: totalTokens,
          window_start: userLimit.current_window.start,
          is_exceeded: totalRequests >= maxRequests || totalTokens >= maxTokens,
        };
      }
    }

    // Return global status
    const totalRequests = this.globalWindow.requests;
    const totalTokens = this.globalWindow.tokens;

    return {
      requests_used: totalRequests,
      tokens_used: totalTokens,
      window_start: this.globalWindow.start,
      is_exceeded:
        totalRequests >= this.config.requests_per_minute ||
        totalTokens >= this.config.tokens_per_minute,
    };
  }

  /**
   * Get time until rate limit reset
   */
  getTimeUntilReset(userId?: string): number {
    const now = new Date();
    const windowEnd = new Date(
      this.globalWindow.start.getTime() + this.windowSizeMs,
    );

    if (userId) {
      const userLimit = this.userLimits.get(userId);

      if (userLimit && userLimit.windows.length > 0) {
        const oldestWindow = userLimit.windows[0];
        const userWindowEnd = new Date(
          oldestWindow.start.getTime() + this.windowSizeMs,
        );

        return Math.max(0, userWindowEnd.getTime() - now.getTime());
      }
    }

    return Math.max(0, windowEnd.getTime() - now.getTime());
  }

  /**
   * Clear rate limits for a user
   */
  clearUserLimits(userId: string): void {
    this.userLimits.delete(userId);
  }

  /**
   * Clear all rate limits
   */
  clearAllLimits(): void {
    this.userLimits.clear();
    this.globalWindow = this.createWindow();
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Check global rate limits
   */
  private checkGlobalLimit(
    requestCount: number,
    tokenCount: number,
    now: Date,
  ): boolean {
    // Update current window if needed
    this.updateGlobalWindow(now);

    const wouldExceedRequests =
      this.globalWindow.requests + requestCount >
      this.config.requests_per_minute;
    const wouldExceedTokens =
      this.globalWindow.tokens + tokenCount > this.config.tokens_per_minute;

    // Check burst limit if configured
    if (this.config.burst_limit) {
      const wouldExceedBurst =
        this.globalWindow.requests + requestCount > this.config.burst_limit;

      if (wouldExceedBurst) {
        return false;
      }
    }

    return !(wouldExceedRequests || wouldExceedTokens);
  }

  /**
   * Check user-specific rate limits
   */
  private checkUserLimit(
    userId: string,
    requestCount: number,
    tokenCount: number,
    now: Date,
  ): boolean {
    const userLimit = this.getUserLimit(userId);

    this.updateUserWindows(userLimit, now);

    // Calculate current usage across all windows
    const totalRequests = userLimit.windows.reduce(
      (sum, w) => sum + w.requests,
      0,
    );
    const totalTokens = userLimit.windows.reduce((sum, w) => sum + w.tokens, 0);

    // Apply user tier multiplier
    const multiplier = this.getUserTierMultiplier(userId);
    const maxRequests = this.config.requests_per_minute * multiplier;
    const maxTokens = this.config.tokens_per_minute * multiplier;

    const wouldExceedRequests = totalRequests + requestCount > maxRequests;
    const wouldExceedTokens = totalTokens + tokenCount > maxTokens;

    return !(wouldExceedRequests || wouldExceedTokens);
  }

  /**
   * Update global usage
   */
  private updateGlobalUsage(
    requestCount: number,
    tokenCount: number,
    now: Date,
  ): void {
    this.updateGlobalWindow(now);
    this.globalWindow.requests += requestCount;
    this.globalWindow.tokens += tokenCount;
  }

  /**
   * Update user usage
   */
  private updateUserUsage(
    userId: string,
    requestCount: number,
    tokenCount: number,
    now: Date,
  ): void {
    const userLimit = this.getUserLimit(userId);

    this.updateUserWindows(userLimit, now);

    userLimit.current_window.requests += requestCount;
    userLimit.current_window.tokens += tokenCount;
  }

  /**
   * Update global window
   */
  private updateGlobalWindow(now: Date): void {
    const windowAge = now.getTime() - this.globalWindow.start.getTime();

    if (windowAge >= this.windowSizeMs) {
      this.globalWindow = this.createWindow(now);
    }
  }

  /**
   * Update user windows (sliding window)
   */
  private updateUserWindows(userLimit: UserRateLimit, now: Date): void {
    // Remove expired windows
    userLimit.windows = userLimit.windows.filter((window) => {
      const windowAge = now.getTime() - window.start.getTime();

      return windowAge < this.windowSizeMs;
    });

    // Create new window if current is too old
    const currentWindowAge =
      now.getTime() - userLimit.current_window.start.getTime();

    if (currentWindowAge >= this.windowSizeMs / 4) {
      // Create new window every quarter minute
      const newWindow = this.createWindow(now);

      userLimit.windows.push(userLimit.current_window);
      userLimit.current_window = newWindow;
    }
  }

  /**
   * Get or create user rate limit tracker
   */
  private getUserLimit(userId: string): UserRateLimit {
    let userLimit = this.userLimits.get(userId);

    if (!userLimit) {
      userLimit = {
        windows: [],
        current_window: this.createWindow(),
      };
      this.userLimits.set(userId, userLimit);
    }

    return userLimit;
  }

  /**
   * Create a new rate limit window
   */
  private createWindow(timestamp?: Date): RateLimitWindow {
    return {
      start: timestamp || new Date(),
      requests: 0,
      tokens: 0,
    };
  }

  /**
   * Clean up old windows to prevent memory leaks
   */
  private cleanupOldWindows(now: Date): void {
    const cutoff = now.getTime() - this.windowSizeMs * 2; // Keep 2 minutes of history

    // Clean up user windows
    Array.from(this.userLimits.entries()).forEach(([userId, userLimit]) => {
      userLimit.windows = userLimit.windows.filter(
        (window) => window.start.getTime() > cutoff,
      );

      // Remove user entries with no recent activity
      if (
        userLimit.windows.length === 0 &&
        userLimit.current_window.start.getTime() < cutoff
      ) {
        this.userLimits.delete(userId);
      }
    });
  }

  /**
   * Get user tier multiplier for rate limits
   */
  private getUserTierMultiplier(userId: string): number {
    // Default implementation - in real app, this would check user's subscription tier
    if (!this.config.user_tier_multiplier) {
      return 1.0;
    }

    // Simple tier detection based on userId (in real app, would query database)
    const tier = this.getUserTier(userId);

    return this.config.user_tier_multiplier[tier] || 1.0;
  }

  /**
   * Get user tier (placeholder implementation)
   */
  private getUserTier(userId: string): string {
    // Placeholder - in real implementation would query user's subscription
    // from database or cache
    return "free"; // Default tier
  }

  /**
   * Get statistics for monitoring
   */
  getStatistics(): {
    global: RateLimitState;
    active_users: number;
    total_windows: number;
    memory_usage: number;
  } {
    const globalStats = this.getStatus();
    let totalWindows = 1; // Global window

    Array.from(this.userLimits.values()).forEach((userLimit) => {
      totalWindows += userLimit.windows.length + 1; // Current window
    });

    return {
      global: globalStats,
      active_users: this.userLimits.size,
      total_windows: totalWindows,
      memory_usage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let usage = 200; // Base object overhead

    // Global window
    usage += 100;

    // User limits
    Array.from(this.userLimits.values()).forEach((userLimit) => {
      usage += 50; // User limit object
      usage += userLimit.windows.length * 50; // Each window
    });

    return usage;
  }
}
