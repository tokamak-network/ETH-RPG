// Class-specific visual themes for card rendering and UI
import type { CharacterClassId, AchievementTier } from '@/lib/types';

export interface ClassTheme {
  readonly primary: string;
  readonly secondary: string;
  readonly gradient: string;
  readonly icon: string;
  readonly borderGlow: string;
  readonly label: string;
}

export const CLASS_THEMES: Record<CharacterClassId, ClassTheme> = {
  hunter: {
    primary: '#22c55e',
    secondary: '#15803d',
    gradient: 'linear-gradient(180deg, #064e3b 0%, #0a0a0f 100%)',
    icon: '\u{1F3F9}',
    borderGlow: '0 0 20px rgba(34, 197, 94, 0.3)',
    label: 'Forest Green',
  },
  rogue: {
    primary: '#ef4444',
    secondary: '#b91c1c',
    gradient: 'linear-gradient(180deg, #450a0a 0%, #0a0a0f 100%)',
    icon: '\u{1F5E1}\uFE0F',
    borderGlow: '0 0 20px rgba(239, 68, 68, 0.3)',
    label: 'Crimson Red',
  },
  summoner: {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    gradient: 'linear-gradient(180deg, #2e1065 0%, #0a0a0f 100%)',
    icon: '\u{1F300}',
    borderGlow: '0 0 20px rgba(139, 92, 246, 0.3)',
    label: 'Mystic Purple',
  },
  merchant: {
    primary: '#f4c430',
    secondary: '#ca8a04',
    gradient: 'linear-gradient(180deg, #422006 0%, #0a0a0f 100%)',
    icon: '\u{1F4B0}',
    borderGlow: '0 0 20px rgba(244, 196, 48, 0.3)',
    label: 'Gold',
  },
  priest: {
    primary: '#60a5fa',
    secondary: '#2563eb',
    gradient: 'linear-gradient(180deg, #1e3a5f 0%, #0a0a0f 100%)',
    icon: '\u2720\uFE0F',
    borderGlow: '0 0 20px rgba(96, 165, 250, 0.3)',
    label: 'Holy Blue',
  },
  elder_wizard: {
    primary: '#a78bfa',
    secondary: '#7c3aed',
    gradient: 'linear-gradient(180deg, #3b0764 0%, #0a0a0f 100%)',
    icon: '\u{1F52E}',
    borderGlow: '0 0 20px rgba(167, 139, 250, 0.3)',
    label: 'Arcane Lavender',
  },
  guardian: {
    primary: '#f97316',
    secondary: '#c2410c',
    gradient: 'linear-gradient(180deg, #431407 0%, #0a0a0f 100%)',
    icon: '\u{1F6E1}\uFE0F',
    borderGlow: '0 0 20px rgba(249, 115, 22, 0.3)',
    label: 'Shield Orange',
  },
  warrior: {
    primary: '#94a3b8',
    secondary: '#64748b',
    gradient: 'linear-gradient(180deg, #1e293b 0%, #0a0a0f 100%)',
    icon: '\u2694\uFE0F',
    borderGlow: '0 0 20px rgba(148, 163, 184, 0.3)',
    label: 'Steel Gray',
  },
} as const;

export const STAT_COLORS = {
  hp: '#ef4444',
  mp: '#8b5cf6',
  str: '#f97316',
  int: '#60a5fa',
  dex: '#10b981',
  luck: '#eab308',
} as const;

export const STAT_MAX_VALUES = {
  hp: 900,
  mp: 600,
  str: 550,
  int: 500,
  dex: 550,
  luck: 300,
} as const;

export const TIER_BORDER_COLORS: Record<AchievementTier, string> = {
  legendary: '#f4c430',
  epic: '#a78bfa',
  rare: '#60a5fa',
  common: '#6b7280',
} as const;

export const CLASS_LABELS: Record<CharacterClassId, string> = {
  hunter: 'Hunter',
  rogue: 'Rogue',
  summoner: 'Summoner',
  merchant: 'Merchant',
  priest: 'Priest',
  elder_wizard: 'Elder Wizard',
  guardian: 'Guardian',
  warrior: 'Warrior',
} as const;

// --- Power tier definitions ---

export interface PowerTier {
  readonly id: string;
  readonly label: string;
  readonly minPower: number;
  readonly frameColor: string;
  readonly glowColor: string;
  readonly glowIntensity: number;
}

// Thresholds derived from power formula analysis:
//   Min possible (fresh warrior):  ~8,200  → Bronze
//   Typical active wallet:         ~15,000 → Silver
//   Heavy DeFi user:               ~35,000 → Gold
//   Theoretical max (elder_wizard): ~100,750 → Diamond
// Sorted descending so getPowerTier() returns on first match.
export const POWER_TIERS: readonly PowerTier[] = [
  { id: 'diamond', label: 'DIAMOND', minPower: 55000, frameColor: '#b9f2ff', glowColor: 'rgba(185, 242, 255, 0.4)', glowIntensity: 30 },
  { id: 'gold', label: 'GOLD', minPower: 35000, frameColor: '#f4c430', glowColor: 'rgba(244, 196, 48, 0.35)', glowIntensity: 25 },
  { id: 'silver', label: 'SILVER', minPower: 15000, frameColor: '#c0c0c0', glowColor: 'rgba(192, 192, 192, 0.3)', glowIntensity: 20 },
  { id: 'bronze', label: 'BRONZE', minPower: 0, frameColor: '#cd7f32', glowColor: 'rgba(205, 127, 50, 0.25)', glowIntensity: 15 },
] as const;

export function getPowerTier(power: number): PowerTier {
  for (const tier of POWER_TIERS) {
    if (power >= tier.minPower) {
      return tier;
    }
  }
  return POWER_TIERS[POWER_TIERS.length - 1];
}

export const BATTLE_TOKENS = {
  colors: {
    player0: '#60a5fa',
    player1: '#f87171',
    crit: '#f4c430',
    dodge: '#10b981',
    stun: '#ef4444',
    heal: '#22c55e',
    mpDrain: '#8b5cf6',
    reflect: '#f97316',
  },
  timing: {
    turnDelay: 800,
    hpTransition: 500,
    damageFloat: 600,
  },
} as const;
