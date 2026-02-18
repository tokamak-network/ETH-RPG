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
  { date: '2020-03-12', event: 'COVID Black Swan', rpgEvent: 'Survived the attack of the Black Swan' },
  { date: '2020-08-01', event: 'DeFi Summer', rpgEvent: 'Fought in the Decentralized Liberation War' },
  { date: '2021-03-11', event: 'NFT Boom Begins', rpgEvent: 'Ushered in the Era of Ancient Relic Collecting' },
  { date: '2021-05-19', event: '2021 Crash', rpgEvent: 'Survived the battlefield of the Great Collapse' },
  { date: '2021-11-10', event: 'BTC ATH 69K', rpgEvent: 'Reached the first Legendary Summit' },
  { date: '2022-05-09', event: 'Luna/Terra Collapse', rpgEvent: 'Witnessed the fall of the Lunar Kingdom' },
  { date: '2022-09-15', event: 'Ethereum Merge', rpgEvent: 'Participated in the Ritual of the Great Merge' },
  { date: '2022-11-11', event: 'FTX Bankruptcy', rpgEvent: 'Endured the betrayal of the Exchange Kingdom' },
  { date: '2023-03-11', event: 'SVB Crisis', rpgEvent: 'Watched the Vault Guardians crumble' },
  { date: '2024-01-10', event: 'BTC ETF Approval', rpgEvent: 'Witnessed the arrival of the Institutional Knights' },
  { date: '2024-03-13', event: 'BTC ATH 73K', rpgEvent: 'Reached the Legendary Summit' },
  { date: '2024-11-05', event: 'US Election/BTC Surge', rpgEvent: 'Rose again with the coronation of a new King' },
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
    patterns.push('Active NFT collecting/minting');
  }
  if (classification.dexRatio > DEX_ACTIVE_THRESHOLD) {
    patterns.push('Frequent DEX swaps');
  }
  if (classification.bridgeCount > BRIDGE_EXPERIENCE_THRESHOLD) {
    patterns.push('Cross-chain bridging experience');
  }
  if (classification.stableRatio > STABLE_DOMINANT_THRESHOLD) {
    patterns.push('Stablecoin-focused activity');
  }
  if (classification.contractInteractions > CONTRACT_HEAVY_THRESHOLD) {
    patterns.push('Heavy contract interactions');
  }

  if (patterns.length === 0) {
    return 'General transaction activity';
  }

  return patterns.join(', ');
}

/**
 * Formats the wallet age from a first transaction timestamp into "N years M months" format.
 * Returns "New" if the timestamp is null.
 */
export function formatWalletAge(firstTxTimestamp: number | null): string {
  if (firstTxTimestamp === null) {
    return 'New';
  }

  const now = Date.now();
  const diffMs = now - firstTxTimestamp;
  const totalMonths = Math.max(0, Math.floor(diffMs / MS_PER_MONTH));
  const years = Math.floor(totalMonths / MONTHS_PER_YEAR);
  const months = totalMonths % MONTHS_PER_YEAR;

  if (years === 0 && months === 0) {
    return 'Less than 1 month';
  }

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  if (months === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}
