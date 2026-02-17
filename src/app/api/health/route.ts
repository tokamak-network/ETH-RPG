// GET /api/health — Server health check endpoint
import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';

export async function GET(): Promise<NextResponse> {
  const cacheStats = getCacheStats();
  const isProduction = process.env.NODE_ENV === 'production';

  const body: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      size: cacheStats.size,
      hitRate: Math.round(cacheStats.hitRate * 100),
    },
  };

  if (!isProduction) {
    body.env = {
      alchemy: !!process.env.ALCHEMY_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'not set',
    };
  }

  return NextResponse.json(body);
}
