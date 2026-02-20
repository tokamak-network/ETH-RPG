# Spec: Class & Stat Balance Rebalance

> 작성일: 2026-02-19
> 상태: Implemented ✓
> 근거: 3명의 전략 에이전트(수학적 밸런스, PvP 전투, 생태계 분석) 합의

---

## 변경 요약

| 카테고리 | 변경 내용 |
|---------|----------|
| 신규 스탯 | DEX(민첩성) 추가 — TX 빈도 기반 |
| 버그 수정 | classifier.ts의 STABLE 매칭 버그 |
| 화이트리스트 | +18개 프로토콜 주소 추가 |
| 스탯 공식 | Power 가중치, LUCK 계수, STAT_MAX_VALUES |
| ClassBonus | 8개 클래스 전체 재조정 |
| 클래스 임계값 | 8개 클래스 임계값 조정 |
| PvP 스킬 | 6개 클래스 스킬/패시브 조정 |

---

## 1. 신규 스탯: DEX (Dexterity / 민첩성)

### 의미
"얼마나 빠르고 자주 활동하는가" — 단위 시간당 트랜잭션 빈도.

### Level과의 차이
```
Level = 총 활동량 (txCount 절대값)  → "얼마나 많이 했는가"
DEX   = 활동 빈도 (txCount/시간)    → "얼마나 빠르게 했는가"

예시:
  5년간 500tx → Level 28, DEX 200  (느리지만 꾸준)
  1년간 500tx → Level 28, DEX 420  (같은 Level이지만 훨씬 민첩)
```

### 공식
```typescript
// stats.ts에 추가
export const DEX_BASE = 50;
export const DEX_LOG_MULTIPLIER = 150;
export const DEX_FREQUENCY_FLOOR_YEARS = 0.25; // 3개월 미만 지갑 floor

function calculateDEX(txCount: number, walletAgeYears: number): number {
  const effectiveAge = Math.max(walletAgeYears, DEX_FREQUENCY_FLOOR_YEARS);
  const txFrequency = txCount / effectiveAge;
  return Math.round(DEX_BASE + DEX_LOG_MULTIPLIER * Math.log10(1 + txFrequency));
}
```

### 시뮬레이션
| 프로필 | txCount | walletAge | txFreq | DEX |
|--------|---------|-----------|--------|-----|
| 신규 유저 | 20 | 0.5y | 40/y | 292 |
| 일반 유저 | 150 | 2y | 75/y | 332 |
| NFT 수집가 | 200 | 2y | 100/y | 351 |
| DeFi 파워유저 | 500 | 4y | 125/y | 365 |
| 고래 홀더 | 30 | 5.5y | 5.5/y | 172 |
| 헤비 트레이더 | 2000 | 2y | 1000/y | 500 |

### PvP 역할
| 효과 | 수치 |
|------|------|
| 기본 회피율 | DEX * 0.02% (DEX 300 = 6% 회피) |
| 선공 판정 보조 | 선공 점수 = LUCK + DEX * 0.3 |
| 기본 공격 보정 | +seed_random(0, DEX * 0.05) 추가 데미지 |

### 테마
```typescript
// STAT_COLORS
dex: '#10b981'  // Emerald Green

// STAT_MAX_VALUES
dex: 550
```

### 타입 변경
```typescript
// types.ts — CharacterStats
interface CharacterStats {
  readonly level: number;
  readonly hp: number;
  readonly mp: number;
  readonly str: number;
  readonly int: number;
  readonly dex: number;    // NEW
  readonly luck: number;
  readonly power: number;
}
```

---

## 2. 버그 수정: STABLE 매칭 (CRITICAL)

### 문제
`classifier.ts:56-58`에서 `transfer.contractAddress`를 PROTOCOL_MAP과 대조하지 않음.
ERC-20 전송의 USDC/USDT 컨트랙트 주소가 `contractAddress`에 있는데 체크 누락.
결과: Merchant 클래스 배정률 0-2%, 사실상 작동 불가.

