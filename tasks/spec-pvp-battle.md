# Feature Spec: PvP Battle System

## Overview
Two wallet addresses enter a turn-based battle simulation. Stats, class, skills, and **class matchups** determine the outcome through a PRNG engine with a per-battle random nonce. Every fight is unique — the same pair can produce different results each time. Results are animated on the frontend and shareable as OG images via nonce-based URLs.

---

## Battle Flow

```
/battle page
  → User enters 2 wallet addresses (or ENS)
  → POST /api/battle { address1, address2 }
    → Generate both characters via existing pipeline
    → Generate random battle nonce
    → Run battle simulation engine (seeded with nonce)
    → Return battle result + turn log + nonce
  → Redirect to /battle/[addr1]/[addr2]?n={nonce}
  → Animate turn-by-turn battle log
  → Show winner + share buttons + [Rematch] button
```

---

## Battle Mechanics

### Randomness (Non-Deterministic Per Battle)
```typescript
// Nonce = crypto.randomUUID() (generated server-side per battle request)
// Seed = keccak256(lowercase(addr1) + lowercase(addr2) + nonce)
// Use simple mulberry32 PRNG from seed
// Same nonce reproduces same result → shareable via URL query param
// New battle = new nonce = different outcome
```

### Class Matchup System

Each class has **advantageous** and **disadvantageous** matchups. Matchup modifiers apply as global damage multipliers for the entire battle.

```
Advantaged:     deal 115% damage, receive 80% damage
Disadvantaged:  deal 80% damage, receive 115% damage
Neutral:        no modifier
```

#### Matchup Table (→ = advantaged against)

| Class | Strong vs | Weak vs | Logic |
|-------|-----------|---------|-------|
| Warrior | Rogue | Elder Wizard | Brute force overwhelms agility / Magic nullifies physical |
| Rogue | Merchant | Warrior | Arbitrage exploits capital / Can't outrun raw strength |
| Hunter | Summoner | Guardian | Snipes summons before they form / Iron wall blocks arrows |
| Merchant | Priest | Rogue | Capital overpowers faith / Vulnerable to arbitrage |
| Priest | Elder Wizard | Merchant | Holy purifies arcane / Faith crumbles before capital |
| Elder Wizard | Warrior | Priest | Ancient magic disables physical / Holy disrupts mana |
| Guardian | Hunter | Summoner | Iron defense deflects projectiles / Numbers breach the wall |
| Summoner | Guardian | Hunter | Summon swarm overwhelms defense / Picked off one by one |

**Implementation**: Two separate matchup rings:
- Ring A: Warrior → Rogue → Merchant → Priest → Elder Wizard → Warrior
- Ring B: Hunter → Summoner → Guardian → Hunter

Cross-ring matchups are always **neutral**.

### Turn Order
- First-move score = LUCK + DEX * 0.3 (higher goes first)
- On tie: lower address (lexicographic) goes first

### Turn Structure
Each turn, the active character performs ONE action:
1. **Skill** (if MP >= cost AND cooldown ready) — class-specific ability
2. **Basic Attack** (fallback) — STR-based physical damage

### Damage Formulas

```
Basic Attack Damage = floor(STR * 0.3 + seed_random(0, LUCK * 0.1) + seed_random(0, DEX * 0.05))
Magic Damage       = floor(INT * 0.35 + seed_random(0, INT * 0.05))
Effective Damage    = max(1, raw_damage * matchup_modifier - target_defense)
Defense (implicit)  = floor(HP * 0.02)
```

### Critical Hits
```
Base Crit Chance    = 8%
LUCK Crit Bonus     = LUCK * 0.03% (e.g., LUCK 300 = +9% → total 17%)
Crit Multiplier     = 1.8x
```
Critical hit check is rolled per attack via PRNG. Class passives (Hunter's Keen Eye, Rogue's Arbitrage) stack additively with base crit chance.

