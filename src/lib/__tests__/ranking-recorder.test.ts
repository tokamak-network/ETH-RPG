// Unit tests for ranking recorder — mocks ranking-store

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted() so mock variables are available when vi.mock factory runs
const {
  mockGetCurrentSeason,
  mockGetPlayerRecord,
  mockUpsertPlayerRecord,
  mockRecordBattleOutcome,
} = vi.hoisted(() => ({
  mockGetCurrentSeason: vi.fn(),
  mockGetPlayerRecord: vi.fn(),
  mockUpsertPlayerRecord: vi.fn(),
  mockRecordBattleOutcome: vi.fn(),
}));

vi.mock('@/lib/ranking-store', () => ({
  getCurrentSeason: mockGetCurrentSeason,
  getPlayerRecord: mockGetPlayerRecord,
  upsertPlayerRecord: mockUpsertPlayerRecord,
  recordBattleOutcome: mockRecordBattleOutcome,
}));

import { recordBattleForRanking } from '@/lib/ranking-recorder';
import type { BattleFighter, BattleResult, Season } from '@/lib/types';

const ACTIVE_SEASON: Season = {
  id: 's1',
  number: 1,
  name: 'Genesis Season',
  startedAt: Date.now() - 1000,
  endsAt: Date.now() + 1_000_000,
  isActive: true,
};

function makeFighter(address: string, power: number = 1000): BattleFighter {
  return {
    address,
    class: { id: 'warrior', name: '전사', nameEn: 'Warrior' },
    stats: { level: 10, hp: 300, mp: 200, str: 100, int: 80, dex: 90, luck: 60, power },
    achievements: [
      { id: 'first_step', name: 'First Step', icon: '👣', tier: 'common', description: 'Made at least 1 transaction' },
    ],
  };
}

function makeResult(winner: 0 | 1): BattleResult {
  return {
    fighters: [makeFighter('0xaaa', 1000), makeFighter('0xbbb', 900)],
    winner,
    turns: [],
    totalTurns: 5,
    winnerHpRemaining: 150,
    winnerHpPercent: 50,
    matchup: { fighter0Advantage: 'neutral', fighter1Advantage: 'neutral' },
    nonce: 'test-nonce-uuid',
    battleSeed: 'test-seed',
  };
}

describe('recordBattleForRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentSeason.mockResolvedValue(ACTIVE_SEASON);
    mockGetPlayerRecord.mockResolvedValue(null);
    mockUpsertPlayerRecord.mockResolvedValue(undefined);
    mockRecordBattleOutcome.mockResolvedValue(undefined);
  });

  it('records both players and battle outcomes for a fresh battle', async () => {
    const fighter0 = makeFighter('0xaaa', 1000);
    const fighter1 = makeFighter('0xbbb', 900);
    const result = makeResult(0);

    await recordBattleForRanking(fighter0, fighter1, result);

    // Should upsert both players with seasonId
    expect(mockUpsertPlayerRecord).toHaveBeenCalledTimes(2);

    // Winner (0xaaa) should have 1 win, 0 losses
    const winnerCall = mockUpsertPlayerRecord.mock.calls.find(
      (call: unknown[]) => (call[1] as { address: string }).address === '0xaaa',
    );
    expect(winnerCall).toBeDefined();
    expect(winnerCall![0]).toBe('s1'); // seasonId
    expect(winnerCall![1].wins).toBe(1);
    expect(winnerCall![1].losses).toBe(0);

    // Loser (0xbbb) should have 0 wins, 1 loss
    const loserCall = mockUpsertPlayerRecord.mock.calls.find(
      (call: unknown[]) => (call[1] as { address: string }).address === '0xbbb',
    );
    expect(loserCall).toBeDefined();
    expect(loserCall![0]).toBe('s1'); // seasonId
    expect(loserCall![1].wins).toBe(0);
    expect(loserCall![1].losses).toBe(1);

    // Should record 2 battle outcomes
    expect(mockRecordBattleOutcome).toHaveBeenCalledTimes(2);
  });

  it('accumulates wins/losses for existing players', async () => {
    mockGetPlayerRecord.mockImplementation(async (_seasonId: string, addr: string) => {
      if (addr === '0xaaa') {
        return {
          address: '0xaaa',
          classId: 'warrior',
          power: 1000,
          level: 10,
          wins: 5,
          losses: 3,
          achievementCounts: { legendary: 0, epic: 0, rare: 0, common: 1 },
          lastSeenAt: Date.now(),
        };
      }
      return null;
    });

    const fighter0 = makeFighter('0xaaa', 1000);
    const fighter1 = makeFighter('0xbbb', 900);
    const result = makeResult(0);

    await recordBattleForRanking(fighter0, fighter1, result);

    const winnerCall = mockUpsertPlayerRecord.mock.calls.find(
      (call: unknown[]) => (call[1] as { address: string }).address === '0xaaa',
    );
    expect(winnerCall![1].wins).toBe(6); // 5 + 1
    expect(winnerCall![1].losses).toBe(3); // unchanged
  });

  it('does nothing when no active season', async () => {
    mockGetCurrentSeason.mockResolvedValue(null);

    const fighter0 = makeFighter('0xaaa');
    const fighter1 = makeFighter('0xbbb');
    const result = makeResult(0);

    await recordBattleForRanking(fighter0, fighter1, result);

    expect(mockUpsertPlayerRecord).not.toHaveBeenCalled();
    expect(mockRecordBattleOutcome).not.toHaveBeenCalled();
  });

  it('does nothing when season is inactive', async () => {
    mockGetCurrentSeason.mockResolvedValue({ ...ACTIVE_SEASON, isActive: false });

    const fighter0 = makeFighter('0xaaa');
    const fighter1 = makeFighter('0xbbb');
    const result = makeResult(0);

    await recordBattleForRanking(fighter0, fighter1, result);

    expect(mockUpsertPlayerRecord).not.toHaveBeenCalled();
  });

  it('counts achievement tiers from fighter data', async () => {
    const fighter0: BattleFighter = {
      address: '0xaaa',
      class: { id: 'hunter', name: '사냥꾼', nameEn: 'Hunter' },
      stats: { level: 20, hp: 400, mp: 300, str: 200, int: 150, dex: 180, luck: 100, power: 5000 },
      achievements: [
        { id: 'genesis', name: 'Genesis', icon: '🏛️', tier: 'legendary', description: 'test' },
        { id: 'diamond', name: 'Diamond', icon: '💎', tier: 'epic', description: 'test' },
        { id: 'veteran', name: 'Veteran', icon: '⚔️', tier: 'rare', description: 'test' },
        { id: 'first', name: 'First', icon: '👣', tier: 'common', description: 'test' },
        { id: 'explorer', name: 'Explorer', icon: '🧭', tier: 'common', description: 'test' },
      ],
    };
    const fighter1 = makeFighter('0xbbb');
    const result = makeResult(0);

    await recordBattleForRanking(fighter0, fighter1, result);

    const call = mockUpsertPlayerRecord.mock.calls.find(
      (call: unknown[]) => (call[1] as { address: string }).address === '0xaaa',
    );
    expect(call![1].achievementCounts).toEqual({
      legendary: 1,
      epic: 1,
      rare: 1,
      common: 2,
    });
  });
});
