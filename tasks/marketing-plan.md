# Eth·RPG Marketing Plan

> Date: 2026-02-18
> Goal: Within 7 days of launch — UV 400+, card generations 150+, share rate 20%+, K >= 0.3

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
| Event tracking | ✅ Complete | 5-step funnel + OG load + UTM via custom API route |
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
**All 6 steps operational. Share flow functional. Viral coefficient (K) to be measured from Day 3.**

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
| 4 | Telegram/KakaoTalk share buttons | ✅ Done | current commit |

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

### Viral Coefficient Measurement Plan
```
K (viral coefficient) = share_rate × inflow_per_share

Where:
- share_rate = funnel_share / funnel_generate_success (measured from admin dashboard)
- inflow_per_share = utm_source=share page_views / funnel_share (measured from UTM data)

Target: K >= 0.3 (minimum viable), stretch K >= 0.5

Measurement schedule:
- Day 1-2: Collect raw data (no K calculation — sample too small)
- Day 3: First K-factor calculation (need 50+ shares for statistical validity)
- Day 5: Second K-factor check
- Day 7: Final K-factor for Go/No-Go decision

If K < 0.3 on Day 3:
  → Pivot copy/CTA (switch to top-performing variant)
  → Emphasize card download over link sharing
  → Add "Try your friend's wallet" CTA on result page

Note: Do NOT assume K values before measurement. Previous estimate of K=0.5
was based on unverified assumptions (CT reach of 5 per share, 50% landing
conversion). Actual CT click-through rates are 1-3%, so real K may be 0.1-0.3.
Plan for K=0.3, celebrate if higher.
```

---

## 5. Channel Execution Plan

### Phase 1: Internal QA (Day 1)

Share the link with 5-10 friends/testers. Collect bug reports and UX feedback. Fix any critical issues found. Prepare Product Hunt submission (screenshots, maker comment, tagline). Generate 5 sample cards (famous wallets) if not done. Final OG preview check (Twitter Card Validator, Farcaster).

---

### Phase 2: Global Launch (Day 2-3)

#### A. Product Hunt
**Preparation**
- English title: "Eth·RPG — Turn your Ethereum wallet into an RPG hero"
- Tagline: "Paste address → get your hero card in 10 seconds"
- 5 screenshots: landing, loading, card front, card back, share
- Maker comment: tech stack + why I built it
- Categories: Web3, Gaming, AI

**Timing**: Tuesday-Thursday morning (PT 00:01 launch)

#### B. Crypto Twitter (CT)
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

**Famous Wallet Tag Posts (Day 2-3, 2-3 posts/day)**
- Post pre-generated cards for famous wallets (vitalik.eth, etc.) on CT
- Tag the wallet owner: "@vitalikbuterin Power 89,432 Elder Wizard"
- Even without RT, followers click out of curiosity → inflow
- Cold DMs to KOLs are unrealistic (1-5% response rate, mostly ignored)
- Tag posts get search/timeline exposure without requiring any response

**Hashtags**
```
#EthRPG #WalletRPG #onchain #ethereum
```

#### C. Farcaster/Warpcast
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

#### D. Reddit
- r/ethereum: "I built a tool that turns ETH wallets into RPG characters" (Show-off)
- r/web3: cross-post
- r/IndieHackers: building story

#### E. Hacker News
- "Show HN: Eth·RPG – Ethereum wallet → RPG character card"
- Emphasize technical details (on-chain analysis, Claude AI lore)

#### F. Secondary CT Content (Day 3)
- "Famous Wallet Power Ranking" series
  - vitalik.eth: Lv.?? Elder Wizard 🔮
  - sassal.eth: Lv.?? Guardian 🛡️
  - 5-10 famous addresses total
- Monitor user RT/recasts + respond
- Bug/feedback response

---

### Phase 3: Korean Wave (Day 4-5)

Ride the tail of global traffic momentum.

#### G. Crypto Discord (10 servers)
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

