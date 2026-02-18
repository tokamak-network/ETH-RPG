// Debug why deepseek-reasoner and glm-4.7 return empty responses
// Dumps full raw API response for inspection

const LITELLM_API_KEY = 'sk-66JUhExYk_B42gDEUqBqfA';
const LITELLM_BASE_URL = 'https://api.ai.tokamak.network';

const MODELS = ['deepseek-reasoner', 'glm-4.7'];

const SIMPLE_PROMPT = 'Please reply with exactly: "Hello, I am an RPG Lorekeeper."';

async function debugModel(model) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Model: ${model}`);
  console.log('='.repeat(70));

  // 1. Check model availability via /models endpoint
  try {
    const modelsRes = await fetch(`${LITELLM_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${LITELLM_API_KEY}` },
    });
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      const available = modelsData.data?.filter(m =>
        m.id?.toLowerCase().includes(model.toLowerCase().split('-')[0])
      );
      console.log(`\n[Related models in model list]`);
      if (available?.length > 0) {
        available.forEach(m => console.log(`  - ${m.id}`));
      } else {
        console.log(`  (No related models found)`);
        console.log(`  Total model count: ${modelsData.data?.length ?? 0}`);
      }
    }
  } catch (e) {
    console.log(`[Model list query failed] ${e.message}`);
  }

  // 2. Simple completion request -- dump raw response
  console.log(`\n[Simple request test]`);
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
          { role: 'user', content: SIMPLE_PROMPT },
        ],
        max_tokens: 100,
      }),
    });

    console.log(`  HTTP Status: ${response.status} ${response.statusText}`);

    const responseHeaders = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });
    console.log(`  Content-Type: ${responseHeaders['content-type'] ?? 'N/A'}`);

    const rawText = await response.text();
    console.log(`  Raw Response (first 2000 chars):`);
    console.log(`  ${rawText.slice(0, 2000)}`);

    // Parse and inspect structure
    try {
      const data = JSON.parse(rawText);
      console.log(`\n  [Response structure analysis]`);
      console.log(`  Top-level keys: ${Object.keys(data).join(', ')}`);

      if (data.choices?.length > 0) {
        const choice = data.choices[0];
        console.log(`  choices[0] keys: ${Object.keys(choice).join(', ')}`);
        console.log(`  choices[0].message keys: ${Object.keys(choice.message ?? {}).join(', ')}`);
        console.log(`  choices[0].message.content: "${choice.message?.content ?? '(null)'}"`);
        console.log(`  choices[0].message.content length: ${choice.message?.content?.length ?? 0}`);

        // Check for reasoning_content (DeepSeek-R1 style)
        if (choice.message?.reasoning_content !== undefined) {
          const rc = choice.message.reasoning_content;
          console.log(`  choices[0].message.reasoning_content: "${String(rc).slice(0, 300)}..."`);
          console.log(`  reasoning_content length: ${String(rc).length}`);
        }

        // Check finish_reason
        console.log(`  choices[0].finish_reason: ${choice.finish_reason ?? 'N/A'}`);
      }

      if (data.error) {
        console.log(`  error: ${JSON.stringify(data.error)}`);
      }

      if (data.usage) {
        console.log(`  usage: ${JSON.stringify(data.usage)}`);
      }
    } catch {
      console.log(`  (JSON parse failed)`);
    }
  } catch (e) {
    console.log(`  Request failed: ${e.message}`);
  }

  // 3. Try with system prompt (same as lore.ts)
  console.log(`\n[Request with system prompt]`);
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
          { role: 'system', content: 'You are an RPG Lorekeeper. Reply briefly in English.' },
          { role: 'user', content: 'Write one sentence of hero lore for a Level 35 Hunter.' },
        ],
        max_tokens: 200,
      }),
    });

    const rawText = await response.text();
    const data = JSON.parse(rawText);

    const content = data.choices?.[0]?.message?.content;
    const reasoning = data.choices?.[0]?.message?.reasoning_content;
    const finishReason = data.choices?.[0]?.finish_reason;

    console.log(`  HTTP Status: ${response.status}`);
    console.log(`  finish_reason: ${finishReason ?? 'N/A'}`);
    console.log(`  content: "${content ?? '(null)'}"`);
    console.log(`  content length: ${content?.length ?? 0}`);
    if (reasoning !== undefined) {
      console.log(`  reasoning_content (first 500): "${String(reasoning).slice(0, 500)}"`);
      console.log(`  reasoning_content length: ${String(reasoning).length}`);
    }
    if (data.usage) {
      console.log(`  usage: ${JSON.stringify(data.usage)}`);
    }
    if (data.error) {
      console.log(`  error: ${JSON.stringify(data.error)}`);
    }
  } catch (e) {
    console.log(`  Request failed: ${e.message}`);
  }
}

async function main() {
  console.log('ETH-RPG -- Model Debug Diagnostic');
  console.log(`Proxy: ${LITELLM_BASE_URL}`);

  // Also list all available models
  console.log('\n[All available models]');
  try {
    const res = await fetch(`${LITELLM_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${LITELLM_API_KEY}` },
    });
    const data = await res.json();
    const ids = data.data?.map(m => m.id).sort() ?? [];
    ids.forEach(id => console.log(`  - ${id}`));
    console.log(`  Total: ${ids.length} models`);
  } catch (e) {
    console.log(`  Query failed: ${e.message}`);
  }

  for (const model of MODELS) {
    await debugModel(model);
  }
}

main().catch(console.error);
