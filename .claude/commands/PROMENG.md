# 🧠 PROMENG (Prompt Engineer) Agent

## Role Definition
Prompt engineer responsible for AI hero lore generation in Wallet RPG.
Generates humorous, share-worthy one-line lore based on transaction data.

---

## AI Lore Generation System

### Model Selection
- **Primary**: Claude Sonnet (Anthropic API) — Excellent humor/nuance quality
- **Secondary**: GPT-4o-mini (OpenAI API) — Cost-efficient backup
- **MVP**: Fix on one of the two. Model switching deferred to v1.1

### Response Constraints
- **Length**: 1-2 sentences (max 80 characters)
- **Tone**: RPG narrative + crypto meme humor
- **Forbidden**: Real amounts, investment advice, derogatory/offensive language, personally identifiable information

---

## Main Prompt

```typescript
const LORE_SYSTEM_PROMPT = `
You are a Lorekeeper of the RPG world.
Based on on-chain data from an Ethereum wallet, write the wallet owner's 'hero lore' in 1-2 sentences.

## Tone
- Use RPG fantasy narrative style, translating crypto events into a fantasy worldview.
- Be humorous but never offensive.
- Create sentences that people want to share.

## Rules
1. Must be 1-2 sentences, max 80 characters.
2. Never mention actual amounts (ETH, USD, etc.).
3. Do not use directly derogatory expressions.
4. Do not include investment advice or price predictions.
5. Reflect character traits matching the class.
6. Translate crypto events from the wallet's activity period into fantasy.

## Crypto Event → RPG Translation Dictionary
- 2021 Bull Run → "The Age of the Great Ascent"
- Luna/Terra Collapse → "Fall of the Moon Kingdom"
- Ethereum Merge → "The Ritual of the Great Merge"
- FTX Bankruptcy → "Betrayal of the Exchange Kingdom"
- NFT Boom → "The Era of Ancient Relic Collecting"
- Gas Fee Spikes → "The Great Mana Famine"
- DeFi Summer → "The Decentralized Liberation War"
- BTC ETF → "Emergence of the Institutional Knights"
- BTC ATH → "Reaching the Legendary Peak"

## Class-Specific Character Traits
- Hunter: Obsessed with relic (NFT) hunting, collector
- Rogue: Fast trades, opportunistic, cunning
- Summoner: Wanderer crossing dimensions (chains)
- Merchant: Stable, calculating, wealth accumulator
- Priest: Devoted spender of gas, selfless
- Elder Wizard: Ancient wisdom, reclusive, observant
- Guardian: Silent protector, holder
- Warrior: Ordinary but steadfast fighter
`;

const LORE_USER_PROMPT = (data: LoreInputData) => `
Write hero lore based on the following data.

## Character Info
- Class: ${data.className} (${data.classNameEn})
- Level: ${data.level}
- Power: ${data.power}

## On-chain Data
- Total Transactions: ${data.txCount}
- Wallet Age: ${data.walletAgeDescription}
- First Activity: ${data.firstTxDate}
- Recent Activity: ${data.lastTxDate}
- Major Events During Activity: ${data.relevantEvents.join(', ')}
- Primary Activity Pattern: ${data.activityPattern}

Hero Lore (1-2 sentences, max 80 characters):
`;
```

---

## LoreInputData Structure

```typescript
interface LoreInputData {
  className: string;
  classNameEn: string;
  level: number;
  power: number;
  txCount: number;
  walletAgeDescription: string;  // "3 years 2 months" etc.
  firstTxDate: string;           // "2021-04-15"
  lastTxDate: string;            // "2025-02-10"
  relevantEvents: string[];      // Crypto events within activity period
  activityPattern: string;       // "NFT minting focus" / "Active DEX" etc.
}

// Filter events matching the activity period
function getRelevantEvents(firstTx: number, lastTx: number): string[] {
  return CRYPTO_EVENTS
    .filter(e => {
      const eventTime = new Date(e.date).getTime();
      return eventTime >= firstTx && eventTime <= lastTx;
    })
    .map(e => e.rpgEvent);
}

// Summarize activity pattern (natural language from class determination basis)
function describeActivityPattern(classification: TxClassification): string {
  const patterns: string[] = [];
  if (classification.nftRatio > 0.2) patterns.push('Active NFT collecting/minting');
  if (classification.dexRatio > 0.15) patterns.push('Frequent DEX swaps');
  if (classification.bridgeCount > 3) patterns.push('Cross-chain transfer experience');
  if (classification.stableRatio > 0.25) patterns.push('Stablecoin-focused activity');
  return patterns.join(', ') || 'General transaction activity';
}
```

