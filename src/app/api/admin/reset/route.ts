// POST /api/admin/reset — Reset metrics counters
// Query: ?keys=error_empty_wallet,error_api (selective) or omit for full reset
// Protected by ADMIN_SECRET via Authorization header

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { safeCompare, isKvConfigured } from '@/lib/kv-utils';

const KV_PREFIX = 'metrics:';

const ALL_COUNTER_KEYS = new Set([
  'generate_total', 'generate_cached', 'generate_fresh',
  'battle_total', 'battle_cached',
  'share_twitter', 'share_farcaster', 'share_clipboard',
  'error_api', 'error_rate_limit', 'error_invalid_address',
  'error_no_transactions', 'error_empty_wallet',
  'funnel_landing', 'funnel_input_focus', 'funnel_generate_start',
  'funnel_generate_success', 'funnel_share', 'og_image_load',
]);

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
    const keysParam = request.nextUrl.searchParams.get('keys');
    const selective = keysParam !== null;

    let keysToDelete: string[];

    if (selective) {
      // Selective reset: only specified counter keys + their unique_error sets
      const requested = keysParam.split(',').map((k) => k.trim()).filter((k) => ALL_COUNTER_KEYS.has(k));
      if (requested.length === 0) {
        return NextResponse.json(
          { error: { code: 'INVALID_KEYS', message: `Valid keys: ${[...ALL_COUNTER_KEYS].join(', ')}` } },
          { status: 400 },
        );
      }
      keysToDelete = requested.flatMap((key) => [
        `${KV_PREFIX}counter:${key}`,
        `${KV_PREFIX}unique_error:${key.replace('error_', '')}`,
      ]);
    } else {
      // Full reset
      keysToDelete = [
        ...[...ALL_COUNTER_KEYS].map((key) => `${KV_PREFIX}counter:${key}`),
        `${KV_PREFIX}events`,
        `${KV_PREFIX}class_distribution`,
      ];
    }

    await kv.del(...keysToDelete);

    return NextResponse.json({
      success: true,
      mode: selective ? 'selective' : 'full',
      deletedKeys: keysToDelete,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'RESET_FAILED', message: 'Failed to reset metrics.' } },
      { status: 500 },
    );
  }
}
