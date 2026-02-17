// Alchemy SDK integration for fetching on-chain wallet data from ETH Mainnet
import {
  Alchemy,
  AssetTransfersCategory,
  Network,
  SortingOrder,
} from 'alchemy-sdk';
import type {
  AssetTransfersWithMetadataResult,
} from 'alchemy-sdk';

import type { AssetTransferItem, WalletRawData } from '@/lib/types';

const MAX_TRANSFER_COUNT = 1000 as const;

const GAS_COST_BY_CATEGORY: Record<AssetTransferItem['category'], number> = {
  external: 0.0005,
  erc20: 0.003,
  erc721: 0.006,
  erc1155: 0.005,
} as const;

const GAS_COST_FALLBACK = 0.002 as const;

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_SUFFIX = '.eth';

const TRANSFER_CATEGORIES = [
  AssetTransfersCategory.EXTERNAL,
  AssetTransfersCategory.ERC20,
  AssetTransfersCategory.ERC721,
  AssetTransfersCategory.ERC1155,
] as const;

let alchemyInstance: Alchemy | null = null;

function getAlchemy(): Alchemy {
  if (alchemyInstance) {
    return alchemyInstance;
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is not configured');
  }

  alchemyInstance = new Alchemy({
    apiKey,
    network: Network.ETH_MAINNET,
  });
  return alchemyInstance;
}

function isValidEthAddress(address: string): boolean {
  return ETH_ADDRESS_REGEX.test(address);
}

function isEnsName(input: string): boolean {
  return input.endsWith(ENS_SUFFIX);
}

/**
 * Resolves an ENS name to its underlying address, or validates and returns
 * a hex address as-is.
 */
export async function resolveAddress(
  input: string,
): Promise<{ address: string; ensName?: string }> {
  const trimmed = input.trim().toLowerCase();
  const alchemy = getAlchemy();

  if (isEnsName(trimmed)) {
    const resolved = await alchemy.core.resolveName(trimmed);
    if (!resolved) {
      throw new Error(`ENS name "${trimmed}" could not be resolved to an address`);
    }
    return { address: resolved.toLowerCase(), ensName: trimmed };
  }

  if (!isValidEthAddress(trimmed)) {
    throw new Error(`Invalid Ethereum address: "${trimmed}"`);
  }

  const ensName = await alchemy.core.lookupAddress(trimmed).catch(() => null);

  return {
    address: trimmed,
    ...(ensName ? { ensName } : {}),
  };
}

function mapTransferToItem(
  transfer: AssetTransfersWithMetadataResult,
): AssetTransferItem {
  return {
    from: transfer.from ?? null,
    to: transfer.to ?? null,
    category: transfer.category as AssetTransferItem['category'],
    value: transfer.value ?? null,
    asset: transfer.asset ?? null,
    blockTimestamp: transfer.metadata.blockTimestamp,
    contractAddress: transfer.rawContract.address ?? null,
  };
}

async function fetchTransfers(
  alchemy: Alchemy,
  address: string,
  direction: 'from' | 'to',
): Promise<readonly AssetTransferItem[]> {
  const params = {
    ...(direction === 'from'
      ? { fromAddress: address }
      : { toAddress: address }),
    category: [...TRANSFER_CATEGORIES],
    withMetadata: true as const,
    maxCount: MAX_TRANSFER_COUNT,
    order: SortingOrder.ASCENDING,
  };

  const response = await alchemy.core.getAssetTransfers(params);

  return response.transfers.map(mapTransferToItem);
}

function extractTimestamps(
  transfers: readonly AssetTransferItem[],
): { firstTxTimestamp: number | null; lastTxTimestamp: number | null } {
  if (transfers.length === 0) {
    return { firstTxTimestamp: null, lastTxTimestamp: null };
  }

  let earliest = Infinity;
  let latest = -Infinity;

  for (const transfer of transfers) {
    if (transfer.blockTimestamp) {
      const ts = new Date(transfer.blockTimestamp).getTime();
      if (ts < earliest) {
        earliest = ts;
      }
      if (ts > latest) {
        latest = ts;
      }
    }
  }

  return {
    firstTxTimestamp: earliest === Infinity ? null : earliest,
    lastTxTimestamp: latest === -Infinity ? null : latest,
  };
}

function estimateGasSpent(
  fromTransfers: readonly AssetTransferItem[],
  txCount: number,
): number {
  let gasFromTransfers = 0;
  for (const transfer of fromTransfers) {
    gasFromTransfers += GAS_COST_BY_CATEGORY[transfer.category];
  }

  const uncoveredTxCount = Math.max(0, txCount - fromTransfers.length);
  const gasFromUncovered = uncoveredTxCount * GAS_COST_FALLBACK;

  return gasFromTransfers + gasFromUncovered;
}

/**
 * Fetches all on-chain data for a given wallet address and returns
 * a structured WalletRawData object.
 */
export async function fetchWalletData(
  addressInput: string,
): Promise<WalletRawData> {
  const { address, ensName } = await resolveAddress(addressInput);
  const alchemy = getAlchemy();

  const [balanceResult, txCount, fromTransfers, toTransfers] = await Promise.all([
    alchemy.core.getBalance(address),
    alchemy.core.getTransactionCount(address),
    fetchTransfers(alchemy, address, 'from'),
    fetchTransfers(alchemy, address, 'to'),
  ]);

  const allTransfers = [...fromTransfers, ...toTransfers];
  const gasSpentEth = estimateGasSpent(fromTransfers, txCount);
  const { firstTxTimestamp, lastTxTimestamp } = extractTimestamps(allTransfers);

  const balanceWei = BigInt(balanceResult.toString());

  return {
    address,
    balance: balanceWei,
    txCount,
    transfers: allTransfers,
    firstTxTimestamp,
    lastTxTimestamp,
    gasSpentEth,
    ...(ensName ? { ensName } : {}),
  };
}
