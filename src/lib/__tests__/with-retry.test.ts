import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '@/lib/with-retry';
import { TimeoutError } from '@/lib/with-timeout';

describe('withRetry', () => {
  it('returns result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await withRetry(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and returns on success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('recovered');

    const result = await withRetry(fn, { baseDelayMs: 1 });

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries up to maxRetries times then throws', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1 }))
      .rejects.toThrow('persistent failure');

    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does NOT retry on TimeoutError', async () => {
    const fn = vi.fn().mockRejectedValue(new TimeoutError(5000));

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1 }))
      .rejects.toThrow(TimeoutError);

    expect(fn).toHaveBeenCalledTimes(1); // No retry
  });

  it('respects maxRetries=0 (no retries)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(withRetry(fn, { maxRetries: 0, baseDelayMs: 1 }))
      .rejects.toThrow('fail');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
