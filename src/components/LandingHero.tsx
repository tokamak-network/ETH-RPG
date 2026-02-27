'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import RotatingSubtitle from '@/components/RotatingSubtitle';
import { usePageView } from '@/hooks/useAnalytics';
import { FAMOUS_WALLETS } from '@/lib/famous-wallets';
import { CLASS_THEMES } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';

const SAMPLE_WALLETS = FAMOUS_WALLETS.slice(0, 3);

export default function LandingHero() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  usePageView('landing');

  function handleSubmit(address: string) {
    setIsNavigating(true);
    router.push(`/result/${encodeURIComponent(address)}`);
  }

  return (
    <>
      {/* Logo Icon */}
      <div className="hero-glow mb-6">
        <span className="text-5xl" aria-hidden="true">{'\u2694\uFE0F'}</span>
      </div>

      {/* Title */}
      <h1
        className="text-5xl sm:text-7xl font-bold mb-6 text-gold-shimmer"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Eth{'\u00B7'}RPG
      </h1>

      {/* Narrative subtitle */}
      <p className="text-base sm:text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        The blockchain holds your history.
      </p>
      <RotatingSubtitle />

      {/* Address Input */}
      <div className="max-w-lg mx-auto mb-4">
        <AddressInput onSubmit={handleSubmit} isLoading={isNavigating} autoFocus />
      </div>

      {/* Trust micro-text */}
      <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Only public data is analyzed.
      </p>

      {/* Try a famous wallet */}
      <div className="mb-6">
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          or try a famous wallet
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {SAMPLE_WALLETS.map((wallet) => {
            const theme = CLASS_THEMES[wallet.classId];
            return (
              <button
                key={wallet.address}
                type="button"
                disabled={isNavigating}
                onClick={() => {
                  trackEvent('famous_wallet_click', { wallet: wallet.label });
                  handleSubmit(wallet.address);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: `1px solid ${theme.primary}30`,
                  color: 'var(--color-text-primary)',
                }}
              >
                <span aria-hidden="true">{theme.icon}</span>
                <span>{wallet.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Battle Mode CTA */}
      <div className="mb-6">
        <a
          href="/battle"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span aria-hidden="true">{'\u2694\uFE0F'}</span>
          <span className="sm:hidden">Battle Mode</span>
          <span className="hidden sm:inline">Battle Mode — Pit two wallets against each other</span>
        </a>
      </div>
    </>
  );
}
