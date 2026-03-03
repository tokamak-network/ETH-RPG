// GET /api/classwar/history — Past Class War week results
// Public, CDN-cached for 1 hour (historical data changes infrequently)

import { NextResponse } from 'next/server';
import { getClassWarHistory } from '@/lib/classwar-store';

export async function GET(): Promise<NextResponse> {
  try {
    const weeks = await getClassWarHistory();
    return NextResponse.json({ weeks }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'CLASSWAR_ERROR', message: 'Failed to fetch Class War history.' } },
      { status: 500 },
    );
  }
}
