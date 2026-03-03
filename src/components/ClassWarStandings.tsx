'use client';

import { useEffect, useState } from 'react';
import { useClassWar } from '@/hooks/useClassWar';
import { CLASS_THEMES, CLASS_LABELS } from '@/styles/themes';
import type { CharacterClassId } from '@/lib/types';
import type { ClassWarScore } from '@/lib/classwar-types';

const SECTION_HEADING = 'Class War';
const SECTION_SUBHEADING = 'Weekly 8-class battle for dominance';
const BUFF_LABEL = '+5% DMG Buff';
const BATTLES_SUFFIX = 'battles to catch up';
const LOCAL_STORAGE_CLASS_KEY = 'ethrpg_last_class';

function getStoredClassId(): CharacterClassId | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CLASS_KEY);
    if (stored && stored in CLASS_LABELS) {
      return stored as CharacterClassId;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

function formatTimeRemaining(endsAt: number): string {
  const remaining = Math.max(0, endsAt - Date.now());
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return 'Ending soon';
}

function ClassWarBar({
  entry,
  maxScore,
  isMyClass,
  isBuffed,
}: {
  readonly entry: ClassWarScore;
  readonly maxScore: number;
  readonly isMyClass: boolean;
  readonly isBuffed: boolean;
}) {
  const theme = CLASS_THEMES[entry.classId];
  const widthPercent = maxScore > 0 ? Math.max(2, (entry.score / maxScore) * 100) : 2;

  return (
    <div className={`flex items-center gap-3 py-1.5 ${isMyClass ? 'relative' : ''}`}>
      {/* Rank */}
      <span
        className="w-5 text-xs font-bold text-right shrink-0"
        style={{ color: entry.rank === 1 ? '#f4c430' : 'var(--color-text-muted)' }}
      >
        {entry.rank === 1 ? '\u{1F451}' : `#${entry.rank}`}
      </span>

      {/* Class icon + name */}
      <div className="w-24 shrink-0 flex items-center gap-1.5">
        <span className="text-sm">{theme.icon}</span>
        <span
          className="text-xs font-semibold truncate"
          style={{ color: theme.primary }}
        >
          {CLASS_LABELS[entry.classId]}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ backgroundColor: `${theme.primary}10` }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: theme.primary,
            opacity: 0.8,
            boxShadow: isMyClass ? `0 0 8px ${theme.primary}60` : undefined,
          }}
        />
        {isBuffed && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold"
            style={{ color: '#f4c430' }}
          >
            {BUFF_LABEL}
          </span>
        )}
      </div>

      {/* Score */}
      <span
        className="w-12 text-xs font-mono text-right shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {entry.score.toLocaleString()}
      </span>
    </div>
  );
}

function PersonalMessage({
  myClassId,
  scores,
}: {
  readonly myClassId: CharacterClassId;
  readonly scores: readonly ClassWarScore[];
}) {
  const myEntry = scores.find((s) => s.classId === myClassId);
  if (!myEntry) return null;

  const topEntry = scores[0];
  const className = CLASS_LABELS[myClassId];
  const theme = CLASS_THEMES[myClassId];

  if (myEntry.rank === 1) {
    return (
      <p className="text-xs mt-3 text-center" style={{ color: theme.primary }}>
        Your class <strong>{className}</strong> is leading! Keep fighting.
      </p>
    );
  }

  const deficit = topEntry.score - myEntry.score;
  const battlesToCatchUp = Math.ceil(deficit / 3);

  return (
    <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
      <span style={{ color: theme.primary, fontWeight: 600 }}>{className}</span> is #{myEntry.rank} &mdash;{' '}
      {battlesToCatchUp} {BATTLES_SUFFIX}
    </p>
  );
}

export default function ClassWarStandings() {
  const { status, data, fetchStandings } = useClassWar();
  const [myClassId, setMyClassId] = useState<CharacterClassId | null>(null);

  useEffect(() => {
    fetchStandings();
    setMyClassId(getStoredClassId());
  }, [fetchStandings]);

  // Don't render anything while loading or if no data
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="animate-pulse rounded-xl p-6" style={{ backgroundColor: 'var(--color-card-bg)' }}>
        <div className="h-4 w-24 rounded bg-white/10 mx-auto mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-5 rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' || !data) {
    // Silently degrade — don't show error to users
    return null;
  }

  const maxScore = data.scores.length > 0 ? Math.max(...data.scores.map((s) => s.score)) : 0;

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {SECTION_HEADING}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {SECTION_SUBHEADING}
          </p>
        </div>
        <div
          className="text-xs font-mono px-2 py-1 rounded-md"
          style={{
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {formatTimeRemaining(data.week.endsAt)}
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-0.5">
        {data.scores.map((entry) => (
          <ClassWarBar
            key={entry.classId}
            entry={entry}
            maxScore={maxScore}
            isMyClass={myClassId === entry.classId}
            isBuffed={data.buffClassId === entry.classId}
          />
        ))}
      </div>

      {/* Total battles */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {data.totalBattles.toLocaleString()} battles this week
        </span>
        {data.buffClassId && (
          <span className="text-xs" style={{ color: '#f4c430' }}>
            {CLASS_THEMES[data.buffClassId].icon} {CLASS_LABELS[data.buffClassId]} has the buff
          </span>
        )}
      </div>

      {/* Personal message */}
      {myClassId && <PersonalMessage myClassId={myClassId} scores={data.scores} />}
    </div>
  );
}
