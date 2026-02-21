// GET /api/admin/metrics — Admin metrics snapshot endpoint
// Protected by ADMIN_SECRET via Authorization header

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSnapshot } from '@/lib/metrics';
import { safeCompare } from '@/lib/kv-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateResult = await checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    return errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.', 429);
  }

  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!adminSecret || !token || !safeCompare(token, adminSecret)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid admin key.' } },
      { status: 401 },
    );
  }

  const snapshot = await getMetricsSnapshot();

  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'private, no-cache' },
  });
}
