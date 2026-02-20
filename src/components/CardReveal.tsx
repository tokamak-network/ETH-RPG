'use client';

import { useState, useEffect, useRef } from 'react';
import type { GenerateResponse } from '@/lib/types';
import { CLASS_THEMES, getPowerTier } from '@/styles/themes';
import CharacterCard from '@/components/CharacterCard';

interface CardRevealProps {
  readonly data: GenerateResponse;
  readonly onRevealed?: () => void;
}

export default function CardReveal({ data, onRevealed }: CardRevealProps) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const onRevealedRef = useRef(onRevealed);
  onRevealedRef.current = onRevealed;

  const theme = CLASS_THEMES[data.class.id];
  const tier = getPowerTier(data.stats.power);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setPhase(2);
      onRevealedRef.current?.();
      return;
    }

    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => {
      setPhase(2);
      onRevealedRef.current?.();
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Phase 0: Sealed card with class icon + glow
  if (phase === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div
          className="w-48 h-64 rounded-2xl flex flex-col items-center justify-center gap-4 reveal-pulse-border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: `2px solid ${theme.primary}`,
            boxShadow: theme.borderGlow,
          }}
        >
          <span className="text-6xl" aria-hidden="true">{theme.icon}</span>
          <p
            className="text-lg font-bold"
            style={{ color: theme.primary, fontFamily: 'var(--font-display)' }}
          >
            {data.class.nameEn}
          </p>
        </div>
      </div>
    );
  }

  // Phase 1: Level + tier label fade in
  if (phase === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
        <div
          className="w-48 h-64 rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: `2px solid ${theme.primary}`,
            boxShadow: theme.borderGlow,
          }}
        >
          <span className="text-5xl" aria-hidden="true">{theme.icon}</span>
          <p
            className="text-lg font-bold"
            style={{ color: theme.primary, fontFamily: 'var(--font-display)' }}
          >
            {data.class.nameEn}
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Lv.{data.stats.level}
          </p>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: tier.frameColor }}
          >
            {tier.label}
          </p>
        </div>
      </div>
    );
  }

  // Phase 2: Full CharacterCard
  return (
    <div
      className="w-full max-w-lg mx-auto"
      style={{
        animation: 'card-entrance 0.5s ease-out forwards',
      }}
    >
      <div className="mb-8">
        <CharacterCard data={data} />
      </div>
    </div>
  );
}
