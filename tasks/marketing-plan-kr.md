# Eth·RPG 마케팅 계획서

> 작성일: 2026-02-18
> 목표: 런칭 7일 내 UV 400+, 카드 생성 150+, 공유율 20%+, K ≥ 0.3

---

## 1. 현황 진단

### 서비스 상태
| 항목 | 상태 | 비고 |
|------|------|------|
| 코어 기능 (주소→카드) | ✅ 완료 | 8종 직업, 6종 스탯, AI 서사 |
| 프론트엔드 UX | ✅ 완료 | 랜딩→입력→로딩→카드→공유 플로우 |
| 카드 비주얼 | ✅ 완료 | 다크 판타지, 픽셀아트, 3D 뒤집기 |
| 공유 버튼 | ⚠️ 부분 | Twitter, Farcaster, 링크복사만 |
| OG 이미지 (개인화) | ❌ 미완 | result 페이지에 generateMetadata 없음 |
| 카드 다운로드 | ❌ 미구현 | cardImageUrl 생성은 되지만 다운로드 버튼 없음 |
| 이벤트 트래킹 | ✅ 완료 | 5단계 퍼널 + OG 로드 + UTM (커스텀 API route) |
| 배포 | ❌ 미완 | Vercel 배포 및 도메인 미연결 |

### 바이럴 루프 점검
```
[1] 유저가 카드를 봄 → ✅ (카드 렌더링 완료)
[2] 공유 버튼 클릭 → ✅ (Twitter/Farcaster)
[3] 받는 사람이 링크 프리뷰에서 카드를 봄 → ❌ (OG 미개인화)
[4] "나도 해볼래" 클릭 → ✅ (링크 동작)
[5] 자기 카드 생성 → ✅
[6] 다시 공유 → ✅
```
**6단계 모두 동작. 공유 플로우 완성. 바이럴 계수(K)는 Day 3부터 측정 시작.**

---

## 2. 런칭 전 기술 수정 (MUST-DO)

### P0: 바이럴 루프 완성 (예상 2-3시간)

| # | 작업 | 파일 | 효과 |
|---|------|------|------|
| 1 | result 페이지 `generateMetadata()` 추가 | `src/app/result/[address]/page.tsx` → layout 분리 | 공유 링크에 "Lv.42 사냥꾼 \| 전투력 12,345" + 개인 카드 이미지 노출 |
| 2 | "카드 저장" 다운로드 버튼 | `src/components/ShareButtons.tsx` | 이미지 직접 업로드 시 노출 2-3배 증가 |

### P1: 안정성 (선택, 런칭 후 가능)

| # | 작업 | 효과 |
|---|------|------|
| 3 | 캐시 미스 시 OG/card 라우트에서 재생성 | 서버 재시작 후에도 공유 링크 유지 |
| 4 | 텔레그램/카카오톡 공유 버튼 | 한국 크립토 커뮤니티 커버 |

---

## 3. 타겟 유저 정의

### 프라이머리: 크립토 네이티브 (이더리움 지갑 보유)
- **특성**: 온체인 활동 활발, CT/Farcaster 활동, 밈/카드 공유 문화
- **동기**: 내 온체인 활동이 어떤 캐릭터인지 궁금함, 전투력 비교, 자기 과시
- **유입 경로**: CT, Farcaster, 크립토 디스코드/텔레그램

### 세컨더리: 크립토 라이트 유저 (지갑은 있지만 비활발)
- **특성**: 가끔 NFT 구매, 거래소 출금 정도
- **동기**: 재미, 친구가 공유한 카드 보고 "나도 해볼래"
- **유입 경로**: 바이럴 링크 (1차 유저가 공유)

### 안티페르소나 (타겟 아님)
- 지갑 없는 일반인 (주소 입력 자체가 허들)
- DeFi/NFT에 반감 있는 유저

---

## 4. 바이럴 메커니즘 분석

### 핵심 심리 트리거 3종
```
1. 비교 욕구 — "전투력 12,345… 너는 몇이냐"
   → 숫자 비교는 본능적. 친구 지갑도 넣어보게 만듦

2. 정체성 부여 — "나는 사냥꾼/로그/위저드"
   → RPG 직업 = 내 온체인 정체성. 프로필 소재가 됨

3. AI 서사 공감 — "달의 왕국 붕괴를 견뎌낸 현자"
   → 크립토 역사를 판타지로 치환 → 감성적 공감 + 웃음
```

