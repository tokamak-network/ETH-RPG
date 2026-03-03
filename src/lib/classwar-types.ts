// Class War type definitions — weekly 8-class competition system

import type { CharacterClassId } from '@/lib/types';

export const ALL_CLASS_IDS: readonly CharacterClassId[] = [
  'hunter', 'rogue', 'summoner', 'merchant',
  'priest', 'elder_wizard', 'guardian', 'warrior',
] as const;

export interface ClassWarWeek {
  readonly weekId: string;        // "w2026-10"
  readonly startedAt: number;     // epoch ms (Monday 00:00 UTC)
  readonly endsAt: number;        // epoch ms (next Monday 00:00 UTC)
  readonly isActive: boolean;
}

export interface ClassWarScore {
  readonly classId: CharacterClassId;
  readonly score: number;
  readonly rank: number;
  readonly battleCount: number;
}

export interface ClassWarStandings {
  readonly weekId: string;
  readonly week: ClassWarWeek;
  readonly scores: readonly ClassWarScore[];
  readonly totalBattles: number;
  readonly updatedAt: number;
  readonly buffClassId: CharacterClassId | null;  // previous week's winner class
}

export interface ClassWarResult {
  readonly weekId: string;
  readonly winnerClassId: CharacterClassId;
  readonly scores: readonly ClassWarScore[];
  readonly totalBattles: number;
  readonly endedAt: number;
}
