// AI lore generation and fallback template engine for Eth-RPG character narratives
import type { LoreInputData, CharacterClassId } from '@/lib/types';

// --- Constants ---
const MAX_LORE_LENGTH = 80;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const LORE_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API_VERSION = '2023-06-01';
const MAX_TOKENS = 200;

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

// --- Fallback Templates ---
const FALLBACK_TEMPLATES: Record<CharacterClassId, readonly [string, string]> = {
  hunter: [
    '이 사냥꾼은 수많은 유물을 수집하며 전장을 누볐다.',
    '고대 유물의 부름에 이끌려 끝없는 사냥을 이어가는 자.',
  ],
  rogue: [
    '그림자 속에서 수많은 거래를 성사시킨 교활한 암살자.',
    '시장의 틈새를 파고드는 것이 이 로그의 생존 방식이다.',
  ],
  summoner: [
    '차원의 문을 열어 세계를 넘나든 방랑자.',
    '하나의 세계에 머무를 수 없는 운명을 타고난 소환사.',
  ],
  merchant: [
    '안정의 화폐를 쌓으며 조용히 부를 축적해온 상인.',
    '전쟁통에도 금고를 지킨 이 상인의 냉철함은 전설이다.',
  ],
  priest: [
    '마력(가스)을 아끼지 않고 네트워크에 헌신한 성직자.',
    '수많은 의식(트랜잭션)을 집전하며 체인을 밝힌 자.',
  ],
  elder_wizard: [
    '오랜 세월을 관망하며 지혜를 쌓아온 고대 마법사.',
    '오래전 각성했으나, 지금은 은둔하며 때를 기다리는 자.',
  ],
  guardian: [
    '많은 말 없이 묵묵히 자산을 지켜온 수호자.',
    '폭풍 속에서도 흔들리지 않는 이 수호자의 의지는 강철과 같다.',
  ],
  warrior: [
    '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
    '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
  ],
} as const;

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
 * Validates lore text: enforces max length and removes forbidden words.
 * Returns the cleaned lore string.
 */
export function validateLore(lore: string): string {
  let cleaned = lore.trim();

  for (const word of FORBIDDEN_WORDS) {
    if (cleaned.includes(word)) {
      cleaned = cleaned.split(word).join('***');
    }
  }

  if (cleaned.length > MAX_LORE_LENGTH) {
    cleaned = cleaned.slice(0, MAX_LORE_LENGTH - 3) + '...';
  }

  return cleaned;
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

interface AnthropicMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

interface AnthropicResponse {
  readonly content: readonly { readonly type: string; readonly text: string }[];
}

/**
 * Generates an AI-powered hero lore narrative using the Anthropic Claude API.
 * Falls back to template-based generation on any failure.
 */
export async function generateLore(input: LoreInputData): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackLore(input);
  }

  try {
    const userPrompt = buildLoreUserPrompt(input);

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
        model: LORE_MODEL,
        max_tokens: MAX_TOKENS,
        system: LORE_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      return generateFallbackLore(input);
    }

    const data = (await response.json()) as AnthropicResponse;

    const textBlock = data.content.find((block) => block.type === 'text');
    if (!textBlock?.text) {
      return generateFallbackLore(input);
    }

    const rawLore = textBlock.text.trim();

    if (rawLore.length === 0) {
      return generateFallbackLore(input);
    }

    return validateLore(rawLore);
  } catch {
    return generateFallbackLore(input);
  }
}
