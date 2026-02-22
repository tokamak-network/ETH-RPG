import { describe, it, expect } from 'vitest';
import { classifyTransactions } from '@/lib/classifier';
import {
  makeTransfer,
  makeDexTransfer,
  makeNftTransfer,
  makeBridgeTransfer,
  makeStableTransfer,
  UNISWAP_V2,
  UNISWAP_V3,
  SUSHISWAP,
  UNISWAP_UNIVERSAL,
  ZRX_EXCHANGE,
  SEAPORT,
  OPENSEA_LEGACY,
  LOOKSRARE,
  BLUR,
  OPTIMISM_BRIDGE,
  WORMHOLE,
  AVALANCHE_BRIDGE,
  ZKSYNC_BRIDGE,
  USDC,
  USDT,
  DAI,
  RANDOM_ADDRESS,
  RANDOM_CONTRACT,
  UNISWAP_V3_POSITIONS,
  ENS_BASE_REGISTRAR,
  ENS_NAME_WRAPPER,
  POAP,
} from './fixtures';

describe('classifyTransactions', () => {
  // 1. Empty array
  describe('empty array', () => {
    it('returns all zeros when given no transfers', () => {
      const result = classifyTransactions([]);

      expect(result).toEqual({
        nftRatio: 0,
        dexRatio: 0,
        bridgeCount: 0,
        bridgeRatio: 0,
        stableRatio: 0,
        contractInteractions: 0,
        uniqueContracts: 0,
        dexSwapCount: 0,
      });
    });
  });

  // 2. NFT detection
  describe('NFT detection', () => {
    it('detects erc721 category as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects erc1155 category as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc1155', contractAddress: RANDOM_CONTRACT }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects Seaport protocol as NFT', () => {
      const result = classifyTransactions([makeNftTransfer({ to: SEAPORT })]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects OpenSea Legacy protocol as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ to: OPENSEA_LEGACY, category: 'external' }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects LooksRare protocol as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ to: LOOKSRARE, category: 'external' }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects Blur protocol as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ to: BLUR, category: 'external' }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('detects NFT protocol from the from field', () => {
      const result = classifyTransactions([
        makeTransfer({ from: SEAPORT, to: RANDOM_ADDRESS, category: 'external' }),
      ]);

      expect(result.nftRatio).toBe(1);
    });
  });

  // 3. DEX detection
  describe('DEX detection', () => {
    it('detects Uniswap V2 Router', () => {
      const result = classifyTransactions([makeDexTransfer({ to: UNISWAP_V2 })]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });

    it('detects Uniswap V3 Router', () => {
      const result = classifyTransactions([makeDexTransfer({ to: UNISWAP_V3 })]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });

    it('detects SushiSwap Router', () => {
      const result = classifyTransactions([makeDexTransfer({ to: SUSHISWAP })]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });

    it('detects 0x Exchange', () => {
      const result = classifyTransactions([makeDexTransfer({ to: ZRX_EXCHANGE })]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });

    it('detects Uniswap Universal Router', () => {
      const result = classifyTransactions([makeDexTransfer({ to: UNISWAP_UNIVERSAL })]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });

    it('detects DEX protocol from the from field', () => {
      const result = classifyTransactions([
        makeTransfer({ from: UNISWAP_V2, to: RANDOM_ADDRESS, category: 'erc20', contractAddress: RANDOM_CONTRACT }),
      ]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });
  });

  // 4. Bridge detection
  describe('Bridge detection', () => {
    it('detects Optimism Bridge', () => {
      const result = classifyTransactions([makeBridgeTransfer({ to: OPTIMISM_BRIDGE })]);

      expect(result.bridgeCount).toBe(1);
      expect(result.bridgeRatio).toBe(1);
    });

    it('detects Wormhole Bridge', () => {
      const result = classifyTransactions([makeBridgeTransfer({ to: WORMHOLE })]);

      expect(result.bridgeCount).toBe(1);
      expect(result.bridgeRatio).toBe(1);
    });

    it('detects Avalanche Bridge', () => {
      const result = classifyTransactions([makeBridgeTransfer({ to: AVALANCHE_BRIDGE })]);

      expect(result.bridgeCount).toBe(1);
      expect(result.bridgeRatio).toBe(1);
    });

    it('detects zkSync Bridge', () => {
      const result = classifyTransactions([makeBridgeTransfer({ to: ZKSYNC_BRIDGE })]);

      expect(result.bridgeCount).toBe(1);
      expect(result.bridgeRatio).toBe(1);
    });
  });

  // 5. Stable detection
  describe('Stable detection', () => {
    it('detects USDC', () => {
      const result = classifyTransactions([makeStableTransfer({ to: USDC })]);

      expect(result.stableRatio).toBe(1);
    });

    it('detects USDT', () => {
      const result = classifyTransactions([makeStableTransfer({ to: USDT, contractAddress: USDT })]);

      expect(result.stableRatio).toBe(1);
    });

    it('detects DAI', () => {
      const result = classifyTransactions([makeStableTransfer({ to: DAI, contractAddress: DAI })]);

      expect(result.stableRatio).toBe(1);
    });
  });

  // 6. Ratio calculations
  describe('Ratio calculations', () => {
    it('computes correct ratios with mixed transfer types', () => {
      const transfers = [
        makeNftTransfer(),
        makeNftTransfer(),
        makeDexTransfer(),
        makeBridgeTransfer(),
        makeStableTransfer(),
      ];

      const result = classifyTransactions(transfers);

      expect(result.nftRatio).toBeCloseTo(2 / 5);
      expect(result.dexRatio).toBeCloseTo(1 / 5);
      expect(result.bridgeRatio).toBeCloseTo(1 / 5);
      expect(result.stableRatio).toBeCloseTo(1 / 5);
      expect(result.bridgeCount).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });
  });

  // 7. Case-insensitive address matching
  describe('case-insensitive address matching', () => {
    it('matches uppercase addresses to known protocols', () => {
      const result = classifyTransactions([
        makeDexTransfer({ to: UNISWAP_V2.toUpperCase() }),
      ]);

      expect(result.dexRatio).toBe(1);
      expect(result.dexSwapCount).toBe(1);
    });
  });

  // 8. uniqueContracts
  describe('uniqueContracts', () => {
    it('counts unique contractAddress values and known protocol addresses', () => {
      const transfers = [
        makeDexTransfer({ contractAddress: RANDOM_CONTRACT }),
        makeDexTransfer({ contractAddress: RANDOM_CONTRACT }),
        makeNftTransfer({ contractAddress: '0xaaaa000000000000000000000000000000000001' }),
      ];

      const result = classifyTransactions(transfers);

      // RANDOM_CONTRACT (from contractAddress), UNISWAP_V2 (known protocol in to),
      // 0xaaaa...0001 (contractAddress), SEAPORT (known protocol in to) = 4
      expect(result.uniqueContracts).toBe(4);
    });
  });

  // 9. contractInteractions
  describe('contractInteractions', () => {
    it('counts non-external transfers', () => {
      const transfers = [
        makeTransfer({ category: 'external' }),
        makeTransfer({ category: 'erc20', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'erc1155', contractAddress: RANDOM_CONTRACT }),
      ];

      const result = classifyTransactions(transfers);

      expect(result.contractInteractions).toBe(3);
    });
  });

  // 10. Mixed scenario
  describe('mixed scenario', () => {
    it('classifies all types correctly in a realistic mixed set', () => {
      const transfers = [
        makeNftTransfer(),                                          // NFT (erc721 + Seaport)
        makeDexTransfer({ to: UNISWAP_V3 }),                       // DEX
        makeDexTransfer({ to: SUSHISWAP }),                         // DEX
        makeBridgeTransfer({ to: WORMHOLE }),                       // Bridge
        makeBridgeTransfer({ to: OPTIMISM_BRIDGE }),                // Bridge
        makeBridgeTransfer({ to: ZKSYNC_BRIDGE }),                  // Bridge
        makeStableTransfer({ to: USDT, contractAddress: USDT }),    // Stable
        makeStableTransfer({ to: DAI, contractAddress: DAI }),      // Stable
        makeTransfer({ category: 'external' }),                     // plain external
        makeTransfer({ category: 'erc20', contractAddress: RANDOM_CONTRACT }), // unclassified erc20
      ];

      const result = classifyTransactions(transfers);

      expect(result.nftRatio).toBeCloseTo(1 / 10);
      expect(result.dexRatio).toBeCloseTo(2 / 10);
      expect(result.bridgeCount).toBe(3);
      expect(result.bridgeRatio).toBeCloseTo(3 / 10);
      expect(result.stableRatio).toBeCloseTo(2 / 10);
      expect(result.dexSwapCount).toBe(2);

      // contractInteractions = all non-external: NFT(erc721) + 2 DEX(erc20) + 2 Stable(erc20) + 1 unclassified(erc20) = 6
      expect(result.contractInteractions).toBe(6);

      // uniqueContracts: RANDOM_CONTRACT (NFT contractAddress + unclassified contractAddress),
      //   SEAPORT (NFT to), UNISWAP_V3 (DEX to), SUSHISWAP (DEX to),
      //   WORMHOLE (bridge to), OPTIMISM_BRIDGE (bridge to), ZKSYNC_BRIDGE (bridge to),
      //   USDT (stable to + contractAddress), DAI (stable to + contractAddress)
      //   = 9 unique
      expect(result.uniqueContracts).toBe(9);
    });
  });

  // 11. Utility NFT exclusion
  describe('Utility NFT exclusion', () => {
    it('excludes Uniswap V3 Positions from nftCount', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('excludes ENS Base Registrar from nftCount', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('excludes ENS Name Wrapper from nftCount', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc1155', contractAddress: ENS_NAME_WRAPPER }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('excludes POAP from nftCount', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: POAP }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('still counts utility NFTs in contractInteractions', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
      ]);

      expect(result.nftRatio).toBe(0);
      expect(result.contractInteractions).toBe(2);
      expect(result.uniqueContracts).toBe(2);
    });

    it('still counts regular erc721 as NFT', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
      ]);

      expect(result.nftRatio).toBe(1);
    });

    it('handles case-insensitive utility NFT matching', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS.toUpperCase() }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('excludes utility NFT even when sent via a known NFT marketplace', () => {
      const result = classifyTransactions([
        makeTransfer({
          category: 'erc721',
          contractAddress: UNISWAP_V3_POSITIONS,
          to: SEAPORT,
        }),
      ]);

      expect(result.nftRatio).toBe(0);
    });

    it('computes correct nftRatio when mixing utility and real NFTs', () => {
      const result = classifyTransactions([
        makeTransfer({ category: 'erc721', contractAddress: UNISWAP_V3_POSITIONS }),
        makeTransfer({ category: 'erc721', contractAddress: ENS_BASE_REGISTRAR }),
        makeTransfer({ category: 'erc721', contractAddress: RANDOM_CONTRACT }),
        makeTransfer({ category: 'external' }),
      ]);

      expect(result.nftRatio).toBeCloseTo(1 / 4);
    });
  });
});