### 수정

파일: `src/lib/classifier.ts`

```typescript
// 현재 (line 56-58)
const toProtocol = getProtocolType(transfer.to);
const fromProtocol = getProtocolType(transfer.from);
const matchedProtocol = toProtocol ?? fromProtocol;

// 수정
const toProtocol = getProtocolType(transfer.to);
const fromProtocol = getProtocolType(transfer.from);
const contractProtocol = getProtocolType(transfer.contractAddress);
const matchedProtocol = toProtocol ?? fromProtocol ?? contractProtocol;
```

---

## 3. 프로토콜 화이트리스트 확장

파일: `src/lib/classifier.ts` — PROTOCOL_MAP

### DEX (+7)
```typescript
'0xd51a44d3fae010294c616388b506acda1bfaae46': 'DEX',    // Curve Tricrypto
'0xba12222222228d8ba445958a75a0704d566bf2c8': 'DEX',    // Balancer V2 Vault
'0x1111111254eeb25477b68fb85ed929f73a960582': 'DEX',    // 1inch V5
'0x111111125421ca6dc452d289314280a0f8842a65': 'DEX',    // 1inch V6
'0xdef171fe48cf0115b1d80b88dc8eab59176fee57': 'DEX',    // Paraswap V5
'0x9008d19f58aabd9ed0d60971565aa8510560ab41': 'DEX',    // CoW Protocol
'0xe66b31678d6c16e9ebf358268a790b763c133750': 'DEX',    // 0x V2
```

### BRIDGE (+6)
```typescript
'0x8731d54e9d02c286767d56ac03e8037c07e01e98': 'BRIDGE', // Stargate Router
'0xb8901acb165ed027e32754e0ffe830802919727f': 'BRIDGE', // Hop Protocol
'0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': 'BRIDGE', // Across V2
'0x2796317b0ff8538f253012862c06787adfb8ceb6': 'BRIDGE', // Synapse
'0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': 'BRIDGE', // Arbitrum Gateway
'0x49048044d57e1c92a77f79988d21fa8faf36f97b': 'BRIDGE', // Base Bridge
```

### STABLE (+5)
```typescript
'0x853d955acef822db058eb8505911ed77f175b99e': 'STABLE', // FRAX
'0x5f98805a4e8be255a32880fdec7f6728c6568ba0': 'STABLE', // LUSD
'0xf939e0a03fb07f59a73314e73794be0e57ac1b4e': 'STABLE', // crvUSD
'0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f': 'STABLE', // GHO
'0x6c3ea9036406852006290770bedfcaba0e23a0e8': 'STABLE', // PYUSD
```

### 합계: 16 → 34개 주소

---

## 4. 스탯 공식 변경

파일: `src/lib/stats.ts`

### Power 가중치

```typescript
// 현재
POWER_LEVEL_WEIGHT = 1000   // 62.5% 독점
POWER_STR_WEIGHT = 30
POWER_INT_WEIGHT = 30
POWER_HP_WEIGHT = 10
POWER_MP_WEIGHT = 10
POWER_LUCK_WEIGHT = 20

// 변경
POWER_LEVEL_WEIGHT = 500    // Level 비중 ~35%로 하향
POWER_STR_WEIGHT = 25
POWER_INT_WEIGHT = 25
POWER_DEX_WEIGHT = 20       // NEW
POWER_HP_WEIGHT = 15        // 상향
POWER_MP_WEIGHT = 15        // 상향
POWER_LUCK_WEIGHT = 20
```

### Power 공식
```typescript
Power = Level*500 + STR*25 + INT*25 + DEX*20 + HP*15 + MP*15 + LUCK*20 + ClassBonus
```

### LUCK 계수 상향

