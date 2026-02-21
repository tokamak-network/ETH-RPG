import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('utm', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------- captureUtm ----------
  describe('captureUtm', () => {
    it('does nothing in SSR (no window)', async () => {
      // @ts-expect-error — simulating SSR
      delete globalThis.window;
      const mod = await import('@/lib/utm');
      expect(() => mod.captureUtm()).not.toThrow();
    });

    it('stores UTM params from URL into sessionStorage', async () => {
      const store: Record<string, string> = {};
      vi.stubGlobal('window', {
        location: { href: 'https://ethrpg.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch' },
      });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
      });

      const mod = await import('@/lib/utm');
      mod.captureUtm();

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'eth_rpg_utm',
        expect.stringContaining('twitter'),
      );
    });

    it('does not store when no UTM params in URL', async () => {
      vi.stubGlobal('window', {
        location: { href: 'https://ethrpg.com/' },
      });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
      });

      const mod = await import('@/lib/utm');
      mod.captureUtm();

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('silently handles sessionStorage unavailable', async () => {
      vi.stubGlobal('window', {
        location: { href: 'https://ethrpg.com/?utm_source=test' },
      });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => { throw new Error('Storage disabled'); }),
      });

      const mod = await import('@/lib/utm');
      expect(() => mod.captureUtm()).not.toThrow();
    });
  });

  // ---------- getUtmParams ----------
  describe('getUtmParams', () => {
    it('returns empty object in SSR', async () => {
      // @ts-expect-error — simulating SSR
      delete globalThis.window;
      const mod = await import('@/lib/utm');
      expect(mod.getUtmParams()).toEqual({});
    });

    it('returns stored UTM params from sessionStorage', async () => {
      const stored = JSON.stringify({ utm_source: 'twitter', utm_campaign: 'launch' });
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(() => stored),
      });

      const mod = await import('@/lib/utm');
      const result = mod.getUtmParams();

      expect(result).toEqual({ utm_source: 'twitter', utm_campaign: 'launch' });
    });

    it('returns empty object when no stored params', async () => {
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(() => null),
      });

      const mod = await import('@/lib/utm');
      expect(mod.getUtmParams()).toEqual({});
    });

    it('returns empty object on sessionStorage error', async () => {
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(() => { throw new Error('Storage disabled'); }),
      });

      const mod = await import('@/lib/utm');
      expect(mod.getUtmParams()).toEqual({});
    });
  });

  // ---------- appendUtmToUrl ----------
  describe('appendUtmToUrl', () => {
    it('appends default share UTM params to a URL', async () => {
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => null) });

      const mod = await import('@/lib/utm');
      const result = mod.appendUtmToUrl('https://ethrpg.com/result/0xabc');

      expect(result).toContain('utm_source=share');
      expect(result).toContain('utm_medium=card');
      expect(result).toContain('utm_campaign=viral_v1');
    });

    it('merges stored UTM params over defaults', async () => {
      const stored = JSON.stringify({ utm_source: 'twitter', utm_medium: 'social' });
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => stored) });

      const mod = await import('@/lib/utm');
      const result = mod.appendUtmToUrl('https://ethrpg.com/result/0xabc');

      expect(result).toContain('utm_source=twitter');
      expect(result).toContain('utm_medium=social');
    });

    it('applies explicit overrides over stored params', async () => {
      const stored = JSON.stringify({ utm_source: 'twitter' });
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => stored) });

      const mod = await import('@/lib/utm');
      const result = mod.appendUtmToUrl('https://ethrpg.com/result/0xabc', {
        utm_source: 'farcaster',
      });

      expect(result).toContain('utm_source=farcaster');
    });

    it('returns original URL on parse failure', async () => {
      vi.stubGlobal('window', { location: { href: 'https://ethrpg.com/' } });
      vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => null) });

      const mod = await import('@/lib/utm');
      const result = mod.appendUtmToUrl('not-a-valid-url');

      expect(result).toBe('not-a-valid-url');
    });
  });
});
