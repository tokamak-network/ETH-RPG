// Test lore generation across multiple LLM models via LiteLLM proxy
// Usage: node scripts/test-models.mjs

const LITELLM_API_KEY = 'sk-66JUhExYk_B42gDEUqBqfA';
const LITELLM_BASE_URL = 'https://api.ai.tokamak.network';

const MODELS = [
  'deepseek-reasoner',
  'gpt-5.2-codex',
  'glm-4.7',
  'deepseek-v3.2',
];

const SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
Based on on-chain data from an Ethereum wallet, you write the wallet owner's "hero lore" in 1-2 sentences in English.

## Tone
- Use RPG fantasy narrative style, translating crypto events into fantasy world equivalents.
- Be humorous but never insulting.
- Create fun, shareable sentences.

## Rules
1. Write exactly 1-2 sentences, maximum 80 characters.
2. Never mention actual amounts (ETH, USD, etc.).
3. Do not use direct insults like "idiot", "fool", "moron", etc.
4. Do not include investment advice or price predictions.
5. Reflect character traits appropriate to the class.
6. Translate crypto events from the wallet's active period into fantasy equivalents.

## Crypto Event to RPG Translation Dictionary
- 2021 Bull Run -> "The Era of the Great Ascent"
- Luna/Terra Collapse -> "The Fall of the Lunar Kingdom"
- Ethereum Merge -> "The Ritual of the Great Merge"
- FTX Bankruptcy -> "The Betrayal of the Exchange Kingdom"
- NFT Boom -> "The Era of Ancient Relic Collecting"
- Gas Fee Spike -> "The Great Mana Famine"
- DeFi Summer -> "The Decentralized Liberation War"
- BTC ETF -> "The Arrival of the Institutional Knights"
- BTC ATH -> "Reaching the Legendary Summit"

## Class Character Traits
- Hunter: Obsessed with relic (NFT) hunting, collector mentality
- Rogue: Fast trades, opportunistic, cunning
- Summoner: Wanderer crossing dimensions (chains)
- Merchant: Stable, calculating, wealth accumulation
- Priest: Devoted spender of mana (gas), selfless
- Elder Wizard: Ancient wisdom, reclusive, observant
- Guardian: Silent protector, steadfast holder
- Warrior: Ordinary but persistent fighter`;

const LONG_SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
Based on on-chain data from an Ethereum wallet, you write the wallet owner's "hero lore" in 3-5 sentences in English.

## Tone
- Use RPG fantasy narrative style, translating crypto events into fantasy world equivalents.
- Write dramatically and grandly, as if composing an epic saga.
- Create immersive, shareable narratives.

## Rules
1. Write exactly 3-5 sentences, maximum 400 characters.
2. Never mention actual amounts (ETH, USD, etc.).
3. Do not use direct insults like "idiot", "fool", "moron", etc.
4. Do not include investment advice or price predictions.
5. Deeply reflect character traits appropriate to the class.
6. Translate crypto events from the wallet's active period into fantasy equivalents.
7. Tell a deeper story, different from the short lore (1-2 sentences).

## Crypto Event to RPG Translation Dictionary
- 2021 Bull Run -> "The Era of the Great Ascent"
- Luna/Terra Collapse -> "The Fall of the Lunar Kingdom"
- Ethereum Merge -> "The Ritual of the Great Merge"
- FTX Bankruptcy -> "The Betrayal of the Exchange Kingdom"
- NFT Boom -> "The Era of Ancient Relic Collecting"
- Gas Fee Spike -> "The Great Mana Famine"
- DeFi Summer -> "The Decentralized Liberation War"
- BTC ETF -> "The Arrival of the Institutional Knights"
- BTC ATH -> "Reaching the Legendary Summit"

## Class Character Traits
- Hunter: Obsessed with relic (NFT) hunting, collector mentality
- Rogue: Fast trades, opportunistic, cunning
- Summoner: Wanderer crossing dimensions (chains)
- Merchant: Stable, calculating, wealth accumulation
- Priest: Devoted spender of mana (gas), selfless
- Elder Wizard: Ancient wisdom, reclusive, observant
- Guardian: Silent protector, steadfast holder
- Warrior: Ordinary but persistent fighter`;

