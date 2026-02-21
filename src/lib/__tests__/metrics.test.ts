// Unit tests for metrics module
// Mock @vercel/kv to test without real Redis

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted() so the mock variable is available when vi.mock factory runs
const mockKv = vi.hoisted(() => ({
  incr: vi.fn().mockResolvedValue(1),
  get: vi.fn().mockResolvedValue(null),
  mget: vi.fn().mockResolvedValue([]),
  hincrby: vi.fn().mockResolvedValue(1),
  hgetall: vi.fn().mockResolvedValue(null),
  lpush: vi.fn().mockResolvedValue(1),
  ltrim: vi.fn().mockResolvedValue('OK'),
  lrange: vi.fn().mockResolvedValue([]),
  expire: vi.fn().mockResolvedValue(1),
}));

vi.mock('@vercel/kv', () => ({ kv: mockKv }));

// Set env vars BEFORE importing the module
vi.stubEnv('KV_REST_API_URL', 'https://test.kv.vercel-storage.com');
vi.stubEnv('KV_REST_API_TOKEN', 'test-token');

import {
  incrementCounter,
  getCounter,
  incrementClassCount,
  recordEvent,
  getMetricsSnapshot,
  trackGenerate,
  trackBattle,
  trackShare,
  trackError,
  trackFunnel,
} from '@/lib/metrics';

describe('metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('incrementCounter', () => {
    it('calls kv.incr with prefixed key', async () => {
      await incrementCounter('generate_total');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:generate_total');
    });

    it('does not throw on kv error', async () => {
      mockKv.incr.mockRejectedValueOnce(new Error('KV unavailable'));
      await expect(incrementCounter('test')).resolves.toBeUndefined();
    });
  });

  describe('getCounter', () => {
    it('returns counter value from kv', async () => {
      mockKv.get.mockResolvedValueOnce(42);
      const result = await getCounter('generate_total');
      expect(result).toBe(42);
    });

    it('returns 0 when key does not exist', async () => {
      mockKv.get.mockResolvedValueOnce(null);
      const result = await getCounter('nonexistent');
      expect(result).toBe(0);
    });

    it('returns 0 on kv error', async () => {
      mockKv.get.mockRejectedValueOnce(new Error('KV unavailable'));
      const result = await getCounter('test');
      expect(result).toBe(0);
    });
  });

  describe('incrementClassCount', () => {
    it('calls kv.hincrby with class distribution key', async () => {
      await incrementClassCount('warrior');
      expect(mockKv.hincrby).toHaveBeenCalledWith('metrics:class_distribution', 'warrior', 1);
    });
  });

  describe('recordEvent', () => {
    it('pushes event to ring buffer and trims', async () => {
      await recordEvent('test_event', { foo: 'bar' });
      expect(mockKv.lpush).toHaveBeenCalledWith(
        'metrics:events',
        expect.stringContaining('"name":"test_event"'),
      );
      expect(mockKv.ltrim).toHaveBeenCalledWith('metrics:events', 0, 99);
    });

    it('works without properties', async () => {
      await recordEvent('simple_event');
      expect(mockKv.lpush).toHaveBeenCalled();
      const callArg = mockKv.lpush.mock.calls[0][1] as string;
      const parsed = JSON.parse(callArg);
      expect(parsed.name).toBe('simple_event');
      expect(parsed.properties).toBeUndefined();
    });
  });

  describe('getMetricsSnapshot', () => {
    it('returns snapshot with all sections', async () => {
      // Counter mget returns 19 values (one per counter key)
      mockKv.mget
        .mockResolvedValueOnce(Array(19).fill(5))  // counter batch
        .mockResolvedValueOnce(Array(72).fill(3));  // hourly batch
      mockKv.hgetall.mockResolvedValueOnce({ warrior: 10, rogue: 5 });
      mockKv.lrange.mockResolvedValueOnce([
        JSON.stringify({ name: 'test', timestamp: 1000 }),
      ]);

      const snapshot = await getMetricsSnapshot();

      expect(snapshot.snapshotAt).toBeGreaterThan(0);
      expect(snapshot.classDistribution).toEqual({ warrior: 10, rogue: 5 });
      expect(snapshot.recentEvents).toHaveLength(1);
      expect(snapshot.recentEvents[0].name).toBe('test');
      expect(snapshot.hourlyActivity).toHaveLength(72);
      // Verify counters were populated from mget
      expect(snapshot.counters.generate_total).toBe(5);
    });

    it('returns empty snapshot on kv error', async () => {
      mockKv.mget.mockRejectedValue(new Error('fail'));
      const snapshot = await getMetricsSnapshot();
      expect(snapshot.counters).toEqual({});
      expect(snapshot.recentEvents).toEqual([]);
    });

    it('skips malformed JSON in recent events', async () => {
      mockKv.mget
        .mockResolvedValueOnce(Array(19).fill(0))   // counter batch
        .mockResolvedValueOnce(Array(72).fill(0));   // hourly batch
      mockKv.hgetall.mockResolvedValueOnce(null);
      mockKv.lrange.mockResolvedValueOnce([
        'invalid json{{{',
        JSON.stringify({ name: 'valid', timestamp: 1000 }),
        JSON.stringify({ name: 123 }),
      ]);

      const snapshot = await getMetricsSnapshot();

      expect(snapshot.recentEvents).toHaveLength(1);
      expect(snapshot.recentEvents[0].name).toBe('valid');
    });
  });

  describe('convenience functions', () => {
    it('trackGenerate increments correct counters', async () => {
      await trackGenerate('hunter', false);
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:generate_total');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:generate_fresh');
      expect(mockKv.hincrby).toHaveBeenCalledWith('metrics:class_distribution', 'hunter', 1);
    });

    it('trackGenerate tracks cached correctly', async () => {
      await trackGenerate('rogue', true);
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:generate_cached');
    });

    it('trackBattle increments battle counter', async () => {
      await trackBattle(false);
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:battle_total');
    });

    it('trackShare increments platform counter', async () => {
      await trackShare('twitter');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:share_twitter');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:funnel_share');
    });

    it('trackError increments error counter', async () => {
      await trackError('api');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:error_api');
    });

    it('trackFunnel increments funnel counter', async () => {
      await trackFunnel('landing');
      expect(mockKv.incr).toHaveBeenCalledWith('metrics:counter:funnel_landing');
    });
  });
});

describe('metrics (KV not configured)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
  });

  it('incrementCounter is a no-op when KV is not configured', async () => {
    await incrementCounter('test');
    expect(mockKv.incr).not.toHaveBeenCalled();
  });

  it('getCounter returns 0 when KV is not configured', async () => {
    const result = await getCounter('test');
    expect(result).toBe(0);
    expect(mockKv.get).not.toHaveBeenCalled();
  });

  it('getMetricsSnapshot returns empty when KV is not configured', async () => {
    const snapshot = await getMetricsSnapshot();
    expect(snapshot.counters).toEqual({});
    expect(mockKv.get).not.toHaveBeenCalled();
  });
});
