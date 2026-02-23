# Eth·RPG TODO

## CRITICAL — Must-fix before launch

- [x] **Add `generateMetadata()` to result page** — Show personalized OG image in shared links
  - Implemented server-side `generateMetadata()` in `src/app/result/[address]/layout.tsx`
  - On cache hit: `"vitalik.eth — Elder Wizard Lv.58"` + personalized OG image
  - On cache miss: `"Character card for 0x1234...5678"` + address-based OG image

- [x] **Add card image download button** — Let users save/share the card directly
  - Added gold "Save Card" button to ShareButtons (prominent placement at top)
  - `/api/card/{address}` fetch → blob → programmatic download
  - Loading/error state handling complete

## HIGH

- [x] **Cache resilience — self-healing on cache miss** — Shared links no longer break on server restart
  - OG/Card routes now auto-regenerate data on cache miss with fallback lore templates
  - Implemented in `1ff80b6` via `lib/pipeline.ts` shared pipeline
  - CDN cache: `no-store` on failures, `max-age` only on success

- [x] **Vercel deploy** — Production deployment complete

- [x] **Fix OG/Card image rendering (Satori)** — Personalized images now render on production
  - Root cause: Satori requires `display: 'flex'` on every `<div>` with child nodes
  - Also switched `@vercel/og` → `next/og` (Next.js 16 compatibility)
  - Also fixed env var validation (`LITELLM_API_KEY` as alternative to `ANTHROPIC_API_KEY`)
  - Verified on production: OG 1200×630 (28KB), Card 1080×1350 (45KB) — `d66f620`

- [x] **OG preview testing** — Personalized cards confirmed working in shared link previews
  - vitalik.eth: Hunter Lv.33, Power 60,570 — renders with stats, lore, class icon

- [x] **Generate sample cards — all 8 classes represented** (verified 2026-02-23, v10)
  - pranksy.eth → Hunter Lv.49 | Power 69,640
  - vitalik.eth → Hunter Lv.33 | Power 61,545
  - degentrader.eth → Rogue Lv.34 | Power 63,555
  - sassal.eth → Summoner Lv.31 | Power 57,995
  - griff.eth → Merchant Lv.38 | Power 69,875
  - stani.eth → Priest Lv.32 | Power 62,505
  - 0xfoobar.eth → Elder Wizard Lv.17 | Power 31,335
  - ricmoo.eth → Guardian Lv.19 | Power 45,150
  - wilsoncusack.eth → Warrior Lv.14 | Power 23,680

---

## NEW FEATURES

### Phase 1: Achievement Badge System (~5h) ✅
> Spec: `tasks/spec-achievements.md` | Commit: `63fb6a7`

- [x] **Create `lib/achievements.ts`** — Achievement evaluation engine
  - 15 achievements across 4 tiers (legendary/epic/rare/common)
  - Pure function: `evaluateAchievements(raw, classification) → Achievement[]`
  - 37 unit tests in `lib/__tests__/achievements.test.ts`

- [x] **Create badge UI components**
  - `components/AchievementBadge.tsx` — Single badge (icon + tier border + tooltip)
  - `components/AchievementRow.tsx` — Horizontal row on card (max 6, "+N more")

- [x] **Integrate into pipeline + CharacterCard**
  - Added `AchievementTier`, `Achievement` types and `achievements` field to `GenerateResponse`
  - Call `evaluateAchievements()` in `pipeline.ts` after stats calculation
  - Render `<AchievementRow>` on CharacterCard front face
  - Shared `TIER_BORDER_COLORS` in `styles/themes.ts`

- [x] **Update OG/Card image routes** — Render badge icons in shared images
  - OG: 28px badges, Card: 32px badges, max 6 per image

### Phase 2: PvP Battle System (~15h) ✅
> Spec: `tasks/spec-pvp-battle.md` | Commit: `9e06fa8`

