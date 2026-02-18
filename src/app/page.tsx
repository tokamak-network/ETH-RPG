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
    <div className="min-h-screen flex flex-col">
      <TrustBanner />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl font-bold mb-4 text-gold-shimmer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Eth{'\u00B7'}RPG
          </h1>
          <p className="text-xl sm:text-2xl mb-12" style={{ color: 'var(--color-text-secondary)' }}>
            What hero is your wallet?
          </p>

          {/* Address Input */}
          <div className="max-w-lg mx-auto mb-16">
            <AddressInput onSubmit={handleSubmit} isLoading={isNavigating} />
          </div>

          {/* Sample Classes Preview */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 max-w-md mx-auto mb-16">
            {[
              { icon: '\u{1F3F9}', name: 'Hunter', color: '#22c55e' },
              { icon: '\u{1F5E1}\uFE0F', name: 'Rogue', color: '#ef4444' },
              { icon: '\u{1F300}', name: 'Summoner', color: '#8b5cf6' },
              { icon: '\u{1F4B0}', name: 'Merchant', color: '#f4c430' },
              { icon: '\u2720\uFE0F', name: 'Priest', color: '#60a5fa' },
              { icon: '\u{1F52E}', name: 'Wizard', color: '#a78bfa' },
              { icon: '\u{1F6E1}\uFE0F', name: 'Guardian', color: '#f97316' },
              { icon: '\u2694\uFE0F', name: 'Warrior', color: '#94a3b8' },
            ].map((cls) => (
              <div
                key={cls.name}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{cls.icon}</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: cls.color }}
                >
                  {cls.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="max-w-2xl mx-auto w-full px-4 pb-16">
        <h2
          className="text-2xl font-bold text-center mb-8"
          style={{ color: 'var(--color-text-primary)' }}
        >
          FAQ
        </h2>
        <FAQ />
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Eth{'\u00B7'}RPG — Only public blockchain data is used
        </p>
      </footer>
    </div>
  );
}
