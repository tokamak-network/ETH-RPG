'use client';

import { useState, useCallback } from 'react';
import type { GenerateResponse } from '@/lib/types';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS } from '@/styles/themes';
import StatBar from './StatBar';
import AchievementRow from './AchievementRow';
import { PixelCharacter } from './pixel-sprites';

interface CharacterCardProps {
  readonly data: GenerateResponse;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const STAT_ENTRIES = [
  { key: 'hp', label: 'HP' },
  { key: 'mp', label: 'MP' },
  { key: 'str', label: 'STR' },
  { key: 'int', label: 'INT' },
  { key: 'luck', label: 'LUCK' },
] as const;

export default function CharacterCard({ data }: CharacterCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const theme = CLASS_THEMES[data.class.id];
  const displayName = data.ensName ?? shortenAddress(data.address);
  const longLoreText = data.longLore || data.lore;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip],
  );

  return (
    <div className="card-flip-container w-full max-w-md mx-auto">
      <div
        className={`card-flip-inner relative ${isFlipped ? 'is-flipped' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={
          isFlipped
            ? 'View card front (click to flip)'
            : 'View card back (click to flip)'
        }
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
      >
        {/* Front face */}
        <div
          className="card-face card-glow relative w-full rounded-2xl border p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: theme.primary,
            boxShadow: theme.borderGlow,
            '--glow-color': theme.borderGlow,
          } as React.CSSProperties}
        >
          {/* Header: Class icon + name + level */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {theme.icon}
              </span>
              <div>
                <h2
                  className="text-xl font-bold font-display tracking-wide"
                  style={{ color: theme.primary }}
                >
                  {data.class.name}
                </h2>
                <p className="text-xs text-text-muted">{data.class.nameEn}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Level</p>
              <p
                className="text-2xl font-bold font-mono"
                style={{ color: theme.primary }}
              >
                {data.stats.level}
              </p>
            </div>
          </div>

          {/* Display name */}
          <p className="text-center text-sm font-mono text-text-secondary mb-4 truncate">
            {displayName}
          </p>

          {/* Pixel character sprite */}
          <div className="flex justify-center mb-5">
            <div
              className="rounded-lg p-3"
              style={{
                border: `1px solid ${theme.primary}20`,
                background: `radial-gradient(circle, ${theme.primary}08 0%, transparent 70%)`,
              }}
            >
              <PixelCharacter classId={data.class.id} size={128} stats={data.stats} />
            </div>
          </div>

          {/* Achievement badges */}
          {data.achievements?.length > 0 && (
            <div className="mb-4">
              <AchievementRow achievements={data.achievements} />
            </div>
          )}

          {/* Stat bars */}
          <div className="flex flex-col gap-2 mb-6">
            {STAT_ENTRIES.map(({ key, label }) => (
              <StatBar
                key={key}
                label={label}
                value={data.stats[key]}
                maxValue={STAT_MAX_VALUES[key]}
                color={STAT_COLORS[key]}
              />
            ))}
          </div>

          {/* Power */}
          <div className="text-center mb-6">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
              Combat Power
            </p>
            <p className="text-4xl font-bold font-display text-gold-shimmer">
              {data.stats.power.toLocaleString()}
            </p>
          </div>

          {/* Flip hint */}
          <p className="text-xs text-text-muted text-center mt-3 opacity-60">
            Tap to view lore
          </p>
        </div>

        {/* Back face */}
        <div
          className="card-face-back card-glow absolute inset-0 w-full rounded-2xl border p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
          style={{
            background: theme.gradient,
            borderColor: theme.primary,
            boxShadow: theme.borderGlow,
            '--glow-color': theme.borderGlow,
          } as React.CSSProperties}
        >
          {/* Back header: icon + class + level */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl" aria-hidden="true">
                  {theme.icon}
                </span>
                <div>
                  <h2
                    className="text-xl font-bold font-display tracking-wide"
                    style={{ color: theme.primary }}
                  >
                    {data.class.name}
                  </h2>
                  <p className="text-xs text-text-muted">{data.class.nameEn}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Lv.</p>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: theme.primary }}
                >
                  {data.stats.level}
                </p>
              </div>
            </div>

            {/* Display name */}
            <p className="text-center text-sm font-mono text-text-secondary mb-6 truncate">
              {displayName}
            </p>

            {/* Long lore narrative */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{
                backgroundColor: 'rgba(10, 10, 15, 0.7)',
                border: `1px solid ${theme.primary}30`,
              }}
            >
              <p className="text-sm text-text-primary italic leading-relaxed text-center">
                {longLoreText}
              </p>
            </div>
          </div>

          {/* Power at bottom */}
          <div>
            <div className="text-center">
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
                Combat Power
              </p>
              <p className="text-4xl font-bold font-display text-gold-shimmer">
                {data.stats.power.toLocaleString()}
              </p>
            </div>

            {/* Flip back hint */}
            <p className="text-xs text-text-muted text-center mt-3 opacity-60">
              Tap to go back
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
