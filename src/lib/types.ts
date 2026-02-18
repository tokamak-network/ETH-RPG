// Shared type definitions for Eth·RPG

export interface WalletRawData {
  readonly address: string;
  readonly balance: bigint;
  readonly txCount: number;
  readonly transfers: readonly AssetTransferItem[];
  readonly firstTxTimestamp: number | null;
  readonly lastTxTimestamp: number | null;
  readonly gasSpentEth: number;
  readonly ensName?: string;
}

export interface AssetTransferItem {
  readonly from: string | null;
  readonly to: string | null;
  readonly category: 'external' | 'erc20' | 'erc721' | 'erc1155';
  readonly value: number | null;
  readonly asset: string | null;
  readonly blockTimestamp: string | undefined;
  readonly contractAddress: string | null;
}

export interface TxClassification {
  readonly nftRatio: number;
  readonly dexRatio: number;
  readonly bridgeCount: number;
  readonly bridgeRatio: number;
  readonly stableRatio: number;
  readonly contractInteractions: number;
  readonly uniqueContracts: number;
  readonly dexSwapCount: number;
}

export interface CharacterStats {
  readonly level: number;
  readonly hp: number;
  readonly mp: number;
  readonly str: number;
  readonly int: number;
  readonly luck: number;
  readonly power: number;
}

export type CharacterClassId =
  | 'hunter'
  | 'rogue'
  | 'summoner'
  | 'merchant'
  | 'priest'
  | 'elder_wizard'
  | 'guardian'
  | 'warrior';

export interface ClassResult {
  readonly id: CharacterClassId;
  readonly name: string;
  readonly nameEn: string;
}

export interface LoreInputData {
  readonly className: string;
  readonly classNameEn: string;
  readonly level: number;
  readonly power: number;
  readonly txCount: number;
  readonly walletAgeDescription: string;
  readonly firstTxDate: string;
  readonly lastTxDate: string;
  readonly relevantEvents: readonly string[];
  readonly activityPattern: string;
}

export interface GenerateResponse {
  readonly address: string;
  readonly ensName?: string;
  readonly stats: CharacterStats;
  readonly class: ClassResult;
  readonly lore: string;
  readonly longLore: string;
  readonly cardImageUrl: string;
  readonly ogImageUrl: string;
  readonly cached: boolean;
}

export const ErrorCode = {
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  NO_TRANSACTIONS: 'NO_TRANSACTIONS',
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',
  LLM_ERROR: 'LLM_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorResponse {
  readonly error: {
    readonly code: ErrorCodeType;
    readonly message: string;
  };
}

export const ERROR_MESSAGES: Record<ErrorCodeType, string> = {
  [ErrorCode.INVALID_ADDRESS]: 'Please enter a valid Ethereum address.',
  [ErrorCode.NO_TRANSACTIONS]: 'This wallet has no transactions. Please enter an address with activity history.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ErrorCode.API_ERROR]: 'A temporary server error occurred. Please try again later.',
  [ErrorCode.TIMEOUT]: 'Analysis is taking too long. Please try again.',
  [ErrorCode.LLM_ERROR]: 'AI lore generation failed. Default lore will be applied.',
};

export interface CryptoEvent {
  readonly date: string;
  readonly event: string;
  readonly rpgEvent: string;
}
