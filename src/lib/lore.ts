// AI lore generation and fallback template engine for Eth-RPG character narratives
import * as Sentry from '@sentry/nextjs';
import type { LoreInputData, CharacterClassId } from '@/lib/types';
import { FALLBACK_TEMPLATES, LONG_FALLBACK_TEMPLATES } from '@/lib/lore-templates';

// --- Constants ---
const MAX_LORE_LENGTH = 80;
const MAX_LONG_LORE_LENGTH = 400;
const MAX_TOKENS = 200;
const MAX_LONG_TOKENS = 500;

// LiteLLM / OpenAI-compatible defaults (overridden by env vars)
const DEFAULT_BASE_URL = 'http://localhost:4000';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_VERSION = '2023-06-01';

const FORBIDDEN_WORDS: readonly string[] = [
  'ETH', 'USD', 'BTC', 'USDT', 'USDC',
  'idiot', 'fool', 'stupid', 'moron', 'dumb',
  'invest', 'buy order', 'sell order', 'price',
];

// --- Lore Generation Config ---

interface LoreCascadeConfig {
  readonly systemPrompt: string;
  readonly maxTokens: number;
  readonly maxLength: number;
  readonly sentryPrefix: string;
  readonly fallbackTemplates: Readonly<Record<string, readonly string[]>>;
  readonly promptInstruction: string;
}

// --- System Prompts ---

export const LORE_SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
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

