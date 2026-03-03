'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FAMOUS_WALLETS } from '@/lib/famous-wallets';
import { trackEvent } from '@/lib/analytics';
import GalleryCard from '@/components/GalleryCard';

const SECTION_HEADING = 'Famous Wallets';
const CTA_HEADING = 'Your Turn';
const CTA_SUBTEXT = "What's your on-chain class?";
const CTA_BUTTON_LABEL = 'See your class';
const CTA_ICON = '?';
const GALLERY_PADDING_X = 24;

function scrollToAddressInput() {
  const input = document.getElementById('address-input');
  if (input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Small delay to ensure scroll completes before focusing
    setTimeout(() => input.focus(), 300);
  }
}

export default function WalletGallery() {
  const router = useRouter();

  useEffect(() => {
    trackEvent('gallery_view');
  }, []);

  function handleCardClick(address: string) {
    router.push(`/result/${encodeURIComponent(address)}`);
  }

  function handleCtaClick() {
    trackEvent('gallery_cta_click');
    scrollToAddressInput();
  }

  return (
    <section className="py-6" aria-label={SECTION_HEADING}>
      {/* Section header */}
      <h2
        className="text-xs font-semibold uppercase tracking-[0.2em] mb-5 px-6 text-center"
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {SECTION_HEADING}
      </h2>

      {/* Horizontal scroll container */}
      <div
        className="gallery-scroll scrollbar-hide overflow-x-auto flex gap-4"
        style={{ paddingLeft: `${GALLERY_PADDING_X}px`, paddingRight: `${GALLERY_PADDING_X}px` }}
      >
        {FAMOUS_WALLETS.map((wallet) => (
          <GalleryCard
            key={wallet.address}
            wallet={wallet}
            onClick={() => handleCardClick(wallet.address)}
          />
        ))}

        {/* "Your Turn" CTA card */}
        <button
          type="button"
          onClick={handleCtaClick}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-3 rounded-xl p-5 text-center transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-accent-gold/50 cursor-pointer"
          style={{
            width: '280px',
            maxWidth: '80vw',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '2px solid var(--color-accent-gold)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 20px rgba(244, 196, 48, 0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {/* Question mark icon */}
          <span
            className="text-5xl font-bold"
            style={{
              color: 'var(--color-accent-gold)',
              fontFamily: 'var(--font-display)',
            }}
            aria-hidden="true"
          >
            {CTA_ICON}
          </span>

          {/* Heading */}
          <p
            className="text-lg font-bold"
            style={{
              color: 'var(--color-accent-gold)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {CTA_HEADING}
          </p>

          {/* Subtext */}
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {CTA_SUBTEXT}
          </p>

          {/* CTA button label */}
          <span
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold mt-1 transition-colors"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: 'var(--color-bg-primary)',
            }}
          >
            {CTA_BUTTON_LABEL} {'\u2192'}
          </span>
        </button>
      </div>
    </section>
  );
}
