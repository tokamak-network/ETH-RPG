# Eth·RPG — What Kind of Hero Is Your Wallet?

## Project Overview
A web service that analyzes on-chain transactions from an Ethereum wallet address and generates an RPG character card.
It calculates stats (Level/HP/MP/STR/INT/LUCK) + class (8 types) + AI hero lore + combat power, and renders a shareable card image.

Two entry paths:
1. **Direct wallet entry** — paste address/ENS → generate card
2. **Personality quiz** — 5 questions predict class → "verify with your wallet" → generate card

---

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 3.x
- **Blockchain**: Alchemy SDK (ETH Mainnet)
- **AI**: Anthropic Claude API (hero lore generation)
- **Image**: @vercel/og (Satori) — server-side card/OG image rendering
- **Deploy**: Vercel
- **Monitoring**: Sentry (free tier)
- **Cache**: In-memory Map (TTL 24h)

---

## Core Flow
```
User: Enter wallet address (0x... or ENS)
  -> Check cache (return immediately on hit)
  -> Alchemy API: Fetch balance + transactions + transfer history
  -> Transaction classification: Calculate NFT/DEX/Bridge/Stable/Contract ratios
  -> Stat calculation: Apply log-scale formulas
  -> Class determination: 8-class priority matching (first match wins)
  -> AI lore generation: Claude API -> fallback template
  -> Card image rendering: @vercel/og
  -> Save to cache + return response
User: View card -> Share (Twitter/Farcaster/copy) -> Viral loop

Alternative entry (quiz):
User: Take quiz (5 questions, no wallet needed)
  -> Client-side class weight scoring (quiz-engine.ts)
  -> Show predicted class + confidence
  -> CTA: "Verify with your wallet" -> Enter wallet -> Standard flow above
```

---

## 8 Classes (Priority Order, First Match Wins)
1. **Hunter** — NFT ratio >= 25% AND nftRatio > dexRatio
2. **Rogue** — DEX swap ratio >= 20%
3. **Summoner** — Bridge tx >= 8 or ratio >= 12%
4. **Merchant** — Stablecoin transfer ratio >= 25%
5. **Priest** — Gas spent > 0.3 ETH AND contract interactions > 30
6. **Elder Wizard** — First tx 4+ years ago & fewer than 30 tx/year & balance < 10 ETH
7. **Guardian** — Fewer than 200 transactions & balance > 5 ETH (holder type)
8. **Warrior** — Default class when no other conditions are met

## Stat Formulas
```
Level = clamp(1 + floor(10 × log10(1 + tx_count)), 1, 60)
HP    = round(100 + 250 × log10(1 + balance_eth))
MP    = round(80 + 220 × log10(1 + gas_spent_eth))
STR   = round(50 + 180 × log10(1 + dex_swap_count + bridge_count))
INT   = round(50 + 180 × log10(1 + unique_contracts))
DEX   = round(50 + 150 × log10(1 + tx_count / max(wallet_age_years, 0.25)))
LUCK  = round(50 + 180 × log10(1 + rare_events))
Power = Level×500 + STR×25 + INT×25 + DEX×20 + HP×15 + MP×15 + LUCK×20 + ClassBonus

ClassBonus = { hunter:2000, rogue:0, summoner:1500, merchant:3000, priest:1000,
               elder_wizard:5000, guardian:4000, warrior:1500 }
```

---

