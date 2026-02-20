// Unit tests for season manager — pure functions, no mocking needed

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createNewSeason,
  isSeasonExpired,
  endSeason,
  getSeasonTimeRemaining,
} from '@/lib/season-manager';
import type { Season } from '@/lib/types';

describe('createNewSeason', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates genesis season when no previous exists', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const season = createNewSeason();

    expect(season.id).toBe('s1');
    expect(season.number).toBe(1);
    expect(season.name).toBe('Genesis Season');
    expect(season.isActive).toBe(true);
    expect(season.startedAt).toBe(new Date('2026-01-01T00:00:00Z').getTime());
    // 90 days duration
    expect(season.endsAt - season.startedAt).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it('creates next season based on previous', () => {
    const previous: Season = {
      id: 's1',
      number: 1,
      name: 'Genesis Season',
      startedAt: Date.now() - 100_000,
      endsAt: Date.now() - 1,
      isActive: false,
    };

    const season = createNewSeason(previous);

    expect(season.id).toBe('s2');
    expect(season.number).toBe(2);
    expect(season.name).toBe('Ascension');
    expect(season.isActive).toBe(true);
  });

  it('cycles season names after exhausting the list', () => {
    const previous: Season = {
      id: 's8',
      number: 8,
      name: 'Dark Epoch',
      startedAt: 0,
      endsAt: 0,
      isActive: false,
    };

    const season = createNewSeason(previous);
    // Season 9 should cycle back to "Genesis Season" (index 0)
    expect(season.number).toBe(9);
    expect(season.name).toBe('Genesis Season');
  });
});

describe('isSeasonExpired', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for active season with time remaining', () => {
    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: Date.now(),
      endsAt: Date.now() + 1_000_000,
      isActive: true,
    };

    expect(isSeasonExpired(season)).toBe(false);
  });

  it('returns true when endsAt has passed', () => {
    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: Date.now() - 2_000_000,
      endsAt: Date.now() - 1,
      isActive: true,
    };

    expect(isSeasonExpired(season)).toBe(true);
  });

  it('returns true when endsAt equals current time', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: now - 1000,
      endsAt: now,
      isActive: true,
    };

    expect(isSeasonExpired(season)).toBe(true);
  });
});

describe('endSeason', () => {
  it('returns new season object with isActive=false', () => {
    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: 1000,
      endsAt: 2000,
      isActive: true,
    };

    const ended = endSeason(season);

    expect(ended.isActive).toBe(false);
    expect(ended.id).toBe('s1');
    expect(ended.startedAt).toBe(1000);
    // Original is not mutated
    expect(season.isActive).toBe(true);
  });
});

describe('getSeasonTimeRemaining', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes days and hours remaining', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: now - 1000,
      // 5 days + 3 hours from now
      endsAt: now + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
      isActive: true,
    };

    const remaining = getSeasonTimeRemaining(season);

    expect(remaining.days).toBe(5);
    expect(remaining.hours).toBe(3);
    expect(remaining.totalMs).toBeGreaterThan(0);
  });

  it('returns zero for expired season', () => {
    const season: Season = {
      id: 's1',
      number: 1,
      name: 'Test',
      startedAt: Date.now() - 2_000_000,
      endsAt: Date.now() - 1000,
      isActive: false,
    };

    const remaining = getSeasonTimeRemaining(season);

    expect(remaining.days).toBe(0);
    expect(remaining.hours).toBe(0);
    expect(remaining.totalMs).toBe(0);
  });
});
