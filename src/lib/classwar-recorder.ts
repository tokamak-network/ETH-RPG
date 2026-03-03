// Bridge between battle results and the Class War system
// Fire-and-forget: failures should never affect battle responses
// NOTE: Does NOT create weeks — week lifecycle is owned exclusively by cron (classwar-lifecycle.ts)

import type { BattleFighter, BattleResult } from '@/lib/types';
import { getCurrentWeekId } from '@/lib/classwar-week';
import { WINNER_POINTS, LOSER_POINTS } from '@/lib/classwar-engine';
import {
  getCurrentClassWarWeek,
  incrementClassScore,
  incrementBattleCount,
} from '@/lib/classwar-store';

export async function recordBattleForClassWar(
  fighter0: BattleFighter,
  fighter1: BattleFighter,
  result: BattleResult,
): Promise<void> {
  try {
    // Only record if a valid current week exists (created by cron)
    const week = await getCurrentClassWarWeek();
    if (!week || week.weekId !== getCurrentWeekId() || !week.isActive) {
      return;
    }

    const winnerClassId = result.fighters[result.winner].class.id;
    const loserIdx: 0 | 1 = result.winner === 0 ? 1 : 0;
    const loserClassId = result.fighters[loserIdx].class.id;

    // Increment scores: winner +3, loser +1
    // Increment battle counts for both classes
    await Promise.all([
      incrementClassScore(week.weekId, winnerClassId, WINNER_POINTS),
      incrementClassScore(week.weekId, loserClassId, LOSER_POINTS),
      incrementBattleCount(week.weekId, winnerClassId),
      incrementBattleCount(week.weekId, loserClassId),
    ]);
  } catch {
    // Silently fail — class war should never affect battle response
  }
}
