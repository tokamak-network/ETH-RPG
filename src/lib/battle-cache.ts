// Two-layer cache (L1 in-memory + L2 Vercel KV) with 24-hour TTL for battle results
import type { BattleResponse } from '@/lib/types';
import { kvCacheGet, kvCacheSet } from '@/lib/kv-cache';

const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 86400;
const MAX_CACHE_SIZE = 5_000;
const EVICTION_BATCH_SIZE = 500;
const CACHE_SCHEMA_VERSION = 1;

const KV_KEY_PREFIX = 'battle:v1:';

interface BattleCacheEntry {
  readonly data: BattleResponse;
  readonly timestamp: number;
  readonly schemaVersion: number;
}

const cache = new Map<string, BattleCacheEntry>();

function buildKey(addr1: string, addr2: string, nonce: string): string {
  return `${addr1.toLowerCase()}:${addr2.toLowerCase()}:${nonce}`;
}

function isExpired(entry: BattleCacheEntry): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL;
}

function evictOldestEntries(): void {
  const entries = Array.from(cache.entries())
    .sort(([, a], [, b]) => a.timestamp - b.timestamp);

  const toRemove = entries.slice(0, EVICTION_BATCH_SIZE);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
}

export async function getCachedBattle(
  addr1: string,
  addr2: string,
  nonce: string,
): Promise<BattleResponse | null> {
  const key = buildKey(addr1, addr2, nonce);

  // L1: in-memory check
  const entry = cache.get(key);

  if (entry) {
    if (isExpired(entry) || entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  // L2: KV check
  const kvData = await kvCacheGet<BattleResponse>(KV_KEY_PREFIX + key);
  if (kvData) {
    // Promote to L1
    const promoted: BattleCacheEntry = {
      data: kvData,
      timestamp: Date.now(),
      schemaVersion: CACHE_SCHEMA_VERSION,
    };
    if (cache.size >= MAX_CACHE_SIZE) {
      evictOldestEntries();
    }
    cache.set(key, promoted);
    return kvData;
  }

  return null;
}

export async function setCachedBattle(
  addr1: string,
  addr2: string,
  nonce: string,
  data: BattleResponse,
): Promise<void> {
  const key = buildKey(addr1, addr2, nonce);

  if (cache.size >= MAX_CACHE_SIZE) {
    evictOldestEntries();
  }

  const entry: BattleCacheEntry = {
    data,
    timestamp: Date.now(),
    schemaVersion: CACHE_SCHEMA_VERSION,
  };

  cache.set(key, entry);

  // Fire-and-forget KV write
  kvCacheSet(KV_KEY_PREFIX + key, data, CACHE_TTL_SECONDS).catch(() => {});
}
