// Test all non-reasoning models for lore generation quality
// Auto-detects and skips reasoning models

const LITELLM_API_KEY = 'sk-66JUhExYk_B42gDEUqBqfA';
const LITELLM_BASE_URL = 'https://api.ai.tokamak.network';

const MODELS = [
  'minimax-m2.5',
  'qwen3-235b',
  'qwen3-80b-next',
  'qwen3-coder-flash',
  'gemini-3-flash',
  'gemini-3-pro',
  'grok-4-1-fast-non-reasoning',
  'deepseek-chat',
  // baseline
  'deepseek-v3.2',
  'gpt-5.2-codex',
];

const SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
Based on on-chain data from an Ethereum wallet, you write the wallet owner's "hero lore" in 1-2 sentences in English.

## Rules
1. Write exactly 1-2 sentences, maximum 80 characters.
2. Never mention actual amounts (ETH, USD, etc.).
3. Reflect character traits appropriate to the class.
4. Translate crypto events into fantasy world equivalents.

## Crypto Event to RPG Translation
- 2021 Bull Run -> "The Era of the Great Ascent"
- Luna/Terra Collapse -> "The Fall of the Lunar Kingdom"
- Ethereum Merge -> "The Ritual of the Great Merge"
- FTX Bankruptcy -> "The Betrayal of the Exchange Kingdom"
- NFT Boom -> "The Era of Ancient Relic Collecting"`;

const LONG_SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
Based on on-chain data from an Ethereum wallet, you write the wallet owner's "hero lore" in 3-5 sentences in English.

## Rules
1. Write exactly 3-5 sentences, maximum 400 characters.
2. Never mention actual amounts.
3. Deeply reflect character traits appropriate to the class.
4. Write dramatically and grandly, as if composing an epic saga.

## Crypto Event to RPG Translation
- 2021 Bull Run -> "The Era of the Great Ascent"
- Luna/Terra Collapse -> "The Fall of the Lunar Kingdom"
- Ethereum Merge -> "The Ritual of the Great Merge"
- FTX Bankruptcy -> "The Betrayal of the Exchange Kingdom"
- NFT Boom -> "The Era of Ancient Relic Collecting"`;

const SHORT_PROMPT = `Class: Elder Wizard
Level: 18, Power: 78000, Total Transactions: 45
Wallet Age: 7 years 8 months, First Activity: 2017-03-22
Events Experienced: The Decentralized Liberation War, The Era of the Great Ascent, The Fall of the Lunar Kingdom, The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge
Activity Pattern: Very few transactions, long-term holding

Based on the data above, write this hero's lore in English, 1-2 sentences, within 80 characters.`;

const LONG_PROMPT = `Class: Elder Wizard
Level: 18, Power: 78000, Total Transactions: 45
Wallet Age: 7 years 8 months, First Activity: 2017-03-22
Events Experienced: The Decentralized Liberation War, The Era of the Great Ascent, The Fall of the Lunar Kingdom, The Betrayal of the Exchange Kingdom, The Ritual of the Great Merge
Activity Pattern: Very few transactions, long-term holding

Based on the data above, write this hero's lore in English, 3-5 sentences, within 400 characters as a dramatic narrative.`;

async function callModel(model, systemPrompt, userPrompt, maxTokens) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  const start = Date.now();

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
    const elapsed = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `HTTP ${response.status}: ${errorText.slice(0, 150)}`, elapsed };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content?.trim() ?? '';
    const reasoning = choice?.message?.reasoning_content;
    const finishReason = choice?.finish_reason;
    const usage = data.usage;

    return { content, reasoning, finishReason, usage, elapsed };
  } catch (error) {
    clearTimeout(timeout);
    return { error: error.message, elapsed: Date.now() - start };
  }
}

