'use client';

import Link from 'next/link';
import { FAMOUS_WALLETS } from '@/lib/famous-wallets';
import { trackEvent } from '@/lib/analytics';

export default function FamousWallets() {
  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Famous Heroes
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {FAMOUS_WALLETS.map((wallet) => (
          <Link
            key={wallet.address}
            href={`/result/${encodeURIComponent(wallet.address)}`}
            onClick={() => trackEvent('famous_wallet_click', { wallet: wallet.label })}
            className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="text-lg" aria-hidden="true">
              {wallet.icon}
            </span>
            <div className="min-w-0">
              <p
                className="text-xs font-mono truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {wallet.label}
              </p>
              <p
                className="text-[10px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Lv.{wallet.level} · {wallet.power.toLocaleString()}P
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
