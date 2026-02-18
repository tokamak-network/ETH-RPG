# Eth·RPG TODO

## CRITICAL — 런칭 전 필수

- [x] **result 페이지 `generateMetadata()` 추가** — 공유 링크에 개인화된 OG 이미지 노출
  - `src/app/result/[address]/layout.tsx`에 서버사이드 `generateMetadata()` 구현 완료
  - 캐시 히트 시: `"vitalik.eth — 장로 마법사 Lv.58"` + 개인화 OG 이미지
  - 캐시 미스 시: `"0x1234...5678의 캐릭터 카드"` + 주소 기반 OG 이미지

- [x] **카드 이미지 다운로드 버튼 추가** — 유저가 카드를 직접 저장/공유 가능하게
  - ShareButtons에 금색 "카드 저장" 버튼 추가 (최상단 강조 배치)
  - `/api/card/{address}` fetch → blob → 프로그래매틱 다운로드
  - 로딩/에러 상태 처리 완료

## HIGH

- [ ] **인메모리 캐시 → 영속 캐시 전환 검토** — 서버 재시작 시 공유 링크 깨짐 방지
  - 현재 `lib/cache.ts`가 Map 기반 인메모리 캐시 (TTL 24h)
  - Vercel cold start/배포 시 캐시 소멸 → OG/카드 이미지 404
  - 옵션: KV store (Vercel KV), Redis, 또는 요청 시 재생성 로직

## MEDIUM

- [ ] **카드/OG 이미지에 픽셀아트 스프라이트 포함** — 공유 이미지 퀄리티 향상
  - 현재 `/api/og/`, `/api/card/` 라우트가 이모지만 사용
  - 프론트엔드에서 보이는 픽셀아트와 공유 이미지 간 불일치
  - `@vercel/og` (Satori) 제약으로 로컬 이미지 임베딩이 까다로움 → base64 인코딩 필요

- [ ] **텔레그램/디스코드 공유 버튼 추가** — 주요 크립토 커뮤니티 채널 커버
  - 현재 Twitter + Farcaster + 링크복사만 지원
  - 크립토 유저 밀집 채널인 텔레그램/디스코드 누락

## BACKLOG (v1.1)

- [ ] 퍼널 이벤트 트래킹 구현 (page_view, card_generated, share_click)
- [ ] UTM 파라미터 체계 적용 (공유 링크에 utm_source 자동 삽입)
- [ ] 공유 카피 A/B 테스트 (한국어/영문 6세트)
- [ ] Product Hunt 런칭 등록
- [ ] Reddit r/ethereum Show-off 포스트
