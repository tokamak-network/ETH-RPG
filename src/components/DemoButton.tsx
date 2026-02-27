'use client';

import { DEMO_WALLET } from '@/lib/famous-wallets';
import { CLASS_THEMES } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';

interface DemoButtonProps {
  readonly onTry: (address: string) => void;
  readonly isLoading: boolean;
}

export default function DemoButton({ onTry, isLoading }: DemoButtonProps) {
  function handleClick() {
    trackEvent('demo_try_wallet', { wallet: DEMO_WALLET.address });
    onTry(DEMO_WALLET.address);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span aria-hidden="true">{CLASS_THEMES[DEMO_WALLET.classId].icon}</span>
      <span>
        Try <strong style={{ color: 'var(--color-text-primary)' }}>{DEMO_WALLET.address}</strong>
      </span>
    </button>
  );
}
