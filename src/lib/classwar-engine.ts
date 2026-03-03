// Class War computation engine — pure functions for standings and buff logic

import type { CharacterClassId } from '@/lib/types';
import { ALL_CLASS_IDS } from '@/lib/classwar-types';
import type { ClassWarWeek, ClassWarScore, ClassWarStandings } from '@/lib/classwar-types';

/** Points awarded per battle */
export const WINNER_POINTS = 3;
export const LOSER_POINTS = 1;

/** Damage buff multiplier for previous week's winning class */
export const CLASS_WAR_BUFF_MULTIPLIER = 1.05;

/**
 * Build ranked ClassWarScore array from raw score/battleCount maps.
 * Missing classes get score=0, rank assigned by descending score.
 */
export function buildClassScores(
  scoreMap: Readonly<Record<string, number>>,
  battleCountMap: Readonly<Record<string, number>>,
): readonly ClassWarScore[] {
  const unsorted: ClassWarScore[] = ALL_CLASS_IDS.map((classId) => ({
    classId,
    score: scoreMap[classId] ?? 0,
    rank: 0,
    battleCount: battleCountMap[classId] ?? 0,
  }));

  // Sort by score descending, tie-break: fewer battles = more efficient
  unsorted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.battleCount !== b.battleCount) return a.battleCount - b.battleCount;
    return a.classId.localeCompare(b.classId);
  });

  return unsorted.map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));
}

/**
 * Compute full ClassWarStandings from week + scores + buff.
 */
export function computeClassWarStandings(
  week: ClassWarWeek,
  scores: readonly ClassWarScore[],
  buffClassId: CharacterClassId | null,
): ClassWarStandings {
  const totalBattles = scores.reduce(
    (sum, s) => sum + s.battleCount,
    0,
  );
  // Each battle involves 2 classes, so total unique battles = sum / 2
  const uniqueBattles = Math.floor(totalBattles / 2);

  return {
    weekId: week.weekId,
    week,
    scores,
    totalBattles: uniqueBattles,
    updatedAt: Date.now(),
    buffClassId,
  };
}

/**
 * Determine the week's winning class. Highest score wins.
 * Tie-break: fewer battles (efficiency), then alphabetical.
 */
export function determineWeekWinner(scores: readonly ClassWarScore[]): CharacterClassId | null {
  if (scores.length === 0) return null;
  const allZero = scores.every((s) => s.score === 0);
  if (allZero) return null;
  // scores are already sorted by rank (buildClassScores ensures this)
  return scores[0].classId;
}

/**
 * Get the damage multiplier for a class in battle.
 * Returns 1.05 if the class is the buffed class, 1.0 otherwise.
 */
export function getClassWarDamageMultiplier(
  classId: CharacterClassId,
  buffClassId: CharacterClassId | null,
): number {
  if (buffClassId && classId === buffClassId) {
    return CLASS_WAR_BUFF_MULTIPLIER;
  }
  return 1.0;
}
