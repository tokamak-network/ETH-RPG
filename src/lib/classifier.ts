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
  '0xd51a44d3fae010294c616388b506acda1bfaae46': 'DEX',    // Curve Tricrypto
  '0xba12222222228d8ba445958a75a0704d566bf2c8': 'DEX',    // Balancer V2 Vault
  '0x1111111254eeb25477b68fb85ed929f73a960582': 'DEX',    // 1inch V5
  '0x111111125421ca6dc452d289314280a0f8842a65': 'DEX',    // 1inch V6
  '0xdef171fe48cf0115b1d80b88dc8eab59176fee57': 'DEX',    // Paraswap V5
  '0x9008d19f58aabd9ed0d60971565aa8510560ab41': 'DEX',    // CoW Protocol
  '0xe66b31678d6c16e9ebf358268a790b763c133750': 'DEX',    // 0x V2

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
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98': 'BRIDGE', // Stargate Router
  '0xb8901acb165ed027e32754e0ffe830802919727f': 'BRIDGE', // Hop Protocol
  '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': 'BRIDGE', // Across V2
  '0x2796317b0ff8538f253012862c06787adfb8ceb6': 'BRIDGE', // Synapse
  '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': 'BRIDGE', // Arbitrum Gateway
  '0x49048044d57e1c92a77f79988d21fa8faf36f97b': 'BRIDGE', // Base Bridge

  // STABLE
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'STABLE', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'STABLE', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'STABLE', // DAI
  '0x853d955acef822db058eb8505911ed77f175b99e': 'STABLE', // FRAX
  '0x5f98805a4e8be255a32880fdec7f6728c6568ba0': 'STABLE', // LUSD
  '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e': 'STABLE', // crvUSD
  '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f': 'STABLE', // GHO
  '0x6c3ea9036406852006290770bedfcaba0e23a0e8': 'STABLE', // PYUSD
} as const;

// NFT marketplace contracts — only erc721/erc1155 transfers involving these
// are counted as "collectible NFT activity" for Hunter classification.
// PROTOCOL_MAP NFT entries handle the `matchedProtocol === 'NFT'` path;
// this set handles the category-based path (erc721/erc1155 + marketplace).
const NFT_MARKETPLACE_CONTRACTS: ReadonlySet<string> = new Set([
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', // Seaport 1.5
  '0x00000000006c3852cbef3e08e8df289169ede581', // Seaport 1.1
  '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b', // OpenSea Legacy (Wyvern)
  '0x00000000000001ad428e4906ae43d8f9852d0dd6', // Blur
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a', // LooksRare
  '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3', // X2Y2
  '0x2b2e8cda09bba9660dca5cb6233787738ad68329', // Sudoswap
]);

function getProtocolType(address: string | null): ProtocolType | null {
  if (address === null) {
    return null;
  }
  return PROTOCOL_MAP[address.toLowerCase()] ?? null;
}

function isNftCategory(category: AssetTransferItem['category']): boolean {
  return category === 'erc721' || category === 'erc1155';
}

function isNftMarketplaceTransfer(transfer: AssetTransferItem): boolean {
  if (!isNftCategory(transfer.category)) return false;
  const to = transfer.to?.toLowerCase() ?? '';
  const from = transfer.from?.toLowerCase() ?? '';
  return NFT_MARKETPLACE_CONTRACTS.has(to) || NFT_MARKETPLACE_CONTRACTS.has(from);
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
    const contractProtocol = getProtocolType(transfer.contractAddress);
    const matchedProtocol = toProtocol ?? fromProtocol ?? contractProtocol;

    if (transfer.contractAddress !== null) {
      uniqueContractSet.add(transfer.contractAddress.toLowerCase());
    }
    if (transfer.to !== null && getProtocolType(transfer.to) !== null) {
      uniqueContractSet.add(transfer.to.toLowerCase());
    }
    if (transfer.from !== null && getProtocolType(transfer.from) !== null) {
      uniqueContractSet.add(transfer.from.toLowerCase());
    }

    if (transfer.category !== 'external') {
      contractInteractions += 1;
    }

    if (matchedProtocol === 'DEX') {
      dexCount += 1;
    } else if (matchedProtocol === 'BRIDGE') {
      bridgeCount += 1;
    } else if (matchedProtocol === 'STABLE') {
      stableCount += 1;
    } else if (matchedProtocol === 'NFT' || isNftMarketplaceTransfer(transfer)) {
      nftCount += 1;
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
