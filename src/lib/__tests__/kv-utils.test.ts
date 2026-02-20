// Unit tests for shared KV utilities

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('isKvConfigured', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when both KV env vars are set', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://test.kv.vercel-storage.com');
    vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
    const { isKvConfigured } = await import('@/lib/kv-utils');
    expect(isKvConfigured()).toBe(true);
  });

  it('returns false when URL is missing', async () => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
    const { isKvConfigured } = await import('@/lib/kv-utils');
    expect(isKvConfigured()).toBe(false);
  });

  it('returns false when token is missing', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://test.kv.vercel-storage.com');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    const { isKvConfigured } = await import('@/lib/kv-utils');
    expect(isKvConfigured()).toBe(false);
  });
});

describe('safeCompare', () => {
  it('returns true for equal strings', async () => {
    const { safeCompare } = await import('@/lib/kv-utils');
    expect(safeCompare('secret123', 'secret123')).toBe(true);
  });

  it('returns false for unequal strings of same length', async () => {
    const { safeCompare } = await import('@/lib/kv-utils');
    expect(safeCompare('secret123', 'secret456')).toBe(false);
  });

  it('returns false for different-length strings', async () => {
    const { safeCompare } = await import('@/lib/kv-utils');
    expect(safeCompare('short', 'muchlongerstring')).toBe(false);
  });

  it('returns true for empty strings', async () => {
    const { safeCompare } = await import('@/lib/kv-utils');
    expect(safeCompare('', '')).toBe(true);
  });
});
