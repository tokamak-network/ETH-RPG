'use client';

import type { QuizQuestion as QuizQuestionType } from '@/lib/quiz-types';
import { trackEvent } from '@/lib/analytics';

interface QuizQuestionProps {
  readonly question: QuizQuestionType;
  readonly questionIndex: number;
  readonly onAnswer: (selectedIndex: number) => void;
}

export default function QuizQuestion({ question, questionIndex, onAnswer }: QuizQuestionProps) {
  function handleSelect(index: number) {
    trackEvent('quiz_answer', {
      questionId: question.id,
      questionIndex,
      selectedIndex: index,
    });
    onAnswer(index);
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <h2
        className="text-xl sm:text-2xl font-bold text-center mb-8"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {question.question}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleSelect(index)}
            className="w-full text-left px-5 py-4 rounded-xl text-base font-medium transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 cursor-pointer focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