### 바이럴 계수 측정 계획
```
K (바이럴 계수) = share_rate × inflow_per_share

산출 방식:
- share_rate = funnel_share / funnel_generate_success (어드민 대시보드에서 측정)
- inflow_per_share = utm_source=share 페이지뷰 / funnel_share (UTM 데이터에서 측정)

목표: K ≥ 0.3 (최소 기준), 스트레치 K ≥ 0.5

측정 일정:
- Day 1-2: 원시 데이터 수집 (K 계산 안 함 — 샘플 부족)
- Day 3: 첫 K-factor 계산 (공유 50건 이상 필요)
- Day 5: 2차 K-factor 확인
- Day 7: 최종 K-factor → Go/No-Go 판단

Day 3 K < 0.3일 경우:
  → 카피/CTA 피봇 (상위 성과 카피로 전환)
  → 링크 공유 대신 카드 다운로드 강조
  → 결과 페이지에 "친구 지갑도 넣어봐" CTA 추가

주의: 측정 전 K값을 가정하지 않는다. 이전 추정치 K=0.5는 미검증
가정(공유당 CT 도달 5명, 랜딩 전환율 50%)에 기반했음. 실제 CT
클릭률은 1-3%이므로 실제 K는 0.1-0.3일 수 있음.
K=0.3으로 계획하고, 더 높으면 축하한다.
```

---

## 5. 채널별 실행 계획

### Phase 1: 소프트 런칭 (Day 1-2)

#### A. Crypto Twitter (CT)
**목표**: 초기 시드 유저 50명 확보

**첫 포스트 (개인 계정 or 프로젝트 계정)**
```
🗡️ 내 이더리움 지갑이 RPG 캐릭터가 됐다

지갑 주소만 넣으면 10초 안에:
- 직업 판정 (8종)
- 스탯 산출 (Level/HP/MP/STR/INT/LUCK)
- AI 영웅 서사 생성
- 전투력 계산

키 연결 ❌ 서명 ❌ 조회만 ✅

내 전투력 {power}… 너는 몇이냐?

{URL}

[카드 이미지 첨부]
```

**유명 지갑 태그 포스트 (Day 1-3, 하루 2-3건)**
- 유명 지갑 주소(vitalik.eth 등)로 미리 생성한 카드를 CT에 포스트
- "@vitalikbuterin 님 전투력 89,432 Elder Wizard" 식으로 태그
- 본인이 RT 안 해도 팔로워들이 호기심에 클릭 → 유입
- KOL DM은 비현실적 (콜드 DM 응답률 1-5%, 대부분 무시)
- 태그 포스트는 RT 없이도 검색/타임라인 노출 효과

**해시태그**
```
#EthRPG #WalletRPG #onchain #ethereum
```

#### B. Farcaster/Warpcast
**목표**: 온체인 네이티브 30명

**캐스트**
```
Just built something fun — paste any ETH address and get your RPG hero card in 10 seconds ⚔️

8 classes, 6 stats, AI-generated lore based on your on-chain history.

No wallet connect. No signing. Just vibes.

My Power: {power}... what's yours?

{URL}
```

**채널 타겟**
| 채널 | 포스트 타입 |
|------|------------|
| /ethereum | 프로젝트 소개 + 데모 |
| /base | "works with any ETH address" |
| /defi | "DeFi degens are Rogues apparently" |
| /nft | "NFT collectors = Hunters" |
| /korean | 한국어 포스트 |

#### C. 크립토 디스코드 (10곳/일)
**타겟 서버 (우선순위순)**
```
1. DeFi Korea — 한국어, 활성화, 관련도 최상
2. NFT Korea — 한국어, NFT 유저
3. Bankless DAO — 영문, 크립토 교육 커뮤니티
4. Ethereum Official — 영문, 최대 규모
5. Optimism — 영문, L2 유저
6. Base — 영문, Coinbase 유저
7. Lido — 영문, 스테이킹 유저
8. Uniswap — 영문, DEX 유저
9. Friends With Benefits — 영문, 문화 크립토
10. Arbitrum — 영문, L2 유저
```

**DM/포스트 전략**
- 서버 #general 또는 #off-topic에 직접 포스팅 (허용 시)
- 운영자 DM: "운영자님 지갑으로 먼저 카드 만들어드릴게요" (개인화 어필)
- 스팸 느낌 방지: 서버마다 톤 조절, 한 서버당 1회만

---

### Phase 2: 확산 (Day 3-5)