**Server-by-Server Posting Rules**
| Server | Risk | Channel | Notes |
|--------|------|---------|-------|
| DeFi Korea | Low | #general allowed | Korean, high relevance |
| NFT Korea | Low | #general allowed | Korean, NFT community |
| Bankless DAO | High | #shill or #showcase ONLY | #general promo prohibited |
| Ethereum Official | High | #showcase ONLY | No project promotion in #general |
| Uniswap | High | #shill or #off-topic | Main channel promotion blocked |
| Optimism / Base / Arbitrum | Medium | Check server rules first | Policies vary by L2 |
| Lido | Medium | #off-topic | Staking-focused server |
| FWB | High | No posting possible | Token-gated membership required |

**DM/Post Strategy**
- Post directly in server #general or #off-topic (if allowed)
- Admin DM: "Let me make a card for your wallet first" (personalization appeal)
- Prevent spam perception: adjust tone per server, post only once per server

#### H. Korean Telegram (5 groups)
```
1. Ethereum Korea — main target
2. DeFi Korea Telegram — DeFi users
3. NFT Korea Telegram — NFT users
4. Crypto Trader Group — active users
5. Web3 Builders Korea — developers + builders
```

#### I. KakaoTalk Open Chat
- Search for crypto open chat rooms (KakaoTalk search: Ethereum, NFT, coin)
- Share in a natural tone: "Tried this and it was fun"
- Limit to 5 rooms per day (spam prevention)

#### J. Secondary CT Content
- "Class Characteristics" infographic
  - "If you're a Rogue... you swap faster than anyone on DEX"
- User submission RT (retweet cards posted by users)

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
Share links:      ?utm_source=share&utm_medium=card&utm_campaign=viral_v{1-6}
Product Hunt:     ?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch
Reddit/HN:        ?utm_source={platform}&utm_medium=post&utm_campaign=community
```

**Copy A/B tracking**: Share links include variant ID in `utm_campaign` (e.g. `viral_v1` through `viral_v6`). This enables per-variant performance comparison via UTM data without UI changes. Default share button uses `viral_v1`; manual seeding posts use the variant number matching the copy set used.

### KPI Dashboard
| Metric | Calculation | Day 7 Target | Day 30 Target |
|--------|-------------|-------------|--------------|
| UV (unique visits) | Unique page_view | 400 | 2,000 |
| Cards generated | card_generated | 150 | 800 |
| Input conversion rate | Generations / visits | 40% | 40% |
| Share rate | Shares / generations | 20% | 25% |
| Download rate | Downloads / generations | 15% | 20% |
| Viral coefficient (K) | share_rate × inflow_per_share | 0.3 | 0.5 |
| OG image impressions | og_image_load counter | — | — |
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
- "@vitalikbuterin Lv.58 Elder Wizard, Power 89,432" → CT tag post (Day 1-3)
- Multiple celebrity cards side by side → "Ethereum Legends Ranking" infographic (Day 2-3)
- Use as sample images when seeding Discord/Telegram communities

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
| D-1 PM | Finalize seeding target list of 20 + prepare post texts | Growth |

### Day 1: Internal QA
| Time | Task |
|------|------|
| AM | Share link with 5-10 friends/testers, collect bug/UX feedback |
| AM | Final OG preview check (Twitter Card Validator, Farcaster) |
| PM | Fix any critical bugs found |
| PM | Prepare PH submission (screenshots, maker comment, tagline) |
| PM | Generate 5 sample cards (famous wallets) if not done |

### Day 2: Global Launch
| Time | Task |
|------|------|
| 00:01 PT | Product Hunt launch |
| 09:00 | CT first post (card image + link + PH link) |
| 09:30 | Farcaster /ethereum channel cast |
| 10:00 | Reddit r/ethereum post |
| 12:00 | Hacker News Show HN post |
| 14:00 | Famous wallet tag posts 2-3 (vitalik.eth, sassal.eth, etc.) |
| 18:00 | First funnel data check |
| 21:00 | User response monitoring + hotfix |

### Day 3: Global Momentum
| Task |
|------|
| PH ranking monitoring + community responses |
| Additional Farcaster channels (/defi, /nft, /base) |
| "Famous Wallet Power Ranking" content post |
| Bug/feedback response |
| Monitor user RT/recasts + respond |

### Day 4-5: Korean Wave
| Task |
|------|
| Discord seeding (10 servers, follow posting rules) |
| Korean Telegram seeding (5 groups) |
| KakaoTalk open chat seeding (5 rooms) |
| Secondary CT content ("Class Characteristics" infographic) |
| User submission RT + community engagement |

### Day 6-7: Review & Optimize
| Task |
|------|
| Mid-point funnel data review |
| Compare share copy performance → focus on top performers |
| First K-factor calculation (need 50+ shares) |
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

### Channel-by-Channel UV Decomposition

| Channel | Target UV | Basis |
|---------|----------|-------|
| CT (personal account) | 30-50 | ~1K followers × 3-5% CTR |
| Farcaster (5 channels) | 20-30 | /ethereum channel reach |
| Discord (10 servers) | 50-100 | 5-10 per server |
| Telegram (5 groups) | 30-50 | 6-10 per group |
| Famous wallet tag posts (6-9) | 30-60 | 5-10 clicks per post, search/timeline exposure without RT |
| Viral spread (K=0.3) | 50-80 | ~200 generations × 20% share × K |
| KakaoTalk (5 rooms) | 20-30 | 4-6 per room |
| **Total (conservative)** | **230-400** | |

**Implication**: UV 400 is an optimistic target. Conservative estimate is 230-400.
Adjust Go/No-Go accordingly — "Average" band is the realistic Day 7 outcome with
seeding alone. Reaching "Success" requires viral amplification (K > 0.3).

### Day 7 Benchmark
| Grade | Criteria | Decision |
|-------|----------|----------|
| 🟢 Success | UV 400+, generations 150+, share rate 20%+, K >= 0.3 | Proceed with Phase 2 expansion |
| 🟡 Average | UV 200-400, generations 80-150, share rate 10-20% | Pivot copy/channels and retry |
| 🔴 Failure | UV < 200, generations < 80, share rate < 10% | Reassess product itself (UX? Fun factor?) |

### Viral Coefficient Assessment
| K Value | Meaning | Action |
|---------|---------|--------|
| K >= 1.0 | Self-sustaining growth | Server scaling, feature expansion |
| 0.3 <= K < 1.0 | Seeding + viral hybrid | Continue seeding + improve share UX |
| K < 0.3 | Seeding-dependent | Change copy, strengthen CTA, push downloads |

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
[8] MEDIUM   — Vercel Analytics integration        ✅ DONE (Analytics + SpeedInsights in layout)
[9] MEDIUM   — Insert UTM parameters in share links ✅ DONE (utm.ts + ShareButtons)
[10] MEDIUM  — Fix funnel dead counters             ✅ DONE (events route maps address_input_start/generate_start/card_generated)
[11] MEDIUM  — OG image load tracking               ✅ DONE (og_image_load counter in OG route)
```