// Quick probe to detect reasoning model
async function isReasoningModel(model) {
  const result = await callModel(
    model, '', 'Just reply with the word "hello".', 150
  );

  if (result.error) return { isReasoning: false, error: result.error };

  // Reasoning model: has reasoning_content and empty/short content
  const hasReasoning = result.reasoning !== undefined && result.reasoning !== null;
  const emptyContent = !result.content || result.content.length === 0;

  return {
    isReasoning: hasReasoning && emptyContent,
    hasReasoning,
    content: result.content,
    finishReason: result.finishReason,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('ETH-RPG -- Full Non-Reasoning Model Lore Generation Comparison');
  console.log(`Proxy: ${LITELLM_BASE_URL}`);
  console.log('='.repeat(80));

  // Phase 1: Detect reasoning models
  console.log('\nPhase 1: Detecting reasoning models...\n');

  const nonReasoningModels = [];
  const skippedModels = [];

  for (const model of MODELS) {
    process.stdout.write(`  ${model.padEnd(35)}`);
    const probe = await isReasoningModel(model);

    if (probe.error) {
      console.log(`Warning: ${probe.error.slice(0, 80)}`);
      skippedModels.push({ model, reason: probe.error.slice(0, 80) });
    } else if (probe.isReasoning) {
      console.log(`Reasoning model -> excluded`);
      skippedModels.push({ model, reason: 'reasoning model' });
    } else {
      console.log(`Non-reasoning model -> test target`);
      nonReasoningModels.push(model);
    }
  }

  console.log(`\n  Test targets: ${nonReasoningModels.length} / Excluded: ${skippedModels.length}`);
  if (skippedModels.length > 0) {
    console.log(`  Excluded list: ${skippedModels.map(s => s.model).join(', ')}`);
  }

  // Phase 2: Generate lore with each model
  console.log('\n' + '='.repeat(80));
  console.log('Phase 2: Lore Generation Test');
  console.log('='.repeat(80));

  const results = [];

  for (const model of nonReasoningModels) {
    console.log(`\n${'_'.repeat(70)}`);
    console.log(`Model: ${model}`);
    console.log('_'.repeat(70));

    // Short lore
    console.log('  [Short Lore (80 chars)]');
    const shortRes = await callModel(model, SYSTEM_PROMPT, SHORT_PROMPT, 200);

    let shortOk = false;
    if (shortRes.error) {
      console.log(`  Error: ${shortRes.error}`);
    } else if (!shortRes.content) {
      console.log(`  Empty response (finish: ${shortRes.finishReason})`);
    } else {
      shortOk = true;
      console.log(`  Result: "${shortRes.content}"`);
      console.log(`  ${shortRes.content.length} chars | ${shortRes.elapsed}ms`);
    }

    // Long lore
    console.log('  [Long Lore (400 chars)]');
    const longRes = await callModel(model, LONG_SYSTEM_PROMPT, LONG_PROMPT, 500);

    let longOk = false;
    if (longRes.error) {
      console.log(`  Error: ${longRes.error}`);
    } else if (!longRes.content) {
      console.log(`  Empty response (finish: ${longRes.finishReason})`);
    } else {
      longOk = true;
      console.log(`  Result: "${longRes.content}"`);
      console.log(`  ${longRes.content.length} chars | ${longRes.elapsed}ms`);
    }

    results.push({
      model,
      shortLen: shortOk ? shortRes.content.length : 0,
      shortMs: shortRes.elapsed,
      shortOk,
      longLen: longOk ? longRes.content.length : 0,
      longMs: longRes.elapsed,
      longOk,
    });
  }

  // Phase 3: Summary table
  console.log('\n\n' + '='.repeat(80));
  console.log('Phase 3: Summary Comparison Table');
  console.log('='.repeat(80));
  console.log('');
  console.log(
    'Model'.padEnd(35) +
    'Short'.padEnd(10) +
    'Len'.padEnd(7) +
    'Speed'.padEnd(10) +
    'Long'.padEnd(10) +
    'Len'.padEnd(7) +
    'Speed'
  );
  console.log('-'.repeat(90));

  for (const r of results) {
    console.log(
      r.model.padEnd(35) +
      (r.shortOk ? 'OK' : 'FAIL').padEnd(10) +
      (r.shortOk ? `${r.shortLen}ch` : '-').padEnd(7) +
      `${r.shortMs}ms`.padEnd(10) +
      (r.longOk ? 'OK' : 'FAIL').padEnd(10) +
      (r.longOk ? `${r.longLen}ch` : '-').padEnd(7) +
      `${r.longMs}ms`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test complete');
}

main().catch(console.error);
