// Crypto event timeline and wallet activity pattern analysis for RPG lore generation

import type { CryptoEvent, TxClassification } from '@/lib/types';

// --- Threshold constants for activity pattern detection ---
const NFT_ACTIVE_THRESHOLD = 0.2;
const DEX_ACTIVE_THRESHOLD = 0.15;
const BRIDGE_EXPERIENCE_THRESHOLD = 3;
const STABLE_DOMINANT_THRESHOLD = 0.25;
const CONTRACT_HEAVY_THRESHOLD = 100;

// --- Wallet age formatting constants ---
const MONTHS_PER_YEAR = 12;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

export const CRYPTO_EVENTS: readonly CryptoEvent[] = [
  { date: '2020-03-12', event: '코로나 블랙 스완', rpgEvent: '검은 백조의 습격을 견뎌냈다' },
  { date: '2020-08-01', event: 'DeFi Summer', rpgEvent: '탈중앙 해방전쟁에 참전했다' },
  { date: '2021-03-11', event: 'NFT 붐 시작', rpgEvent: '고대 유물 수집의 시대를 열었다' },
  { date: '2021-05-19', event: '2021 크래시', rpgEvent: '대폭락의 전장에서 살아남았다' },
  { date: '2021-11-10', event: 'BTC ATH 69K', rpgEvent: '전설의 첫 번째 봉우리에 도달했다' },
  { date: '2022-05-09', event: '루나/테라 붕괴', rpgEvent: '달의 왕국이 무너지는 것을 목격했다' },
  { date: '2022-09-15', event: '이더리움 머지', rpgEvent: '대통합의 의식에 참여했다' },
  { date: '2022-11-11', event: 'FTX 파산', rpgEvent: '거래소 왕국의 배신을 겪었다' },
  { date: '2023-03-11', event: 'SVB 위기', rpgEvent: '금고의 수호자들이 무너지는 것을 보았다' },
  { date: '2024-01-10', event: 'BTC ETF 승인', rpgEvent: '기관 기사단의 출현을 목격했다' },
  { date: '2024-03-13', event: 'BTC ATH 73K', rpgEvent: '전설의 봉우리에 도달했다' },
  { date: '2024-11-05', event: '미 대선/BTC 급등', rpgEvent: '새로운 왕의 대관식과 함께 부활했다' },
] as const;

/**
 * Filters crypto events whose date falls between firstTx and lastTx timestamps.
 * Returns an array of RPG event descriptions.
 */
export function getRelevantEvents(
  firstTx: number | null,
  lastTx: number | null
): readonly string[] {
  if (firstTx === null || lastTx === null) {
    return [];
  }

  return CRYPTO_EVENTS
    .filter((cryptoEvent) => {
      const eventTimestamp = new Date(cryptoEvent.date).getTime();
      return eventTimestamp >= firstTx && eventTimestamp <= lastTx;
    })
    .map((cryptoEvent) => cryptoEvent.rpgEvent);
}

/**
 * Builds a comma-separated description of on-chain activity patterns
 * based on transaction classification thresholds.
 */
export function describeActivityPattern(classification: TxClassification): string {
  const patterns: string[] = [];

  if (classification.nftRatio > NFT_ACTIVE_THRESHOLD) {
    patterns.push('NFT 수집/민팅 활발');
  }
  if (classification.dexRatio > DEX_ACTIVE_THRESHOLD) {
    patterns.push('DEX 스왑 빈번');
  }
  if (classification.bridgeCount > BRIDGE_EXPERIENCE_THRESHOLD) {
    patterns.push('크로스체인 이동 경험');
  }
  if (classification.stableRatio > STABLE_DOMINANT_THRESHOLD) {
    patterns.push('스테이블코인 중심 활동');
  }
  if (classification.contractInteractions > CONTRACT_HEAVY_THRESHOLD) {
    patterns.push('컨트랙트 상호작용 활발');
  }

  if (patterns.length === 0) {
    return '일반적인 트랜잭션 활동';
  }

  return patterns.join(', ');
}

/**
 * Formats the wallet age from a first transaction timestamp into "N년 M개월" format.
 * Returns "신규" if the timestamp is null.
 */
export function formatWalletAge(firstTxTimestamp: number | null): string {
  if (firstTxTimestamp === null) {
    return '신규';
  }

  const now = Date.now();
  const diffMs = now - firstTxTimestamp;
  const totalMonths = Math.max(0, Math.floor(diffMs / MS_PER_MONTH));
  const years = Math.floor(totalMonths / MONTHS_PER_YEAR);
  const months = totalMonths % MONTHS_PER_YEAR;

  if (years === 0 && months === 0) {
    return '1개월 미만';
  }

  if (years === 0) {
    return `${months}개월`;
  }

  if (months === 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}
