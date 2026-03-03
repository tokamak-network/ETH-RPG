// GET /api/classwar/standings — Current Class War standings
// Public, CDN-cached for 2 minutes (standings change with every battle)

import { NextResponse } from 'next/server';
import { getCurrentWeekId, createClassWarWeek } from '@/lib/classwar-week';
import { buildClassScores, computeClassWarStandings } from '@/lib/classwar-engine';
import {
  getStandingsSnapshot,
  getCurrentClassWarWeek,
  getAllClassScoresAndCounts,
  getWeekBuff,
} from '@/lib/classwar-store';

export async function GET(): Promise<NextResponse> {
  try {
    const currentWeekId = getCurrentWeekId();

    // Try cached snapshot first
    const snapshot = await getStandingsSnapshot(currentWeekId);
    if (snapshot) {
      return NextResponse.json(snapshot, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
      });
    }

    // No snapshot — compute live (first request before cron runs)
    const week = await getCurrentClassWarWeek() ?? createClassWarWeek(currentWeekId);
    const { scoreMap, battleCountMap } = await getAllClassScoresAndCounts(currentWeekId);
    const scores = buildClassScores(scoreMap, battleCountMap);
    const buffClassId = await getWeekBuff(currentWeekId);
    const standings = computeClassWarStandings(week, scores, buffClassId);

    return NextResponse.json(standings, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'CLASSWAR_ERROR', message: 'Failed to fetch Class War standings.' } },
      { status: 500 },
    );
  }
}
