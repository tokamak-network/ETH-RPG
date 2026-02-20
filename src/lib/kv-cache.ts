// Generic Vercel KV cache layer — guarded by isKvConfigured(), silent-fail on errors

import { kv } from '@vercel/kv';
import { isKvConfigured } from '@/lib/kv-utils';

/** Read a value from KV. Returns null if KV is unavailable or key missing. */
export async function kvCacheGet<T>(key: string): Promise<T | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

/** Write a value to KV with TTL in seconds. Silent no-op on failure. */
export async function kvCacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(key, data, { ex: ttlSeconds });
  } catch {
    // Silently fail
  }
}

/** Atomic increment with TTL. Returns new count, or null if KV unavailable. */
export async function kvIncr(key: string, ttlSeconds: number): Promise<number | null> {
  if (!isKvConfigured()) return null;
  try {
    const count = await kv.incr(key);
    await kv.expire(key, ttlSeconds);
    return count;
  } catch {
    return null;
  }
}
