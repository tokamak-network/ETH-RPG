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
  // 5. Priest -- gasSpentEth > 1.0 AND contractInteractions > 50
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
      const raw = makeWalletRawData({ gasSpentEth: 1.0 });
      const classification = makeClassification({ contractInteractions: 51 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });
  });

  // -------------------------------------------------------
  // 6. Elder Wizard -- walletAge >= 2 years AND txCount < 50
  // -------------------------------------------------------
  describe('Elder Wizard', () => {
    it('returns elder_wizard when wallet is 2+ years old and txCount < 50', () => {
      const fixedNow = Date.UTC(2025, 0, 1); // 2025-01-01
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const twoYearsAgo = fixedNow - 2 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: twoYearsAgo,
        txCount: 49,
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('elder_wizard');
      expect(result.nameEn).toBe('Elder Wizard');
    });

    it('does NOT return elder_wizard when txCount equals threshold (50)', () => {
      const fixedNow = Date.UTC(2025, 0, 1);
      vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

      const twoYearsAgo = fixedNow - 2 * MS_PER_YEAR;
      const raw = makeWalletRawData({
        firstTxTimestamp: twoYearsAgo,
        txCount: 50,
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('elder_wizard');
    });
  });

  // -------------------------------------------------------
  // 7. Guardian -- txCount < 20 AND balanceEth > 1.0
  // -------------------------------------------------------
  describe('Guardian', () => {
    it('returns guardian when txCount < 20 and balance > 1 ETH', () => {
      const raw = makeWalletRawData({
        txCount: 19,
        balance: BigInt(2) * BigInt(10) ** BigInt(18), // 2 ETH
      });
      const classification = makeClassification();

      const result = determineClass(raw, classification);

      expect(result.id).toBe('guardian');
      expect(result.nameEn).toBe('Guardian');
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
        txCount: 49,        // qualifies for Elder Wizard (< 50)
        gasSpentEth: 1.5,   // qualifies for Priest (> 1.0)
      });
      const classification = makeClassification({
        contractInteractions: 51, // qualifies for Priest (> 50)
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
    });
  });
});