// Test scenarios (different classes/profiles)
const TEST_CASES = [
  {
    name: 'Hunter (NFT Collector)',
    shortPrompt: `Class: Hunter
Level: 35
Power: 52000
Total Transactions: 1200
Wallet Age: 3 years 2 months
First Activity: 2021-06-15
Recent Activity: 2024-12-01
Events Experienced: The Era of Ancient Relic Collecting, The Great Mana Famine, The Ritual of the Great Merge
Activity Pattern: NFT marketplace focused, periodic minting

Based on the data above, write this hero's lore in English, 1-2 sentences, within 80 characters.`,
    longPrompt: `Class: Hunter
Level: 35
Power: 52000
Total Transactions: 1200
Wallet Age: 3 years 2 months
First Activity: 2021-06-15
Recent Activity: 2024-12-01
Events Experienced: The Era of Ancient Relic Collecting, The Great Mana Famine, The Ritual of the Great Merge
Activity Pattern: NFT marketplace focused, periodic minting

Based on the data above, write this hero's lore in English, 3-5 sentences, within 400 characters as a dramatic narrative.`,
  },
  {
    name: 'Elder Wizard (Ancient Holder)',
    shortPrompt: `Class: Elder Wizard
Level: 18
Power: 78000
Total Transactions: 45
Wallet Age: 7 years 8 months
First Activity: 2017-03-22
Recent Activity: 2024-11-15
Events Experienced: The Decentralized Liberation War, The Era of the Great Ascent, The Fall of the Lunar Kingdom, The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge
Activity Pattern: Very few transactions, long-term holding

Based on the data above, write this hero's lore in English, 1-2 sentences, within 80 characters.`,
    longPrompt: `Class: Elder Wizard
Level: 18
Power: 78000
Total Transactions: 45
Wallet Age: 7 years 8 months
First Activity: 2017-03-22
Recent Activity: 2024-11-15
Events Experienced: The Decentralized Liberation War, The Era of the Great Ascent, The Fall of the Lunar Kingdom, The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge
Activity Pattern: Very few transactions, long-term holding

Based on the data above, write this hero's lore in English, 3-5 sentences, within 400 characters as a dramatic narrative.`,
  },
  {
    name: 'Rogue (DEX Trader)',
    shortPrompt: `Class: Rogue
Level: 42
Power: 45000
Total Transactions: 3500
Wallet Age: 2 years 5 months
First Activity: 2022-08-10
Recent Activity: 2025-01-20
Events Experienced: The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge, The Arrival of the Institutional Knights
Activity Pattern: DEX swap focused, high-frequency trading

Based on the data above, write this hero's lore in English, 1-2 sentences, within 80 characters.`,
    longPrompt: `Class: Rogue
Level: 42
Power: 45000
Total Transactions: 3500
Wallet Age: 2 years 5 months
First Activity: 2022-08-10
Recent Activity: 2025-01-20
Events Experienced: The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge, The Arrival of the Institutional Knights
Activity Pattern: DEX swap focused, high-frequency trading

Based on the data above, write this hero's lore in English, 3-5 sentences, within 400 characters as a dramatic narrative.`,
  },
];

async function callModel(model, systemPrompt, userPrompt, maxTokens) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `HTTP ${response.status}: ${errorText.slice(0, 200)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return { content: content || '(empty response)' };
  } catch (error) {
    clearTimeout(timeout);
    return { error: error.message };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('ETH-RPG Lore Generation -- Multi-Model Comparison');
  console.log(`Proxy: ${LITELLM_BASE_URL}`);
  console.log(`Models: ${MODELS.join(', ')}`);
  console.log('='.repeat(80));

  for (const testCase of TEST_CASES) {
    console.log('\n' + '-'.repeat(80));
    console.log(`\nTest Case: ${testCase.name}`);
    console.log('-'.repeat(80));

    for (const model of MODELS) {
      console.log(`\nModel: ${model}`);
      console.log('-'.repeat(60));

      // Short lore (1-2 sentences, 80 chars)
      console.log('  [Short Lore (80 chars)]');
      const shortResult = await callModel(model, SYSTEM_PROMPT, testCase.shortPrompt, 200);
      if (shortResult.error) {
        console.log(`  Error: ${shortResult.error}`);
      } else {
        console.log(`  Result: "${shortResult.content}"`);
        console.log(`  Length: ${shortResult.content.length} chars`);
      }

      // Long lore (3-5 sentences, 400 chars)
      console.log('  [Long Lore (400 chars)]');
      const longResult = await callModel(model, LONG_SYSTEM_PROMPT, testCase.longPrompt, 500);
      if (longResult.error) {
        console.log(`  Error: ${longResult.error}`);
      } else {
        console.log(`  Result: "${longResult.content}"`);
        console.log(`  Length: ${longResult.content.length} chars`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test complete');
  console.log('='.repeat(80));
}

main().catch(console.error);
