import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeWalletRawData, makeClassification, makeGenerateResponse } from '@/lib/__tests__/fixtures';

// Mock all dependencies
vi.mock('@/lib/alchemy', () => ({
  fetchWalletData: vi.fn(),
}));

vi.mock('@/lib/lore', () => ({
  generateLore: vi.fn(),
  generateLongLore: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/classifier', () => ({
  classifyTransactions: vi.fn(),
}));

vi.mock('@/lib/stats', () => ({
  calculateStats: vi.fn(),
}));

vi.mock('@/lib/class', () => ({
  determineClass: vi.fn(),
}));

vi.mock('@/lib/crypto-events', () => ({
  getRelevantEvents: vi.fn(() => []),
  describeActivityPattern: vi.fn(() => 'General transaction activity'),
  formatWalletAge: vi.fn(() => 'New'),
}));

import { fetchWalletData } from '@/lib/alchemy';
import { generateLore, generateLongLore } from '@/lib/lore';
import { getCached, setCache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { classifyTransactions } from '@/lib/classifier';
import { calculateStats } from '@/lib/stats';
import { determineClass } from '@/lib/class';

const mockFetchWalletData = vi.mocked(fetchWalletData);
const mockGenerateLore = vi.mocked(generateLore);
const mockGenerateLongLore = vi.mocked(generateLongLore);
const mockGetCached = vi.mocked(getCached);
const mockSetCache = vi.mocked(setCache);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockClassifyTransactions = vi.mocked(classifyTransactions);
const mockCalculateStats = vi.mocked(calculateStats);
const mockDetermineClass = vi.mocked(determineClass);

function createRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function setupSuccessfulMocks() {
  const walletData = makeWalletRawData({
    txCount: 100,
    transfers: [],
    firstTxTimestamp: null,
    lastTxTimestamp: null,
  });
  const classification = makeClassification();
  const stats = {
    level: 21,
    hp: 350,
    mp: 200,
    str: 150,
    int: 180,
    dex: 300,
    luck: 100,
    power: 35400,
  };
  const classResult = { id: 'warrior' as const, name: 'Warrior', nameEn: 'Warrior' };

  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
  mockGetCached.mockResolvedValue(null);
  mockFetchWalletData.mockResolvedValue(walletData);
  mockClassifyTransactions.mockReturnValue(classification);
  mockCalculateStats.mockReturnValue(stats);
  mockDetermineClass.mockReturnValue(classResult);
  mockGenerateLore.mockResolvedValue('A legendary warrior has appeared.');
  mockGenerateLongLore.mockResolvedValue('No special magic, no legendary weapons.');

  return { walletData, classification, stats, classResult };
}

describe('POST /api/generate', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/app/api/generate/route');
    POST = mod.POST as unknown as (request: Request) => Promise<Response>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with character data on successful generation', async () => {
    setupSuccessfulMocks();

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.address).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.class).toBeDefined();
    expect(data.lore).toBeDefined();
    expect(data.cached).toBe(false);
  });

  it('returns cached response when cache hit', async () => {
    const cached = makeGenerateResponse({ cached: true });
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(cached);

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(mockFetchWalletData).not.toHaveBeenCalled();
  });

  it('caches successful responses', async () => {
    setupSuccessfulMocks();

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    await POST(request);

    expect(mockSetCache).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error.code).toBe('RATE_LIMITED');
  });

  it('returns 400 when address is missing', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });

    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ADDRESS');
  });

  it('returns 400 when address is empty string', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });

    const request = createRequest({ address: '' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ADDRESS');
  });

  it('returns 400 when address format is invalid', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(null);

    const request = createRequest({ address: 'not-an-address' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ADDRESS');
  });

  it('returns 400 when body is not valid JSON', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'not json',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ADDRESS');
  });

  it('returns 400 when wallet has no transactions', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(null);
    mockFetchWalletData.mockResolvedValue(
      makeWalletRawData({ txCount: 0, transfers: [] }),
    );

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('NO_TRANSACTIONS');
  });

  it('returns 500 when fetchWalletData throws', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(null);
    mockFetchWalletData.mockRejectedValue(new Error('Alchemy API down'));

    const request = createRequest({ address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('API_ERROR');
  });

  it('returns 400 when fetchWalletData throws ENS resolution error', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(null);
    mockFetchWalletData.mockRejectedValue(new Error('ENS name "bad.eth" could not be resolved'));

    const request = createRequest({ address: 'vitalik.eth' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ADDRESS');
  });

  it('accepts ENS names as valid input', async () => {
    setupSuccessfulMocks();

    const request = createRequest({ address: 'vitalik.eth' });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
