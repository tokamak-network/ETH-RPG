import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeBattleResult } from './fixtures';
import type { BattleResponse } from '@/lib/types';

function makeBattleResponse(overrides?: Partial<BattleResponse>): BattleResponse {
  return {
    result: makeBattleResult(),
    battleImageUrl: 'http://localhost:3000/api/og/battle/0xabc/0xdef',
    ogImageUrl: 'http://localhost:3000/api/og/battle/0xabc/0xdef',
    cached: false,
    ...overrides,
  };
}

describe('battle-cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function freshCache() {
    const mod = await import('@/lib/battle-cache');
    return mod;
  }

  it('returns null for a non-existent key', async () => {
    const { getCachedBattle } = await freshCache();

    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');

    expect(result).toBeNull();
  });

  it('returns cached data after setCachedBattle', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const data = makeBattleResponse();

    setCachedBattle('0xabc', '0xdef', 'nonce1', data);
    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');

    expect(result).toEqual(data);
  });

  it('normalizes addresses to lowercase for cache key', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const data = makeBattleResponse();

    setCachedBattle('0xABC', '0xDEF', 'nonce1', data);
    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');

    expect(result).toEqual(data);
  });

  it('returns different results for different nonces', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const data1 = makeBattleResponse({ cached: false });
    const data2 = makeBattleResponse({ cached: true });

    setCachedBattle('0xabc', '0xdef', 'nonce1', data1);
    setCachedBattle('0xabc', '0xdef', 'nonce2', data2);

    expect(getCachedBattle('0xabc', '0xdef', 'nonce1')).toEqual(data1);
    expect(getCachedBattle('0xabc', '0xdef', 'nonce2')).toEqual(data2);
  });

  it('returns null after TTL expires (24h + 1ms)', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const data = makeBattleResponse();

    setCachedBattle('0xabc', '0xdef', 'nonce1', data);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');

    expect(result).toBeNull();
  });

  it('returns data when TTL has not yet expired (24h - 1ms)', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const data = makeBattleResponse();

    setCachedBattle('0xabc', '0xdef', 'nonce1', data);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1);
    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');

    expect(result).toEqual(data);
  });

  it('triggers eviction when cache reaches MAX_CACHE_SIZE (5000)', async () => {
    const { setCachedBattle, getCachedBattle } = await freshCache();

    for (let i = 0; i < 5_000; i++) {
      const addr = `0x${i.toString(16).padStart(40, '0')}`;
      setCachedBattle(addr, '0xdef', `nonce-${i}`, makeBattleResponse());
      vi.advanceTimersByTime(1);
    }

    // One more entry triggers eviction of 500 oldest
    setCachedBattle('0xtrigger', '0xdef', 'nonce-trigger', makeBattleResponse());

    // The first entry should have been evicted
    const oldest = getCachedBattle('0x' + '0'.repeat(40), '0xdef', 'nonce-0');
    expect(oldest).toBeNull();

    // Entry at index 500 (first survivor) should still exist
    const survivor = `0x${(500).toString(16).padStart(40, '0')}`;
    const survivorResult = getCachedBattle(survivor, '0xdef', 'nonce-500');
    expect(survivorResult).not.toBeNull();
  });

  it('overwrites existing entry when same key is set again', async () => {
    const { getCachedBattle, setCachedBattle } = await freshCache();
    const v1 = makeBattleResponse({ cached: false });
    const v2 = makeBattleResponse({ cached: true });

    setCachedBattle('0xabc', '0xdef', 'nonce1', v1);
    setCachedBattle('0xabc', '0xdef', 'nonce1', v2);

    const result = getCachedBattle('0xabc', '0xdef', 'nonce1');
    expect(result).toEqual(v2);
  });
});
