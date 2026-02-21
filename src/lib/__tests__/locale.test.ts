import { describe, it, expect, vi, afterEach } from 'vitest';

describe('locale', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns true for ko locale', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { language: 'ko' });
    const mod = await import('@/lib/locale');
    expect(mod.isKoreanLocale()).toBe(true);
  });

  it('returns true for ko-KR locale', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { language: 'ko-KR' });
    const mod = await import('@/lib/locale');
    expect(mod.isKoreanLocale()).toBe(true);
  });

  it('returns false for en-US locale', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { language: 'en-US' });
    const mod = await import('@/lib/locale');
    expect(mod.isKoreanLocale()).toBe(false);
  });

  it('returns false for ja locale', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { language: 'ja' });
    const mod = await import('@/lib/locale');
    expect(mod.isKoreanLocale()).toBe(false);
  });

  it('returns false in SSR (no window)', async () => {
    // @ts-expect-error — simulating SSR
    delete globalThis.window;
    const mod = await import('@/lib/locale');
    expect(mod.isKoreanLocale()).toBe(false);
  });
});