```typescript
// 현재
LUCK_LOG_MULTIPLIER = 120   // 최대 ~213, 항상 최저 스탯

// 변경
LUCK_LOG_MULTIPLIER = 180   // 최대 ~295, 다른 스탯과 균형
```

### STAT_MAX_VALUES

파일: `src/styles/themes.ts`

```typescript
// 현재
export const STAT_MAX_VALUES = {
  hp: 600, mp: 500, str: 400, int: 400, luck: 300,
};

// 변경
export const STAT_MAX_VALUES = {
  hp: 900,    // 고래(100 ETH+) 커버
  mp: 600,    // 극단 가스비 유저 커버
  str: 550,   // DEX 파워유저(300+ swap) 커버
  int: 500,   // 100+ 컨트랙트 유저 커버
  dex: 550,   // 헤비 트레이더 커버 (NEW)
  luck: 300,  // 유지 (LUCK 계수 상향으로 실제값 올라감)
};
```

### STAT_COLORS 추가

```typescript
// 현재
export const STAT_COLORS = {
  hp: '#ef4444', mp: '#8b5cf6', str: '#f97316',
  int: '#60a5fa', luck: '#22c55e',
};

// 변경
export const STAT_COLORS = {
  hp: '#ef4444', mp: '#8b5cf6', str: '#f97316',
  int: '#60a5fa', dex: '#10b981', luck: '#22c55e',
};
```

---

## 5. ClassBonus 조정

파일: `src/lib/stats.ts`

```typescript
// 현재
CLASS_POWER_BONUS = {
  hunter: 0, rogue: 0, summoner: 2000, merchant: 0,
  priest: 0, elder_wizard: 8000, guardian: 6000, warrior: 3000,
};

// 변경
CLASS_POWER_BONUS = {
  hunter: 2000,        // NFT 유저 STR 구조적 약세 보상
  rogue: 0,            // DEX 활동으로 스탯 자연 상승
  summoner: 1500,      // 소폭 하향
  merchant: 3000,      // 가장 스탯 낮은 클래스, 보상 필요
  priest: 1000,        // 가스+컨트랙트 조건으로 어느정도 높은 스탯
  elder_wizard: 5000,  // 8000에서 하향 (Power의 15% 이내)
  guardian: 4000,      // 6000에서 하향 (HP에서 이미 반영)
  warrior: 1500,       // 디폴트에 과한 보너스 하향
};
```

### 설계 원칙
- ClassBonus는 전체 Power의 5-15% 범위 내
- 구조적으로 스탯 낮은 클래스에 높은 보너스
- 디폴트(Warrior)는 최소 보너스

---

## 6. 클래스 임계값 조정

파일: `src/lib/class.ts`

| 클래스 | 현재 | 변경 | 근거 |
|--------|-----|------|------|
| Hunter | nftRatio >= 0.30 | nftRatio >= 0.25, **추가: nftRatio > dexRatio** | NFT 시장 침체 반영 + 복합유저 문제 해결 |
| Rogue | dexRatio >= 0.25 | dexRatio >= 0.20 | 화이트리스트 확장 후 |
| Summoner | bridgeCount >= 5 OR bridgeRatio >= 0.10 | bridgeCount >= **8** OR bridgeRatio >= **0.12** | L2 보편화 반영, 화이트리스트 확장 후 |
| Merchant | stableRatio >= 0.35 | stableRatio >= **0.25** | contractAddress 버그 수정 후에도 순수 스테이블 비율 낮음 |
| Priest | gasSpent > 0.5 AND contracts > 50 | gasSpent > **0.3** AND contracts > **30** | 도달 가능성 상향 |
| Elder Wizard | age >= 3y AND txPerYear < 50 | age >= **4**y AND txPerYear < **30**, **추가: balanceEth < 10** | 더 엄격, 대량 홀더는 Guardian으로 분화 |
| Guardian | txCount < 100 AND balance > 1 ETH | txCount < **200** AND balance > **5** ETH | 5 ETH로 "진정한 홀더"만 |
| Warrior | 디폴트 | 디폴트 (유지) | |

