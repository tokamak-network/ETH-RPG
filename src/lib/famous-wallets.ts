import type { CharacterClassId } from '@/lib/types';

export interface FamousWallet {
  readonly address: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly classId: CharacterClassId;
  readonly level: number;
  readonly power: number;
  readonly previewDescription: string;
}

/**
 * Pre-verified famous wallet data (from v10 rebalance, 2026-02-23).
 * Used for gallery cards and social proof on landing page.
 * Actual card is generated live — these are display hints only.
 */
export const FAMOUS_WALLETS: readonly FamousWallet[] = [
  {
    address: 'vitalik.eth',
    label: 'Vitalik Buterin',
    shortLabel: 'Vitalik',
    classId: 'hunter',
    level: 33,
    power: 61_545,
    previewDescription: 'The original NFT whale and Ethereum creator',
  },
  {
    address: 'pranksy.eth',
    label: 'Pranksy',
    shortLabel: 'Pranksy',
    classId: 'hunter',
    level: 49,
    power: 69_640,
    previewDescription: 'Legendary NFT collector and early adopter',
  },
  {
    address: 'griff.eth',
    label: 'Griff Green',
    shortLabel: 'Griff',
    classId: 'merchant',
    level: 38,
    power: 69_875,
    previewDescription: 'Stablecoin power broker and Giveth founder',
  },
  {
    address: 'stani.eth',
    label: 'Stani Kulechov',
    shortLabel: 'Stani',
    classId: 'priest',
    level: 32,
    power: 62_505,
    previewDescription: 'Gas-heavy protocol architect behind Aave',
  },
  {
    address: 'ricmoo.eth',
    label: 'Richard Moore',
    shortLabel: 'Richard',
    classId: 'guardian',
    level: 19,
    power: 45_150,
    previewDescription: 'Quiet holder and ethers.js creator',
  },
  {
    address: 'sassal.eth',
    label: 'Sassal',
    shortLabel: 'Sassal',
    classId: 'summoner',
    level: 31,
    power: 57_995,
    previewDescription: 'Cross-chain explorer and ETH educator',
  },
  {
    address: 'hayden.eth',
    label: 'Hayden Adams',
    shortLabel: 'Hayden',
    classId: 'rogue',
    level: 42,
    power: 65_320,
    previewDescription: 'DEX swap mastermind and Uniswap creator',
  },
  {
    address: 'nick.eth',
    label: 'Nick Johnson',
    shortLabel: 'Nick',
    classId: 'elder_wizard',
    level: 22,
    power: 52_780,
    previewDescription: 'Ancient wallet sage and ENS architect',
  },
  {
    address: 'brantly.eth',
    label: 'Brantly Millegan',
    shortLabel: 'Brantly',
    classId: 'warrior',
    level: 27,
    power: 48_900,
    previewDescription: 'Versatile on-chain fighter and ENS advocate',
  },
] as const;

/** The default demo wallet shown on the landing page. */
export const DEMO_WALLET: FamousWallet = FAMOUS_WALLETS[0];
