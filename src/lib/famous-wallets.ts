import type { CharacterClassId } from '@/lib/types';

export interface FamousWallet {
  readonly address: string;
  readonly label: string;
  readonly classId: CharacterClassId;
  readonly icon: string;
  readonly level: number;
  readonly power: number;
}

/**
 * Pre-verified famous wallet data (from v10 rebalance, 2026-02-23).
 * Used for demo buttons and social proof on landing page.
 * Actual card is generated live — these are display hints only.
 */
export const FAMOUS_WALLETS: readonly FamousWallet[] = [
  {
    address: 'vitalik.eth',
    label: 'Vitalik Buterin',
    classId: 'hunter',
    icon: '\u{1F3F9}',
    level: 33,
    power: 61_545,
  },
  {
    address: 'pranksy.eth',
    label: 'Pranksy',
    classId: 'hunter',
    icon: '\u{1F3F9}',
    level: 49,
    power: 69_640,
  },
  {
    address: 'griff.eth',
    label: 'Griff Green',
    classId: 'merchant',
    icon: '\u{1F4B0}',
    level: 38,
    power: 69_875,
  },
  {
    address: 'stani.eth',
    label: 'Stani Kulechov',
    classId: 'priest',
    icon: '\u2720\uFE0F',
    level: 32,
    power: 62_505,
  },
  {
    address: 'ricmoo.eth',
    label: 'Richard Moore',
    classId: 'guardian',
    icon: '\u{1F6E1}\uFE0F',
    level: 19,
    power: 45_150,
  },
  {
    address: 'sassal.eth',
    label: 'Sassal',
    classId: 'summoner',
    icon: '\u{1F300}',
    level: 31,
    power: 57_995,
  },
] as const;

/** The default demo wallet shown on the landing page. */
export const DEMO_WALLET: FamousWallet = FAMOUS_WALLETS[0];
