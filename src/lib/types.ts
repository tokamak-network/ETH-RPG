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
  readonly dex: number;
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

export type AchievementTier = 'legendary' | 'epic' | 'rare' | 'common';

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly tier: AchievementTier;
  readonly description: string;
}

export interface GenerateResponse {
  readonly address: string;
  readonly ensName?: string;
  readonly stats: CharacterStats;
  readonly class: ClassResult;
  readonly lore: string;
  readonly longLore: string;
  readonly achievements: readonly Achievement[];
  readonly cardImageUrl: string;
  readonly ogImageUrl: string;
  readonly cached: boolean;
}

export interface BattleAction {
  readonly turn: number;
  readonly actorIndex: 0 | 1;
  readonly actionType: 'skill' | 'basic_attack';
  readonly skillName?: string;
  readonly damage: number;
  readonly healed?: number;
  readonly isCrit: boolean;
  readonly isStun: boolean;
  readonly isDodge: boolean;
  readonly reflected?: number;
  readonly mpDrained?: number;
  readonly actorHpAfter: number;
  readonly targetHpAfter: number;
  readonly narrative: string;
}

export interface BattleFighter {
  readonly address: string;
  readonly ensName?: string;
  readonly class: ClassResult;
  readonly stats: CharacterStats;
  readonly achievements: readonly Achievement[];
}

export type MatchupAdvantage = 'advantaged' | 'disadvantaged' | 'neutral';

export interface BattleMatchup {
  readonly fighter0Advantage: MatchupAdvantage;
  readonly fighter1Advantage: MatchupAdvantage;
}

export interface BattleResult {
  readonly fighters: readonly [BattleFighter, BattleFighter];
  readonly winner: 0 | 1;
  readonly turns: readonly BattleAction[];
  readonly totalTurns: number;
  readonly winnerHpRemaining: number;
  readonly winnerHpPercent: number;
  readonly matchup: BattleMatchup;
  readonly nonce: string;
  readonly battleSeed: string;
}

export interface BattleResponse {
  readonly result: BattleResult;
  readonly battleImageUrl: string;
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
  SAME_ADDRESS: 'SAME_ADDRESS',
  INVALID_EVENT: 'INVALID_EVENT',
  INVALID_REQUEST: 'INVALID_REQUEST',
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
  [ErrorCode.SAME_ADDRESS]: 'Cannot battle yourself. Please enter two different addresses.',
  [ErrorCode.INVALID_EVENT]: 'Invalid event.',
  [ErrorCode.INVALID_REQUEST]: 'Invalid request format.',
};

export interface CryptoEvent {
  readonly date: string;
  readonly event: string;
  readonly rpgEvent: string;
}

// --- Season Ranking Types ---

export type LeaderboardType = 'power' | 'battle' | 'explorer';

export interface Season {
  readonly id: string;          // "s1", "s2"
  readonly number: number;
  readonly name: string;        // "Genesis Season"
  readonly startedAt: number;   // epoch ms
  readonly endsAt: number;      // epoch ms
  readonly isActive: boolean;
}

export interface PlayerRecord {
  readonly address: string;
  readonly ensName?: string;
  readonly classId: CharacterClassId;
  readonly power: number;
  readonly level: number;
  readonly wins: number;
  readonly losses: number;
  readonly achievementCounts: Readonly<Record<AchievementTier, number>>;
  readonly lastSeenAt: number;
}

export interface BattleRecord {
  readonly seasonId: string;
  readonly address: string;
  readonly opponentAddress: string;
  readonly won: boolean;
  readonly power: number;
  readonly opponentPower: number;
  readonly nonce: string;
  readonly recordedAt: number;
}

export interface PowerRankingEntry {
  readonly rank: number;
  readonly address: string;
  readonly ensName?: string;
  readonly classId: CharacterClassId;
  readonly power: number;
  readonly level: number;
}

export interface BattleRankingEntry {
  readonly rank: number;
  readonly address: string;
  readonly ensName?: string;
  readonly classId: CharacterClassId;
  readonly power: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
  readonly ratingScore: number;
}

export interface ExplorerRankingEntry {
  readonly rank: number;
  readonly address: string;
  readonly ensName?: string;
  readonly classId: CharacterClassId;
  readonly power: number;
  readonly achievementCount: number;
  readonly explorerScore: number;
}

export type RankingEntry = PowerRankingEntry | BattleRankingEntry | ExplorerRankingEntry;

export interface LeaderboardResponse {
  readonly season: Season;
  readonly type: LeaderboardType;
  readonly updatedAt: number;
  readonly entries: readonly RankingEntry[];
  readonly totalPlayers: number;
  readonly playerRank?: number;
}
