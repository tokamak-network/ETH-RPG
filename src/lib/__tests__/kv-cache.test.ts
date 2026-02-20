import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockKvGet = vi.fn();
const mockKvSet = vi.fn();
const mockKvIncr = vi.fn();
const mockKvExpire = vi.fn();

vi.mock('@vercel/kv', () => ({
  kv: {
    get: (...args: unknown[]) => mockKvGet(...args),
    set: (...args: unknown[]) => mockKvSet(...args),
    incr: (...args: unknown[]) => mockKvIncr(...args),
    expire: (...args: unknown[]) => mockKvExpire(...args),
  },
}));

const mockIsKvConfigured = vi.fn();
vi.mock('@/lib/kv-utils', () => ({
  isKvConfigured: () => mockIsKvConfigured(),
}));

import { kvCacheGet, kvCacheSet, kvIncr } from '@/lib/kv-cache';

describe('kv-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- kvCacheGet ---

  it('returns null when KV is not configured', async () => {
    mockIsKvConfigured.mockReturnValue(false);

    const result = await kvCacheGet('some-key');

    expect(result).toBeNull();
    expect(mockKvGet).not.toHaveBeenCalled();
  });

  it('returns value from KV when configured and key exists', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvGet.mockResolvedValue({ address: '0xabc' });

    const result = await kvCacheGet<{ address: string }>('some-key');

    expect(result).toEqual({ address: '0xabc' });
    expect(mockKvGet).toHaveBeenCalledWith('some-key');
  });

  it('returns null when KV throws', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvGet.mockRejectedValue(new Error('KV down'));

    const result = await kvCacheGet('some-key');

    expect(result).toBeNull();
  });

  it('returns null when key does not exist in KV', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvGet.mockResolvedValue(null);

    const result = await kvCacheGet('missing-key');

    expect(result).toBeNull();
  });

  // --- kvCacheSet ---

  it('does nothing when KV is not configured', async () => {
    mockIsKvConfigured.mockReturnValue(false);

    await kvCacheSet('key', { data: 1 }, 3600);

    expect(mockKvSet).not.toHaveBeenCalled();
  });

  it('writes to KV with TTL when configured', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvSet.mockResolvedValue('OK');

    await kvCacheSet('key', { data: 1 }, 3600);

    expect(mockKvSet).toHaveBeenCalledWith('key', { data: 1 }, { ex: 3600 });
  });

  it('silently fails when KV set throws', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvSet.mockRejectedValue(new Error('write failed'));

    // Should not throw
    await kvCacheSet('key', { data: 1 }, 3600);
  });

  // --- kvIncr ---

  it('returns null when KV is not configured', async () => {
    mockIsKvConfigured.mockReturnValue(false);

    const result = await kvIncr('key', 60);

    expect(result).toBeNull();
    expect(mockKvIncr).not.toHaveBeenCalled();
  });

  it('returns incremented count when configured', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvIncr.mockResolvedValue(3);
    mockKvExpire.mockResolvedValue(1);

    const result = await kvIncr('key', 60);

    expect(result).toBe(3);
    expect(mockKvIncr).toHaveBeenCalledWith('key');
    expect(mockKvExpire).toHaveBeenCalledWith('key', 60);
  });

  it('returns null when KV incr throws', async () => {
    mockIsKvConfigured.mockReturnValue(true);
    mockKvIncr.mockRejectedValue(new Error('incr failed'));

    const result = await kvIncr('key', 60);

    expect(result).toBeNull();
  });
});
