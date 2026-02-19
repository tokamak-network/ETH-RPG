# Eth·RPG Marketing Plan

> Date: 2026-02-18
> Goal: Within 7 days of launch — UV 500+, card generations 200+, share rate 20%+

---

## 1. Current Status Assessment

### Service Status
| Item | Status | Notes |
|------|--------|-------|
| Core feature (address → card) | ✅ Complete | 8 classes, 6 stats, AI lore |
| Frontend UX | ✅ Complete | Landing → input → loading → card → share flow |
| Card visuals | ✅ Complete | Dark fantasy, pixel art, 3D flip |
| Share buttons | ✅ Complete | Twitter, Farcaster, link copy + card download |
| OG image (personalized) | ✅ Complete | generateMetadata in result layout.tsx |
| Card download | ✅ Complete | Gold "Save Card" button with blob download |
| Cache resilience | ✅ Complete | Self-healing on cache miss via pipeline.ts |
| Event tracking | ❌ Not implemented | Cannot measure funnel |
| Deployment | ✅ Complete | Vercel deployed |

### Viral Loop Check
```
[1] User sees card → ✅ (card rendering complete)
[2] Clicks share button → ✅ (Twitter/Farcaster + card download)
[3] Recipient sees card in link preview → ✅ (personalized OG metadata)
[4] Clicks "I want to try too" → ✅ (link works)
[5] Generates own card → ✅
[6] Shares again → ✅
```
**All 6 steps operational. Viral loop complete.**

---

## 2. Pre-Launch Technical Fixes (MUST-DO)

### P0: Complete the Viral Loop — ✅ DONE

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add `generateMetadata()` to result page | ✅ Done | `8982d81` |
| 2 | "Save Card" download button | ✅ Done | `8982d81` |

### P1: Stability — ✅ DONE

| # | Task | Status | Commit |
|---|------|--------|--------|
| 3 | Self-healing on cache miss in OG/card routes | ✅ Done | `1ff80b6` |
| 4 | Telegram/KakaoTalk share buttons | Remaining | — |

---

## 3. Target User Definition

### Primary: Crypto Natives (Ethereum wallet holders)
- **Traits**: Active on-chain, CT/Farcaster activity, meme/card sharing culture
- **Motivation**: Curious what character their on-chain activity maps to, power score comparison, self-expression
- **Acquisition channels**: CT, Farcaster, crypto Discord/Telegram

### Secondary: Crypto Light Users (have a wallet but inactive)
- **Traits**: Occasional NFT purchases, exchange withdrawals
- **Motivation**: Fun, saw a friend's shared card and want to "try it too"
- **Acquisition channels**: Viral links (shared by primary users)

### Anti-Persona (not target)
- General users without wallets (address input is itself a barrier)
- Users hostile toward DeFi/NFT

---

## 4. Viral Mechanism Analysis

### 3 Core Psychological Triggers
```
1. Comparison desire — "Power 12,345... what's yours?"
   → Number comparison is instinctive. Makes people try their friends' wallets too

2. Identity assignment — "I'm a Hunter/Rogue/Wizard"
   → RPG class = my on-chain identity. Becomes profile material

3. AI lore resonance — "A sage who endured the collapse of the Lunar Kingdom"
   → Crypto history translated into fantasy → emotional resonance + humor
```

### Viral Coefficient Target
```
K (viral coefficient) = share rate x inflow per share x inflow conversion rate

Target: K >= 0.5
- Share rate: 20% (1 in 5 shares)
- Inflow per share: 5 (CT average reach)
- Inflow conversion rate: 50% (up to address input)
- K = 0.2 x 5 x 0.5 = 0.5 ✓
```

---

## 5. Channel Execution Plan

### Phase 1: Soft Launch (Day 1-2)

#### A. Crypto Twitter (CT)
**Goal**: Acquire 50 initial seed users

