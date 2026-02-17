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
  [ErrorCode.INVALID_ADDRESS]: '올바른 이더리움 주소를 입력해주세요.',
  [ErrorCode.NO_TRANSACTIONS]: '이 지갑에는 트랜잭션이 없습니다. 활동 이력이 있는 주소를 입력해주세요.',
  [ErrorCode.RATE_LIMITED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.API_ERROR]: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.TIMEOUT]: '분석에 시간이 오래 걸리고 있습니다. 다시 시도해주세요.',
  [ErrorCode.LLM_ERROR]: 'AI 서사 생성에 실패했습니다. 기본 서사가 적용됩니다.',
};

export interface CryptoEvent {
  readonly date: string;
  readonly event: string;
  readonly rpgEvent: string;
}
