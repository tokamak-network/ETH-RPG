// GET /api/ranking/season — Current season info

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSeason } from '@/lib/ranking-store';
import { getSeasonTimeRemaining } from '@/lib/season-manager';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateResult = await checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    return errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.', 429);
  }

  try {
    const season = await getCurrentSeason();

    if (!season) {
      return errorResponse('NO_SEASON', 'No active season found. Rankings have not been initialized.', 404);
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
