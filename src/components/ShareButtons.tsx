'use client';

import { useState, useCallback } from 'react';
import type { GenerateResponse } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { isKoreanLocale } from '@/lib/locale';
import {
  openTwitterIntent,
  copyToClipboard,
  buildCardShareText,
  buildCardTwitterUrl,
  buildCardCopyUrl,
} from '@/lib/share-utils';

interface ShareButtonsProps {
  readonly data: GenerateResponse;
}

export default function ShareButtons({ data }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = buildCardShareText(data);
  const power = data.stats.power;
  const kr = isKoreanLocale();

  const handleTwitter = useCallback(() => {
    const url = buildCardTwitterUrl(data.address);
    trackEvent('share_click', { platform: 'twitter', context: 'card', power });
    openTwitterIntent(shareText, url);
  }, [shareText, data.address, power]);

  const handleCopy = useCallback(async () => {
    const url = buildCardCopyUrl(data.address);
    trackEvent('share_click', { platform: 'copy', context: 'card', power });
    const ok = await copyToClipboard(`${shareText}\n${url}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText, data.address, power]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Competitive headline */}
      <p
        className="text-sm font-bold tracking-wide"
        style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
      >
        {kr
          ? `전투력 ${power.toLocaleString()} \u2014 이길 수 있어?`
          : `Power ${power.toLocaleString()} \u2014 think you can beat this?`}
      </p>

      {/* Share buttons: X (gold) + Copy Link */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleTwitter}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          <span aria-hidden="true">&#x1D54F;</span>
          <span>Share on X</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
        >
          <span aria-hidden="true">&#x1F4CB;</span>
          <span>{copied ? (kr ? '복사됨!' : 'Copied!') : (kr ? '링크 복사' : 'Copy Link')}</span>
        </button>
      </div>
    </div>
  );
}
