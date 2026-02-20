import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateStats,
  LEVEL_LOG_MULTIPLIER,
  LEVEL_MIN,
  LEVEL_MAX,
  HP_BASE,
  HP_MAX,
  HP_LOG_MULTIPLIER,
  MP_BASE,
  MP_MAX,
  MP_LOG_MULTIPLIER,
  STR_BASE,
  STR_MAX,
  STR_LOG_MULTIPLIER,
  INT_BASE,
  INT_MAX,
  INT_LOG_MULTIPLIER,
  DEX_BASE,
  DEX_MAX,
  DEX_LOG_MULTIPLIER,
  DEX_FREQUENCY_FLOOR_YEARS,
  LUCK_BASE,
  LUCK_MAX,
  LUCK_LOG_MULTIPLIER,
  POWER_LEVEL_WEIGHT,
  POWER_STR_WEIGHT,
  POWER_INT_WEIGHT,
  POWER_DEX_WEIGHT,
  POWER_HP_WEIGHT,
  POWER_MP_WEIGHT,
  POWER_LUCK_WEIGHT,
  CLASS_POWER_BONUS,
} from '@/lib/stats';
import { makeWalletRawData, makeClassification } from './fixtures';

// Mock crypto-events to control relevantEventCount independently
vi.mock('@/lib/crypto-events', () => ({
  getRelevantEvents: vi.fn(() => []),
}));

// Import the mock so we can override return values per test
import { getRelevantEvents } from '@/lib/crypto-events';
const mockGetRelevantEvents = vi.mocked(getRelevantEvents);

// Fixed timestamp: 2025-01-01T00:00:00Z
const FIXED_NOW = new Date('2025-01-01T00:00:00Z').getTime();
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
  mockGetRelevantEvents.mockReturnValue([]);
});

