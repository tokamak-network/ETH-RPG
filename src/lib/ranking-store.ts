// Ranking data store — Vercel KV (Redis) backed
// All ranking data persists across deploys and instances

import { kv } from '@vercel/kv';
import type {
  Season,
  PlayerRecord,
  BattleRecord,
  LeaderboardType,
  LeaderboardResponse,
} from '@/lib/types';
import { isKvConfigured } from '@/lib/kv-utils';

// --- Key patterns ---

const CURRENT_SEASON_KEY = 'ranking:current_season';

function seasonKey(id: string): string {
  return `ranking:season:${id}`;
}

function playerKey(seasonId: string, address: string): string {
  return `ranking:player:${seasonId}:${address.toLowerCase()}`;
}

function battleListKey(seasonId: string, address: string): string {
  return `ranking:battles:${seasonId}:${address.toLowerCase()}`;
}

function leaderboardKey(seasonId: string, type: LeaderboardType): string {
  return `ranking:leaderboard:${seasonId}:${type}`;
}

function playerIndexKey(seasonId: string): string {
  return `ranking:player_index:${seasonId}`;
}

// --- Season operations ---

export async function getCurrentSeason(): Promise<Season | null> {
  if (!isKvConfigured()) return null;
  try {
    const seasonId = await kv.get<string>(CURRENT_SEASON_KEY);
    if (!seasonId) return null;
    return await kv.get<Season>(seasonKey(seasonId));
  } catch {
    return null;
  }
}

export async function createSeason(season: Season): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(seasonKey(season.id), season);
    await kv.set(CURRENT_SEASON_KEY, season.id);
  } catch {
    // Silently fail
  }
}

export async function updateSeason(season: Season): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(seasonKey(season.id), season);
  } catch {
    // Silently fail
  }
}

export async function getSeason(id: string): Promise<Season | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<Season>(seasonKey(id));
  } catch {
    return null;
  }
}

// --- Player record operations ---

export async function upsertPlayerRecord(seasonId: string, record: PlayerRecord): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(playerKey(seasonId, record.address), record);
    await kv.sadd(playerIndexKey(seasonId), record.address.toLowerCase());
  } catch {
    // Silently fail
  }
}

export async function getPlayerRecord(seasonId: string, address: string): Promise<PlayerRecord | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<PlayerRecord>(playerKey(seasonId, address));
  } catch {
    return null;
  }
}

// Lua script: atomically read existing wins/losses, increment, merge with new metadata, write back.
// Prevents race condition when two concurrent battles involve the same player.
const ATOMIC_UPSERT_SCRIPT = `
local existing = redis.call('GET', KEYS[1])
local wins = 0
local losses = 0
if existing then
  local old = cjson.decode(existing)
  wins = old.wins or 0
  losses = old.losses or 0
end
local record = cjson.decode(ARGV[1])
if ARGV[2] == "1" then
  record.wins = wins + 1
  record.losses = losses
else
  record.wins = wins
  record.losses = losses + 1
end
redis.call('SET', KEYS[1], cjson.encode(record))
redis.call('SADD', KEYS[2], ARGV[3])
return 1
`;

export async function atomicRecordBattleResult(
  seasonId: string,
  baseRecord: PlayerRecord,
  won: boolean,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const key = playerKey(seasonId, baseRecord.address);
    const indexKey = playerIndexKey(seasonId);
    await kv.eval(
      ATOMIC_UPSERT_SCRIPT,
      [key, indexKey],
      [JSON.stringify(baseRecord), won ? '1' : '0', baseRecord.address.toLowerCase()],
    );
  } catch {
    // Silently fail
  }
}

export async function getAllPlayerRecords(seasonId: string): Promise<readonly PlayerRecord[]> {
  if (!isKvConfigured()) return [];
  try {
    const records: PlayerRecord[] = [];
    let cursor: string | number = '0';
    let iterations = 0;
    do {
      const [nextCursor, batch] = await kv.sscan(playerIndexKey(seasonId), cursor, { count: 100 });
      cursor = nextCursor;
      if (batch.length > 0) {
        const keys = batch.map((addr) => playerKey(seasonId, String(addr)));
        const results = await kv.mget<(PlayerRecord | null)[]>(...keys);
        records.push(...(results ?? []).filter((r): r is PlayerRecord => r !== null));
      }
      if (++iterations > 5000) break;
    } while (cursor !== '0');
    return records;
  } catch {
    return [];
  }
}

// --- Battle record operations ---

export async function recordBattleOutcome(record: BattleRecord): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const key = battleListKey(record.seasonId, record.address);
    await kv.lpush(key, JSON.stringify(record));
    // Keep last 200 battles per player per season
    await kv.ltrim(key, 0, 199);
  } catch {
    // Silently fail
  }
}

export async function getBattleRecords(
  seasonId: string,
  address: string,
): Promise<readonly BattleRecord[]> {
  if (!isKvConfigured()) return [];
  try {
    const raw = await kv.lrange<string>(battleListKey(seasonId, address), 0, 199);
    return (raw ?? []).map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as BattleRecord;
      }
      return item as unknown as BattleRecord;
    });
  } catch {
    return [];
  }
}

// --- Leaderboard snapshot operations ---

export async function setLeaderboardSnapshot(
  seasonId: string,
  type: LeaderboardType,
  snapshot: LeaderboardResponse,
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(leaderboardKey(seasonId, type), snapshot);
  } catch {
    // Silently fail
  }
}

export async function getLeaderboardSnapshot(
  seasonId: string,
  type: LeaderboardType,
): Promise<LeaderboardResponse | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<LeaderboardResponse>(leaderboardKey(seasonId, type));
  } catch {
    return null;
  }
}
