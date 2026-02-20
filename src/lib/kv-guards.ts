// Runtime type guards for KV-stored data (replaces unsafe `as` casts)

import type { MetricEvent } from '@/lib/metrics';
import type { BattleRecord } from '@/lib/types';

/** Validate that raw KV data is a MetricEvent. */
export function isMetricEvent(raw: unknown): raw is MetricEvent {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return typeof obj.name === 'string' && typeof obj.timestamp === 'number';
}

/** Validate that raw KV data is a BattleRecord. */
export function isBattleRecord(raw: unknown): raw is BattleRecord {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.seasonId === 'string' &&
    typeof obj.address === 'string' &&
    typeof obj.opponentAddress === 'string' &&
    typeof obj.won === 'boolean' &&
    typeof obj.power === 'number' &&
    typeof obj.opponentPower === 'number' &&
    typeof obj.nonce === 'string' &&
    typeof obj.recordedAt === 'number'
  );
}
