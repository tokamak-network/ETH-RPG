'use client';

import { useState, useCallback } from 'react';
import type { GenerateResponse } from '@/lib/types';

interface ShareButtonsProps {
  readonly data: GenerateResponse;
}

function buildShareText(data: GenerateResponse): string {
  return `\uB0B4 \uC9C0\uAC11 \uC804\uD22C\uB825 ${data.stats.power.toLocaleString()}\u2026 \uB108\uB294 \uBA87\uC774\uB0D0 \uD83D\uDDE1\uFE0F\n${data.class.name} | Lv.${data.stats.level}`;
}

function buildShareUrl(address: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/result/${address}`;
}

function openTwitterIntent(text: string, url: string): void {
  const params = new URLSearchParams({ text, url });
  window.open(
    `https://twitter.com/intent/tweet?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
}

function openWarpcastCompose(text: string, url: string): void {
  const fullText = `${text}\n${url}`;
  const params = new URLSearchParams({ text: fullText });
  window.open(
    `https://warpcast.com/~/compose?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export default function ShareButtons({ data }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(data);
  const shareUrl = buildShareUrl(data.address);

  const handleTwitter = useCallback(() => {
    openTwitterIntent(shareText, shareUrl);
  }, [shareText, shareUrl]);

  const handleFarcaster = useCallback(() => {
    openWarpcastCompose(shareText, shareUrl);
  }, [shareText, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [shareText, shareUrl]);

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleTwitter}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
      >
        <span aria-hidden="true">&#x1D54F;</span>
        <span>Twitter</span>
      </button>

      <button
        type="button"
        onClick={handleFarcaster}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
      >
        <span aria-hidden="true">&#x1F7E3;</span>
        <span>Farcaster</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
      >
        <span aria-hidden="true">&#x1F4CB;</span>
        <span>{copied ? '\uBCF5\uC0AC\uB428!' : '\uB9C1\uD06C \uBCF5\uC0AC'}</span>
      </button>
    </div>
  );
}
