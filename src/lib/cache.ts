// In-memory cache with 24-hour TTL for generated character data
import type { GenerateResponse } from '@/lib/types';

const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 10_000;
const EVICTION_BATCH_SIZE = 1_000;

// Bump this version whenever CharacterStats shape changes (e.g. adding DEX).
// Cached entries with a different version are treated as stale.
const CACHE_SCHEMA_VERSION = 2;

interface CacheEntry {
  readonly data: GenerateResponse;
  readonly timestamp: number;
  readonly schemaVersion: number;
}

interface CacheStats {
  readonly size: number;
  readonly hitRate: number;
}

const cache = new Map<string, CacheEntry>();

let hits = 0;
let misses = 0;

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function evictOldestEntries(): void {
  const entries = Array.from(cache.entries())
    .sort(([, a], [, b]) => a.timestamp - b.timestamp);

  const toRemove = entries.slice(0, EVICTION_BATCH_SIZE);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
}

export function getCached(address: string): GenerateResponse | null {
  const key = normalizeAddress(address);
  const entry = cache.get(key);

  if (!entry) {
    misses += 1;
    return null;
  }

  if (isExpired(entry) || entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
    cache.delete(key);
    misses += 1;
    return null;
  }

  hits += 1;
  return entry.data;
}

export function setCache(address: string, data: GenerateResponse): void {
  const key = normalizeAddress(address);

  if (cache.size >= MAX_CACHE_SIZE) {
    evictOldestEntries();
  }

  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    schemaVersion: CACHE_SCHEMA_VERSION,
  };

  cache.set(key, entry);
}

export function getCacheStats(): CacheStats {
  const total = hits + misses;

  return {
    size: cache.size,
    hitRate: total === 0 ? 0 : hits / total,
  };
}

/** @internal Exposed for testing only — do not use in production code. */
export function _testSetSchemaVersion(address: string, version: number): void {
  const key = normalizeAddress(address);
  const entry = cache.get(key);
  if (entry) {
    cache.set(key, { ...entry, schemaVersion: version });
  }
}
