'use client';

import { useState, useEffect } from 'react';
import type { Season } from '@/lib/types';

interface SeasonInfoBarProps {
  readonly season: Season | null;
}

function useCountdown(endsAt: number): { days: number; hours: number; minutes: number } {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    }, 60_000); // Update every minute
    return () => clearInterval(interval);
  }, [endsAt]);

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes };
}

export default function SeasonInfoBar({ season }: SeasonInfoBarProps) {
  const countdown = useCountdown(season?.endsAt ?? 0);

  if (!season) {
    return (
      <div
        className="rounded-xl px-6 py-4 text-center"
        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Rankings have not been initialized yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
      style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg" style={{ color: '#f4c430', fontFamily: 'var(--font-display)' }}>
          Season {season.number}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {season.name}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: 'var(--color-text-muted)' }}>Ends in:</span>
        <span className="font-semibold tabular-nums" style={{ color: '#f4c430' }}>
          {countdown.days}d {countdown.hours}h {countdown.minutes}m
        </span>
      </div>
    </div>
  );
}
