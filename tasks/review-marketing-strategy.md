# Comrade Volkov's Review: Marketing Strategy

> Scope: strategy-gamification.md (387 lines) + team-announcement.txt + tokamak-contribution-answers.txt + implemented marketing infra (analytics, UTM, share, SEO)
> Date: 2026-02-20
> Score: **5.0 / 10.0** — REJECT

---

## Scoring Summary

| Category | Deduction | Cap |
|----------|-----------|-----|
| Structural Flaws (A) | -4.0 | -4.0 |
| Logical Gaps (B) | -3.0 | -3.0 |
| Execution Gaps (C) | -2.0 | -2.0 |
| Weak Expression (D) | -1.0 | -1.0 |
| Domain: Business (E) | -3.0 | -3.0 |
| Domain: Design/Architecture (F) | -2.0 | -3.0 |
| **Total** | **-15.0** | |
| **Final Score** | **5.0/10.0** | |

---

## Deduction Details

### A. Structural Flaws (cap -4.0)

#### A1. Core assumption "viral loop" unverified — -2.0

`strategy-gamification.md:194` — "1-minute loop: address input → card generation → share (viral)"

However:
- Current K-factor (viral coefficient) is unknown
- Only `share_click` events are tracked; post-share actual inflow is not measured
- OG image load counts are not tracked
- Referrer analysis exists but no logic to calculate "share → revisit" conversion rate

UTM parameters are implemented — not deducted for this. But UTM data is only collected, with no analysis dashboard. `admin/page.tsx` only shows `share_twitter`/`farcaster`/`clipboard` counts, no per-UTM-source inflow/conversion analysis.

Using the word "viral" 9 times while being unable to measure the viral coefficient is a structural flaw.

#### A2. MAU 10,000 assumption has no basis — -2.0

`strategy-gamification.md:220` — "Conversion estimate (based on MAU 10,000)"

Where does 10,000 come from?

- Actual current MAU? Unknown. Only `funnel_landing` is tracked.
- MAU benchmarks from similar services? None.
- Specific channel-by-channel strategy to reach 10,000 MAU? Only one line: "community building (Discord, Tokamak contact)."

No sensitivity analysis on whether the SOUL economy works at 5,000 but collapses at 500.

→ Cap reached: -4.0

---

### B. Logical Gaps (cap -3.0)

#### B1. SOUL economy inflation/deflation balance unverified — -1.5

`strategy-gamification.md:76-101` — Sink/Faucet table exists. But no simulation.

Active user daily SOUL flow:
- Inflow: PvP win max 300 + daily missions 60 = 360 SOUL/day
- Outflow: PvP entry fee 50 x 6 battles = 300 SOUL/day

Net inflow: +60 SOUL/day. With 1,000 users, 60,000 SOUL enters the system daily. Add weekly quests + achievements and it's more. Burn rate stated at 30%, but if TON→SOUL exchange is one-way, SOUL supply grows indefinitely. TON exchange is described as "unlimited."

How can this economy be trusted to remain balanced after 6 months without a single spreadsheet?

#### B2. Phase 0→1→2 transition ignores user churn scenarios — -1.5

`strategy-gamification.md:204-218` — 3-phase onboarding. Phase 0 (address input) → Phase 1 (SIWE signature) → Phase 2 (token economy).

Phase 0→1 conversion estimated at 10-15%. What about the remaining 85-90%? Simply discarded? These users have no motivation to revisit. Make a card once, share, done.

Core game retention metrics D1/D7/D30 not mentioned. No DAU/MAU ratio targets. For the "5-minute loop" to work, users need a reason to return daily, but Phase 0 users have no daily quests (no SOUL rewards = no motivation).

If Phase 0 retention is effectively 0%, the number of returning visitors among MAU 10,000 is unknown.

→ Cap reached: -3.0

---

### C. Execution Gaps (cap -2.0)

#### C1. No specific user acquisition channels/budget/KPIs — -1.0

