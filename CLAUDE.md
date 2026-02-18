# Eth·RPG — 당신의 지갑은 어떤 영웅입니까?

## 프로젝트 개요
이더리움 지갑 주소를 입력하면 온체인 트랜잭션을 분석해 RPG 캐릭터 카드를 생성하는 웹 서비스.
스탯(Level/HP/MP/STR/INT/LUCK) + 직업(8종) + AI 영웅 서사 + 전투력을 산출하고, 공유 가능한 카드 이미지를 렌더링한다.

---

## 기술 스택
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 3.x
- **Blockchain**: Alchemy SDK (ETH Mainnet)
- **AI**: Anthropic Claude API (영웅 서사 생성)
- **Image**: @vercel/og (Satori) — 카드/OG 이미지 서버사이드 렌더링
- **Deploy**: Vercel
- **Monitoring**: Sentry (무료 티어)
- **Cache**: In-memory Map (TTL 24h)

---

## 핵심 플로우
```
유저: 지갑 주소 입력 (0x... 또는 ENS)
  → 캐시 확인 (히트 시 즉시 반환)
  → Alchemy API: 잔고 + 트랜잭션 + 전송 내역 조회
  → 트랜잭션 분류: NFT/DEX/Bridge/Stable/Contract 비율 산출
  → 스탯 계산: log 스케일 공식 적용
  → 직업 판정: 8종 우선순위 매칭 (첫 매칭 확정)
  → AI 서사 생성: Claude API → 폴백 템플릿
  → 카드 이미지 렌더링: @vercel/og
  → 캐시 저장 + 응답 반환
유저: 카드 확인 → 공유 (Twitter/Farcaster/복사) → 바이럴 루프
```

---

## 직업 8종 (우선순위 순, 첫 매칭 확정)
1. **Hunter** — NFT 트랜잭션 비중 ≥ 30%
2. **Rogue** — DEX swap 비중 ≥ 25%
3. **Summoner** — Bridge tx ≥ 5회 또는 비중 ≥ 10%
4. **Merchant** — 스테이블코인 전송 비중 ≥ 35%
5. **Priest** — 가스 소모 높고 컨트랙트 상호작용 多
6. **Elder Wizard** — 첫 tx 3년+ 전 & 연간 tx 50건 미만
7. **Guardian** — 거래 100건 미만 & 잔고 1ETH+ (보유형)
8. **Warrior** — 위 조건 미해당 시 기본 클래스

## 스탯 공식
```
Level = clamp(1 + floor(10 × log10(1 + tx_count)), 1, 60)
HP    = round(100 + 250 × log10(1 + balance_eth))
MP    = round(80 + 220 × log10(1 + gas_spent_eth))
STR   = round(50 + 180 × log10(1 + dex_swap_count + bridge_count))
INT   = round(50 + 180 × log10(1 + unique_contracts))
LUCK  = round(50 + 120 × log10(1 + rare_events))
Power = Level×1000 + STR×30 + INT×30 + HP×10 + MP×10 + LUCK×20 + ClassBonus

ClassBonus = { hunter:0, rogue:0, summoner:2000, merchant:0, priest:0,
               elder_wizard:8000, guardian:6000, warrior:3000 }
```

---

## 디렉토리 구조
```
eth-rpg/
├── .claude/commands/       ← 에이전트 MD 파일
│   ├── pm.md
│   ├── frontend.md
│   ├── backend.md
│   ├── promeng.md
│   ├── qa.md
│   ├── uxreview.md
│   ├── card-designer.md
│   └── growth.md
├── CLAUDE.md               ← (이 파일)
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← 랜딩 (주소 입력)
│   │   ├── result/[address]/
│   │   │   └── page.tsx              ← 결과 (캐릭터 카드)
│   │   ├── api/
│   │   │   ├── generate/route.ts     ← 메인 API
│   │   │   ├── og/[address]/route.tsx ← OG 이미지
│   │   │   ├── card/[address]/route.tsx ← 공유용 카드 이미지
│   │   │   └── health/route.ts       ← 헬스체크
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── alchemy.ts               ← Alchemy SDK 연동
│   │   ├── classifier.ts            ← 트랜잭션 분류 엔진
│   │   ├── stats.ts                 ← 스탯 산출 로직
│   │   ├── class.ts                 ← 직업 판정 로직
│   │   ├── lore.ts                  ← AI 서사 생성 + 폴백
│   │   ├── cache.ts                 ← 인메모리 캐시
│   │   ├── rate-limit.ts            ← 레이트리밋
│   │   ├── crypto-events.ts         ← 크립토 이벤트 타임라인
│   │   └── types.ts                 ← 공용 타입 정의
│   ├── components/
│   │   ├── AddressInput.tsx          ← 주소 입력 컴포넌트
│   │   ├── CharacterCard.tsx         ← 결과 카드 (프론트 표시용)
│   │   ├── StatBar.tsx               ← 스탯 바 컴포넌트
│   │   ├── ShareButtons.tsx          ← 공유 버튼 그룹
│   │   ├── LoadingScreen.tsx         ← 로딩 화면
│   │   ├── TrustBanner.tsx           ← 신뢰 문구 배너
│   │   └── FAQ.tsx                   ← FAQ 아코디언
│   ├── hooks/
│   │   └── useGenerateCharacter.ts   ← 캐릭터 생성 훅
│   └── styles/
│       └── themes.ts                 ← 직업별 컬러/테마
├── public/
│   ├── favicon.ico
│   └── og-default.png                ← 기본 OG 이미지
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API 명세

### POST /api/generate
```typescript
// Request
{ address: string }  // "0x..." 또는 "vitalik.eth"

