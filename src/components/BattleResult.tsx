'use client';

import { useState, useCallback } from 'react';
import type { BattleResponse, BattleFighter, MatchupAdvantage } from '@/lib/types';
import { CLASS_THEMES } from '@/styles/themes';
import { shortenAddress } from '@/lib/format-utils';
import { trackEvent } from '@/lib/analytics';
import { appendUtmToUrl } from '@/lib/utm';
import AchievementRow from './AchievementRow';
import { PixelCharacter } from './pixel-sprites';

interface BattleResultProps {
  readonly data: BattleResponse;
  readonly onRematch: () => void;
}

function getDisplayName(fighter: BattleFighter): string {
  return fighter.ensName ?? shortenAddress(fighter.address);
}

function getAdvantageLabel(advantage: MatchupAdvantage): string {
  switch (advantage) {
    case 'advantaged': return '\u2B06 Advantaged';
    case 'disadvantaged': return '\u2B07 Disadvantaged';
    case 'neutral': return '\u2194\uFE0F Neutral';
  }
}

function getAdvantageColor(advantage: MatchupAdvantage): string {
  switch (advantage) {
    case 'advantaged': return '#22c55e';
    case 'disadvantaged': return '#ef4444';
    case 'neutral': return '#6b7280';
  }
}

function buildBattleShareText(data: BattleResponse): string {
  const winner = data.result.fighters[data.result.winner];
  const loser = data.result.fighters[data.result.winner === 0 ? 1 : 0];
  const winnerName = getDisplayName(winner);
  const loserName = getDisplayName(loser);
  return `\u2694\uFE0F Wallet Battle!\n${winner.class.name} (${winnerName}) defeated ${loser.class.name} (${loserName})\n${data.result.totalTurns} turns \u2014 ${data.result.winnerHpPercent}% HP left`;
}

function buildBattleShareUrl(data: BattleResponse): string {
  if (typeof window === 'undefined') return '';
  const f0 = data.result.fighters[0].address;
  const f1 = data.result.fighters[1].address;
  return `${window.location.origin}/battle/${f0}/${f1}?n=${data.result.nonce}`;
}

function buildRematchUrl(data: BattleResponse): string {
  if (typeof window === 'undefined') return '';
  const f0 = data.result.fighters[0].address;
  const f1 = data.result.fighters[1].address;
  return `${window.location.origin}/battle/${f0}/${f1}`;
}

function FighterCard({
  fighter,
  index,
  isWinner,
  advantage,
}: {
  readonly fighter: BattleFighter;
  readonly index: 0 | 1;
  readonly isWinner: boolean;
  readonly advantage: MatchupAdvantage;
}) {
  const theme = CLASS_THEMES[fighter.class.id];
  const displayName = getDisplayName(fighter);

  return (
    <div
      className="flex-1 rounded-xl p-4 text-center relative"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: `1px solid ${isWinner ? theme.primary : 'var(--color-border)'}`,
        boxShadow: isWinner ? theme.borderGlow : 'none',
      }}
    >
      {isWinner && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: '#f4c430', color: '#000' }}
        >
          WINNER
        </div>
      )}

      {/* Class icon + name */}
      <div className="flex flex-col items-center gap-2 mb-3 mt-1">
        <span className="text-3xl">{theme.icon}</span>
        <h3
          className="text-lg font-bold font-display"
          style={{ color: theme.primary }}
        >
          {fighter.class.name}
        </h3>
        <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {displayName}
        </p>
      </div>

      {/* Pixel sprite */}
      <div className="flex justify-center mb-3">
        <PixelCharacter classId={fighter.class.id} size={80} stats={fighter.stats} />
      </div>

      {/* Level + Power */}
      <div className="flex justify-center gap-4 mb-3">
        <div>
          <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Level</p>
          <p className="text-lg font-bold font-mono" style={{ color: theme.primary }}>
            {fighter.stats.level}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Power</p>
          <p className="text-lg font-bold font-mono text-gold-shimmer">
            {fighter.stats.power.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Matchup advantage */}
      <p
        className="text-xs font-semibold mb-2"
        style={{ color: getAdvantageColor(advantage) }}
      >
        {getAdvantageLabel(advantage)}
      </p>

      {/* Achievements */}
      {fighter.achievements.length > 0 && (
        <div className="mt-2">
          <AchievementRow achievements={fighter.achievements} />
        </div>
      )}
    </div>
  );
}

