import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/cache', () => ({
  getCacheStats: vi.fn(),
}));

import { getCacheStats } from '@/lib/cache';
const mockGetCacheStats = vi.mocked(getCacheStats);

describe('GET /api/health', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function callHealth() {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    return { data: await response.json(), status: response.status };
  }

  it('returns status ok when all required env vars are set', async () => {
    process.env.ALCHEMY_API_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const { data, status } = await callHealth();

    expect(data.status).toBe('ok');
    expect(status).toBe(200);
  });

  it('returns degraded when required env vars are missing', async () => {
    delete process.env.ALCHEMY_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const { data, status } = await callHealth();

    expect(data.status).toBe('degraded');
    expect(status).toBe(503);
  });

  it('returns cache stats', async () => {
    process.env.ALCHEMY_API_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    mockGetCacheStats.mockReturnValue({ size: 42, hitRate: 0.75 });

    const { data } = await callHealth();

    expect(data.cache.size).toBe(42);
    expect(data.cache.hitRate).toBe(75);
  });

  it('returns a valid ISO timestamp', async () => {
    process.env.ALCHEMY_API_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const { data } = await callHealth();

    expect(data.timestamp).toBeDefined();
    expect(() => new Date(data.timestamp)).not.toThrow();
  });
});
