# 🖥️ FRONTEND Developer Agent

## 역할 정의
Wallet RPG의 전체 프론트엔드를 구현하는 개발자.
랜딩 페이지, 주소 입력 UI, 결과 화면, 공유 기능, 반응형 대응을 담당한다.

---

## 기술 스택
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 3.x
- **Language**: TypeScript
- **배포**: Vercel
- **상태관리**: 최소화 (React useState/useReducer로 충분)

---

## 디자인 시스템

### 컬러 시스템 (CSS Variables)
```css
:root {
  /* Primary - 다크 판타지 톤 */
  --color-bg-primary: #0a0a0f;        /* 메인 배경 (거의 블랙) */
  --color-bg-secondary: #12121a;      /* 카드/섹션 배경 */
  --color-bg-tertiary: #1a1a2e;       /* 호버/액티브 배경 */
  
  /* Accent */
  --color-accent-gold: #f4c430;       /* 전투력/레벨 강조 */
  --color-accent-blue: #4a9eff;       /* 링크/CTA */
  --color-accent-purple: #8b5cf6;     /* 마력(MP) */
  --color-accent-red: #ef4444;        /* HP/경고 */
  --color-accent-green: #22c55e;      /* 성공/LUCK */
  
  /* Text */
  --color-text-primary: #e8e8ed;      /* 본문 */
  --color-text-secondary: #9ca3af;    /* 보조 텍스트 */
  --color-text-muted: #6b7280;        /* 비활성 */
  
  /* Border */
  --color-border: #2a2a3e;            /* 기본 보더 */
  --color-border-accent: #f4c430;     /* 강조 보더 */

  /* 직업별 테마 컬러 */
  --color-class-hunter: #22c55e;
  --color-class-rogue: #ef4444;
  --color-class-summoner: #8b5cf6;
  --color-class-merchant: #f4c430;
  --color-class-priest: #60a5fa;
  --color-class-elder-wizard: #a78bfa;
  --color-class-guardian: #f97316;
  --color-class-warrior: #94a3b8;
}
```

### 폰트 설정
```css
/* 영문: 판타지/게임 느낌 */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
/* 본문/스탯 수치 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
/* 한글 지원 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

:root {
  --font-display: 'Cinzel', serif;       /* 제목/캐릭터명/직업명 */
  --font-body: 'Inter', 'Noto Sans KR', sans-serif;  /* 본문/스탯 */
  --font-mono: 'JetBrains Mono', monospace;           /* 지갑 주소 */
}
```

### 폰트 사이즈 체계
```
--text-xs: 0.75rem (12px)   → 부가 정보, 타임스탬프
--text-sm: 0.875rem (14px)  → 보조 텍스트, 레이블
--text-base: 1rem (16px)    → 본문
--text-lg: 1.125rem (18px)  → 강조 본문
--text-xl: 1.25rem (20px)   → 섹션 제목
--text-2xl: 1.5rem (24px)   → 카드 내 스탯 수치
--text-3xl: 1.875rem (30px) → 직업명
--text-4xl: 2.25rem (36px)  → 전투력 숫자
--text-5xl: 3rem (48px)     → 히어로 타이틀
```

---

## 페이지별 구현 가이드

### 1. 랜딩 페이지 (`/`)
```
구조:
┌─────────────────────────────────┐
│ Trust 문구 (상단 고정 배너)         │
│ "주소만 조회 · 키/서명/연결 없음"     │
├─────────────────────────────────┤
│                                 │
│    Eth·RPG 로고/타이틀            │
│    "당신의 지갑은 어떤 영웅입니까?"    │
│                                 │
│    [0x... 주소 입력 필드]          │
│    [영웅 소환하기] 버튼             │
│                                 │
│    샘플 카드 3장 (슬라이드)         │
│                                 │
├─────────────────────────────────┤
│ FAQ 3문항 (아코디언)              │
│ - 개인정보 안전한가요?              │
│ - 어떤 데이터를 사용하나요?          │
│ - 비용이 있나요?                  │
└─────────────────────────────────┘
```

**핵심 규칙:**
- Trust 문구는 스크롤해도 상단 고정 (sticky)
- 주소 입력 필드는 화면 중앙, 뷰포트 높이 40% 지점
- ENS 이름 입력도 지원 (vitalik.eth → 주소 리졸브)
- 입력 validation: 0x + 40자 hex 또는 .eth 도메인

### 2. 로딩 화면 (`/result/[address]` - 로딩 상태)
```
구조:
┌─────────────────────────────────┐
│                                 │
│    캐릭터 실루엣 애니메이션         │
│    "영웅을 소환하는 중..."          │
│    프로그레스 바 (단계별)            │
│    - 트랜잭션 분석 중...           │
│    - 스탯 계산 중...              │
│    - 직업 판정 중...              │
│    - 영웅 서사 작성 중...          │
│                                 │
└─────────────────────────────────┘
```

