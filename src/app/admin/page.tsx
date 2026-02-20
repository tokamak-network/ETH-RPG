'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MetricsSnapshot, HourlyBucket } from '@/lib/metrics';
import { CLASS_THEMES } from '@/styles/themes';
import type { CharacterClassId } from '@/lib/types';

const REFRESH_INTERVAL_MS = 30_000;

const CLASS_ORDER: readonly CharacterClassId[] = [
  'hunter', 'rogue', 'summoner', 'merchant',
  'priest', 'elder_wizard', 'guardian', 'warrior',
] as const;

const CLASS_LABELS: Record<CharacterClassId, string> = {
  hunter: 'Hunter',
  rogue: 'Rogue',
  summoner: 'Summoner',
  merchant: 'Merchant',
  priest: 'Priest',
  elder_wizard: 'Elder Wizard',
  guardian: 'Guardian',
  warrior: 'Warrior',
};

function FunnelBar({ label, value, maxValue }: {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
}) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-right shrink-0" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex-1 h-6 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #f4c430, #f97316)',
            minWidth: value > 0 ? '2px' : '0',
          }}
        />
      </div>
      <span className="w-16 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {value.toLocaleString()}
      </span>
      <span className="w-12 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {pct}%
      </span>
    </div>
  );
}

function CounterCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
    >
      <div className="text-2xl font-bold tabular-nums" style={{ color: '#f4c430' }}>
        {value.toLocaleString()}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}

function ClassDistChart({ distribution }: { readonly distribution: Readonly<Record<string, number>> }) {
  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div className="space-y-2">
      {CLASS_ORDER.map((classId) => {
        const count = distribution[classId] ?? 0;
        const pct = Math.round((count / maxCount) * 100);
        const theme = CLASS_THEMES[classId];
        return (
          <div key={classId} className="flex items-center gap-3 text-sm">
            <span className="w-28 text-right shrink-0" style={{ color: theme.primary }}>
              {theme.icon} {CLASS_LABELS[classId]}
            </span>
            <div className="flex-1 h-5 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: theme.primary, minWidth: count > 0 ? '2px' : '0' }}
              />
            </div>
            <span className="w-12 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ data }: { readonly data: readonly HourlyBucket[] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const width = 600;
  const height = 80;
  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * usableWidth;
    const y = height - padding - (d.count / maxCount) * usableHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
      <polyline
        points={points}
        fill="none"
        stroke="#f4c430"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EventFeed({ events }: { readonly events: readonly { name: string; timestamp: number; properties?: Record<string, unknown> }[] }) {
  return (
    <div className="max-h-64 overflow-y-auto space-y-1 text-xs font-mono">
      {events.map((evt, i) => {
        const time = new Date(evt.timestamp).toLocaleTimeString();
        return (
          <div
            key={`${evt.timestamp}-${i}`}
            className="flex gap-2 py-1 px-2 rounded"
            style={{ backgroundColor: i % 2 === 0 ? 'var(--color-surface-alt)' : 'transparent' }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>{time}</span>
            <span style={{ color: '#f4c430' }}>{evt.name}</span>
            {evt.properties && (
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {Object.entries(evt.properties).map(([k, v]) => `${k}=${v}`).join(' ')}
              </span>
            )}
          </div>
        );
      })}
      {events.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)' }}>No events recorded yet.</div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Extract admin key from URL
  const getAdminKey = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('key');
  }, []);

  const fetchMetrics = useCallback(async () => {
    const key = getAdminKey();
    if (!key) {
      setError('Missing admin key. Access via /admin?key=YOUR_SECRET');
      return;
    }

    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid admin key.');
        } else {
          setError(`Failed to fetch metrics (${res.status})`);
        }
        return;
      }
      const data = await res.json() as MetricsSnapshot;
      setSnapshot(data);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to connect to metrics API.');
    }
  }, [getAdminKey]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>Access Denied</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading metrics...</div>
      </div>
    );
  }

  const c = snapshot.counters;
  const funnelMax = Math.max(1, c.funnel_landing ?? 0);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f4c430', fontFamily: 'var(--font-display)' }}>
              Eth·RPG Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Server-side metrics dashboard
            </p>
          </div>
          {lastRefresh && (
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Last refresh: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
            </div>
          )}
        </div>

        {/* Key counters */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CounterCard label="Total Generations" value={c.generate_total ?? 0} />
            <CounterCard label="Fresh / Cached" value={c.generate_fresh ?? 0} />
            <CounterCard label="Total Battles" value={c.battle_total ?? 0} />
            <CounterCard label="Total Shares" value={(c.share_twitter ?? 0) + (c.share_farcaster ?? 0) + (c.share_clipboard ?? 0)} />
          </div>
        </section>

        {/* Funnel */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Conversion Funnel
          </h2>
          <div className="space-y-2">
            <FunnelBar label="Landing" value={c.funnel_landing ?? 0} maxValue={funnelMax} />
            <FunnelBar label="Input Focus" value={c.funnel_input_focus ?? 0} maxValue={funnelMax} />
            <FunnelBar label="Generate Start" value={c.funnel_generate_start ?? 0} maxValue={funnelMax} />
            <FunnelBar label="Generate OK" value={c.funnel_generate_success ?? 0} maxValue={funnelMax} />
            <FunnelBar label="Share" value={c.funnel_share ?? 0} maxValue={funnelMax} />
          </div>
        </section>

        {/* Class distribution + hourly activity side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Class Distribution
            </h2>
            <ClassDistChart distribution={snapshot.classDistribution} />
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Hourly Activity (72h)
            </h2>
            <Sparkline data={snapshot.hourlyActivity} />
          </section>
        </div>

        {/* Errors */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Errors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CounterCard label="API Errors" value={c.error_api ?? 0} />
            <CounterCard label="Rate Limited" value={c.error_rate_limit ?? 0} />
            <CounterCard label="Invalid Address" value={c.error_invalid_address ?? 0} />
            <CounterCard label="Empty Wallet" value={c.error_empty_wallet ?? 0} />
          </div>
        </section>

        {/* Recent events */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Recent Events
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <EventFeed events={snapshot.recentEvents} />
          </div>
        </section>
      </div>
    </div>
  );
}
