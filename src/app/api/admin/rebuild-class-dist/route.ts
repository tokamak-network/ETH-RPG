// POST /api/admin/rebuild-class-dist — Rebuild class distribution from player records
// Replaces class_distribution and class_by_address with accurate unique-address counts
// Optional: ?reset=error_empty_wallet (comma-separated counter keys to reset)
// Protected by ADMIN_SECRET via Authorization header

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { safeCompare, isKvConfigured } from '@/lib/kv-utils';
import { getCurrentSeason, getAllPlayerRecords } from '@/lib/ranking-store';

const KV_PREFIX = 'metrics:';
const CLASS_DIST_KEY = `${KV_PREFIX}class_distribution`;
const CLASS_BY_ADDR_KEY = `${KV_PREFIX}class_by_address`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!adminSecret || !token || !safeCompare(token, adminSecret)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid admin key.' } },
      { status: 401 },
    );
  }

  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: { code: 'KV_NOT_CONFIGURED', message: 'Vercel KV is not configured.' } },
      { status: 503 },
    );
  }

  try {
    const season = await getCurrentSeason();
    if (!season) {
      return NextResponse.json(
        { error: { code: 'NO_SEASON', message: 'No active season found.' } },
        { status: 404 },
      );
    }

    const players = await getAllPlayerRecords(season.id);

    // Build fresh maps from player records
    const classCounts: Record<string, number> = {};
    const addressMap: Record<string, string> = {};

    for (const player of players) {
      const addr = player.address.toLowerCase();
      addressMap[addr] = player.classId;
      classCounts[player.classId] = (classCounts[player.classId] ?? 0) + 1;
    }

    // Clear old data and write fresh
    await kv.del(CLASS_DIST_KEY, CLASS_BY_ADDR_KEY);

    const ops: Promise<unknown>[] = [];

    if (Object.keys(classCounts).length > 0) {
      ops.push(kv.hset(CLASS_DIST_KEY, classCounts));
    }
    if (Object.keys(addressMap).length > 0) {
      ops.push(kv.hset(CLASS_BY_ADDR_KEY, addressMap));
    }

    // Optional: reset specific counters + their unique tracking sets
    const resetParam = request.nextUrl.searchParams.get('reset');
    const resetKeys: string[] = [];
    if (resetParam) {
      const keys = resetParam.split(',').map((k) => k.trim()).filter(Boolean);
      for (const key of keys) {
        resetKeys.push(`${KV_PREFIX}counter:${key}`);
        // Also clear the unique_error tracking set (e.g. error_empty_wallet -> empty_wallet)
        const errorType = key.replace('error_', '');
        resetKeys.push(`${KV_PREFIX}unique_error:${errorType}`);
      }
      if (resetKeys.length > 0) {
        ops.push(kv.del(...resetKeys));
      }
    }

    await Promise.all(ops);

    return NextResponse.json({
      success: true,
      season: season.id,
      totalPlayers: players.length,
      classDistribution: classCounts,
      ...(resetKeys.length > 0 ? { resetKeys } : {}),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'REBUILD_FAILED', message: 'Failed to rebuild class distribution.' } },
      { status: 500 },
    );
  }
}
