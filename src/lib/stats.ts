// Stats calculation engine for Eth-RPG character generation
import type { WalletRawData, TxClassification, CharacterStats, CharacterClassId } from '@/lib/types';
import { getRelevantEvents } from '@/lib/crypto-events';
import { toBalanceEth, toWalletAgeYears } from '@/lib/conversions';

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

// --- DEX (Dexterity) constants ---
export const DEX_BASE = 50;
export const DEX_LOG_MULTIPLIER = 150;
export const DEX_FREQUENCY_FLOOR_YEARS = 0.25;

// --- LUCK constants ---
export const LUCK_BASE = 50;
export const LUCK_LOG_MULTIPLIER = 180;

// --- Power weight constants ---
export const POWER_LEVEL_WEIGHT = 500;
export const POWER_STR_WEIGHT = 25;
export const POWER_INT_WEIGHT = 25;
export const POWER_DEX_WEIGHT = 20;
export const POWER_HP_WEIGHT = 15;
export const POWER_MP_WEIGHT = 15;
export const POWER_LUCK_WEIGHT = 20;

// --- Class power bonus (flat bonus to compensate structurally low-stat classes) ---
export const CLASS_POWER_BONUS: Readonly<Record<CharacterClassId, number>> = {
  hunter: 2000,
  rogue: 0,
  summoner: 1500,
  merchant: 3000,
  priest: 1000,
  elder_wizard: 5000,
  guardian: 4000,
  warrior: 1500,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

function calculateDEX(txCount: number, walletAgeYears: number): number {
  const effectiveAge = Math.max(walletAgeYears, DEX_FREQUENCY_FLOOR_YEARS);
  const txFrequency = txCount / effectiveAge;
  return Math.round(DEX_BASE + DEX_LOG_MULTIPLIER * Math.log10(1 + txFrequency));
}

function calculateLUCK(relevantEventCount: number, walletAgeYears: number): number {
  const rareEvents = relevantEventCount + walletAgeYears;
  return Math.round(LUCK_BASE + LUCK_LOG_MULTIPLIER * Math.log10(1 + rareEvents));
}

function calculatePower(
  level: number,
  str: number,
  int: number,
  dex: number,
  hp: number,
  mp: number,
  luck: number
): number {
  return (
    level * POWER_LEVEL_WEIGHT +
    str * POWER_STR_WEIGHT +
    int * POWER_INT_WEIGHT +
    dex * POWER_DEX_WEIGHT +
    hp * POWER_HP_WEIGHT +
    mp * POWER_MP_WEIGHT +
    luck * POWER_LUCK_WEIGHT
  );
}

export function calculateStats(
  raw: WalletRawData,
  classification: TxClassification,
  classId: CharacterClassId = 'warrior'
): CharacterStats {
  const balanceEth = toBalanceEth(raw.balance);
  const walletAgeYears = toWalletAgeYears(raw.firstTxTimestamp);

  const level = calculateLevel(raw.txCount);
  const hp = calculateHP(balanceEth);
  const mp = calculateMP(raw.gasSpentEth);
  const str = calculateSTR(classification.dexSwapCount, classification.bridgeCount);
  const int = calculateINT(classification.uniqueContracts);
  const dex = calculateDEX(raw.txCount, walletAgeYears);
  const relevantEventCount = getRelevantEvents(raw.firstTxTimestamp, raw.lastTxTimestamp).length;
  const luck = calculateLUCK(relevantEventCount, walletAgeYears);
  const basePower = calculatePower(level, str, int, dex, hp, mp, luck);
  const power = basePower + CLASS_POWER_BONUS[classId];

  return { level, hp, mp, str, int, dex, luck, power };
}
