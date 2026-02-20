// Unit tests for ranking engine — pure computation, no mocking needed

import { describe, it, expect } from 'vitest';
import {
  computePowerRanking,
  computeBattleRanking,
  computeExplorerRanking,
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
      makePlayer({ address: '0xaaa', wins: 10, losses: 5 }), // score=10*10+5*2+67=177
      makePlayer({ address: '0xbbb', wins: 20, losses: 2 }), // score=20*10+2*2+91=295
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

  it('handles zero wins', () => {
    const players = [makePlayer({ address: '0xaaa', wins: 0, losses: 5 })];
    const result = computeBattleRanking(players);
    expect(result[0].winRate).toBe(0);
    expect(result[0].ratingScore).toBe(10); // 0*10 + 5*2 + 0 = 10
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
