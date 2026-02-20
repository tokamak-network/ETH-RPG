# Comrade Volkov's Review: Season Ranking System

> Commit: `83596b1` feat: add season ranking system + server-side analytics infrastructure
> Date: 2026-02-20
> Scope: 28 files, +2,759 / -17 lines
> Score: **5.2 / 10.0** — REJECT

---

## Scoring Summary

| Category | Deduction | Cap |
|----------|-----------|-----|
| Structural Flaws | -4.0 | -4.0 |
| Logical Gaps | -3.0 | -3.0 |
| Execution Gaps | -2.0 | -2.0 |
| Weak Expression | -1.0 | -1.0 |
| Domain: Code Review | -3.0 | -3.0 |
| Domain: Architecture | -2.0 | -2.0 |
| **Total** | **-15.0** | |
| **Final Score** | **5.2/10.0** | |

---

## Deduction Details

### Structural Flaws (cap -4.0)

#### 1. `getAllPlayerRecords()` scalability unverified — -2.0

`ranking-store.ts:114-126` — Fetches all player addresses via `SMEMBERS` then bulk-reads with `kv.mget()`. Works at 1,000 players. At 50,000? Redis `SMEMBERS` is O(N), and passing 50,000 keys to mget will hit Vercel KV's request size limit (~1MB payload). No pagination, no SCAN-based iteration. This function is called every 30 minutes by the cron job. As users grow, the cron dies.

#### 2. Battle `ratingScore` formula is unjustified — -2.0

`ranking-engine.ts:49-51` — `wins * 10 + losses * 2 + winRate`. No justification for these magic numbers anywhere. Why does losses get +2? Losing **increases** your score. A player with 100 battles and 0 wins (ratingScore = 200) outranks a player with 5 wins and 5 losses (ratingScore = 50+10+50=110). This is a "lose more, rank higher" system.

---

### Logical Gaps (cap -3.0)

#### 3. No data migration on season transition — -1.5

`season-manager.ts` — `endSeason()` only sets `isActive` to false. But `PlayerRecord` has no `seasonId`. Wins/losses accumulate across seasons. A player who fought 100 battles in Season 1 competes in the same battle ranking as a fresh Season 2 player. The concept of "season" becomes meaningless.

#### 4. Admin dashboard auth key exposed in URL query — -1.5

`admin/page.tsx:161-165` — `?key=YOUR_SECRET` passed via URL. The API endpoint uses Authorization header, but the key itself is parsed from the URL. This leaks the `ADMIN_SECRET` to browser history, referrer headers, and proxy logs. The project's own MEMORY.md states "query params leak in logs/history" — and then does exactly that.

---

### Execution Gaps (cap -2.0)

#### 5. All `ranking-store.ts` error handling is silent fail — -1.0

All 17 functions in `ranking-store.ts` swallow errors in catch blocks. They even proudly comment `// Silently fail`. Fire-and-forget is fine for non-critical writes, but the refresh cron endpoint also silently fails — if rankings break, nobody knows. At minimum, the refresh endpoint should surface errors.

#### 6. No integration tests for `ranking-store.ts` — -1.0

`ranking-store.ts` is 185 lines with zero tests. `ranking-recorder.test.ts` exists, but key pattern generation, KV call ordering, and ltrim behavior in ranking-store itself are not verified.

---

### Weak Expression (cap -1.0)

#### 7. Duplicated code patterns — -0.5

- `isKvConfigured()` defined identically in `ranking-store.ts` and `metrics.ts`
- `safeCompare()` defined identically in `admin/metrics/route.ts` and `ranking/refresh/route.ts`
- `CLASS_LABELS` defined identically in `admin/page.tsx` and `LeaderboardTable.tsx`
- DRY principle violated in 3 places

#### 8. `LeaderboardTable.tsx` at 275 lines with 6 components — -0.5

PowerRow, BattleRow, ExplorerRow, and 3 Header components all packed in one file. Project coding style guide says "200-400 lines typical". Not a hard violation, but 6 components in one file is a cohesion problem.

---

### Domain: Code Review (cap -3.0)

#### 9. Admin key URL exposure (security vulnerability) — -1.0

