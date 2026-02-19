'use client';

import { useState, useCallback, useRef } from 'react';
import type { GenerateResponse } from '@/lib/types';

interface ShareButtonsProps {
  readonly data: GenerateResponse;
}

function buildShareText(data: GenerateResponse): string {
  return `My wallet power ${data.stats.power.toLocaleString()}\u2026 What\u2019s yours? \uD83D\uDDE1\uFE0F\n${data.class.name} | Lv.${data.stats.level}`;
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

function openTelegramShare(text: string, url: string): void {
  const params = new URLSearchParams({ url, text });
  window.open(
    `https://t.me/share/url?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export default function ShareButtons({ data }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const shareText = buildShareText(data);
  const shareUrl = buildShareUrl(data.address);

  const handleTwitter = useCallback(() => {
    openTwitterIntent(shareText, shareUrl);
  }, [shareText, shareUrl]);

  const handleFarcaster = useCallback(() => {
    openWarpcastCompose(shareText, shareUrl);
  }, [shareText, shareUrl]);

  const handleTelegram = useCallback(() => {
    openTelegramShare(shareText, shareUrl);
  }, [shareText, shareUrl]);

  const handleDiscord = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [shareText, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [shareText, shareUrl]);

  const handleDownload = useCallback(async () => {
    if (downloading) {
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch(`/api/card/${data.address}`);
      if (!response.ok) {
        throw new Error('Card image fetch failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = downloadLinkRef.current;
      if (link) {
        link.href = url;
        link.download = `eth-rpg-${data.address.slice(0, 8)}.png`;
        link.click();
        // Defer revocation to allow browser to start download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 3000);
    } finally {
      setDownloading(false);
    }
  }, [data.address, downloading]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          <span aria-hidden="true">{'\u2B07\uFE0F'}</span>
          <span>{downloading ? 'Saving...' : 'Save Card'}</span>
        </button>

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
          onClick={handleTelegram}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
        >
          <span aria-hidden="true">{'\u2708\uFE0F'}</span>
          <span>Telegram</span>
        </button>

        <button
          type="button"
          onClick={handleDiscord}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
        >
          <span aria-hidden="true">{'\uD83C\uDFAE'}</span>
          <span>{discordCopied ? 'Copied!' : 'Discord'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary"
        >
          <span aria-hidden="true">&#x1F4CB;</span>
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
      {downloadError && (
        <p className="text-sm" style={{ color: 'var(--color-accent-red)' }}>
          Failed to save card. Please try again later.
        </p>
      )}
      {/* Hidden anchor for programmatic download */}
      <a ref={downloadLinkRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
