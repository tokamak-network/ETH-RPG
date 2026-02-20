# Comrade Volkov's Review: Eth·RPG Full Service

> Scope: 116 files, 17,060 LoC, 27 test files (6,398 LoC)
> Date: 2026-02-20
> Score: **6.2 / 10.0** — REVISE

---

## Scoring Summary

| Category | Deduction | Cap |
|----------|-----------|-----|
| Structural Flaws (A) | -4.0 | -4.0 |
| Logical Gaps (B) | -3.0 | -3.0 |
| Execution Gaps (C) | -2.0 | -2.0 |
| Weak Expression (D) | -1.0 | -1.0 |
| Domain: Code Review (E) | -3.0 | -3.0 |
| Domain: Architecture (F) | -3.0 | -3.0 |
| Domain: Business (G) | -2.0 | -3.0 |
| **Total** | **-18.0** | |
| **Final Score** | **6.2/10.0** | |

---

## Deduction Details

### A. Structural Flaws (cap -4.0)

#### A1. In-memory cache is the only cache layer — -2.0

`cache.ts:23` — `const cache = new Map<string, CacheEntry>()`. Vercel is serverless. Cache empties on every cold start. If the same address request hits a different instance, Alchemy API is called again. 10,000 MAX_CACHE_SIZE is only valid within a single instance.

`rate-limit.ts:17` has the same problem: `const limiter = new Map()`. Request 5 times on instance A, then 5 more on instance B — rate limit bypassed.

`battle-cache.ts` is identical. Three independent Maps relying on in-memory state in a serverless environment.

**Core assumption (cache/rate-limit) contradicts the deployment environment.**

#### A2. Alchemy API dependency is a SPOF — no alternatives — -2.0

`alchemy.ts` — Complete dependency on a single provider. If Alchemy API goes down, the entire service dies. No Infura, QuickNode, or self-hosted node fallback. No fallback provider. Timeout relies on Alchemy SDK defaults.

`lore.ts` implements a 4-step cascade for AI generation, yet the most critical data source (on-chain data) has no cascade at all.

---

### B. Logical Gaps (cap -3.0)

#### B1. Transfer collection capped at 1,000 — classification bias — -1.5

`alchemy.ts:14` — `const MAX_TRANSFER_COUNT = 1000`. Wallets like vitalik.eth with tens of thousands of transactions only analyze the first 1,000. Sorted ASC, so recent activity is completely ignored. A wallet that was a Hunter in 2021 but is now a DeFi power user gets locked into its historical classification.

Worse: this limitation is not disclosed to users. It presents as "accurate analysis" but large wallet classifications have sample bias.

#### B2. Gas cost estimation uses arbitrary constants — -1.5

`alchemy.ts:16-21` — `GAS_COST_BY_CATEGORY`: ERC20 transfer = 0.003 ETH, ERC721 = 0.006 ETH. Gas prices between 2020 and 2024 differ by 10x. Instead of fetching actual gas spent, it multiplies by category constants. Since MP stat is gas-based, MP is effectively a "weighted count of transfer types" rather than actual gas consumption. Stat meaning is distorted.

---

### C. Execution Gaps (cap -2.0)

#### C1. No API response time management — -1.0

`pipeline.ts` — `generateCharacterData()` sequentially:
1. 4 Alchemy API calls (parallel — good)
2. 2 AI lore generations (parallel)

Total: Alchemy latency 2-5s + Claude API 3-8s = 5-13s. Client sees loading screen.

No timeout settings. No `AbortController` on `fetch()`. If Claude API takes 15 seconds, it waits. Silently relies on Vercel Functions default timeout (10s hobby, 60s Pro). No explicit timeout configuration.

#### C2. E2E tests exist but CI pipeline integration unclear — -1.0

Playwright dependency exists and artifacts are in `.gitignore`, but `package.json` has no `test:e2e` script. Cannot verify E2E runs automatically in CI. No build command in `vercel.json`.

28 unit test files exist — this part is not deducted.

---

### D. Weak Expression (cap -1.0)

#### D1. Code duplication patterns — -0.5