// Response (200)
{
  address: string,
  ensName?: string,
  stats: { level, hp, mp, str, int, luck, power },
  class: { id, name, nameEn },
  lore: string,
  cardImageUrl: string,
  ogImageUrl: string,
  cached: boolean
}

// Error (400/429/500)
{ error: { code: string, message: string } }
```

### GET /api/og/[address]
→ 1200×630 PNG (OG 이미지, 동적 생성)

### GET /api/card/[address]
→ 1080×1350 PNG (공유용 카드 이미지)

---

## 환경 변수 (.env.local)
```env
ALCHEMY_API_KEY=           # Alchemy API 키 (필수)
ANTHROPIC_API_KEY=         # Claude API 키 (필수)
NEXT_PUBLIC_SITE_URL=      # 사이트 URL (필수, OG/공유용)
SENTRY_DSN=                # Sentry DSN (선택)
```

---

## 에이전트 호출 규칙

| 작업 | 호출 |
|------|------|
| 일정/태스크/의사결정 | `/pm` |
| UI/페이지/컴포넌트 구현 | `/frontend` |
| API/파싱/스탯/캐싱 구현 | `/backend` |
| AI 서사 프롬프트 | `/promeng` |
| 카드/OG 이미지 렌더링 | `/card-designer` |
| 테스트/보안/버그 | `/qa` |
| 사용성/가독성/SEO | `/uxreview` |
| 런칭/시딩/지표 | `/growth` |

### 의존성 순서
```
backend (Alchemy+파싱+스탯+직업)
  → promeng (서사 생성)
  → card-designer (카드 렌더링)
  → frontend (UI 연동)
    → uxreview (사용성 검토)
    → qa (통합 테스트)
    → growth (런칭)
```

---

## 개발 순서 (7일 스프린트)

### Day 1-2: 코어 백엔드
1. 프로젝트 초기화 (Next.js + Tailwind + TypeScript)
2. `lib/alchemy.ts` — Alchemy SDK 연동, 데이터 수집
3. `lib/classifier.ts` — 트랜잭션 분류 (컨트랙트 화이트리스트)
4. `lib/stats.ts` — 스탯 산출 공식
5. `lib/class.ts` — 직업 판정 (8종 우선순위)
6. `lib/cache.ts` + `lib/rate-limit.ts`
7. `api/generate/route.ts` — 메인 API (AI 서사 제외, 뼈대)

### Day 3: AI + 비주얼
8. `lib/lore.ts` — Claude API 서사 생성 + 폴백 템플릿
9. `lib/crypto-events.ts` — 이벤트 타임라인
10. `api/og/[address]/route.tsx` — OG 이미지
11. `api/card/[address]/route.tsx` — 공유 카드 이미지
12. `styles/themes.ts` — 직업별 컬러 테마

### Day 4: 프론트엔드
13. `app/page.tsx` — 랜딩 (TrustBanner + AddressInput + FAQ)
14. `app/result/[address]/page.tsx` — 결과 (CharacterCard + StatBar + ShareButtons)
15. `components/LoadingScreen.tsx`
16. `hooks/useGenerateCharacter.ts`
17. 동적 메타태그 (OG)

### Day 5: 안정화
18. 전체 플로우 연결 테스트
19. 에러 핸들링 보강
20. Sentry 연동
21. 반응형 대응 (모바일/태블릿)
22. Trust 문구 상단 고정

### Day 6: 배포 + 런칭
23. Vercel 배포
24. 도메인 연결
25. OG 미리보기 테스트
26. CT/Farcaster 시딩 시작

### Day 7: 시딩 + 데이터
27. 크립토 커뮤니티 시딩 (20곳)
28. 핫픽스 대응
29. 성과 데이터 수집

---

## 핵심 규칙

### 코딩
- TypeScript strict 모드
- 모든 함수에 타입 명시
- API 응답은 표준 형식 (success/error)
- console.log 대신 구조화된 로깅
- 하드코딩된 매직 넘버 금지 → 상수/config로 분리

### 스코프
- "있으면 좋겠다" → 무조건 v1.1 백로그
- 멀티체인 지원 → v2.0
- 유저 로그인/지갑 연결 → 안 함
- 실시간 랭킹 → 안 함 (부하/악용 리스크)
- 금융 코멘트 → 안 함 (법적 리스크)

### 보안
- 지갑 연결/서명 절대 요구하지 않음
- 서버에 주소 외 개인정보 저장하지 않음
- API 키는 서버사이드에서만 사용
- 유저 입력은 항상 검증 (주소 포맷, 길이, 특수문자)

### 비주얼
- 다크 판타지 톤 (배경 #0a0a0f ~ #12121a)
- 전투력은 항상 가장 크고 금색 (#f4c430)
- 직업별 테마 컬러 적용
- 카드 이미지는 공유했을 때 피드에서 눈에 띄어야 함