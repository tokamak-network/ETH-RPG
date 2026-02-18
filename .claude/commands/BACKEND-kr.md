# ⚙️ BACKEND Developer Agent

## 역할 정의
Wallet RPG의 서버 로직 전체를 담당하는 백엔드 개발자.
Alchemy API 연동, 트랜잭션 파싱, 스탯 산출, 직업 분류, 캐싱, 레이트리밋, 에러 핸들링을 구현한다.

---

## 기술 스택
- **Runtime**: Node.js 20+
- **Framework**: Next.js API Routes (App Router)
- **Blockchain API**: Alchemy SDK
- **Cache**: In-memory (Map) → 추후 Redis 전환 가능
- **Logging**: Sentry (무료 티어)
- **Language**: TypeScript

---

## 전체 API 엔드포인트 목록

### Core Endpoints
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/generate` | 주소 → 캐릭터 생성 (메인 엔드포인트) | 없음 |
| GET | `/api/og/[address]` | OG 이미지 동적 생성 | 없음 |
| GET | `/api/health` | 서버 상태 확인 | 없음 |

### 내부 Utility
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/stats` | 내부용 — 총 생성 수, 직업 분포 등 |

---

## `/api/generate` 상세 플로우

```
1. 입력 검증 (주소 포맷 / ENS 리졸브)
   ↓
2. 캐시 확인 (주소 키 기준, 24시간 TTL)
   ↓ (캐시 미스)
3. Alchemy API 호출
   ├─ getAssetTransfers (FROM + TO)
   ├─ getBalance
   └─ getTransactionCount
   ↓
4. 트랜잭션 분류 (파싱 엔진)
   ↓
5. 스탯 산출 (공식 적용)
   ↓
6. 직업 판정 (우선순위 매칭)
   ↓
7. AI 서사 생성 (PROMENG 프롬프트 호출)
   ↓
8. 카드 이미지 생성 (CARD_DESIGNER 렌더링 호출)
   ↓
9. 캐시 저장 + 응답 반환
```

---

## Alchemy API 연동

### SDK 초기화
```typescript
import { Alchemy, Network } from 'alchemy-sdk';

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});
```

### 데이터 수집 함수
```typescript
interface WalletRawData {
  address: string;
  balance: bigint;                    // wei 단위
  txCount: number;                    // 총 트랜잭션 수
  transfers: AssetTransfer[];         // FROM + TO 전체
  firstTxTimestamp: number | null;    // 최초 트랜잭션 시점
  gasSpentEth: number;               // 총 가스비 (ETH)
}

async function fetchWalletData(address: string): Promise<WalletRawData> {
  const [balance, txCount, transfersFrom, transfersTo] = await Promise.all([
    alchemy.core.getBalance(address),
    alchemy.core.getTransactionCount(address),
    alchemy.core.getAssetTransfers({
      fromAddress: address,
      category: ['external', 'erc20', 'erc721', 'erc1155'],
      maxCount: 1000,  // MVP 상한
      withMetadata: true,
    }),
    alchemy.core.getAssetTransfers({
      toAddress: address,
      category: ['external', 'erc20', 'erc721', 'erc1155'],
      maxCount: 1000,
      withMetadata: true,
    }),
  ]);

  const allTransfers = [...transfersFrom.transfers, ...transfersTo.transfers];
  
  // 가스비 계산 (from 트랜잭션만)
  // 상세 가스비는 각 tx receipt 조회 필요 → MVP에서는 txCount * avgGas 추정
  const estimatedGasEth = txCount * 0.003; // 평균 가스비 추정 (MVP)

  // 최초 트랜잭션 시점
  const timestamps = allTransfers
    .map(t => t.metadata?.blockTimestamp)
    .filter(Boolean)
    .map(t => new Date(t).getTime());
  const firstTxTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;

  return {
    address,
    balance: BigInt(balance.toString()),
    txCount,
    transfers: allTransfers,
    firstTxTimestamp,
    gasSpentEth: estimatedGasEth,
  };
}
```

---

## 트랜잭션 분류 (파싱 엔진)

