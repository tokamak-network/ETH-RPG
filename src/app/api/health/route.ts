// GET /api/health — Server health check endpoint
import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';

export async function GET(): Promise<NextResponse> {
  const cacheStats = getCacheStats();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      size: cacheStats.size,
      hitRate: Math.round(cacheStats.hitRate * 100),
    },
    env: {
      alchemy: !!process.env.ALCHEMY_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'not set',
    },
  });
}
