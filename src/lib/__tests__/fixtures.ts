// Shared test fixtures and factory functions

import type {
  AssetTransferItem,
  WalletRawData,
  TxClassification,
  LoreInputData,
  GenerateResponse,
} from '@/lib/types';

// --- Known contract addresses ---
export const UNISWAP_V2 = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
export const UNISWAP_V3 = '0xe592427a0aece92de3edee1f18e0157c05861564';
export const SUSHISWAP = '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f';
export const UNISWAP_UNIVERSAL = '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad';
export const ZRX_EXCHANGE = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';

export const SEAPORT = '0x00000000000000adc04c56bf30ac9d3c0aaf14dc';
export const OPENSEA_LEGACY = '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b';
export const LOOKSRARE = '0x59728544b08ab483533076417fbbb2fd0b17ce3a';
export const BLUR = '0x00000000000001ad428e4906ae43d8f9852d0dd6';

export const OPTIMISM_BRIDGE = '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1';
export const WORMHOLE = '0x3ee18b2214aff97000d974cf647e7c347e8fa585';
export const AVALANCHE_BRIDGE = '0x8eb8a3b98659cce290402893d0123abb75e3ab28';
export const ZKSYNC_BRIDGE = '0xabea9132b05a70803a4e85094fd0e1800777fbef';

export const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';

export const RANDOM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
export const RANDOM_CONTRACT = '0xabcdef1234567890abcdef1234567890abcdef12';

// --- Factory functions ---

export function makeTransfer(
  overrides?: Partial<AssetTransferItem>,
): AssetTransferItem {
  return {
    from: RANDOM_ADDRESS,
    to: RANDOM_CONTRACT,
    category: 'external',
    value: 1.0,
    asset: 'ETH',
    blockTimestamp: '2023-06-15T10:00:00Z',
    contractAddress: null,
    ...overrides,
  };
}

export function makeDexTransfer(
  overrides?: Partial<AssetTransferItem>,
): AssetTransferItem {
  return makeTransfer({
    to: UNISWAP_V2,
    category: 'erc20',
    asset: 'UNI',
    contractAddress: RANDOM_CONTRACT,
    ...overrides,
  });
}

export function makeNftTransfer(
  overrides?: Partial<AssetTransferItem>,
): AssetTransferItem {
  return makeTransfer({
    to: SEAPORT,
    category: 'erc721',
    asset: 'NFT',
    contractAddress: RANDOM_CONTRACT,
    ...overrides,
  });
}

export function makeBridgeTransfer(
  overrides?: Partial<AssetTransferItem>,
): AssetTransferItem {
  return makeTransfer({
    to: OPTIMISM_BRIDGE,
    category: 'external',
    asset: 'ETH',
    contractAddress: null,
    ...overrides,
  });
}

export function makeStableTransfer(
  overrides?: Partial<AssetTransferItem>,
): AssetTransferItem {
  return makeTransfer({
    to: USDC,
    category: 'erc20',
    asset: 'USDC',
    contractAddress: USDC,
    ...overrides,
  });
}

export function makeWalletRawData(
  overrides?: Partial<WalletRawData>,
): WalletRawData {
  return {
    address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    balance: BigInt(0),
    txCount: 100,
    transfers: [],
    firstTxTimestamp: null,
    lastTxTimestamp: null,
    gasSpentEth: 0.5,
    ...overrides,
  };
}

export function makeClassification(
  overrides?: Partial<TxClassification>,
): TxClassification {
  return {
    nftRatio: 0,
    dexRatio: 0,
    bridgeCount: 0,
    bridgeRatio: 0,
    stableRatio: 0,
    contractInteractions: 0,
    uniqueContracts: 0,
    dexSwapCount: 0,
    ...overrides,
  };
}

export function makeLoreInput(
  overrides?: Partial<LoreInputData>,
): LoreInputData {
  return {
    className: '전사(Warrior)',
    classNameEn: 'Warrior',
    level: 10,
    power: 15000,
    txCount: 100,
    walletAgeDescription: '2년 3개월',
    firstTxDate: '2022-01-01',
    lastTxDate: '2024-06-01',
    relevantEvents: [],
    activityPattern: '일반적인 트랜잭션 활동',
    ...overrides,
  };
}

export function makeGenerateResponse(
  overrides?: Partial<GenerateResponse>,
): GenerateResponse {
  return {
    address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    stats: {
      level: 21,
      hp: 350,
      mp: 200,
      str: 150,
      int: 180,
      luck: 100,
      power: 35400,
    },
    class: { id: 'warrior', name: '전사(Warrior)', nameEn: 'Warrior' },
    lore: '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
    longLore: '특별한 마법도, 전설적인 무기도 없다. 이 전사가 가진 것은 꾸준함과 의지뿐이다. 매일 전장에 나서며 한 걸음씩 전진해온 이 전사의 여정은, 그 자체로 하나의 서사시다.',
    cardImageUrl: 'http://localhost:3000/api/card/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    ogImageUrl: 'http://localhost:3000/api/og/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    cached: false,
    ...overrides,
  };
}
