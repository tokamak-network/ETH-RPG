// AI lore generation and fallback template engine for Eth-RPG character narratives
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
  'ETH', 'USD', '달러', '원', 'BTC', 'USDT', 'USDC',
  '흑우', '호구', '바보', '멍청',
  '투자', '매수', '매도', '가격',
];

// --- System Prompt ---
export const LORE_SYSTEM_PROMPT = `당신은 RPG 세계의 서사관(Lorekeeper)입니다.
이더리움 지갑의 온체인 데이터를 바탕으로, 해당 지갑 주인의 '영웅 서사'를 한국어 1~2문장으로 작성합니다.

## 톤
- RPG 판타지 서사체를 사용하되, 크립토 이벤트를 판타지 세계관으로 치환합니다.
- 유머러스하되 모욕적이지 않아야 합니다.
- 공유하고 싶은 재미있는 문장을 만드세요.

## 규칙
1. 반드시 1~2문장, 최대 80자 이내로 작성합니다.
2. 실제 금액(ETH, USD 등)을 절대 언급하지 않습니다.
3. "흑우", "호구", "바보" 등 직접적 비하 표현을 사용하지 않습니다.
4. 투자 조언이나 가격 예측을 포함하지 않습니다.
5. 직업(Class)에 맞는 캐릭터성을 반영합니다.
6. 지갑 활동 시기에 맞는 크립토 이벤트를 판타지로 치환합니다.

## 크립토 이벤트 → RPG 치환 사전
- 2021년 불장 → "대상승의 시대"
- 루나/테라 붕괴 → "달의 왕국 붕괴"
- 이더리움 머지 → "대통합의 의식"
- FTX 파산 → "거래소 왕국의 배신"
- NFT 붐 → "고대 유물 수집의 시대"
- 가스비 폭등 → "마력 대기근"
- DeFi Summer → "탈중앙 해방전쟁"
- BTC ETF → "기관 기사단의 출현"
- BTC ATH → "전설의 봉우리 도달"

## 직업별 캐릭터성
- Hunter: 유물(NFT) 사냥에 집착, 수집벽
- Rogue: 빠른 거래, 기회주의적, 교활
- Summoner: 차원(체인)을 넘나드는 방랑자
- Merchant: 안정적, 계산적, 부의 축적
- Priest: 가스비를 아끼지 않는 헌신자
- Elder Wizard: 오래된 지혜, 은둔, 관망
- Guardian: 묵묵히 지키는 수호자, 홀더
- Warrior: 평범하지만 꾸준한 전사`;

// --- Deterministic Hash ---

/**
 * Produces a simple deterministic numeric hash from a string.
 * Used to select a consistent fallback template for the same input data.
 */
function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// --- User Prompt Builder ---

/**
 * Formats LoreInputData into a structured prompt string for the AI model.
 */
export function buildLoreUserPrompt(data: LoreInputData): string {
  const eventsSection =
    data.relevantEvents.length > 0
      ? `경험한 사건: ${data.relevantEvents.join(', ')}`
      : '특별한 사건 경험 없음';

  return [
    `직업: ${data.className} (${data.classNameEn})`,
    `레벨: ${data.level}`,
    `전투력: ${data.power}`,
    `총 트랜잭션: ${data.txCount}회`,
    `지갑 나이: ${data.walletAgeDescription}`,
    `첫 활동: ${data.firstTxDate}`,
    `최근 활동: ${data.lastTxDate}`,
    eventsSection,
    `활동 패턴: ${data.activityPattern}`,
    '',
    '위 데이터를 바탕으로 이 영웅의 서사를 한국어 1~2문장, 80자 이내로 작성해주세요.',
  ].join('\n');
}

// --- Lore Validation ---

/**
 * Sanitizes lore text: removes forbidden words and enforces max length.
 */
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

/**
 * Validates short lore text (max 80 chars).
 */
export function validateLore(lore: string): string {
  return sanitizeLore(lore, MAX_LORE_LENGTH);
}

// --- Fallback Lore Generation ---

/**
 * Generates a deterministic template-based lore string when AI generation fails.
 * Uses a hash of the input data to consistently select the same template.
 */
