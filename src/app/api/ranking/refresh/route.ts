// GET /api/ranking/refresh — Vercel Cron endpoint (30-min intervals)
// 1. Check season expiry -> create new season if needed
// 2. Recompute all 3 leaderboards from PlayerRecords
// 3. Save snapshots to KV

import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentSeason,
  createSeason,
  updateSeason,
  getAllPlayerRecords,
  setLeaderboardSnapshot,
} from '@/lib/ranking-store';
import {
  computePowerRanking,
  computeBattleRanking,
  computeExplorerRanking,
} from '@/lib/ranking-engine';
import {
  createNewSeason,
  isSeasonExpired,
  endSeason,
} from '@/lib/season-manager';
import { safeCompare } from '@/lib/kv-utils';
import type { LeaderboardResponse, LeaderboardType, RankingEntry } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret (Vercel sends as Authorization: Bearer <secret>)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!cronSecret || !token || !safeCompare(token, cronSecret)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret.' } },
      { status: 401 },
    );
  }

  try {
    // 1. Season management
    let currentSeason = await getCurrentSeason();

    if (!currentSeason) {
      // First run ever — create genesis season
      currentSeason = createNewSeason();
      await createSeason(currentSeason);
    } else if (isSeasonExpired(currentSeason)) {
      // End current season and create new one
      const ended = endSeason(currentSeason);
      await updateSeason(ended);
      currentSeason = createNewSeason(ended);
      await createSeason(currentSeason);
    }

    // Capture as const for closure narrowing
    const season = currentSeason;

    // 2. Fetch all player records (season-scoped)
    const players = await getAllPlayerRecords(season.id);

    // 3. Compute leaderboards
    const powerEntries = computePowerRanking(players);
    const battleEntries = computeBattleRanking(players);
    const explorerEntries = computeExplorerRanking(players);

    const now = Date.now();

    function buildSnapshot(type: LeaderboardType, entries: readonly RankingEntry[]): LeaderboardResponse {
      return {
        season,
        type,
        updatedAt: now,
        entries,
        totalPlayers: players.length,
      };
    }

    // 4. Save snapshots
    await Promise.all([
      setLeaderboardSnapshot(season.id, 'power', buildSnapshot('power', powerEntries)),
      setLeaderboardSnapshot(season.id, 'battle', buildSnapshot('battle', battleEntries)),
      setLeaderboardSnapshot(season.id, 'explorer', buildSnapshot('explorer', explorerEntries)),
    ]);

    return NextResponse.json({
      ok: true,
      season: season.id,
      counts: {
        totalPlayers: players.length,
        powerRanked: powerEntries.length,
        battleRanked: battleEntries.length,
        explorerRanked: explorerEntries.length,
      },
      refreshedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'REFRESH_FAILED', message } },
      { status: 500 },
    );
  }
}
