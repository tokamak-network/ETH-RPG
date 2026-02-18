# 🔍 QA (Quality Assurance) Agent

## Role Definition
QA agent ensuring overall quality of Wallet RPG.
Performs bug severity classification, privacy protection checks, crisis response, and periodic inspections.

---

## P0~P3 Severity Classification

### P0 — Critical (Fix immediately, blocks deployment)
Service is completely unusable or security/privacy incident occurred.
- Main page inaccessible (500 error, blank screen)
- No result generated after address input
- Personal data exposure (data leakage beyond wallet address)
- API key exposure (Alchemy/Anthropic/OpenAI)
- XSS/injection vulnerability discovered
- Another user's cached data returned
- OG image displays wrong address information

### P1 — High (Fix within 24 hours)
Core functionality partially non-functional.
- Specific class never matches
- AI lore returns empty string
- Card image rendering failure (certain browsers)
- Rate limiting not working
- Share link returns 404
- OG image not generating
- Card truncated on mobile display

### P2 — Medium (Fix within sprint)
No usage impact but experience quality degraded.
- Abnormal stat values (level 0, negative power, etc.)
- Lore content mismatches class
- Loading time exceeds 10 seconds (not timeout)
- Share copy button not working
- Font corruption (certain devices)
- UI breaks on dark/light mode toggle

### P3 — Low (Backlog)
Cosmetic/convenience issues.
- Stat bar animation stuttering
- Subtle alignment mismatches
- Margin inconsistencies at specific resolutions
- Typos in loading messages
- Console warning messages

---

## Privacy Exposure Check — 7 Items

All 7 items must be verified before every deployment.

### 1. Input Data Scope Check
- [ ] Verify server receives only a single wallet address (string) field
- [ ] Verify no additional personal info (email, name, beyond IP) is collected
- [ ] Verify unexpected fields in request body are ignored

### 2. Stored Data Scope Check
- [ ] Cache stores only address + result
- [ ] Verify cache auto-deletes after 24h TTL
- [ ] Check if full address is recorded in server logs (masking needed: 0x1234...abcd)

### 3. API Key Security Check
- [ ] Verify Alchemy API key is not included in client bundle
- [ ] Verify Anthropic/OpenAI API keys are used server-side only
- [ ] Verify `.env` file is included in `.gitignore`
- [ ] Verify Vercel environment variables are set without `NEXT_PUBLIC_` prefix

### 4. Response Data Check
- [ ] Verify API response doesn't include raw transaction data
- [ ] Verify response doesn't expose other wallet addresses
- [ ] Verify AI lore doesn't contain actual amounts

### 5. OG Image Check
- [ ] OG image displays abbreviated address only (0x1234...abcd), not full address
- [ ] Verify OG image doesn't include sensitive info like balance

### 6. Error Message Check
- [ ] Verify error responses don't include server internals (stack traces, DB structure, etc.)
- [ ] Verify Sentry transmission data hashes or excludes user IP

### 7. Third-Party Data Transmission Check
- [ ] Verify AI API calls transmit only raw address (no transaction details)
- [ ] Verify analytics events don't include wallet address (hash if present)

---

## Crisis Response Testing — 4 Scenarios

### Scenario 1: API Quota Exceeded
```
Situation: Alchemy Free tier limit exceeded (300 req/s)
Testing:
1. Generate 50 simultaneous requests
2. Verify 429 response
3. Verify "please try again shortly" message displayed to user
4. Verify cached results still return correctly
Response: Confirm rate limit triggers before API quota
```

### Scenario 2: AI Lore Generation Failure
```
Situation: Anthropic/OpenAI API down or timeout
Testing:
1. Change AI API endpoint to invalid URL
2. Verify fallback template lore returns correctly
3. Verify entire card generates without errors
4. Verify error log is recorded in Sentry
Response: Confirm fallback lore quality meets minimum standard
```

### Scenario 3: Malicious Input
```
Situation: XSS/SQL injection attempt in address field
Testing:
1. Input <script>alert('xss')</script>
2. Input ' OR 1=1 --
3. Input very long string (10,000 chars)
4. Input empty string / null / undefined
5. Input valid format but non-existent address
Response: All cases return appropriate error messages, server stability maintained
```

### Scenario 4: Traffic Spike (Viral)
```
Situation: Goes viral on CT → 1000 requests per minute
Testing:
1. Simulate with load testing tool (artillery/k6)
2. Check cache hit rate (popular addresses repeated)
3. Verify rate limiting works correctly
4. Check Vercel serverless cold start impact
Response: Confirm response time < 200ms on cache hit
```

---

## Periodic Inspection Checklist

### Pre-Launch (Day 5-6)
- [ ] Full flow manual test (5+ addresses)
  - Whale wallet (vitalik.eth etc.)
  - New wallet (transactions < 5)
  - Zero transaction wallet
  - NFT-focused wallet
  - DeFi-focused wallet
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] OG image preview testing (Twitter Card Validator, Facebook Debugger)
- [ ] Privacy 7-item full inspection
- [ ] Execute 4 crisis scenarios
- [ ] Trust message display verification
- [ ] Share link → revisit flow verification

### Post-Launch Daily (Day 7+)
- [ ] Check Sentry error logs (new issues)
- [ ] API response time monitoring (average < 5s)
- [ ] Cache hit rate check (target > 30%)
- [ ] Rate limit trigger frequency check
- [ ] Collect user feedback/bug reports

---

## Test Address List (For Manual Testing)
```
# Cover various patterns
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  # vitalik.eth (whale, diverse activity)
0x0000000000000000000000000000000000000000  # Zero address (error handling)
0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B  # Old wallet
# + Add your own test wallets
```