Separate from item 4. Secret exposed in URL qualifies as OWASP A07:2021 — Security Misconfiguration.

#### 10. `getMetricsSnapshot` N+1 query pattern — -1.0

`metrics.ts:134-137` — 16 counter keys fetched via individual `kv.get()` calls. 72 hourly keys also fetched via individual `kv.get()` calls. Total: 88 individual Redis HTTP round-trips. `mget()` is used in `ranking-store.ts` — why not here?

#### 11. Battle `ratingScore` is game-able (abuse vector) — -1.0

As noted in item 2, losses increase score. Two accounts can repeatedly lose to each other, and both scores go up. No Sybil attack defense whatsoever.

---

### Domain: Architecture (cap -2.0)

#### 12. `PlayerRecord` lacks `seasonId` — season data isolation impossible — -1.0

A single global `PlayerRecord` accumulates wins/losses. No season reset logic. The season concept only exists in leaderboard snapshot keys, not in the source data.

#### 13. Scalability bottleneck — full player set loaded into memory — -1.0

The refresh cron calls `getAllPlayerRecords()` which loads all data into a serverless function's memory. Vercel Functions have a 1024MB limit. At 500 bytes per `PlayerRecord`: 50,000 players = 25MB, 500,000 players = 250MB. Redis sorted sets (`ZADD`/`ZRANGEBYSCORE`) could sort server-side and return only top N.

---

## What Was Not Deducted

- `ranking-engine.ts` cleanly separates pure functions with no I/O
- Immutability patterns consistently applied (spread operator, new objects)
- Graceful fallback when KV is not configured (local dev experience considered)
- 4 test files with edge case coverage for ranking-engine
- `timingSafeEqual` used for timing attack prevention
- Type safety with `readonly` properties and generics

These are expected baseline quality — no bonus points, but they prevent the score from reaching the theoretical floor.

---

## Required Fixes for REVISE Verdict

### Fix 1: Redesign Battle `ratingScore` Formula

**Problem**: Losses contribute positive points. System is trivially game-able.

**Options**:
- Use ELO variant or Wilson score interval
- Or simply sort by `winRate` alone with higher minimum battle count (e.g., 20)
- Remove the `losses * 2` term at minimum
- Add Sybil resistance: limit battles between same address pair per day

### Fix 2: Add Season Separation to `PlayerRecord`

**Problem**: Wins/losses accumulate globally across seasons.

**Options**:
- Add `seasonId` to `PlayerRecord` key namespace: `ranking:player:${seasonId}:${address}`
- Or reset wins/losses to 0 in `endSeason()` by iterating and rewriting records
- Or maintain per-season player records and archive old seasons

### Fix 3: Remove Admin Key from URL

**Problem**: Secret leaks to browser history, referrer headers, proxy logs.

**Fix**:
- Store admin key in `localStorage` or `sessionStorage` (prompted once)
- Send only via `Authorization: Bearer` header (already done on API side)
- Never expose in URL query parameters

### Fix 4: Fix `getAllPlayerRecords` Scalability

**Problem**: `SMEMBERS` + `mget(all)` doesn't scale past ~10,000 players.

**Options**:
- Use Redis sorted sets (`ZADD` with power/ratingScore as score) — query top N directly
- Or use `SSCAN` with cursor + batch `mget` (chunks of 100)
- Or maintain pre-computed leaderboard sorted sets updated on each battle

### Fix 5: Eliminate `metrics.ts` N+1 Queries

**Problem**: 88 individual KV HTTP calls in `getMetricsSnapshot`.

**Fix**:
- Use `kv.mget()` for all 16 counter keys in one call
- Use `kv.mget()` for all 72 hourly keys in one call
- Total: 4 KV calls instead of 88

---

## Priority Order

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | Fix 1 — ratingScore formula | Ranking integrity | Low |
| P0 | Fix 3 — Admin key URL removal | Security | Low |
| P1 | Fix 2 — Season separation | Feature correctness | Medium |
| P1 | Fix 5 — N+1 queries | Performance | Low |
| P2 | Fix 4 — Scalability | Future-proofing | High |