### 상수 변경 정리
```typescript
// 현재 → 변경
HUNTER_NFT_RATIO_THRESHOLD = 0.30 → 0.25
ROGUE_DEX_RATIO_THRESHOLD = 0.25 → 0.20
SUMMONER_BRIDGE_COUNT_THRESHOLD = 5 → 8
SUMMONER_BRIDGE_RATIO_THRESHOLD = 0.10 → 0.12
MERCHANT_STABLE_RATIO_THRESHOLD = 0.35 → 0.25
PRIEST_GAS_SPENT_THRESHOLD = 0.5 → 0.3
PRIEST_CONTRACT_INTERACTION_THRESHOLD = 50 → 30
ELDER_WIZARD_AGE_YEARS_THRESHOLD = 3 → 4
ELDER_WIZARD_TX_PER_YEAR_THRESHOLD = 50 → 30
ELDER_WIZARD_BALANCE_ETH_CEILING = (NEW) 10.0
GUARDIAN_TX_COUNT_THRESHOLD = 100 → 200
GUARDIAN_BALANCE_ETH_THRESHOLD = 1.0 → 5.0
```

### Hunter 추가 조건

```typescript
// 현재: nftRatio만 체크
(_raw, classification) =>
  classification.nftRatio >= HUNTER_NFT_RATIO_THRESHOLD ? HUNTER : null,

// 변경: nftRatio가 dexRatio보다 높을 때만 Hunter
(_raw, classification) =>
  classification.nftRatio >= HUNTER_NFT_RATIO_THRESHOLD &&
  classification.nftRatio > classification.dexRatio
    ? HUNTER : null,
```

### Elder Wizard 추가 조건

```typescript
// 현재
(raw, _classification, _balanceEth, walletAgeYears) =>
  walletAgeYears >= ELDER_WIZARD_AGE_YEARS_THRESHOLD &&
  walletAgeYears > 0 &&
  (raw.txCount / walletAgeYears) < ELDER_WIZARD_TX_PER_YEAR_THRESHOLD
    ? ELDER_WIZARD : null,

// 변경: 잔액 상한 추가 (대량 홀더는 Guardian으로)
(raw, _classification, balanceEth, walletAgeYears) =>
  walletAgeYears >= ELDER_WIZARD_AGE_YEARS_THRESHOLD &&
  walletAgeYears > 0 &&
  (raw.txCount / walletAgeYears) < ELDER_WIZARD_TX_PER_YEAR_THRESHOLD &&
  balanceEth < ELDER_WIZARD_BALANCE_ETH_CEILING
    ? ELDER_WIZARD : null,
```

---

## 7. PvP 스킬/패시브 조정

파일: `tasks/spec-pvp-battle.md` (스펙 업데이트)

### Elder Wizard (하향)

```
현재: Ancient Spell — INT*0.6 방어무시, MP 30, 쿨다운 2턴
변경: Ancient Spell — INT*0.45 마법 데미지 (방어의 50%만 적용), MP 35, 쿨다운 3턴

현재: Mana Well — 스킬 MP 20% 할인
변경: Mana Well — 스킬 MP 15% 할인
```

### Priest (하향)

```
현재: Blessing — 매 턴 3% max HP 회복
변경: Blessing — 매 턴 1.5% max HP 회복 + 전투 시작 시 max HP의 5% 즉시 회복

현재: Divine Shield — INT*0.3 힐, MP 20, 3턴 쿨다운
변경: Divine Shield — INT*0.3 힐 + 다음 턴 받는 데미지 20% 감소, MP 18, 3턴 쿨다운
```

### Merchant (리워크)

