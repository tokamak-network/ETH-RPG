// IP-based sliding-window rate limiter — KV primary, in-memory fallback
import { kvIncr } from '@/lib/kv-cache';

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const STALE_ENTRY_THRESHOLD = RATE_LIMIT_WINDOW * 2;

// Write endpoints (generate, battle): strict limit
const WRITE_LIMIT = 5;
// Read endpoints (leaderboard, season): relaxed limit
const READ_LIMIT = 30;

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

const limiter = new Map<string, RateLimitEntry>();

function cleanStaleEntries(): void {
  const now = Date.now();

  for (const [ip, entry] of limiter) {
    if (now - entry.resetAt > STALE_ENTRY_THRESHOLD) {
      limiter.delete(ip);
    }
  }
}

function checkMemoryRateLimit(key: string, max: number): RateLimitResult {
  cleanStaleEntries();

  const now = Date.now();
  const existing = limiter.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    const entry: RateLimitEntry = { count: 1, resetAt };
    limiter.set(key, entry);

    return {
      allowed: true,
      remaining: max - 1,
      resetAt,
    };
  }

  const newCount = existing.count + 1;

  if (newCount > max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  const updatedEntry: RateLimitEntry = {
    count: newCount,
    resetAt: existing.resetAt,
  };
  limiter.set(key, updatedEntry);

  return {
    allowed: true,
    remaining: max - newCount,
    resetAt: existing.resetAt,
  };
}

/** Default (write) rate limit: 5 req/min */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const kvKey = `ratelimit:${ip}`;
  const kvCount = await kvIncr(kvKey, RATE_LIMIT_WINDOW_SECONDS);

  if (kvCount !== null) {
    const now = Date.now();
    const allowed = kvCount <= WRITE_LIMIT;
    return {
      allowed,
      remaining: Math.max(0, WRITE_LIMIT - kvCount),
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  return checkMemoryRateLimit(kvKey, WRITE_LIMIT);
}

/** Read-only rate limit: 30 req/min (leaderboard, season, etc.) */
export async function checkReadRateLimit(ip: string): Promise<RateLimitResult> {
  const kvKey = `ratelimit:read:${ip}`;
  const kvCount = await kvIncr(kvKey, RATE_LIMIT_WINDOW_SECONDS);

  if (kvCount !== null) {
    const now = Date.now();
    const allowed = kvCount <= READ_LIMIT;
    return {
      allowed,
      remaining: Math.max(0, READ_LIMIT - kvCount),
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  return checkMemoryRateLimit(kvKey, READ_LIMIT);
}
