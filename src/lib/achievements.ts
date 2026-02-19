// Achievement badge evaluation engine — pure functions, no side effects

import type { WalletRawData, TxClassification, Achievement, AchievementTier } from '@/lib/types';
import { toBalanceEth, toWalletAgeYears } from '@/lib/conversions';

// --- Tier priority for sorting (lower = higher priority) ---
const ACHIEVEMENT_TIER_PRIORITY: Record<AchievementTier, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

// --- Crisis events for "survivor" achievement ---
const CRISIS_EVENT_DATES = [
  '2020-03-12', // COVID Black Swan
  '2021-05-19', // 2021 Crash
  '2022-05-09', // Luna/Terra Collapse
  '2022-11-11', // FTX Bankruptcy
  '2023-03-11', // SVB Crisis
] as const;

const SURVIVOR_CRISIS_THRESHOLD = 3;

// --- Merge window constants ---
const MERGE_DATE_MS = new Date('2022-09-15').getTime();
const MERGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// --- Genesis threshold ---
const GENESIS_CUTOFF_MS = new Date('2016-01-01').getTime();

// --- Balance thresholds (ETH) ---
const DIAMOND_HANDS_BALANCE = 0.1;
const DIAMOND_HANDS_YEARS = 4;
const WHALE_BALANCE = 100;
const GAS_TITAN_THRESHOLD = 10;
const GAS_BURNER_THRESHOLD = 0.1;

// --- Count thresholds ---
const BRIDGE_RUNNER_THRESHOLD = 10;
const CONTRACT_SAGE_THRESHOLD = 200;
const DEX_MASTER_THRESHOLD = 100;
const VETERAN_TX_THRESHOLD = 1000;

// --- Ratio thresholds ---
const NFT_COLLECTOR_RATIO = 0.4;
const STABLE_HAND_RATIO = 0.5;

// --- Explorer threshold ---
const EXPLORER_CONTRACTS = 10;

interface AchievementRule {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly tier: AchievementTier;
  readonly description: string;
  readonly check: (raw: WalletRawData, classification: TxClassification) => boolean;
}

/**
 * Counts how many crisis events the wallet was active during.
 * A wallet is considered active during an event if the event date
 * falls between firstTxTimestamp and lastTxTimestamp.
 */
function countCrisisEventsOverlap(
  firstTx: number | null,
  lastTx: number | null,
): number {
  if (firstTx === null || lastTx === null) {
    return 0;
  }

  return CRISIS_EVENT_DATES.reduce((count, dateStr) => {
    const eventMs = new Date(dateStr).getTime();
    return eventMs >= firstTx && eventMs <= lastTx ? count + 1 : count;
  }, 0);
}

/**
 * Checks whether the wallet was active during The Merge window (2022-09-15 +/- 7 days).
 */
function wasActiveDuringMerge(
  firstTx: number | null,
  lastTx: number | null,
): boolean {
  if (firstTx === null || lastTx === null) {
    return false;
  }

  const mergeStart = MERGE_DATE_MS - MERGE_WINDOW_MS;
  const mergeEnd = MERGE_DATE_MS + MERGE_WINDOW_MS;

  return firstTx <= mergeEnd && lastTx >= mergeStart;
}

