'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TrustBanner from '@/components/TrustBanner';
import BattleInput from '@/components/BattleInput';

export default function BattlePage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSubmit(addr1: string, addr2: string) {
    setIsNavigating(true);
    router.push(`/battle/${encodeURIComponent(addr1)}/${encodeURIComponent(addr2)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* Battle icon */}
          <div className="hero-glow mb-6">
            <span className="text-5xl" aria-hidden="true">{'\u2694\uFE0F'}</span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-6xl font-bold mb-4 text-gold-shimmer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wallet Battle
          </h1>

          <p
            className="text-lg sm:text-xl mb-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Whose wallet reigns supreme?
          </p>

          {/* Dual address input */}
          <div className="max-w-lg mx-auto mb-6">
            <BattleInput onSubmit={handleSubmit} isLoading={isNavigating} />
          </div>

          {/* Trust micro-text */}
          <p className="text-xs mb-16" style={{ color: 'var(--color-text-muted)' }}>
            Only public blockchain data is analyzed. No wallet connection needed.
          </p>

          {/* Famous duels */}
          <div className="mb-8">
            <h2
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-6"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}
            >
              Famous Duels
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {[
                {
                  label: 'Vitalik vs Uniswap',
                  addr1: 'vitalik.eth',
                  addr2: '0x1a9c8182c09f50c8318d769245bea52c32be35bc',
                },
                {
                  label: 'ENS vs Aave',
                  addr1: '0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7',
                  addr2: '0x3744da57184575064838bbc87a0fc791f5e39ea2',
                },
              ].map((duel) => (
                <button
                  key={duel.label}
                  type="button"
                  onClick={() => handleSubmit(duel.addr1, duel.addr2)}
                  disabled={isNavigating}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {'\u2694\uFE0F'} {duel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Back link */}
          <div className="text-center">
            <a
              href="/"
              className="text-sm transition-colors hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {'\u2190'} Back to character generation
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
