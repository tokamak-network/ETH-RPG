# 🚀 PM Kickoff — 전체 프로젝트 자동 진행

> 이 커맨드를 실행하면 PM이 오케스트레이터로서 모든 에이전트를 순서대로 호출하며 프로젝트를 완성한다.
> 각 단계를 완료한 뒤 다음 단계로 자동 진행한다. 에러 발생 시 해당 단계에서 수정 후 계속한다.

---

## 실행 규칙

너는 PM(프로젝트 매니저)이다. 아래 파이프라인을 위에서 아래로 순서대로 실행한다.

**작업 방식:**
1. 각 STEP을 시작할 때 해당 에이전트 MD 파일(`.claude/commands/`)을 먼저 읽는다
2. 에이전트 MD에 정의된 규칙/코드/패턴을 따라 구현한다
3. 각 STEP 완료 후 체크포인트를 출력한다: `✅ STEP N 완료 — {요약}`
4. 에러/이슈 발생 시 즉시 수정하고 계속 진행한다
5. 모든 코드는 실제로 파일을 생성/수정한다 (설명만 하지 않는다)
6. 절대 유저에게 "다음에 뭘 할까요?" 묻지 않는다. 알아서 다음 STEP으로 넘어간다

---

## PIPELINE

### STEP 0: 프로젝트 초기화
```
액션:
- Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind)
- package.json에 의존성 추가: alchemy-sdk, @vercel/og, @sentry/nextjs
- tsconfig.json strict 모드
- .env.local 템플릿 생성
- .gitignore 설정 (.env* 포함)
- CLAUDE.md의 디렉토리 구조대로 폴더 생성

체크포인트: `npm run dev` 실행 시 빈 페이지 정상 표시
```

### STEP 1: 공용 타입 정의
```
참조: .claude/commands/backend.md
액션:
- src/lib/types.ts 생성
  - WalletRawData, TxClassification, CharacterStats, CharacterClass
  - ClassResult, LoreInputData, GenerateResponse, ErrorCode
  - API 요청/응답 타입 전부 여기에 정의

체크포인트: 타입 파일이 에러 없이 컴파일
```

### STEP 2: Alchemy API 연동
```
참조: .claude/commands/backend.md → "Alchemy API 연동" 섹션
액션:
- src/lib/alchemy.ts 생성
  - Alchemy SDK 초기화
  - fetchWalletData() 함수: 잔고 + txCount + 전송내역 + 가스비 추정 + 최초 tx 시점
  - ENS 리졸브 지원

체크포인트: vitalik.eth 입력 시 WalletRawData 정상 반환 (콘솔 로그로 확인)
```

### STEP 3: 트랜잭션 분류 엔진
```
참조: .claude/commands/backend.md → "트랜잭션 분류" 섹션
액션:
- src/lib/classifier.ts 생성
  - PROTOCOL_MAP (DEX/NFT/Bridge/Stable 컨트랙트 화이트리스트)
  - classifyTransactions() 함수: 비율/횟수 산출

체크포인트: 테스트 주소로 분류 결과가 합리적인 비율 반환
```

### STEP 4: 스탯 산출 + 직업 판정
```
참조: .claude/commands/backend.md → "스탯 산출 공식", "직업 판정" 섹션
액션:
- src/lib/stats.ts — calculateStats() (log 스케일 공식)
- src/lib/class.ts — determineClass() (8종 우선순위 매칭)

체크포인트: 다양한 지갑에서 스탯/직업이 합리적으로 산출
```

### STEP 5: 캐싱 + 레이트리밋
```
참조: .claude/commands/backend.md → "캐싱 로직", "레이트리밋" 섹션
액션:
- src/lib/cache.ts — MemoryCache (TTL 24h, max 10,000)
- src/lib/rate-limit.ts — IP 기준 분당 5회

체크포인트: 동일 주소 2회 요청 시 2번째는 캐시 히트
```

### STEP 6: 크립토 이벤트 타임라인
```
참조: .claude/commands/backend.md → "크립토 이벤트 타임라인"
참조: .claude/commands/promeng.md → "크립토 이벤트 → RPG 치환 사전"
액션:
- src/lib/crypto-events.ts — 이벤트 목록 + getRelevantEvents() + describeActivityPattern()

체크포인트: 2021~2025 활동 지갑에서 관련 이벤트 정상 필터링
```

### STEP 7: AI 서사 생성
```
참조: .claude/commands/promeng.md → 전체
액션:
- src/lib/lore.ts
  - LORE_SYSTEM_PROMPT, LORE_USER_PROMPT
  - generateLore() — Claude API 호출
  - generateFallbackLore() — 직업별 템플릿 폴백
  - 출력 검증 (80자 제한, 금지어 체크)

체크포인트: 서사 생성 성공 + API 실패 시 폴백 정상 작동
```

### STEP 8: 메인 API 엔드포인트
```
참조: .claude/commands/backend.md → 전체 플로우
액션:
- src/app/api/generate/route.ts
  - POST 핸들러: 입력검증 → 캐시 → Alchemy → 분류 → 스탯 → 직업 → 서사 → 응답
  - 에러 코드별 적절한 HTTP 상태
  - 레이트리밋 미들웨어 적용
- src/app/api/health/route.ts

체크포인트: curl로 /api/generate 호출 시 전체 GenerateResponse 정상 반환
```

### STEP 9: 직업별 테마 + 디자인 토큰
```
참조: .claude/commands/card-designer.md → "직업별 비주얼 테마"
참조: .claude/commands/frontend.md → "디자인 시스템"
액션:
- src/styles/themes.ts — CLASS_THEMES (8종 컬러/그라데이션/아이콘/glow)
- src/app/globals.css — CSS 변수 (컬러/폰트/간격)
- tailwind.config.ts — 커스텀 컬러/폰트 확장
- Google Fonts import (Cinzel + Inter + Noto Sans KR + JetBrains Mono)

체크포인트: 테마 객체가 타입 안전하게 import 가능
```