#### D. 한국 텔레그램 (5곳)
```
1. 이더리움 한국 — 메인 타겟
2. DeFi Korea 텔레그램 — DeFi 유저
3. NFT Korea 텔레그램 — NFT 유저
4. 크립토 트레이더 그룹 — 활발한 유저
5. Web3 빌더 한국 — 개발자 + 빌더
```

#### E. 2차 CT 콘텐츠
- "유명 지갑 전투력 랭킹" 시리즈
  - vitalik.eth: Lv.?? Elder Wizard 🔮
  - sassal.eth: Lv.?? Guardian 🛡️
  - 등 5-10개 유명 주소
- "직업별 특징" 인포그래픽
  - "당신이 Rogue라면… DEX에서 누구보다 빠르게 스왑한다"
- 유저 제보 RT (유저가 올린 카드 리트윗)

#### F. 카카오톡 오픈채팅
- 크립토 오픈채팅방 탐색 (카카오톡 검색: 이더리움, NFT, 코인)
- 자연스러운 톤으로 공유: "이거 해봤는데 재밌더라"
- 1일 5곳 제한 (스팸 방지)

---

### Phase 3: 글로벌 확장 (Week 2)

#### G. Product Hunt
**준비물**
- 영문 타이틀: "Eth·RPG — Turn your Ethereum wallet into an RPG hero"
- 태그라인: "Paste address → get your hero card in 10 seconds"
- 스크린샷 5장: 랜딩, 로딩, 카드 앞면, 카드 뒷면, 공유
- 메이커 코멘트: 기술 스택 + 만든 이유
- 카테고리: Web3, Gaming, AI

**타이밍**: 화요일~목요일 오전 (PT 00:01 런칭)

#### H. Reddit
- r/ethereum: "I built a tool that turns ETH wallets into RPG characters" (Show-off)
- r/web3: 크로스포스트
- r/IndieHackers: 빌딩 스토리

#### I. Hacker News
- "Show HN: Eth·RPG – Ethereum wallet → RPG character card"
- 기술적 디테일 강조 (on-chain analysis, Claude AI lore)

---

## 6. 공유 카피 전략

### 원칙
```
1. 숫자를 앞세운다 — "전투력 12,345" (비교 욕구 자극)
2. 질문형으로 끝낸다 — "너는 몇이냐?" (반응 유도)
3. 안전 문구 포함 — "키/서명 없음" (신뢰 확보)
4. 짧게 — 2줄 이내 (스크롤 멈추게)
```

### 한국어 카피 세트 (6종)
| # | 카피 | 용도 |
|---|------|------|
| 1 | 내 지갑 전투력 {power}… 너는 몇이냐 🗡️ | 기본 공유 (현재 ShareButtons 기본값) |
| 2 | 나는 {class}. 지갑으로 직업 나오는 거 실화냐 | 직업 강조 |
| 3 | 지갑 주소만 넣으면 RPG 캐릭터 카드 10초 ⚔️ | 기능 설명형 |
| 4 | "{lore}" — 내 지갑의 영웅 서사래ㅋㅋ | AI 서사 강조 |
| 5 | 키/서명 없음. 조회만 함. 안전함. 재밌음. | 신뢰+재미 |
| 6 | 친구 지갑도 한번 넣어봐ㅋㅋ 결과 ㄹㅇ 웃김 | 확산 유도 |

### 영문 카피 세트 (6종)
| # | 카피 | 용도 |
|---|------|------|
| 1 | My wallet Power: {power}… what's yours? 🗡️ | 기본 공유 |
| 2 | I'm a {class}. This turns your ETH wallet into an RPG hero | 직업 강조 |
| 3 | Paste address → get your hero card. No connect, no sign ⚔️ | 기능 설명형 |
| 4 | My wallet lore: "{lore}" 😂 | AI 서사 강조 |
| 5 | 10 seconds to find out what RPG class your wallet is | 호기심 유발 |
| 6 | Try your friend's wallet too 👀 | 확산 유도 |

---

## 7. 퍼널 측정 계획

### 이벤트 정의 (5개)
```
page_view         — 페이지 진입 (landing / result)
address_submit    — 주소 입력 제출
card_generated    — 카드 생성 완료 (class, level, power 포함)
share_click       — 공유 버튼 클릭 (platform: twitter/farcaster/copy/download)
card_download     — 카드 이미지 다운로드
```

