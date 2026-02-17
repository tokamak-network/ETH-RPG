// Stats calculation engine for Eth-RPG character generation
import type { WalletRawData, TxClassification, CharacterStats } from '@/lib/types';

// --- Conversion constants ---
export const WEI_PER_ETH = 1e18;

// --- Level constants ---
export const LEVEL_LOG_MULTIPLIER = 10;
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 60;

// --- HP constants ---
export const HP_BASE = 100;
export const HP_LOG_MULTIPLIER = 250;

// --- MP constants ---
export const MP_BASE = 80;
export const MP_LOG_MULTIPLIER = 220;

// --- STR constants ---
export const STR_BASE = 50;
export const STR_LOG_MULTIPLIER = 180;

// --- INT constants ---
export const INT_BASE = 50;
export const INT_LOG_MULTIPLIER = 180;

// --- LUCK constants ---
export const LUCK_BASE = 50;
export const LUCK_LOG_MULTIPLIER = 120;
export const LUCK_UNIQUE_CONTRACT_WEIGHT = 0.1;

// --- Power weight constants ---
export const POWER_LEVEL_WEIGHT = 1000;
export const POWER_STR_WEIGHT = 30;
export const POWER_INT_WEIGHT = 30;
export const POWER_HP_WEIGHT = 10;
export const POWER_MP_WEIGHT = 10;
export const POWER_LUCK_WEIGHT = 20;

// --- Time constants ---
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toBalanceEth(balance: bigint): number {
  return Number(balance) / WEI_PER_ETH;
}

function toWalletAgeYears(firstTxTimestamp: number | null): number {
  if (firstTxTimestamp === null) {
    return 0;
  }
  return (Date.now() - firstTxTimestamp) / MS_PER_YEAR;
}

function calculateLevel(txCount: number): number {
  const raw = 1 + Math.floor(LEVEL_LOG_MULTIPLIER * Math.log10(1 + txCount));
  return clamp(raw, LEVEL_MIN, LEVEL_MAX);
}

function calculateHP(balanceEth: number): number {
  return Math.round(HP_BASE + HP_LOG_MULTIPLIER * Math.log10(1 + balanceEth));
}

function calculateMP(gasSpentEth: number): number {
  return Math.round(MP_BASE + MP_LOG_MULTIPLIER * Math.log10(1 + gasSpentEth));
}

function calculateSTR(dexSwapCount: number, bridgeCount: number): number {
  return Math.round(STR_BASE + STR_LOG_MULTIPLIER * Math.log10(1 + dexSwapCount + bridgeCount));
}

function calculateINT(uniqueContracts: number): number {
  return Math.round(INT_BASE + INT_LOG_MULTIPLIER * Math.log10(1 + uniqueContracts));
}

function calculateLUCK(uniqueContracts: number, walletAgeYears: number): number {
  const rareEvents = uniqueContracts * LUCK_UNIQUE_CONTRACT_WEIGHT + walletAgeYears;
  return Math.round(LUCK_BASE + LUCK_LOG_MULTIPLIER * Math.log10(1 + rareEvents));
}

function calculatePower(
  level: number,
  str: number,
  int: number,
  hp: number,
  mp: number,
  luck: number
): number {
  return (
    level * POWER_LEVEL_WEIGHT +
    str * POWER_STR_WEIGHT +
    int * POWER_INT_WEIGHT +
    hp * POWER_HP_WEIGHT +
    mp * POWER_MP_WEIGHT +
    luck * POWER_LUCK_WEIGHT
  );
}

export function calculateStats(
  raw: WalletRawData,
  classification: TxClassification
): CharacterStats {
  const balanceEth = toBalanceEth(raw.balance);
  const walletAgeYears = toWalletAgeYears(raw.firstTxTimestamp);

  const level = calculateLevel(raw.txCount);
  const hp = calculateHP(balanceEth);
  const mp = calculateMP(raw.gasSpentEth);
  const str = calculateSTR(classification.dexSwapCount, classification.bridgeCount);
  const int = calculateINT(classification.uniqueContracts);
  const luck = calculateLUCK(classification.uniqueContracts, walletAgeYears);
  const power = calculatePower(level, str, int, hp, mp, luck);

  return { level, hp, mp, str, int, luck, power };
}
