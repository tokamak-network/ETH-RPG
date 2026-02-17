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
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function callHealth() {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    return response.json();
  }

  it('returns status ok', async () => {
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const data = await callHealth();

    expect(data.status).toBe('ok');
  });

  it('returns cache stats', async () => {
    mockGetCacheStats.mockReturnValue({ size: 42, hitRate: 0.75 });

    const data = await callHealth();

    expect(data.cache.size).toBe(42);
    expect(data.cache.hitRate).toBe(75);
  });

  it('returns a valid ISO timestamp', async () => {
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const data = await callHealth();

    expect(data.timestamp).toBeDefined();
    expect(() => new Date(data.timestamp)).not.toThrow();
  });

  it('reports env variable presence', async () => {
    process.env.ALCHEMY_API_KEY = 'test-key';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    mockGetCacheStats.mockReturnValue({ size: 0, hitRate: 0 });

    const data = await callHealth();

    expect(data.env.alchemy).toBe(true);
    expect(data.env.anthropic).toBe(true);
    expect(data.env.siteUrl).toBe('https://example.com');
  });
});
