import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000;
const STALE_ENTRY_THRESHOLD = RATE_LIMIT_WINDOW * 2;
const BASE_TIME = 1_000_000;

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function freshRateLimit() {
    const mod = await import('@/lib/rate-limit');
    return mod;
  }

  // Test 1: First request allowed
  it('first request is allowed with remaining=4', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    const result = checkRateLimit('1.2.3.4');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBe(BASE_TIME + RATE_LIMIT_WINDOW);
  });

  // Test 2: 5 requests all allowed with decreasing remaining
  it('allows 5 requests with decreasing remaining counts', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    const expectedRemaining = [4, 3, 2, 1, 0];

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const result = checkRateLimit('1.2.3.4');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(expectedRemaining[i]);
    }
  });

  // Test 3: 6th request is blocked
  it('blocks the 6th request with remaining=0', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('1.2.3.4');
    }

    const result = checkRateLimit('1.2.3.4');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  // Test 4: 7th+ requests also blocked
  it('continues blocking after the 6th request', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('1.2.3.4');
    }

    const sixth = checkRateLimit('1.2.3.4');
    const seventh = checkRateLimit('1.2.3.4');
    const eighth = checkRateLimit('1.2.3.4');

    expect(sixth.allowed).toBe(false);
    expect(seventh.allowed).toBe(false);
    expect(eighth.allowed).toBe(false);
    expect(seventh.remaining).toBe(0);
    expect(eighth.remaining).toBe(0);
  });

  // Test 5: Window reset - after 60s, fresh window starts
  it('resets the window after RATE_LIMIT_WINDOW has elapsed', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('1.2.3.4');
    }
    const blocked = checkRateLimit('1.2.3.4');
    expect(blocked.allowed).toBe(false);

    vi.setSystemTime(BASE_TIME + RATE_LIMIT_WINDOW);

    const result = checkRateLimit('1.2.3.4');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBe(BASE_TIME + RATE_LIMIT_WINDOW + RATE_LIMIT_WINDOW);
  });

  // Test 6: resetAt consistent within window
  it('returns consistent resetAt for all calls within the same window', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    const expectedResetAt = BASE_TIME + RATE_LIMIT_WINDOW;

    const first = checkRateLimit('1.2.3.4');
    expect(first.resetAt).toBe(expectedResetAt);

    vi.setSystemTime(BASE_TIME + 10_000);
    const second = checkRateLimit('1.2.3.4');
    expect(second.resetAt).toBe(expectedResetAt);

    vi.setSystemTime(BASE_TIME + 30_000);
    const third = checkRateLimit('1.2.3.4');
    expect(third.resetAt).toBe(expectedResetAt);

    vi.setSystemTime(BASE_TIME + 50_000);
    const fourth = checkRateLimit('1.2.3.4');
    expect(fourth.resetAt).toBe(expectedResetAt);

    vi.setSystemTime(BASE_TIME + 55_000);
    const fifth = checkRateLimit('1.2.3.4');
    expect(fifth.resetAt).toBe(expectedResetAt);

    vi.setSystemTime(BASE_TIME + 59_000);
    const sixth = checkRateLimit('1.2.3.4');
    expect(sixth.resetAt).toBe(expectedResetAt);
  });

  // Test 7: Different IPs are independent
  it('tracks rate limits independently per IP', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('10.0.0.1');
    }
    const blockedIp1 = checkRateLimit('10.0.0.1');
    expect(blockedIp1.allowed).toBe(false);

    const freshIp2 = checkRateLimit('10.0.0.2');
    expect(freshIp2.allowed).toBe(true);
    expect(freshIp2.remaining).toBe(4);
  });

  // Test 8: Stale entry cleanup
  it('cleans up stale entries after STALE_ENTRY_THRESHOLD', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    checkRateLimit('stale-ip');
    const firstResetAt = BASE_TIME + RATE_LIMIT_WINDOW;

    // Advance past stale threshold: resetAt + STALE_ENTRY_THRESHOLD + 1
    vi.setSystemTime(firstResetAt + STALE_ENTRY_THRESHOLD + 1);

    // This call triggers cleanStaleEntries, which removes the old entry.
    // Then the IP gets a brand-new window.
    const result = checkRateLimit('stale-ip');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    // New resetAt should be based on the current time
    expect(result.resetAt).toBe(firstResetAt + STALE_ENTRY_THRESHOLD + 1 + RATE_LIMIT_WINDOW);
  });

  // Test 9: Window expired but not stale - new window starts
  it('starts a new window when exactly at resetAt', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    checkRateLimit('1.2.3.4');
    checkRateLimit('1.2.3.4');
    checkRateLimit('1.2.3.4');

    // Move to exactly resetAt (now >= existing.resetAt triggers new window)
    vi.setSystemTime(BASE_TIME + RATE_LIMIT_WINDOW);

    const result = checkRateLimit('1.2.3.4');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBe(BASE_TIME + RATE_LIMIT_WINDOW + RATE_LIMIT_WINDOW);
  });

  // Test 10: Remaining count accuracy after partial usage
  it('returns remaining=2 after 3 requests', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    checkRateLimit('1.2.3.4');
    checkRateLimit('1.2.3.4');
    const third = checkRateLimit('1.2.3.4');

    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(2);
  });

  // Test 11: Blocked requests don't increment internal count
  it('does not increment count for blocked requests', async () => {
    vi.setSystemTime(BASE_TIME);
    const { checkRateLimit } = await freshRateLimit();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('1.2.3.4');
    }

    const sixth = checkRateLimit('1.2.3.4');
    const seventh = checkRateLimit('1.2.3.4');

    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
    expect(seventh.allowed).toBe(false);
    expect(seventh.remaining).toBe(0);

    // After window resets, the IP should get a fresh window
    // (proving the count was not incremented past the max)
    vi.setSystemTime(BASE_TIME + RATE_LIMIT_WINDOW);

    const afterReset = checkRateLimit('1.2.3.4');
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(4);
  });

  // Test 12: resetAt is now + 60000 on first request
  it('sets resetAt to exactly now + 60000 on first request', async () => {
    const preciseTime = 1_700_000_000_000;
    vi.setSystemTime(preciseTime);
    const { checkRateLimit } = await freshRateLimit();

    const result = checkRateLimit('brand-new-ip');

    expect(result.resetAt).toBe(preciseTime + 60_000);
  });
});
