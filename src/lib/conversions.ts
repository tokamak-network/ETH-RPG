// Shared conversion utilities for stats and class engines

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Converts a balance in wei (bigint) to ETH (number).
 * Uses intermediate division to avoid precision loss for balances > Number.MAX_SAFE_INTEGER wei (~9,007 ETH).
 * Accurate to 0.0001 ETH for balances up to ~900M ETH.
 */
export function toBalanceEth(balance: bigint): number {
  return Number(balance / BigInt(1e14)) / 1e4;
}

/**
 * Calculates wallet age in years from the first transaction timestamp.
 * Returns 0 if no first transaction exists.
 */
export function toWalletAgeYears(firstTxTimestamp: number | null): number {
  if (firstTxTimestamp === null) {
    return 0;
  }
  return (Date.now() - firstTxTimestamp) / MS_PER_YEAR;
}
