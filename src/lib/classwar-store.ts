// Class War KV store — Vercel KV (Redis) backed
// Logs errors for operational visibility (no silent failures)

import { kv } from '@vercel/kv';
import type { CharacterClassId } from '@/lib/types';
import { ALL_CLASS_IDS } from '@/lib/classwar-types';
import type { ClassWarWeek, ClassWarStandings, ClassWarResult } from '@/lib/classwar-types';
import { isKvConfigured } from '@/lib/kv-utils';

// --- Key patterns ---

const CURRENT_WEEK_KEY = 'classwar:current_week';

function weekKey(weekId: string): string {
  return `classwar:week:${weekId}`;
}

function scoreKey(weekId: string, classId: CharacterClassId): string {
  return `classwar:score:${weekId}:${classId}`;
}

function battleCountKey(weekId: string, classId: CharacterClassId): string {
  return `classwar:battles:${weekId}:${classId}`;
}

function standingsSnapshotKey(weekId: string): string {
  return `classwar:standings:${weekId}`;
}

function buffKey(weekId: string): string {
  return `classwar:buff:${weekId}`;
}

const HISTORY_KEY = 'classwar:history';

// TTL: 8 days (7-day week + 1 day buffer for cron to finalize)
const SCORE_TTL_SECONDS = 8 * 24 * 60 * 60;
// TTL: 30 days for snapshots (history viewing)
const SNAPSHOT_TTL_SECONDS = 30 * 24 * 60 * 60;
// Max weeks in history ring buffer
const MAX_HISTORY_WEEKS = 12;

// --- Error logging helper ---

function logKvError(operation: string, err: unknown): void {
  console.error(`[ClassWar] KV ${operation} failed:`, err);
}

// --- Structural validation ---

function isValidClassWarResult(value: unknown): value is ClassWarResult {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.weekId === 'string' &&
    typeof obj.winnerClassId === 'string' &&
    Array.isArray(obj.scores) &&
    typeof obj.totalBattles === 'number' &&
    typeof obj.endedAt === 'number'
  );
}

// --- Week operations ---

export async function getCurrentClassWarWeek(): Promise<ClassWarWeek | null> {
  if (!isKvConfigured()) return null;
  try {
    const id = await kv.get<string>(CURRENT_WEEK_KEY);
    if (!id) return null;
    return await kv.get<ClassWarWeek>(weekKey(id));
  } catch (err) {
    logKvError('getCurrentClassWarWeek', err);
    return null;
  }
}

export async function saveClassWarWeek(week: ClassWarWeek): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(weekKey(week.weekId), week);
    await kv.set(CURRENT_WEEK_KEY, week.weekId);
  } catch (err) {
    logKvError('saveClassWarWeek', err);
  }
}

export async function updateClassWarWeek(week: ClassWarWeek): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(weekKey(week.weekId), week);
  } catch (err) {
    logKvError('updateClassWarWeek', err);
  }
}

// --- Score operations ---

export async function incrementClassScore(
  weekId: string,
  classId: CharacterClassId,
  points: number,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const key = scoreKey(weekId, classId);
    await kv.incrby(key, points);
    // Set TTL only if it wasn't set yet (first increment for this key)
    const ttl = await kv.ttl(key);
    if (ttl < 0) {
      await kv.expire(key, SCORE_TTL_SECONDS);
    }
  } catch (err) {
    logKvError('incrementClassScore', err);
  }
}

export async function incrementBattleCount(
  weekId: string,
  classId: CharacterClassId,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const key = battleCountKey(weekId, classId);
    await kv.incrby(key, 1);
    const ttl = await kv.ttl(key);
    if (ttl < 0) {
      await kv.expire(key, SCORE_TTL_SECONDS);
    }
  } catch (err) {
    logKvError('incrementBattleCount', err);
  }
}

/**
 * Fetch all 8 class scores and battle counts for a given week.
 * Returns maps keyed by classId (immutable).
 */
export async function getAllClassScoresAndCounts(weekId: string): Promise<{
  scoreMap: Readonly<Record<string, number>>;
  battleCountMap: Readonly<Record<string, number>>;
}> {
  const emptyResult = { scoreMap: {}, battleCountMap: {} };
  if (!isKvConfigured()) return emptyResult;
  try {
    const scoreKeys = ALL_CLASS_IDS.map((id) => scoreKey(weekId, id));
    const countKeys = ALL_CLASS_IDS.map((id) => battleCountKey(weekId, id));

    const [scoreResults, countResults] = await Promise.all([
      kv.mget<(number | null)[]>(...scoreKeys),
      kv.mget<(number | null)[]>(...countKeys),
    ]);

    const safeScores = scoreResults ?? [];
    const safeCounts = countResults ?? [];

    const scoreMap: Readonly<Record<string, number>> = Object.fromEntries(
      ALL_CLASS_IDS.map((classId, i) => [classId, safeScores[i] ?? 0]),
    );
    const battleCountMap: Readonly<Record<string, number>> = Object.fromEntries(
      ALL_CLASS_IDS.map((classId, i) => [classId, safeCounts[i] ?? 0]),
    );

    return { scoreMap, battleCountMap };
  } catch (err) {
    logKvError('getAllClassScoresAndCounts', err);
    return emptyResult;
  }
}

// --- Standings snapshot ---

export async function setStandingsSnapshot(
  weekId: string,
  standings: ClassWarStandings,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(standingsSnapshotKey(weekId), standings, { ex: SNAPSHOT_TTL_SECONDS });
  } catch (err) {
    logKvError('setStandingsSnapshot', err);
  }
}

export async function getStandingsSnapshot(
  weekId: string,
): Promise<ClassWarStandings | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<ClassWarStandings>(standingsSnapshotKey(weekId));
  } catch (err) {
    logKvError('getStandingsSnapshot', err);
    return null;
  }
}

// --- Buff operations ---

export async function setWeekBuff(
  weekId: string,
  classId: CharacterClassId,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(buffKey(weekId), classId, { ex: SCORE_TTL_SECONDS });
  } catch (err) {
    logKvError('setWeekBuff', err);
  }
}

export async function getWeekBuff(weekId: string): Promise<CharacterClassId | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<CharacterClassId>(buffKey(weekId));
  } catch (err) {
    logKvError('getWeekBuff', err);
    return null;
  }
}

// --- History operations ---

export async function recordClassWarResult(result: ClassWarResult): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.lpush(HISTORY_KEY, JSON.stringify(result));
    await kv.ltrim(HISTORY_KEY, 0, MAX_HISTORY_WEEKS - 1);
  } catch (err) {
    logKvError('recordClassWarResult', err);
  }
}

export async function getClassWarHistory(): Promise<readonly ClassWarResult[]> {
  if (!isKvConfigured()) return [];
  try {
    const raw = await kv.lrange<string>(HISTORY_KEY, 0, MAX_HISTORY_WEEKS - 1);
    return (raw ?? []).reduce<ClassWarResult[]>((acc, item) => {
      try {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
        if (isValidClassWarResult(parsed)) {
          return [...acc, parsed];
        }
        console.error('[ClassWar] Invalid history entry, skipping:', parsed);
        return acc;
      } catch {
        return acc;
      }
    }, []);
  } catch (err) {
    logKvError('getClassWarHistory', err);
    return [];
  }
}
