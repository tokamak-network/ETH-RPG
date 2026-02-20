# Comrade Volkov's Review: Marketing Plan (7-Day Launch)

> Scope: marketing-plan.md (423 lines) + marketing-plan-kr.md (421 lines) + implemented infrastructure (analytics, UTM, share, admin dashboard, OG routes)
> Date: 2026-02-20
> Score: **7.3 / 10.0** — REVISE

---

## Scoring Summary

| Category | Deduction | Cap |
|----------|-----------|-----|
| Structural Flaws (A) | -1.5 | -4.0 |
| Logical Gaps (B) | -2.0 | -3.0 |
| Execution Gaps (C) | -1.5 | -2.0 |
| Weak Expression (D) | -0.5 | -1.0 |
| Domain: Marketing (E) | -2.0 | -3.0 |
| Domain: Technical (F) | -1.5 | -3.0 |
| Bonus: Execution Credit | +2.0 | +2.0 |
| **Total** | **-7.0** | |
| **Final Score** | **7.3/10.0** | |

**Execution Credit Note**: Items [1]-[7] all DONE with commit hashes. UTM fully implemented. Analytics integrated. Share expanded to 6 platforms. Plans that ship earn credit. +2.0 applied (max +2.0).

---

## Deduction Details

### A. Structural Flaws (cap -4.0, applied -1.5)

#### A1. Funnel measurement system has dead counters — -1.5

`marketing-plan.md:267-272` — 5 funnel events defined: `page_view`, `address_submit`, `card_generated`, `share_click`, `card_download`.

**However, actual implementation is misaligned:**

