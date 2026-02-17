'use client';

import type { GenerateResponse } from '@/lib/types';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS } from '@/styles/themes';
import StatBar from './StatBar';
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
  const theme = CLASS_THEMES[data.class.id];
  const displayName = data.ensName ?? shortenAddress(data.address);

  return (
    <div
      className="card-glow relative w-full max-w-md mx-auto rounded-2xl border p-6 sm:p-8"
      style={{
        backgroundColor: '#12121a',
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
          <PixelCharacter classId={data.class.id} size={128} />
        </div>
      </div>

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

      {/* Lore */}
      <div className="border-t border-border pt-4">
        <p className="text-sm text-text-secondary italic text-center leading-relaxed">
          {data.lore}
        </p>
      </div>
    </div>
  );
}
