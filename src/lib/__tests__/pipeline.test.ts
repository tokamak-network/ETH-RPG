import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WalletRawData, TxClassification, ClassResult, CharacterStats, GenerateResponse } from '@/lib/types';

// --- Mocks ---
const mockFetchWalletData = vi.fn();
const mockClassifyTransactions = vi.fn();
const mockDetermineClass = vi.fn();
const mockCalculateStats = vi.fn();
const mockGenerateLore = vi.fn();
const mockGenerateLongLore = vi.fn();
const mockGenerateFallbackLore = vi.fn();
const mockGenerateLongFallbackLore = vi.fn();
const mockGetCached = vi.fn();
const mockSetCache = vi.fn();
const mockGetRelevantEvents = vi.fn();
const mockDescribeActivityPattern = vi.fn();
const mockFormatWalletAge = vi.fn();

vi.mock('@/lib/alchemy', () => ({
  fetchWalletData: (...args: unknown[]) => mockFetchWalletData(...args),
}));
vi.mock('@/lib/classifier', () => ({
  classifyTransactions: (...args: unknown[]) => mockClassifyTransactions(...args),
}));
vi.mock('@/lib/class', () => ({
  determineClass: (...args: unknown[]) => mockDetermineClass(...args),
}));
vi.mock('@/lib/stats', () => ({
  calculateStats: (...args: unknown[]) => mockCalculateStats(...args),
}));
vi.mock('@/lib/lore', () => ({
  generateLore: (...args: unknown[]) => mockGenerateLore(...args),
  generateLongLore: (...args: unknown[]) => mockGenerateLongLore(...args),
  generateFallbackLore: (...args: unknown[]) => mockGenerateFallbackLore(...args),
  generateLongFallbackLore: (...args: unknown[]) => mockGenerateLongFallbackLore(...args),
}));
vi.mock('@/lib/cache', () => ({
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCache: (...args: unknown[]) => mockSetCache(...args),
}));
vi.mock('@/lib/crypto-events', () => ({
  getRelevantEvents: (...args: unknown[]) => mockGetRelevantEvents(...args),
  describeActivityPattern: (...args: unknown[]) => mockDescribeActivityPattern(...args),
  formatWalletAge: (...args: unknown[]) => mockFormatWalletAge(...args),
}));

// Import after mocks
import { generateCharacterData, EmptyWalletError } from '@/lib/pipeline';

const TEST_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

const MOCK_RAW_DATA: WalletRawData = {
  address: TEST_ADDRESS,
  balance: BigInt('1000000000000000000'),
  txCount: 50,
  transfers: [
    { from: TEST_ADDRESS, to: '0xabc', category: 'external', value: 1, asset: 'ETH', blockTimestamp: '2023-01-01T00:00:00Z', contractAddress: null },
  ],
  firstTxTimestamp: new Date('2022-01-01').getTime(),
  lastTxTimestamp: new Date('2024-01-01').getTime(),
  gasSpentEth: 0.5,
};

const MOCK_CLASSIFICATION: TxClassification = {
  nftRatio: 0.1,
  dexRatio: 0.2,
  bridgeCount: 2,
  bridgeRatio: 0.05,
  stableRatio: 0.1,
  contractInteractions: 30,
  uniqueContracts: 15,
  dexSwapCount: 10,
};

const MOCK_CLASS: ClassResult = { id: 'warrior', name: 'Warrior', nameEn: 'Warrior' };

const MOCK_STATS: CharacterStats = {
  level: 18,
  hp: 200,
  mp: 120,
  str: 90,
  int: 80,
  luck: 70,
  power: 30000,
};

function setupDefaultMocks(): void {
  mockFetchWalletData.mockResolvedValue(MOCK_RAW_DATA);
  mockClassifyTransactions.mockReturnValue(MOCK_CLASSIFICATION);
  mockDetermineClass.mockReturnValue(MOCK_CLASS);
  mockCalculateStats.mockReturnValue(MOCK_STATS);
  mockGenerateLore.mockResolvedValue('The warrior\'s lore');
  mockGenerateLongLore.mockResolvedValue('The long warrior\'s lore.');
  mockGenerateFallbackLore.mockReturnValue('Fallback lore');
  mockGenerateLongFallbackLore.mockReturnValue('Long fallback lore');
  mockGetCached.mockReturnValue(null);
  mockGetRelevantEvents.mockReturnValue(['Participated in the Ritual of the Great Merge']);
  mockDescribeActivityPattern.mockReturnValue('General transaction activity');
  mockFormatWalletAge.mockReturnValue('2 years');
}