export default function BattleResultDisplay({ data, onRematch }: BattleResultProps) {
  const [copied, setCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const { result } = data;
  const winner = result.fighters[result.winner];
  const winnerTheme = CLASS_THEMES[winner.class.id];

  const shareText = buildBattleShareText(data);
  const baseShareUrl = buildBattleShareUrl(data);

  const handleTwitter = useCallback(() => {
    const url = appendUtmToUrl(baseShareUrl, { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'battle' });
    trackEvent('share_click', { platform: 'twitter', context: 'battle' });
    const params = new URLSearchParams({ text: shareText, url });
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareText, baseShareUrl]);

  const handleFarcaster = useCallback(() => {
    const url = appendUtmToUrl(baseShareUrl, { utm_source: 'farcaster', utm_medium: 'social', utm_campaign: 'battle' });
    trackEvent('share_click', { platform: 'farcaster', context: 'battle' });
    const fullText = `${shareText}\n${url}`;
    const params = new URLSearchParams({ text: fullText });
    window.open(
      `https://warpcast.com/~/compose?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareText, baseShareUrl]);

  const handleTelegram = useCallback(() => {
    const url = appendUtmToUrl(baseShareUrl, { utm_source: 'telegram', utm_medium: 'social', utm_campaign: 'battle' });
    trackEvent('share_click', { platform: 'telegram', context: 'battle' });
    const params = new URLSearchParams({ url, text: shareText });
    window.open(
      `https://t.me/share/url?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareText, baseShareUrl]);

  const handleDiscord = useCallback(async () => {
    const url = appendUtmToUrl(baseShareUrl, { utm_source: 'discord', utm_medium: 'social', utm_campaign: 'battle' });
    trackEvent('share_click', { platform: 'discord', context: 'battle' });
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [shareText, baseShareUrl]);

  const handleCopy = useCallback(async () => {
    const url = appendUtmToUrl(baseShareUrl, { utm_source: 'copy', utm_medium: 'clipboard', utm_campaign: 'battle' });
    trackEvent('share_click', { platform: 'copy', context: 'battle' });
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [shareText, baseShareUrl]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Fighter cards side by side */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <FighterCard
          fighter={result.fighters[0]}
          index={0}
          isWinner={result.winner === 0}
          advantage={result.matchup.fighter0Advantage}
        />
        <div className="flex items-center justify-center shrink-0 py-2 sm:py-0">
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
          >
            VS
          </span>
        </div>
        <FighterCard
          fighter={result.fighters[1]}
          index={1}
          isWinner={result.winner === 1}
          advantage={result.matchup.fighter1Advantage}
        />
      </div>

      {/* Winner banner */}
      <div
        className="text-center rounded-xl p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${winnerTheme.primary}15 0%, transparent 50%, ${winnerTheme.primary}15 100%)`,
          border: `1px solid ${winnerTheme.primary}40`,
        }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Champion
        </p>
        <p
          className="text-2xl font-bold font-display mb-1"
          style={{ color: winnerTheme.primary }}
        >
          {winnerTheme.icon} {winner.class.name}
        </p>
        <p className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {getDisplayName(winner)}
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {result.totalTurns} turns &mdash; {result.winnerHpPercent}% HP remaining
        </p>
      </div>

      {/* Share + Rematch buttons */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onRematch}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:brightness-110"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: '#000',
            }}
          >
            <span aria-hidden="true">{'\u2694\uFE0F'}</span>
            <span>Rematch</span>
          </button>

          <button
            type="button"
            onClick={handleTwitter}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary cursor-pointer"
          >
            <span aria-hidden="true">&#x1D54F;</span>
            <span>Twitter</span>
          </button>

          <button
            type="button"
            onClick={handleFarcaster}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary cursor-pointer"
          >
            <span aria-hidden="true">&#x1F7E3;</span>
            <span>Farcaster</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary cursor-pointer"
          >
            <span aria-hidden="true">{'\u2708\uFE0F'}</span>
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={handleDiscord}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary cursor-pointer"
          >
            <span aria-hidden="true">{'\uD83C\uDFAE'}</span>
            <span>{discordCopied ? 'Copied!' : 'Discord'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors hover:bg-bg-secondary cursor-pointer"
          >
            <span aria-hidden="true">&#x1F4CB;</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
