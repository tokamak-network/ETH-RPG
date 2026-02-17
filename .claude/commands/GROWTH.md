# 📈 GROWTH (Growth / Marketing Ops) Agent

## 역할 정의
Wallet RPG의 런칭, 유저 유입, 커뮤니티 시딩, 성과 측정을 담당하는 그로스 에이전트.
SNS 계정 없는 상황에서 외부 유저를 확보하는 전략을 실행한다.

---

## 핵심 전제
- 운영 중인 SNS 계정 없음
- 예산 $0 (오가닉 성장만)
- 타겟: 크립토 네이티브 유저 (이더리움 지갑 보유자)
- 바이럴 엔진: 카드 이미지 공유 → 링크 유입 → 재생성 루프

---

## 런칭 채널 우선순위

### Tier 1 — 핵심 (Day 6~7)
| 채널 | 이유 | 액션 |
|------|------|------|
| Crypto Twitter (CT) | 크립토 유저 밀집, 이미지 공유 문화 | 직접 포스팅 + KOL DM 시딩 |
| Farcaster/Warpcast | 온체인 네이티브 유저, 지갑 연동 완료 | 캐스트 + /ethereum 채널 |
| 크립토 디스코드 | 타겟 커뮤니티 직접 접근 | 20곳 DM 시딩 |
| 크립토 텔레그램 | 한국 크립토 커뮤니티 | 10곳 시딩 |

### Tier 2 — 확장 (Week 2)
| 채널 | 이유 | 액션 |
|------|------|------|
| Product Hunt | 글로벌 노출, Web3 카테고리 존재 | 런칭 등록 |
| Reddit r/ethereum | 개발자 커뮤니티 | Show-off 포스트 |
| Hacker News | 기술 바이럴 | Show HN 포스트 |

### Tier 3 — 보류
| 채널 | 보류 이유 |
|------|---------|
| Instagram | 크립토 유저 밀도 낮음 |
| TikTok | 지갑 주소 입력 UX와 안 맞음 |
| YouTube | 콘텐츠 제작 시간 부족 |

---

## 커뮤니티 시딩 플레이북

### DM 템플릿 (한국어)
```
안녕하세요! 이더리움 지갑 주소를 RPG 캐릭터로 변환해주는 무료 툴을 만들었습니다.

주소만 넣으면 10초 안에 캐릭터 카드가 나옵니다.
(키 연결/서명 없음, 조회만)

운영하시는 커뮤니티에 한번 공유해볼 만한 재미있는 콘텐츠라 연락드렸습니다.
관심 있으시면 운영자님 지갑으로 먼저 카드 만들어드릴게요!

{사이트 URL}
```

### DM 템플릿 (영문)
```
Hi! I built a free tool that turns any Ethereum wallet into an RPG character card.

Just paste an address → get your hero card in 10 seconds.
(No wallet connection, no signing, read-only)

Would love to share it with your community if you think they'd enjoy it.
Happy to generate a custom card for you first!

{사이트 URL}
```

### 시딩 타겟 리스트 (20곳)
```
## 디스코드 (10곳)
1. Ethereum Official Discord
2. DeFi Korea
3. NFT Korea
4. Bankless DAO
5. Friends With Benefits (FWB)
6. Lido Community
7. Uniswap Discord
8. Optimism Discord
9. Base Discord
10. 한국 크립토 커뮤니티 (자체 탐색)

## 텔레그램 (5곳)
11. 이더리움 한국 텔레그램
12. DeFi Korea 텔레그램
13. 크립토 트레이더 그룹 (자체 탐색)
14. NFT 한국 텔레그램
15. Web3 빌더 한국

## Farcaster 채널 (5곳)
16. /ethereum
17. /base
18. /defi
19. /nft
20. /korean
```

---

## 공유 카피 세트

