// In-memory cache with 24-hour TTL for battle results
import type { BattleResponse } from '@/lib/types';

const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 5_000;
const EVICTION_BATCH_SIZE = 500;
const CACHE_SCHEMA_VERSION = 1;

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

export function getCachedBattle(
  addr1: string,
  addr2: string,
  nonce: string,
): BattleResponse | null {
  const key = buildKey(addr1, addr2, nonce);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (isExpired(entry) || entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedBattle(
  addr1: string,
  addr2: string,
  nonce: string,
  data: BattleResponse,
): void {
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
}