**All items resolved. Funnel measurement fully operational.**

---

## 13. Day 7+ Retention Strategy

### Week 2: Battle Mode Activation
- **Famous Wallet Battle Series**: vitalik.eth vs sassal.eth and other famous wallet matchups
- Share battle results on CT/Farcaster → "Challenge me" CTA
- Battle share links tagged with UTM battle campaign

### Week 3: Ranking Season Launch
- **Genesis Season** opens — first Top 10 leaderboard revealed
- Season-end rank titles (Gold/Silver/Bronze)
- Encourage ranking page sharing

### Week 4: Community Building
- Weekly highlights (highest power this week, rare classes, etc.)
- Class callouts ("This week's top Rogue", etc.)
- Evaluate opening Discord/Telegram community channels

### Retention KPIs (from strategy-gamification.md)
| Metric | Target | Benchmark |
|--------|--------|-----------|
| D1 return rate | 15% | Mobile F2P game D1 25-35% — adjusted down for wallet-less web tool |
| D7 return rate | 5% | Crypto game D7 5-15% (DappRadar 2024) |
| D30 return rate | 2% | Lower end of typical crypto games |

### If Below Target
- D1 < 15%: Add "Check stat changes in 24 hours" CTA to result page
- D7 < 5%: Boost battle mode promo, consider push notifications (with consent)
- D30 < 2%: Shorten season reset cycle (4 weeks → 2 weeks), add new content