### Dodge (Evasion)
```
Base Dodge Chance   = DEX * 0.03% (e.g., DEX 400 = 12% dodge)
```
Dodge is rolled per incoming attack. On dodge: damage = 0, "DODGE!" displayed. Class passives (Rogue's Evasion) stack additively.

### Matchup Impact Analysis
```
Power gap <10%:  matchup + luck can flip the result → high variance
Power gap 10-20%: advantaged matchup can still win → moderate variance
Power gap 20-40%: crit/dodge streaks needed for upset → low but possible
Power gap >40%:  near-certain win for stronger side → realistic floor
```

### Win Condition
- Opponent's currentHP reaches 0
- Max 20 turns — if both alive, higher remaining HP% wins
- If HP% tied, higher Power wins (tiebreaker)

---

## Class Skills

Each class has 1 primary skill and 1 passive ability.

| Class | Skill Name | MP Cost | Cooldown | Effect |
|-------|-----------|---------|----------|--------|
| Warrior | Heavy Strike | 15 | 2 turns | `STR * 0.5` damage, 15% stun chance |
| Rogue | Arbitrage | 18 | 3 turns | Two hits: `STR * 0.25` each, second hit has 35% crit (2x). Defense applied once (sum both hits, then subtract defense) |
| Hunter | NFT Snipe | 18 | 2 turns | `LUCK * 0.4 + STR * 0.1` hybrid damage. LUCK > target: 80% crit. LUCK <= target: 25% crit |
| Merchant | Hostile Takeover | 20 | 3 turns | `STR * 0.25` damage + reduce opponent's next attack by 25% + boost own next attack by 15% |
| Priest | Divine Shield | 18 | 3 turns | Heal self for `INT * 0.3` HP (capped at max HP) + reduce next incoming damage by 20% |
| Elder Wizard | Ancient Spell | 35 | 3 turns | `INT * 0.45` magic damage (50% of target defense applies, not full) |
| Guardian | Counter Stance | 15 | 2 turns | This turn: reflect 50% of received damage back |
| Summoner | Portal Strike | 22 | 3 turns | `(STR + INT) * 0.2` damage + drain 10 MP from opponent |

### Passive Abilities

| Class | Passive | Effect |
|-------|---------|--------|
| Warrior | Iron Will | +10% max HP |
| Rogue | Evasion | 10% chance to dodge any attack |
| Hunter | Keen Eye | +15% crit chance on all attacks |
| Merchant | Compound Interest | Recover 15% max MP every 4 turns |
| Priest | Blessing | Heal 1.5% max HP at end of each turn + 5% max HP instant heal at battle start |
| Elder Wizard | Mana Well | Skills cost 15% less MP |
| Guardian | Unbreakable | +20% defense + damage exceeding 20% of max HP is reduced by 50% (anti-burst) |
| Summoner | Summon Familiar | Deal 5% INT as bonus damage each turn |

---

## Type Definitions

```typescript
// src/lib/types.ts — additions

interface BattleAction {
  readonly turn: number;
  readonly actorIndex: 0 | 1;           // which fighter acts
  readonly actionType: 'skill' | 'basic_attack';
  readonly skillName?: string;
  readonly damage: number;
  readonly healed?: number;
  readonly isCrit: boolean;
  readonly isStun: boolean;
  readonly isDodge: boolean;
  readonly reflected?: number;
  readonly mpDrained?: number;
  readonly actorHpAfter: number;
  readonly targetHpAfter: number;
  readonly narrative: string;           // RPG-flavored turn description
}

interface BattleFighter {
  readonly address: string;
  readonly ensName?: string;
  readonly class: ClassResult;
  readonly stats: CharacterStats;
  readonly achievements: readonly Achievement[];  // displayed on result + OG (visual only, no combat effect)
}

type MatchupAdvantage = 'advantaged' | 'disadvantaged' | 'neutral';

interface BattleMatchup {
  readonly fighter0Advantage: MatchupAdvantage;
  readonly fighter1Advantage: MatchupAdvantage;
}

interface BattleResult {
  readonly fighters: readonly [BattleFighter, BattleFighter];
  readonly winner: 0 | 1;
  readonly turns: readonly BattleAction[];
  readonly totalTurns: number;
  readonly winnerHpRemaining: number;
  readonly winnerHpPercent: number;
  readonly matchup: BattleMatchup;
  readonly nonce: string;              // random nonce for this battle
  readonly battleSeed: string;         // keccak256(addr1 + addr2 + nonce)
}

// API response
interface BattleResponse {
  readonly result: BattleResult;
  readonly battleImageUrl: string;
  readonly ogImageUrl: string;
  readonly cached: boolean;            // true only when same nonce is replayed
}
```

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/lib/battle.ts` | Battle simulation engine (pure functions) |
| `src/lib/skills.ts` | Skill/passive definitions per class |
| `src/lib/matchups.ts` | Class matchup table + advantage resolver |
| `src/lib/battle-narrative.ts` | Turn → RPG text narrative generator |
| `src/lib/__tests__/battle.test.ts` | Battle engine tests |
| `src/lib/__tests__/skills.test.ts` | Skill mechanics tests |
| `src/lib/__tests__/matchups.test.ts` | Matchup resolution tests |
| `src/app/battle/page.tsx` | Battle input page (2 address fields) |
| `src/app/battle/[addr1]/[addr2]/page.tsx` | Battle result page |
| `src/app/battle/[addr1]/[addr2]/layout.tsx` | Battle OG metadata |
| `src/app/api/battle/route.ts` | POST: execute battle |
| `src/app/api/og/battle/[addr1]/[addr2]/route.tsx` | Battle OG image |
| `src/components/BattleInput.tsx` | Dual address input form |
| `src/components/BattleArena.tsx` | Turn-by-turn animated battle display |
| `src/components/BattleLog.tsx` | Scrollable text battle log |
| `src/components/BattleResult.tsx` | Winner/loser display + share |
| `src/hooks/useBattle.ts` | Battle API call + loading state |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add battle-related interfaces |
| `src/lib/pipeline.ts` | Export helper for battle to reuse character generation |
| `src/app/page.tsx` | Add "Battle Mode" link/button on landing page |
| `src/styles/themes.ts` | Add battle-specific design tokens |

---

## API Specification

### POST /api/battle

```typescript
// Request
{
  address1: string,   // "0x..." or "vitalik.eth"
  address2: string,
  nonce?: string      // optional — replay a specific battle (for shared links)
}

// Response (200)
{
  result: {
    fighters: [BattleFighter, BattleFighter],
    winner: 0 | 1,
    turns: BattleAction[],
    totalTurns: number,
    winnerHpRemaining: number,
    winnerHpPercent: number,
    matchup: {
      fighter0Advantage: 'advantaged' | 'disadvantaged' | 'neutral',
      fighter1Advantage: 'advantaged' | 'disadvantaged' | 'neutral'
    },
    nonce: string,
    battleSeed: string
  },
  battleImageUrl: string,
  ogImageUrl: string,
  cached: boolean
}

// Error (400)
{ error: { code: "INVALID_ADDRESS", message: "..." } }
// Error (400)
{ error: { code: "SAME_ADDRESS", message: "Cannot battle yourself" } }
```

---

## Battle Page UX

### Input Page (`/battle`)

```
┌──────────────────────────────────────┐
│         ⚔️ Wallet Battle ⚔️         │
│                                      │
│  "Whose wallet reigns supreme?"      │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Challenger: 0x... or ENS     │    │
│  └──────────────────────────────┘    │
│              ⚡ VS ⚡                 │
│  ┌──────────────────────────────┐    │
│  │ Opponent:  0x... or ENS      │    │
│  └──────────────────────────────┘    │
│                                      │
│      [ ⚔️ Start Battle ]             │
│                                      │
│  Famous duels:                       │
│  • Vitalik vs Satoshi (?)            │
│  • Your wallet vs Uniswap deployer   │
└──────────────────────────────────────┘
```

### Result Page (`/battle/[addr1]/[addr2]?n={nonce}`)

```
┌──────────────────────────────────────┐
│  🏹 Hunter Lv.42  ⚔️  🗡️ Rogue Lv.38│
│   vitalik.eth       vs    0xabc...   │
│                                      │
│  ⚔️ Matchup: Hunter → Neutral       │
│                                      │
│  🏛️💎🌉⚡🖼️🛡️              👣🧭💨  │  ← achievement badges
│                                      │
│  [Sprite 1]    ⚡    [Sprite 2]      │
│                                      │
│  HP ████████░░  vs  HP ██░░░░░░░░    │
│     234/340           67/280         │
│                                      │
│  ── Battle Log ──────────────────    │
│  Turn 1: Hunter draws the bowstring  │
│          → NFT Snipe! CRIT! 141 dmg! │
│  Turn 2: Rogue vanishes into shadow  │
│          → Arbitrage! 42+51 damage!  │
│  Turn 3: Hunter steady aim...        │
│          → Basic Attack. DODGE!      │
│  ...                                 │
│                                      │
│  🏆 WINNER: Hunter (vitalik.eth)     │
│     HP remaining: 234 (69%)          │
│                                      │
│  [Share Result] [⚔️ Rematch] [New]   │
│                                      │
│  Rematch = new nonce, same pair      │
│  Share = link with ?n= preserves     │
│          this exact battle result    │
└──────────────────────────────────────┘
```

---

## Battle OG Image (`/api/og/battle/[addr1]/[addr2]?n={nonce}`)

1200x630 PNG — requires `?n=` query param to reproduce the specific battle:
```
┌─────────────────────────────────────┐
│                                     │
│  🏹 Hunter        ⚔️     🗡️ Rogue  │
│  Lv.42                    Lv.38     │
│  vitalik.eth      VS    0xabc...    │
│                                     │
│  Power: 15,230      Power: 12,880   │
│  🏛️💎🌉⚡🖼️🛡️       👣🧭💨        │
│  ⚔️ Matchup: Neutral               │
│                                     │
│        🏆 WINNER: Hunter            │
│        12 turns — 69% HP left       │
│                                     │
│           eth-rpg.vercel.app        │
└─────────────────────────────────────┘
```

---

## Share Text Templates

### Twitter
```
⚔️ Wallet Battle Result!

🏹 Hunter (vitalik.eth) vs 🗡️ Rogue (0xabc...)
🏆 Winner: Hunter — 69% HP remaining!

Think you can beat me? Rematch 👉 {battle_url}
```

### Farcaster
```
My wallet just defeated @opponent in Eth·RPG! ⚔️
Power 15,230 vs 12,880 — but it came down to a clutch crit.
Challenge me: {battle_url_no_nonce}
```

Note: Share links include `?n={nonce}` to show the exact battle. "Challenge me" links omit nonce so the challenger gets a fresh fight.

---

## Battle Animation (Frontend)

Turn-by-turn animation sequence:
1. Both sprites appear with idle animation
2. Per turn (0.8s delay between turns):
   - Active sprite does attack animation (CSS translateX + scale)
   - Damage number floats up from target (CSS keyframe)
   - Target HP bar animates down
   - Skill name text flashes above actor
3. On final turn: winner sprite celebrates, loser fades
4. Victory banner drops in with confetti effect (CSS only, no library)

All animation via CSS transitions + keyframes — no animation library needed.

---

## Estimation

| Task | Priority | Effort |
|------|----------|--------|
| `battle.ts` + `skills.ts` + `matchups.ts` + tests | P0 | 4-5h |
| `battle-narrative.ts` | P0 | 1h |
| Battle API route (with nonce) | P0 | 1h |
| Battle input page | P0 | 1h |
| Battle result page + components (basic) | P0 | 2h |
| **P0 Subtotal** | | **~10h** |
| Battle animation (CSS) | P1 | 2-3h |
| OG image route | P1 | 1-2h |
| Share integration (with nonce URLs) | P1 | 1h |
| Landing page CTA | P2 | 0.5h |
| **Total** | | **~16h** |

---

## Dependencies

- **Requires**: Existing character generation pipeline (no changes to core logic)
- **Achievement badges**: Displayed on battle result page + OG image (visual only, no combat effect). Rationale: achievement data correlates with high stats, so combat buffs would amplify existing power gaps instead of adding variance.
- **No new packages needed**: PRNG is trivial to implement, all animation is CSS
- **Nonce generation**: Uses `crypto.randomUUID()` (Node.js built-in, no package needed)