Same issues from ranking review, plus more across the full service:
- `isKvConfigured()`: `ranking-store.ts`, `metrics.ts`
- `safeCompare()`: `admin/metrics/route.ts`, `ranking/refresh/route.ts`
- `CLASS_LABELS`: `admin/page.tsx`, `LeaderboardTable.tsx`
- `formatAddress`/`shortenAddress`: `LeaderboardTable.tsx`, `format-utils.ts`

5+ utilities duplicated across the service.

#### D2. FighterState is mutable, violating immutability principles — -0.5

`skills.ts:6-19` — All FighterState fields are non-readonly. Project `CLAUDE.md` and `coding-style.md` declare "ALWAYS create new objects, NEVER mutate", yet `battle.ts` performs direct mutation across 443 lines (`actor.currentHp -= damage`, `target.isStunned = true`, `actor.skillCooldown -= 1`).

Mutation may be justified for battle simulation performance, but this exception should be documented. Self-declared principle contradicts actual code.

---

### E. Domain: Code Review (cap -3.0)

#### E1. Rate limiter is ineffective in serverless — -1.0

From A1, but separate security deduction. In-memory rate limiter provides no defense against DDoS / API abuse. Vercel Edge Config or Redis-based rate limiter needed. Current state: attacker can exhaust Alchemy/Claude API costs with repeated requests.

#### E2. Admin key URL exposure — -1.0

`admin/page.tsx:161-165` — URL query `?key=YOUR_SECRET`. Previously flagged in ranking review, still unfixed. OWASP A07:2021.

#### E3. lore.ts sanitizeLore bypass possible — -1.0

`lore.ts:166-180` — `FORBIDDEN_WORDS` check is exact match only. Filters "ETH" but "eth", "Eth", "E T H" all pass. No case-insensitive comparison. If Claude returns "Eth", it's exposed directly. Questionable whether `sanitizeLore` deserves the name "sanitize".

---

### F. Domain: Architecture (cap -3.0)

#### F1. Cache/rate-limit/battle-cache triple in-memory SPOF — -1.0

Stateful in-memory in serverless is an architectural contradiction. Vercel KV is used for ranking/metrics but not for the most important generate cache. Inconsistent selective KV usage.

#### F2. No version management/migration strategy for KV data — -1.0

`cache.ts` has `CACHE_SCHEMA_VERSION=2`, but KV-stored `PlayerRecord`, `Season`, `BattleRecord` have no schema version. If `types.ts` types change, existing KV data causes runtime errors. No migration strategy.

#### F3. Separation of concerns: business logic mixed in route handler — -1.0

`battle/route.ts` — Fighter object assembly, nonce generation, cache check, result storage all in route handler. `generate/route.ts` cleanly separates via `pipeline.ts`, but battle does not. Inconsistency.

---

### G. Domain: Business (cap -3.0, applied -2.0)

#### G1. Viral loop core metrics tracking insufficient — -1.0

`CLAUDE.md` specifies "CT/Farcaster seeding -> viral loop" but only tracks `share_twitter` / `share_farcaster`. Actual CTR, post-share revisit rate, shared image load counts are not tracked. Cannot calculate viral coefficient (K-factor). Claims "viral loop" without measurement capability.

#### G2. No Alchemy API cost prediction/control mechanism — -1.0

Every generate request: 4 Alchemy API calls. Battle: 8 calls (2 fighters). If it goes viral? Daily 1,000 visitors x 2.5 avg generates = 2,500 x 4 = 10,000 Alchemy calls/day. Alchemy free tier is 300M CU/month, but `getAssetTransfers` is expensive (150 CU/call). No daily cost estimate, no cost alerts, no CU consumption monitoring.

---

## What Was Not Deducted

1. **Pure function separation pattern** — ranking-engine, stats, class, classifier, achievements, matchups, season-manager. All pure computation with no I/O. Consistent.

2. **pipeline.ts 10-step pipeline structure** — Cache → On-chain → Classify → Class → Stats → Achievements → Lore → Response → Cache. Clear responsibility separation.

3. **Type system** — types.ts 261 lines, consistent readonly application, discriminated unions (RankingEntry), const assertions.

