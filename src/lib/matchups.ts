import type { CharacterClassId, MatchupAdvantage, BattleMatchup } from '@/lib/types';

// --- Advantage rings ---
// Ring A (circular): warrior -> rogue -> merchant -> priest -> elder_wizard -> warrior
// Ring B (circular): hunter -> summoner -> guardian -> hunter
// Cross-ring or same class = neutral

const RING_A: readonly CharacterClassId[] = [
  'warrior',
  'rogue',
  'merchant',
  'priest',
  'elder_wizard',
] as const;

const RING_B: readonly CharacterClassId[] = [
  'hunter',
  'summoner',
  'guardian',
] as const;

const DAMAGE_MODIFIERS: Readonly<Record<MatchupAdvantage, number>> = {
  advantaged: 1.15,
  disadvantaged: 0.80,
  neutral: 1.0,
};

const RECEIVE_MODIFIERS: Readonly<Record<MatchupAdvantage, number>> = {
  advantaged: 0.80,
  disadvantaged: 1.15,
  neutral: 1.0,
};

function findRingAdvantage(
  ring: readonly CharacterClassId[],
  class1: CharacterClassId,
  class2: CharacterClassId,
): MatchupAdvantage | null {
  const idx1 = ring.indexOf(class1);
  const idx2 = ring.indexOf(class2);

  if (idx1 === -1 || idx2 === -1) {
    return null;
  }

  if (idx1 === idx2) {
    return 'neutral';
  }

  // class1 beats class2 if class2 is the next element after class1 in the ring
  const nextIndex = (idx1 + 1) % ring.length;
  if (nextIndex === idx2) {
    return 'advantaged';
  }

  // class2 beats class1 if class1 is the next element after class2 in the ring
  const prevIndex = (idx2 + 1) % ring.length;
  if (prevIndex === idx1) {
    return 'disadvantaged';
  }

  // Both in same ring but not adjacent -- neutral
  return 'neutral';
}

export function resolveMatchup(
  class1: CharacterClassId,
  class2: CharacterClassId,
): BattleMatchup {
  if (class1 === class2) {
    return { fighter0Advantage: 'neutral', fighter1Advantage: 'neutral' };
  }

  // Check Ring A
  const ringAResult = findRingAdvantage(RING_A, class1, class2);
  if (ringAResult !== null && ringAResult !== 'neutral') {
    return {
      fighter0Advantage: ringAResult,
      fighter1Advantage: ringAResult === 'advantaged' ? 'disadvantaged' : 'advantaged',
    };
  }

  // Check Ring B
  const ringBResult = findRingAdvantage(RING_B, class1, class2);
  if (ringBResult !== null && ringBResult !== 'neutral') {
    return {
      fighter0Advantage: ringBResult,
      fighter1Advantage: ringBResult === 'advantaged' ? 'disadvantaged' : 'advantaged',
    };
  }

  // Cross-ring, same class, or non-adjacent in same ring = neutral
  return { fighter0Advantage: 'neutral', fighter1Advantage: 'neutral' };
}

// --- Matchup info for card display ---

export interface MatchupInfo {
  readonly strongVs: readonly CharacterClassId[];
  readonly weakVs: readonly CharacterClassId[];
}

const ALL_CLASS_IDS: readonly CharacterClassId[] = [
  ...RING_A,
  ...RING_B,
] as const;

function computeMatchupInfo(classId: CharacterClassId): MatchupInfo {
  const strongVs: CharacterClassId[] = [];
  const weakVs: CharacterClassId[] = [];

  for (const other of ALL_CLASS_IDS) {
    if (other === classId) continue;
    const matchup = resolveMatchup(classId, other);
    if (matchup.fighter0Advantage === 'advantaged') {
      strongVs.push(other);
    } else if (matchup.fighter0Advantage === 'disadvantaged') {
      weakVs.push(other);
    }
  }

  return { strongVs, weakVs };
}

// Pre-computed at module load — avoids recalculation on every render.
const MATCHUP_INFO_MAP: Readonly<Record<CharacterClassId, MatchupInfo>> =
  Object.fromEntries(
    ALL_CLASS_IDS.map((id) => [id, computeMatchupInfo(id)]),
  ) as Record<CharacterClassId, MatchupInfo>;

export function getMatchupInfo(classId: CharacterClassId): MatchupInfo {
  return MATCHUP_INFO_MAP[classId];
}

export function getDamageModifier(advantage: MatchupAdvantage): number {
  return DAMAGE_MODIFIERS[advantage];
}

export function getReceiveModifier(advantage: MatchupAdvantage): number {
  return RECEIVE_MODIFIERS[advantage];
}
