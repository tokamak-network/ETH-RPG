// Transaction classification engine: maps on-chain transfers to RPG-relevant protocol categories

import type { AssetTransferItem, TxClassification } from '@/lib/types';

type ProtocolType = 'DEX' | 'NFT' | 'BRIDGE' | 'STABLE';

const PROTOCOL_MAP: Record<string, ProtocolType> = {
  // DEX
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'DEX',    // Uniswap V2 Router
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'DEX',    // Uniswap V3 Router
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'DEX',    // SushiSwap Router
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': 'DEX',    // 0x Exchange
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': 'DEX',    // Uniswap Universal Router

  // NFT
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': 'NFT',    // Seaport
  '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': 'NFT',    // OpenSea Legacy
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a': 'NFT',    // LooksRare
  '0x00000000000001ad428e4906ae43d8f9852d0dd6': 'NFT',    // Blur

  // BRIDGE
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'BRIDGE', // Optimism Bridge
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': 'BRIDGE', // Wormhole
  '0x8eb8a3b98659cce290402893d0123abb75e3ab28': 'BRIDGE', // Avalanche Bridge
  '0xabea9132b05a70803a4e85094fd0e1800777fbef': 'BRIDGE', // zkSync Bridge

  // STABLE
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'STABLE', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'STABLE', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'STABLE', // DAI
} as const;

function getProtocolType(address: string | null): ProtocolType | null {
  if (address === null) {
    return null;
  }
  return PROTOCOL_MAP[address.toLowerCase()] ?? null;
}

function isNftCategory(category: AssetTransferItem['category']): boolean {
  return category === 'erc721' || category === 'erc1155';
}

export function classifyTransactions(
  transfers: readonly AssetTransferItem[]
): TxClassification {
  let nftCount = 0;
  let dexCount = 0;
  let bridgeCount = 0;
  let stableCount = 0;
  let contractInteractions = 0;

  const uniqueContractSet = new Set<string>();

  for (const transfer of transfers) {
    const toProtocol = getProtocolType(transfer.to);
    const fromProtocol = getProtocolType(transfer.from);
    const matchedProtocol = toProtocol ?? fromProtocol;

    if (transfer.to !== null) {
      uniqueContractSet.add(transfer.to.toLowerCase());
    }
    if (transfer.from !== null) {
      uniqueContractSet.add(transfer.from.toLowerCase());
    }

    if (transfer.category !== 'external') {
      contractInteractions += 1;
    }

    if (isNftCategory(transfer.category) || matchedProtocol === 'NFT') {
      nftCount += 1;
    } else if (matchedProtocol === 'DEX') {
      dexCount += 1;
    } else if (matchedProtocol === 'BRIDGE') {
      bridgeCount += 1;
    } else if (matchedProtocol === 'STABLE') {
      stableCount += 1;
    }
  }

  const total = transfers.length;
  const safeTotal = total === 0 ? 1 : total;

  return {
    nftRatio: nftCount / safeTotal,
    dexRatio: dexCount / safeTotal,
    bridgeCount,
    bridgeRatio: bridgeCount / safeTotal,
    stableRatio: stableCount / safeTotal,
    contractInteractions,
    uniqueContracts: uniqueContractSet.size,
    dexSwapCount: dexCount,
  };
}
