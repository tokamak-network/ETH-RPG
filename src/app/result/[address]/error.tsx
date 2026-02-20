'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ResultError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error('Result page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-atmosphere px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{'\u{1F6E1}\uFE0F'}</div>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--color-accent-red)' }}
        >
          Summoning Failed
        </h2>
        <p
          className="mb-8 text-base"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          An unexpected error occurred while generating your character card.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer hover:brightness-110"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: '#000',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