const ACHIEVEMENT_RULES: readonly AchievementRule[] = [
  // --- Legendary ---
  {
    id: 'genesis',
    name: 'Genesis Block',
    icon: '\u{1F3DB}\uFE0F',
    tier: 'legendary',
    description: 'First transaction before 2016',
    check: (raw) => raw.firstTxTimestamp !== null && raw.firstTxTimestamp < GENESIS_CUTOFF_MS,
  },
  {
    id: 'merge_witness',
    name: 'Merge Witness',
    icon: '\u{1F52E}',
    tier: 'legendary',
    description: 'Active during The Merge (Sep 2022)',
    check: (raw) => wasActiveDuringMerge(raw.firstTxTimestamp, raw.lastTxTimestamp),
  },
  {
    id: 'gas_titan',
    name: 'Gas Titan',
    icon: '\u{1F525}',
    tier: 'legendary',
    description: 'Spent over 10 ETH in gas fees',
    check: (raw) => raw.gasSpentEth > GAS_TITAN_THRESHOLD,
  },

  // --- Epic ---
  {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    icon: '\u{1F48E}',
    tier: 'epic',
    description: '4+ year wallet with balance > 0.1 ETH',
    check: (raw) =>
      toWalletAgeYears(raw.firstTxTimestamp) >= DIAMOND_HANDS_YEARS &&
      toBalanceEth(raw.balance) > DIAMOND_HANDS_BALANCE,
  },
  {
    id: 'bridge_runner',
    name: 'Bridge Runner',
    icon: '\u{1F309}',
    tier: 'epic',
    description: '10+ bridge transactions',
    check: (_raw, cls) => cls.bridgeCount >= BRIDGE_RUNNER_THRESHOLD,
  },
  {
    id: 'contract_sage',
    name: 'Contract Sage',
    icon: '\u{1F4DC}',
    tier: 'epic',
    description: 'Interacted with 200+ unique contracts',
    check: (_raw, cls) => cls.uniqueContracts >= CONTRACT_SAGE_THRESHOLD,
  },
  {
    id: 'dex_master',
    name: 'DEX Master',
    icon: '\u26A1',
    tier: 'epic',
    description: '100+ DEX swaps',
    check: (_raw, cls) => cls.dexSwapCount >= DEX_MASTER_THRESHOLD,
  },

  // --- Rare ---
  {
    id: 'nft_collector',
    name: 'NFT Collector',
    icon: '\u{1F5BC}\uFE0F',
    tier: 'rare',
    description: '40%+ of transactions are NFT-related',
    check: (_raw, cls) => cls.nftRatio >= NFT_COLLECTOR_RATIO,
  },
  {
    id: 'stable_hand',
    name: 'Stable Hand',
    icon: '\u{1F3E6}',
    tier: 'rare',
    description: '50%+ of transactions are stablecoin transfers',
    check: (_raw, cls) => cls.stableRatio >= STABLE_HAND_RATIO,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    icon: '\u2694\uFE0F',
    tier: 'rare',
    description: '1,000+ total transactions',
    check: (raw) => raw.txCount >= VETERAN_TX_THRESHOLD,
  },
  {
    id: 'whale',
    name: 'Whale',
    icon: '\u{1F40B}',
    tier: 'rare',
    description: 'Balance of 100+ ETH',
    check: (raw) => toBalanceEth(raw.balance) >= WHALE_BALANCE,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    icon: '\u{1F6E1}\uFE0F',
    tier: 'rare',
    description: 'Active across 3+ crypto crises',
    check: (raw) =>
      countCrisisEventsOverlap(raw.firstTxTimestamp, raw.lastTxTimestamp) >= SURVIVOR_CRISIS_THRESHOLD,
  },

  // --- Common ---
  {
    id: 'first_step',
    name: 'First Step',
    icon: '\u{1F463}',
    tier: 'common',
    description: 'Made at least 1 transaction',
    check: (raw) => raw.txCount >= 1,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '\u{1F9ED}',
    tier: 'common',
    description: 'Interacted with 10+ unique contracts',
    check: (_raw, cls) => cls.uniqueContracts >= EXPLORER_CONTRACTS,
  },
  {
    id: 'gas_burner',
    name: 'Gas Burner',
    icon: '\u{1F4A8}',
    tier: 'common',
    description: 'Spent over 0.1 ETH in gas',
    check: (raw) => raw.gasSpentEth > GAS_BURNER_THRESHOLD,
  },
] as const;

/**
 * Evaluates all achievement rules against the wallet data and transaction classification.
 * Returns matched achievements sorted by tier priority (legendary first).
 */
export function evaluateAchievements(
  raw: WalletRawData,
  classification: TxClassification,
): readonly Achievement[] {
  const matched = ACHIEVEMENT_RULES
    .filter((rule) => rule.check(raw, classification))
    .map(({ id, name, icon, tier, description }) => ({ id, name, icon, tier, description }));

  return [...matched].sort(
    (a, b) => ACHIEVEMENT_TIER_PRIORITY[a.tier] - ACHIEVEMENT_TIER_PRIORITY[b.tier],
  );
}
