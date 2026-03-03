// Class War week lifecycle — manages week creation, rotation, and standings snapshot
// Called by cron (ranking/refresh). This is the ONLY place that creates/finalizes weeks.

import { getCurrentWeekId, createClassWarWeek, isWeekExpired } from '@/lib/classwar-week';
import { buildClassScores, computeClassWarStandings, determineWeekWinner } from '@/lib/classwar-engine';
import {
  getCurrentClassWarWeek,
  saveClassWarWeek,
  updateClassWarWeek,
  getAllClassScoresAndCounts,
  setStandingsSnapshot,
  setWeekBuff,
  getWeekBuff,
  recordClassWarResult,
} from '@/lib/classwar-store';

export interface ClassWarRefreshResult {
  readonly weekId: string;
}

/**
 * Rotate Class War weeks and compute standings snapshot.
 * - If no week exists, creates a genesis week.
 * - If the current week is expired or stale, finalizes it and creates a new one.
 * - Always computes and caches the current standings snapshot.
 *
 * Returns the active weekId. Throws on failure (caller decides how to handle).
 */
export async function rotateClassWarWeek(): Promise<ClassWarRefreshResult> {
  let currentWeek = await getCurrentClassWarWeek();
  const expectedWeekId = getCurrentWeekId();

  if (!currentWeek) {
    // First run — create genesis week
    currentWeek = createClassWarWeek(expectedWeekId);
    await saveClassWarWeek(currentWeek);
  } else if (currentWeek.weekId !== expectedWeekId || isWeekExpired(currentWeek)) {
    // Week ended — finalize old week, create new one
    const oldWeekId = currentWeek.weekId;
    const { scoreMap, battleCountMap } = await getAllClassScoresAndCounts(oldWeekId);
    const oldScores = buildClassScores(scoreMap, battleCountMap);
    const winner = determineWeekWinner(oldScores);

    // Record result in history
    const totalBattles = oldScores.reduce((s, c) => s + c.battleCount, 0);
    if (winner) {
      await recordClassWarResult({
        weekId: oldWeekId,
        winnerClassId: winner,
        scores: oldScores,
        totalBattles: Math.floor(totalBattles / 2),
        endedAt: currentWeek.endsAt,
      });
      // Set buff for the new week
      await setWeekBuff(expectedWeekId, winner);
    }

    // Mark old week inactive and create new one
    await updateClassWarWeek({ ...currentWeek, isActive: false });
    currentWeek = createClassWarWeek(expectedWeekId);
    await saveClassWarWeek(currentWeek);
  }

  // Compute and cache current standings snapshot
  const weekId = currentWeek.weekId;
  const { scoreMap, battleCountMap } = await getAllClassScoresAndCounts(weekId);
  const scores = buildClassScores(scoreMap, battleCountMap);
  const buffClassId = await getWeekBuff(weekId);
  const standings = computeClassWarStandings(currentWeek, scores, buffClassId);
  await setStandingsSnapshot(weekId, standings);

  return { weekId };
}
