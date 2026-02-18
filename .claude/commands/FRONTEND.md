# 🖥️ FRONTEND Developer Agent

## Role Definition
Developer implementing the entire frontend of Wallet RPG.
Responsible for landing page, address input UI, result screen, share functionality, and responsive design.

---

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 3.x
- **Language**: TypeScript
- **Deployment**: Vercel
- **State Management**: Minimized (React useState/useReducer is sufficient)

---

## Design System

### Color System (CSS Variables)
```css
:root {
  /* Primary - Dark Fantasy Tone */
  --color-bg-primary: #0a0a0f;        /* Main background (near-black) */
  --color-bg-secondary: #12121a;      /* Card/section background */
  --color-bg-tertiary: #1a1a2e;       /* Hover/active background */

  /* Accent */
  --color-accent-gold: #f4c430;       /* Power/level emphasis */
  --color-accent-blue: #4a9eff;       /* Links/CTA */
  --color-accent-purple: #8b5cf6;     /* MP (Mana) */
  --color-accent-red: #ef4444;        /* HP/warnings */
  --color-accent-green: #22c55e;      /* Success/LUCK */

  /* Text */
  --color-text-primary: #e8e8ed;      /* Body text */
  --color-text-secondary: #9ca3af;    /* Secondary text */
  --color-text-muted: #6b7280;        /* Inactive */

  /* Border */
  --color-border: #2a2a3e;            /* Default border */
  --color-border-accent: #f4c430;     /* Accent border */

  /* Class-specific theme colors */
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

### Font Settings
```css
/* English: Fantasy/game feel */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
/* Body/stat values */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
/* Korean support */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

:root {
  --font-display: 'Cinzel', serif;       /* Titles/character name/class name */
  --font-body: 'Inter', 'Noto Sans KR', sans-serif;  /* Body/stats */
  --font-mono: 'JetBrains Mono', monospace;           /* Wallet addresses */
}
```

### Font Size Scale
```
--text-xs: 0.75rem (12px)   → Supplementary info, timestamps
--text-sm: 0.875rem (14px)  → Secondary text, labels
--text-base: 1rem (16px)    → Body text
--text-lg: 1.125rem (18px)  → Emphasized body
--text-xl: 1.25rem (20px)   → Section titles
--text-2xl: 1.5rem (24px)   → In-card stat values
--text-3xl: 1.875rem (30px) → Class name
--text-4xl: 2.25rem (36px)  → Power number
--text-5xl: 3rem (48px)     → Hero title
```

---

## Page Implementation Guide

### 1. Landing Page (`/`)
```
Structure:
┌─────────────────────────────────┐
│ Trust message (top fixed banner) │
│ "Address lookup only · No       │
│  keys/signatures/connections"    │
├─────────────────────────────────┤
│                                 │
│    Eth·RPG Logo/Title           │
│    "What Hero Is Your Wallet?"  │
│                                 │
│    [0x... address input field]  │
│    [Summon Hero] button         │
│                                 │
│    Sample cards 3 (slide)       │
│                                 │
├─────────────────────────────────┤
│ FAQ 3 questions (accordion)     │
│ - Is my data safe?              │
│ - What data do you use?         │
│ - Is there a cost?              │
└─────────────────────────────────┘
```

**Key Rules:**
- Trust message stays fixed at top on scroll (sticky)
- Address input field centered, at 40% viewport height
- ENS name input also supported (vitalik.eth → address resolution)
- Input validation: 0x + 40 hex chars or .eth domain

### 2. Loading Screen (`/result/[address]` - loading state)
```
Structure:
┌─────────────────────────────────┐
│                                 │
│    Character silhouette anim    │
│    "Summoning hero..."          │
│    Progress bar (step-based)    │
│    - Analyzing transactions...  │
│    - Calculating stats...       │
│    - Determining class...       │
│    - Writing hero lore...       │
│                                 │
└─────────────────────────────────┘
```

### 3. Result Page (`/result/[address]`)
```
Structure:
┌─────────────────────────────────┐
│                                 │
│  ┌───────────────────────┐      │
│  │   Character Card (main)│      │
│  │   → See CARD_DESIGNER  │      │
│  └───────────────────────┘      │
│                                 │
│  Hero Lore (AI-generated line)  │
│                                 │
│  Stat Details (bar graph)       │
│  LV | HP | MP | STR | INT | LUCK│
│                                 │
│  ┌──────────┬──────────┐        │
│  │  Share    │ Challenge │        │
│  └──────────┴──────────┘        │
│                                 │
│  "Power {power}... what's yours"│
│  [Copy] button                  │
│                                 │
│  [Summon Another Wallet]        │
│                                 │
└─────────────────────────────────┘
```

---

## API Call Patterns

### Character Generation Request
```typescript
// POST /api/generate
interface GenerateRequest {
  address: string;  // 0x... or ENS
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
    name: string;      // 'Hunter'
    nameEn: string;    // 'Hunter'
  };
  lore: string;        // AI-generated hero lore
  cardImageUrl: string; // Rendered card image URL
  cached: boolean;      // Cache hit flag
}
```

### API Call Hook
```typescript
// hooks/useGenerateCharacter.ts
const useGenerateCharacter = () => {
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data: GenerateResponse | null;
    error: string | null;
    step: string;  // Loading step display
  }>({ status: 'idle', data: null, error: null, step: '' });

  const generate = async (address: string) => {
    setState({ status: 'loading', data: null, error: null, step: 'Analyzing transactions...' });
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

### Error Handling UI
```typescript
// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_ADDRESS': 'Please enter a valid Ethereum address.',
  'NO_TRANSACTIONS': 'This wallet has no transactions. Please enter an address with activity history.',
  'RATE_LIMITED': 'Too many requests. Please try again in a moment.',
  'API_ERROR': 'A temporary server issue occurred. Please try again shortly.',
  'TIMEOUT': 'Analysis is taking too long. Please try again.',
};
```

---

## Share Functionality Implementation

### OG Meta Tags (Dynamic)
```typescript
// app/result/[address]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `Eth·RPG | ${className} Lv.${level}`,
    description: lore,
    openGraph: {
      images: [`/api/og/${params.address}`],  // Dynamic OG image
      title: `My wallet Power ${power}... what's yours`,
      description: `${className} | Lv.${level} | Power ${power}`,
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og/${params.address}`],
    },
  };
}
```

### Share Buttons
```typescript
// Twitter share
const shareToTwitter = (data: GenerateResponse) => {
  const text = `My wallet Power ${data.stats.power}... what's yours? 🗡️\n${data.class.name} | Lv.${data.stats.level}\n\n`;
  const url = `${SITE_URL}/result/${data.address}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
};

// Farcaster share
const shareToFarcaster = (data: GenerateResponse) => {
  const text = `My wallet Power ${data.stats.power}... what's yours? 🗡️`;
  const url = `${SITE_URL}/result/${data.address}`;
  window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`);
};

// Clipboard copy
const copyShareText = (data: GenerateResponse) => {
  const text = `My wallet Power ${data.stats.power}... what's yours?\n${data.class.name} | Lv.${data.stats.level}\n${SITE_URL}/result/${data.address}`;
  navigator.clipboard.writeText(text);
};
```

---

## Responsive Breakpoints
```
Mobile: < 640px  → Card full-width, stats vertical layout
Tablet: 640-1024px → Card centered, stats grid
Desktop: > 1024px → Card left + stats right 2-column
```

---

## Performance Targets
- LCP (Largest Contentful Paint): < 2.5s
- Card render after generation: < 1s
- Bundle size: < 200KB (gzipped)
- Image optimization: Use Next.js Image component
