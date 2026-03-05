'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizResult as QuizResultType } from '@/lib/quiz-types';
import { CLASS_THEMES, CLASS_LABELS } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';
import { isKoreanLocale } from '@/lib/locale';
import { openTwitterIntent, copyToClipboard } from '@/lib/share-utils';
import { appendUtmToUrl } from '@/lib/utm';

interface QuizResultProps {
  readonly result: QuizResultType;
  readonly onRetake: () => void;
}

export default function QuizResult({ result, onRetake }: QuizResultProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const theme = CLASS_THEMES[result.predictedClass];
  const className = CLASS_LABELS[result.predictedClass];
  const runnerUpName = CLASS_LABELS[result.runnerUp];
  const confidencePercent = Math.round(result.confidence * 100);
  const kr = isKoreanLocale();

  const quizUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz`
    : 'https://ethrpg.com/quiz';

  const shareText = kr
    ? `나는 ${confidencePercent}% ${className} ${theme.icon}. 퀴즈 풀고 니 클래스 확인해.`
    : `I'm ${confidencePercent}% ${className} ${theme.icon}. Take the quiz and find out yours.`;

  function handleVerify() {
    trackEvent('quiz_to_wallet_click', { predictedClass: result.predictedClass });
    router.push(`/?from=quiz&predicted=${result.predictedClass}`);
  }

  function handleRetake() {
    trackEvent('quiz_retake');
    onRetake();
  }

  function handleShare() {
    trackEvent('share_click', { platform: 'twitter', context: 'quiz', predictedClass: result.predictedClass });
    const url = appendUtmToUrl(quizUrl, { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'quiz' });
    openTwitterIntent(shareText, url);
  }

  async function handleCopy() {
    trackEvent('share_click', { platform: 'copy', context: 'quiz', predictedClass: result.predictedClass });
    const url = appendUtmToUrl(quizUrl, { utm_source: 'copy', utm_medium: 'clipboard', utm_campaign: 'quiz' });
    const ok = await copyToClipboard(`${shareText}\n${url}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span aria-hidden="true">&#x1D54F;</span>
          <span>Share</span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span aria-hidden="true">&#x1F4CB;</span>
          <span>{copied ? (kr ? '복사됨!' : 'Copied!') : (kr ? '복사' : 'Copy')}</span>
        </button>
      </div>
    </div>
  );
}
