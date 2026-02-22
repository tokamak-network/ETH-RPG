import { describe, it, expect, vi, afterEach } from 'vitest';
import { determineClass } from '@/lib/class';
import { classifyTransactions } from '@/lib/classifier';
import {
  makeWalletRawData,
  makeClassification,
  makeTransfer,
  makeDexTransfer,
  UNISWAP_V3_POSITIONS,
  ENS_BASE_REGISTRAR,
  RANDOM_CONTRACT,
} from './fixtures';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('determineClass', () => {
  // -------------------------------------------------------
  // 1. Hunter -- nftRatio >= 0.25 AND nftRatio > dexRatio
  // -------------------------------------------------------
  describe('Hunter', () => {
    it('returns hunter when nftRatio equals threshold (0.25) and nftRatio > dexRatio', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ nftRatio: 0.25 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
      expect(result.nameEn).toBe('Hunter');
    });

    it('does NOT return hunter when nftRatio is below threshold (0.24)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ nftRatio: 0.24 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });

    it('does NOT return hunter when nftRatio >= threshold but nftRatio <= dexRatio', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ nftRatio: 0.25, dexRatio: 0.25 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });
  });

  // -------------------------------------------------------
  // 2. Rogue -- dexRatio >= 0.20
  // -------------------------------------------------------
  describe('Rogue', () => {
    it('returns rogue when dexRatio equals threshold (0.20)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ dexRatio: 0.20 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('rogue');
      expect(result.nameEn).toBe('Rogue');
    });

    it('does NOT return rogue when dexRatio is below threshold (0.19)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ dexRatio: 0.19 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('rogue');
    });
  });

  // -------------------------------------------------------
  // 3. Summoner -- bridgeCount >= 8 OR bridgeRatio >= 0.12
  // -------------------------------------------------------
  describe('Summoner', () => {
    it('returns summoner when bridgeCount equals threshold (8)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeCount: 8 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('summoner');
      expect(result.nameEn).toBe('Summoner');
    });

    it('returns summoner when bridgeRatio equals threshold (0.12)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeRatio: 0.12 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('summoner');
    });

    it('does NOT return summoner when both bridgeCount and bridgeRatio are below thresholds', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeCount: 7, bridgeRatio: 0.11 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('summoner');
    });
  });

  // -------------------------------------------------------
  // 4. Merchant -- stableRatio >= 0.25
  // -------------------------------------------------------
  describe('Merchant', () => {
    it('returns merchant when stableRatio equals threshold (0.25)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ stableRatio: 0.25 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('merchant');
      expect(result.nameEn).toBe('Merchant');
    });
  });

  // -------------------------------------------------------
  // 5. Priest -- gasSpentEth > 0.3 AND contractInteractions > 30
  // -------------------------------------------------------
  describe('Priest', () => {
    it('returns priest when both gas and contract interaction conditions are met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 0.5 });
      const classification = makeClassification({ contractInteractions: 31 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
      expect(result.nameEn).toBe('Priest');
    });

    it('does NOT return priest when only gasSpentEth condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 0.5 });
      const classification = makeClassification({ contractInteractions: 30 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });

    it('does NOT return priest when only contractInteractions condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 0.3 });
      const classification = makeClassification({ contractInteractions: 31 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });
  });

  // -------------------------------------------------------
  // 6. Elder Wizard -- walletAge >= 4 years AND (txCount / walletAgeYears) < 30 AND balanceEth < 10
  // -------------------------------------------------------
  describe('Elder Wizard', () => {
    it('returns elder_wizard when wallet is 4+ years old, tx-per-year < 30, and balance < 10 ETH', () => {
      const fixedNow = Date.UTC(2025, 0, 1); // 2025-01-01
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fourYearsAgo = fixedNow - 4 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fourYearsAgo,
        txCount: 119, // 119 / 4 = 29.75 < 30
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('elder_wizard');
      expect(result.nameEn).toBe('Elder Wizard');
    });

    it('returns elder_wizard for 5-year wallet with 149 tx (29.8 tx/yr)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fiveYearsAgo = fixedNow - 5 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fiveYearsAgo,
        txCount: 149, // 149 / 5 = 29.8 < 30
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('elder_wizard');
    });

    it('does NOT return elder_wizard when tx-per-year equals threshold (30)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fourYearsAgo = fixedNow - 4 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fourYearsAgo,
        txCount: 120, // 120 / 4 = 30, NOT < 30
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });

    it('does NOT return elder_wizard when wallet is only 3 years old', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const threeYearsAgo = fixedNow - 3 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: threeYearsAgo,
        txCount: 10, // low tx/yr but wallet too young
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });

    it('does NOT return elder_wizard when balance >= 10 ETH ceiling', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fiveYearsAgo = fixedNow - 5 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fiveYearsAgo,
        txCount: 100, // 100 / 5 = 20 < 30
        balance: BigInt(10) * BigInt(10) ** BigInt(18), // exactly 10 ETH (not < 10.0)
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });
  });

  // -------------------------------------------------------
  // 7. Guardian -- txCount < 200 AND balanceEth > 5.0
  // -------------------------------------------------------
  describe('Guardian', () => {
    it('returns guardian when txCount < 200 and balance > 5 ETH', () => {
      const raw = makeWalletRawData({
        txCount: 199,
        balance: BigInt(6) * BigInt(10) ** BigInt(18), // 6 ETH
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('guardian');
      expect(result.nameEn).toBe('Guardian');
    });

    it('does NOT return guardian when txCount equals threshold (200)', () => {
      const raw = makeWalletRawData({
        txCount: 200,
        balance: BigInt(6) * BigInt(10) ** BigInt(18), // 6 ETH
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('guardian');
    });

    it('does NOT return guardian when balance is below threshold', () => {
      const raw = makeWalletRawData({
        txCount: 50,
        balance: BigInt(5) * BigInt(10) ** BigInt(18), // exactly 5 ETH (not > 5.0)
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('guardian');
    });
  });

  // -------------------------------------------------------
  // 8. Warrior -- default when nothing matches
  // -------------------------------------------------------
  describe('Warrior (default)', () => {
    it('returns warrior when no other class conditions are met', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('warrior');
      expect(result.nameEn).toBe('Warrior');
    });
  });

  // -------------------------------------------------------
  // Priority tests
  // -------------------------------------------------------
  describe('priority ordering', () => {
    it('Hunter wins over Rogue when both conditions are met', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({
        nftRatio: 0.25,
        dexRatio: 0.20,
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
    });

    it('Priest wins over Elder Wizard when both conditions are met (higher priority)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fourYearsAgo = fixedNow - 4 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fourYearsAgo,
        txCount: 100,       // qualifies for Elder Wizard (100/4 = 25 < 30)
        gasSpentEth: 0.5,   // qualifies for Priest (> 0.3)
      });
      const classification = makeClassification({
        contractInteractions: 31, // qualifies for Priest (> 30)
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
    });
  });

  // -------------------------------------------------------
  // Integration: classifier → class pipeline
  // -------------------------------------------------------
  describe('classifier → class integration', () => {
    it('wallet with 30% utility NFTs is NOT classified as Hunter', () => {
      // 10 transfers: 3 utility NFTs (excluded) + 3 DEX swaps + 4 plain
      const transfers = [
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeDexTransfer(),
        makeDexTransfer(),
        makeDexTransfer(),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
      ];

      const classification = classifyTransactions(transfers);
      const raw = makeWalletRawData({ transfers, txCount: transfers.length });
      const result = determineClass(raw, classification);

      // Without utility exclusion, nftRatio would be 3/10 = 0.30 → Hunter.
      // With exclusion, nftRatio = 0/10 = 0, dexRatio = 3/10 = 0.30 → Rogue.
      expect(classification.nftRatio).toBe(0);
      expect(classification.dexRatio).toBeCloseTo(0.3);
      expect(result.id).not.toBe('hunter');
      expect(result.id).toBe('rogue');
    });

    it('wallet with mixed utility + real NFTs gets correct class', () => {
      // 10 transfers: 2 utility NFTs (excluded) + 3 real NFTs + 5 plain
      const transfers = [
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
      ];

      const classification = classifyTransactions(transfers);
      const raw = makeWalletRawData({ transfers, txCount: transfers.length });
      const result = determineClass(raw, classification);

      // Without exclusion: nftRatio = 5/10 = 0.50 → Hunter.
      // With exclusion: nftRatio = 3/10 = 0.30, still >= 0.25 → Hunter (real NFTs).
      expect(classification.nftRatio).toBeCloseTo(0.3);
      expect(result.id).toBe('hunter');
    });
  });
});