```
현재: Market Manipulation — 데미지 0, 상대 다음 공격 40% 감소, MP 25, 3턴 쿨다운
변경: Hostile Takeover — STR*0.25 데미지 + 상대 다음 공격 25% 감소 + 자신 다음 공격 15% 증가, MP 20, 3턴 쿨다운

현재: Gold Reserve — +20% MP
변경: Compound Interest — 4턴마다 MP 15% 회복 (최대 MP 기준)
```

### Rogue (상향)

```
현재: Arbitrage — 2타 STR*0.2, 2타에 30% 크릿, MP 20, 3턴 쿨다운
변경: Arbitrage — 2타 STR*0.25, 2타에 35% 크릿, 방어 1회만 적용 (합산 후 차감), MP 18, 3턴 쿨다운
```

### Hunter (조정)

```
현재: NFT Snipe — LUCK*0.4, LUCK > 상대면 보장크릿(100%), 아니면 0%, MP 18, 2턴 쿨다운
변경: NFT Snipe — LUCK*0.4 + STR*0.1 (하이브리드), LUCK > 상대면 80% 크릿, 아니면 25% 크릿, MP 18, 2턴 쿨다운
```

### Guardian (패시브 강화)

```
현재: Fortify — +20% defense (실질 +1, 무의미)
변경: Unbreakable — +20% defense + max HP의 20% 초과 데미지 50% 감소 (고데미지 스킬 내성)
```

### Warrior, Summoner — 변경 없음

---

## 8. 조정 후 예상 클래스 분포

| 클래스 | 현재 예상 | 조정 후 예상 | 변동 |
|--------|---------|------------|------|
| Hunter | 5-8% | 10-14% | 임계값 하향 + 복합유저 분리 |
| Rogue | 12-18% | 14-18% | 화이트리스트 확장 효과 |
| Summoner | 3-5% | 8-12% | 브릿지 화이트리스트 확장 |
| Merchant | 0-2% | 8-12% | STABLE 버그 수정 + 임계값 하향 |
| Priest | 15-25% | 10-14% | 임계값 상향, 일부가 다른 클래스로 |
| Elder Wizard | 10-15% | 5-8% | 조건 엄격화 (4년+, 잔액<10ETH) |
| Guardian | 5-8% | 8-12% | Elder Wizard에서 분화 유입 |
| Warrior | 30-40% | 15-20% | 화이트리스트 확장으로 분류 정확도 상승 |

### 바람직한 범위 달성 여부
목표: 각 클래스 8-18% (±5% 편차 허용)
조정 후: 5-20% 범위 → **대부분 목표 내, Elder Wizard만 5-8%로 의도적 희귀**

---

## 9. 조정 후 Power 시뮬레이션 비교

### 프로필 A: DeFi 파워유저 (Rogue)

| 스탯 | 현재 | 조정 후 |
|------|------|---------|
| Level | 28 | 28 (동일) |
| HP | 360 | 360 (동일) |
| MP | 200 | 200 (동일) |
| STR | 497 | 497 (동일) |
| INT | 425 | 425 (동일) |
| DEX | - | **365** (NEW: 125 tx/y) |
| LUCK | 184 | **251** (계수 120→180) |
| Power | 64,940 | **55,175** |

### 프로필 D: 고래 홀더 (Guardian — Elder Wizard에서 변경!)

100 ETH > 10 ETH ceiling → Elder Wizard 조건 불충족 → Guardian으로 재배정

| 스탯 | 현재 (Elder Wizard) | 조정 후 (Guardian) |
|------|---------------------|-------------------|
| Level | 15 | 15 (동일) |
| HP | 601 | 601 (동일) |
| MP | 93 | 93 (동일) |
| STR | 136 | 136 (동일) |
| INT | 222 | 222 (동일) |
| DEX | - | **172** (NEW: 5.5 tx/y) |
| LUCK | 196 | **269** (계수 상향) |
| ClassBonus | 8000 | **4000** (Guardian 변경) |
| Power | 44,600 | **39,305** |

### 프로필 C: 신규 유저 (Warrior)

