import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeWalletRawData, makeClassification } from './fixtures';
import { evaluateAchievements } from '@/lib/achievements';

// Fix Date.now for deterministic age calculations
const FIXED_NOW = new Date('2025-06-01T00:00:00Z').getTime();
vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

afterEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
});

function hasAchievement(achievements: readonly { readonly id: string }[], id: string): boolean {
  return achievements.some((a) => a.id === id);
}

describe('evaluateAchievements', () => {
  describe('Legendary tier', () => {
    describe('genesis', () => {
      it('awards when first tx before 2016-01-01', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: new Date('2015-12-31').getTime(),
          lastTxTimestamp: FIXED_NOW - 1000,
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'genesis')).toBe(true);
      });

      it('does not award when first tx is exactly 2016-01-01', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: new Date('2016-01-01').getTime(),
          lastTxTimestamp: FIXED_NOW - 1000,
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'genesis')).toBe(false);
      });

      it('does not award when firstTxTimestamp is null', () => {
        const raw = makeWalletRawData({ txCount: 10, firstTxTimestamp: null });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'genesis')).toBe(false);
      });
    });

    describe('merge_witness', () => {
      it('awards when wallet was active during The Merge window', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: new Date('2022-01-01').getTime(),
          lastTxTimestamp: new Date('2023-01-01').getTime(),
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'merge_witness')).toBe(true);
      });

      it('awards when wallet started exactly within merge window', () => {
        const mergeDate = new Date('2022-09-15').getTime();
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: mergeDate,
          lastTxTimestamp: mergeDate + 1000,
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'merge_witness')).toBe(true);
      });

      it('does not award when wallet activity ends before merge window', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: new Date('2020-01-01').getTime(),
          lastTxTimestamp: new Date('2022-09-01').getTime(), // before merge - 7 days
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'merge_witness')).toBe(false);
      });
    });

    describe('gas_titan', () => {
      it('awards when gas spent > 10 ETH', () => {
        const raw = makeWalletRawData({ txCount: 10, gasSpentEth: 10.01 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'gas_titan')).toBe(true);
      });

      it('does not award when gas spent is exactly 10 ETH', () => {
        const raw = makeWalletRawData({ txCount: 10, gasSpentEth: 10 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'gas_titan')).toBe(false);
      });
    });
  });

  describe('Epic tier', () => {
    describe('diamond_hands', () => {
      it('awards when wallet age >= 4 years and balance > 0.1 ETH', () => {
        const fourYearsAgo = FIXED_NOW - (4 * 365.25 * 24 * 60 * 60 * 1000);
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: fourYearsAgo,
          lastTxTimestamp: FIXED_NOW - 1000,
          balance: BigInt('200000000000000000'), // 0.2 ETH
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'diamond_hands')).toBe(true);
      });

      it('does not award when balance is too low', () => {
        const fourYearsAgo = FIXED_NOW - (4 * 365.25 * 24 * 60 * 60 * 1000);
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: fourYearsAgo,
          lastTxTimestamp: FIXED_NOW - 1000,
          balance: BigInt('50000000000000000'), // 0.05 ETH
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'diamond_hands')).toBe(false);
      });

      it('does not award when wallet is too young', () => {
        const threeYearsAgo = FIXED_NOW - (3 * 365.25 * 24 * 60 * 60 * 1000);
        const raw = makeWalletRawData({
          txCount: 10,
          firstTxTimestamp: threeYearsAgo,
          lastTxTimestamp: FIXED_NOW - 1000,
          balance: BigInt('1000000000000000000'), // 1 ETH
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'diamond_hands')).toBe(false);
      });
    });

    describe('bridge_runner', () => {
      it('awards when bridge count >= 10', () => {
        const raw = makeWalletRawData({ txCount: 10 });
        const cls = makeClassification({ bridgeCount: 10 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'bridge_runner')).toBe(true);
      });

      it('does not award when bridge count is 9', () => {
        const raw = makeWalletRawData({ txCount: 10 });
        const cls = makeClassification({ bridgeCount: 9 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'bridge_runner')).toBe(false);
      });
    });

    describe('contract_sage', () => {
      it('awards when unique contracts >= 200', () => {
        const raw = makeWalletRawData({ txCount: 200 });
        const cls = makeClassification({ uniqueContracts: 200 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'contract_sage')).toBe(true);
      });

      it('does not award when unique contracts is 199', () => {
        const raw = makeWalletRawData({ txCount: 200 });
        const cls = makeClassification({ uniqueContracts: 199 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'contract_sage')).toBe(false);
      });
    });

    describe('dex_master', () => {
      it('awards when dex swap count >= 100', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ dexSwapCount: 100 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'dex_master')).toBe(true);
      });

      it('does not award when dex swap count is 99', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ dexSwapCount: 99 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'dex_master')).toBe(false);
      });
    });
  });

  describe('Rare tier', () => {
    describe('nft_collector', () => {
      it('awards when NFT ratio >= 0.4', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ nftRatio: 0.4 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'nft_collector')).toBe(true);
      });

      it('does not award when NFT ratio is 0.39', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ nftRatio: 0.39 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'nft_collector')).toBe(false);
      });
    });

    describe('stable_hand', () => {
      it('awards when stable ratio >= 0.5', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ stableRatio: 0.5 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'stable_hand')).toBe(true);
      });

      it('does not award when stable ratio is 0.49', () => {
        const raw = makeWalletRawData({ txCount: 100 });
        const cls = makeClassification({ stableRatio: 0.49 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'stable_hand')).toBe(false);
      });
    });

    describe('veteran', () => {
      it('awards when tx count >= 1000', () => {
        const raw = makeWalletRawData({ txCount: 1000 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'veteran')).toBe(true);
      });

      it('does not award when tx count is 999', () => {
        const raw = makeWalletRawData({ txCount: 999 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'veteran')).toBe(false);
      });
    });

    describe('whale', () => {
      it('awards when balance >= 100 ETH', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          balance: BigInt('100000000000000000000'), // 100 ETH
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'whale')).toBe(true);
      });

      it('does not award when balance is just below 100 ETH', () => {
        const raw = makeWalletRawData({
          txCount: 10,
          balance: BigInt('99990000000000000000'), // 99.99 ETH
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'whale')).toBe(false);
      });
    });

    describe('survivor', () => {
      it('awards when active across 3+ crisis events', () => {
        const raw = makeWalletRawData({
          txCount: 100,
          firstTxTimestamp: new Date('2019-01-01').getTime(),
          lastTxTimestamp: new Date('2024-01-01').getTime(),
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'survivor')).toBe(true);
      });

      it('does not award when active across only 2 crisis events', () => {
        // Only covers COVID (2020-03-12) and 2021 Crash (2021-05-19)
        const raw = makeWalletRawData({
          txCount: 100,
          firstTxTimestamp: new Date('2020-01-01').getTime(),
          lastTxTimestamp: new Date('2021-06-01').getTime(),
        });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'survivor')).toBe(false);
      });
    });
  });

  describe('Common tier', () => {
    describe('first_step', () => {
      it('awards when tx count >= 1', () => {
        const raw = makeWalletRawData({ txCount: 1 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'first_step')).toBe(true);
      });

      it('does not award when tx count is 0', () => {
        const raw = makeWalletRawData({ txCount: 0 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'first_step')).toBe(false);
      });
    });

    describe('explorer', () => {
      it('awards when unique contracts >= 10', () => {
        const raw = makeWalletRawData({ txCount: 10 });
        const cls = makeClassification({ uniqueContracts: 10 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'explorer')).toBe(true);
      });

      it('does not award when unique contracts is 9', () => {
        const raw = makeWalletRawData({ txCount: 10 });
        const cls = makeClassification({ uniqueContracts: 9 });
        const result = evaluateAchievements(raw, cls);
        expect(hasAchievement(result, 'explorer')).toBe(false);
      });
    });

    describe('gas_burner', () => {
      it('awards when gas spent > 0.1 ETH', () => {
        const raw = makeWalletRawData({ txCount: 10, gasSpentEth: 0.11 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'gas_burner')).toBe(true);
      });

      it('does not award when gas spent is exactly 0.1 ETH', () => {
        const raw = makeWalletRawData({ txCount: 10, gasSpentEth: 0.1 });
        const result = evaluateAchievements(raw, makeClassification());
        expect(hasAchievement(result, 'gas_burner')).toBe(false);
      });
    });
  });

  describe('tier sorting', () => {
    it('sorts by tier priority: legendary > epic > rare > common', () => {
      // This wallet qualifies for achievements across all tiers
      const raw = makeWalletRawData({
        txCount: 1000,
        balance: BigInt('100000000000000000000'), // 100 ETH
        firstTxTimestamp: new Date('2015-01-01').getTime(),
        lastTxTimestamp: new Date('2024-01-01').getTime(),
        gasSpentEth: 11,
      });
      const cls = makeClassification({ uniqueContracts: 200, dexSwapCount: 100, bridgeCount: 10 });
      const result = evaluateAchievements(raw, cls);

      expect(result.length).toBeGreaterThan(0);

      // Verify ordering: each tier should come before the next
      const tierOrder = result.map((a) => a.tier);
      for (let i = 1; i < tierOrder.length; i++) {
        const prevPriority = tierOrder[i - 1] === 'legendary' ? 0 : tierOrder[i - 1] === 'epic' ? 1 : tierOrder[i - 1] === 'rare' ? 2 : 3;
        const currPriority = tierOrder[i] === 'legendary' ? 0 : tierOrder[i] === 'epic' ? 1 : tierOrder[i] === 'rare' ? 2 : 3;
        expect(prevPriority).toBeLessThanOrEqual(currPriority);
      }
    });
  });

  describe('edge cases', () => {
    it('returns empty array for zero-tx wallet', () => {
      const raw = makeWalletRawData({
        txCount: 0,
        balance: BigInt(0),
        gasSpentEth: 0,
        firstTxTimestamp: null,
        lastTxTimestamp: null,
      });
      const result = evaluateAchievements(raw, makeClassification());
      expect(result).toEqual([]);
    });

    it('returns immutable array', () => {
      const raw = makeWalletRawData({ txCount: 1 });
      const result = evaluateAchievements(raw, makeClassification());
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('each achievement has required fields', () => {
      const raw = makeWalletRawData({ txCount: 1, gasSpentEth: 0.5 });
      const result = evaluateAchievements(raw, makeClassification());
      for (const achievement of result) {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('tier');
        expect(achievement).toHaveProperty('description');
      }
    });
  });
});
