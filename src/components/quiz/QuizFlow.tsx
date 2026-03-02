'use client';

import { useState, useCallback } from 'react';
import type { QuizAnswer, QuizResult as QuizResultType } from '@/lib/quiz-types';
import { QUIZ_QUESTIONS, TOTAL_QUESTIONS } from '@/lib/quiz-data';
import { computeQuizResult } from '@/lib/quiz-engine';
import { trackEvent } from '@/lib/analytics';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import QuizResult from './QuizResult';

type QuizPhase = 'intro' | 'questions' | 'result';

export default function QuizFlow() {
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<readonly QuizAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResultType | null>(null);

  const handleStart = useCallback(() => {
    trackEvent('quiz_start');
    setPhase('questions');
  }, []);

  const handleAnswer = useCallback((selectedIndex: number) => {
    const question = QUIZ_QUESTIONS[currentIndex];
    const newAnswer: QuizAnswer = {
      questionId: question.id,
      selectedIndex,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      const result = computeQuizResult(updatedAnswers);
      trackEvent('quiz_complete', {
        predictedClass: result.predictedClass,
        confidence: Math.round(result.confidence * 100),
        runnerUp: result.runnerUp,
      });
      setQuizResult(result);
      setPhase('result');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, answers]);

  const handleRetake = useCallback(() => {
    setPhase('intro');
    setCurrentIndex(0);
    setAnswers([]);
    setQuizResult(null);
  }, []);

  if (phase === 'intro') {
    return (
      <div className="w-full max-w-md mx-auto text-center animate-fade-in-up">
        <div className="text-6xl mb-6">{'\u{1F52E}'}</div>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          On-Chain Personality Test
        </h1>
        <p className="text-base mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          5 questions to predict your Ethereum class.
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          No wallet needed — just answer honestly.
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="px-8 py-4 rounded-xl text-lg font-bold transition-all duration-200 hover:brightness-110 cursor-pointer focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          Start Quiz {'\u2192'}
        </button>
      </div>
    );
  }

  if (phase === 'result' && quizResult) {
    return <QuizResult result={quizResult} onRetake={handleRetake} />;
  }

  // Questions phase
  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  return (
    <div>
      <QuizProgress current={currentIndex + 1} total={TOTAL_QUESTIONS} />
      <QuizQuestion
        key={currentQuestion.id}
        question={currentQuestion}
        questionIndex={currentIndex}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