### UTM 체계
```
시딩 포스트:    ?utm_source={platform}&utm_medium=organic&utm_campaign=launch_seed
공유 링크:      ?utm_source=share&utm_medium=card&utm_campaign=viral_v{1-6}
Product Hunt:   ?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch
Reddit/HN:      ?utm_source={platform}&utm_medium=post&utm_campaign=community
```

**카피 A/B 추적**: 공유 링크의 `utm_campaign`에 변형 ID 포함 (예: `viral_v1` ~ `viral_v6`). UI 변경 없이 UTM 데이터로 카피별 성과 비교 가능. 기본 공유 버튼은 `viral_v1` 사용, 수동 시딩 포스트는 사용한 카피 세트 번호와 매칭.

### KPI 대시보드
| 지표 | 산출 | Day 7 목표 | Day 30 목표 |
|------|------|-----------|------------|
| UV (유니크 방문) | page_view 고유 | 400 | 2,000 |
| 카드 생성 수 | card_generated | 150 | 800 |
| 입력 전환율 | 생성/방문 | 40% | 40% |
| 공유율 | 공유/생성 | 20% | 25% |
| 다운로드율 | 다운로드/생성 | 15% | 20% |
| 바이럴 계수 (K) | share_rate × inflow_per_share | 0.3 | 0.5 |
| OG 이미지 노출 | og_image_load 카운터 | — | — |
| 채널별 1위 | UTM source | CT | CT |

### 트래킹 구현 옵션 (예산 0원)
| 도구 | 장점 | 단점 |
|------|------|------|
| **Vercel Analytics** (추천) | 무료, 설정 1분, Next.js 네이티브 | 커스텀 이벤트 제한적 |
| Plausible Cloud | 무료 10K/월, 프라이버시 친화 | 서드파티 |
| 자체 구현 (API route) | 완전 커스텀 | 개발 시간 필요 |
| Umami (셀프호스트) | 완전 무료, 오픈소스 | 호스팅 필요 |

**추천**: Vercel Analytics (기본) + 커스텀 이벤트는 API route 자체 구현

---

## 8. 시딩용 샘플 카드 전략

### "유명 지갑 카드" 시리즈
런칭 전 미리 5-10개 유명 주소로 카드 생성 → 시딩 콘텐츠로 활용

```
필수 생성 대상:
1. vitalik.eth — 이더리움 창시자, 인지도 최상
2. sassal.eth — 이더리움 커뮤니티 인플루언서
3. 0xd8dA...045 (Vitalik 2nd) — 다른 결과 나오는지 비교 재미
4. 유명 NFT 콜렉터 지갑 — Hunter 클래스 예시
5. 유명 DeFi 웨일 지갑 — Rogue 클래스 예시
```

**활용법**
- "@vitalikbuterin Lv.58 Elder Wizard, 전투력 89,432" → CT 태그 포스트 (Day 1-3)
- 여러 유명인 카드 나란히 → "이더리움 레전드 랭킹" 인포그래픽 (Day 2-3)
- 디스코드/텔레그램 시딩 시 샘플 이미지로 활용

---

## 9. 실행 타임라인

### 런칭 전 (D-2 ~ D-1)
| 시간 | 작업 | 담당 |
|------|------|------|
| D-2 AM | P0 기술 수정 (OG 메타데이터 + 다운로드 버튼) | 개발 |
| D-2 PM | Vercel 배포 + 도메인 연결 | 개발 |
| D-1 AM | OG 프리뷰 테스트 (Twitter Card Validator, Farcaster) | QA |
| D-1 AM | 샘플 카드 5장 생성 (유명 지갑) | 그로스 |
| D-1 PM | 공유 카피 6세트 최종 확정 | 그로스 |
| D-1 PM | 시딩 타겟 20곳 리스트 확정 + 포스트 텍스트 준비 | 그로스 |

### 런칭 (Day 1)
| 시간 | 작업 |
|------|------|
| 09:00 | CT 첫 포스트 (카드 이미지 + 링크) |
| 09:30 | Farcaster /ethereum 채널 캐스트 |
| 10:00 | 디스코드 시딩 시작 (5곳) |
| 12:00 | 텔레그램 시딩 (3곳) |
| 14:00 | 유명 지갑 태그 포스트 2-3건 (vitalik.eth, sassal.eth 등) |
| 18:00 | 퍼널 데이터 1차 확인 |
| 21:00 | 유저 반응 모니터링 + 핫픽스 |

### Day 2-3
| 작업 |
|------|
| 추가 디스코드 시딩 (5곳/일) |
| 유저 RT/리캐스트 모니터링 + 반응 |
| "유명 지갑 전투력 랭킹" 2차 콘텐츠 포스트 |
| 버그/피드백 대응 |
| 카카오톡 오픈채팅 시딩 (5곳) |

