// Normalize character stats to 0-1 range for visual effect intensity scaling
import type { CharacterStats } from '@/lib/types';
import { STAT_MAX_VALUES } from '@/styles/themes';
import {
  HP_BASE,
  MP_BASE,
  STR_BASE,
  INT_BASE,
  DEX_BASE,
  LUCK_BASE,
  LEVEL_MIN,
  LEVEL_MAX,
} from '@/lib/stats';

export interface NormalizedStats {
  readonly hp: number;
  readonly mp: number;
  readonly str: number;
  readonly int: number;
  readonly dex: number;
  readonly luck: number;
  readonly tier: number;
}

const POWER_MAX = 100_000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function safeNormalize(value: number, base: number, max: number): number {
  const range = max - base;
  return range === 0 ? 0 : clamp01((value - base) / range);
}

export function normalizeStats(stats: CharacterStats): NormalizedStats {
  const hp = safeNormalize(stats.hp, HP_BASE, STAT_MAX_VALUES.hp);
  const mp = safeNormalize(stats.mp, MP_BASE, STAT_MAX_VALUES.mp);
  const str = safeNormalize(stats.str, STR_BASE, STAT_MAX_VALUES.str);
  const int = safeNormalize(stats.int, INT_BASE, STAT_MAX_VALUES.int);
  const dex = safeNormalize(stats.dex, DEX_BASE, STAT_MAX_VALUES.dex);
  const luck = safeNormalize(stats.luck, LUCK_BASE, STAT_MAX_VALUES.luck);

  const levelNorm = safeNormalize(stats.level, LEVEL_MIN, LEVEL_MAX);
  const powerNorm = clamp01(stats.power / POWER_MAX);
  const tier = clamp01(levelNorm * 0.4 + powerNorm * 0.6);

  return { hp, mp, str, int, dex, luck, tier };
}
