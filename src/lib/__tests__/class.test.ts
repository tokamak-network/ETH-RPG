import { describe, it, expect, vi, afterEach } from 'vitest';
import { determineClass } from '@/lib/class';
import { classifyTransactions } from '@/lib/classifier';
import {
  makeWalletRawData,
  makeClassification,
  makeTransfer,
  makeDexTransfer,
  makeNftTransfer,
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
  // 1. Hunter -- txCount >= 50 AND nftRatio >= 0.25 AND nftRatio > (dex+stable+bridge)
  // -------------------------------------------------------
  describe('Hunter', () => {
    it('returns hunter when nftRatio equals threshold (0.25) and nftRatio > (dex+stable+bridge)', () => {
      const raw = makeWalletRawData({ txCount: 100 });
      const classification = makeClassification({ nftRatio: 0.25 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
      expect(result.nameEn).toBe('Hunter');
    });

    it('does NOT return hunter when nftRatio is below threshold (0.24)', () => {
      const raw = makeWalletRawData({ txCount: 100 });
      const classification = makeClassification({ nftRatio: 0.24 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });

    it('does NOT return hunter when nftRatio >= threshold but nftRatio <= (dex+stable+bridge)', () => {
      const raw = makeWalletRawData({ txCount: 100 });
      const classification = makeClassification({
        nftRatio: 0.30,
        dexRatio: 0.15,
        stableRatio: 0.10,
        bridgeRatio: 0.06,
      });

      // 0.30 <= 0.15 + 0.10 + 0.06 = 0.31 → NOT hunter
      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });

    it('does NOT return hunter when txCount < 50 and nftRatio < 50%', () => {
      const raw = makeWalletRawData({ txCount: 49 });
      const classification = makeClassification({ nftRatio: 0.30 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });

    it('returns hunter when txCount exactly equals 50', () => {
      const raw = makeWalletRawData({ txCount: 50 });
      const classification = makeClassification({ nftRatio: 0.30 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
    });

    it('returns hunter when NFT-dominant (>= 50%) with txCount >= 10', () => {
      const raw = makeWalletRawData({ txCount: 12 });
      const classification = makeClassification({ nftRatio: 0.60 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
    });

    it('does NOT return hunter when NFT-dominant but txCount < 10', () => {
      const raw = makeWalletRawData({ txCount: 9 });
      const classification = makeClassification({ nftRatio: 0.60 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('hunter');
    });

    it('returns hunter when NFT exactly 50% and txCount exactly 10', () => {
      const raw = makeWalletRawData({ txCount: 10 });
      const classification = makeClassification({ nftRatio: 0.50 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('hunter');
    });

    it('does NOT return hunter when NFT 49% and txCount 12 (below dominant threshold)', () => {
      const raw = makeWalletRawData({ txCount: 12 });
      const classification = makeClassification({ nftRatio: 0.49 });

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
    it('returns merchant when stableRatio equals threshold (0.20)', () => {
      const raw = makeWalletRawData();
      const classification = makeClassification({ stableRatio: 0.20 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('merchant');
      expect(result.nameEn).toBe('Merchant');
    });
  });

  // -------------------------------------------------------
  // 5. Priest -- txCount >= 50 AND gasSpentEth > 1.0 AND contractInteractions > 150
  // -------------------------------------------------------
  describe('Priest', () => {
    it('returns priest when all three conditions are met', () => {
      const raw = makeWalletRawData({ txCount: 100, gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 151 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
      expect(result.nameEn).toBe('Priest');
    });

    it('does NOT return priest when txCount < 50', () => {
      const raw = makeWalletRawData({ txCount: 49, gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 151 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });

    it('returns priest when txCount exactly equals 50', () => {
      const raw = makeWalletRawData({ txCount: 50, gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 151 });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
    });

    it('does NOT return priest when only gasSpentEth condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 1.5 });
      const classification = makeClassification({ contractInteractions: 150 });

      const result = determineClass(raw, classification);

      expect(result.id).not.toBe('priest');
    });

    it('does NOT return priest when only contractInteractions condition is met', () => {
      const raw = makeWalletRawData({ gasSpentEth: 1.0 });
      const classification = makeClassification({ contractInteractions: 151 });

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
      const raw = makeWalletRawData({ txCount: 100 });
      const classification = makeClassification({
        nftRatio: 0.30,
        dexRatio: 0.25,
      });
      // nft(0.30) > dex+stable+bridge(0.25+0+0) → Hunter wins over Rogue

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
        gasSpentEth: 1.5,   // qualifies for Priest (> 1.0)
      });
      const classification = makeClassification({
        contractInteractions: 151, // qualifies for Priest (> 150)
      });

      const result = determineClass(raw, classification);

      expect(result.id).toBe('priest');
    });
  });

  // -------------------------------------------------------
  // Integration: classifier → class pipeline
  // -------------------------------------------------------
  describe('classifier → class integration', () => {
    it('wallet with 30% erc721 utility NFTs + 30% DEX is classified as Rogue (utility NFTs excluded)', () => {
      // 10 transfers: 3 erc721 (utility → excluded) + 3 DEX swaps + 4 plain
      // nftRatio = 0/10 = 0.00 (utility NFTs excluded), dexRatio = 3/10 = 0.30
      // Rogue (dexRatio >= 0.20) wins
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

      // Utility NFTs excluded → nftRatio = 0
      expect(classification.nftRatio).toBeCloseTo(0);
      expect(classification.dexRatio).toBeCloseTo(0.3);
      expect(result.id).toBe('rogue');
    });

    it('wallet with majority erc721 NFTs is classified as Hunter (txCount >= 50)', () => {
      // 10 transfers: 2 Seaport + 1 bare erc721 + 2 utility (excluded) + 2 DEX + 3 plain
      // nftRatio = 3/10 = 0.30 (utility excluded), dexRatio = 2/10 = 0.20
      // Hunter: txCount >= 50 AND nftRatio >= 0.25 AND nftRatio > (dex+stable+bridge) → ✓
      const transfers = [
        makeNftTransfer(),                                                               // via Seaport (PROTOCOL_MAP)
        makeNftTransfer(),                                                               // via Seaport (PROTOCOL_MAP)
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),          // bare erc721
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),     // utility → excluded
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),       // utility → excluded
        makeDexTransfer(),
        makeDexTransfer(),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
      ];

      const classification = classifyTransactions(transfers);
      // txCount=50 to pass min tx gate (transfers are for ratio calc, txCount is separate)
      const raw = makeWalletRawData({ transfers, txCount: 50 });
      const result = determineClass(raw, classification);

      // 3 real NFTs / 10 total = 0.30 (>= 0.25 threshold, > 0.20 dex+0+0) → Hunter
      expect(classification.nftRatio).toBeCloseTo(0.3);
      expect(result.id).toBe('hunter');
    });

    it('wallet with majority erc721 NFTs but txCount < 50 is NOT Hunter', () => {
      const transfers = [
        makeNftTransfer(),
        makeNftTransfer(),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
        makeDexTransfer(),
        makeDexTransfer(),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'external' }),
      ];

      const classification = classifyTransactions(transfers);
      // txCount=10 < 50 → fails min tx gate
      const raw = makeWalletRawData({ transfers, txCount: 10 });
      const result = determineClass(raw, classification);

      expect(classification.nftRatio).toBeCloseTo(0.3);
      expect(result.id).not.toBe('hunter');
    });
  });
});