### STEP 10: 카드 이미지 + OG 이미지 렌더링
```
참조: .claude/commands/card-designer.md → 전체
액션:
- src/app/api/og/[address]/route.tsx — OG 이미지 (1200×630)
- src/app/api/card/[address]/route.tsx — 공유 카드 (1080×1350)
- 스탯 바 렌더링 함수
- 직업별 테마 적용

체크포인트: /api/og/vitalik.eth → 이미지 정상 반환
```

### STEP 11: 프론트엔드 컴포넌트
```
참조: .claude/commands/frontend.md → 전체
액션:
- src/components/TrustBanner.tsx — 상단 고정 신뢰 문구
- src/components/AddressInput.tsx — 주소 입력 (0x + ENS, 엔터 제출, validation)
- src/components/LoadingScreen.tsx — 단계별 로딩 메시지
- src/components/CharacterCard.tsx — 결과 카드 (직업/스탯/서사/전투력)
- src/components/StatBar.tsx — 스탯 바 (애니메이션)
- src/components/ShareButtons.tsx — Twitter/Farcaster/복사
- src/components/FAQ.tsx — 아코디언 3문항
- src/hooks/useGenerateCharacter.ts — API 호출 훅

체크포인트: 각 컴포넌트가 독립 렌더링 가능
```

### STEP 12: 페이지 조립
```
참조: .claude/commands/frontend.md → "페이지별 구현 가이드"
액션:
- src/app/page.tsx — 랜딩 (TrustBanner + 히어로 + AddressInput + 샘플카드 + FAQ)
- src/app/result/[address]/page.tsx — 결과 (CharacterCard + StatBar + ShareButtons + 재입력 CTA)
- src/app/layout.tsx — 루트 레이아웃 (메타태그, 폰트, 글로벌 스타일)
- 동적 메타데이터 (generateMetadata) — OG 이미지 연동

체크포인트: 전체 플로우 (주소 입력 → 로딩 → 결과 → 공유) 브라우저에서 정상 작동
```

### STEP 13: 반응형 + 다크모드
```
참조: .claude/commands/frontend.md → "반응형 브레이크포인트"
참조: .claude/commands/uxreview.md → "반응형 & 기기별"
액션:
- 모바일 (375px): 카드 풀너비, 스탯 세로
- 태블릿 (768px): 카드 중앙, 스탯 그리드
- 데스크탑 (1024px+): 카드 좌측 + 스탯 우측
- 입력 필드 16px (iOS 줌 방지)
- 다크 테마 기본 (판타지 톤)

체크포인트: 모바일 뷰에서 카드/스탯/공유 버튼 정상 표시
```

### STEP 14: 에러 핸들링 + Sentry
```
참조: .claude/commands/backend.md → "에러 코드 체계"
참조: .claude/commands/qa.md → "위기 대응 테스트"
액션:
- 각 API 라우트에 try/catch + 적절한 에러 코드
- 프론트: ERROR_MESSAGES 매핑, 에러 UI 표시
- Sentry 초기화 (SENTRY_DSN 있을 때만)
- 트랜잭션 0 지갑 → 전용 빈 상태 화면
- 유효하지 않은 주소 → 인라인 에러

체크포인트: 잘못된 주소, 빈 지갑, 서버 에러 각각 적절한 UI 표시
```

### STEP 15: 최종 QA
```
참조: .claude/commands/qa.md → 전체
참조: .claude/commands/uxreview.md → 전체
액션:
- 테스트 주소 5개 이상으로 전체 플로우 수동 검증
  - 고래 (vitalik.eth)
  - 신규 지갑 (tx < 5)
  - 트랜잭션 0 지갑
  - NFT 중심 지갑
  - DeFi 중심 지갑
- 보안 7항목 점검 (API 키 노출, 입력 검증 등)
- OG 이미지 정상 확인
- 공유 링크 → 결과 페이지 직접 접근 확인
- build 에러 없이 `npm run build` 성공

체크포인트: `npm run build` 성공 + 전체 플로우 정상
```

### STEP 16: 배포 준비
```
액션:
- next.config.ts 최종 점검 (이미지 도메인, 환경변수 등)
- Vercel 배포용 설정 확인
- 환경 변수 목록 정리 (유저에게 안내)
- README.md 생성 (프로젝트 설명 + 설치 + 환경변수 + 배포)

체크포인트: 프로젝트가 배포 가능한 상태
```

---

## 진행 중 원칙

### 자동 진행
- 각 STEP 완료 후 멈추지 않고 다음 STEP으로 바로 넘어간다
- "다음에 뭘 할까요?" 절대 묻지 않는다
- 유저 입력이 필요한 경우(API 키 등)만 잠시 멈추고, 나머지는 전부 자동 진행

### 에러 처리
- 코드 에러 발생 → 즉시 수정 후 계속
- 패키지 설치 실패 → 대안 시도 후 계속
- 타입 에러 → 즉시 수정 후 계속
- 3회 이상 동일 에러 반복 → 유저에게 보고 후 다음 STEP으로 스킵

### 코드 품질
- 모든 코드는 TypeScript strict
- 매직 넘버 금지 → 상수로 분리
- 주석은 "왜(Why)" 만 작성, "무엇(What)"은 코드로 표현
- 각 파일 상단에 한 줄 설명 주석

---

## 시작

위 파이프라인을 STEP 0부터 순서대로 실행한다. 지금 바로 시작.