Admin dashboard (`admin/page.tsx`) displays 5 funnel steps:
1. `funnel_landing` — **WORKS** (page_view mapped in events route)
2. `funnel_input_focus` — **DEAD COUNTER** (never incremented; client fires `address_input_start` but events API doesn't map it)
3. `funnel_generate_start` — **DEAD COUNTER** (no event fires this)
4. `funnel_generate_success` — **DEAD COUNTER** (client fires `card_generated` but events API doesn't map it)
5. `funnel_share` — **WORKS** (via `trackShare()`)

Only 2 of 5 funnel steps receive data. The marketing plan defines the funnel but does not verify that the implementation actually populates it. A funnel with 3 dark steps measures nothing — it decorates a dashboard.

This is a structural flaw because the plan's Section 7 (Funnel Measurement) is the foundation for all KPI decisions. If the funnel can't measure input→generation conversion (40% target), the Day 7 Go/No-Go decision has no data basis.

→ Applied: -1.5

---

### B. Logical Gaps (cap -3.0, applied -2.0)

#### B1. K-factor formula uses assumed constants, not measured values — -1.0

`marketing-plan.md:88-94`:
```
K = share rate × inflow per share × inflow conversion rate
K = 0.2 × 5 × 0.5 = 0.5
```

Three problems:
1. "Inflow per share: 5 (CT average reach)" — Source? CT average impressions per post ≠ clicks. A 1K-follower account gets ~50 impressions per post, but click-through rate is 1-3%. That's 0.5-1.5 clicks, not 5.
2. "Inflow conversion rate: 50% (up to address input)" — 50% of people who click a link will paste a wallet address? This is aspirational, not benchmarked. Average web conversion from landing to action is 2-5% for tools.
3. The formula itself is correct in structure, but plugging in 3 unverified numbers and declaring K=0.5 ✓ is backwards reasoning — you chose inputs that produce the desired output.

The strategy-gamification.md (updated) correctly identifies this issue and states "Do NOT claim viral until K > 0.3 measured." The marketing plan predates that fix and still presents K=0.5 as a given.

#### B2. Day 7 success criteria (UV 500) has no channel-by-channel buildup — -1.0

`marketing-plan.md:393-397`:
- Success: UV 500+, generations 200+, share rate 20%+
- Average: UV 200-500
- Failure: UV < 200

But the channel execution plan (Section 5) targets:
- CT: 50 seed users
- Farcaster: 30 users
- Discord: 10 servers (no per-server UV estimate)
- Telegram: 5 groups (no per-group UV estimate)

50 + 30 = 80 from named channels. Where do the other 420 UV come from? Implied answer: viral spread from those 80. But this is circular — claiming UV 500 from K=0.5 viral spread, which itself is unverified.

A credible plan would show: CT (50) + Farcaster (30) + Discord (100) + Telegram (50) + viral from K=0.3 (...) = 500. No such decomposition exists.

→ Cap applied: -2.0

---

### C. Execution Gaps (cap -2.0, applied -1.5)

#### C1. KOL seeding lacks specific targets — -0.5

`marketing-plan.md:125-128`:
- "Pre-generate cards for famous wallet addresses (vitalik.eth, etc.)"
- "Target: Crypto influencers with 1K-50K followers"

Who specifically? "5-10 people" in a 1K-50K range covers thousands of accounts. No shortlist of 5 specific names with handles. No response rate estimate. No follow-up cadence.

The sample card strategy (Section 8) lists 5 famous *wallets* to pre-generate, but these are showcases, not DM targets. vitalik.eth isn't going to RT your project because you made his card.

#### C2. Copy A/B testing mechanism undefined — -1.0

`marketing-plan.md:243-260` — 12 copy variants (6 Korean, 6 English). Good to have options.

`marketing-plan.md:364` — "Compare share copy performance → focus on top performers."

How? No mechanism exists to track which copy variant was shared. All share buttons use the same default copy text (variant #1). There's no UI to select copy variant, no A/B assignment, no per-variant UTM parameter. "Compare performance" requires measurement, and no measurement mechanism is described or built.

→ Applied: -1.5

---

### D. Weak Expression (cap -1.0, applied -0.5)

#### D1. "Viral loop complete" assertion without measurement — -0.5

`marketing-plan.md:32` — "All 6 steps operational. Viral loop complete."

The 6-step checklist verifies that each *technical step works* (buttons exist, links load). This is a "feature complete" check, not a "viral loop complete" check. A viral loop is complete when step 6 → step 1 creates measurable return traffic. The plan cannot measure this because the funnel has dead counters (A1) and K-factor uses assumed values (B1).

Calling a sequence of working buttons a "viral loop" conflates feature readiness with viral mechanics. The strategy-gamification.md (updated) correctly distinguishes these — the marketing plan should align.

→ Applied: -0.5

---

### E. Domain: Marketing (cap -3.0, applied -2.0)

#### E1. No content calendar with accountable deliverables — -1.0

`marketing-plan.md:327-373` — Execution timeline exists but is organized by time slots, not by deliverable-to-metric mapping.

Missing:
- Which specific person writes each CT post? (Dev? Growth? Both?)
- Which 5 Discord servers on Day 1 vs Day 2-3?
- What is the "Class Characteristics infographic" — who designs it, with what tool, by when?
- "Famous Wallet Power Ranking" secondary content — is this a single Twitter thread? A series of tweets? An image?

The timeline lists *tasks* but not *deliverables with acceptance criteria*. "Discord seeding begins (5 servers)" is a task. "Post in DeFi Korea #general with Korean copy variant #3, screenshot of vitalik.eth card" is a deliverable.

#### E2. No post-Day-7 retention plan — -1.0

`marketing-plan.md` ends at Day 7 with a Go/No-Go decision. If the verdict is "Success," the action is "Proceed with Phase 2 expansion." But Phase 2 of *what*? The gamification strategy? The marketing plan itself?

There's no Week 2-4 retention strategy:
- What happens to Day 1 visitors who never return?
- Is there a re-engagement campaign?
- Content cadence after launch week?
- Community management plan?

The Product Hunt / Reddit / HN push is in "Phase 3: Global Expansion (Week 2)" but this feels like a continuation of launch seeding, not a retention strategy. Users acquired in Week 1 need a reason to return in Week 2 beyond "we posted on Reddit."

→ Applied: -2.0

---

### F. Domain: Technical (cap -3.0, applied -1.5)

#### F1. OG image route has no load tracking — -1.0

The marketing plan's viral loop depends on step [3]: "Recipient sees card in link preview." The OG image route (`/api/og/[address]`) renders personalized images but has zero tracking. Every OG image load represents a potential viral inflow that is completely invisible.

This is the easiest and highest-ROI counter to add: increment `og_image_load` in the OG route. Without it, you cannot measure the most important viral mechanic — link preview impressions.

The strategy-gamification.md (updated Section 4-1) explicitly requires "Add load counter to OG image route" as part of the Viral Measurement System. The marketing plan predates this requirement but should reference it.

#### F2. KakaoTalk share button still missing — -0.5

`marketing-plan.md:50` — "Telegram/KakaoTalk share buttons: Remaining."
`marketing-plan.md:201-204` — KakaoTalk seeding plan exists (5 rooms/day).

Telegram was added post-plan. KakaoTalk was not. The plan targets Korean crypto communities via KakaoTalk but the share button to enable easy sharing within KakaoTalk doesn't exist. Users would need to manually copy the link.

Not a severe issue (copy link works), but inconsistency between plan and implementation.

→ Applied: -1.5

---

## What Was Not Deducted

1. **Execution record with commit hashes** — Items [1]-[7] all DONE with specific commits. This is rare in marketing plans. Most plans list what to do; this one tracked what was done. +2.0 execution credit applied.

2. **3-phase rollout structure** — Soft Launch (Day 1-2) → Expansion (Day 3-5) → Global (Week 2). Correctly sequences from small (personal network) to large (Product Hunt/Reddit). Not starting with a Product Hunt launch on Day 1 is a good judgment call.

3. **Anti-persona definition** — "Users without wallets" identified as non-target. This prevents wasting effort on general-audience channels.

4. **Psychological trigger analysis** — Comparison desire, identity assignment, AI lore resonance. These 3 triggers are well-identified and correctly mapped to specific copy strategies.

5. **Risk matrix** — 6 risks with probability/impact/mitigation. "Viral fails (K < 0.3)" is correctly identified as Medium probability / High impact with concrete mitigation (copy/CTA change on Day 3). Pragmatic.

6. **Share copy quality** — 12 variants across 2 languages with clear purpose labels. The copy itself follows solid direct-response principles: numbers first, question endings, safety messaging.

7. **UTM system design** — 4 distinct UTM schemas for seeding/share/ProductHunt/community. Correctly implemented in `utm.ts` with per-platform attribution.

8. **Discord/Telegram target list** — 10 specific Discord servers and 5 specific Telegram groups, prioritized. More specific than most indie project marketing plans.

9. **Dual EN/KR execution** — Both English and Korean markets planned simultaneously with language-appropriate channels (CT+Discord for EN, KakaoTalk+Telegram for KR).

---

## Required Fixes for PROCEED Verdict

### REVISE-1. Fix Funnel Dead Counters

**Current**: 3 of 5 funnel steps (`input_focus`, `generate_start`, `generate_success`) display on dashboard but receive no data.

**Required**: Map existing client events to funnel counters in the events API route:
- `address_input_start` → increment `funnel_input_focus`
- Add new event `generate_start` (fire when API call begins) → increment `funnel_generate_start`
- `card_generated` → increment `funnel_generate_success`

**Effort**: Low (3 lines in events route + 1 new event emission in hook)

### REVISE-2. Replace K-factor Assumptions with Measurement Plan

**Current**: K = 0.2 × 5 × 0.5 = 0.5 using 3 assumed values.

**Required**: Replace the "Target" section with:
```
K-factor measurement plan:
- share_rate = funnel_share / funnel_generate_success (measured)
- inflow_per_share = utm_source=share page_views / funnel_share (measured)
- K = share_rate × inflow_per_share (no assumed conversion rate needed)
- Measurement starts Day 1, first K-factor calculation Day 3
- If K < 0.3 on Day 3: execute copy/CTA pivot
```

Align with strategy-gamification.md Section 4-1 (Viral Measurement System).

**Effort**: Low (text edit only — infrastructure already exists in strategy doc)

### REVISE-3. Add OG Image Load Counter

**Current**: OG route renders images with zero tracking.

**Required**: Add single `incrementCounter('og_image_load')` call in OG route. This enables measuring link preview impressions, the critical step between "share" and "return visit."

**Effort**: Low (1 line of code)

### REVISE-4. Add Channel-by-Channel UV Decomposition

**Current**: UV 500 target with no per-channel breakdown.

**Required**: Add a table:

| Channel | Target UV | Basis |
|---------|----------|-------|
| CT (personal) | 30-50 | 1K followers × 5% CTR |
| Farcaster | 20-30 | /ethereum channel reach |
| Discord (10 servers) | 50-100 | 5-10 per server |
| Telegram (5 groups) | 30-50 | 6-10 per group |
| KOL amplification | 50-100 | 2-3 RTs × 50 clicks |
| Viral spread (K=0.3) | ~60-100 | (200 generations × 20% share × 0.3 K inflow) |
| **Total** | **240-430** | |

If this math shows UV 500 is optimistic, adjust the Go/No-Go accordingly. Honesty > ambition.

**Effort**: Low (text edit)

---

## Priority Matrix

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | REVISE-1 Funnel dead counters | Measurement foundation | Low |
| P0 | REVISE-3 OG load counter | Viral measurement | Low |
| P1 | REVISE-2 K-factor measurement plan | Strategy credibility | Low |
| P1 | REVISE-4 Channel UV decomposition | Target realism | Low |

All 4 fixes are low effort. 3 are text edits to the document; 1 requires ~10 lines of code.

---

## Comparison with Other Reviews

| Aspect | Ranking Review | Full Service Review | Marketing Strategy Review | Marketing Plan Review |
|--------|---------------|-------------------|--------------------------|---------------------|
| Score | 5.2/10.0 | 6.2/10.0 | 8.5/10.0 (v3) | 7.3/10.0 |
| Verdict | REJECT | REVISE | PROCEED | REVISE |
| Key Issue | ratingScore formula, scalability | In-memory state in serverless | (All fixed in v3) | Funnel dead counters, unverified K |
| Strength | Pure function separation | Pipeline architecture, type safety | Dual currency, competitive analysis | Execution record, 3-phase rollout |

The marketing plan scores well because it *shipped*. Commit hashes prove execution. But the measurement layer — the thing that tells you whether your execution worked — has gaps. Fix the funnel counters, measure K honestly, and this becomes a solid launch playbook.
