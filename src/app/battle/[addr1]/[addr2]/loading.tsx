import TrustBanner from '@/components/TrustBanner';

export default function BattleLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="text-5xl mb-6 loading-pulse">{'\u2694\uFE0F'}</div>
          <p
            className="text-sm loading-pulse"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Preparing the arena...
          </p>
        </div>
      </main>
    </div>
  );
}
