// Server-side metrics module — Vercel KV counters + event ring buffer
// Falls back to no-op when KV is not configured (local dev)

import { kv } from '@vercel/kv';
import type { CharacterClassId } from '@/lib/types';

// --- Constants ---

const EVENT_RING_BUFFER_SIZE = 100;
const KV_PREFIX = 'metrics:';
const EVENTS_KEY = `${KV_PREFIX}events`;
const CLASS_DIST_KEY = `${KV_PREFIX}class_distribution`;
const HOURLY_PREFIX = `${KV_PREFIX}hourly:`;

// --- Types ---

export interface MetricEvent {
  readonly name: string;
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
  readonly timestamp: number;
}

export interface MetricsSnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly classDistribution: Readonly<Record<string, number>>;
  readonly recentEvents: readonly MetricEvent[];
  readonly hourlyActivity: readonly HourlyBucket[];
  readonly snapshotAt: number;
}

export interface HourlyBucket {
  readonly hour: string; // ISO hour like "2026-02-20T14"
  readonly count: number;
}

// --- KV availability check ---

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- Counter operations ---

export async function incrementCounter(key: string): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.incr(`${KV_PREFIX}counter:${key}`);
  } catch {
    // Silently fail — metrics should never break the app
  }
}

export async function getCounter(key: string): Promise<number> {
  if (!isKvConfigured()) return 0;
  try {
    const value = await kv.get<number>(`${KV_PREFIX}counter:${key}`);
    return value ?? 0;
  } catch {
    return 0;
  }
}

// --- Class distribution ---

export async function incrementClassCount(classId: CharacterClassId): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.hincrby(CLASS_DIST_KEY, classId, 1);
  } catch {
    // Silently fail
  }
}

// --- Event ring buffer ---

export async function recordEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const event: MetricEvent = {
      name,
      ...(properties ? { properties } : {}),
      timestamp: Date.now(),
    };
    await kv.lpush(EVENTS_KEY, JSON.stringify(event));
    await kv.ltrim(EVENTS_KEY, 0, EVENT_RING_BUFFER_SIZE - 1);
  } catch {
    // Silently fail
  }
}

// --- Hourly activity tracking ---

export async function incrementHourlyActivity(): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const hourKey = new Date().toISOString().slice(0, 13); // "2026-02-20T14"
    const fullKey = `${HOURLY_PREFIX}${hourKey}`;
    await kv.incr(fullKey);
    // Expire after 96 hours to keep storage bounded
    await kv.expire(fullKey, 96 * 3600);
  } catch {
    // Silently fail
  }
}

// --- Snapshot (for admin dashboard) ---

export async function getMetricsSnapshot(): Promise<MetricsSnapshot> {
  if (!isKvConfigured()) {
    return {
      counters: {},
      classDistribution: {},
      recentEvents: [],
      hourlyActivity: [],
      snapshotAt: Date.now(),
    };
  }

  try {
    // Fetch all counter keys
    const counterKeys = [
      'generate_total', 'generate_cached', 'generate_fresh',
      'battle_total', 'battle_cached',
      'share_twitter', 'share_farcaster', 'share_clipboard',
      'error_api', 'error_rate_limit', 'error_invalid_address',
      'error_no_transactions', 'error_empty_wallet',
      'funnel_landing', 'funnel_input_focus', 'funnel_generate_start',
      'funnel_generate_success', 'funnel_share',
    ];

    const counterPromises = counterKeys.map(async (key) => {
      const value = await kv.get<number>(`${KV_PREFIX}counter:${key}`);
      return [key, value ?? 0] as const;
    });

    // Fetch class distribution
    const classDistPromise = kv.hgetall<Record<string, number>>(CLASS_DIST_KEY);

    // Fetch recent events
    const eventsPromise = kv.lrange<string>(EVENTS_KEY, 0, EVENT_RING_BUFFER_SIZE - 1);

    // Fetch hourly activity (last 72 hours)
    const now = new Date();
    const hourlyKeys: string[] = [];
    for (let i = 0; i < 72; i++) {
      const d = new Date(now.getTime() - i * 3600_000);
      hourlyKeys.push(d.toISOString().slice(0, 13));
    }

    const hourlyPromises = hourlyKeys.map(async (hourKey) => {
      const value = await kv.get<number>(`${HOURLY_PREFIX}${hourKey}`);
      return { hour: hourKey, count: value ?? 0 };
    });

    const [counterResults, classDistribution, rawEvents, hourlyResults] = await Promise.all([
      Promise.all(counterPromises),
      classDistPromise,
      eventsPromise,
      Promise.all(hourlyPromises),
    ]);

    const counters = Object.fromEntries(counterResults);

    const recentEvents: MetricEvent[] = (rawEvents ?? []).map((raw) => {
      if (typeof raw === 'string') {
        return JSON.parse(raw) as MetricEvent;
      }
      return raw as unknown as MetricEvent;
    });

    // Hourly activity: reverse to chronological order
    const hourlyActivity = [...hourlyResults].reverse();

    return {
      counters,
      classDistribution: classDistribution ?? {},
      recentEvents,
      hourlyActivity,
      snapshotAt: Date.now(),
    };
  } catch {
    return {
      counters: {},
      classDistribution: {},
      recentEvents: [],
      hourlyActivity: [],
      snapshotAt: Date.now(),
    };
  }
}

// --- Convenience: record common events ---

export async function trackGenerate(classId: CharacterClassId, cached: boolean): Promise<void> {
  await Promise.all([
    incrementCounter('generate_total'),
    incrementCounter(cached ? 'generate_cached' : 'generate_fresh'),
    incrementClassCount(classId),
    incrementHourlyActivity(),
    recordEvent('generate', { classId, cached }),
  ]);
}

export async function trackBattle(cached: boolean): Promise<void> {
  await Promise.all([
    incrementCounter('battle_total'),
    ...(cached ? [incrementCounter('battle_cached')] : []),
    incrementHourlyActivity(),
    recordEvent('battle', { cached }),
  ]);
}

export async function trackShare(platform: string): Promise<void> {
  await Promise.all([
    incrementCounter(`share_${platform}`),
    incrementCounter('funnel_share'),
    recordEvent('share', { platform }),
  ]);
}

export async function trackError(type: string): Promise<void> {
  await Promise.all([
    incrementCounter(`error_${type}`),
    recordEvent('error', { type }),
  ]);
}

export async function trackFunnel(step: string): Promise<void> {
  await incrementCounter(`funnel_${step}`);
}