**First post (personal or project account)**
```
🗡️ My Ethereum wallet became an RPG character

Just paste a wallet address and in 10 seconds:
- Class assignment (8 types)
- Stat calculation (Level/HP/MP/STR/INT/LUCK)
- AI hero lore generation
- Power score calculation

Key connect ❌ Signing ❌ Read-only ✅

My Power {power}... what's yours?

{URL}

[Card image attached]
```

**KOL Seeding (5-10 people)**
- Pre-generate cards for famous wallet addresses (vitalik.eth, etc.)
- DM with "vitalik.eth's Power is XX" screenshot
- Target: Crypto influencers with 1K-50K followers (very large accounts have low response rates)

**Hashtags**
```
#EthRPG #WalletRPG #onchain #ethereum
```

#### B. Farcaster/Warpcast
**Goal**: 30 on-chain natives

**Cast**
```
Just built something fun — paste any ETH address and get your RPG hero card in 10 seconds ⚔️

8 classes, 6 stats, AI-generated lore based on your on-chain history.

No wallet connect. No signing. Just vibes.

My Power: {power}... what's yours?

{URL}
```

**Target Channels**
| Channel | Post type |
|---------|-----------|
| /ethereum | Project intro + demo |
| /base | "works with any ETH address" |
| /defi | "DeFi degens are Rogues apparently" |
| /nft | "NFT collectors = Hunters" |
| /korean | Korean-language post |

#### C. Crypto Discord (10 servers/day)
**Target Servers (priority order)**
```
1. DeFi Korea — Korean, active, highest relevance
2. NFT Korea — Korean, NFT users
3. Bankless DAO — English, crypto education community
4. Ethereum Official — English, largest scale
5. Optimism — English, L2 users
6. Base — English, Coinbase users
7. Lido — English, staking users
8. Uniswap — English, DEX users
9. Friends With Benefits — English, culture crypto
10. Arbitrum — English, L2 users
```

**DM/Post Strategy**
- Post directly in server #general or #off-topic (if allowed)
- Admin DM: "Let me make a card for your wallet first" (personalization appeal)
- Prevent spam perception: adjust tone per server, post only once per server

---

### Phase 2: Expansion (Day 3-5)

#### D. Korean Telegram (5 groups)
```
1. Ethereum Korea — main target
2. DeFi Korea Telegram — DeFi users
3. NFT Korea Telegram — NFT users
4. Crypto Trader Group — active users
5. Web3 Builders Korea — developers + builders
```

#### E. Secondary CT Content
- "Famous Wallet Power Ranking" series
  - vitalik.eth: Lv.?? Elder Wizard 🔮
  - sassal.eth: Lv.?? Guardian 🛡️
  - 5-10 famous addresses total
- "Class Characteristics" infographic
  - "If you're a Rogue... you swap faster than anyone on DEX"
- User submission RT (retweet cards posted by users)

#### F. KakaoTalk Open Chat
- Search for crypto open chat rooms (KakaoTalk search: Ethereum, NFT, coin)
- Share in a natural tone: "Tried this and it was fun"
- Limit to 5 rooms per day (spam prevention)

---

### Phase 3: Global Expansion (Week 2)

#### G. Product Hunt
**Preparation**
- English title: "Eth·RPG — Turn your Ethereum wallet into an RPG hero"
- Tagline: "Paste address → get your hero card in 10 seconds"
- 5 screenshots: landing, loading, card front, card back, share
- Maker comment: tech stack + why I built it
- Categories: Web3, Gaming, AI

**Timing**: Tuesday-Thursday morning (PT 00:01 launch)

#### H. Reddit
- r/ethereum: "I built a tool that turns ETH wallets into RPG characters" (Show-off)
- r/web3: cross-post
- r/IndieHackers: building story

#### I. Hacker News
- "Show HN: Eth·RPG – Ethereum wallet → RPG character card"
- Emphasize technical details (on-chain analysis, Claude AI lore)

---

## 6. Share Copy Strategy

### Principles
```
1. Lead with numbers — "Power 12,345" (trigger comparison desire)
2. End with a question — "What's yours?" (prompt response)
3. Include safety message — "No keys/signing" (build trust)
4. Keep it short — 2 lines max (stop the scroll)
```