4. **Battle system determinism** — FNV-1a + Mulberry32 PRNG. Same nonce = same result. Replayable. This is correct.

5. **8-class matchup system** — Dual ring structure (5-ring + 3-ring). Only adjacent classes have advantage/disadvantage, non-adjacent = neutral. Mathematically consistent.

6. **Lore 4-step cascade** — LiteLLM primary → fallback → Anthropic direct → template. At least here, alternatives exist.

7. **Sentry integration, Vercel Analytics/SpeedInsights, ErrorBoundary, accessibility (aria-live, aria-busy).**

8. **27 test files, 6,398 lines** — Pure logic module coverage. Fixtures separated, `vi.hoisted()` pattern correctly used.

---

## Required Fixes for PROCEED Verdict

### Priority 0 — Architecture Flaws (Service Reliability)

#### P0-1. Migrate cache/rate-limit to Vercel KV

Already using KV for ranking. Move generate cache and rate limiter to KV as well. Keep in-memory Map as fallback only when KV is not configured.

**Approach:**
- `cache.ts` → check KV first, fall back to in-memory
- `rate-limit.ts` → use KV `incr` with TTL for sliding window
- `battle-cache.ts` → same pattern

#### P0-2. Add Alchemy fallback provider

Add Infura/QuickNode as secondary provider. Apply cascade pattern to `alchemy.ts` like `lore.ts`.

**Approach:**
```
1. Primary: Alchemy SDK
2. Fallback: ethers.js + Infura/QuickNode RPC
3. Error: throw with clear message
```

#### P0-3. Fix Admin key URL exposure

Store admin key in `localStorage` or `sessionStorage` (prompted once). Send only via `Authorization: Bearer` header. Never expose in URL query parameters.

### Priority 1 — Data Accuracy

#### P1-1. Implement transfer pagination or recency bias

For large wallets, either:
- Use `pageKey` to iterate all transfers (expensive)
- Change sort order to DESC to analyze most recent 1,000 (simple fix)
- Disclose limitation to user ("Based on your most recent 1,000 transfers")

#### P1-2. Case-insensitive sanitizeLore

Change `FORBIDDEN_WORDS` comparison to use `.toLowerCase()` on both sides.

### Priority 2 — System Maturity

#### P2-1. Explicit API timeout settings

Add `AbortController` + 10-second timeout to Alchemy/Claude `fetch()` calls.

#### P2-2. Eliminate code duplication

Consolidate `isKvConfigured`, `safeCompare`, `CLASS_LABELS` each into a single module.

#### P2-3. Separate battle route into pipeline pattern

Create `battle-pipeline.ts` to extract business logic from route handler, matching the pattern of `generate/route.ts` → `pipeline.ts`.

---

## Priority Matrix

| Priority | Fix | Impact | Effort | Blocks |
|----------|-----|--------|--------|--------|
| P0 | P0-1 Cache/rate-limit to KV | Service reliability | Medium | — |
| P0 | P0-2 Alchemy fallback | Availability | Medium | — |
| P0 | P0-3 Admin key URL fix | Security | Low | — |
| P1 | P1-1 Transfer recency | Data accuracy | Low | — |
| P1 | P1-2 sanitizeLore case fix | Content safety | Low | — |
| P2 | P2-1 API timeouts | Resilience | Low | — |
| P2 | P2-2 Code dedup | Maintainability | Low | — |
| P2 | P2-3 Battle pipeline | Architecture | Medium | — |

---

## Comparison with Ranking Review

| Aspect | Ranking Review | Full Service Review |
|--------|---------------|-------------------|
| Score | 5.2/10.0 | 6.2/10.0 |
| Verdict | REJECT | REVISE |
| Key Issue | ratingScore formula, scalability | In-memory state in serverless |
| Strength | Pure function separation | Pipeline architecture, type safety |

The full service scores 1 point higher than the ranking subsystem because the pure logic layer's quality pulls the overall score up. However, the infrastructure layer's fundamental contradiction (serverless + in-memory state) anchors it below PROCEED threshold.
