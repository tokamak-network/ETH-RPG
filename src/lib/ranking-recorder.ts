// Bridge between battle results and the ranking system
// Fire-and-forget: failures should never affect battle responses

import type {
  BattleFighter,
  BattleResult,
  PlayerRecord,
  BattleRecord,
  AchievementTier,
} from '@/lib/types';
import {
  atomicRecordBattleResult,
  recordBattleOutcome,
  getCurrentSeason,
} from '@/lib/ranking-store';

function countAchievementsByTier(
  achievements: readonly { readonly tier: AchievementTier }[],
): Readonly<Record<AchievementTier, number>> {
  return achievements.reduce(
    (acc, a) => ({ ...acc, [a.tier]: acc[a.tier] + 1 }),
    { legendary: 0, epic: 0, rare: 0, common: 0 } as Record<AchievementTier, number>,
  );
}

function buildBaseRecord(fighter: BattleFighter): PlayerRecord {
  return {
    address: fighter.address.toLowerCase(),
    ...(fighter.ensName ? { ensName: fighter.ensName } : {}),
    classId: fighter.class.id,
    power: fighter.stats.power,
    level: fighter.stats.level,
    wins: 0,
    losses: 0,
    achievementCounts: countAchievementsByTier(fighter.achievements),
    lastSeenAt: Date.now(),
  };
}

export async function recordBattleForRanking(
  fighter0: BattleFighter,
  fighter1: BattleFighter,
  result: BattleResult,
): Promise<void> {
  try {
    const season = await getCurrentSeason();
    if (!season || !season.isActive) return;

    const fighter0Won = result.winner === 0;
    const fighter1Won = result.winner === 1;

    // Build base records (metadata only — wins/losses handled atomically by Lua script)
    const base0 = buildBaseRecord(fighter0);
    const base1 = buildBaseRecord(fighter1);

    // Build battle records
    const battleRecord0: BattleRecord = {
      seasonId: season.id,
      address: fighter0.address.toLowerCase(),
      opponentAddress: fighter1.address.toLowerCase(),
      won: fighter0Won,
      power: fighter0.stats.power,
      opponentPower: fighter1.stats.power,
      nonce: result.nonce,
      recordedAt: Date.now(),
    };

    const battleRecord1: BattleRecord = {
      seasonId: season.id,
      address: fighter1.address.toLowerCase(),
      opponentAddress: fighter0.address.toLowerCase(),
      won: fighter1Won,
      power: fighter1.stats.power,
      opponentPower: fighter0.stats.power,
      nonce: result.nonce,
      recordedAt: Date.now(),
    };

    // Atomic upsert + battle records in parallel
    await Promise.all([
      atomicRecordBattleResult(season.id, base0, fighter0Won),
      atomicRecordBattleResult(season.id, base1, fighter1Won),
      recordBattleOutcome(battleRecord0),
      recordBattleOutcome(battleRecord1),
    ]);
  } catch {
    // Silently fail — ranking should never affect battle response
  }
}