### 분류 방식: 컨트랙트 주소 화이트리스트 (MVP)
```typescript
// 주요 프로토콜 컨트랙트 매핑
const PROTOCOL_MAP: Record<string, string> = {
  // DEX
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'DEX',    // Uniswap V2 Router
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'DEX',    // Uniswap V3 Router
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'DEX',    // SushiSwap Router
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': 'DEX',    // 0x Exchange Proxy
  
  // NFT
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': 'NFT',    // OpenSea Seaport
  '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': 'NFT',    // OpenSea Legacy
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a': 'NFT',    // LooksRare
  '0x00000000000001ad428e4906ae43d8f9852d0dd6': 'NFT',    // Blur
  
  // Bridge
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'BRIDGE', // Optimism Bridge
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': 'BRIDGE', // Wormhole
  '0x8eb8a3b98659cce290402893d0123abb75e3ab28': 'BRIDGE', // Avalanche Bridge
  '0xabea9132b05a70803a4e85094fd0e1800777fbef': 'BRIDGE', // zkSync Bridge

  // Stablecoin contracts
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'STABLE', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'STABLE', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'STABLE', // DAI
};

interface TxClassification {
  nftRatio: number;      // NFT 트랜잭션 비율
  dexRatio: number;      // DEX 트랜잭션 비율
  bridgeCount: number;   // 브릿지 횟수
  bridgeRatio: number;   // 브릿지 비율
  stableRatio: number;   // 스테이블코인 비율
  contractInteractions: number;  // 컨트랙트 상호작용 수
  uniqueContracts: number;       // 유니크 컨트랙트 수
  dexSwapCount: number;
}

function classifyTransactions(transfers: AssetTransfer[]): TxClassification {
  let nft = 0, dex = 0, bridge = 0, stable = 0, contractTotal = 0;
  const uniqueContracts = new Set<string>();
  const total = transfers.length || 1;

  for (const tx of transfers) {
    const to = tx.to?.toLowerCase();
    const category = tx.category;
    
    // ERC-721/1155 → NFT
    if (category === 'erc721' || category === 'erc1155') { nft++; continue; }
    
    // 화이트리스트 매칭
    if (to && PROTOCOL_MAP[to]) {
      const type = PROTOCOL_MAP[to];
      if (type === 'DEX') dex++;
      else if (type === 'NFT') nft++;
      else if (type === 'BRIDGE') bridge++;
      else if (type === 'STABLE') stable++;
      uniqueContracts.add(to);
      contractTotal++;
    } else if (to && tx.category === 'erc20') {
      // ERC20 전송 중 스테이블코인 체크
      if (to && PROTOCOL_MAP[to] === 'STABLE') stable++;
    }
    
    if (to) uniqueContracts.add(to);
  }

  return {
    nftRatio: nft / total,
    dexRatio: dex / total,
    bridgeCount: bridge,
    bridgeRatio: bridge / total,
    stableRatio: stable / total,
    contractInteractions: contractTotal,
    uniqueContracts: uniqueContracts.size,
    dexSwapCount: dex,
  };
}
```

---

## 스탯 산출 공식

```typescript
interface CharacterStats {
  level: number;
  hp: number;
  mp: number;
  str: number;
  int: number;
  luck: number;
  power: number;
}

function calculateStats(raw: WalletRawData, classification: TxClassification): CharacterStats {
  const balanceEth = Number(raw.balance) / 1e18;
  
  const level = Math.min(60, Math.max(1, 1 + Math.floor(10 * Math.log10(1 + raw.txCount))));
  const hp = Math.round(100 + 250 * Math.log10(1 + balanceEth));
  const mp = Math.round(80 + 220 * Math.log10(1 + raw.gasSpentEth));
  const str = Math.round(50 + 180 * Math.log10(1 + classification.dexSwapCount + classification.bridgeCount));
  const int = Math.round(50 + 180 * Math.log10(1 + classification.uniqueContracts));
  
  // LUCK: 토큰 다양성 + 지갑 나이(년) + 컨트랙트 생성 여부
  const walletAgeYears = raw.firstTxTimestamp 
    ? (Date.now() - raw.firstTxTimestamp) / (365.25 * 24 * 60 * 60 * 1000)
    : 0;
  const rareEvents = classification.uniqueContracts * 0.1 + walletAgeYears;
  const luck = Math.round(50 + 120 * Math.log10(1 + rareEvents));
  
  const power = level * 1000 + str * 30 + int * 30 + hp * 10 + mp * 10 + luck * 20;

  return { level, hp, mp, str, int, luck, power };
}
```

---

## 직업 판정 (우선순위 매칭)

