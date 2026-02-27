// Ranking engine — pure functions that compute sorted leaderboard entries
// No I/O, no side effects — takes raw data, returns ranked arrays

import type {
  PlayerRecord,
  PowerRankingEntry,
  BattleRankingEntry,
  ExplorerRankingEntry,
  AchievementTier,
} from '@/lib/types';

const MAX_LEADERBOARD_SIZE = 500;
const MIN_BATTLES_FOR_RANKING = 5;

// --- Explorer scoring weights ---
const EXPLORER_WEIGHTS: Readonly<Record<AchievementTier, number>> = {
  legendary: 100,
  epic: 40,
  rare: 15,
  common: 5,
};

// --- Power Ranking ---

export function computePowerRanking(
  players: readonly PlayerRecord[],
): readonly PowerRankingEntry[] {
  return [...players]
    .sort((a, b) => b.power - a.power || a.address.localeCompare(b.address))
    .slice(0, MAX_LEADERBOARD_SIZE)
    .map((p, i) => ({
      rank: i + 1,
      address: p.address,
      ...(p.ensName ? { ensName: p.ensName } : {}),
      classId: p.classId,
      power: p.power,
      level: p.level,
    }));
}

// --- Battle Ranking ---

// Mirrors the delta logic in the Lua atomic upsert script (ranking-store.ts).
// Any change here MUST be reflected in the Lua script and vice versa.
export function computeWeightedDelta(myPower: number, opponentPower: number, won: boolean): number {
  const safeMy = myPower === 0 ? 1 : myPower;
  const safeOpp = opponentPower === 0 ? 1 : opponentPower;
  const ratio = Math.min(Math.max(safeOpp / safeMy, 0.5), 3.0);
  if (won) {
    return Math.round(10 * ratio);
  }
  return -Math.round(3 * (1 / ratio));
}

function computeWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

function computeRatingScore(weightedScore: number, winRate: number): number {
  // winRate as multiplier: 100% → 1.5x, 50% → 1.0x, 0% → 0.5x
  // Sybil pairs (50% winRate) get no bonus; legitimate high-winrate players get up to 1.5x
  const winRateMultiplier = 0.5 + winRate / 100;
  return Math.round(weightedScore * winRateMultiplier);
}

export function computeBattleRanking(
  players: readonly PlayerRecord[],
): readonly BattleRankingEntry[] {
  return [...players]
    .filter((p) => p.wins + p.losses >= MIN_BATTLES_FOR_RANKING)
    .map((p) => {
      const winRate = computeWinRate(p.wins, p.losses);
      const ratingScore = computeRatingScore(p.weightedScore, winRate);
      return {
        address: p.address,
        ...(p.ensName ? { ensName: p.ensName } : {}),
        classId: p.classId,
        power: p.power,
        wins: p.wins,
        losses: p.losses,
        winRate,
        ratingScore,
      };
    })
    .sort((a, b) => b.ratingScore - a.ratingScore || a.address.localeCompare(b.address))
    .slice(0, MAX_LEADERBOARD_SIZE)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// --- Explorer Ranking ---

function computeExplorerScore(counts: Readonly<Record<AchievementTier, number>>): number {
  return (
    (counts.legendary ?? 0) * EXPLORER_WEIGHTS.legendary +
    (counts.epic ?? 0) * EXPLORER_WEIGHTS.epic +
    (counts.rare ?? 0) * EXPLORER_WEIGHTS.rare +
    (counts.common ?? 0) * EXPLORER_WEIGHTS.common
  );
}

function computeAchievementCount(counts: Readonly<Record<AchievementTier, number>>): number {
  return (counts.legendary ?? 0) + (counts.epic ?? 0) + (counts.rare ?? 0) + (counts.common ?? 0);
}

export function computeExplorerRanking(
  players: readonly PlayerRecord[],
): readonly ExplorerRankingEntry[] {
  return [...players]
    .map((p) => ({
      address: p.address,
      ...(p.ensName ? { ensName: p.ensName } : {}),
      classId: p.classId,
      power: p.power,
      achievementCount: computeAchievementCount(p.achievementCounts),
      explorerScore: computeExplorerScore(p.achievementCounts),
    }))
    .filter((entry) => entry.explorerScore > 0)
    .sort((a, b) => b.explorerScore - a.explorerScore || a.address.localeCompare(b.address))
    .slice(0, MAX_LEADERBOARD_SIZE)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// --- Utility ---

export function findPlayerRank(
  entries: readonly { readonly address: string }[],
  address: string,
): number | undefined {
  const normalizedAddress = address.toLowerCase();
  const index = entries.findIndex(
    (e) => e.address.toLowerCase() === normalizedAddress,
  );
  return index >= 0 ? index + 1 : undefined;
}
