// Class determination engine for Eth-RPG character generation
import type { WalletRawData, TxClassification, ClassResult } from '@/lib/types';
import { toBalanceEth, toWalletAgeYears } from '@/lib/conversions';

// --- Class threshold constants ---
export const HUNTER_NFT_RATIO_THRESHOLD = 0.25;
export const ROGUE_DEX_RATIO_THRESHOLD = 0.20;
export const SUMMONER_BRIDGE_COUNT_THRESHOLD = 8;
export const SUMMONER_BRIDGE_RATIO_THRESHOLD = 0.12;
export const MERCHANT_STABLE_RATIO_THRESHOLD = 0.25;
export const PRIEST_GAS_SPENT_THRESHOLD = 0.3;
export const PRIEST_CONTRACT_INTERACTION_THRESHOLD = 30;
export const ELDER_WIZARD_AGE_YEARS_THRESHOLD = 4;
export const ELDER_WIZARD_TX_PER_YEAR_THRESHOLD = 30;
export const ELDER_WIZARD_BALANCE_ETH_CEILING = 10.0;
export const GUARDIAN_TX_COUNT_THRESHOLD = 200;
export const GUARDIAN_BALANCE_ETH_THRESHOLD = 5.0;

// --- Class definitions ---
const HUNTER: ClassResult = { id: 'hunter', name: 'Hunter', nameEn: 'Hunter' };
const ROGUE: ClassResult = { id: 'rogue', name: 'Rogue', nameEn: 'Rogue' };
const SUMMONER: ClassResult = { id: 'summoner', name: 'Summoner', nameEn: 'Summoner' };
const MERCHANT: ClassResult = { id: 'merchant', name: 'Merchant', nameEn: 'Merchant' };
const PRIEST: ClassResult = { id: 'priest', name: 'Priest', nameEn: 'Priest' };
const ELDER_WIZARD: ClassResult = { id: 'elder_wizard', name: 'Elder Wizard', nameEn: 'Elder Wizard' };
const GUARDIAN: ClassResult = { id: 'guardian', name: 'Guardian', nameEn: 'Guardian' };
const WARRIOR: ClassResult = { id: 'warrior', name: 'Warrior', nameEn: 'Warrior' };

type ClassMatcher = (
  raw: WalletRawData,
  classification: TxClassification,
  balanceEth: number,
  walletAgeYears: number
) => ClassResult | null;

const classMatchers: readonly ClassMatcher[] = [
  // 1. Hunter -- NFT ratio >= 25% AND nftRatio > dexRatio (prevents multi-activity capture)
  (_raw, classification) =>
    classification.nftRatio >= HUNTER_NFT_RATIO_THRESHOLD &&
    classification.nftRatio > classification.dexRatio
      ? HUNTER
      : null,

  // 2. Rogue -- DEX swap ratio >= 20%
  (_raw, classification) =>
    classification.dexRatio >= ROGUE_DEX_RATIO_THRESHOLD ? ROGUE : null,

  // 3. Summoner -- bridge count >= 8 OR bridge ratio >= 12%
  (_raw, classification) =>
    classification.bridgeCount >= SUMMONER_BRIDGE_COUNT_THRESHOLD ||
    classification.bridgeRatio >= SUMMONER_BRIDGE_RATIO_THRESHOLD
      ? SUMMONER
      : null,

  // 4. Merchant -- stablecoin ratio >= 25%
  (_raw, classification) =>
    classification.stableRatio >= MERCHANT_STABLE_RATIO_THRESHOLD ? MERCHANT : null,

  // 5. Priest -- high gas spent AND many contract interactions
  (raw, classification) =>
    raw.gasSpentEth > PRIEST_GAS_SPENT_THRESHOLD &&
    classification.contractInteractions > PRIEST_CONTRACT_INTERACTION_THRESHOLD
      ? PRIEST
      : null,

  // 6. Elder Wizard -- wallet age >= 4 years AND low tx-per-year rate AND balance < 10 ETH
  (raw, _classification, balanceEth, walletAgeYears) =>
    walletAgeYears >= ELDER_WIZARD_AGE_YEARS_THRESHOLD &&
    walletAgeYears > 0 &&
    (raw.txCount / walletAgeYears) < ELDER_WIZARD_TX_PER_YEAR_THRESHOLD &&
    balanceEth < ELDER_WIZARD_BALANCE_ETH_CEILING
      ? ELDER_WIZARD
      : null,

  // 7. Guardian -- fewer than 200 transactions AND balance > 5 ETH
  (raw, _classification, balanceEth) =>
    raw.txCount < GUARDIAN_TX_COUNT_THRESHOLD &&
    balanceEth > GUARDIAN_BALANCE_ETH_THRESHOLD
      ? GUARDIAN
      : null,
];

export function determineClass(
  raw: WalletRawData,
  classification: TxClassification
): ClassResult {
  const balanceEth = toBalanceEth(raw.balance);
  const walletAgeYears = toWalletAgeYears(raw.firstTxTimestamp);

  for (const matcher of classMatchers) {
    const result = matcher(raw, classification, balanceEth, walletAgeYears);
    if (result !== null) {
      return result;
    }
  }

  // 8. Warrior -- default class when no other condition matches
  return WARRIOR;
}