const LONG_LORE_SYSTEM_PROMPT = `You are a Lorekeeper of the RPG world.
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

// --- Short / Long Config ---

const SHORT_LORE_CONFIG: LoreCascadeConfig = {
  systemPrompt: LORE_SYSTEM_PROMPT,
  maxTokens: MAX_TOKENS,
  maxLength: MAX_LORE_LENGTH,
  sentryPrefix: 'short',
  fallbackTemplates: FALLBACK_TEMPLATES,
  promptInstruction: 'Based on the data above, write this hero\'s lore in English, 1-2 sentences, within 80 characters.',
};

const LONG_LORE_CONFIG: LoreCascadeConfig = {
  systemPrompt: LONG_LORE_SYSTEM_PROMPT,
  maxTokens: MAX_LONG_TOKENS,
  maxLength: MAX_LONG_LORE_LENGTH,
  sentryPrefix: 'long',
  fallbackTemplates: LONG_FALLBACK_TEMPLATES,
  promptInstruction: 'Based on the data above, write this hero\'s lore in English, 3-5 sentences, within 400 characters as a dramatic narrative.',
};

// --- Deterministic Hash ---

function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// --- Internal Shared Helpers ---

function buildUserPrompt(data: LoreInputData, instruction: string): string {
  const eventsSection =
    data.relevantEvents.length > 0
      ? `Events Experienced: ${data.relevantEvents.join(', ')}`
      : 'No notable events experienced';

  return [
    `Class: ${data.className} (${data.classNameEn})`,
    `Level: ${data.level}`,
    `Power: ${data.power}`,
    `Total Transactions: ${data.txCount}`,
    `Wallet Age: ${data.walletAgeDescription}`,
    `First Activity: ${data.firstTxDate}`,
    `Recent Activity: ${data.lastTxDate}`,
    eventsSection,
    `Activity Pattern: ${data.activityPattern}`,
    '',
    instruction,
  ].join('\n');
}

function sanitizeLore(lore: string, maxLength: number): string {
  let cleaned = lore.trim();

  for (const word of FORBIDDEN_WORDS) {
    if (cleaned.includes(word)) {
      cleaned = cleaned.split(word).join('***');
    }
  }

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength - 3) + '...';
  }

  return cleaned;
}

function generateTemplateFallback(
  input: LoreInputData,
  templates: Readonly<Record<string, readonly string[]>>,
  validate: (lore: string) => string,
): string {
  const classId = input.classNameEn.toLowerCase().replace(/\s+/g, '_') as CharacterClassId;
  const classTemplates = templates[classId] ?? templates.warrior;

  const hashInput = `${input.classNameEn}-${input.level}-${input.power}-${input.txCount}`;
  const hash = deterministicHash(hashInput);
  const index = hash % classTemplates.length;

  return validate(classTemplates[index]);
}

// --- AI API Callers ---

interface OpenAIChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

interface OpenAIChatResponse {
  readonly choices: readonly {
    readonly message: {
      readonly content: string;
    };
  }[];
}

interface AnthropicMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

interface AnthropicResponse {
  readonly content: readonly { readonly type: string; readonly text: string }[];
}

async function callLiteLLM(
  apiKey: string,
  baseUrl: string,
  model: string,
  userPrompt: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<string | null> {
  const messages: readonly OpenAIChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as OpenAIChatResponse;

  const content = data.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    return null;
  }

  return content.trim();
}

async function callAnthropicDirect(
  apiKey: string,
  userPrompt: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<string | null> {
  const messages: readonly AnthropicMessage[] = [
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_API_VERSION,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AnthropicResponse;

  const textBlock = data.content.find((block) => block.type === 'text');
  if (!textBlock?.text || textBlock.text.trim().length === 0) {
    return null;
  }

  return textBlock.text.trim();
}

// --- Generic 4-Step Cascade ---

/**
 * Generates lore through a 4-step fallback cascade:
 * 1. LiteLLM primary model
 * 2. LiteLLM fallback model
 * 3. Anthropic direct (legacy)
 * 4. Template-based fallback
 */
async function generateLoreWithCascade(
  input: LoreInputData,
  config: LoreCascadeConfig,
): Promise<string> {
  const litellmKey = process.env.LITELLM_API_KEY;
  const litellmBaseUrl = process.env.LITELLM_BASE_URL ?? DEFAULT_BASE_URL;
  const litellmModel = process.env.LITELLM_MODEL ?? DEFAULT_MODEL;
  const litellmFallbackModel = process.env.LITELLM_FALLBACK_MODEL;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const validate = (text: string) => sanitizeLore(text, config.maxLength);
  const userPrompt = buildUserPrompt(input, config.promptInstruction);

  // 1. Try LiteLLM primary model
  if (litellmKey) {
    try {
      const result = await callLiteLLM(litellmKey, litellmBaseUrl, litellmModel, userPrompt, config.systemPrompt, config.maxTokens);
      if (result) {
        return validate(result);
      }
    } catch (error) {
      Sentry.captureException(error, { level: 'warning', tags: { source: `lore-litellm-${config.sentryPrefix}`, model: litellmModel } });
    }

    // 2. Try LiteLLM fallback model
    if (litellmFallbackModel) {
      try {
        const result = await callLiteLLM(litellmKey, litellmBaseUrl, litellmFallbackModel, userPrompt, config.systemPrompt, config.maxTokens);
        if (result) {
          return validate(result);
        }
      } catch (error) {
        Sentry.captureException(error, { level: 'warning', tags: { source: `lore-litellm-fallback-${config.sentryPrefix}`, model: litellmFallbackModel } });
      }
    }
  }

  // 3. Try Anthropic direct (legacy)
  if (anthropicKey) {
    try {
      const result = await callAnthropicDirect(anthropicKey, userPrompt, config.systemPrompt, config.maxTokens);
      if (result) {
        return validate(result);
      }
    } catch (error) {
      Sentry.captureException(error, { level: 'warning', tags: { source: `lore-anthropic-${config.sentryPrefix}` } });
    }
  }

  // 4. Template fallback
  return generateTemplateFallback(input, config.fallbackTemplates, validate);
}

// --- Public Exports ---

export function buildLoreUserPrompt(data: LoreInputData): string {
  return buildUserPrompt(data, SHORT_LORE_CONFIG.promptInstruction);
}

export function buildLongLoreUserPrompt(data: LoreInputData): string {
  return buildUserPrompt(data, LONG_LORE_CONFIG.promptInstruction);
}

export function validateLore(lore: string): string {
  return sanitizeLore(lore, MAX_LORE_LENGTH);
}

export function validateLongLore(lore: string): string {
  return sanitizeLore(lore, MAX_LONG_LORE_LENGTH);
}

export function generateFallbackLore(input: LoreInputData): string {
  return generateTemplateFallback(input, FALLBACK_TEMPLATES, validateLore);
}

export function generateLongFallbackLore(input: LoreInputData): string {
  return generateTemplateFallback(input, LONG_FALLBACK_TEMPLATES, validateLongLore);
}

export async function generateLore(input: LoreInputData): Promise<string> {
  return generateLoreWithCascade(input, SHORT_LORE_CONFIG);
}

export async function generateLongLore(input: LoreInputData): Promise<string> {
  return generateLoreWithCascade(input, LONG_LORE_CONFIG);
}