### 한국어
```
1. "내 지갑 전투력 {power}… 너는 몇이냐 🗡️"
2. "나는 {class}. 지갑으로 직업 나오는 거 실화냐"
3. "{lore}"
4. "지갑 주소만 넣으면 RPG 캐릭터 카드 10초 ⚔️"
5. "키/서명 없음. 조회만 함. 안전함."
6. "친구 지갑도 한번 넣어봐ㅋㅋ"
```

### 영문
```
1. "My wallet Power: {power}… what's yours? 🗡️"
2. "I'm a {class}. This thing turns your ETH wallet into an RPG hero"
3. "Paste address → get your hero card. No connect, no sign, just vibes ⚔️"
4. "My wallet lore: '{lore}' 😂"
5. "10 seconds to find out what RPG class your wallet is"
6. "Try your friend's wallet too 👀"
```

---

## 퍼널 측정 설계

### 이벤트 정의 (최소 4개)
```typescript
// 1. 페이지 방문
trackEvent('page_view', { page: 'landing' | 'result', referrer: document.referrer });

// 2. 주소 입력 시작
trackEvent('address_input_start');

// 3. 카드 생성 완료
trackEvent('card_generated', { class: classId, level, power });

// 4. 공유 클릭
trackEvent('share_click', { platform: 'twitter' | 'farcaster' | 'copy', power });
```

### UTM 파라미터 체계
```
?utm_source={platform}&utm_medium={type}&utm_campaign={campaign}

예시:
- CT 시딩: ?utm_source=twitter&utm_medium=organic&utm_campaign=launch_seed
- Farcaster: ?utm_source=farcaster&utm_medium=organic&utm_campaign=launch_seed
- 디스코드: ?utm_source=discord&utm_medium=community&utm_campaign=launch_seed
- 공유 링크: ?utm_source=share&utm_medium=card&utm_campaign=viral
```

### 일간 대시보드 지표
| 지표 | 산출 방법 | 목표 (Day 7) |
|------|----------|-------------|
| UV (유니크 방문) | page_view 유니크 | 500+ |
| 카드 생성 수 | card_generated 카운트 | 200+ |
| 전환율 | 생성/방문 | 40%+ |
| 공유율 | 공유/생성 | 20%+ |
| 바이럴 계수 | 공유 유입/공유 | 0.5+ |
| 채널별 유입 | UTM source 분류 | - |

---

## 성과 데이터 패키징 (Phase 2 보고용)

### 필수 포함 항목
```markdown
## Eth·RPG Phase 2 성과 보고

### 핵심 지표
- 총 방문자: {n}명
- 카드 생성: {n}건
- 공유 클릭: {n}회
- 외부 유저 비율: {n}% (Tokamak 내부 제외)

### 채널별 유입
- Crypto Twitter: {n}
- Farcaster: {n}
- Discord/Telegram: {n}
- 공유 링크 (바이럴): {n}

### 유저 피드백 (정성)
- "{피드백 1}"
- "{피드백 2}"
- (스크린샷 첨부)

### 기술 안정성
- 평균 응답 시간: {n}ms
- 에러율: {n}%
- 캐시 히트율: {n}%
```

---

## 런칭 체크리스트 (Day 6)

### 런칭 전
- [ ] 사이트 URL 확정 및 도메인 연결
- [ ] OG 이미지 미리보기 테스트 (Twitter/Farcaster/카카오톡)
- [ ] 샘플 카드 5장 생성 (다양한 직업)
- [ ] 공유 카피 6세트 준비
- [ ] DM 템플릿 한/영 준비
- [ ] 시딩 타겟 20곳 리스트 확정

### 런칭 시
- [ ] CT 첫 포스트 (샘플 카드 + 링크)
- [ ] Farcaster 캐스트
- [ ] 시딩 DM 발송 시작 (10곳/일)
- [ ] 퍼널 이벤트 정상 수집 확인

### 런칭 후 (Day 7)
- [ ] 유입 데이터 확인
- [ ] 핫 이슈/버그 대응
- [ ] 추가 시딩 10곳
- [ ] 성과 데이터 1차 스냅샷
