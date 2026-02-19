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

- [x] **Generate 5 sample cards** — Famous wallet cards for seeding content
  - vitalik.eth → Hunter Lv.33 | Power 60,570
  - sassal.eth → Summoner Lv.31 | Power 64,850
  - pranksy.eth → Priest Lv.49 | Power 77,230
  - hayden.eth → Priest Lv.11 | Power 35,710
  - jessepollak.eth → Hunter Lv.28 | Power 51,170

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

### Phase 2: PvP Battle System (~15h)
> Spec: `tasks/spec-pvp-battle.md`

- [ ] **Create battle engine**
  - `lib/skills.ts` — 8 class skills + 8 passives
  - `lib/battle.ts` — Turn-based simulation (deterministic PRNG, max 20 turns)
  - `lib/battle-narrative.ts` — Turn → RPG text descriptions
  - Full test coverage for battle engine + skills

- [ ] **Create battle API**
  - `api/battle/route.ts` — POST: accept 2 addresses, return BattleResult
  - Reuse existing `generateCharacterData` pipeline for both fighters
  - Cache battle results (key = sorted address pair)

- [ ] **Create battle pages**
  - `app/battle/page.tsx` — Dual address input form
  - `app/battle/[addr1]/[addr2]/page.tsx` — Battle result with animation
  - `app/battle/[addr1]/[addr2]/layout.tsx` — OG metadata
  - `hooks/useBattle.ts` — API call + loading state

- [ ] **Create battle UI components**
  - `components/BattleInput.tsx` — Two address fields with VS divider
  - `components/BattleArena.tsx` — Sprite face-off with HP bars
  - `components/BattleLog.tsx` — Turn-by-turn scrollable log
  - `components/BattleResult.tsx` — Winner banner + share buttons

- [ ] **Battle animation** — CSS-only turn replay
  - Attack animations (translateX + scale)
  - Floating damage numbers
  - HP bar transitions
  - Victory/defeat effects

- [ ] **Battle OG image** — `api/og/battle/[addr1]/[addr2]/route.tsx`
  - 1200x630 PNG with both fighters + winner

- [ ] **Landing page update** — Add "Battle Mode" CTA on main page

---

## MEDIUM

- [ ] **Include pixel art sprites in card/OG images** — Improve shared image quality
  - Currently `/api/og/` and `/api/card/` routes only use emoji
  - Mismatch between pixel art shown on frontend and shared images
  - `@vercel/og` (Satori) constraints make local image embedding difficult → base64 encoding needed

- [ ] **Add Telegram/Discord share buttons** — Cover major crypto community channels
  - Currently only Twitter + Farcaster + link copy supported
  - Missing Telegram/Discord where crypto users are concentrated

## BACKLOG (v1.1)

- [ ] Implement funnel event tracking (page_view, card_generated, share_click)
- [ ] Apply UTM parameter system (auto-insert utm_source in share links)
- [ ] Share copy A/B testing (6 sets in Korean/English)
- [ ] Product Hunt launch registration
- [ ] Reddit r/ethereum Show-off post
