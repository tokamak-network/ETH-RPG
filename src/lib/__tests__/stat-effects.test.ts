import { describe, it, expect } from 'vitest';
import { normalizeStats, type NormalizedStats } from '@/lib/stat-effects';
import type { CharacterStats } from '@/lib/types';
import { STAT_MAX_VALUES } from '@/styles/themes';
import { HP_BASE, MP_BASE, STR_BASE, INT_BASE, LUCK_BASE } from '@/lib/stats';

function makeStats(overrides?: Partial<CharacterStats>): CharacterStats {
  return {
    level: 1,
    hp: HP_BASE,
    mp: MP_BASE,
    str: STR_BASE,
    int: INT_BASE,
    luck: LUCK_BASE,
    power: 0,
    ...overrides,
  };
}

describe('normalizeStats', () => {
  it('returns all zeros for minimum (base) stats', () => {
    const stats = makeStats({ level: 1, power: 0 });
    const result = normalizeStats(stats);

    expect(result.hp).toBe(0);
    expect(result.mp).toBe(0);
    expect(result.str).toBe(0);
    expect(result.int).toBe(0);
    expect(result.luck).toBe(0);
    expect(result.tier).toBe(0);
  });

  it('returns all ones for maximum stats', () => {
    const stats = makeStats({
      level: 60,
      hp: STAT_MAX_VALUES.hp,
      mp: STAT_MAX_VALUES.mp,
      str: STAT_MAX_VALUES.str,
      int: STAT_MAX_VALUES.int,
      luck: STAT_MAX_VALUES.luck,
      power: 100_000,
    });
    const result = normalizeStats(stats);

    expect(result.hp).toBe(1);
    expect(result.mp).toBe(1);
    expect(result.str).toBe(1);
    expect(result.int).toBe(1);
    expect(result.luck).toBe(1);
    expect(result.tier).toBe(1);
  });

  it('returns mid-range values for mid-range stats', () => {
    const stats = makeStats({
      level: 30,
      hp: 350,
      mp: 290,
      str: 225,
      int: 225,
      luck: 175,
      power: 50_000,
    });
    const result = normalizeStats(stats);

    expect(result.hp).toBeGreaterThan(0.3);
    expect(result.hp).toBeLessThan(0.7);
    expect(result.mp).toBeGreaterThan(0.3);
    expect(result.mp).toBeLessThan(0.7);
    expect(result.str).toBeGreaterThan(0.3);
    expect(result.str).toBeLessThan(0.7);
    expect(result.int).toBeGreaterThan(0.3);
    expect(result.int).toBeLessThan(0.7);
    expect(result.luck).toBeGreaterThan(0.3);
    expect(result.luck).toBeLessThan(0.7);
    expect(result.tier).toBeGreaterThan(0.3);
    expect(result.tier).toBeLessThan(0.8);
  });

  it('clamps values below base to 0', () => {
    const stats = makeStats({
      hp: HP_BASE - 10,
      mp: MP_BASE - 5,
    });
    const result = normalizeStats(stats);

    expect(result.hp).toBe(0);
    expect(result.mp).toBe(0);
  });

  it('clamps values above max to 1', () => {
    const stats = makeStats({
      hp: STAT_MAX_VALUES.hp + 100,
      str: STAT_MAX_VALUES.str + 50,
      power: 200_000,
      level: 60,
    });
    const result = normalizeStats(stats);

    expect(result.hp).toBe(1);
    expect(result.str).toBe(1);
    expect(result.tier).toBe(1);
  });

  it('tier blends level (40%) and power (60%)', () => {
    const highLevelLowPower = makeStats({ level: 60, power: 0 });
    const lowLevelHighPower = makeStats({ level: 1, power: 100_000 });

    const resultA = normalizeStats(highLevelLowPower);
    const resultB = normalizeStats(lowLevelHighPower);

    expect(resultA.tier).toBeCloseTo(0.4, 2);
    expect(resultB.tier).toBeCloseTo(0.6, 2);
  });

  it('returns readonly NormalizedStats interface', () => {
    const result: NormalizedStats = normalizeStats(makeStats());
    expect(typeof result.hp).toBe('number');
    expect(typeof result.tier).toBe('number');
  });
});
