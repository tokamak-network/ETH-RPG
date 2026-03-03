'use client';

import { useRouter } from 'next/navigation';
import type { QuizResult as QuizResultType } from '@/lib/quiz-types';
import { CLASS_THEMES, CLASS_LABELS } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';

interface QuizResultProps {
  readonly result: QuizResultType;
  readonly onRetake: () => void;
}

export default function QuizResult({ result, onRetake }: QuizResultProps) {
  const router = useRouter();
  const theme = CLASS_THEMES[result.predictedClass];
  const className = CLASS_LABELS[result.predictedClass];
  const runnerUpName = CLASS_LABELS[result.runnerUp];
  const confidencePercent = Math.round(result.confidence * 100);

  function handleVerify() {
    trackEvent('quiz_to_wallet_click', { predictedClass: result.predictedClass });
    router.push(`/?from=quiz&predicted=${result.predictedClass}`);
  }

  function handleRetake() {
    trackEvent('quiz_retake');
    onRetake();
  }

  function handleShare() {
    trackEvent('quiz_share', { predictedClass: result.predictedClass });
    const text = `My on-chain personality is ${className} ${theme.icon}! What's yours?`;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/quiz`
      : 'https://ethrpg.com/quiz';
    const params = new URLSearchParams({ text: `${text}\n${url}` });
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <div className="w-full max-w-md mx-auto text-center animate-fade-in-up">
      {/* Class icon */}
      <div className="text-7xl mb-4">{theme.icon}</div>

      {/* Predicted class */}
      <h2
        className="text-3xl sm:text-4xl font-bold mb-2"
        style={{ color: theme.primary, fontFamily: 'var(--font-display)' }}
      >
        {className}
      </h2>

      {/* Confidence teaser */}
      <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {confidencePercent}% match
      </p>
      <p className="text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Runner-up: {runnerUpName}
      </p>

      {/* Teaser — no detailed stats */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          backgroundColor: `${theme.primary}10`,
          border: `1px solid ${theme.primary}30`,
        }}
      >
        <p className="text-base mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Want to see your real stats, lore, and power score?
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Verify with your actual wallet to get the full character card.
        </p>
      </div>

      {/* Primary CTA — Verify */}
      <button
        type="button"
        onClick={handleVerify}
        className="w-full px-6 py-4 rounded-xl text-lg font-bold mb-4 transition-all duration-200 hover:brightness-110 cursor-pointer focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
        style={{
          backgroundColor: 'var(--color-accent-gold)',
          color: '#000',
        }}
      >
        Verify with your wallet {'\u2192'}
      </button>

      {/* Secondary actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetake}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          Retake Quiz
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          Share Result
        </button>
      </div>
    </div>
  );
}
