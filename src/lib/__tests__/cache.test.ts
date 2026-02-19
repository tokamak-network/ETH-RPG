import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeGenerateResponse } from './fixtures';

describe('cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function freshCache() {
    const mod = await import('@/lib/cache');
    return mod;
  }

  // 1. getCached miss — returns null for non-existent key
  it('returns null for a non-existent key', async () => {
    const { getCached } = await freshCache();

    const result = getCached('0xabc');

    expect(result).toBeNull();
  });

  // 2. setCache + getCached hit — round-trip set then get
  it('returns cached data after setCache', async () => {
    const { getCached, setCache } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);
    const result = getCached('0xabc');

    expect(result).toEqual(data);
  });

  // 3. Address normalization — set with uppercase, get with lowercase works
  it('normalizes addresses to lowercase for cache key', async () => {
    const { getCached, setCache } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xABC123DEF', data);
    const result = getCached('0xabc123def');

    expect(result).toEqual(data);
  });

  // 4. TTL expiration — advance by 24h+1ms, getCached returns null
  it('returns null after TTL expires (24h + 1ms)', async () => {
    const { getCached, setCache } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    const result = getCached('0xabc');

    expect(result).toBeNull();
  });

  // 5. TTL not yet expired — advance by 24h-1ms, getCached returns data
  it('returns data when TTL has not yet expired (24h - 1ms)', async () => {
    const { getCached, setCache } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1);
    const result = getCached('0xabc');

    expect(result).toEqual(data);
  });

  // 6. Expired entry is deleted — after expiration, cache.size decreases
  it('deletes expired entry from cache on access', async () => {
    const { getCached, setCache, getCacheStats } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);
    expect(getCacheStats().size).toBe(1);

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    getCached('0xabc');

    expect(getCacheStats().size).toBe(0);
  });

  // 7. getCacheStats initial — size=0, hitRate=0
  it('returns size=0 and hitRate=0 initially', async () => {
    const { getCacheStats } = await freshCache();

    const stats = getCacheStats();

    expect(stats.size).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  // 8. getCacheStats after hits/misses — hitRate = hits/(hits+misses)
  it('computes correct hitRate after hits and misses', async () => {
    const { getCached, setCache, getCacheStats } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);

    getCached('0xabc'); // hit
    getCached('0xabc'); // hit
    getCached('0xabc'); // hit
    getCached('0xnonexistent'); // miss

    const stats = getCacheStats();

    expect(stats.hitRate).toBeCloseTo(3 / 4);
  });

  // 9. Eviction when MAX_CACHE_SIZE reached — set 10000 entries, set one more triggers eviction
  it('triggers eviction when cache reaches MAX_CACHE_SIZE', async () => {
    const { setCache, getCacheStats } = await freshCache();

    for (let i = 0; i < 10_000; i++) {
      const addr = `0x${i.toString(16).padStart(40, '0')}`;
      setCache(addr, makeGenerateResponse({ address: addr }));
      vi.advanceTimersByTime(1); // ensure distinct timestamps for ordering
    }

    expect(getCacheStats().size).toBe(10_000);

    // One more entry triggers eviction
    setCache('0xtrigger', makeGenerateResponse({ address: '0xtrigger' }));

    expect(getCacheStats().size).toBe(9_001);
  });

  // 10. Eviction removes oldest 1000 — after eviction, oldest entries are gone
  it('evicts the oldest 1000 entries during eviction', async () => {
    const { getCached, setCache } = await freshCache();

    for (let i = 0; i < 10_000; i++) {
      const addr = `0x${i.toString(16).padStart(40, '0')}`;
      setCache(addr, makeGenerateResponse({ address: addr }));
      vi.advanceTimersByTime(1);
    }

    // Trigger eviction
    setCache('0xtrigger', makeGenerateResponse({ address: '0xtrigger' }));

    // The first entry (i=0) should have been evicted
    const oldest = getCached('0x' + '0'.repeat(40));
    expect(oldest).toBeNull();

    // Entry i=999 (last of evicted batch) should also be gone
    const lastEvicted = getCached(`0x${(999).toString(16).padStart(40, '0')}`);
    expect(lastEvicted).toBeNull();

    // Entry i=1000 (first survivor) should still exist
    const firstSurvivor = getCached(`0x${(1000).toString(16).padStart(40, '0')}`);
    expect(firstSurvivor).not.toBeNull();
  });

  // 11. Multiple gets track hit/miss correctly
  it('tracks multiple hits and misses accurately', async () => {
    const { getCached, setCache, getCacheStats } = await freshCache();

    setCache('0xaaa', makeGenerateResponse({ address: '0xaaa' }));
    setCache('0xbbb', makeGenerateResponse({ address: '0xbbb' }));

    getCached('0xaaa');        // hit
    getCached('0xbbb');        // hit
    getCached('0xnonexist1');  // miss
    getCached('0xnonexist2');  // miss
    getCached('0xnonexist3');  // miss

    const stats = getCacheStats();

    expect(stats.hitRate).toBeCloseTo(2 / 5);
    expect(stats.size).toBe(2);
  });

  // 12. Different addresses are independent
  it('stores different addresses independently', async () => {
    const { getCached, setCache } = await freshCache();
    const dataA = makeGenerateResponse({ address: '0xaaa', lore: 'Lore A' });
    const dataB = makeGenerateResponse({ address: '0xbbb', lore: 'Lore B' });

    setCache('0xaaa', dataA);
    setCache('0xbbb', dataB);

    expect(getCached('0xaaa')).toEqual(dataA);
    expect(getCached('0xbbb')).toEqual(dataB);
  });

  // 13. Overwriting same address updates data
  it('overwrites existing entry when same address is set again', async () => {
    const { getCached, setCache } = await freshCache();
    const dataV1 = makeGenerateResponse({ lore: 'Version 1' });
    const dataV2 = makeGenerateResponse({ lore: 'Version 2' });

    setCache('0xabc', dataV1);
    setCache('0xabc', dataV2);

    const result = getCached('0xabc');

    expect(result).toEqual(dataV2);
    expect(result?.lore).toBe('Version 2');
  });

  // 14. Mixed-case address retrieval is symmetric
  it('retrieves the same entry regardless of address casing', async () => {
    const { getCached, setCache } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xAbCdEf', data);

    expect(getCached('0xABCDEF')).toEqual(data);
    expect(getCached('0xabcdef')).toEqual(data);
    expect(getCached('0xAbCdEf')).toEqual(data);
  });

  // 15. Schema version mismatch — stale entries are evicted
  it('rejects cached entries with mismatched schema version', async () => {
    const { getCached, setCache, getCacheStats, _testSetSchemaVersion } = await freshCache();
    const data = makeGenerateResponse();

    setCache('0xabc', data);
    expect(getCacheStats().size).toBe(1);
    expect(getCached('0xabc')).toEqual(data);

    // Simulate a stale entry by setting an old schema version
    _testSetSchemaVersion('0xabc', 1);

    // Stale entry should be rejected and deleted
    const result = getCached('0xabc');
    expect(result).toBeNull();
    expect(getCacheStats().size).toBe(0);
  });
});
