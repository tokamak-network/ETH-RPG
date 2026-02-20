// IP-based sliding-window rate limiter — KV primary, in-memory fallback
import { kvIncr } from '@/lib/kv-cache';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const STALE_ENTRY_THRESHOLD = RATE_LIMIT_WINDOW * 2;

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

function checkMemoryRateLimit(ip: string): RateLimitResult {
  cleanStaleEntries();

  const now = Date.now();
  const existing = limiter.get(ip);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    const entry: RateLimitEntry = { count: 1, resetAt };
    limiter.set(ip, entry);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt,
    };
  }

  const newCount = existing.count + 1;

  if (newCount > RATE_LIMIT_MAX) {
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
  limiter.set(ip, updatedEntry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - newCount,
    resetAt: existing.resetAt,
  };
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // Try KV first (shared across instances)
  const kvCount = await kvIncr(`ratelimit:${ip}`, RATE_LIMIT_WINDOW_SECONDS);

  if (kvCount !== null) {
    const now = Date.now();
    const allowed = kvCount <= RATE_LIMIT_MAX;
    return {
      allowed,
      remaining: Math.max(0, RATE_LIMIT_MAX - kvCount),
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  // Fallback: in-memory rate limiter
  return checkMemoryRateLimit(ip);
}
