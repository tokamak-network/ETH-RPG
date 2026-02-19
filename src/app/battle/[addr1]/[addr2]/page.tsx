'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useBattle } from '@/hooks/useBattle';
import TrustBanner from '@/components/TrustBanner';
import LoadingScreen from '@/components/LoadingScreen';
import BattleArena from '@/components/BattleArena';
import BattleResultDisplay from '@/components/BattleResult';
import BattleLog from '@/components/BattleLog';

export default function BattleResultPage() {
  const params = useParams<{ addr1: string; addr2: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, data, error, step, startBattle } = useBattle();
  const [arenaComplete, setArenaComplete] = useState(false);

  const addr1 = params.addr1 ? decodeURIComponent(params.addr1) : '';
  const addr2 = params.addr2 ? decodeURIComponent(params.addr2) : '';
  const nonce = searchParams.get('n') ?? undefined;

  useEffect(() => {
    if (addr1 && addr2) {
      startBattle(addr1, addr2, nonce);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr1, addr2, nonce]);

  const handleArenaComplete = useCallback(() => {
    setArenaComplete(true);
  }, []);

  const handleRematch = useCallback(() => {
    setArenaComplete(false);
    // Navigate without nonce to get a fresh battle
    router.push(`/battle/${encodeURIComponent(addr1)}/${encodeURIComponent(addr2)}`);
    // Force re-fetch by starting a new battle without nonce
    startBattle(addr1, addr2);
  }, [addr1, addr2, router, startBattle]);

  function handleNewBattle() {
    router.push('/battle');
  }

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8">
        {/* Loading */}
        {status === 'loading' && (
          <div className="flex-1 flex items-center justify-center w-full">
            <LoadingScreen step={step} />
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex-1 flex items-center justify-center w-full animate-fade-in-up">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">{'\u{1F6E1}\uFE0F'}</div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--color-accent-red)' }}
              >
                Battle Failed
              </h2>
              <p
                className="mb-8 text-base"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {error}
              </p>
              <button
                type="button"
                onClick={handleNewBattle}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: 'var(--color-accent-gold)',
                  color: '#000',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && data && (
          <div className="w-full max-w-2xl mx-auto animate-card-entrance">
            {/* Battle Arena Animation */}
            <div className="mb-8">
              <BattleArena
                turns={data.result.turns}
                fighters={data.result.fighters}
                onComplete={handleArenaComplete}
              />
            </div>

            {/* Full Result + Log (shown after arena animation completes) */}
            {arenaComplete && (
              <>
                <div className="mb-8 animate-fade-in-up">
                  <BattleResultDisplay data={data} onRematch={handleRematch} />
                </div>

                <div className="mb-8 animate-fade-in-up">
                  <BattleLog turns={data.result.turns} fighters={data.result.fighters} />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 animate-fade-in-up">
                  <button
                    type="button"
                    onClick={handleNewBattle}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    New Battle
                  </button>
                  <a
                    href="/"
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    Character Card
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
