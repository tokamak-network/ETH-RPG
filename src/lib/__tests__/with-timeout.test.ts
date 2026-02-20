import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '@/lib/with-timeout';

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000);

    expect(result).toBe('ok');
  });

  it('rejects with TimeoutError when promise takes too long', async () => {
    vi.useFakeTimers();

    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 5000);
    });

    const promise = withTimeout(slow, 100);

    vi.advanceTimersByTime(101);

    await expect(promise).rejects.toThrow(TimeoutError);
    await expect(promise).rejects.toThrow('Operation timed out after 100ms');

    vi.useRealTimers();
  });

  it('propagates the original error if promise rejects before timeout', async () => {
    const failing = Promise.reject(new Error('original error'));

    await expect(withTimeout(failing, 5000)).rejects.toThrow('original error');
  });

  it('TimeoutError has correct name', () => {
    const err = new TimeoutError(5000);

    expect(err.name).toBe('TimeoutError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(TimeoutError);
  });
});
