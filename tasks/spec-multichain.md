# Spec: Multi-Chain Card Generation

> 작성일: 2026-02-19
> 상태: Draft — 방향 확정 시 구현 시작

---

## 목적

같은 지갑 주소로 체인별 다른 캐릭터 카드를 생성한다.
"이더리움에선 Hunter인데, Base에선 Rogue였어" — 카드 생성 3배, 공유 3배.

---

## 대상 체인

### 1차 (P0) — Base + Arbitrum + Optimism

| 체인 | Alchemy Network | TVL 순위 | 유저 특성 | 적합도 |
|------|----------------|---------|----------|--------|
| **Base** | `base-mainnet` | L2 2위 | Coinbase 유저, 소셜/밈코인 | 최상 |
| **Arbitrum** | `arb-mainnet` | L2 1위 | DeFi 파워유저 | 최상 |
| **Optimism** | `opt-mainnet` | L2 3위 | DeFi + 거버넌스 | 상 |

### 2차 (P1) — 확장 후보

| 체인 | Alchemy Network | 유저 특성 | 적합도 |
|------|----------------|----------|--------|
| Polygon | `polygon-mainnet` | NFT/게임, 저가 tx | 상 |
| zkSync | `zksync-mainnet` | 에어드랍 파밍 | 중 |
| BNB | `bnb-mainnet` | 아시아 유저 | 중 |
| Scroll | `scroll-mainnet` | 개발자 초기 | 중하 |

### 선정 기준

1. `getAssetTransfers` API 지원 (카드 생성 핵심)
2. EVM 호환 (같은 0x... 주소)
3. 유저 수 / 활성도 충분

---

## 기술 제약

### PROTOCOL_MAP (classifier.ts)

현재 34개 프로토콜 주소는 **ETH Mainnet 전용**. L2 체인에서는 컨트랙트 주소가 다르다.

| 방법 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A) 체인별 PROTOCOL_MAP | 체인마다 별도 화이트리스트 | 정밀한 분류 | 공수 큼, 유지보수 부담 |
| B) 카테고리 기반 | ERC20/721/1155만으로 분류 | 빠른 구현 | Rogue/Merchant 등 정밀도 낮음 |
| **C) 하이브리드** | 상위 3개 체인 MAP + 나머지 카테고리 | 균형 | 추천 |

### Alchemy 인스턴스

- 같은 API 키로 체인별 인스턴스 생성 가능
- `new Alchemy({ apiKey, network: Network.BASE_MAINNET })`
- ENS 조회는 ETH Mainnet에서만 가능 (L2에서는 스킵)

### 캐시 키

현재: `lower(address)` → 변경: `lower(address):chainId`

---

## 구현 범위 (예상)

| 항목 | 파일 | 공수 |
|------|------|------|
| Alchemy 멀티체인 팩토리 | `lib/alchemy.ts` | 1h |
| 체인별 PROTOCOL_MAP (3개) | `lib/classifier.ts` | 2h |
| 타입에 chainId 추가 | `lib/types.ts` | 30m |
| 캐시 키 체인 분리 | `lib/cache.ts` | 30m |
| API에 chain 파라미터 | `api/generate/route.ts` | 30m |
| UI 체인 셀렉터 | `components/ChainSelector.tsx` | 1h |
| 결과 페이지 체인 표시 | `app/result/` | 1h |
| OG/Card에 체인 로고 | `api/og/, api/card/` | 1h |
| **합계** | | **~8h** |

---

## 기대 효과

- 카드 생성 횟수: 1회 → 최대 4회 (ETH + 3 L2)
- 공유 콘텐츠: "체인별 직업 비교" 밈
- 재방문 이유: "다른 체인도 해봐야지"
- PvP 확장: 같은 지갑 다른 체인 캐릭터끼리 배틀
