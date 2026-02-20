import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('trackEvent', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('does nothing when not in browser (SSR)', async () => {
    // @ts-expect-error — simulating SSR environment
    delete globalThis.window;

    const mod = await import('@/lib/analytics');
    expect(() => mod.trackEvent('test_event')).not.toThrow();
  });

  it('logs to console.debug in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    vi.stubGlobal('window', {
      location: { href: 'http://localhost:3000/' },
    });
    vi.stubGlobal('document', { referrer: '' });

    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const mod = await import('@/lib/analytics');
    mod.trackEvent('page_view', { source: 'test' });

    expect(debugSpy).toHaveBeenCalledWith('[analytics]', 'page_view', { source: 'test' });
  });

  it('uses sendBeacon in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const sendBeaconMock = vi.fn();
    vi.stubGlobal('window', {
      location: { href: 'https://ethrpg.com/result/0xabc' },
    });
    vi.stubGlobal('document', { referrer: 'https://twitter.com' });
    vi.stubGlobal('navigator', { sendBeacon: sendBeaconMock });
    vi.stubGlobal('Blob', class MockBlob {
      parts: unknown[];
      options: unknown;
      constructor(parts: unknown[], options: unknown) {
        this.parts = parts;
        this.options = options;
      }
    });

    const mod = await import('@/lib/analytics');
    mod.trackEvent('card_generated');

    expect(sendBeaconMock).toHaveBeenCalledWith(
      '/api/events',
      expect.anything(),
    );
  });

  it('silently handles sendBeacon failure', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    vi.stubGlobal('window', {
      location: { href: 'https://ethrpg.com/' },
    });
    vi.stubGlobal('document', { referrer: '' });
    vi.stubGlobal('navigator', {
      sendBeacon: vi.fn().mockImplementation(() => { throw new Error('sendBeacon failed'); }),
    });
    vi.stubGlobal('Blob', class MockBlob {
      constructor() { throw new Error('Blob not supported'); }
    });

    const mod = await import('@/lib/analytics');
    expect(() => mod.trackEvent('error_event')).not.toThrow();
  });
});
