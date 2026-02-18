# 🚀 PM Kickoff — Full Project Automated Execution

> When this command is executed, PM acts as the orchestrator calling all agents in order to complete the project.
> After completing each step, it automatically proceeds to the next. On error, it fixes the issue at the current step and continues.

---

## Execution Rules

You are the PM (Project Manager). Execute the pipeline below from top to bottom in order.

**Working Method:**
1. At the start of each STEP, first read the corresponding agent MD file (`.claude/commands/`)
2. Follow the rules/code/patterns defined in the agent MD to implement
3. After completing each STEP, output a checkpoint: `✅ STEP N complete — {summary}`
4. On error/issue, fix immediately and continue
5. All code must actually create/modify files (don't just explain)
6. Never ask the user "what should we do next?" — proceed to the next STEP automatically

---

## PIPELINE

### STEP 0: Project Initialization
```
Actions:
- Create Next.js 14 project (App Router, TypeScript, Tailwind)
- Add dependencies to package.json: alchemy-sdk, @vercel/og, @sentry/nextjs
- tsconfig.json strict mode
- Create .env.local template
- .gitignore setup (including .env*)
- Create folder structure as defined in CLAUDE.md

Checkpoint: Empty page displays correctly when running `npm run dev`
```

### STEP 1: Shared Type Definitions
```
Reference: .claude/commands/backend.md
Actions:
- Create src/lib/types.ts
  - WalletRawData, TxClassification, CharacterStats, CharacterClass
  - ClassResult, LoreInputData, GenerateResponse, ErrorCode
  - Define all API request/response types here

Checkpoint: Type file compiles without errors
```

### STEP 2: Alchemy API Integration
```
Reference: .claude/commands/backend.md → "Alchemy API Integration" section
Actions:
- Create src/lib/alchemy.ts
  - Alchemy SDK initialization
  - fetchWalletData() function: balance + txCount + transfers + gas estimation + first tx timestamp
  - ENS resolution support

Checkpoint: Input vitalik.eth returns WalletRawData correctly (verify via console log)
```

### STEP 3: Transaction Classification Engine
```
Reference: .claude/commands/backend.md → "Transaction Classification" section
Actions:
- Create src/lib/classifier.ts
  - PROTOCOL_MAP (DEX/NFT/Bridge/Stable contract whitelist)
  - classifyTransactions() function: ratio/count calculation

Checkpoint: Test address returns reasonable classification ratios
```

### STEP 4: Stat Calculation + Class Determination
```
Reference: .claude/commands/backend.md → "Stat Calculation Formula", "Class Determination" sections
Actions:
- src/lib/stats.ts — calculateStats() (log scale formula)
- src/lib/class.ts — determineClass() (8 types priority matching)

Checkpoint: Various wallets produce reasonable stats/classes
```

### STEP 5: Caching + Rate Limiting
```
Reference: .claude/commands/backend.md → "Caching Logic", "Rate Limiting" sections
Actions:
- src/lib/cache.ts — MemoryCache (TTL 24h, max 10,000)
- src/lib/rate-limit.ts — IP-based 5 per minute

Checkpoint: Same address requested twice, second request is a cache hit
```

### STEP 6: Crypto Event Timeline
```
Reference: .claude/commands/backend.md → "Crypto Event Timeline"
Reference: .claude/commands/promeng.md → "Crypto Event → RPG Translation Dictionary"
Actions:
- src/lib/crypto-events.ts — Event list + getRelevantEvents() + describeActivityPattern()

Checkpoint: Wallet active during 2021~2025 filters relevant events correctly
```

### STEP 7: AI Lore Generation
```
Reference: .claude/commands/promeng.md → Full document
Actions:
- src/lib/lore.ts
  - LORE_SYSTEM_PROMPT, LORE_USER_PROMPT
  - generateLore() — Claude API call
  - generateFallbackLore() — Class-specific template fallback
  - Output validation (80 char limit, forbidden word check)

Checkpoint: Lore generation succeeds + fallback works correctly on API failure
```

### STEP 8: Main API Endpoint
```
Reference: .claude/commands/backend.md → Full flow
Actions:
- src/app/api/generate/route.ts
  - POST handler: input validation → cache → Alchemy → classification → stats → class → lore → response
  - Appropriate HTTP status per error code
  - Rate limit middleware applied
- src/app/api/health/route.ts

Checkpoint: curl to /api/generate returns complete GenerateResponse correctly
```

### STEP 9: Class Themes + Design Tokens
```
Reference: .claude/commands/card-designer.md → "Class Visual Themes"
Reference: .claude/commands/frontend.md → "Design System"
Actions:
- src/styles/themes.ts — CLASS_THEMES (8 types colors/gradients/icons/glow)
- src/app/globals.css — CSS variables (colors/fonts/spacing)
- tailwind.config.ts — Custom colors/fonts extension
- Google Fonts import (Cinzel + Inter + Noto Sans KR + JetBrains Mono)

Checkpoint: Theme objects can be imported in a type-safe manner
```

### STEP 10: Card Image + OG Image Rendering
```
Reference: .claude/commands/card-designer.md → Full document
Actions:
- src/app/api/og/[address]/route.tsx — OG image (1200x630)
- src/app/api/card/[address]/route.tsx — Share card (1080x1350)
- Stat bar rendering function
- Class-specific theme application

Checkpoint: /api/og/vitalik.eth → Image returned correctly
```

### STEP 11: Frontend Components
```
Reference: .claude/commands/frontend.md → Full document
Actions:
- src/components/TrustBanner.tsx — Top-fixed trust message
- src/components/AddressInput.tsx — Address input (0x + ENS, enter submit, validation)
- src/components/LoadingScreen.tsx — Step-by-step loading messages
- src/components/CharacterCard.tsx — Result card (class/stats/lore/power)
- src/components/StatBar.tsx — Stat bar (animated)
- src/components/ShareButtons.tsx — Twitter/Farcaster/Copy
- src/components/FAQ.tsx — Accordion 3 questions
- src/hooks/useGenerateCharacter.ts — API call hook

Checkpoint: Each component can render independently
```

### STEP 12: Page Assembly
```
Reference: .claude/commands/frontend.md → "Page Implementation Guide"
Actions:
- src/app/page.tsx — Landing (TrustBanner + hero + AddressInput + sample cards + FAQ)
- src/app/result/[address]/page.tsx — Result (CharacterCard + StatBar + ShareButtons + re-input CTA)
- src/app/layout.tsx — Root layout (meta tags, fonts, global styles)
- Dynamic metadata (generateMetadata) — OG image integration

Checkpoint: Full flow (address input → loading → result → share) works correctly in browser
```

### STEP 13: Responsive + Dark Mode
```
Reference: .claude/commands/frontend.md → "Responsive Breakpoints"
Reference: .claude/commands/uxreview.md → "Responsive & Device-specific"
Actions:
- Mobile (375px): Card full-width, stats vertical
- Tablet (768px): Card centered, stats grid
- Desktop (1024px+): Card left + stats right
- Input field 16px (iOS zoom prevention)
- Dark theme default (fantasy tone)

Checkpoint: Card/stats/share buttons display correctly in mobile view
```

### STEP 14: Error Handling + Sentry
```
Reference: .claude/commands/backend.md → "Error Code System"
Reference: .claude/commands/qa.md → "Crisis Response Testing"
Actions:
- try/catch + appropriate error codes in each API route
- Frontend: ERROR_MESSAGES mapping, error UI display
- Sentry initialization (only when SENTRY_DSN is present)
- Zero transaction wallet → Dedicated empty state screen
- Invalid address → Inline error

Checkpoint: Invalid address, empty wallet, server error each display appropriate UI
```

### STEP 15: Final QA
```
Reference: .claude/commands/qa.md → Full document
Reference: .claude/commands/uxreview.md → Full document
Actions:
- Manual verification of full flow with 5+ test addresses
  - Whale (vitalik.eth)
  - New wallet (tx < 5)
  - Zero transaction wallet
  - NFT-focused wallet
  - DeFi-focused wallet
- Security 7-point check (API key exposure, input validation, etc.)
- OG image verification
- Share link → result page direct access verification
- Build succeeds without errors: `npm run build`

Checkpoint: `npm run build` succeeds + full flow works correctly
```

### STEP 16: Deployment Preparation
```
Actions:
- Final check of next.config.ts (image domains, environment variables, etc.)
- Verify Vercel deployment configuration
- Organize environment variable list (guide for user)
- Create README.md (project description + installation + env variables + deployment)

Checkpoint: Project is in deployable state
```

---

## In-Progress Principles

### Auto-Progression
- After completing each STEP, immediately proceed to the next without stopping
- Never ask "what should we do next?"
- Only pause when user input is needed (API keys, etc.), auto-progress for everything else

### Error Handling
- Code error occurs → Fix immediately and continue
- Package installation fails → Try alternatives and continue
- Type error → Fix immediately and continue
- Same error repeats 3+ times → Report to user and skip to next STEP

### Code Quality
- All code is TypeScript strict
- No magic numbers → Extract to constants
- Comments only explain "why", code expresses "what"
- One-line description comment at top of each file

---

## Start

Execute the pipeline above starting from STEP 0 in order. Begin now.
