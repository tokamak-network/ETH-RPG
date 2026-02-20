'use client';

import Link from 'next/link';
import { useWalletHistory } from '@/hooks/useWalletHistory';

function shortenAddress(addr: string): string {
  if (addr.endsWith('.eth')) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function RecentHeroes() {
  const { entries } = useWalletHistory();

  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Recent Heroes
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {entries.map((entry) => (
          <Link
            key={entry.address}
            href={`/result/${encodeURIComponent(entry.address)}`}
            className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="text-lg" aria-hidden="true">
              {entry.classIcon}
            </span>
            <div className="min-w-0">
              <p
                className="text-xs font-mono truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {entry.ensName ?? shortenAddress(entry.address)}
              </p>
              <p
                className="text-[10px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Lv.{entry.level} · {entry.power.toLocaleString()}P
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
