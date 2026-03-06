'use client';

import { useState, useCallback, useEffect } from 'react';
import type { BattleResponse, BattleFighter, MatchupAdvantage } from '@/lib/types';
import { CLASS_THEMES } from '@/styles/themes';
import { trackEvent } from '@/lib/analytics';
import { isKoreanLocale } from '@/lib/locale';
import {
  openTwitterIntent,
  copyToClipboard,
  buildBattleShareText,
  buildBattleTwitterUrl,
  buildBattleCopyUrl,
  getDisplayName,
} from '@/lib/share-utils';
import AchievementRow from './AchievementRow';
import { PixelCharacter } from './pixel-sprites';

interface BattleResultProps {
  readonly data: BattleResponse;
  readonly onRematch: () => void;
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

function FighterCard({
  fighter,
  isWinner,
  advantage,
}: {
  readonly fighter: BattleFighter;
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
  const [autoCopyToast, setAutoCopyToast] = useState(false);
  const { result } = data;
  const winner = result.fighters[result.winner];
  const winnerTheme = CLASS_THEMES[winner.class.id];
  const kr = isKoreanLocale();

  const shareText = buildBattleShareText(data);

  // Auto-copy challenge link on mount
  useEffect(() => {
    const url = buildBattleCopyUrl(data);
    const fullText = `${shareText}\n${url}`;
    copyToClipboard(fullText).then((ok) => {
      if (ok) {
        trackEvent('share_click', { platform: 'auto_copy', context: 'battle' });
        setAutoCopyToast(true);
        setTimeout(() => setAutoCopyToast(false), 2000);
      }
    });
  // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTwitter = useCallback(() => {
    const url = buildBattleTwitterUrl(data);
    trackEvent('share_click', { platform: 'twitter', context: 'battle' });
    openTwitterIntent(shareText, url);
  }, [shareText, data]);

  const handleCopy = useCallback(async () => {
    const url = buildBattleCopyUrl(data);
    trackEvent('share_click', { platform: 'copy', context: 'battle' });
    const ok = await copyToClipboard(`${shareText}\n${url}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText, data]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Auto-copy toast */}
      {autoCopyToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-up"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          {kr ? '도전 링크가 복사됐어!' : 'Challenge link copied!'}
        </div>
      )}

      {/* Fighter cards side by side */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <FighterCard
          fighter={result.fighters[0]}
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
          isWinner={result.winner === 1}
          advantage={result.matchup.fighter1Advantage}
        />
      </div>

      {/* Winner banner */}
      <div
        className="text-center rounded-xl p-6 mb-4"
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

      {/* Share block — gold border, prominent */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          border: '1px solid var(--color-accent-gold)',
          background: 'rgba(244, 196, 48, 0.05)',
        }}
      >
        <div className="flex flex-col gap-3">
          {/* Primary: Share Victory (Twitter, gold, full width) */}
          <button
            type="button"
            onClick={handleTwitter}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-colors cursor-pointer hover:brightness-110 focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: '#000',
            }}
          >
            <span aria-hidden="true">{'\uD83C\uDFC6'}</span>
            <span>{kr ? '승리 공유' : 'Share Victory'}</span>
            <span aria-hidden="true">&#x1D54F;</span>
          </button>

          {/* Secondary: Copy Challenge Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 cursor-pointer focus:ring-2 focus:ring-accent-gold/50 focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span aria-hidden="true">&#x1F4CB;</span>
            <span>{copied ? (kr ? '복사됨!' : 'Copied!') : (kr ? '도전 링크 복사' : 'Copy Challenge Link')}</span>
          </button>
        </div>
      </div>

      {/* Rematch + New Battle row */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRematch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-tertiary text-white text-sm font-medium transition-colors cursor-pointer hover:bg-bg-secondary"
        >
          <span aria-hidden="true">{'\u2694\uFE0F'}</span>
          <span>Rematch</span>
        </button>
      </div>
    </div>
  );
}