## Directory Structure
```
eth-rpg/
├── .claude/commands/       <- Agent MD files
│   ├── pm.md
│   ├── frontend.md
│   ├── backend.md
│   ├── promeng.md
│   ├── qa.md
│   ├── uxreview.md
│   ├── card-designer.md
│   └── growth.md
├── CLAUDE.md               <- (this file)
├── src/
│   ├── app/
│   │   ├── page.tsx                  <- Landing (gallery + input + quiz CTA)
│   │   ├── quiz/page.tsx             <- On-chain personality quiz
│   │   ├── result/[address]/
│   │   │   └── page.tsx              <- Result (card + quiz prediction comparison)
│   │   ├── api/
│   │   │   ├── generate/route.ts     <- Main API
│   │   │   ├── og/[address]/route.tsx <- OG image
│   │   │   ├── card/[address]/route.tsx <- Shareable card image
│   │   │   ├── card/battle/[addr1]/[addr2]/route.tsx <- Battle comparison card
│   │   │   └── health/route.ts       <- Health check
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── alchemy.ts               <- Alchemy SDK integration
│   │   ├── classifier.ts            <- Transaction classification engine
│   │   ├── stats.ts                 <- Stat calculation logic
│   │   ├── class.ts                 <- Class determination logic
│   │   ├── lore.ts                  <- AI lore generation + fallback
│   │   ├── experiment-copy.ts       <- A/B copy variants (V1=RPG, V2=Personality Test)
│   │   ├── quiz-types.ts            <- Quiz type definitions
│   │   ├── quiz-data.ts             <- 5 quiz questions + class weight mappings
│   │   ├── quiz-engine.ts           <- Client-side quiz scoring (pure function)
│   │   ├── cache.ts                 <- In-memory cache
│   │   ├── rate-limit.ts            <- Rate limiting
│   │   ├── crypto-events.ts         <- Crypto event timeline
│   │   └── types.ts                 <- Shared type definitions
│   ├── components/
│   │   ├── AddressInput.tsx          <- Address input component
│   │   ├── CharacterCard.tsx         <- Result card (frontend display)
│   │   ├── GalleryCard.tsx           <- Famous wallet mini-preview card
│   │   ├── WalletGallery.tsx         <- Horizontal scroll gallery of famous wallets
│   │   ├── StatBar.tsx               <- Stat bar component
│   │   ├── ShareButtons.tsx          <- Share button group
│   │   ├── LoadingScreen.tsx         <- Loading screen
│   │   ├── TrustBanner.tsx           <- Trust message banner + quiz nav
│   │   ├── FAQ.tsx                   <- FAQ accordion
│   │   └── quiz/
│   │       ├── QuizFlow.tsx          <- Quiz state machine (intro→questions→result)
│   │       ├── QuizProgress.tsx      <- Quiz progress bar
│   │       ├── QuizQuestion.tsx      <- Single quiz question + options
│   │       └── QuizResult.tsx        <- Predicted class + verify CTA
│   ├── hooks/
│   │   └── useGenerateCharacter.ts   <- Character generation hook
│   └── styles/
│       └── themes.ts                 <- Class-specific color/themes
├── public/
│   ├── favicon.ico
│   └── og-default.png                <- Default OG image
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API Specification

### POST /api/generate
```typescript
// Request
{ address: string }  // "0x..." or "vitalik.eth"

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
-> 1200x630 PNG (OG image, dynamically generated)

### GET /api/card/[address]
-> 1080x1350 PNG (shareable card image)

### GET /api/card/battle/[addr1]/[addr2]?n={nonce}
-> 1080x1350 PNG (shareable battle comparison card, winner/loser layout)

### POST /api/battle
```typescript
// Request
{ address1: string, address2: string }

// Response (200)
{ result: { fighters, winner, turns, totalTurns, nonce, battleSeed }, cached: boolean }
```

### GET /api/ranking/leaderboard
```typescript
// Query params: type=power|battle|explorer, season?, address?, page?, limit?
// Response (200)
{ season, type, updatedAt, entries: RankingEntry[], totalPlayers, playerRank? }
// Battle leaderboard requires MIN_BATTLES_FOR_RANKING (5) to appear
```

### GET /api/ranking/season
```typescript
// Response (200)
{ season: { id, startedAt, endsAt, playerCount }, remaining: { days, hours } }
```

### GET /api/ranking/refresh
-> Vercel Cron endpoint (30-min). Requires `Authorization: Bearer <CRON_SECRET>`.
   Checks season expiry, recomputes all 3 leaderboards, saves snapshots to KV.

