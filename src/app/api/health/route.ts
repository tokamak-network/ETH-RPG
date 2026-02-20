// GET /api/health — Server health check endpoint
import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';
import { getCounter } from '@/lib/metrics';

interface EnvCheckResult {
  readonly name: string;
  readonly present: boolean;
  readonly required: boolean;
}

function checkEnvVars(): readonly EnvCheckResult[] {
  const hasAiKey = !!(process.env.LITELLM_API_KEY || process.env.ANTHROPIC_API_KEY);
  return [
    { name: 'ALCHEMY_API_KEY', present: !!process.env.ALCHEMY_API_KEY, required: true },
    { name: 'AI_PROVIDER_KEY', present: hasAiKey, required: true },
    { name: 'NEXT_PUBLIC_SITE_URL', present: !!process.env.NEXT_PUBLIC_SITE_URL, required: true },
    { name: 'KV_REST_API_URL', present: !!process.env.KV_REST_API_URL, required: false },
    { name: 'SENTRY_DSN', present: !!process.env.SENTRY_DSN, required: false },
    { name: 'NEXT_PUBLIC_SENTRY_DSN', present: !!process.env.NEXT_PUBLIC_SENTRY_DSN, required: false },
  ];
}

function determineStatus(envChecks: readonly EnvCheckResult[]): 'ok' | 'degraded' {
  const missingRequired = envChecks.some((check) => check.required && !check.present);
  return missingRequired ? 'degraded' : 'ok';
}

export async function GET(): Promise<NextResponse> {
  const cacheStats = getCacheStats();
  const envChecks = checkEnvVars();
  const status = determineStatus(envChecks);

  // Fetch key metrics (non-blocking — returns 0 if KV not configured)
  const [generateTotal, battleTotal] = await Promise.all([
    getCounter('generate_total'),
    getCounter('battle_total'),
  ]);

  const body: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
    cache: {
      size: cacheStats.size,
      hitRate: Math.round(cacheStats.hitRate * 100),
    },
    metrics: {
      totalGenerations: generateTotal,
      totalBattles: battleTotal,
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    body.env = Object.fromEntries(
      envChecks.map((check) => [check.name, check.present]),
    );
  }

  const httpStatus = status === 'ok' ? 200 : 503;
  return NextResponse.json(body, { status: httpStatus });
}
