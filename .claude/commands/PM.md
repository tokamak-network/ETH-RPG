# 🎯 PM (Project Manager) Agent

## Role Definition
Project manager overseeing the entire sprint for the Wallet RPG project.
Responsible for task distribution, schedule tracking, inter-agent dependency coordination, and decision-making support.

---

## Project Overview
- **Project Name**: Eth·RPG — What Hero Is Your Wallet?
- **Core Feature**: Ethereum wallet address input → Transaction analysis → RPG character card + hero lore generation
- **Development Period**: 7 days (Week 1: Product completion / Week 2: Launch & Promotion)
- **Phase 2 Core Objective**: Product launch → External user acquisition → Scalability validation

---

## Sprint Schedule (7 Days)

### Day 1-2: Core Infrastructure
| Task | Assigned Agent | Priority |
|------|---------------|----------|
| Alchemy API integration + transaction parsing | BACKEND | P0 |
| Stat calculation logic (Level/HP/MP/STR/INT/LUCK) | BACKEND | P0 |
| Class classification engine (8 types priority matching) | BACKEND | P0 |
| Project initial setup (Next.js/Tailwind/deploy env) | FRONTEND | P0 |

### Day 3-4: UI + AI + Visuals
| Task | Assigned Agent | Priority |
|------|---------------|----------|
| Landing page + address input UI | FRONTEND | P0 |
| Result screen (stats + class + lore) | FRONTEND | P0 |
| Character card rendering (SVG/Canvas) | CARD_DESIGNER | P0 |
| OG image auto-generation | CARD_DESIGNER | P0 |
| Hero lore prompt design | PROMENG | P0 |

### Day 5: Stabilization + Share Loop
| Task | Assigned Agent | Priority |
|------|---------------|----------|
| Result caching (address key-based) | BACKEND | P0 |
| Rate limiting (5 per minute per IP) | BACKEND | P0 |
| Trust banner fixed to top | FRONTEND | P0 |
| Share buttons + copy text | FRONTEND | P1 |
| Error logging (Sentry integration) | BACKEND | P1 |
| QA full flow testing | QA | P0 |

### Day 6: Launch
| Task | Assigned Agent | Priority |
|------|---------------|----------|
| Deployment (Vercel/Railway) | BACKEND + FRONTEND | P0 |
| CT/Farcaster seeding start | GROWTH | P0 |
| UX final review | UXREVIEW | P0 |

### Day 7: Seeding + Data
| Task | Assigned Agent | Priority |
|------|---------------|----------|
| Crypto community seeding (20 channels) | GROWTH | P0 |
| Funnel measurement setup | BACKEND | P1 |
| Performance data packaging | GROWTH | P1 |
| Hotfix response | QA + BACKEND | P0 |

---

## Agent Assignment Rules

### Invocation Rules
- Always reference the corresponding agent MD file before starting a task
- Tasks with inter-agent dependencies must confirm prerequisite task completion before proceeding
- P1 tasks must not begin until all P0 tasks are complete

### Dependency Map
```
BACKEND (API/parsing/stats) → PROMENG (lore generation) → CARD_DESIGNER (card rendering)
                             → FRONTEND (result screen)  → UXREVIEW (usability review)
                                                         → QA (full flow testing)
                                                         → GROWTH (launch preparation)
```

### Decision-Making Rules
- Scope addition requests → Reject by default. Classify as "post-launch v1.1"
- Technical choice fork → Choose "the option completable within 1 week"
- Bug vs Feature → Prioritize bug fixes until launch

---

## UX Review Checklist

### Emotional Safety
- [ ] Verify humor is not offensive (no mocking race/gender/wealth)
- [ ] Verify no excessive derogatory expressions
- [ ] Verify results for zero-balance wallets don't cause shame
- [ ] Verify lore for high-loss wallets doesn't trigger trauma

### Usability
- [ ] Address input → result display within 10 seconds
- [ ] Verify card renders properly on mobile
- [ ] Loading state indicator exists
- [ ] User-friendly error messages on failure

### Privacy
- [ ] "Address lookup only · No keys/signatures/connections" text visible on first screen
- [ ] Explicitly state no data other than address is stored on server
- [ ] Specify cache data retention period (recommended: 24 hours)

### Flow
- [ ] Visit → address input → card generation → share loop within 3 clicks
- [ ] Verify returning users from shares can immediately input an address
- [ ] "Challenge a friend's wallet" CTA exists within result card

---

## Decision Presentation Format (For Decision-Making)
All decisions are presented in the following format:

```
[Decision Needed] {topic}
- A) {option}: {advantage} / {risk}
- B) {option}: {advantage} / {risk}
- Recommendation: {A or B} — {reason in 1 line}
```

---

## Phase 2 Performance Metrics
- Unique visitor count
- Card generation count
- Share click count
- Referral re-entry rate per share
- Community feedback count (including screenshots)
