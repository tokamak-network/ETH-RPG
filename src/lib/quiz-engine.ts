// Pure function to compute quiz result from answers — no mutation
import type { CharacterClassId } from '@/lib/types';
import type { QuizAnswer, QuizResult } from '@/lib/quiz-types';
import { QUIZ_QUESTIONS } from '@/lib/quiz-data';

const ALL_CLASS_IDS: readonly CharacterClassId[] = [
  'hunter', 'rogue', 'summoner', 'merchant',
  'priest', 'elder_wizard', 'guardian', 'warrior',
] as const;

function emptyScores(): Record<CharacterClassId, number> {
  return ALL_CLASS_IDS.reduce(
    (acc, id) => ({ ...acc, [id]: 0 }),
    {} as Record<CharacterClassId, number>,
  );
}

export function computeQuizResult(answers: readonly QuizAnswer[]): QuizResult {
  const scores = answers.reduce((acc, answer) => {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) return acc;

    const option = question.options[answer.selectedIndex];
    if (!option) return acc;

    const weightEntries = Object.entries(option.classWeights) as [CharacterClassId, number][];
    return weightEntries.reduce(
      (inner, [classId, weight]) => ({
        ...inner,
        [classId]: (inner[classId] ?? 0) + weight,
      }),
      { ...acc },
    );
  }, emptyScores());

  const sorted = ALL_CLASS_IDS
    .map((id) => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0];
  const runnerUp = sorted[1];
  const totalWeight = sorted.reduce((sum, s) => sum + s.score, 0);
  const confidence = totalWeight > 0 ? top.score / totalWeight : 0;

  return {
    predictedClass: top.id,
    confidence,
    runnerUp: runnerUp.id,
    scores,
  };
}
