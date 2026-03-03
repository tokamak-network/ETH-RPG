// Quiz type definitions for on-chain personality test

import type { CharacterClassId } from '@/lib/types';

export interface QuizOption {
  readonly label: string;
  readonly classWeights: Partial<Record<CharacterClassId, number>>;
}

export interface QuizQuestion {
  readonly id: string;
  readonly question: string;
  readonly options: readonly QuizOption[];
}

export interface QuizAnswer {
  readonly questionId: string;
  readonly selectedIndex: number;
}

export interface QuizResult {
  readonly predictedClass: CharacterClassId;
  readonly confidence: number;
  readonly runnerUp: CharacterClassId;
  readonly scores: Record<CharacterClassId, number>;
}