`strategy-gamification.md:308-312` — Phase 2 user acquisition:
- "Analytics infrastructure (DAU/battle count/share count)"
- "Community building (Discord, Tokamak contact)"
- "MAU 1,000+ target"

Specifically:
- Which crypto communities to seed? No list.
- Influencer marketing budget? None ($0 or $500 not specified).
- What content format for Twitter/Farcaster posts? TBD.
- Measurement criteria after seeding? Only "MAU 1,000" as a single number.

`team-announcement.txt` is a Slack/Discord announcement; no separate external community seeding plan exists. `CLAUDE.md` states "Day 6-7: 20 communities seeding" but doesn't list which 20 communities.

#### C2. Grant budget calculation lacks justification — -1.0

`strategy-gamification.md:241-248` — Grant request $30,000. M1 $5,000, M2 $8,000, M3 $7,000, M4 $10,000.

No basis for these amounts anywhere. What can $5,000 accomplish in Phase 1? Is it labor costs? Infrastructure costs? Monthly costs stated at $130-$500, so $5,000 is 10 months of infrastructure. Then what is the money for?

No line-item breakdown that could answer "Why this amount?" in a Tokamak grant review.

→ Cap reached: -2.0

---

### D. Weak Expression (cap -1.0)

#### D1. Overstatement — -0.5

`tokamak-contribution-answers.txt:3` — "Eth·RPG is a viral service turning wallets into RPG characters." A service that has never gone viral calling itself a "viral service." This is hope, not fact.

`team-announcement.txt:7` — "drive viral sharing" — again, describing something that hasn't happened as established fact.

#### D2. Core issue avoidance — -0.5

The word "competitor" does not appear once in the entire `strategy-gamification.md`. No explanation of how this differs from existing on-chain profile/quest services like DegenScore, Rabbithole, Layer3, or Galxe.

Claims "killer app positioning possible" (line 18) without analyzing why this is a killer app or what it solves that existing services couldn't.

→ Cap reached: -1.0

---

### E. Domain: Business (cap -3.0)

#### E1. No market validation data — -1.0

No DAU/MAU, retention, or revenue data from comparable services (DegenScore, Rabbithole, Galxe, etc.). No validation that the "RPG character card" format appeals to crypto users (surveys, MVP tests, interviews). No actual usage data disclosed.

#### E2. No competitive analysis — -1.0

Separate from D2 — applied as business domain deduction. No competitive landscape mapping for the on-chain profile market. No analysis of whether the differentiation point ("RPG style") constitutes a sustainable competitive advantage.

#### E3. Revenue model timeline is unrealistic — -1.0

`strategy-gamification.md:350-354`:
- "Phase 2 (6-12 months): $500-2,000/month"
- "Phase 3 (12+ months): $2,000-10,000/month"

$500/month from premium skins? Is that 500 paying conversions at $1 each? Or 50 at $10? Without paid conversion rate benchmarks, these ranges are meaningless.

$10,000/month means 1,000 paying users at $10 each. Phase 1→2 conversion at 20-30% yields 200-450 token economy participants. At F2P average payment rate of 2-5%: 450 x 5% = 22 users x $10 = $220/month. Not $10,000.

→ Cap reached: -3.0

---

### F. Domain: Design/Architecture (cap -3.0, applied -2.0)

#### F1. No cost analysis for on-chain/off-chain separation — -1.0

`strategy-gamification.md:281-291` — On-chain vs off-chain separation table. States battle results will be recorded on-chain. Daily 1,000 battles x L2 transaction cost = ? Tokamak L2 gas cost not specified. Described as "Optimistic pattern" but if result recording is an L2 transaction, per-user cost exists. Paymaster covers first 5 only — from 6th battle, users pay L2 gas, amount unknown.

#### F2. Security audit cost/timeline for 4 smart contracts missing — -1.0

`strategy-gamification.md:314` — "Testnet deployment + security audit." Security audit costs $10,000-$50,000, but total grant request is $30,000. Audit alone could exceed the entire grant.

