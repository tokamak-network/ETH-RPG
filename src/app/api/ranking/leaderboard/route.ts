// GET /api/ranking/leaderboard — Public leaderboard endpoint
// Query: type=power|battle|explorer, season? (default: current), address? (for player rank), page?, limit?

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardSnapshot, getCurrentSeason } from '@/lib/ranking-store';
import { findPlayerRank } from '@/lib/ranking-engine';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';
import type { LeaderboardType, LeaderboardResponse } from '@/lib/types';

const VALID_TYPES = new Set<LeaderboardType>(['power', 'battle', 'explorer']);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const clientIp = getClientIp(request);
  const rateResult = await checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    return errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.', 429);
  }

  // Parse type
  const typeParam = searchParams.get('type') ?? 'power';
  if (!VALID_TYPES.has(typeParam as LeaderboardType)) {
    return errorResponse('INVALID_TYPE', 'Type must be power, battle, or explorer.', 400);
  }
  const type = typeParam as LeaderboardType;

  // Get season
  const season = await getCurrentSeason();
  if (!season) {
    return errorResponse('NO_SEASON', 'No active season found.', 404);
  }

  const seasonParam = searchParams.get('season');
  const seasonIdPattern = /^s\d{1,4}$/;
  const seasonId = seasonParam && seasonIdPattern.test(seasonParam)
    ? seasonParam
    : season.id;

  // Get cached snapshot
  const snapshot = await getLeaderboardSnapshot(seasonId, type);
  if (!snapshot) {
    // Return empty leaderboard
    const emptyResponse: LeaderboardResponse = {
      season,
      type,
      updatedAt: Date.now(),
      entries: [],
      totalPlayers: 0,
    };
    return NextResponse.json(emptyResponse, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  }

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );
  const startIndex = (page - 1) * limit;
  const paginatedEntries = snapshot.entries.slice(startIndex, startIndex + limit);

  // Player rank lookup
  const addressParam = searchParams.get('address');
  const playerRank = addressParam
    ? findPlayerRank(snapshot.entries, addressParam)
    : undefined;

  const response: LeaderboardResponse = {
    season: snapshot.season,
    type: snapshot.type,
    updatedAt: snapshot.updatedAt,
    entries: paginatedEntries,
    totalPlayers: snapshot.totalPlayers,
    ...(playerRank !== undefined ? { playerRank } : {}),
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
  });
}
