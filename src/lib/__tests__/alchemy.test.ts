import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockResolveName = vi.fn();
const mockLookupAddress = vi.fn();
const mockGetBalance = vi.fn();
const mockGetTransactionCount = vi.fn();
const mockGetAssetTransfers = vi.fn();

vi.mock('alchemy-sdk', () => {
  // Must use function expression (not arrow) so it can be called with `new`
  const AlchemyMock = vi.fn(function (this: Record<string, unknown>) {
    this.core = {
      resolveName: mockResolveName,
      lookupAddress: mockLookupAddress,
      getBalance: mockGetBalance,
      getTransactionCount: mockGetTransactionCount,
      getAssetTransfers: mockGetAssetTransfers,
    };
  });
  return {
    Alchemy: AlchemyMock,
    Network: { ETH_MAINNET: 'eth-mainnet' },
    AssetTransfersCategory: {
      EXTERNAL: 'external',
      ERC20: 'erc20',
      ERC721: 'erc721',
      ERC1155: 'erc1155',
    },
    SortingOrder: { ASCENDING: 'asc', DESCENDING: 'desc' },
  };
});

const VALID_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const VALID_ADDRESS_MIXED = '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const RESOLVED_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';

function makeAlchemyTransfer(overrides?: Record<string, unknown>) {
  return {
    from: VALID_ADDRESS,
    to: '0x1234567890abcdef1234567890abcdef12345678',
    category: 'external',
    value: 1.0,
    asset: 'ETH',
    metadata: { blockTimestamp: '2023-06-15T10:00:00Z' },
    rawContract: { address: null },
    ...overrides,
  };
}