### Korean Copy Set (6 variants)
| # | Copy | Purpose |
|---|------|---------|
| 1 | My wallet Power {power}... what's yours? 🗡️ | Default share (current ShareButtons default) |
| 2 | I'm a {class}. Your wallet actually assigns you a class | Class emphasis |
| 3 | Just paste a wallet address for an RPG character card in 10 seconds ⚔️ | Feature description |
| 4 | "{lore}" — My wallet's hero lore lol | AI lore emphasis |
| 5 | No keys. No signing. Read-only. Safe. Fun. | Trust + fun |
| 6 | Try your friend's wallet too lol the results are hilarious | Spread incentive |

### English Copy Set (6 variants)
| # | Copy | Purpose |
|---|------|---------|
| 1 | My wallet Power: {power}... what's yours? 🗡️ | Default share |
| 2 | I'm a {class}. This turns your ETH wallet into an RPG hero | Class emphasis |
| 3 | Paste address → get your hero card. No connect, no sign ⚔️ | Feature description |
| 4 | My wallet lore: "{lore}" 😂 | AI lore emphasis |
| 5 | 10 seconds to find out what RPG class your wallet is | Curiosity trigger |
| 6 | Try your friend's wallet too 👀 | Spread incentive |

---

## 7. Funnel Measurement Plan

### Event Definitions (5 events)
```
page_view         — Page entry (landing / result)
address_submit    — Address input submitted
card_generated    — Card generation complete (includes class, level, power)
share_click       — Share button clicked (platform: twitter/farcaster/copy/download)
card_download     — Card image downloaded
```

### UTM System
```
Seeding posts:    ?utm_source={platform}&utm_medium=organic&utm_campaign=launch_seed
Share links:      ?utm_source=share&utm_medium=card&utm_campaign=viral
Product Hunt:     ?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch
Reddit/HN:        ?utm_source={platform}&utm_medium=post&utm_campaign=community
```

### KPI Dashboard
| Metric | Calculation | Day 7 Target | Day 30 Target |
|--------|-------------|-------------|--------------|
| UV (unique visits) | Unique page_view | 500 | 3,000 |
| Cards generated | card_generated | 200 | 1,200 |
| Input conversion rate | Generations / visits | 40% | 40% |
| Share rate | Shares / generations | 20% | 25% |
| Download rate | Downloads / generations | 15% | 20% |
| Viral coefficient (K) | Share inflow / shares | 0.5 | 0.7 |
| Top channel | UTM source | CT | CT |

### Tracking Implementation Options (zero budget)
| Tool | Pros | Cons |
|------|------|------|
| **Vercel Analytics** (recommended) | Free, 1-min setup, Next.js native | Limited custom events |
| Plausible Cloud | Free 10K/mo, privacy-friendly | Third-party |
| Custom implementation (API route) | Fully custom | Development time needed |
| Umami (self-hosted) | Completely free, open source | Hosting required |

**Recommendation**: Vercel Analytics (baseline) + custom events via self-built API route

---

## 8. Seed Content Sample Card Strategy

### "Famous Wallet Card" Series
Pre-generate cards for 5-10 famous addresses before launch → use as seeding content

```
Must-generate targets:
1. vitalik.eth — Ethereum founder, highest recognition
2. sassal.eth — Ethereum community influencer
3. 0xd8dA...045 (Vitalik 2nd) — Fun to compare if results differ
4. Famous NFT collector wallet — Hunter class example
5. Famous DeFi whale wallet — Rogue class example
```

**Usage**
- "vitalik.eth is Lv.58 Elder Wizard, Power 89,432" → CT post
- Multiple celebrity cards side by side → "Ethereum Legends Ranking" infographic
- When DMing KOLs: "Let me make your card too" + preview of their card

---

## 9. Execution Timeline