- [x] **Create battle engine**
  - `lib/matchups.ts` — Class advantage rings (Ring A + Ring B), 63 tests
  - `lib/skills.ts` — 8 class skills + 8 passives, 53 tests
  - `lib/battle.ts` — Turn-based simulation (mulberry32 PRNG + FNV-1a hash, max 20 turns), 18 tests
  - `lib/battle-narrative.ts` — Template-based turn narratives
  - `lib/battle-cache.ts` — Battle result cache (TTL 24h, max 5000)

- [x] **Create battle API**
  - `api/battle/route.ts` — POST: accept 2 addresses, return BattleResult
  - Parallel `generateCharacterData` with `skipAiLore: true`
  - Nonce-based deterministic battles via `crypto.randomUUID()`

- [x] **Create battle pages**
  - `app/battle/page.tsx` — Dual address input + Famous Duels shortcuts
  - `app/battle/[addr1]/[addr2]/page.tsx` — Battle result with arena animation
  - `app/battle/[addr1]/[addr2]/layout.tsx` — OG metadata
  - `hooks/useBattle.ts` — API call + loading state

- [x] **Create battle UI components**
  - `components/BattleInput.tsx` — Two address fields with VS divider
  - `components/BattleArena.tsx` — Sprite face-off with HP bars + turn playback
  - `components/BattleLog.tsx` — Turn-by-turn scrollable log
  - `components/BattleResult.tsx` — Winner banner + share buttons + rematch

- [x] **Battle animation** — CSS-only turn replay
  - Floating damage numbers (@keyframes float-up)
  - HP bar transitions (CSS transition: width)
  - Skip button + complete state log view

- [x] **Battle OG image** — `api/og/battle/[addr1]/[addr2]/route.tsx`
  - 1200x630 PNG with both fighters + matchup + winner banner

- [x] **Landing page update** — "Battle Mode" CTA on main page

---

## MEDIUM

- [x] **Include pixel art sprites in card/OG images** — Improve shared image quality
  - Created `lib/sprite-data.ts` — server-side sprite reader (fs + base64 data URL)
  - OG route: 56px sprite next to class name (replaces emoji)
  - Card route: 120px centered sprite (replaces emoji)
  - Battle OG route: 72px sprite per fighter (replaces emoji)
  - Fallback to emoji if sprite file missing

- [x] **Add Telegram/Discord share buttons** — Cover major crypto community channels
  - Telegram: `t.me/share/url` intent (opens native app)
  - Discord: copies share text + URL to clipboard (Discord auto-embeds via OG)
  - Added to both `ShareButtons.tsx` (character card) and `BattleResult.tsx` (battle)

## BACKLOG (v1.1)

- [x] Implement funnel event tracking (page_view, card_generated, share_click)
  - `lib/analytics.ts` — client-side `trackEvent()` (dev: console.debug, prod: sendBeacon → /api/events)
  - `hooks/useAnalytics.ts` — `usePageView()` hook (captures UTM + fires page_view)
  - `api/events/route.ts` — POST endpoint (Sentry breadcrumbs for Vercel logs)
  - Instrumented: landing, result, battle, battle_result pages + all share buttons + address input
- [x] Apply UTM parameter system (auto-insert utm_source in share links)
  - `lib/utm.ts` — `captureUtm()` (URL → sessionStorage), `appendUtmToUrl()` (auto-insert per platform)
  - Share URLs include `utm_source={platform}&utm_medium=social&utm_campaign=viral|battle`
- [ ] Share copy A/B testing (6 sets in Korean/English)
- [ ] Contract/treasury address detection — txCount=1 protocol addresses (ens.eth, lido.eth, etc.) are classified as human wallets. Consider `isContract()` check or txCount < 5 exclusion gate to prevent misclassification.
- [x] Product Hunt launch registration — draft ready in `tasks/launch-posts.md` §1
- [x] Reddit r/ethereum Show-off post — draft ready in `tasks/launch-posts.md` §5
- [x] Re-generate famous wallet cards — verified post utility-NFT fix (cache v3), no class changes for these wallets
