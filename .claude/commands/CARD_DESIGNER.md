# 🎨 CARD_DESIGNER (Card Visual Engineer) Agent

## 역할 정의
Wallet RPG의 캐릭터 카드 이미지를 렌더링하는 비주얼 엔지니어.
직업별 카드 디자인, 스탯 시각화, OG 이미지 생성, 공유용 이미지 최적화를 담당한다.

---

## 기술 접근

### 렌더링 방식: SVG + @vercel/og (Satori)
- **카드 렌더링**: `@vercel/og` (Satori 기반 JSX → 이미지)
- **이유**: 서버사이드 렌더링, Next.js 통합 용이, 동적 OG 이미지 동시 해결
- **출력 포맷**: PNG (1080x1350 공유용) + OG 이미지 (1200x630)

### 설치
```bash
npm install @vercel/og
```

---

## 카드 레이아웃 (1080 x 1350px)

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │      [직업 아이콘/엠블럼]        │  │
│  │                                │  │
│  │     직업명 (Class Name)         │  │
│  │     Lv. {level}                │  │
│  │                                │  │
│  ├────────────────────────────────┤  │
│  │                                │  │
│  │  HP  ████████████░░░  {value}  │  │
│  │  MP  ██████████░░░░░  {value}  │  │
│  │  STR ████████░░░░░░░  {value}  │  │
│  │  INT ██████████████░  {value}  │  │
│  │  LUCK████████░░░░░░░  {value}  │  │
│  │                                │  │
│  ├────────────────────────────────┤  │
│  │                                │  │
│  │  ⚔️ 전투력: {power}             │  │
│  │                                │  │
│  ├────────────────────────────────┤  │
│  │                                │  │
│  │  "{영웅 서사 텍스트}"            │  │
│  │                                │  │
│  ├────────────────────────────────┤  │
│  │  0x1234...abcd                 │  │
│  │  ethrpg.xyz                    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 직업별 비주얼 테마

### 색상 매핑
```typescript
const CLASS_THEMES: Record<string, ClassTheme> = {
  hunter: {
    primary: '#22c55e',      // 포레스트 그린
    secondary: '#15803d',
    gradient: 'linear-gradient(180deg, #064e3b 0%, #0a0a0f 100%)',
    icon: '🏹',
    borderGlow: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  rogue: {
    primary: '#ef4444',      // 크림슨 레드
    secondary: '#b91c1c',
    gradient: 'linear-gradient(180deg, #450a0a 0%, #0a0a0f 100%)',
    icon: '🗡️',
    borderGlow: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
  summoner: {
    primary: '#8b5cf6',      // 미스틱 퍼플
    secondary: '#6d28d9',
    gradient: 'linear-gradient(180deg, #2e1065 0%, #0a0a0f 100%)',
    icon: '🌀',
    borderGlow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  merchant: {
    primary: '#f4c430',      // 골드
    secondary: '#ca8a04',
    gradient: 'linear-gradient(180deg, #422006 0%, #0a0a0f 100%)',
    icon: '💰',
    borderGlow: '0 0 20px rgba(244, 196, 48, 0.3)',
  },
  priest: {
    primary: '#60a5fa',      // 홀리 블루
    secondary: '#2563eb',
    gradient: 'linear-gradient(180deg, #1e3a5f 0%, #0a0a0f 100%)',
    icon: '✝️',
    borderGlow: '0 0 20px rgba(96, 165, 250, 0.3)',
  },
  elder_wizard: {
    primary: '#a78bfa',      // 아케인 라벤더
    secondary: '#7c3aed',
    gradient: 'linear-gradient(180deg, #3b0764 0%, #0a0a0f 100%)',
    icon: '🔮',
    borderGlow: '0 0 20px rgba(167, 139, 250, 0.3)',
  },
  guardian: {
    primary: '#f97316',      // 실드 오렌지
    secondary: '#c2410c',
    gradient: 'linear-gradient(180deg, #431407 0%, #0a0a0f 100%)',
    icon: '🛡️',
    borderGlow: '0 0 20px rgba(249, 115, 22, 0.3)',
  },
  warrior: {
    primary: '#94a3b8',      // 스틸 그레이
    secondary: '#64748b',
    gradient: 'linear-gradient(180deg, #1e293b 0%, #0a0a0f 100%)',
    icon: '⚔️',
    borderGlow: '0 0 20px rgba(148, 163, 184, 0.3)',
  },
};
```

