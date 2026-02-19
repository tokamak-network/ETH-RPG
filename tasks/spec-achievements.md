# Feature Spec: Achievement Badge System

## Overview
Analyze on-chain wallet activity and award RPG-themed achievement badges. Badges are displayed on the character card front face and included in shared OG/card images, adding collectible depth and encouraging sharing.

---

## Achievement Definitions

### Tier: Legendary (gold border, max 3 per wallet expected)

| ID | Name | Icon | Condition | Data Source |
|----|------|------|-----------|-------------|
| `genesis` | Genesis Block | `🏛️` | First tx before 2016-01-01 | `raw.firstTxTimestamp` |
| `merge_witness` | Merge Witness | `🔮` | Active during The Merge (2022-09-15 ± 7 days) | `raw.firstTxTimestamp`, `raw.lastTxTimestamp` |
| `gas_titan` | Gas Titan | `🔥` | Total gas spent > 10 ETH | `raw.gasSpentEth` |

### Tier: Epic (purple border)

| ID | Name | Icon | Condition | Data Source |
|----|------|------|-----------|-------------|
| `diamond_hands` | Diamond Hands | `💎` | Wallet age >= 4 years AND balance > 0.1 ETH | `raw.firstTxTimestamp`, `raw.balance` |
| `bridge_runner` | Bridge Runner | `🌉` | Bridge tx count >= 10 | `classification.bridgeCount` |
| `contract_sage` | Contract Sage | `📜` | Unique contracts interacted >= 200 | `classification.uniqueContracts` |
| `dex_master` | DEX Master | `⚡` | DEX swap count >= 100 | `classification.dexSwapCount` |

### Tier: Rare (blue border)

| ID | Name | Icon | Condition | Data Source |
|----|------|------|-----------|-------------|
| `nft_collector` | NFT Collector | `🖼️` | NFT ratio >= 40% | `classification.nftRatio` |
| `stable_hand` | Stable Hand | `🏦` | Stablecoin ratio >= 50% | `classification.stableRatio` |
| `veteran` | Veteran | `⚔️` | Total tx count >= 1000 | `raw.txCount` |
| `whale` | Whale | `🐋` | Balance >= 100 ETH | `raw.balance` |
| `survivor` | Survivor | `🛡️` | Active across 3+ crypto crisis events | `crypto-events` overlap count |

### Tier: Common (gray border)

| ID | Name | Icon | Condition | Data Source |
|----|------|------|-----------|-------------|
| `first_step` | First Step | `👣` | Has at least 1 transaction | `raw.txCount >= 1` |
| `explorer` | Explorer | `🧭` | Unique contracts >= 10 | `classification.uniqueContracts` |
| `gas_burner` | Gas Burner | `💨` | Gas spent > 0.1 ETH | `raw.gasSpentEth` |

---

## Type Definitions

```typescript
// src/lib/types.ts — additions

type AchievementTier = 'legendary' | 'epic' | 'rare' | 'common';

interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly tier: AchievementTier;
  readonly description: string;
}

// Add to GenerateResponse
interface GenerateResponse {
  // ...existing fields
  readonly achievements: readonly Achievement[];
}
```

---

## Implementation Plan

### File: `src/lib/achievements.ts` (NEW)

Pure function module. No side effects, no API calls.

```
Input:  WalletRawData + TxClassification + CryptoEvent overlap count
Output: Achievement[]
```

- Define all achievement rules as a declarative array of `{ id, name, icon, tier, description, check(raw, classification, eventCount) => boolean }`
- `evaluateAchievements(raw, classification)` iterates all rules, returns matched achievements
- Sort output by tier priority: legendary > epic > rare > common
- Max display count: 6 badges on card front (overflow hidden, tooltip for rest)

### File: `src/lib/pipeline.ts` (MODIFY)

- After step 6 (calculate stats), call `evaluateAchievements(rawData, classification)`
- Add `achievements` field to `GenerateResponse`

### File: `src/components/AchievementBadge.tsx` (NEW)

Single badge component:
- Circular icon with tier-colored border ring
- Tooltip on hover showing name + description
- Sizes: `sm` (24px, for card), `md` (36px, for detail), `lg` (48px, for modal)

### File: `src/components/AchievementRow.tsx` (NEW)

Horizontal badge row for card front:
- Display up to 6 badges in a row
- "+N more" indicator if overflow
- Click to expand full achievement list modal

### File: `src/components/CharacterCard.tsx` (MODIFY)

- Add `<AchievementRow>` between pixel sprite and stat bars
- Positioned centered, compact layout

### File: `src/app/api/og/[address]/route.tsx` (MODIFY)

- Render achievement icons as small circles below character name
- Use tier-colored borders

### File: `src/app/api/card/[address]/route.tsx` (MODIFY)

- Same as OG route: render badge icons on card image

### File: `src/lib/__tests__/achievements.test.ts` (NEW)

- Test each achievement condition individually
- Test tier sorting
- Test edge cases (zero tx, null timestamps)
- Test max badge count limit

---

## Visual Design

```
┌──────────────────────────────┐
│  🏹 Hunter           Lv. 42 │
│      vitalik.eth             │
│                              │
│      [Pixel Sprite]          │
│                              │
│  🏛️ 💎 🌉 ⚡ 🖼️ 🛡️         │  ← Achievement badges here
│                              │
│  HP  ████████████░░░░  340   │
│  MP  ██████░░░░░░░░░░  180   │
│  ...                         │
│                              │
│    ⚔️ Combat Power 15,230    │
└──────────────────────────────┘
```

Badge tier colors:
- Legendary: `#f4c430` (gold)
- Epic: `#a78bfa` (purple)
- Rare: `#60a5fa` (blue)
- Common: `#6b7280` (gray)

---

## Estimation

| Task | Effort |
|------|--------|
| `achievements.ts` + tests | 1-2h |
| `AchievementBadge.tsx` + `AchievementRow.tsx` | 1h |
| Pipeline integration | 30min |
| CharacterCard integration | 30min |
| OG/Card image update | 1-2h |
| **Total** | **~5h** |
