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
  luck: '#22c55e',
} as const;

export const STAT_MAX_VALUES = {
  hp: 600,
  mp: 500,
  str: 400,
  int: 400,
  luck: 300,
} as const;

export const TIER_BORDER_COLORS: Record<AchievementTier, string> = {
  legendary: '#f4c430',
  epic: '#a78bfa',
  rare: '#60a5fa',
  common: '#6b7280',
} as const;

export const DESIGN_TOKENS = {
  colors: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a2e',
    accentGold: '#f4c430',
    accentBlue: '#4a9eff',
    textPrimary: '#e8e8ed',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    border: '#2a2a3e',
    borderAccent: '#f4c430',
  },
  fonts: {
    display: "'Cinzel', serif",
    body: "'Inter', 'Noto Sans KR', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;