### POST /api/events
```typescript
// Request — client-side analytics event
{ event: string, properties?: Record<string, unknown>, url?: string }
// Response (200)
{ success: true }
```

### GET /api/admin/metrics
-> Admin dashboard metrics. Requires `Authorization: Bearer <ADMIN_API_KEY>`.

---

## Environment Variables (.env.local)
```env
ALCHEMY_API_KEY=           # Alchemy API key (required)
ANTHROPIC_API_KEY=         # Claude API key (required)
NEXT_PUBLIC_SITE_URL=      # Site URL (required, for OG/sharing)
SENTRY_DSN=                # Sentry server DSN (optional)
NEXT_PUBLIC_SENTRY_DSN=    # Sentry client DSN (optional)
```

---

## Agent Invocation Rules

| Task | Command |
|------|---------|
| Scheduling/tasks/decisions | `/pm` |
| UI/pages/component implementation | `/frontend` |
| API/parsing/stats/caching implementation | `/backend` |
| AI lore prompts | `/promeng` |
| Card/OG image rendering | `/card-designer` |
| Testing/security/bugs | `/qa` |
| Usability/readability/SEO | `/uxreview` |
| Launch/seeding/metrics | `/growth` |

### Dependency Order
```
backend (Alchemy + parsing + stats + class)
  -> promeng (lore generation)
  -> card-designer (card rendering)
  -> frontend (UI integration)
    -> uxreview (usability review)
    -> qa (integration testing)
    -> growth (launch)
```

---

## Development Schedule (7-Day Sprint)

### Day 1-2: Core Backend
1. Project initialization (Next.js + Tailwind + TypeScript)
2. `lib/alchemy.ts` — Alchemy SDK integration, data collection
3. `lib/classifier.ts` — Transaction classification (contract whitelist)
4. `lib/stats.ts` — Stat calculation formulas
5. `lib/class.ts` — Class determination (8-class priority)
6. `lib/cache.ts` + `lib/rate-limit.ts`
7. `api/generate/route.ts` — Main API (skeleton, without AI lore)

### Day 3: AI + Visuals
8. `lib/lore.ts` — Claude API lore generation + fallback template
9. `lib/crypto-events.ts` — Event timeline
10. `api/og/[address]/route.tsx` — OG image
11. `api/card/[address]/route.tsx` — Shareable card image
12. `styles/themes.ts` — Class-specific color themes

### Day 4: Frontend
13. `app/page.tsx` — Landing (TrustBanner + AddressInput + FAQ)
14. `app/result/[address]/page.tsx` — Result (CharacterCard + StatBar + ShareButtons)
15. `components/LoadingScreen.tsx`
16. `hooks/useGenerateCharacter.ts`
17. Dynamic meta tags (OG)

### Day 5: Stabilization
18. Full flow end-to-end testing
19. Error handling improvements
20. Sentry integration
21. Responsive design (mobile/tablet)
22. Trust message pinned to top

### Day 6: Deployment + Launch
23. Vercel deployment
24. Domain connection
25. OG preview testing
26. CT/Farcaster seeding begins

### Day 7: Seeding + Data
27. Crypto community seeding (20 communities)
28. Hotfix response
29. Performance data collection

---

## Core Rules

### Coding
- TypeScript strict mode
- Explicit types on all functions
- API responses use standard format (success/error)
- Structured logging instead of console.log
- No hardcoded magic numbers -- extract to constants/config

### Scope
- "Nice to have" -- always goes to v1.1 backlog
- Multi-chain support -- v2.0
- User login/wallet connection -- not doing it
- Real-time rankings -- not doing it (load/abuse risk)
- Financial commentary -- not doing it (legal risk)

### Security
- Never require wallet connection or signing
- Store no personal information on server beyond wallet address
- API keys used server-side only
- Always validate user input (address format, length, special characters)

### Visual
- Dark fantasy tone (background #0a0a0f ~ #12121a)
- Combat power always displayed largest and in gold (#f4c430)
- Class-specific theme colors applied
- Card image must stand out in feeds when shared