describe('generateCharacterData', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ethrpg.com';
    setupDefaultMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns cached data when cache hits', async () => {
    const cachedResponse: GenerateResponse = {
      address: TEST_ADDRESS,
      stats: MOCK_STATS,
      class: MOCK_CLASS,
      lore: 'Cached lore',
      longLore: 'Cached long lore',
      cardImageUrl: `https://ethrpg.com/api/card/${TEST_ADDRESS}`,
      ogImageUrl: `https://ethrpg.com/api/og/${TEST_ADDRESS}`,
      cached: false,
    };
    mockGetCached.mockReturnValue(cachedResponse);

    const result = await generateCharacterData(TEST_ADDRESS);

    expect(result.cached).toBe(true);
    expect(result.lore).toBe('Cached lore');
    expect(mockFetchWalletData).not.toHaveBeenCalled();
  });

  it('generates full data with AI lore on cache miss', async () => {
    const result = await generateCharacterData(TEST_ADDRESS);

    expect(result.address).toBe(TEST_ADDRESS);
    expect(result.stats).toEqual(MOCK_STATS);
    expect(result.class).toEqual(MOCK_CLASS);
    expect(result.lore).toBe('The warrior\'s lore');
    expect(result.longLore).toBe('The long warrior\'s lore.');
    expect(result.cached).toBe(false);
    expect(mockGenerateLore).toHaveBeenCalledOnce();
    expect(mockGenerateLongLore).toHaveBeenCalledOnce();
    expect(mockSetCache).toHaveBeenCalledWith(TEST_ADDRESS, result);
  });

  it('uses fallback lore when skipAiLore is true', async () => {
    const result = await generateCharacterData(TEST_ADDRESS, { skipAiLore: true });

    expect(result.lore).toBe('Fallback lore');
    expect(result.longLore).toBe('Long fallback lore');
    expect(mockGenerateLore).not.toHaveBeenCalled();
    expect(mockGenerateLongLore).not.toHaveBeenCalled();
    expect(mockGenerateFallbackLore).toHaveBeenCalledOnce();
    expect(mockGenerateLongFallbackLore).toHaveBeenCalledOnce();
  });

  it('throws EmptyWalletError when wallet has no transactions', async () => {
    mockFetchWalletData.mockResolvedValue({
      ...MOCK_RAW_DATA,
      txCount: 0,
      transfers: [],
    });

    await expect(generateCharacterData(TEST_ADDRESS))
      .rejects
      .toThrow(EmptyWalletError);
  });

  it('caches under ENS name when available', async () => {
    mockFetchWalletData.mockResolvedValue({
      ...MOCK_RAW_DATA,
      ensName: 'vitalik.eth',
    });

    await generateCharacterData(TEST_ADDRESS);

    expect(mockSetCache).toHaveBeenCalledTimes(2);
    expect(mockSetCache).toHaveBeenCalledWith('vitalik.eth', expect.any(Object));
  });

  it('includes ENS name in response when available', async () => {
    mockFetchWalletData.mockResolvedValue({
      ...MOCK_RAW_DATA,
      ensName: 'vitalik.eth',
    });

    const result = await generateCharacterData(TEST_ADDRESS);

    expect(result.ensName).toBe('vitalik.eth');
  });

  it('builds correct image URLs from NEXT_PUBLIC_SITE_URL', async () => {
    const result = await generateCharacterData(TEST_ADDRESS);

    expect(result.cardImageUrl).toBe(`https://ethrpg.com/api/card/${TEST_ADDRESS}`);
    expect(result.ogImageUrl).toBe(`https://ethrpg.com/api/og/${TEST_ADDRESS}`);
  });
});

describe('EmptyWalletError', () => {
  it('has correct name and message', () => {
    const error = new EmptyWalletError('0xabc');
    expect(error.name).toBe('EmptyWalletError');
    expect(error.message).toBe('Wallet 0xabc has no transactions');
    expect(error).toBeInstanceOf(Error);
  });
});