export function generateFallbackLore(input: LoreInputData): string {
  const classId = input.classNameEn.toLowerCase().replace(/\s+/g, '_') as CharacterClassId;
  const templates = FALLBACK_TEMPLATES[classId] ?? FALLBACK_TEMPLATES.warrior;

  const hashInput = `${input.classNameEn}-${input.level}-${input.power}-${input.txCount}`;
  const hash = deterministicHash(hashInput);
  const index = hash % templates.length;

  return validateLore(templates[index]);
}

// --- AI Lore Generation ---

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

/**
 * Calls a LiteLLM / OpenAI-compatible chat completion endpoint.
 */
async function callLiteLLM(
  apiKey: string,
  baseUrl: string,
  model: string,
  userPrompt: string,
  systemPrompt: string = LORE_SYSTEM_PROMPT,
  maxTokens: number = MAX_TOKENS,
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

/**
 * Calls the Anthropic API directly (legacy fallback when LiteLLM is not configured).
 */
async function callAnthropicDirect(
  apiKey: string,
  userPrompt: string,
  systemPrompt: string = LORE_SYSTEM_PROMPT,
  maxTokens: number = MAX_TOKENS,
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

/**
 * Generates an AI-powered hero lore narrative.
 *
 * Priority:
 * 1. LiteLLM (LITELLM_API_KEY set) — OpenAI-compatible, any model
 * 2. Anthropic direct (ANTHROPIC_API_KEY set) — legacy fallback
 * 3. Template-based fallback
 */
export async function generateLore(input: LoreInputData): Promise<string> {
  const litellmKey = process.env.LITELLM_API_KEY;
  const litellmBaseUrl = process.env.LITELLM_BASE_URL ?? DEFAULT_BASE_URL;
  const litellmModel = process.env.LITELLM_MODEL ?? DEFAULT_MODEL;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const userPrompt = buildLoreUserPrompt(input);

  // 1. Try LiteLLM (OpenAI-compatible)
  if (litellmKey) {
    try {
      const result = await callLiteLLM(litellmKey, litellmBaseUrl, litellmModel, userPrompt);
      if (result) {
        return validateLore(result);
      }
    } catch {
      // Fall through to Anthropic direct or template fallback
    }
  }

  // 2. Try Anthropic direct (legacy)
  if (anthropicKey) {
    try {
      const result = await callAnthropicDirect(anthropicKey, userPrompt);
      if (result) {
        return validateLore(result);
      }
    } catch {
      // Fall through to template fallback
    }
  }

  // 3. Template fallback
  return generateFallbackLore(input);
}

// --- Long Lore (Card Back) ---

const LONG_LORE_SYSTEM_PROMPT = `당신은 RPG 세계의 서사관(Lorekeeper)입니다.
이더리움 지갑의 온체인 데이터를 바탕으로, 해당 지갑 주인의 '영웅 서사'를 한국어 3~5문장으로 작성합니다.

## 톤
- RPG 판타지 서사체를 사용하되, 크립토 이벤트를 판타지 세계관으로 치환합니다.
- 서사시처럼 드라마틱하고 장엄하게 작성합니다.
- 공유하고 싶은 몰입감 있는 서사를 만드세요.

## 규칙
1. 반드시 3~5문장, 최대 400자 이내로 작성합니다.
2. 실제 금액(ETH, USD 등)을 절대 언급하지 않습니다.
3. "흑우", "호구", "바보" 등 직접적 비하 표현을 사용하지 않습니다.
4. 투자 조언이나 가격 예측을 포함하지 않습니다.
5. 직업(Class)에 맞는 캐릭터성을 깊이 있게 반영합니다.
6. 지갑 활동 시기에 맞는 크립토 이벤트를 판타지로 치환합니다.
7. 짧은 서사(1~2문장)와는 다른, 더 깊은 이야기를 들려주세요.

## 크립토 이벤트 → RPG 치환 사전
- 2021년 불장 → "대상승의 시대"
- 루나/테라 붕괴 → "달의 왕국 붕괴"
- 이더리움 머지 → "대통합의 의식"
- FTX 파산 → "거래소 왕국의 배신"
- NFT 붐 → "고대 유물 수집의 시대"
- 가스비 폭등 → "마력 대기근"
- DeFi Summer → "탈중앙 해방전쟁"
- BTC ETF → "기관 기사단의 출현"
- BTC ATH → "전설의 봉우리 도달"

## 직업별 캐릭터성
- Hunter: 유물(NFT) 사냥에 집착, 수집벽
- Rogue: 빠른 거래, 기회주의적, 교활
- Summoner: 차원(체인)을 넘나드는 방랑자
- Merchant: 안정적, 계산적, 부의 축적
- Priest: 가스비를 아끼지 않는 헌신자
- Elder Wizard: 오래된 지혜, 은둔, 관망
- Guardian: 묵묵히 지키는 수호자, 홀더
- Warrior: 평범하지만 꾸준한 전사`;

/**
 * Builds a user prompt requesting a longer narrative (3-5 sentences).
 */
export function buildLongLoreUserPrompt(data: LoreInputData): string {
  const eventsSection =
    data.relevantEvents.length > 0
      ? `경험한 사건: ${data.relevantEvents.join(', ')}`
      : '특별한 사건 경험 없음';

  return [
    `직업: ${data.className} (${data.classNameEn})`,
    `레벨: ${data.level}`,
    `전투력: ${data.power}`,
    `총 트랜잭션: ${data.txCount}회`,
    `지갑 나이: ${data.walletAgeDescription}`,
    `첫 활동: ${data.firstTxDate}`,
    `최근 활동: ${data.lastTxDate}`,
    eventsSection,
    `활동 패턴: ${data.activityPattern}`,
    '',
    '위 데이터를 바탕으로 이 영웅의 서사를 한국어 3~5문장, 400자 이내의 드라마틱한 이야기로 작성해주세요.',
  ].join('\n');
}

/**
 * Validates long lore text (max 400 chars).
 */
export function validateLongLore(lore: string): string {
  return sanitizeLore(lore, MAX_LONG_LORE_LENGTH);
}

/**
 * Generates a deterministic long fallback lore when AI generation fails.
 */
export function generateLongFallbackLore(input: LoreInputData): string {
  const classId = input.classNameEn.toLowerCase().replace(/\s+/g, '_') as CharacterClassId;
  const templates = LONG_FALLBACK_TEMPLATES[classId] ?? LONG_FALLBACK_TEMPLATES.warrior;

  const hashInput = `${input.classNameEn}-${input.level}-${input.power}-${input.txCount}`;
  const hash = deterministicHash(hashInput);
  const index = hash % templates.length;

  return validateLongLore(templates[index]);
}

/**
 * Generates a longer AI-powered hero narrative (3-5 sentences) for the card back.
 *
 * Priority: LiteLLM → Anthropic direct → template fallback.
 */
export async function generateLongLore(input: LoreInputData): Promise<string> {
  const litellmKey = process.env.LITELLM_API_KEY;
  const litellmBaseUrl = process.env.LITELLM_BASE_URL ?? DEFAULT_BASE_URL;
  const litellmModel = process.env.LITELLM_MODEL ?? DEFAULT_MODEL;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const userPrompt = buildLongLoreUserPrompt(input);

  // 1. Try LiteLLM (OpenAI-compatible)
  if (litellmKey) {
    try {
      const result = await callLiteLLM(
        litellmKey, litellmBaseUrl, litellmModel, userPrompt,
        LONG_LORE_SYSTEM_PROMPT, MAX_LONG_TOKENS,
      );
      if (result) {
        return validateLongLore(result);
      }
    } catch {
      // Fall through
    }
  }

  // 2. Try Anthropic direct
  if (anthropicKey) {
    try {
      const result = await callAnthropicDirect(
        anthropicKey, userPrompt,
        LONG_LORE_SYSTEM_PROMPT, MAX_LONG_TOKENS,
      );
      if (result) {
        return validateLongLore(result);
      }
    } catch {
      // Fall through
    }
  }

  // 3. Template fallback
  return generateLongFallbackLore(input);
}
