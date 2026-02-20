// Season lifecycle management — pure functions for season creation/expiry

import type { Season } from '@/lib/types';

const SEASON_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const SEASON_NAMES: readonly string[] = [
  'Genesis Season',
  'Ascension',
  'The Convergence',
  'Shattered Realms',
  'Eternal Flame',
  'Void Rising',
  'Chain of Legends',
  'Dark Epoch',
] as const;

export function createNewSeason(previous?: Season): Season {
  const number = previous ? previous.number + 1 : 1;
  const now = Date.now();

  return {
    id: `s${number}`,
    number,
    name: SEASON_NAMES[(number - 1) % SEASON_NAMES.length],
    startedAt: now,
    endsAt: now + SEASON_DURATION_MS,
    isActive: true,
  };
}

export function isSeasonExpired(season: Season): boolean {
  return Date.now() >= season.endsAt;
}

export function endSeason(season: Season): Season {
  return {
    ...season,
    isActive: false,
  };
}

export interface SeasonTimeRemaining {
  readonly days: number;
  readonly hours: number;
  readonly totalMs: number;
}

export function getSeasonTimeRemaining(season: Season): SeasonTimeRemaining {
  const remaining = Math.max(0, season.endsAt - Date.now());
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return { days, hours, totalMs: remaining };
}

export function getSeasonDurationMs(): number {
  return SEASON_DURATION_MS;
}
