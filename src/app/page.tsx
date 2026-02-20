import TrustBanner from '@/components/TrustBanner';
import LandingHero from '@/components/LandingHero';
import FAQ from '@/components/FAQ';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <LandingHero />

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
