import { describe, it, expect, vi, afterEach } from 'vitest';
import { determineClass } from '@/lib/class';
import { makeWalletRawData, makeClassification } from './fixtures';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('determineClass', () => {
  // -------------------------------------------------------
  // 1. Hunter -- nftRatio >= 0.30
  // -------------------------------------------------------
  describe('Hunter', () => {
    it('returns hunter when nftRatio equals threshold (0.30)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ nftRatio: 0.30 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
      expect(result.nameEn).toBe('Hunter');
    });

    it('does NOT return hunter when nftRatio is below threshold (0.29)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ nftRatio: 0.29 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });
  });

  // -------------------------------------------------------
  // 2. Rogue -- dexRatio >= 0.25
  // -------------------------------------------------------
  describe('Rogue', () => {
    it('returns rogue when dexRatio equals threshold (0.25)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ dexRatio: 0.25 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('rogue');
      expect(result.nameEn).toBe('Rogue');
    });

    it('does NOT return rogue when dexRatio is below threshold (0.24)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ dexRatio: 0.24 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('rogue');
    });
  });

  // -------------------------------------------------------
  // 3. Summoner -- bridgeCount >= 5 OR bridgeRatio >= 0.10
  // -------------------------------------------------------
  describe('Summoner', () => {
    it('returns summoner when bridgeCount equals threshold (5)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeCount: 5 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('summoner');
      expect(result.nameEn).toBe('Summoner');
    });

    it('returns summoner when bridgeRatio equals threshold (0.10)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeRatio: 0.10 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('summoner');
    });

    it('does NOT return summoner when both bridgeCount and bridgeRatio are below thresholds', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ bridgeCount: 4, bridgeRatio: 0.09 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('summoner');
    });
  });

  // -------------------------------------------------------
  // 4. Merchant -- stableRatio >= 0.35
  // -------------------------------------------------------
  describe('Merchant', () => {
    it('returns merchant when stableRatio equals threshold (0.35)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ stableRatio: 0.35 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('merchant');
      expect(result.nameEn).toBe('Merchant');
    });
  });

  // -------------------------------------------------------
  // 5. Priest -- gasSpentEth > 0.5 AND contractInteractions > 50
  // -------------------------------------------------------
  describe('Priest', () => {
    it('returns priest when both gas and contract interaction conditions are met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 51 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
      expect(result.nameEn).toBe('Priest');
    });

    it('does NOT return priest when only gasSpentEth condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 50 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });

    it('does NOT return priest when only contractInteractions condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 0.5 });
      const classification = makeClassification({ contractInteractions: 51 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });
  });

  // -------------------------------------------------------
  // 6. Elder Wizard -- walletAge >= 3 years AND (txCount / walletAgeYears) < 50
  // -------------------------------------------------------
  describe('Elder Wizard', () => {
    it('returns elder_wizard when wallet is 3+ years old and tx-per-year < 50', () => {
      const fixedNow = Date.UTC(2025, 0, 1); // 2025-01-01
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const threeYearsAgo = fixedNow - 3 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: threeYearsAgo,
        txCount: 149, // 149 / 3 ≈ 49.67 < 50
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('elder_wizard');
      expect(result.nameEn).toBe('Elder Wizard');
    });

    it('returns elder_wizard for 5-year wallet with 249 tx (49.8 tx/yr)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const fiveYearsAgo = fixedNow - 5 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: fiveYearsAgo,
        txCount: 249, // 249 / 5 = 49.8 < 50
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('elder_wizard');
    });

    it('does NOT return elder_wizard when tx-per-year equals threshold (50)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const threeYearsAgo = fixedNow - 3 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: threeYearsAgo,
        txCount: 150, // 150 / 3 = 50, NOT < 50
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });

    it('does NOT return elder_wizard when wallet is only 2 years old', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const twoYearsAgo = fixedNow - 2 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: twoYearsAgo,
        txCount: 10, // low tx/yr but wallet too young
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });
  });

  // -------------------------------------------------------
  // 7. Guardian -- txCount < 100 AND balanceEth > 1.0
  // -------------------------------------------------------
  describe('Guardian', () => {
    it('returns guardian when txCount < 100 and balance > 1 ETH', () => {
      const raw = makeWalletRawData({
        txCount: 99,
        balance: BigInt(2) * BigInt(10) ** BigInt(18), // 2 ETH
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('guardian');
      expect(result.nameEn).toBe('Guardian');
    });

    it('does NOT return guardian when txCount equals threshold (100)', () => {
      const raw = makeWalletRawData({
        txCount: 100,
        balance: BigInt(2) * BigInt(10) ** BigInt(18), // 2 ETH
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('guardian');
    });

    it('does NOT return guardian when balance is below threshold', () => {
      const raw = makeWalletRawData({
        txCount: 50,
        balance: BigInt(1) * BigInt(10) ** BigInt(18), // exactly 1 ETH (not > 1.0)
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
        nftRatio: 0.30,
        dexRatio: 0.25,
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
    });

    it('Priest wins over Elder Wizard when both conditions are met (higher priority)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const threeYearsAgo = fixedNow - 3 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: threeYearsAgo,
        txCount: 100,       // qualifies for Elder Wizard (100/3 ≈ 33.3 < 50)
        gasSpentEth: 1.5,   // qualifies for Priest (> 0.5)
      });
      const classification = makeClassification({
        contractInteractions: 51, // qualifies for Priest (> 50)
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
    });
  });
});
