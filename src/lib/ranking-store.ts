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

// --- Key patterns ---

const CURRENT_SEASON_KEY = 'ranking:current_season';

function seasonKey(id: string): string {
  return `ranking:season:${id}`;
}

function playerKey(address: string): string {
  return `ranking:player:${address.toLowerCase()}`;
}

function battleListKey(seasonId: string, address: string): string {
  return `ranking:battles:${seasonId}:${address.toLowerCase()}`;
}

function leaderboardKey(seasonId: string, type: LeaderboardType): string {
  return `ranking:leaderboard:${seasonId}:${type}`;
}

const PLAYER_INDEX_KEY = 'ranking:player_index';

// --- KV availability check ---

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

export async function upsertPlayerRecord(record: PlayerRecord): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await kv.set(playerKey(record.address), record);
    // Add to player index set
    await kv.sadd(PLAYER_INDEX_KEY, record.address.toLowerCase());
  } catch {
    // Silently fail
  }
}

export async function getPlayerRecord(address: string): Promise<PlayerRecord | null> {
  if (!isKvConfigured()) return null;
  try {
    return await kv.get<PlayerRecord>(playerKey(address));
  } catch {
    return null;
  }
}

export async function getAllPlayerAddresses(): Promise<readonly string[]> {
  if (!isKvConfigured()) return [];
  try {
    const members = await kv.smembers<string[]>(PLAYER_INDEX_KEY);
    return members ?? [];
  } catch {
    return [];
  }
}

export async function getAllPlayerRecords(): Promise<readonly PlayerRecord[]> {
  if (!isKvConfigured()) return [];
  try {
    const addresses = await getAllPlayerAddresses();
    if (addresses.length === 0) return [];

    const keys = addresses.map((addr) => playerKey(addr));
    const records = await kv.mget<(PlayerRecord | null)[]>(...keys);
    return (records ?? []).filter((r): r is PlayerRecord => r !== null);
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
