# 🧠 PROMENG (Prompt Engineer) Agent

## 역할 정의
Wallet RPG의 AI 영웅 서사(Lore) 생성을 담당하는 프롬프트 엔지니어.
트랜잭션 데이터 기반으로 유머러스하고 공유 욕구를 자극하는 한 줄 서사를 생성한다.

---

## AI 서사 생성 시스템

### 사용 모델
- **1순위**: Claude Sonnet (Anthropic API) — 한국어 유머/뉘앙스 품질 우수
- **2순위**: GPT-4o-mini (OpenAI API) — 비용 효율 백업
- **MVP**: 둘 중 하나 고정. 모델 스위칭은 v1.1

### 응답 제약
- **길이**: 한국어 기준 1~2문장 (최대 80자)
- **톤**: RPG 서사체 + 크립토 밈 유머
- **금지**: 실제 금액 언급, 투자 조언, 비하/모욕, 개인 식별 정보

---

## 메인 프롬프트

```typescript
const LORE_SYSTEM_PROMPT = `
당신은 RPG 세계의 서사관(Lorekeeper)입니다.
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
- Warrior: 평범하지만 꾸준한 전사
`;

const LORE_USER_PROMPT = (data: LoreInputData) => `
다음 데이터를 바탕으로 영웅 서사를 작성하세요.

## 캐릭터 정보
- 직업: ${data.className} (${data.classNameEn})
- 레벨: ${data.level}
- 전투력: ${data.power}

## 온체인 데이터
- 총 트랜잭션: ${data.txCount}회
- 지갑 나이: ${data.walletAgeDescription}
- 최초 활동: ${data.firstTxDate}
- 최근 활동: ${data.lastTxDate}
- 활동 시기의 주요 이벤트: ${data.relevantEvents.join(', ')}
- 주요 활동 패턴: ${data.activityPattern}

영웅 서사 (1~2문장, 80자 이내):
`;
```

---

## LoreInputData 구성

```typescript
interface LoreInputData {
  className: string;
  classNameEn: string;
  level: number;
  power: number;
  txCount: number;
  walletAgeDescription: string;  // "3년 2개월" 등
  firstTxDate: string;           // "2021-04-15"
  lastTxDate: string;            // "2025-02-10"
  relevantEvents: string[];      // 활동 기간 내 크립토 이벤트
  activityPattern: string;       // "NFT 민팅 집중" / "DEX 활발" 등
}

// 활동 기간에 해당하는 이벤트 필터링
function getRelevantEvents(firstTx: number, lastTx: number): string[] {
  return CRYPTO_EVENTS
    .filter(e => {
      const eventTime = new Date(e.date).getTime();
      return eventTime >= firstTx && eventTime <= lastTx;
    })
    .map(e => e.rpgEvent);
}

// 활동 패턴 요약 (직업 판정 근거를 자연어로)
function describeActivityPattern(classification: TxClassification): string {
  const patterns: string[] = [];
  if (classification.nftRatio > 0.2) patterns.push('NFT 수집/민팅 활발');
  if (classification.dexRatio > 0.15) patterns.push('DEX 스왑 빈번');
  if (classification.bridgeCount > 3) patterns.push('크로스체인 이동 경험');
  if (classification.stableRatio > 0.25) patterns.push('스테이블코인 중심 활동');
  return patterns.join(', ') || '일반적인 트랜잭션 활동';
}
```

---

## AI 호출 함수

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
    
    // 길이 검증 (80자 초과 시 재생성 없이 자르기)
    return lore.length > 80 ? lore.substring(0, 77) + '...' : lore;
  } catch (error) {
    // 폴백: 템플릿 기반 서사
    return generateFallbackLore(input);
  }
}
```

---

## 폴백 서사 (API 실패 시)

```typescript
const FALLBACK_TEMPLATES: Record<string, string[]> = {
  hunter: [
    '이 사냥꾼은 {eventCount}개의 유물을 수집하며 전장을 누볐다.',
    '고대 유물의 부름에 이끌려 끝없는 사냥을 이어가는 자.',
  ],
  rogue: [
    '그림자 속에서 {txCount}번의 거래를 성사시킨 교활한 암살자.',
    '시장의 틈새를 파고드는 것이 이 로그의 생존 방식이다.',
  ],
  summoner: [
    '차원의 문을 {bridgeCount}번 열어 세계를 넘나든 방랑자.',
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
    '{walletAge} 세월을 관망하며 지혜를 쌓아온 고대 마법사.',
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
};

function generateFallbackLore(input: LoreInputData): string {
  const templates = FALLBACK_TEMPLATES[input.classNameEn.toLowerCase()] || FALLBACK_TEMPLATES.warrior;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace('{txCount}', String(input.txCount))
    .replace('{walletAge}', input.walletAgeDescription)
    .replace('{eventCount}', String(input.txCount))
    .replace('{bridgeCount}', String(5)); // 기본값
}
```

---

## 서사 품질 가이드라인

### 좋은 서사 예시
- "이 마법사는 2021년 대상승의 시대에 각성했으나, 달의 왕국 붕괴 때 다리에 화살을 맞았다."
- "34번의 차원 이동을 감행한 소환사. 그가 여는 문 너머엔 항상 새로운 세계가 있었다."
- "가스 대기근 속에서도 마력을 아끼지 않은 성직자. 네트워크가 그의 헌신을 기억한다."

### 나쁜 서사 예시 (금지)
- ❌ "0.5 ETH밖에 없는 가난한 전사." (금액 언급)
- ❌ "이 지갑은 완전 호구입니다." (직접 비하)
- ❌ "비트코인이 곧 10만 달러 갈 겁니다." (투자 조언)
- ❌ "vitalik.eth님의 지갑은..." (개인 식별)

---

## 프롬프트 버전 관리
- 프롬프트 변경 시 버전 태그 필수 (v1.0, v1.1, ...)
- A/B 테스트 시 두 버전 동시 운영 가능 (랜덤 할당)
- 서사 품질 이슈 발생 시 폴백 템플릿 우선 전환
