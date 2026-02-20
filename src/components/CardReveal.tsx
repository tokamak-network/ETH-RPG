'use client';

import { useState, useEffect, useRef } from 'react';
import type { GenerateResponse } from '@/lib/types';
import { CLASS_THEMES, getPowerTier } from '@/styles/themes';
import CharacterCard from '@/components/CharacterCard';

interface CardRevealProps {
  readonly data: GenerateResponse;
  readonly onPhaseChange?: (phase: 0 | 1 | 2) => void;
  readonly onRevealed?: () => void;
}

export default function CardReveal({ data, onPhaseChange, onRevealed }: CardRevealProps) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const onRevealedRef = useRef(onRevealed);
  const onPhaseChangeRef = useRef(onPhaseChange);
  onRevealedRef.current = onRevealed;
  onPhaseChangeRef.current = onPhaseChange;

  const theme = CLASS_THEMES[data.class.id];
  const tier = getPowerTier(data.stats.power);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setPhase(2);
      onPhaseChangeRef.current?.(2);
      onRevealedRef.current?.();
      return;
    }

    const t1 = setTimeout(() => {
      setPhase(1);
      onPhaseChangeRef.current?.(1);
    }, 1000);
    const t2 = setTimeout(() => {
      setPhase(2);
      onPhaseChangeRef.current?.(2);
      onRevealedRef.current?.();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Phase 2: Full CharacterCard — replaces the sealed card entirely
  if (phase === 2) {
    return (
      <div className="w-full max-w-lg mx-auto animate-card-entrance">
        <div className="mb-8">
          <CharacterCard data={data} />
        </div>
      </div>
    );
  }

  // Phase 0 & 1: Single persistent DOM that morphs via CSS transitions
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className={`reveal-card ${phase === 0 ? 'reveal-card-enter' : ''}`}
        style={{
          '--reveal-color': theme.primary,
          '--reveal-glow': theme.borderGlow,
          '--reveal-glow-color': theme.primary,
        } as React.CSSProperties}
      >
        {/* Icon — persistent across Phase 0 & 1 */}
        <span className="text-6xl transition-transform duration-500" aria-hidden="true">
          {theme.icon}
        </span>

        {/* Class name — persistent */}
        <p
          className="text-lg font-bold transition-opacity duration-300"
          style={{ color: theme.primary, fontFamily: 'var(--font-display)' }}
        >
          {data.class.nameEn}
        </p>

        {/* Level + Tier — fade in during Phase 1 */}
        <div
          className="flex flex-col items-center gap-1 transition-all duration-500"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
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
    </div>
  );
}