describe('alchemy', () => {
  const originalEnv = process.env.ALCHEMY_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALCHEMY_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.resetModules();
    if (originalEnv !== undefined) {
      process.env.ALCHEMY_API_KEY = originalEnv;
    } else {
      delete process.env.ALCHEMY_API_KEY;
    }
  });

  async function freshModule() {
    return await import('@/lib/alchemy');
  }

  // ─── resolveAddress tests ───

  it('resolveAddress: returns lowercase address for valid hex input', async () => {
    const { resolveAddress } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);

    const result = await resolveAddress(VALID_ADDRESS);

    expect(result.address).toBe(VALID_ADDRESS);
    expect(result.ensName).toBeUndefined();
  });

  it('resolveAddress: normalizes mixed-case address to lowercase', async () => {
    const { resolveAddress } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);

    const result = await resolveAddress(VALID_ADDRESS_MIXED);

    expect(result.address).toBe(VALID_ADDRESS_MIXED.toLowerCase());
  });

  it('resolveAddress: resolves ENS name to address and returns ensName', async () => {
    const { resolveAddress } = await freshModule();
    mockResolveName.mockResolvedValue(RESOLVED_ADDRESS);

    const result = await resolveAddress('vitalik.eth');

    expect(result.address).toBe(RESOLVED_ADDRESS.toLowerCase());
    expect(result.ensName).toBe('vitalik.eth');
    expect(mockResolveName).toHaveBeenCalledWith('vitalik.eth');
  });

  it('resolveAddress: throws when ENS name cannot be resolved', async () => {
    const { resolveAddress } = await freshModule();
    mockResolveName.mockResolvedValue(null);

    await expect(resolveAddress('nonexistent.eth')).rejects.toThrow(
      'ENS name "nonexistent.eth" could not be resolved to an address',
    );
  });

  it('resolveAddress: throws for invalid address format', async () => {
    const { resolveAddress } = await freshModule();

    await expect(resolveAddress('0xinvalid')).rejects.toThrow(
      'Invalid Ethereum address: "0xinvalid"',
    );
  });

  it('resolveAddress: includes ensName when reverse lookup succeeds', async () => {
    const { resolveAddress } = await freshModule();
    mockLookupAddress.mockResolvedValue('vitalik.eth');

    const result = await resolveAddress(VALID_ADDRESS);

    expect(result.address).toBe(VALID_ADDRESS);
    expect(result.ensName).toBe('vitalik.eth');
  });

  it('resolveAddress: returns address without ensName when reverse lookup fails', async () => {
    const { resolveAddress } = await freshModule();
    mockLookupAddress.mockRejectedValue(new Error('lookup failed'));

    const result = await resolveAddress(VALID_ADDRESS);

    expect(result.address).toBe(VALID_ADDRESS);
    expect(result.ensName).toBeUndefined();
  });

  // ─── fetchWalletData tests ───

  it('fetchWalletData: returns complete WalletRawData with all fields', async () => {
    const { fetchWalletData } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);
    mockGetBalance.mockResolvedValue({ toString: () => '1000000000000000000' });
    mockGetTransactionCount.mockResolvedValue(50);
    mockGetAssetTransfers.mockResolvedValue({ transfers: [] });

    const result = await fetchWalletData(VALID_ADDRESS);

    expect(result).toHaveProperty('address', VALID_ADDRESS);
    expect(result).toHaveProperty('balance');
    expect(result).toHaveProperty('txCount', 50);
    expect(result).toHaveProperty('transfers');
    expect(result).toHaveProperty('firstTxTimestamp');
    expect(result).toHaveProperty('lastTxTimestamp');
    expect(result).toHaveProperty('gasSpentEth');
    expect(typeof result.gasSpentEth).toBe('number');
  });

  it('fetchWalletData: merges from-transfers and to-transfers', async () => {
    const { fetchWalletData } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);
    mockGetBalance.mockResolvedValue({ toString: () => '0' });
    mockGetTransactionCount.mockResolvedValue(10);

    const fromTransfer = makeAlchemyTransfer({ from: VALID_ADDRESS, to: '0x' + 'a'.repeat(40) });
    const toTransfer = makeAlchemyTransfer({ from: '0x' + 'b'.repeat(40), to: VALID_ADDRESS });

    mockGetAssetTransfers
      .mockResolvedValueOnce({ transfers: [fromTransfer] })
      .mockResolvedValueOnce({ transfers: [toTransfer] });

    const result = await fetchWalletData(VALID_ADDRESS);

    expect(result.transfers).toHaveLength(2);
  });

  it('fetchWalletData: extracts first and last timestamps from transfers', async () => {
    const { fetchWalletData } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);
    mockGetBalance.mockResolvedValue({ toString: () => '0' });
    mockGetTransactionCount.mockResolvedValue(5);

    const earlyTransfer = makeAlchemyTransfer({
      metadata: { blockTimestamp: '2020-01-01T00:00:00Z' },
    });
    const lateTransfer = makeAlchemyTransfer({
      metadata: { blockTimestamp: '2024-06-15T12:00:00Z' },
    });

    mockGetAssetTransfers
      .mockResolvedValueOnce({ transfers: [earlyTransfer, lateTransfer] })
      .mockResolvedValueOnce({ transfers: [] });

    const result = await fetchWalletData(VALID_ADDRESS);

    expect(result.firstTxTimestamp).toBe(new Date('2020-01-01T00:00:00Z').getTime());
    expect(result.lastTxTimestamp).toBe(new Date('2024-06-15T12:00:00Z').getTime());
  });

  it('fetchWalletData: returns null timestamps when there are no transfers', async () => {
    const { fetchWalletData } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);
    mockGetBalance.mockResolvedValue({ toString: () => '0' });
    mockGetTransactionCount.mockResolvedValue(0);
    mockGetAssetTransfers.mockResolvedValue({ transfers: [] });

    const result = await fetchWalletData(VALID_ADDRESS);

    expect(result.firstTxTimestamp).toBeNull();
    expect(result.lastTxTimestamp).toBeNull();
  });

  it('fetchWalletData: converts balance to BigInt correctly', async () => {
    const { fetchWalletData } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);
    mockGetBalance.mockResolvedValue({ toString: () => '2500000000000000000' });
    mockGetTransactionCount.mockResolvedValue(10);
    mockGetAssetTransfers.mockResolvedValue({ transfers: [] });

    const result = await fetchWalletData(VALID_ADDRESS);

    expect(typeof result.balance).toBe('bigint');
    expect(result.balance).toBe(BigInt('2500000000000000000'));
  });

  it('fetchWalletData: throws when ALCHEMY_API_KEY is missing', async () => {
    delete process.env.ALCHEMY_API_KEY;
    const { fetchWalletData } = await freshModule();

    await expect(fetchWalletData(VALID_ADDRESS)).rejects.toThrow(
      'ALCHEMY_API_KEY environment variable is not configured',
    );
  });

  // ─── Input validation edge cases ───

  it('resolveAddress: trims whitespace from input', async () => {
    const { resolveAddress } = await freshModule();
    mockLookupAddress.mockResolvedValue(null);

    const paddedAddress = `  ${VALID_ADDRESS}  `;
    const result = await resolveAddress(paddedAddress);

    expect(result.address).toBe(VALID_ADDRESS);
  });

  it('resolveAddress: throws for empty string input', async () => {
    const { resolveAddress } = await freshModule();

    await expect(resolveAddress('')).rejects.toThrow('Invalid Ethereum address');
  });
});
