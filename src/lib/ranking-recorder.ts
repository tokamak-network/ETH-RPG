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
  getPlayerRecord,
  upsertPlayerRecord,
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

function buildPlayerRecord(
  fighter: BattleFighter,
  won: boolean,
  existing: PlayerRecord | null,
): PlayerRecord {
  return {
    address: fighter.address.toLowerCase(),
    ...(fighter.ensName ? { ensName: fighter.ensName } : {}),
    classId: fighter.class.id,
    power: fighter.stats.power,
    level: fighter.stats.level,
    wins: (existing?.wins ?? 0) + (won ? 1 : 0),
    losses: (existing?.losses ?? 0) + (won ? 0 : 1),
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

    // Fetch existing records in parallel (season-scoped)
    const [existing0, existing1] = await Promise.all([
      getPlayerRecord(season.id, fighter0.address),
      getPlayerRecord(season.id, fighter1.address),
    ]);

    // Build updated records
    const record0 = buildPlayerRecord(fighter0, fighter0Won, existing0);
    const record1 = buildPlayerRecord(fighter1, fighter1Won, existing1);

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

    // Write all records in parallel (season-scoped)
    await Promise.all([
      upsertPlayerRecord(season.id, record0),
      upsertPlayerRecord(season.id, record1),
      recordBattleOutcome(battleRecord0),
      recordBattleOutcome(battleRecord1),
    ]);
  } catch {
    // Silently fail — ranking should never affect battle response
  }
}