---

## AI Call Function

```typescript
async function generateLore(input: LoreInputData): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: LORE_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: LORE_USER_PROMPT(input) }
        ],
      }),
    });

    const data = await response.json();
    const lore = data.content[0].text.trim();

    // Length validation (truncate if over 80 chars, no regeneration)
    return lore.length > 80 ? lore.substring(0, 77) + '...' : lore;
  } catch (error) {
    // Fallback: template-based lore
    return generateFallbackLore(input);
  }
}
```

---

## Fallback Lore (On API Failure)

```typescript
const FALLBACK_TEMPLATES: Record<string, string[]> = {
  hunter: [
    'This hunter roamed the battlefield collecting {eventCount} relics.',
    'Drawn by the call of ancient relics, an endless hunt continues.',
  ],
  rogue: [
    'A cunning assassin who sealed {txCount} deals from the shadows.',
    'Exploiting market gaps is this rogue\'s way of survival.',
  ],
  summoner: [
    'A wanderer who opened dimensional gates {bridgeCount} times across worlds.',
    'A summoner born with a destiny that cannot stay in one world.',
  ],
  merchant: [
    'A merchant who quietly accumulated wealth, stacking stable currency.',
    'This merchant\'s composure in protecting the vault through war is legendary.',
  ],
  priest: [
    'A priest who devoted mana (gas) without restraint to the network.',
    'One who illuminated the chain by officiating countless rituals (transactions).',
  ],
  elder_wizard: [
    'An ancient wizard who accumulated wisdom watching for {walletAge}.',
    'Awakened long ago, but now in seclusion, awaiting the right moment.',
  ],
  guardian: [
    'A guardian who silently protected assets without many words.',
    'This guardian\'s will, unshaken even in storms, is like steel.',
  ],
  warrior: [
    'A warrior who steadily marches to battle despite no special powers.',
    'A warrior who walked the blockchain battlefield with a single ordinary sword.',
  ],
};

function generateFallbackLore(input: LoreInputData): string {
  const templates = FALLBACK_TEMPLATES[input.classNameEn.toLowerCase()] || FALLBACK_TEMPLATES.warrior;
  const template = templates[Math.floor(Math.random() * templates.length)];

  return template
    .replace('{txCount}', String(input.txCount))
    .replace('{walletAge}', input.walletAgeDescription)
    .replace('{eventCount}', String(input.txCount))
    .replace('{bridgeCount}', String(5)); // Default value
}
```

---

## Lore Quality Guidelines

### Good Lore Examples
- "This wizard awakened during the 2021 Age of Great Ascent, but took an arrow to the knee when the Moon Kingdom fell."
- "A summoner who braved 34 dimensional crossings. Beyond every gate he opens lies a new world."
- "A priest who spared no mana even during the Great Mana Famine. The network remembers his devotion."

### Bad Lore Examples (Forbidden)
- "A poor warrior with only 0.5 ETH." (mentions amount)
- "This wallet is a total fool." (direct insult)
- "Bitcoin will hit $100K soon." (investment advice)
- "vitalik.eth's wallet is..." (personal identification)

---

## Prompt Version Management
- Version tag required on prompt changes (v1.0, v1.1, ...)
- Two versions can run simultaneously for A/B testing (random assignment)
- On lore quality issues, switch to fallback templates first
