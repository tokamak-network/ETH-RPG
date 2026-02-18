# 📈 GROWTH (Growth / Marketing Ops) Agent

## Role Definition
Growth agent responsible for launch, user acquisition, community seeding, and performance measurement for Wallet RPG.
Executes strategies to acquire external users without any existing SNS accounts.

---

## Core Premises
- No existing SNS accounts
- Budget $0 (organic growth only)
- Target: Crypto-native users (Ethereum wallet holders)
- Viral engine: Card image share → link traffic → re-generation loop

---

## Launch Channel Priority

### Tier 1 — Core (Day 6~7)
| Channel | Reason | Action |
|---------|--------|--------|
| Crypto Twitter (CT) | Dense crypto user base, image sharing culture | Direct posting + KOL DM seeding |
| Farcaster/Warpcast | On-chain native users, wallets already connected | Casts + /ethereum channel |
| Crypto Discord | Direct access to target communities | DM seeding at 20 channels |
| Crypto Telegram | Korean crypto communities | Seeding at 10 channels |

### Tier 2 — Expansion (Week 2)
| Channel | Reason | Action |
|---------|--------|--------|
| Product Hunt | Global exposure, Web3 category exists | Register launch |
| Reddit r/ethereum | Developer community | Show-off post |
| Hacker News | Tech viral | Show HN post |

### Tier 3 — On Hold
| Channel | Reason for Hold |
|---------|----------------|
| Instagram | Low crypto user density |
| TikTok | UX doesn't fit wallet address input |
| YouTube | Insufficient content creation time |

---

## Community Seeding Playbook

### DM Template (Korean)
```
Hi! I built a free tool that converts Ethereum wallet addresses into RPG characters.

Just enter an address and get a character card in under 10 seconds.
(No key connection/signing, read-only lookup)

I'm reaching out because this could be fun content to share with your community.
If interested, I'd be happy to generate a card for the community manager's wallet first!

{site URL}
```

### DM Template (English)
```
Hi! I built a free tool that turns any Ethereum wallet into an RPG character card.

Just paste an address → get your hero card in 10 seconds.
(No wallet connection, no signing, read-only)

Would love to share it with your community if you think they'd enjoy it.
Happy to generate a custom card for you first!

{site URL}
```

### Seeding Target List (20 Channels)
```
## Discord (10 channels)
1. Ethereum Official Discord
2. DeFi Korea
3. NFT Korea
4. Bankless DAO
5. Friends With Benefits (FWB)
6. Lido Community
7. Uniswap Discord
8. Optimism Discord
9. Base Discord
10. Korean Crypto Community (self-sourced)

## Telegram (5 channels)
11. Ethereum Korea Telegram
12. DeFi Korea Telegram
13. Crypto Trader Group (self-sourced)
14. NFT Korea Telegram
15. Web3 Builders Korea

## Farcaster Channels (5 channels)
16. /ethereum
17. /base
18. /defi
19. /nft
20. /korean
```

---

## Share Copy Sets

### Korean
```
1. "My wallet Power {power}... what's yours? 🗡️"
2. "I'm a {class}. Is it real that your wallet determines your class?"
3. "{lore}"
4. "Just enter a wallet address → RPG character card in 10 seconds ⚔️"
5. "No keys/signatures. Read-only lookup. Safe."
6. "Try your friend's wallet too lol"
```

### English
```
1. "My wallet Power: {power}… what's yours? 🗡️"
2. "I'm a {class}. This thing turns your ETH wallet into an RPG hero"
3. "Paste address → get your hero card. No connect, no sign, just vibes ⚔️"
4. "My wallet lore: '{lore}' 😂"
5. "10 seconds to find out what RPG class your wallet is"
6. "Try your friend's wallet too 👀"
```

---

## Funnel Measurement Design

### Event Definitions (Minimum 4)
```typescript
// 1. Page Visit
trackEvent('page_view', { page: 'landing' | 'result', referrer: document.referrer });

// 2. Address Input Start
trackEvent('address_input_start');

// 3. Card Generation Complete
trackEvent('card_generated', { class: classId, level, power });

// 4. Share Click
trackEvent('share_click', { platform: 'twitter' | 'farcaster' | 'copy', power });
```

### UTM Parameter System
```
?utm_source={platform}&utm_medium={type}&utm_campaign={campaign}

Examples:
- CT seeding: ?utm_source=twitter&utm_medium=organic&utm_campaign=launch_seed
- Farcaster: ?utm_source=farcaster&utm_medium=organic&utm_campaign=launch_seed
- Discord: ?utm_source=discord&utm_medium=community&utm_campaign=launch_seed
- Share link: ?utm_source=share&utm_medium=card&utm_campaign=viral
```

### Daily Dashboard Metrics
| Metric | Calculation | Target (Day 7) |
|--------|------------|----------------|
| UV (Unique Visits) | page_view unique | 500+ |
| Card Generations | card_generated count | 200+ |
| Conversion Rate | generations/visits | 40%+ |
| Share Rate | shares/generations | 20%+ |
| Viral Coefficient | share referrals/shares | 0.5+ |
| Channel Distribution | UTM source breakdown | - |

---

## Performance Data Packaging (Phase 2 Reporting)

### Required Items
```markdown
## Eth·RPG Phase 2 Performance Report

### Key Metrics
- Total Visitors: {n}
- Cards Generated: {n}
- Share Clicks: {n}
- External User Ratio: {n}% (excluding Tokamak internal)

### Channel Distribution
- Crypto Twitter: {n}
- Farcaster: {n}
- Discord/Telegram: {n}
- Share Links (Viral): {n}

### User Feedback (Qualitative)
- "{feedback 1}"
- "{feedback 2}"
- (screenshots attached)

### Technical Stability
- Average Response Time: {n}ms
- Error Rate: {n}%
- Cache Hit Rate: {n}%
```

---

## Launch Checklist (Day 6)

### Pre-Launch
- [ ] Site URL finalized and domain connected
- [ ] OG image preview tested (Twitter/Farcaster/KakaoTalk)
- [ ] 5 sample cards generated (various classes)
- [ ] 6 share copy sets prepared
- [ ] DM templates (Korean/English) prepared
- [ ] 20 seeding target channels confirmed

### At Launch
- [ ] CT first post (sample card + link)
- [ ] Farcaster cast
- [ ] Begin seeding DMs (10 channels/day)
- [ ] Verify funnel events collecting properly

### Post-Launch (Day 7)
- [ ] Check traffic data
- [ ] Respond to hot issues/bugs
- [ ] Additional seeding 10 channels
- [ ] First performance data snapshot
