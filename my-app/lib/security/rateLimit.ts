/**
 * Centralized In-Memory Sliding-Window Rate Limiter
 * Provides configurable rate limiting across API endpoints with automated stale window pruning.
 */

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private lastCleanup = Date.now();

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  public check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    this.maybeCleanup(now);

    const record = this.limits.get(key);

    if (!record || now > record.resetAt) {
      const resetAt = now + this.windowMs;
      this.limits.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  public reset(key: string): void {
    this.limits.delete(key);
  }

  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < 60000) return;
    this.lastCleanup = now;

    for (const [key, record] of this.limits.entries()) {
      if (now > record.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

// Preset Rate Limiters for various tiers
export const rateLimiters = {
  // AI Copilot & Chat: 60 requests per minute
  ai: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 60 }),

  // Voice queries: 30 requests per minute
  voice: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 30 }),

  // Driver SOS trigger: 10 requests per minute per IP/driver
  sos: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 10 }),

  // High-frequency telemetry updates: 180 requests per minute per vehicle
  telemetry: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 180 }),

  // File ingestion & bulk data uploads: 30 requests per minute
  ingest: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 30 }),

  // General operations endpoints: 120 requests per minute
  general: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 120 }),
};

export function getClientIdentifier(req: Request, fallback = 'anonymous'): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || fallback;
}