→ Domain applied: -2.0

---

## What Was Not Deducted

1. **Dual currency model (TON + SOUL)** — Recognizing regulatory risk and avoiding gambling classification through one-way exchange is correct. This structural judgment is acknowledged.

2. **3-phase progressive onboarding** — Starting without wallet connection → optional auth → token economy. Zero entry barrier principle is sound.

3. **UTM parameter implementation** — `utm.ts` actually works and `ShareButtons` auto-inserts platform-specific UTMs. Technical foundation exists. Analysis is simply absent.

4. **Sink/Faucet structure** — 6 burn paths, 6 earning paths. The structure itself is systematic. Only the simulation is missing.

5. **Risk matrix** — 6 risks organized by probability/impact/mitigation. "Having thought about risks" is better than most submissions.

6. **SEO foundation** — `sitemap.ts`, `robots.ts`, OG meta tags, Twitter card configuration. Basics are in place.

7. **Team announcement quality** — Appropriate length, structure, and tone for Slack. "Convince with working product + user data" approach is reasonable.

---

## Required Fixes for REVISE Verdict

### REJECT-1. Build Viral Measurement System

**Current**: Only `share_click` tracked.
**Required**: Share → OG image load → landing visit → generation complete. Each funnel step conversion rate must be measured.

**Specific implementation:**
- Add load counter to OG image route
- Calculate per-UTM-source `funnel_landing` → `funnel_generate_success` conversion rate
- K-factor dashboard: (total shares x inflow per share) / active users

### REJECT-2. SOUL Economy Simulation

A single spreadsheet:
- X-axis: Time (day/week/month)
- Y-axis: Total SOUL supply
- Variables: DAU, battles per user, mission completion rate, burn rate
- Scenarios: Optimistic (DAU 500), Neutral (DAU 100), Pessimistic (DAU 30)
- Result: 6-month SOUL supply, per-user SOUL holdings

### REJECT-3. Add Competitive Analysis

Minimum 3 competitors:

| Aspect | DegenScore | Rabbithole | Layer3 | Eth·RPG |
|--------|-----------|------------|--------|---------|
| DAU/MAU | ? | ? | ? | ? |
| Differentiation | | | | |
| Revenue model | | | | |
| Retention | | | | |

### REJECT-4. Realistic Revenue Model

Apply F2P benchmarks:
- Paid conversion rate: 2-5%
- ARPPU: $5-15/month
- Calculation: MAU x conversion rate x ARPPU = monthly revenue
- Scenarios by MAU (500 / 2,000 / 10,000)

### REJECT-5. Grant Budget Breakdown

Line-item decomposition of $30,000:

| Item | Amount | Basis |
|------|--------|-------|
| Labor | $X | $Y/hour x Z hours |
| Infrastructure | $X | $Y/month x Z months |
| Security audit | $X | Quote-based |
| Marketing | $X | Per-channel budget |

---

## Priority Matrix

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | REJECT-1 Viral measurement | Strategy foundation | Medium |
| P0 | REJECT-3 Competitive analysis | Market positioning | Low |
| P1 | REJECT-2 SOUL simulation | Economy viability | Medium |
| P1 | REJECT-4 Revenue realism | Business credibility | Low |
| P1 | REJECT-5 Grant breakdown | Funding credibility | Low |

---

## Comparison with Other Reviews

| Aspect | Ranking Review | Full Service Review | Marketing Review |
|--------|---------------|-------------------|-----------------|
| Score | 5.2/10.0 | 6.2/10.0 | 5.0/10.0 |
| Verdict | REJECT | REVISE | REJECT |
| Key Issue | ratingScore formula, scalability | In-memory state in serverless | Unverified viral assumption, no simulation |
| Strength | Pure function separation | Pipeline architecture, type safety | Dual currency model, onboarding structure |

The marketing strategy scores lowest because it suffers from the most fundamental problem: **assertions without evidence**. The code reviews at least had working implementations to evaluate. This strategy has frameworks but no numbers to validate them.