// ---------------------------------------------------------------------------
// 1. Level calculation
// ---------------------------------------------------------------------------
describe('Level calculation', () => {
  it('returns level=1 when txCount=0', () => {
    const raw = makeWalletRawData({ txCount: 0 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 1 + floor(10 * log10(1)) = 1 + 0 = 1
    expect(stats.level).toBe(1);
  });

  it('returns level=11 when txCount=9', () => {
    const raw = makeWalletRawData({ txCount: 9 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 1 + floor(10 * log10(10)) = 1 + floor(10 * 1) = 11
    expect(stats.level).toBe(11);
  });

  it('clamps level to 60 for very high txCount', () => {
    const raw = makeWalletRawData({ txCount: 999999 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 1 + floor(10 * log10(1000000)) = 1 + floor(60) = 61 -> clamped to 60
    expect(stats.level).toBe(LEVEL_MAX);
  });

  it('produces a moderate level for txCount=100', () => {
    const raw = makeWalletRawData({ txCount: 100 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 1 + floor(10 * log10(101)) ~= 1 + floor(20.04) = 21
    expect(stats.level).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// 2. HP calculation
// ---------------------------------------------------------------------------
describe('HP calculation', () => {
  it('returns hp=100 when balance=0', () => {
    const raw = makeWalletRawData({ balance: BigInt(0) });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 100 + 250 * log10(1) = 100
    expect(stats.hp).toBe(HP_BASE);
  });

  it('calculates correct HP for 10 ETH balance', () => {
    // 10 ETH = 10 * 10^18 wei
    const tenEthWei = BigInt(10) * BigInt(10) ** BigInt(18);
    const raw = makeWalletRawData({ balance: tenEthWei });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // toBalanceEth: Number(10e18 / 1e14) / 1e4 = 10.0 ETH
    // HP = round(100 + 250 * log10(11)) ~= round(100 + 260.21) = 360
    const expectedHP = Math.round(HP_BASE + HP_LOG_MULTIPLIER * Math.log10(1 + 10));
    expect(stats.hp).toBe(expectedHP);
  });

  it('calculates correct HP for 100 ETH balance', () => {
    const hundredEthWei = BigInt(100) * BigInt(10) ** BigInt(18);
    const raw = makeWalletRawData({ balance: hundredEthWei });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // toBalanceEth: Number(100e18 / 1e14) / 1e4 = 100.0 ETH
    // HP = round(100 + 250 * log10(101)) ~= round(100 + 501.07) = 601
    const expectedHP = Math.round(HP_BASE + HP_LOG_MULTIPLIER * Math.log10(1 + 100));
    expect(stats.hp).toBe(expectedHP);
  });
});

// ---------------------------------------------------------------------------
// 3. MP calculation
// ---------------------------------------------------------------------------
describe('MP calculation', () => {
  it('returns mp=80 when gasSpentEth=0', () => {
    const raw = makeWalletRawData({ gasSpentEth: 0 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // 80 + 220 * log10(1) = 80
    expect(stats.mp).toBe(MP_BASE);
  });

  it('calculates correct MP for gasSpentEth=1.0', () => {
    const raw = makeWalletRawData({ gasSpentEth: 1.0 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // round(80 + 220 * log10(2)) ~= round(80 + 66.22) = 146
    const expectedMP = Math.round(MP_BASE + MP_LOG_MULTIPLIER * Math.log10(2));
    expect(stats.mp).toBe(expectedMP);
  });
});

// ---------------------------------------------------------------------------
// 4. STR calculation
// ---------------------------------------------------------------------------
describe('STR calculation', () => {
  it('returns str=50 when dexSwapCount=0 and bridgeCount=0', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ dexSwapCount: 0, bridgeCount: 0 });

    const stats = calculateStats(raw, classification);

    // 50 + 180 * log10(1) = 50
    expect(stats.str).toBe(STR_BASE);
  });

  it('calculates correct STR for dexSwapCount=99, bridgeCount=1', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ dexSwapCount: 99, bridgeCount: 1 });

    const stats = calculateStats(raw, classification);

    // round(50 + 180 * log10(101)) ~= round(50 + 360.77) = 411
    const expectedSTR = Math.round(STR_BASE + STR_LOG_MULTIPLIER * Math.log10(1 + 99 + 1));
    expect(stats.str).toBe(expectedSTR);
  });
});

// ---------------------------------------------------------------------------
// 5. INT calculation
// ---------------------------------------------------------------------------
describe('INT calculation', () => {
  it('returns int=50 when uniqueContracts=0', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ uniqueContracts: 0 });

    const stats = calculateStats(raw, classification);

    // 50 + 180 * log10(1) = 50
    expect(stats.int).toBe(INT_BASE);
  });

  it('calculates correct INT for uniqueContracts=100', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ uniqueContracts: 100 });

    const stats = calculateStats(raw, classification);

    // round(50 + 180 * log10(101)) ~= round(50 + 360.77) = 411
    const expectedINT = Math.round(INT_BASE + INT_LOG_MULTIPLIER * Math.log10(1 + 100));
    expect(stats.int).toBe(expectedINT);
  });
});

// ---------------------------------------------------------------------------
// 6. DEX (Dexterity) calculation
// ---------------------------------------------------------------------------
describe('DEX calculation', () => {
  it('returns dex=50 when txCount=0', () => {
    const raw = makeWalletRawData({ txCount: 0 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // txFrequency = 0 / max(0, 0.25) = 0
    // round(50 + 150 * log10(1)) = 50
    expect(stats.dex).toBe(DEX_BASE);
  });

  it('uses frequency floor of 0.25 years when walletAgeYears=0', () => {
    // firstTxTimestamp=null -> walletAgeYears=0 -> floored to 0.25
    const raw = makeWalletRawData({ txCount: 100, firstTxTimestamp: null });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // txFrequency = 100 / 0.25 = 400
    // round(50 + 150 * log10(401)) ~= round(50 + 390.35) = 440
    const expectedDEX = Math.round(DEX_BASE + DEX_LOG_MULTIPLIER * Math.log10(1 + 100 / DEX_FREQUENCY_FLOOR_YEARS));
    expect(stats.dex).toBe(expectedDEX);
  });

  it('calculates dex with a 2-year wallet age', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const twoYearsAgo = FIXED_NOW - 2 * MS_PER_YEAR;
    const raw = makeWalletRawData({
      txCount: 500,
      firstTxTimestamp: twoYearsAgo,
    });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // walletAgeYears = 2.0, txFrequency = 500 / 2.0 = 250
    // round(50 + 150 * log10(251)) ~= round(50 + 360.10) = 410
    const walletAgeYears = 2.0;
    const txFrequency = 500 / Math.max(walletAgeYears, DEX_FREQUENCY_FLOOR_YEARS);
    const expectedDEX = Math.round(DEX_BASE + DEX_LOG_MULTIPLIER * Math.log10(1 + txFrequency));
    expect(stats.dex).toBe(expectedDEX);
  });

  it('scales with higher transaction frequency', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const oneYearAgo = FIXED_NOW - 1 * MS_PER_YEAR;
    const lowRaw = makeWalletRawData({ txCount: 10, firstTxTimestamp: oneYearAgo });
    const highRaw = makeWalletRawData({ txCount: 1000, firstTxTimestamp: oneYearAgo });
    const classification = makeClassification();

    const lowStats = calculateStats(lowRaw, classification);
    const highStats = calculateStats(highRaw, classification);

    expect(highStats.dex).toBeGreaterThan(lowStats.dex);
  });
});

// ---------------------------------------------------------------------------
// 7. LUCK calculation (requires Date.now mock)
// ---------------------------------------------------------------------------
describe('LUCK calculation', () => {
  it('returns base luck when firstTxTimestamp is null and no relevant events', () => {
    const raw = makeWalletRawData({ firstTxTimestamp: null });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const stats = calculateStats(raw, classification);

    // walletAgeYears = 0, relevantEventCount = 0
    // rareEvents = 0 + 0 = 0
    // round(50 + 180 * log10(1)) = 50
    expect(stats.luck).toBe(LUCK_BASE);
  });

  it('calculates luck with wallet age of 2 years and relevant events', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const twoYearsAgo = FIXED_NOW - 2 * MS_PER_YEAR;
    const raw = makeWalletRawData({
      firstTxTimestamp: twoYearsAgo,
      lastTxTimestamp: FIXED_NOW,
    });
    const classification = makeClassification();

    // Simulate 3 relevant events found between firstTx and lastTx
    mockGetRelevantEvents.mockReturnValue([
      'event1',
      'event2',
      'event3',
    ]);

    const stats = calculateStats(raw, classification);

    // walletAgeYears = 2.0, relevantEventCount = 3
    // rareEvents = 3 + 2.0 = 5.0
    // round(50 + 180 * log10(6.0)) ~= round(50 + 140.03) = 190
    const expectedLUCK = Math.round(LUCK_BASE + LUCK_LOG_MULTIPLIER * Math.log10(1 + 3 + 2));
    expect(stats.luck).toBe(expectedLUCK);
  });

  it('scales luck with many relevant events', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const fiveYearsAgo = FIXED_NOW - 5 * MS_PER_YEAR;
    const raw = makeWalletRawData({
      firstTxTimestamp: fiveYearsAgo,
      lastTxTimestamp: FIXED_NOW,
    });
    const classification = makeClassification();

    // 8 relevant events
    mockGetRelevantEvents.mockReturnValue(
      Array.from({ length: 8 }, (_, i) => `event${i}`),
    );

    const stats = calculateStats(raw, classification);

    // walletAgeYears = 5.0, relevantEventCount = 8
    // rareEvents = 8 + 5 = 13
    // round(50 + 180 * log10(14)) ~= round(50 + 206.33) = 256
    const expectedLUCK = Math.round(LUCK_BASE + LUCK_LOG_MULTIPLIER * Math.log10(1 + 8 + 5));
    expect(stats.luck).toBe(expectedLUCK);
  });
});

// ---------------------------------------------------------------------------
// 8. Power composite formula
// ---------------------------------------------------------------------------
describe('Power calculation', () => {
  it('computes power as the correct weighted sum of all stats plus class bonus', () => {
    const raw = makeWalletRawData({
      txCount: 100,
      balance: BigInt(10) * BigInt(10) ** BigInt(18),
      gasSpentEth: 1.0,
    });
    const classification = makeClassification({
      dexSwapCount: 50,
      bridgeCount: 5,
      uniqueContracts: 30,
    });
    mockGetRelevantEvents.mockReturnValue([]);

    const stats = calculateStats(raw, classification, 'hunter');

    const expectedPower =
      stats.level * POWER_LEVEL_WEIGHT +
      stats.str * POWER_STR_WEIGHT +
      stats.int * POWER_INT_WEIGHT +
      stats.dex * POWER_DEX_WEIGHT +
      stats.hp * POWER_HP_WEIGHT +
      stats.mp * POWER_MP_WEIGHT +
      stats.luck * POWER_LUCK_WEIGHT +
      CLASS_POWER_BONUS['hunter'];

    expect(stats.power).toBe(expectedPower);
  });

  it('produces a higher power for higher stats', () => {
    const lowRaw = makeWalletRawData({ txCount: 1, balance: BigInt(0), gasSpentEth: 0 });
    const highRaw = makeWalletRawData({
      txCount: 10000,
      balance: BigInt(1000) * BigInt(10) ** BigInt(18),
      gasSpentEth: 50,
    });
    const lowClassification = makeClassification();
    const highClassification = makeClassification({
      dexSwapCount: 200,
      bridgeCount: 20,
      uniqueContracts: 150,
    });

    const lowStats = calculateStats(lowRaw, lowClassification, 'warrior');
    const highStats = calculateStats(highRaw, highClassification, 'warrior');

    expect(highStats.power).toBeGreaterThan(lowStats.power);
  });
});

// ---------------------------------------------------------------------------
// 9. BigInt balance conversion through calculateStats
// ---------------------------------------------------------------------------
describe('BigInt balance conversion', () => {
  it('handles large balances (100 ETH) without precision loss', () => {
    const hundredEthWei = BigInt(100) * BigInt(10) ** BigInt(18);
    const raw = makeWalletRawData({ balance: hundredEthWei });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // toBalanceEth(100e18) = Number(100e18 / 1e14) / 1e4 = Number(1e6) / 1e4 = 100.0
    // HP should be > base 100
    const expectedHP = Math.round(HP_BASE + HP_LOG_MULTIPLIER * Math.log10(101));
    expect(stats.hp).toBe(expectedHP);
  });

  it('clamps HP to HP_MAX for very large balances (10000 ETH)', () => {
    const tenKEthWei = BigInt(10000) * BigInt(10) ** BigInt(18);
    const raw = makeWalletRawData({ balance: tenKEthWei });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // toBalanceEth(10000e18) = 10000.0
    // Unclamped HP = round(100 + 250 * log10(10001)) ~= 1100 -> clamped to 900
    expect(stats.hp).toBe(HP_MAX);
  });
});

// ---------------------------------------------------------------------------
// 10. Null firstTxTimestamp edge case
// ---------------------------------------------------------------------------
describe('Null firstTxTimestamp', () => {
  it('produces walletAgeYears=0 resulting in base luck when no events exist', () => {
    const raw = makeWalletRawData({
      firstTxTimestamp: null,
      lastTxTimestamp: null,
    });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const stats = calculateStats(raw, classification);

    // walletAgeYears = 0, relevantEventCount = 0
    // rareEvents = 0, luck = round(50 + 180 * log10(1)) = 50
    expect(stats.luck).toBe(LUCK_BASE);
  });
});

// ---------------------------------------------------------------------------
// 11. Full integration with realistic inputs
// ---------------------------------------------------------------------------
describe('Full integration with realistic wallet data', () => {
  it('produces consistent stats for a moderately active wallet', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const threeYearsAgo = FIXED_NOW - 3 * MS_PER_YEAR;
    const lastMonth = FIXED_NOW - 30 * 24 * 60 * 60 * 1000;

    const raw = makeWalletRawData({
      txCount: 500,
      balance: BigInt(25) * BigInt(10) ** BigInt(18), // 25 ETH
      gasSpentEth: 2.5,
      firstTxTimestamp: threeYearsAgo,
      lastTxTimestamp: lastMonth,
    });
    const classification = makeClassification({
      nftRatio: 0.15,
      dexRatio: 0.30,
      dexSwapCount: 80,
      bridgeCount: 3,
      uniqueContracts: 45,
      contractInteractions: 120,
      stableRatio: 0.10,
      bridgeRatio: 0.02,
    });

    // Simulate some relevant crypto events
    mockGetRelevantEvents.mockReturnValue([
      'Participated in the Ritual of the Great Merge',
      'Endured the betrayal of the Exchange Kingdom',
    ]);

    const stats = calculateStats(raw, classification);

    // Level: 1 + floor(10 * log10(501)) ~= 1 + floor(26.99) = 28
    const expectedLevel = 1 + Math.floor(LEVEL_LOG_MULTIPLIER * Math.log10(1 + 500));
    expect(stats.level).toBe(expectedLevel);

    // HP: round(100 + 250 * log10(26)) ~= round(100 + 353.84) = 454
    const balanceEth = Number(BigInt(25) * BigInt(10) ** BigInt(18) / BigInt(1e14)) / 1e4;
    const expectedHP = Math.round(HP_BASE + HP_LOG_MULTIPLIER * Math.log10(1 + balanceEth));
    expect(stats.hp).toBe(expectedHP);

    // MP: round(80 + 220 * log10(3.5)) ~= round(80 + 119.62) = 200
    const expectedMP = Math.round(MP_BASE + MP_LOG_MULTIPLIER * Math.log10(1 + 2.5));
    expect(stats.mp).toBe(expectedMP);

    // STR: round(50 + 180 * log10(84)) ~= round(50 + 346.39) = 396
    const expectedSTR = Math.round(STR_BASE + STR_LOG_MULTIPLIER * Math.log10(1 + 80 + 3));
    expect(stats.str).toBe(expectedSTR);

    // INT: round(50 + 180 * log10(46)) ~= round(50 + 299.47) = 349
    const expectedINT = Math.round(INT_BASE + INT_LOG_MULTIPLIER * Math.log10(1 + 45));
    expect(stats.int).toBe(expectedINT);

    // DEX: txCount=500, walletAgeYears=3.0
    // txFrequency = 500 / max(3.0, 0.25) = 500 / 3.0 = 166.67
    // round(50 + 150 * log10(167.67)) ~= round(50 + 333.73) = 384
    const walletAgeYears = 3.0;
    const txFrequency = 500 / Math.max(walletAgeYears, DEX_FREQUENCY_FLOOR_YEARS);
    const expectedDEX = Math.round(DEX_BASE + DEX_LOG_MULTIPLIER * Math.log10(1 + txFrequency));
    expect(stats.dex).toBe(expectedDEX);

    // LUCK: walletAgeYears = 3.0, relevantEventCount = 2
    // rareEvents = 2 + 3 = 5, round(50 + 180 * log10(6)) ~= round(50 + 140.03) = 190
    const expectedLUCK = Math.round(LUCK_BASE + LUCK_LOG_MULTIPLIER * Math.log10(1 + 2 + 3));
    expect(stats.luck).toBe(expectedLUCK);

    // Power: weighted sum + default warrior bonus
    const expectedPower =
      expectedLevel * POWER_LEVEL_WEIGHT +
      expectedSTR * POWER_STR_WEIGHT +
      expectedINT * POWER_INT_WEIGHT +
      expectedDEX * POWER_DEX_WEIGHT +
      expectedHP * POWER_HP_WEIGHT +
      expectedMP * POWER_MP_WEIGHT +
      expectedLUCK * POWER_LUCK_WEIGHT +
      CLASS_POWER_BONUS['warrior'];
    expect(stats.power).toBe(expectedPower);

    // Verify all stats are positive integers
    for (const [key, value] of Object.entries(stats)) {
      expect(value, `${key} should be a positive integer`).toBeGreaterThan(0);
      expect(Number.isInteger(value), `${key} should be an integer`).toBe(true);
    }
  });

  it('handles a brand new empty wallet gracefully', () => {
    const raw = makeWalletRawData({
      txCount: 0,
      balance: BigInt(0),
      gasSpentEth: 0,
      firstTxTimestamp: null,
      lastTxTimestamp: null,
    });
    const classification = makeClassification({
      dexSwapCount: 0,
      bridgeCount: 0,
      uniqueContracts: 0,
    });
    mockGetRelevantEvents.mockReturnValue([]);

    const stats = calculateStats(raw, classification);

    expect(stats.level).toBe(LEVEL_MIN);
    expect(stats.hp).toBe(HP_BASE);
    expect(stats.mp).toBe(MP_BASE);
    expect(stats.str).toBe(STR_BASE);
    expect(stats.int).toBe(INT_BASE);
    expect(stats.luck).toBe(LUCK_BASE);

    // DEX for empty wallet: txCount=0, walletAgeYears=0
    // txFrequency = 0 / max(0, 0.25) = 0 / 0.25 = 0
    // round(50 + 150 * log10(1)) = 50
    expect(stats.dex).toBe(DEX_BASE);

    // Minimum power: 1*500 + 50*25 + 50*25 + 50*20 + 100*15 + 80*15 + 50*20 + warrior bonus
    const minPower =
      LEVEL_MIN * POWER_LEVEL_WEIGHT +
      STR_BASE * POWER_STR_WEIGHT +
      INT_BASE * POWER_INT_WEIGHT +
      DEX_BASE * POWER_DEX_WEIGHT +
      HP_BASE * POWER_HP_WEIGHT +
      MP_BASE * POWER_MP_WEIGHT +
      LUCK_BASE * POWER_LUCK_WEIGHT +
      CLASS_POWER_BONUS['warrior'];
    expect(stats.power).toBe(minPower);
  });
});

// ---------------------------------------------------------------------------
// 12. Class power bonus
// ---------------------------------------------------------------------------
describe('Class power bonus', () => {
  it('applies elder_wizard bonus (5000 vs hunter 2000 = +3000)', () => {
    const raw = makeWalletRawData({ txCount: 10 });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const withBonus = calculateStats(raw, classification, 'elder_wizard');
    const withoutBonus = calculateStats(raw, classification, 'hunter');

    expect(withBonus.power - withoutBonus.power).toBe(
      CLASS_POWER_BONUS['elder_wizard'] - CLASS_POWER_BONUS['hunter']
    );
    expect(withBonus.power - withoutBonus.power).toBe(3000);
  });

  it('applies guardian bonus (4000 vs hunter 2000 = +2000)', () => {
    const raw = makeWalletRawData({ txCount: 10 });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const guardian = calculateStats(raw, classification, 'guardian');
    const hunter = calculateStats(raw, classification, 'hunter');

    expect(guardian.power - hunter.power).toBe(2000);
  });

  it('applies warrior bonus (1500 vs hunter 2000 = -500)', () => {
    const raw = makeWalletRawData({ txCount: 10 });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const warrior = calculateStats(raw, classification, 'warrior');
    const hunter = calculateStats(raw, classification, 'hunter');

    expect(warrior.power - hunter.power).toBe(-500);
  });

  it('applies summoner bonus (1500 vs hunter 2000 = -500)', () => {
    const raw = makeWalletRawData({ txCount: 10 });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const summoner = calculateStats(raw, classification, 'summoner');
    const hunter = calculateStats(raw, classification, 'hunter');

    expect(summoner.power - hunter.power).toBe(-500);
  });

  it('does not change non-power stats when classId differs', () => {
    const raw = makeWalletRawData({ txCount: 100 });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue([]);

    const elderWizard = calculateStats(raw, classification, 'elder_wizard');
    const hunter = calculateStats(raw, classification, 'hunter');

    expect(elderWizard.level).toBe(hunter.level);
    expect(elderWizard.hp).toBe(hunter.hp);
    expect(elderWizard.mp).toBe(hunter.mp);
    expect(elderWizard.str).toBe(hunter.str);
    expect(elderWizard.int).toBe(hunter.int);
    expect(elderWizard.dex).toBe(hunter.dex);
    expect(elderWizard.luck).toBe(hunter.luck);
  });
});

// ---------------------------------------------------------------------------
// 13. Stat clamping — extreme values never exceed max
// ---------------------------------------------------------------------------
describe('Stat clamping at max values', () => {
  it('clamps INT to INT_MAX for whale-level uniqueContracts', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ uniqueContracts: 5000 });

    const stats = calculateStats(raw, classification);

    // Unclamped: round(50 + 180 * log10(5001)) ~= 716 -> clamped to 500
    expect(stats.int).toBe(INT_MAX);
  });

  it('clamps DEX to DEX_MAX for extreme tx frequency', () => {
    const raw = makeWalletRawData({ txCount: 50000, firstTxTimestamp: null });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // txFrequency = 50000 / 0.25 = 200000
    // Unclamped: round(50 + 150 * log10(200001)) ~= 846 -> clamped to 550
    expect(stats.dex).toBe(DEX_MAX);
  });

  it('clamps STR to STR_MAX for extreme swap+bridge counts', () => {
    const raw = makeWalletRawData();
    const classification = makeClassification({ dexSwapCount: 5000, bridgeCount: 500 });

    const stats = calculateStats(raw, classification);

    // Unclamped: round(50 + 180 * log10(5501)) ~= 723 -> clamped to 550
    expect(stats.str).toBe(STR_MAX);
  });

  it('clamps MP to MP_MAX for extreme gas spending', () => {
    const raw = makeWalletRawData({ gasSpentEth: 100000 });
    const classification = makeClassification();

    const stats = calculateStats(raw, classification);

    // Unclamped: round(80 + 220 * log10(100001)) ~= 1180 -> clamped to 600
    expect(stats.mp).toBe(MP_MAX);
  });

  it('clamps LUCK to LUCK_MAX for extreme event counts', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const twentyYearsAgo = FIXED_NOW - 20 * MS_PER_YEAR;
    const raw = makeWalletRawData({
      firstTxTimestamp: twentyYearsAgo,
      lastTxTimestamp: FIXED_NOW,
    });
    const classification = makeClassification();
    mockGetRelevantEvents.mockReturnValue(Array.from({ length: 50 }, (_, i) => `event${i}`));

    const stats = calculateStats(raw, classification);

    // rareEvents = 50 + 20 = 70
    // Unclamped: round(50 + 180 * log10(71)) ~= 383 -> clamped to 300
    expect(stats.luck).toBe(LUCK_MAX);
  });

  it('no stat exceeds its max in a vitalik-scale wallet', () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

    const tenYearsAgo = FIXED_NOW - 10 * MS_PER_YEAR;
    const raw = makeWalletRawData({
      txCount: 10000,
      balance: BigInt(50000) * BigInt(10) ** BigInt(18),
      gasSpentEth: 500,
      firstTxTimestamp: tenYearsAgo,
      lastTxTimestamp: FIXED_NOW,
    });
    const classification = makeClassification({
      dexSwapCount: 2000,
      bridgeCount: 200,
      uniqueContracts: 3000,
    });
    mockGetRelevantEvents.mockReturnValue(Array.from({ length: 30 }, (_, i) => `event${i}`));

    const stats = calculateStats(raw, classification);

    expect(stats.hp).toBeLessThanOrEqual(HP_MAX);
    expect(stats.mp).toBeLessThanOrEqual(MP_MAX);
    expect(stats.str).toBeLessThanOrEqual(STR_MAX);
    expect(stats.int).toBeLessThanOrEqual(INT_MAX);
    expect(stats.dex).toBeLessThanOrEqual(DEX_MAX);
    expect(stats.luck).toBeLessThanOrEqual(LUCK_MAX);
    expect(stats.level).toBeLessThanOrEqual(LEVEL_MAX);
  });
});
