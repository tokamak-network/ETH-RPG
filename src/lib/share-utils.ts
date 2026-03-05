// Shared share utilities for battle, card, and quiz sharing.
// Centralizes share text generation, URL building, and platform intents.

import type { BattleResponse, GenerateResponse } from '@/lib/types';
import { appendUtmToUrl } from '@/lib/utm';
import { isKoreanLocale } from '@/lib/locale';
import { shortenAddress } from '@/lib/format-utils';

// --- Platform intents ---

export function openTwitterIntent(text: string, url: string): void {
  const params = new URLSearchParams({ text, url });
  window.open(
    `https://twitter.com/intent/tweet?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// --- Battle share text (challenge loop) ---

function getDisplayName(fighter: { readonly address: string; readonly ensName?: string }): string {
  return fighter.ensName ?? shortenAddress(fighter.address);
}

export function buildBattleShareText(data: BattleResponse): string {
  const winner = data.result.fighters[data.result.winner];
  const loserIndex = data.result.winner === 0 ? 1 : 0;
  const loser = data.result.fighters[loserIndex];
  const turns = data.result.totalTurns;
  const hp = data.result.winnerHpPercent;
  const isCloseFight = hp < 30;
  const kr = isKoreanLocale();

  if (isCloseFight) {
    return kr
      ? `간신히 이겼다! ${turns}턴 끝에 HP ${hp}%로 승리. 니 지갑은 더 잘할 수 있어?`
      : `Barely survived! My ${winner.class.nameEn} beat ${loser.class.nameEn} with just ${hp}% HP after ${turns} turns. Can your wallet do better?`;
  }

  return kr
    ? `내 ${winner.class.name}가 ${loser.class.name}를 ${turns}턴 만에 격파. HP ${hp}% 남음. 니 지갑은 못 이겨.`
    : `My ${winner.class.nameEn} destroyed ${loser.class.nameEn} in ${turns} turns with ${hp}% HP left. Your wallet doesn't stand a chance.`;
}

// --- Card share text (reader-focused) ---

export function buildCardShareText(data: GenerateResponse): string {
  const kr = isKoreanLocale();
  return kr
    ? `Lv.${data.stats.level} ${data.class.name} | 전투력 ${data.stats.power.toLocaleString()}. 니 지갑은 어떤 영웅이야?`
    : `Lv.${data.stats.level} ${data.class.nameEn} | Power ${data.stats.power.toLocaleString()}. What hero is YOUR wallet?`;
}

// --- URL builders ---

export function buildBattleShareUrl(data: BattleResponse): string {
  if (typeof window === 'undefined') return '';
  const f0 = data.result.fighters[0].address;
  const f1 = data.result.fighters[1].address;
  return `${window.location.origin}/battle/${f0}/${f1}?n=${data.result.nonce}`;
}

export function buildCardShareUrl(address: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/result/${address}`;
}

// --- UTM-tagged URL helpers ---

export function buildBattleTwitterUrl(data: BattleResponse): string {
  return appendUtmToUrl(buildBattleShareUrl(data), {
    utm_source: 'twitter',
    utm_medium: 'social',
    utm_campaign: 'battle',
  });
}

export function buildBattleCopyUrl(data: BattleResponse): string {
  return appendUtmToUrl(buildBattleShareUrl(data), {
    utm_source: 'copy',
    utm_medium: 'clipboard',
    utm_campaign: 'battle',
  });
}

export function buildCardTwitterUrl(address: string): string {
  return appendUtmToUrl(buildCardShareUrl(address), {
    utm_source: 'twitter',
    utm_medium: 'social',
  });
}

export function buildCardCopyUrl(address: string): string {
  return appendUtmToUrl(buildCardShareUrl(address), {
    utm_source: 'copy',
    utm_medium: 'clipboard',
  });
}

// --- Rematch URL ---

export function buildRematchUrl(data: BattleResponse): string {
  if (typeof window === 'undefined') return '';
  const f0 = data.result.fighters[0].address;
  const f1 = data.result.fighters[1].address;
  return `${window.location.origin}/battle/${f0}/${f1}`;
}

// --- Display name (re-exported for convenience) ---

export { getDisplayName };
