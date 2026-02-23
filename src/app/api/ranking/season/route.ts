// GET /api/ranking/season — Current season info

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSeason } from '@/lib/ranking-store';
import { getSeasonTimeRemaining } from '@/lib/season-manager';
import { errorResponse } from '@/lib/route-utils';

// No rate limiting — read-only, CDN-cached (s-maxage=300), no expensive ops
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const season = await getCurrentSeason();

    if (!season) {
      return NextResponse.json({ season: null, remaining: null }, {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
      });
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
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch season info.', 500);
  }
}