### Day 4-5
| 작업 |
|------|
| 2차 CT 콘텐츠 ("직업별 특징" 인포그래픽) |
| 유저 제보 RT + 커뮤니티 반응 |
| 퍼널 데이터 중간 점검 |
| 공유 카피 성과 비교 → 상위 카피에 집중 |

### Day 6-7
| 작업 |
|------|
| Product Hunt 런칭 등록 |
| Reddit r/ethereum 포스트 |
| Hacker News Show HN |
| 성과 데이터 1차 보고 |

---

## 10. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Alchemy API 레이트리밋 | 중 | 높음 | rate-limit.ts 이미 구현, 무료 티어 한도 확인 |
| Claude API 비용 초과 | 중 | 중 | 폴백 템플릿 이미 구현, 사용량 모니터링 |
| 디스코드/텔레그램 스팸 차단 | 높음 | 낮음 | 1서버 1회 원칙, 운영자 DM 우선 |
| 유명 지갑 소유자 불만 | 낮음 | 중 | 공개 데이터만 사용, 금융 코멘트 없음 명시 |
| 바이럴 안 됨 (K < 0.3) | 중 | 높음 | Day 3에 카피/CTA 변경, 이미지 다운로드 강조 |
| 서버 다운 (바이럴 시) | 낮음 | 높음 | 캐시 히트율로 API 부하 감소, Vercel 오토스케일 |

---

## 11. 성공 기준 (Go/No-Go)

### 채널별 UV 목표 분해

| 채널 | 목표 UV | 근거 |
|------|--------|------|
| CT (개인 계정) | 30-50 | ~1K 팔로워 × 3-5% CTR |
| Farcaster (5개 채널) | 20-30 | /ethereum 채널 도달 |
| Discord (10곳) | 50-100 | 서버당 5-10명 |
| Telegram (5곳) | 30-50 | 그룹당 6-10명 |
| 유명지갑 태그 포스트 (6-9건) | 30-60 | 포스트당 5-10 클릭, RT 없이 검색/타임라인 노출 |
| 바이럴 확산 (K=0.3) | 50-80 | ~200 생성 × 20% 공유 × K |
| 카카오톡 (5곳) | 20-30 | 방당 4-6명 |
| **합계 (보수적)** | **230-400** | |

**시사점**: UV 400은 낙관적 목표. 보수적 추정은 230-400.
Go/No-Go 기준 조정 필요 — "보통" 등급이 시딩만으로의 현실적 Day 7 결과.
"성공" 도달에는 바이럴 증폭(K > 0.3)이 필수.

### Day 7 기준
| 등급 | 기준 | 판단 |
|------|------|------|
| 🟢 성공 | UV 400+, 생성 150+, 공유율 20%+, K ≥ 0.3 | Phase 2 확장 진행 |
| 🟡 보통 | UV 200-400, 생성 80-150, 공유율 10-20% | 카피/채널 피봇 후 재시도 |
| 🔴 실패 | UV < 200, 생성 < 80, 공유율 < 10% | 제품 자체 재검토 (UX? 재미?) |

### 바이럴 계수 판단
| K 값 | 의미 | 액션 |
|------|------|------|
| K ≥ 1.0 | 자체 성장 | 서버 스케일링, 기능 확장 |
| 0.3 ≤ K < 1.0 | 시딩+바이럴 혼합 | 시딩 지속 + 공유 UX 개선 |
| K < 0.3 | 시딩 의존 | 카피 변경, CTA 강화, 다운로드 푸시 |

---

## 12. 즉시 실행 액션 (우선순위순)

```
[1] CRITICAL — OG 메타데이터 수정 (바이럴 루프 필수)
[2] CRITICAL — 카드 다운로드 버튼 추가
[3] HIGH    — Vercel 배포 + 도메인 연결
[4] HIGH    — 샘플 카드 5장 생성 (유명 지갑)
[5] HIGH    — OG 프리뷰 테스트 (Twitter Card Validator)
[6] MEDIUM  — Vercel Analytics 연동
[7] MEDIUM  — 공유 링크에 UTM 파라미터 삽입
```

**[1], [2]가 완료되지 않으면 런칭하지 않는다.**
바이럴 루프가 끊긴 상태로 시딩하면 노력 대비 효과가 1/3 이하로 떨어진다.
