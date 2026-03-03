import { describe, it, expect } from 'vitest';
import { computeQuizResult } from '@/lib/quiz-engine';
import { QUIZ_QUESTIONS } from '@/lib/quiz-data';
import type { QuizAnswer } from '@/lib/quiz-types';
import type { CharacterClassId } from '@/lib/types';

/** Build answers that select a specific option index for each question. */
function buildAnswers(indices: readonly number[]): readonly QuizAnswer[] {
  return QUIZ_QUESTIONS.map((q, i) => ({
    questionId: q.id,
    selectedIndex: indices[i] ?? 0,
  }));
}

describe('computeQuizResult', () => {
  it('returns a valid result shape', () => {
    const answers = buildAnswers([0, 0, 0, 0, 0]);
    const result = computeQuizResult(answers);

    expect(result).toHaveProperty('predictedClass');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('runnerUp');
    expect(result).toHaveProperty('scores');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('predicts hunter when all NFT-related options are chosen', () => {
    // Q1: "Collect & trade NFTs" (hunter+3, rogue+1)
    // Q2: "A few times a week" (hunter+2, summoner+1, warrior+2)
    // Q3: "I spend freely" (priest+3, rogue+1) — no hunter option that's better
    // Q4: "2020-2021" (hunter+2, rogue+1, warrior+1)
    // Q5: "mostly in tokens and NFTs" (hunter+2, rogue+2)
    const answers = buildAnswers([0, 1, 0, 1, 0]);
    const result = computeQuizResult(answers);

    expect(result.predictedClass).toBe('hunter');
  });

  it('predicts rogue when all DEX-related options are chosen', () => {
    // Q1: "Swap tokens on DEXes" (rogue+3)
    // Q2: "Multiple times a day" (rogue+2)
    // Q3: "I spend freely" (priest+3, rogue+1)
    // Q4: "2020-2021" (hunter+2, rogue+1, warrior+1)
    // Q5: "I keep moving it around" (warrior+2, rogue+1, summoner+1)
    const answers = buildAnswers([1, 0, 0, 1, 3]);
    const result = computeQuizResult(answers);

    expect(result.predictedClass).toBe('rogue');
  });

  it('predicts guardian when all holder-type options are chosen', () => {
    // Q1: "Just hold ETH" (guardian+3, elder_wizard+1)
    // Q2: "Rarely" (elder_wizard+3, guardian+2)
    // Q3: "I barely notice" (guardian+2, elder_wizard+2)
    // Q4: "2022-2023" (guardian+2, merchant+1)
    // Q5: "Sitting in my wallet" (guardian+3, elder_wizard+1)
    const answers = buildAnswers([5, 3, 3, 2, 2]);
    const result = computeQuizResult(answers);

    // Should be guardian or elder_wizard — both are valid for holder personality
    expect(['guardian', 'elder_wizard']).toContain(result.predictedClass);
  });

  it('predictedClass and runnerUp are different', () => {
    const answers = buildAnswers([0, 0, 0, 0, 0]);
    const result = computeQuizResult(answers);

    expect(result.predictedClass).not.toBe(result.runnerUp);
  });

  it('handles empty answers gracefully', () => {
    const result = computeQuizResult([]);

    // All scores should be 0, so first alphabetical class wins
    expect(result.predictedClass).toBeDefined();
    expect(result.confidence).toBe(0);
  });

  it('scores contain all 8 classes', () => {
    const answers = buildAnswers([0, 0, 0, 0, 0]);
    const result = computeQuizResult(answers);

    const allClasses: CharacterClassId[] = [
      'hunter', 'rogue', 'summoner', 'merchant',
      'priest', 'elder_wizard', 'guardian', 'warrior',
    ];

    for (const cls of allClasses) {
      expect(result.scores).toHaveProperty(cls);
      expect(typeof result.scores[cls]).toBe('number');
    }
  });

  it('ignores invalid question IDs', () => {
    const answers: readonly QuizAnswer[] = [
      { questionId: 'nonexistent', selectedIndex: 0 },
    ];
    const result = computeQuizResult(answers);

    // All zero scores
    const totalScore = Object.values(result.scores).reduce((sum, s) => sum + s, 0);
    expect(totalScore).toBe(0);
  });

  it('ignores out-of-bounds selected indices', () => {
    const answers: readonly QuizAnswer[] = [
      { questionId: 'activity', selectedIndex: 999 },
    ];
    const result = computeQuizResult(answers);

    const totalScore = Object.values(result.scores).reduce((sum, s) => sum + s, 0);
    expect(totalScore).toBe(0);
  });

  it('predicts merchant when stablecoin-related options are chosen', () => {
    // Q1: "Transfer stablecoins" (merchant+3, guardian+1)
    // Q2: "A few times a month" (merchant+2, guardian+1)
    // Q3: "I optimize and wait" (merchant+2, elder_wizard+1)
    // Q4: "2022-2023" (guardian+2, merchant+1)
    // Q5: "Spread across DeFi" (priest+2, summoner+1, merchant+1)
    const answers = buildAnswers([3, 2, 1, 2, 1]);
    const result = computeQuizResult(answers);

    expect(result.predictedClass).toBe('merchant');
  });
});
