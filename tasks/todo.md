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
