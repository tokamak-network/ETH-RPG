import { describe, it, expect } from 'vitest';
import {
  getCurrentWeekId,
  getWeekBounds,
  createClassWarWeek,
  isWeekExpired,
  getWeekTimeRemaining,
} from '@/lib/classwar-week';

describe('getCurrentWeekId', () => {
  it('returns format wYYYY-WW', () => {
    const result = getCurrentWeekId(new Date('2026-03-03T12:00:00Z'));
    expect(result).toMatch(/^w\d{4}-\d{2}$/);
  });

  it('returns w2026-10 for March 3 2026 (Tuesday)', () => {
    // March 3 2026 is a Tuesday in ISO week 10
    const result = getCurrentWeekId(new Date('2026-03-03T00:00:00Z'));
    expect(result).toBe('w2026-10');
  });

  it('handles year boundary: Dec 31 2025 → week 1 of 2026', () => {
    // Dec 31 2025 is a Wednesday. ISO week 1 of 2026 starts Mon Dec 29 2025
    // because Jan 1 2026 is a Thursday (ISO week 1 contains the first Thursday)
    const result = getCurrentWeekId(new Date('2025-12-31T23:59:59Z'));
    expect(result).toBe('w2026-01');
  });

  it('handles year boundary: Jan 1 2026 → week 1 of 2026', () => {
    const result = getCurrentWeekId(new Date('2026-01-01T00:00:00Z'));
    expect(result).toBe('w2026-01');
  });

  it('handles Sunday at end of week', () => {
    // March 8 2026 is a Sunday — still ISO week 10
    const result = getCurrentWeekId(new Date('2026-03-08T23:59:59Z'));
    expect(result).toBe('w2026-10');
  });

  it('Monday starts a new week', () => {
    // March 9 2026 is a Monday — ISO week 11
    const result = getCurrentWeekId(new Date('2026-03-09T00:00:00Z'));
    expect(result).toBe('w2026-11');
  });

  it('handles Dec 28 2026 — last days of 2026', () => {
    // Dec 28 2026 is a Monday → ISO week 53 of 2026
    const result = getCurrentWeekId(new Date('2026-12-28T00:00:00Z'));
    expect(result).toBe('w2026-53');
  });

  it('handles Jan 4 2027 — first full week of 2027', () => {
    // Jan 4 2027 is a Monday → ISO week 1 of 2027
    const result = getCurrentWeekId(new Date('2027-01-04T00:00:00Z'));
    expect(result).toBe('w2027-01');
  });
});

describe('getWeekBounds', () => {
  it('returns Monday 00:00 UTC as start for w2026-10', () => {
    const { startedAt, endsAt } = getWeekBounds('w2026-10');
    const start = new Date(startedAt);
    const end = new Date(endsAt);

    // Start should be Monday March 2 2026 00:00 UTC
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);

    // Duration should be exactly 7 days
    expect(endsAt - startedAt).toBe(7 * 24 * 60 * 60 * 1000);

    // End should also be Monday
    expect(end.getUTCDay()).toBe(1);
  });

  it('throws on invalid weekId format', () => {
    expect(() => getWeekBounds('invalid')).toThrow('Invalid weekId format');
    expect(() => getWeekBounds('w2026-1')).toThrow('Invalid weekId format');
    expect(() => getWeekBounds('2026-10')).toThrow('Invalid weekId format');
  });

  it('round-trips with getCurrentWeekId', () => {
    const testDate = new Date('2026-06-15T14:30:00Z');
    const weekId = getCurrentWeekId(testDate);
    const { startedAt, endsAt } = getWeekBounds(weekId);

    // The test date should fall within the bounds
    expect(testDate.getTime()).toBeGreaterThanOrEqual(startedAt);
    expect(testDate.getTime()).toBeLessThan(endsAt);
  });

  it('week 1 bounds contain Jan 4 (always in ISO week 1)', () => {
    const { startedAt, endsAt } = getWeekBounds('w2026-01');
    const jan4 = new Date('2026-01-04T12:00:00Z').getTime();
    expect(jan4).toBeGreaterThanOrEqual(startedAt);
    expect(jan4).toBeLessThan(endsAt);
  });
});

describe('createClassWarWeek', () => {
  it('creates an active week with correct bounds', () => {
    const week = createClassWarWeek('w2026-10');
    expect(week.weekId).toBe('w2026-10');
    expect(week.isActive).toBe(true);
    expect(week.endsAt - week.startedAt).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('isWeekExpired', () => {
  it('returns false for a future week', () => {
    const week = createClassWarWeek('w2099-01');
    expect(isWeekExpired(week)).toBe(false);
  });

  it('returns true for a past week', () => {
    const week = createClassWarWeek('w2020-01');
    expect(isWeekExpired(week)).toBe(true);
  });
});

describe('getWeekTimeRemaining', () => {
  it('returns zero for expired week', () => {
    const week = createClassWarWeek('w2020-01');
    const remaining = getWeekTimeRemaining(week);
    expect(remaining.days).toBe(0);
    expect(remaining.hours).toBe(0);
    expect(remaining.totalMs).toBe(0);
  });

  it('returns positive values for future week', () => {
    const week = createClassWarWeek('w2099-01');
    const remaining = getWeekTimeRemaining(week);
    expect(remaining.days).toBeGreaterThan(0);
    expect(remaining.totalMs).toBeGreaterThan(0);
  });
});