### Pre-Launch (D-2 to D-1)
| Time | Task | Owner |
|------|------|-------|
| D-2 AM | P0 technical fixes (OG metadata + download button) | Dev |
| D-2 PM | Vercel deploy + domain connection | Dev |
| D-1 AM | OG preview testing (Twitter Card Validator, Farcaster) | QA |
| D-1 AM | Generate 5 sample cards (famous wallets) | Growth |
| D-1 PM | Finalize 6 share copy sets | Growth |
| D-1 PM | Finalize seeding target list of 20 + prepare DMs | Growth |

### Launch (Day 1)
| Time | Task |
|------|------|
| 09:00 | CT first post (card image + link) |
| 09:30 | Farcaster /ethereum channel cast |
| 10:00 | Discord seeding begins (5 servers) |
| 12:00 | Telegram seeding (3 groups) |
| 14:00 | KOL DMs sent (5 people) |
| 18:00 | First funnel data check |
| 21:00 | User response monitoring + hotfix |

### Day 2-3
| Task |
|------|
| Additional Discord seeding (5 servers/day) |
| Monitor user RT/recasts + respond |
| "Famous Wallet Power Ranking" secondary content post |
| Bug/feedback response |
| KakaoTalk open chat seeding (5 rooms) |

### Day 4-5
| Task |
|------|
| Secondary CT content ("Class Characteristics" infographic) |
| User submission RT + community engagement |
| Mid-point funnel data review |
| Compare share copy performance → focus on top performers |

### Day 6-7
| Task |
|------|
| Product Hunt launch registration |
| Reddit r/ethereum post |
| Hacker News Show HN |
| First performance data report |

---

## 10. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Alchemy API rate limit | Medium | High | rate-limit.ts already implemented, verify free tier limits |
| Claude API cost overrun | Medium | Medium | Fallback template already implemented, monitor usage |
| Discord/Telegram spam ban | High | Low | One post per server rule, admin DM first |
| Famous wallet owner complaint | Low | Medium | Only public data used, explicitly state no financial commentary |
| Viral fails (K < 0.3) | Medium | High | Change copy/CTA on Day 3, emphasize image download |
| Server down (during viral spike) | Low | High | Cache hit rate reduces API load, Vercel autoscale |

---

## 11. Success Criteria (Go/No-Go)

### Day 7 Benchmark
| Grade | Criteria | Decision |
|-------|----------|----------|
| 🟢 Success | UV 500+, generations 200+, share rate 20%+ | Proceed with Phase 2 expansion |
| 🟡 Average | UV 200-500, generations 80-200, share rate 10-20% | Pivot copy/channels and retry |
| 🔴 Failure | UV < 200, generations < 80, share rate < 10% | Reassess product itself (UX? Fun factor?) |

### Viral Coefficient Assessment
| K Value | Meaning | Action |
|---------|---------|--------|
| K >= 1.0 | Self-sustaining growth | Server scaling, feature expansion |
| 0.5 <= K < 1.0 | Seeding + viral hybrid | Continue seeding + improve share UX |
| K < 0.5 | Seeding-dependent | Change copy, strengthen CTA, push downloads |

---

## 12. Immediate Action Items (priority order)

```
[1] CRITICAL — Fix OG metadata                    ✅ DONE (8982d81)
[2] CRITICAL — Add card download button            ✅ DONE (8982d81)
[3] HIGH     — Cache resilience (self-healing)     ✅ DONE (1ff80b6)
[4] HIGH     — Vercel deploy + domain connection   ✅ DONE
[5] HIGH     — Fix OG/Card Satori rendering        ✅ DONE (d66f620)
[6] HIGH     — OG preview testing                  ✅ DONE (production verified)
[7] HIGH     — Generate 5 sample cards             ✅ DONE (vitalik/sassal/pranksy/hayden/jessepollak)
[8] MEDIUM   — Vercel Analytics integration        ⬜ TODO
[9] MEDIUM   — Insert UTM parameters in share links ⬜ TODO
```

**Launch blockers [1]-[7] resolved. Ready for seeding. Next: analytics + UTM.**