```typescript
type CharacterClass = 
  | 'hunter' | 'rogue' | 'summoner' | 'merchant'
  | 'priest' | 'elder_wizard' | 'guardian' | 'warrior';

interface ClassResult {
  id: CharacterClass;
  name: string;
  nameEn: string;
}

function determineClass(
  raw: WalletRawData,
  classification: TxClassification,
  stats: CharacterStats
): ClassResult {
  const balanceEth = Number(raw.balance) / 1e18;
  const walletAgeYears = raw.firstTxTimestamp 
    ? (Date.now() - raw.firstTxTimestamp) / (365.25 * 24 * 60 * 60 * 1000)
    : 0;

  // 우선순위 순서대로 — 첫 매칭 확정
  if (classification.nftRatio >= 0.30)
    return { id: 'hunter', name: '헌터(Hunter)', nameEn: 'Hunter' };
  
  if (classification.dexRatio >= 0.25)
    return { id: 'rogue', name: '로그(Rogue)', nameEn: 'Rogue' };
  
  if (classification.bridgeCount >= 5 || classification.bridgeRatio >= 0.10)
    return { id: 'summoner', name: '소환사(Summoner)', nameEn: 'Summoner' };
  
  if (classification.stableRatio >= 0.35)
    return { id: 'merchant', name: '상인(Merchant)', nameEn: 'Merchant' };
  
  if (raw.gasSpentEth > 1.0 && classification.contractInteractions > 50)
    return { id: 'priest', name: '성직자(Priest)', nameEn: 'Priest' };
  
  if (walletAgeYears >= 2 && raw.txCount < 50)
    return { id: 'elder_wizard', name: '고대 마법사(Elder Wizard)', nameEn: 'Elder Wizard' };
  
  if (raw.txCount < 20 && balanceEth > 1.0)
    return { id: 'guardian', name: '수호자(Guardian)', nameEn: 'Guardian' };
  
  return { id: 'warrior', name: '전사(Warrior)', nameEn: 'Warrior' };
}
```

---

## 캐싱 로직

```typescript
interface CacheEntry {
  data: GenerateResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

function getCached(address: string): GenerateResponse | null {
  const key = address.toLowerCase();
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(address: string, data: GenerateResponse): void {
  const key = address.toLowerCase();
  cache.set(key, { data, timestamp: Date.now() });
  
  // 메모리 관리: 최대 10,000개 유지
  if (cache.size > 10000) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 1000);
    oldest.forEach(([k]) => cache.delete(k));
  }
}
```

---

## 레이트리밋

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;          // 분당 최대 요청
const RATE_WINDOW = 60 * 1000; // 1분

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}
```

---

## 에러 코드 체계
```typescript
enum ErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NO_TRANSACTIONS = 'NO_TRANSACTIONS',
  RATE_LIMITED = 'RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  LLM_ERROR = 'LLM_ERROR',
}

function apiError(code: ErrorCode, status: number) {
  return NextResponse.json({ error: code, message: ERROR_MESSAGES[code] }, { status });
}
```

---

## 환경 변수
```env
ALCHEMY_API_KEY=          # Alchemy API 키
OPENAI_API_KEY=           # 또는 Anthropic API 키 (서사 생성용)
SENTRY_DSN=               # Sentry 에러 로깅
NEXT_PUBLIC_SITE_URL=     # 사이트 URL (OG/공유용)
```

---

## 크립토 이벤트 타임라인 (서사 생성용)
```typescript
const CRYPTO_EVENTS: { date: string; event: string; rpgEvent: string }[] = [
  { date: '2021-05-19', event: '2021 크래시', rpgEvent: '대폭락의 전장에서 살아남았다' },
  { date: '2022-05-09', event: '루나/테라 붕괴', rpgEvent: '달의 왕국이 무너지는 것을 목격했다' },
  { date: '2022-09-15', event: '이더리움 머지', rpgEvent: '대통합의 의식에 참여했다' },
  { date: '2022-11-11', event: 'FTX 파산', rpgEvent: '거래소 왕국의 배신을 겪었다' },
  { date: '2023-03-11', event: 'SVB 위기', rpgEvent: '금고의 수호자들이 무너지는 것을 보았다' },
  { date: '2024-01-10', event: 'BTC ETF 승인', rpgEvent: '기관 기사단의 출현을 목격했다' },
  { date: '2024-03-13', event: 'BTC ATH 73K', rpgEvent: '전설의 봉우리에 도달했다' },
  { date: '2024-11-05', event: '미 대선/BTC 급등', rpgEvent: '새로운 왕의 대관식과 함께 부활했다' },
];
```
