// Class determination engine for Eth-RPG character generation
import type { WalletRawData, TxClassification, ClassResult } from '@/lib/types';
import { toBalanceEth, toWalletAgeYears } from '@/lib/conversions';

// --- Class threshold constants ---
export const HUNTER_NFT_RATIO_THRESHOLD = 0.30;
export const ROGUE_DEX_RATIO_THRESHOLD = 0.25;
export const SUMMONER_BRIDGE_COUNT_THRESHOLD = 5;
export const SUMMONER_BRIDGE_RATIO_THRESHOLD = 0.10;
export const MERCHANT_STABLE_RATIO_THRESHOLD = 0.35;
export const PRIEST_GAS_SPENT_THRESHOLD = 1.0;
export const PRIEST_CONTRACT_INTERACTION_THRESHOLD = 50;
export const ELDER_WIZARD_AGE_YEARS_THRESHOLD = 2;
export const ELDER_WIZARD_TX_COUNT_THRESHOLD = 50;
export const GUARDIAN_TX_COUNT_THRESHOLD = 20;
export const GUARDIAN_BALANCE_ETH_THRESHOLD = 1.0;

// --- Class definitions ---
const HUNTER: ClassResult = { id: 'hunter', name: '헌터(Hunter)', nameEn: 'Hunter' };
const ROGUE: ClassResult = { id: 'rogue', name: '로그(Rogue)', nameEn: 'Rogue' };
const SUMMONER: ClassResult = { id: 'summoner', name: '소환사(Summoner)', nameEn: 'Summoner' };
const MERCHANT: ClassResult = { id: 'merchant', name: '상인(Merchant)', nameEn: 'Merchant' };
const PRIEST: ClassResult = { id: 'priest', name: '성직자(Priest)', nameEn: 'Priest' };
const ELDER_WIZARD: ClassResult = { id: 'elder_wizard', name: '고대 마법사(Elder Wizard)', nameEn: 'Elder Wizard' };
const GUARDIAN: ClassResult = { id: 'guardian', name: '수호자(Guardian)', nameEn: 'Guardian' };
const WARRIOR: ClassResult = { id: 'warrior', name: '전사(Warrior)', nameEn: 'Warrior' };

type ClassMatcher = (
  raw: WalletRawData,
  classification: TxClassification,
  balanceEth: number,
  walletAgeYears: number
) => ClassResult | null;

const classMatchers: readonly ClassMatcher[] = [
  // 1. Hunter -- NFT ratio >= 30%
  (_raw, classification) =>
    classification.nftRatio >= HUNTER_NFT_RATIO_THRESHOLD ? HUNTER : null,

  // 2. Rogue -- DEX swap ratio >= 25%
  (_raw, classification) =>
    classification.dexRatio >= ROGUE_DEX_RATIO_THRESHOLD ? ROGUE : null,

  // 3. Summoner -- bridge count >= 5 OR bridge ratio >= 10%
  (_raw, classification) =>
    classification.bridgeCount >= SUMMONER_BRIDGE_COUNT_THRESHOLD ||
    classification.bridgeRatio >= SUMMONER_BRIDGE_RATIO_THRESHOLD
      ? SUMMONER
      : null,

  // 4. Merchant -- stablecoin ratio >= 35%
  (_raw, classification) =>
    classification.stableRatio >= MERCHANT_STABLE_RATIO_THRESHOLD ? MERCHANT : null,

  // 5. Priest -- high gas spent AND many contract interactions
  (raw, classification) =>
    raw.gasSpentEth > PRIEST_GAS_SPENT_THRESHOLD &&
    classification.contractInteractions > PRIEST_CONTRACT_INTERACTION_THRESHOLD
      ? PRIEST
      : null,

  // 6. Elder Wizard -- wallet age >= 2 years AND low tx count
  (raw, _classification, _balanceEth, walletAgeYears) =>
    walletAgeYears >= ELDER_WIZARD_AGE_YEARS_THRESHOLD &&
    raw.txCount < ELDER_WIZARD_TX_COUNT_THRESHOLD
      ? ELDER_WIZARD
      : null,

  // 7. Guardian -- few transactions AND high balance
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