| 스탯 | 현재 | 조정 후 |
|------|------|---------|
| Level | 14 | 14 (동일) |
| HP | 144 | 144 (동일) |
| MP | 82 | 82 (동일) |
| STR | 158 | 158 (동일) |
| INT | 190 | 190 (동일) |
| DEX | - | **292** (NEW: 40 tx/y) |
| LUCK | 98 | **122** (계수 상향) |
| ClassBonus | 3000 | **1500** |
| Power | 31,660 | **27,540** |

### 순위 변동

| 순위 | 현재 | 조정 후 |
|------|------|---------|
| 1 | DeFi 파워유저 (Rogue) 64,940 | DeFi 파워유저 (Rogue) 55,175 |
| 2 | NFT 수집가 (Hunter) 51,780 | 일반 유저 (Summoner) ~47,000 |
| 3 | 일반 유저 (Summoner) 50,500 | NFT 수집가 (Hunter) ~45,500 |
| 4 | 고래 홀더 (Elder Wizard) 44,600 | 고래 홀더 (**Guardian**) 39,305 |
| 5 | 신규 유저 (Warrior) 31,660 | 신규 유저 (Warrior) 27,540 |

**핵심 개선:**
- 1위와 5위 격차: 2.05x → 2.00x (근소하게 압축)
- 고래 홀더가 Elder Wizard → Guardian으로 재배정 (직관 일치)
- DEX 스탯이 각 프로필에 차별적 수치 제공

---

## 10. 구현 우선순위

| 순위 | 항목 | 파일 | 공수 |
|------|------|------|------|
| **P0** | STABLE 매칭 버그 수정 | classifier.ts:56-58 | 30m |
| **P0** | STAT_MAX_VALUES 조정 | themes.ts:88-94 | 10m |
| **P0** | DEX 스탯 추가 (타입+공식+테마) | types.ts, stats.ts, themes.ts | 1h |
| **P1** | Power 가중치 조정 | stats.ts:32-37 | 30m |
| **P1** | LUCK 계수 상향 | stats.ts:29 | 10m |
| **P1** | ClassBonus 재조정 | stats.ts:40-49 | 10m |
| **P1** | 프로토콜 화이트리스트 확장 (+18) | classifier.ts:7-31 | 30m |
| **P1** | 클래스 임계값 조정 | class.ts:6-16, 35-76 | 1h |
| **P2** | StatBar 컴포넌트에 DEX 추가 | StatBar.tsx | 30m |
| **P2** | CharacterCard에 DEX 표시 | CharacterCard.tsx | 30m |
| **P2** | OG/Card 이미지에 DEX 반영 | og/card routes | 1h |
| **P2** | PvP 스킬/패시브 스펙 업데이트 | spec-pvp-battle.md | 30m |
| **총합** | | | **~7h** |

---

## 11. 영향받는 파일 전체 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/lib/types.ts` | CharacterStats에 `dex` 필드 추가 |
| `src/lib/stats.ts` | DEX 계산, Power 가중치, LUCK 계수, ClassBonus |
| `src/lib/class.ts` | 임계값 상수, Hunter/Elder Wizard 매처 로직 |
| `src/lib/classifier.ts` | STABLE 버그 수정, 화이트리스트 확장 |
| `src/styles/themes.ts` | STAT_MAX_VALUES, STAT_COLORS |
| `src/components/StatBar.tsx` | DEX 바 렌더링 |
| `src/components/CharacterCard.tsx` | DEX 표시 |
| `src/app/api/og/[address]/route.tsx` | DEX 표시 |
| `src/app/api/card/[address]/route.tsx` | DEX 표시 |
| `tasks/spec-pvp-battle.md` | 스킬/패시브 수치 업데이트 |
| `CLAUDE.md` | Stat Formulas 섹션에 DEX 추가 |

---

*3명의 전략 에이전트(수학적 밸런스/PvP 전투/생태계 분석) 합의 기반, PM 최종 정리*
