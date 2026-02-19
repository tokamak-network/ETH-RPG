'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TrustBanner from '@/components/TrustBanner';
import AddressInput from '@/components/AddressInput';
import FAQ from '@/components/FAQ';

export default function LandingPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSubmit(address: string) {
    setIsNavigating(true);
    router.push(`/result/${encodeURIComponent(address)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
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

          {/* Character Classes Section */}
          <div id="classes" className="mb-16">
            <h2
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-8"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}
            >
              Character Classes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { icon: '\u{1F3F9}', name: 'Hunter', color: '#22c55e', desc: 'NFT collectors & traders' },
                { icon: '\u{1F5E1}\uFE0F', name: 'Rogue', color: '#ef4444', desc: 'DEX swap specialists' },
                { icon: '\u{1F300}', name: 'Summoner', color: '#8b5cf6', desc: 'Cross-chain bridge users' },
                { icon: '\u{1F4B0}', name: 'Merchant', color: '#f4c430', desc: 'Stablecoin transfer pros' },
                { icon: '\u2720\uFE0F', name: 'Priest', color: '#60a5fa', desc: 'Gas-heavy contract callers' },
                { icon: '\u{1F52E}', name: 'Elder Wizard', color: '#a78bfa', desc: 'Ancient wallet veterans' },
                { icon: '\u{1F6E1}\uFE0F', name: 'Guardian', color: '#f97316', desc: 'Long-term ETH holders' },
                { icon: '\u2694\uFE0F', name: 'Warrior', color: '#94a3b8', desc: 'Versatile on-chain fighters' },
              ].map((cls) => (
                <div
                  key={cls.name}
                  className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: `${cls.color}08`,
                    border: `1px solid ${cls.color}20`,
                  }}
                >
                  <span className="text-2xl">{cls.icon}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: cls.color }}
                  >
                    {cls.name}
                  </span>
                  <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                    {cls.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-2xl mx-auto w-full px-4 pb-16">
        <h2
          className="text-sm font-semibold uppercase tracking-[0.2em] text-center mb-8"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Frequently Asked Questions
        </h2>
        <FAQ />
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-8 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Eth{'\u00B7'}RPG — Only public blockchain data is used
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
          Built for the on-chain community
        </p>
      </footer>
    </div>
  );
}
