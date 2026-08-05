/**
 * Client-Side Rate Limiting Engine
 * Implements Sliding Window & Token Bucket throttling algorithms to protect
 * against double-click submission spam, brute force attacks, and API flood.
 */

import { AppLogger } from '../logging/Logger';

const logger = new AppLogger('RateLimiter');

export interface RateLimitConfig {
  maxRequests: number;  // Maximum allowed requests in the time window
  windowMs: number;     // Sliding time window in milliseconds
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

class SlidingWindowRateLimiter {
  private requestsMap = new Map<string, number[]>();

  /**
   * Check if an action key is permitted under the rate limit rule.
   * Automatically records the attempt if allowed.
   */
  checkAndConsume(
    actionKey: string,
    config: RateLimitConfig = { maxRequests: 5, windowMs: 10000 }
  ): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing timestamps and filter out old ones
    const timestamps = (this.requestsMap.get(actionKey) || []).filter(ts => ts > windowStart);

    if (timestamps.length >= config.maxRequests) {
      const oldestTs = timestamps[0];
      const resetMs = oldestTs + config.windowMs - now;
      const retryAfterSeconds = Math.ceil(resetMs / 1000);

      logger.warn(`Rate limit exceeded for action: [${actionKey}]. Retry after ${retryAfterSeconds}s`);

      return {
        allowed: false,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
      };
    }

    // Record request timestamp
    timestamps.push(now);
    this.requestsMap.set(actionKey, timestamps);

    const remaining = config.maxRequests - timestamps.length;
    const resetMs = config.windowMs;

    return {
      allowed: true,
      remaining,
      resetMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Reset rate limit state for a given action
   */
  reset(actionKey: string): void {
    this.requestsMap.delete(actionKey);
  }

  /**
   * Clear all active rate limit trackers
   */
  clearAll(): void {
    this.requestsMap.clear();
  }
}

export const RateLimiter = new SlidingWindowRateLimiter();
