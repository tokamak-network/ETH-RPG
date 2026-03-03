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
 * Pre-verified famous wallet data (refreshed 2026-03-04).
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
    power: 61_865,
    previewDescription: 'The original NFT whale and Ethereum creator',
  },
  {
    address: 'pranksy.eth',
    label: 'Pranksy',
    shortLabel: 'Pranksy',
    classId: 'hunter',
    level: 49,
    power: 68_220,
    previewDescription: 'Legendary NFT collector and early adopter',
  },
  {
    address: 'griff.eth',
    label: 'Griff Green',
    shortLabel: 'Griff',
    classId: 'merchant',
    level: 38,
    power: 70_775,
    previewDescription: 'Stablecoin power broker and Giveth founder',
  },
  {
    address: 'stani.eth',
    label: 'Stani Kulechov',
    shortLabel: 'Stani',
    classId: 'priest',
    level: 32,
    power: 62_005,
    previewDescription: 'Gas-heavy protocol architect behind Aave',
  },
  {
    address: 'ricmoo.eth',
    label: 'Richard Moore',
    shortLabel: 'Richard',
    classId: 'guardian',
    level: 19,
    power: 47_675,
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
    address: 'convexfinance.eth',
    label: 'Convex Finance',
    shortLabel: 'Convex',
    classId: 'rogue',
    level: 33,
    power: 60_760,
    previewDescription: 'DEX swap powerhouse and Curve yield optimizer',
  },
  {
    address: '0xngmi.eth',
    label: '0xngmi',
    shortLabel: '0xngmi',
    classId: 'elder_wizard',
    level: 17,
    power: 33_820,
    previewDescription: 'Quiet sage and DefiLlama creator',
  },
  {
    address: 'kain.eth',
    label: 'Kain Warwick',
    shortLabel: 'Kain',
    classId: 'warrior',
    level: 26,
    power: 55_945,
    previewDescription: 'Versatile on-chain fighter and Synthetix founder',
  },
] as const;

/** The default demo wallet shown on the landing page. */
export const DEMO_WALLET: FamousWallet = FAMOUS_WALLETS[0];
