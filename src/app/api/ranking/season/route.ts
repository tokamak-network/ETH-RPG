// GET /api/ranking/season — Current season info

import { NextResponse } from 'next/server';
import { getCurrentSeason } from '@/lib/ranking-store';
import { getSeasonTimeRemaining } from '@/lib/season-manager';

export async function GET(): Promise<NextResponse> {
  try {
    const season = await getCurrentSeason();

    if (!season) {
      return NextResponse.json(
        { error: { code: 'NO_SEASON', message: 'No active season found. Rankings have not been initialized.' } },
        { status: 404 },
      );
    }

    const remaining = getSeasonTimeRemaining(season);

    return NextResponse.json({
      season,
      remaining: {
        days: remaining.days,
        hours: remaining.hours,
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch season info.' } },
      { status: 500 },
    );
  }
}
