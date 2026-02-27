// Unit tests for ranking engine — pure computation, no mocking needed

import { describe, it, expect } from 'vitest';
import {
  computePowerRanking,
  computeBattleRanking,
  computeExplorerRanking,
  computeWeightedDelta,
  findPlayerRank,
} from '@/lib/ranking-engine';
import type { PlayerRecord } from '@/lib/types';

function makePlayer(overrides: Partial<PlayerRecord> & { address: string }): PlayerRecord {
  return {
    ensName: undefined,
    classId: 'warrior',
    power: 1000,
    level: 10,
    wins: 0,
    losses: 0,
    weightedScore: 0,
    achievementCounts: { legendary: 0, epic: 0, rare: 0, common: 0 },
    lastSeenAt: Date.now(),
    ...overrides,
  };
}

describe('computePowerRanking', () => {
  it('sorts by power descending', () => {
    const players = [
      makePlayer({ address: '0xaaa', power: 500 }),
      makePlayer({ address: '0xbbb', power: 1500 }),
      makePlayer({ address: '0xccc', power: 1000 }),
    ];

    const result = computePowerRanking(players);

    expect(result).toHaveLength(3);
    expect(result[0].rank).toBe(1);
    expect(result[0].address).toBe('0xbbb');
    expect(result[0].power).toBe(1500);
    expect(result[1].rank).toBe(2);
    expect(result[1].address).toBe('0xccc');
    expect(result[2].rank).toBe(3);
    expect(result[2].address).toBe('0xaaa');
  });

  it('breaks ties by address alphabetically', () => {
    const players = [
      makePlayer({ address: '0xbbb', power: 1000 }),
      makePlayer({ address: '0xaaa', power: 1000 }),
    ];

    const result = computePowerRanking(players);

    expect(result[0].address).toBe('0xaaa');
    expect(result[1].address).toBe('0xbbb');
  });

  it('limits to 500 entries', () => {
    const players = Array.from({ length: 600 }, (_, i) =>
      makePlayer({ address: `0x${String(i).padStart(40, '0')}`, power: 600 - i }),
    );

    const result = computePowerRanking(players);
    expect(result).toHaveLength(500);
    expect(result[499].rank).toBe(500);
  });

  it('includes ensName when present', () => {
    const players = [makePlayer({ address: '0xaaa', ensName: 'vitalik.eth', power: 1000 })];
    const result = computePowerRanking(players);
    expect(result[0].ensName).toBe('vitalik.eth');
  });

  it('returns empty array for empty input', () => {
    expect(computePowerRanking([])).toEqual([]);
  });
});

describe('computeBattleRanking', () => {
  it('requires minimum 5 battles to appear', () => {
    const players = [
      makePlayer({ address: '0xaaa', wins: 3, losses: 1 }), // 4 battles — excluded
      makePlayer({ address: '0xbbb', wins: 3, losses: 2 }), // 5 battles — included
    ];

    const result = computeBattleRanking(players);
    expect(result).toHaveLength(1);
    expect(result[0].address).toBe('0xbbb');
  });

  it('sorts by ratingScore descending', () => {
    const players = [
      makePlayer({ address: '0xaaa', wins: 10, losses: 5, weightedScore: 85 }), // round(85 * 1.17) = 99
      makePlayer({ address: '0xbbb', wins: 20, losses: 2, weightedScore: 194 }), // round(194 * 1.41) = 274
    ];

    const result = computeBattleRanking(players);
    expect(result[0].address).toBe('0xbbb');
    expect(result[0].ratingScore).toBeGreaterThan(result[1].ratingScore);
  });

  it('computes winRate correctly', () => {
    const players = [makePlayer({ address: '0xaaa', wins: 7, losses: 3 })];
    const result = computeBattleRanking(players);
    expect(result[0].winRate).toBe(70);
  });

  it('handles zero wins — negative weightedScore reduces rating', () => {
    const players = [makePlayer({ address: '0xaaa', wins: 0, losses: 5, weightedScore: -15 })];
    const result = computeBattleRanking(players);
    expect(result[0].winRate).toBe(0);
    expect(result[0].ratingScore).toBe(-7); // round(-15 * 0.5) = -7
  });

  it('same wins but higher weightedScore ranks higher', () => {
    // Player A beat strong opponents, Player B beat weak opponents
    const players = [
      makePlayer({ address: '0xaaa', wins: 10, losses: 5, weightedScore: 150 }), // giant-slayer
      makePlayer({ address: '0xbbb', wins: 10, losses: 5, weightedScore: 50 }),  // easy fights
    ];

    const result = computeBattleRanking(players);
    expect(result[0].address).toBe('0xaaa');
    expect(result[0].ratingScore).toBe(176); // round(150 * 1.17) = 176
    expect(result[1].ratingScore).toBe(59);  // round(50 * 1.17) = 59
  });

  it('high weightedScore can outrank better winRate', () => {
    const players = [
      makePlayer({ address: '0xaaa', wins: 6, losses: 4, weightedScore: 120 }), // 60% winRate, fought strong
      makePlayer({ address: '0xbbb', wins: 9, losses: 1, weightedScore: 50 }),  // 90% winRate, fought weak
    ];

    const result = computeBattleRanking(players);
    // 0xaaa: round(120 * 1.1) = 132
    // 0xbbb: round(50 * 1.4) = 70
    expect(result[0].address).toBe('0xaaa');
    expect(result[0].ratingScore).toBe(132);
    expect(result[1].ratingScore).toBe(70);
  });
});

