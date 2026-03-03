import { describe, it, expect } from 'vitest';
import {
  buildClassScores,
  computeClassWarStandings,
  determineWeekWinner,
  getClassWarDamageMultiplier,
  WINNER_POINTS,
  LOSER_POINTS,
  CLASS_WAR_BUFF_MULTIPLIER,
} from '@/lib/classwar-engine';
import { ALL_CLASS_IDS } from '@/lib/classwar-types';
import type { ClassWarWeek } from '@/lib/classwar-types';
import type { CharacterClassId } from '@/lib/types';

// --- Helpers ---

function makeScoreMap(overrides: Partial<Record<CharacterClassId, number>> = {}): Record<string, number> {
  return Object.fromEntries(
    ALL_CLASS_IDS.map((id) => [id, overrides[id] ?? 0]),
  );
}

function makeBattleCountMap(overrides: Partial<Record<CharacterClassId, number>> = {}): Record<string, number> {
  return Object.fromEntries(
    ALL_CLASS_IDS.map((id) => [id, overrides[id] ?? 0]),
  );
}

function makeWeek(overrides: Partial<ClassWarWeek> = {}): ClassWarWeek {
  return {
    weekId: 'w2026-10',
    startedAt: 1740700800000,
    endsAt: 1741305600000,
    isActive: true,
    ...overrides,
  };
}

// --- Tests ---

describe('constants', () => {
  it('winner gets 3 points, loser gets 1', () => {
    expect(WINNER_POINTS).toBe(3);
    expect(LOSER_POINTS).toBe(1);
  });

  it('buff multiplier is 1.05', () => {
    expect(CLASS_WAR_BUFF_MULTIPLIER).toBe(1.05);
  });
});

describe('buildClassScores', () => {
  it('returns all 8 classes even when maps are empty', () => {
    const scores = buildClassScores({}, {});
    expect(scores).toHaveLength(8);
    scores.forEach((s) => {
      expect(s.score).toBe(0);
      expect(s.battleCount).toBe(0);
    });
  });

  it('ranks by score descending', () => {
    const scoreMap = makeScoreMap({ warrior: 100, rogue: 50, hunter: 200 });
    const countMap = makeBattleCountMap({ warrior: 10, rogue: 5, hunter: 20 });

    const scores = buildClassScores(scoreMap, countMap);
    expect(scores[0].classId).toBe('hunter');
    expect(scores[0].rank).toBe(1);
    expect(scores[0].score).toBe(200);

    expect(scores[1].classId).toBe('warrior');
    expect(scores[1].rank).toBe(2);

    expect(scores[2].classId).toBe('rogue');
    expect(scores[2].rank).toBe(3);
  });

  it('breaks ties by fewer battles (more efficient)', () => {
    const scoreMap = makeScoreMap({ warrior: 100, rogue: 100 });
    const countMap = makeBattleCountMap({ warrior: 50, rogue: 30 });

    const scores = buildClassScores(scoreMap, countMap);
    // rogue has fewer battles at same score → ranked higher
    expect(scores[0].classId).toBe('rogue');
    expect(scores[1].classId).toBe('warrior');
  });

  it('breaks score+battle ties alphabetically', () => {
    const scoreMap = makeScoreMap({ warrior: 100, rogue: 100 });
    const countMap = makeBattleCountMap({ warrior: 50, rogue: 50 });

    const scores = buildClassScores(scoreMap, countMap);
    // Same score, same battle count → alphabetical: rogue < warrior
    expect(scores[0].classId).toBe('rogue');
    expect(scores[1].classId).toBe('warrior');
  });

  it('assigns rank 1-8 sequentially', () => {
    const scoreMap = makeScoreMap();
    const countMap = makeBattleCountMap();
    const scores = buildClassScores(scoreMap, countMap);
    const ranks = scores.map((s) => s.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('handles partial score maps gracefully', () => {
    // Only one class has a score
    const scores = buildClassScores({ warrior: 42 }, {});
    expect(scores[0].classId).toBe('warrior');
    expect(scores[0].score).toBe(42);
    // All others should be 0
    scores.slice(1).forEach((s) => {
      expect(s.score).toBe(0);
    });
  });
});

describe('determineWeekWinner', () => {
  it('returns null for empty scores', () => {
    expect(determineWeekWinner([])).toBeNull();
  });

  it('returns null when all scores are zero', () => {
    const scores = buildClassScores({}, {});
    expect(determineWeekWinner(scores)).toBeNull();
  });

  it('returns the class with highest score', () => {
    const scoreMap = makeScoreMap({ hunter: 500, warrior: 300 });
    const scores = buildClassScores(scoreMap, {});
    expect(determineWeekWinner(scores)).toBe('hunter');
  });

  it('respects tie-break (fewer battles wins)', () => {
    const scoreMap = makeScoreMap({ warrior: 100, rogue: 100 });
    const countMap = makeBattleCountMap({ warrior: 50, rogue: 30 });
    const scores = buildClassScores(scoreMap, countMap);
    expect(determineWeekWinner(scores)).toBe('rogue');
  });
});

describe('computeClassWarStandings', () => {
  it('computes unique battle count (sum/2)', () => {
    const week = makeWeek();
    const scoreMap = makeScoreMap({ warrior: 30, rogue: 10 });
    const countMap = makeBattleCountMap({ warrior: 10, rogue: 10 });
    const scores = buildClassScores(scoreMap, countMap);

    const standings = computeClassWarStandings(week, scores, null);

    // Total battle participations = 10 + 10 = 20, unique = 10
    expect(standings.totalBattles).toBe(10);
    expect(standings.weekId).toBe('w2026-10');
    expect(standings.buffClassId).toBeNull();
    expect(standings.scores).toHaveLength(8);
  });

  it('includes buff class id when provided', () => {
    const week = makeWeek();
    const scores = buildClassScores({}, {});
    const standings = computeClassWarStandings(week, scores, 'hunter');

    expect(standings.buffClassId).toBe('hunter');
  });

  it('sets updatedAt to current time', () => {
    const before = Date.now();
    const week = makeWeek();
    const scores = buildClassScores({}, {});
    const standings = computeClassWarStandings(week, scores, null);
    const after = Date.now();

    expect(standings.updatedAt).toBeGreaterThanOrEqual(before);
    expect(standings.updatedAt).toBeLessThanOrEqual(after);
  });
});

describe('getClassWarDamageMultiplier', () => {
  it('returns 1.05 for buffed class', () => {
    expect(getClassWarDamageMultiplier('hunter', 'hunter')).toBe(1.05);
  });

  it('returns 1.0 for non-buffed class', () => {
    expect(getClassWarDamageMultiplier('warrior', 'hunter')).toBe(1.0);
  });

  it('returns 1.0 when no buff is active', () => {
    expect(getClassWarDamageMultiplier('hunter', null)).toBe(1.0);
  });

  it('returns 1.0 for every class when buff is null', () => {
    ALL_CLASS_IDS.forEach((classId) => {
      expect(getClassWarDamageMultiplier(classId, null)).toBe(1.0);
    });
  });

  it('returns 1.05 only for the matching class', () => {
    const buffClass: CharacterClassId = 'merchant';
    ALL_CLASS_IDS.forEach((classId) => {
      const expected = classId === buffClass ? 1.05 : 1.0;
      expect(getClassWarDamageMultiplier(classId, buffClass)).toBe(expected);
    });
  });
});
