'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGenerateCharacter } from '@/hooks/useGenerateCharacter';
import { useWalletHistory } from '@/hooks/useWalletHistory';
import { useSound } from '@/contexts/SoundContext';
import TrustBanner from '@/components/TrustBanner';
import LoadingScreen from '@/components/LoadingScreen';
import CardReveal from '@/components/CardReveal';
import ShareButtons from '@/components/ShareButtons';
import AddressInput from '@/components/AddressInput';
import FamousWallets from '@/components/FamousWallets';
import { CLASS_THEMES } from '@/styles/themes';
import { usePageView } from '@/hooks/useAnalytics';
import { trackEvent } from '@/lib/analytics';
import { ErrorCode } from '@/lib/types';
import type { CharacterClassId } from '@/lib/types';
import { COPY } from '@/lib/experiment-copy';
import { CLASS_LABELS } from '@/styles/themes';
import { FAMOUS_WALLETS } from '@/lib/famous-wallets';

export default function ResultPage() {
  const params = useParams<{ address: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuiz = searchParams.get('from') === 'quiz';
  const predictedClassId = searchParams.get('predicted') as CharacterClassId | null;
  const { status, data, error, errorCode, step, generate } = useGenerateCharacter();
  const { addEntry } = useWalletHistory();
  const { playSummon, playRevealSeal, playRevealTier } = useSound();
  const [revealed, setRevealed] = useState(false);

  const address = params.address ? decodeURIComponent(params.address) : '';
  usePageView('result');

  useEffect(() => {
    if (address) {
      generate(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Track card generation + save to history on success
  useEffect(() => {
    if (status === 'success' && data) {
      trackEvent('card_generated', {
        class: data.class.id,
        level: data.stats.level,
        power: data.stats.power,
      });

      const theme = CLASS_THEMES[data.class.id];
      addEntry({
        address: data.address,
        ensName: data.ensName,
        classId: data.class.id,
        className: data.class.nameEn,
        classIcon: theme.icon,
        level: data.stats.level,
        power: data.stats.power,
      });
    }
  }, [status, data, addEntry]);

  const handlePhaseChange = useCallback((phase: 0 | 1 | 2) => {
    if (phase === 1) playRevealSeal();
    if (phase === 2) playRevealTier();
  }, [playRevealSeal, playRevealTier]);

  const handleRevealed = useCallback(() => {
    playSummon();
    setRevealed(true);
  }, [playSummon]);

  function handleTryAnother() {
    router.push('/');
  }

  function handleViralSubmit(addr: string) {
    router.push(`/result/${encodeURIComponent(addr)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8" aria-live="polite" aria-busy={status === 'loading'}>
        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex-1 flex items-center justify-center w-full">
            <LoadingScreen step={step} />
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="flex-1 flex items-center justify-center w-full animate-fade-in-up">
            <div className="text-center max-w-md">
              {errorCode === ErrorCode.NO_TRANSACTIONS ? (
                <>
                  <div className="text-6xl mb-6">{'\u{1F4AD}'}</div>
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    No Adventures Yet
                  </h2>
                  <p
                    className="mb-6 text-base"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {COPY.noTxDescription}
                  </p>
                  <FamousWallets />
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleTryAnother}
                      className="text-sm transition-colors hover:underline cursor-pointer"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {'\u2190'} Try another address
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-6">{'\u{1F6E1}\uFE0F'}</div>
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: 'var(--color-accent-red)' }}
                  >
                    {COPY.errorHeading}
                  </h2>
                  <p
                    className="mb-8 text-base"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={handleTryAnother}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer hover:brightness-110"
                    style={{
                      backgroundColor: 'var(--color-accent-gold)',
                      color: '#000',
                    }}
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && data && (
          <div className="w-full max-w-lg mx-auto">
            {/* Quiz prediction comparison banner */}
            {fromQuiz && predictedClassId && (
              <div
                className="text-center rounded-xl p-4 mb-6 animate-fade-in-up"
                style={{
                  backgroundColor: predictedClassId === data.class.id
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(244, 196, 48, 0.1)',
                  border: `1px solid ${predictedClassId === data.class.id ? '#22c55e40' : '#f4c43040'}`,
                }}
              >
                {predictedClassId === data.class.id ? (
                  <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                    {'\u2705'} Quiz predicted {CLASS_LABELS[predictedClassId]} — spot on!
                  </p>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-accent-gold)' }}>
                    {'\u{1F52E}'} Quiz predicted {CLASS_LABELS[predictedClassId]} — actual result: {data.class.name}!
                  </p>
                )}
              </div>
            )}

            {/* Card Reveal Animation */}
            <CardReveal data={data} onPhaseChange={handlePhaseChange} onRevealed={handleRevealed} />

            {/* Below-card content — only after reveal */}
            {revealed && (
              <div className="animate-fade-in-up">
                {/* Share Buttons */}
                <div className="mb-8">
                  <ShareButtons data={data} />
                </div>

                {/* Battle CTA */}
                {(() => {
                  const isFamousWallet = FAMOUS_WALLETS.some(
                    (w) => w.address.toLowerCase() === data.address.toLowerCase(),
                  );
                  const displayName = data.ensName ?? `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (isFamousWallet) {
                          router.push(`/battle?opponent=${encodeURIComponent(data.address)}`);
                        } else {
                          router.push(`/battle?challenger=${encodeURIComponent(data.address)}`);
                        }
                      }}
                      className="w-full text-center p-6 rounded-xl mb-8 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-accent-gold)',
                        boxShadow: '0 0 40px rgba(244, 196, 48, 0.08)',
                      }}
                    >
                      <p
                        className="text-lg font-bold mb-2"
                        style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
                      >
                        {'\u2694\uFE0F'} Power {data.stats.power.toLocaleString()}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {isFamousWallet
                          ? `Battle ${displayName} with YOUR wallet`
                          : 'Challenge another wallet to battle'}
                      </p>
                    </button>
                  );
                })()}

                {/* Viral CTA */}
                <div className="text-center">
                  <p
                    className="text-lg font-bold mb-4"
                    style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {COPY.viralCta}
                  </p>
                  <AddressInput onSubmit={handleViralSubmit} isLoading={false} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