### 3. 결과 페이지 (`/result/[address]`)
```
구조:
┌─────────────────────────────────┐
│                                 │
│  ┌───────────────────────┐      │
│  │   캐릭터 카드 (메인)    │      │
│  │   → CARD_DESIGNER 참조 │      │
│  └───────────────────────┘      │
│                                 │
│  영웅 서사 (AI 생성 한 줄)         │
│                                 │
│  스탯 상세 (바 그래프)             │
│  LV | HP | MP | STR | INT | LUCK │
│                                 │
│  ┌──────────┬──────────┐        │
│  │ 공유하기   │ 친구 도전  │        │
│  └──────────┴──────────┘        │
│                                 │
│  "전투력 {power}… 너는 몇이냐"     │
│  [복사] 버튼                      │
│                                 │
│  [다른 지갑 소환하기]               │
│                                 │
└─────────────────────────────────┘
```

---

## API 호출 패턴

### 캐릭터 생성 요청
```typescript
// POST /api/generate
interface GenerateRequest {
  address: string;  // 0x... 또는 ENS
}

interface GenerateResponse {
  address: string;
  ensName?: string;
  stats: {
    level: number;
    hp: number;
    mp: number;
    str: number;
    int: number;
    luck: number;
    power: number;
  };
  class: {
    id: string;       // 'hunter' | 'rogue' | 'summoner' | ...
    name: string;      // '헌터(Hunter)'
    nameEn: string;    // 'Hunter'
  };
  lore: string;        // AI 생성 영웅 서사
  cardImageUrl: string; // 렌더링된 카드 이미지 URL
  cached: boolean;      // 캐시 히트 여부
}
```

### API 호출 훅
```typescript
// hooks/useGenerateCharacter.ts
const useGenerateCharacter = () => {
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data: GenerateResponse | null;
    error: string | null;
    step: string;  // 로딩 단계 표시용
  }>({ status: 'idle', data: null, error: null, step: '' });

  const generate = async (address: string) => {
    setState({ status: 'loading', data: null, error: null, step: '트랜잭션 분석 중...' });
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Generation failed');
      }
      const data: GenerateResponse = await res.json();
      setState({ status: 'success', data, error: null, step: '' });
    } catch (e) {
      setState({ status: 'error', data: null, error: (e as Error).message, step: '' });
    }
  };

  return { ...state, generate };
};
```

### 에러 핸들링 UI
```typescript
// 에러 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_ADDRESS': '올바른 이더리움 주소를 입력해주세요.',
  'NO_TRANSACTIONS': '이 지갑에는 트랜잭션이 없습니다. 활동 이력이 있는 주소를 입력해주세요.',
  'RATE_LIMITED': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'API_ERROR': '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'TIMEOUT': '분석에 시간이 오래 걸리고 있습니다. 다시 시도해주세요.',
};
```

---

## 공유 기능 구현

### OG 메타태그 (동적)
```typescript
// app/result/[address]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `Eth·RPG | ${className} Lv.${level}`,
    description: lore,
    openGraph: {
      images: [`/api/og/${params.address}`],  // 동적 OG 이미지
      title: `내 지갑 전투력 ${power} — 너는 몇이냐`,
      description: `${className} | Lv.${level} | Power ${power}`,
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og/${params.address}`],
    },
  };
}
```

### 공유 버튼
```typescript
// 트위터 공유
const shareToTwitter = (data: GenerateResponse) => {
  const text = `내 지갑 전투력 ${data.stats.power}… 너는 몇이냐 🗡️\n${data.class.name} | Lv.${data.stats.level}\n\n`;
  const url = `${SITE_URL}/result/${data.address}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
};

// Farcaster 공유
const shareToFarcaster = (data: GenerateResponse) => {
  const text = `내 지갑 전투력 ${data.stats.power}… 너는 몇이냐 🗡️`;
  const url = `${SITE_URL}/result/${data.address}`;
  window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
};

// 클립보드 복사
const copyShareText = (data: GenerateResponse) => {
  const text = `내 지갑 전투력 ${data.stats.power}… 너는 몇이냐\n${data.class.name} | Lv.${data.stats.level}\n${SITE_URL}/result/${data.address}`;
  navigator.clipboard.writeText(text);
};
```

---

## 반응형 브레이크포인트
```
모바일: < 640px  → 카드 풀 너비, 스탯 세로 배열
태블릿: 640-1024px → 카드 중앙 고정, 스탯 그리드
데스크탑: > 1024px → 카드 좌측 + 스탯 우측 2컬럼
```

---

## 성능 기준
- LCP (Largest Contentful Paint): < 2.5s
- 카드 생성 후 렌더링: < 1s
- 번들 사이즈: < 200KB (gzipped)
- 이미지 최적화: Next.js Image 컴포넌트 사용
