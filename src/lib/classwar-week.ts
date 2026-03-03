// Class War week lifecycle — pure functions for week creation/expiry
// Uses ISO 8601 weeks (Monday 00:00 UTC as start) for deterministic, global boundaries

import type { ClassWarWeek } from '@/lib/classwar-types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Get the ISO 8601 week number for a given UTC date.
 * ISO weeks start on Monday; week 1 contains the year's first Thursday.
 */
function getISOWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday (ISO 8601 week definition)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / MS_PER_DAY) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * Compute the Monday 00:00 UTC for the ISO week containing a given date.
 */
function getMondayUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

export function getCurrentWeekId(now?: Date): string {
  const date = now ?? new Date();
  const { year, week } = getISOWeekNumber(date);
  return `w${year}-${String(week).padStart(2, '0')}`;
}

export function getWeekBounds(weekId: string): { startedAt: number; endsAt: number } {
  // Parse "w2026-10" -> year=2026, week=10
  const match = weekId.match(/^w(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid weekId format: ${weekId}`);
  }
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Find January 4th of that year (always in ISO week 1), then derive Monday of week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayWeek1 = getMondayUTC(jan4);

  // Target Monday = mondayWeek1 + (week - 1) * 7 days
  const startMs = mondayWeek1.getTime() + (week - 1) * MS_PER_WEEK;

  return {
    startedAt: startMs,
    endsAt: startMs + MS_PER_WEEK,
  };
}

export function createClassWarWeek(weekId: string): ClassWarWeek {
  const { startedAt, endsAt } = getWeekBounds(weekId);
  return {
    weekId,
    startedAt,
    endsAt,
    isActive: true,
  };
}

export function isWeekExpired(week: ClassWarWeek): boolean {
  return Date.now() >= week.endsAt;
}

export interface WeekTimeRemaining {
  readonly days: number;
  readonly hours: number;
  readonly totalMs: number;
}

export function getWeekTimeRemaining(week: ClassWarWeek): WeekTimeRemaining {
  const remaining = Math.max(0, week.endsAt - Date.now());
  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / (60 * 60 * 1000));
  return { days, hours, totalMs: remaining };
}
