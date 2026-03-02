'use client';

import type { FamousWallet } from '@/lib/famous-wallets';
import { CLASS_THEMES } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';

interface GalleryCardProps {
  readonly wallet: FamousWallet;
  readonly onClick: () => void;
}

const CARD_WIDTH_DESKTOP = 280;
const POWER_LOCALE = 'en-US';

export default function GalleryCard({ wallet, onClick }: GalleryCardProps) {
  const theme = CLASS_THEMES[wallet.classId];

  function handleClick() {
    trackEvent('gallery_card_click', { wallet: wallet.label });
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex-shrink-0 flex flex-col gap-3 rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-accent-gold/50 cursor-pointer"
      style={{
        width: `${CARD_WIDTH_DESKTOP}px`,
        maxWidth: '80vw',
        backgroundColor: 'var(--color-bg-secondary)',
        borderLeft: `3px solid ${theme.primary}`,
        border: `1px solid var(--color-border)`,
        borderLeftWidth: '3px',
        borderLeftColor: theme.primary,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${theme.primary}20`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Class icon + name */}
      <div className="flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">
          {theme.icon}
        </span>
        <span
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: theme.primary, fontFamily: 'var(--font-display)' }}
        >
          {wallet.classId.replace('_', ' ')}
        </span>
      </div>

      {/* Wallet label */}
      <p
        className="text-base font-bold leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {wallet.shortLabel}
      </p>

      {/* Preview description */}
      <p
        className="text-xs leading-relaxed line-clamp-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {wallet.previewDescription}
      </p>

      {/* Level + Power */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Lv. {wallet.level}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
        >
          {wallet.power.toLocaleString(POWER_LOCALE)} CP
        </span>
      </div>
    </button>
  );
}
