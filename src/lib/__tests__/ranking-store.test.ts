// Unit tests for ranking-store — getBattleRecords malformed JSON handling
// Mock @vercel/kv to test without real Redis

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockKv = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  sadd: vi.fn().mockResolvedValue(1),
  sscan: vi.fn().mockResolvedValue(['0', []]),
  mget: vi.fn().mockResolvedValue([]),
  eval: vi.fn().mockResolvedValue(1),
  lpush: vi.fn().mockResolvedValue(1),
  ltrim: vi.fn().mockResolvedValue('OK'),
  lrange: vi.fn().mockResolvedValue([]),
}));

vi.mock('@vercel/kv', () => ({ kv: mockKv }));

// Set env vars BEFORE importing the module
vi.stubEnv('KV_REST_API_URL', 'https://test.kv.vercel-storage.com');
vi.stubEnv('KV_REST_API_TOKEN', 'test-token');

import { getBattleRecords } from '@/lib/ranking-store';

const VALID_BATTLE_RECORD = {
  seasonId: 's1',
  address: '0xabc',
  opponentAddress: '0xdef',
  won: true,
  power: 1000,
  opponentPower: 900,
  nonce: '550e8400-e29b-41d4-a716-446655440000',
  recordedAt: 1000,
};

describe('getBattleRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips malformed JSON and invalid shapes, keeps valid records', async () => {
    mockKv.lrange.mockResolvedValueOnce([
      'invalid json{{{',
      JSON.stringify(VALID_BATTLE_RECORD),
      JSON.stringify({ name: 'not-a-battle-record' }),
    ]);

    const records = await getBattleRecords('s1', '0xabc');

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual(VALID_BATTLE_RECORD);
  });

  it('returns [] when KV is not configured', async () => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');

    const records = await getBattleRecords('s1', '0xabc');

    expect(records).toEqual([]);
    expect(mockKv.lrange).not.toHaveBeenCalled();
  });

  it('returns [] on KV error', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://test.kv.vercel-storage.com');
    vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
    mockKv.lrange.mockRejectedValueOnce(new Error('KV unavailable'));

    const records = await getBattleRecords('s1', '0xabc');

    expect(records).toEqual([]);
  });
});