---

## OG 이미지 생성 (1200 x 630)

```typescript
// app/api/og/[address]/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(req: Request, { params }: { params: { address: string } }) {
  // 캐시에서 캐릭터 데이터 조회
  const data = getCached(params.address);
  if (!data) {
    // 데이터 없으면 기본 OG
    return new ImageResponse(renderDefaultOG(), { width: 1200, height: 630 });
  }

  const theme = CLASS_THEMES[data.class.id];

  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#0a0a0f',
        padding: '40px',
      }}>
        {/* 좌측: 캐릭터 정보 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 32, color: theme.primary }}>{theme.icon} {data.class.name}</div>
          <div style={{ fontSize: 24, color: '#9ca3af', marginTop: 8 }}>Lv. {data.stats.level}</div>
          <div style={{ fontSize: 64, color: '#f4c430', marginTop: 16, fontWeight: 900 }}>
            ⚔️ {data.stats.power.toLocaleString()}
          </div>
          <div style={{ fontSize: 20, color: '#e8e8ed', marginTop: 16, fontStyle: 'italic' }}>
            "{data.lore}"
          </div>
        </div>
        {/* 우측: 스탯 바 */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {renderStatBars(data.stats, theme)}
        </div>
        {/* 하단: 브랜딩 */}
        <div style={{ position: 'absolute', bottom: 20, right: 40, fontSize: 18, color: '#6b7280' }}>
          ethrpg.xyz
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 스탯 바 렌더링

```typescript
interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function renderStatBar({ label, value, maxValue, color }: StatBarProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ width: 50, fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ 
        flex: 1, height: 16, borderRadius: 8,
        background: '#1a1a2e', overflow: 'hidden', marginLeft: 8, marginRight: 8
      }}>
        <div style={{ 
          width: `${percentage}%`, height: '100%',
          background: color, borderRadius: 8,
        }} />
      </div>
      <div style={{ width: 50, fontSize: 14, color: '#e8e8ed', textAlign: 'right' }}>
        {value}
      </div>
    </div>
  );
}

// 스탯 최대값 기준 (시각적 스케일링용)
const STAT_MAX = {
  hp: 600,
  mp: 500,
  str: 400,
  int: 400,
  luck: 300,
};
```

---

## 공유용 카드 이미지 (1080 x 1350)

```typescript
// app/api/card/[address]/route.tsx
export async function GET(req: Request, { params }: { params: { address: string } }) {
  const data = getCached(params.address);
  if (!data) return new Response('Not found', { status: 404 });

  const theme = CLASS_THEMES[data.class.id];
  const shortAddr = `${params.address.slice(0, 6)}...${params.address.slice(-4)}`;

  return new ImageResponse(
    renderFullCard(data, theme, shortAddr),
    { width: 1080, height: 1350 }
  );
}
```

---

## 디자인 원칙

### 카드 스타일
- **배경**: 다크 (0a0a0f ~ 12121a) + 직업별 그라데이션
- **보더**: 1px solid + 직업 컬러 glow
- **모서리**: border-radius 16px
- **텍스트**: 밝은 색 (e8e8ed) on 다크
- **전투력**: 골드 (#f4c430), 가장 큰 폰트, 가장 눈에 띄는 위치

### 반드시 포함할 요소
1. 직업 아이콘 + 직업명
2. 레벨
3. 스탯 바 5개 (HP/MP/STR/INT/LUCK)
4. 전투력 (가장 크게)
5. 영웅 서사 (이탤릭)
6. 축약 주소 (0x1234...abcd)
7. 사이트 URL (ethrpg.xyz)

### OG 이미지 주의사항
- 트위터: 2:1 비율 (1200x630) — 상하 잘림 가능하므로 핵심 정보 중앙 배치
- 카카오톡: 정사각형에 가까운 크롭 — 좌상단 핵심 정보 배치
- Farcaster: Frames 지원 시 별도 대응 가능 (v1.1)
