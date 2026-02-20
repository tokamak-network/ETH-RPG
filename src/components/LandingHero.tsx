'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import { usePageView } from '@/hooks/useAnalytics';

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
      <p
        className="text-xl sm:text-2xl font-semibold mb-12"
        style={{ color: 'var(--color-text-primary)' }}
      >
        What hero is your wallet?
      </p>

      {/* Address Input */}
      <div className="max-w-lg mx-auto mb-4">
        <AddressInput onSubmit={handleSubmit} isLoading={isNavigating} />
      </div>

      {/* Trust micro-text */}
      <p className="text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Only public data is analyzed.
      </p>

      {/* Battle Mode CTA */}
      <div className="mb-16">
        <a
          href="/battle"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span aria-hidden="true">{'\u2694\uFE0F'}</span>
          <span>Battle Mode — Pit two wallets against each other</span>
        </a>
      </div>
    </>
  );
}
