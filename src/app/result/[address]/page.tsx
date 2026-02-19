'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGenerateCharacter } from '@/hooks/useGenerateCharacter';
import TrustBanner from '@/components/TrustBanner';
import LoadingScreen from '@/components/LoadingScreen';
import CharacterCard from '@/components/CharacterCard';
import ShareButtons from '@/components/ShareButtons';

export default function ResultPage() {
  const params = useParams<{ address: string }>();
  const router = useRouter();
  const { status, data, error, step, generate } = useGenerateCharacter();

  const address = params.address ? decodeURIComponent(params.address) : '';

  useEffect(() => {
    if (address) {
      generate(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  function handleTryAnother() {
    router.push('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8">
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
              <div className="text-6xl mb-6">{'\u{1F6E1}\uFE0F'}</div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--color-accent-red)' }}
              >
                Summoning Failed
              </h2>
              <p
                className="mb-8 text-base"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {error}
              </p>
              <button
                onClick={handleTryAnother}
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

        {/* Success State */}
        {status === 'success' && data && (
          <div className="w-full max-w-lg mx-auto animate-card-entrance">
            {/* Character Card */}
            <div className="mb-8">
              <CharacterCard data={data} />
            </div>

            {/* Share Buttons */}
            <div className="mb-8">
              <ShareButtons data={data} />
            </div>

            {/* Battle CTA */}
            <button
              type="button"
              onClick={() => router.push(`/battle?challenger=${encodeURIComponent(data.address)}`)}
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
                Challenge another wallet to battle
              </p>
            </button>

            {/* Try Another */}
            <div className="text-center">
              <button
                onClick={handleTryAnother}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Summon Another Wallet
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