describe('computeWeightedDelta', () => {
  it('equal power: win +10, loss -3', () => {
    expect(computeWeightedDelta(30000, 30000, true)).toBe(10);
    expect(computeWeightedDelta(30000, 30000, false)).toBe(-3);
  });

  it('stronger opponent: higher reward, lower penalty', () => {
    // 40K vs 30K → ratio 1.33
    expect(computeWeightedDelta(30000, 40000, true)).toBe(13);
    expect(computeWeightedDelta(30000, 40000, false)).toBe(-2);
  });

  it('much stronger opponent: capped at ratio 3.0', () => {
    // 100K vs 10K → ratio 10 → clamped to 3.0
    expect(computeWeightedDelta(10000, 100000, true)).toBe(30);
    expect(computeWeightedDelta(10000, 100000, false)).toBe(-1);
  });

  it('weaker opponent: lower reward, higher penalty', () => {
    // 15K vs 30K → ratio 0.5 (clamped)
    expect(computeWeightedDelta(30000, 15000, true)).toBe(5);
    expect(computeWeightedDelta(30000, 15000, false)).toBe(-6);
  });

  it('much weaker opponent: clamped at ratio 0.5', () => {
    // 1K vs 30K → ratio 0.033 → clamped to 0.5
    expect(computeWeightedDelta(30000, 1000, true)).toBe(5);
    expect(computeWeightedDelta(30000, 1000, false)).toBe(-6);
  });

  it('zero myPower defaults to 1', () => {
    expect(computeWeightedDelta(0, 1000, true)).toBe(30); // ratio clamped at 3.0
    expect(computeWeightedDelta(0, 1000, false)).toBe(-1);
  });

  it('zero opponentPower defaults to 1', () => {
    expect(computeWeightedDelta(1000, 0, true)).toBe(5); // ratio clamped at 0.5
    expect(computeWeightedDelta(1000, 0, false)).toBe(-6);
  });

  it('both zero power defaults to 1 each (equal)', () => {
    expect(computeWeightedDelta(0, 0, true)).toBe(10);
    expect(computeWeightedDelta(0, 0, false)).toBe(-3);
  });

  it('specific plan examples match (my power 30K)', () => {
    // From the plan table
    expect(computeWeightedDelta(30000, 50000, true)).toBe(17);  // ratio 1.67
    expect(computeWeightedDelta(30000, 50000, false)).toBe(-2);
    expect(computeWeightedDelta(30000, 70000, true)).toBe(23);  // ratio 2.33
    expect(computeWeightedDelta(30000, 70000, false)).toBe(-1);
  });
});

describe('computeExplorerRanking', () => {
  it('computes weighted explorer score', () => {
    const players = [
      makePlayer({
        address: '0xaaa',
        achievementCounts: { legendary: 1, epic: 2, rare: 3, common: 4 },
      }),
    ];

    const result = computeExplorerRanking(players);
    expect(result).toHaveLength(1);
    // 1*100 + 2*40 + 3*15 + 4*5 = 100 + 80 + 45 + 20 = 245
    expect(result[0].explorerScore).toBe(245);
    expect(result[0].achievementCount).toBe(10);
  });

  it('excludes players with zero explorer score', () => {
    const players = [
      makePlayer({
        address: '0xaaa',
        achievementCounts: { legendary: 0, epic: 0, rare: 0, common: 0 },
      }),
    ];

    const result = computeExplorerRanking(players);
    expect(result).toHaveLength(0);
  });

  it('sorts by explorerScore descending', () => {
    const players = [
      makePlayer({
        address: '0xaaa',
        achievementCounts: { legendary: 0, epic: 0, rare: 1, common: 1 },
      }),
      makePlayer({
        address: '0xbbb',
        achievementCounts: { legendary: 1, epic: 0, rare: 0, common: 0 },
      }),
    ];

    const result = computeExplorerRanking(players);
    expect(result[0].address).toBe('0xbbb');
    expect(result[0].explorerScore).toBe(100);
    expect(result[1].address).toBe('0xaaa');
    expect(result[1].explorerScore).toBe(20);
  });
});

describe('findPlayerRank', () => {
  it('returns rank for existing player (1-indexed)', () => {
    const entries = [
      { address: '0xaaa' },
      { address: '0xbbb' },
      { address: '0xccc' },
    ];

    expect(findPlayerRank(entries, '0xbbb')).toBe(2);
  });

  it('returns undefined for missing player', () => {
    const entries = [{ address: '0xaaa' }];
    expect(findPlayerRank(entries, '0xzzz')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    const entries = [{ address: '0xaaa' }];
    expect(findPlayerRank(entries, '0xAAA')).toBe(1);
  });
});
