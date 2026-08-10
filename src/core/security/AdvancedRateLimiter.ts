// src/core/security/AdvancedRateLimiter.ts
import { AppError } from '@/core/error';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('RateLimiter');

interface LimiterRules {
  points: number;       // Max attempts
  durationMs: number;   // In milliseconds
}

interface UserRate {
  points: number;
  resetTime: number;
}

export class AdvancedRateLimiter {
  private registries = new Map<string, Map<string, UserRate>>();

  constructor(private rules: Record<string, LimiterRules> = {
    auth: { points: 5, durationMs: 60 * 1000 },       // 5 requests per 1 minute
    pdrMutation: { points: 30, durationMs: 60 * 1000 }, // 30 requests per minute
    apiGeneral: { points: 100, durationMs: 60 * 1000 }  // 100 requests per minute
  }) {}

  /**
   * Consumes a rate-limiting point. Throws ConflictError/TooManyRequests if limit reached.
   */
  async consume(key: string, registryName: 'auth' | 'pdrMutation' | 'apiGeneral'): Promise<void> {
    const rules = this.rules[registryName];
    if (!rules) return;

    if (!this.registries.has(registryName)) {
      this.registries.set(registryName, new Map<string, UserRate>());
    }

    const registry = this.registries.get(registryName)!;
    const now = Date.now();
    const rate = registry.get(key);

    if (!rate || rate.resetTime < now) {
      registry.set(key, {
        points: 1,
        resetTime: now + rules.durationMs,
      });
      return;
    }

    if (rate.points >= rules.points) {
      const waitSec = Math.ceil((rate.resetTime - now) / 1000);
      logger.warn(`Rate limit triggered: ${registryName} for key ${key}`, { waitSec });
      throw new AppError(
        'TOO_MANY_REQUESTS',
        `تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار ${waitSec} ثانية قبل المحاولة مجدداً.`,
        429,
        { retryAfterSec: waitSec }
      );
    }

    rate.points += 1;
    registry.set(key, rate);
  }

  /**
   * Resets rate limiter for a specific key
   */
  reset(key: string, registryName: 'auth' | 'pdrMutation' | 'apiGeneral'): void {
    const registry = this.registries.get(registryName);
    if (registry) {
      registry.delete(key);
      logger.debug(`Reset rate limit for ${key} in registry ${registryName}`);
    }
  }
}

export const rateLimiter = new AdvancedRateLimiter();
