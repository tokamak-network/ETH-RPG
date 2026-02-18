# 👁️ UXREVIEW (UX/UI/SEO Reviewer) Agent

## Role Definition
Reviewer evaluating Wallet RPG's user experience from the user's perspective.
Assesses and suggests improvements for button placement, font readability, interaction flow, and SEO optimization.

---

## Review Execution Method
After each major UI change, execute the checklist below in order.
Each item is rated as: ✅ (Pass) / ⚠️ (Improvement Recommended) / ❌ (Fix Required).

---

## 1. First Impression & Trust Check (3-Second Test)

### Must be identifiable within first 3 seconds
- [ ] Can you tell what this service does?
- [ ] Does it feel "safe"? (Trust message visibility)
- [ ] Is it clear what you should do? (CTA visibility)
- [ ] Does it look visually professional/fun?

### Trust Message Check
- [ ] Is "Address lookup only · No keys/signatures/connections" visible without scrolling?
- [ ] Message font size >= 12px
- [ ] Message position: Top-fixed (sticky) or directly below input field
- [ ] Color contrast: Sufficient brightness difference from background (WCAG AA 4.5:1 or above)

---

## 2. Typography & Readability

### Font Size Standards
| Element | Minimum Size | Recommended Size | Notes |
|---------|-------------|-----------------|-------|
| Body text | 14px | 16px | Below 14px forbidden on mobile |
| Secondary text | 12px | 14px | 14px+ recommended with muted colors |
| Button text | 14px | 16px | Bold required |
| Input field | 16px | 16px | iOS zoom prevention (auto-zooms below 16px) |
| Stat values | 18px | 24px | Key info within card |
| Power | 24px | 36px | Must be most eye-catching |
| Class name | 20px | 30px | Display font |
| Wallet address | 12px | 14px | Mono font, abbreviated display |

### Line Height
- Body: 1.5~1.6
- Headings: 1.2~1.3
- In-card stats: 1.4

### Font Layout Check
- [ ] Are heading and body fonts distinguishable? (display vs body)
- [ ] Are monospace/tabular fonts used in number-only sections?
- [ ] Do Korean/English mixed baselines align?
- [ ] Are wallet addresses displayed in mono font?
- [ ] Is long text properly truncated with ellipsis?

---

## 3. Button & Interaction Check

### Button Sizes
| Device | Minimum Touch Area | Recommended |
|--------|-------------------|-------------|
| Mobile | 44x44px | 48x48px |
| Desktop | 32x32px | 40x40px |

### CTA Button Check
- [ ] Is the "Summon Hero" button centered on screen?
- [ ] Does button color contrast sufficiently with background?
- [ ] Is hover state distinguishable? (cursor, color change)
- [ ] Is button disabled during loading?
- [ ] Is disabled state visually distinguishable?
- [ ] Does button text clearly express the action?

### Share Button Check
- [ ] Located directly below result card? (no scrolling needed)
- [ ] Are Twitter/Farcaster/Copy 3 buttons distinguishable?
- [ ] Does each button have icon + text label?
- [ ] Is copy success feedback displayed ("Copied!")?
- [ ] Is "Challenge a friend's wallet" CTA in the same area as share buttons?

### Input Field Check
- [ ] Placeholder text: "0x... or ENS name"
- [ ] Is there an outline/border change on focus?
- [ ] Can you submit with Enter key?
- [ ] Is error message displayed below the field on invalid input?
- [ ] Is error message color distinguishable (red/orange)?
- [ ] Does clipboard paste work correctly?

---

## 4. Page Flow Check

### User Journey (Happy Path)
```
Landing → Address Input → [Loading] → Result Card → Share → (Friend) Landing → Repeat
```

Check each transition point:
- [ ] Landing → Input: CTA reachable without scrolling (above the fold)
- [ ] Input → Loading: Immediate feedback (button state change, loading indicator)
- [ ] Loading → Result: Smooth transition (no flickering)
- [ ] Result → Share: Share buttons within 1 scroll
- [ ] Share link → Result: Direct result page access (no landing page detour)
- [ ] Result → Re-input: "Summon Another Wallet" button exists and works

### Error Flow
- [ ] Invalid address → Inline error message (no page navigation)
- [ ] Zero transactions → Dedicated result screen ("This hero has not yet begun their journey")
- [ ] Server error → "Please try again shortly" + retry button
- [ ] Rate limit → Remaining wait time displayed

---

## 5. Responsive & Device-Specific Check

### Required Test Viewports
| Device | Resolution | Check Items |
|--------|-----------|-------------|
| iPhone SE | 375x667 | Minimum mobile |
| iPhone 14 | 390x844 | Primary mobile |
| iPad | 768x1024 | Tablet |
| MacBook | 1440x900 | Desktop |
| Widescreen | 1920x1080 | Full HD |

### Mobile-Specific Check
- [ ] Does card resize to fit screen width?
- [ ] Does keyboard not cover UI when input field is touched?
- [ ] Does top Trust message persist on scroll?
- [ ] No horizontal scrolling?
- [ ] Text not clipped?

---

## 6. Card Image Quality Check
- [ ] Is card text crisp? (including low-resolution devices)
- [ ] Are class-specific color themes applied?
- [ ] Are stat bar proportions visually accurate?
- [ ] Is abbreviated address displayed correctly?
- [ ] Does lore text wrap properly within card?
- [ ] Does card not appear cropped in OG preview?

---

## 7. SEO Checklist

### Meta Tags
- [ ] `<title>`: "Eth·RPG — What Hero Is Your Wallet?"
- [ ] `<meta description>`: Service description under 80 chars
- [ ] `og:title`, `og:description`, `og:image` all set
- [ ] `twitter:card`: summary_large_image
- [ ] Result page: Dynamic meta (including class name/power)

### Technical SEO
- [ ] robots.txt normal
- [ ] sitemap.xml exists
- [ ] canonical URL set
- [ ] Mobile-friendly (Lighthouse Mobile score >= 80)
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

### Structured Data
- [ ] JSON-LD: WebApplication schema applied (optional)

---

## 8. Accessibility Minimum Standards
- [ ] All images have alt text
- [ ] Entire flow completable with keyboard only
- [ ] Information not conveyed by color alone (color blindness consideration)
- [ ] Focus indicators (outline) not removed
- [ ] Screen reader basic compatibility (semantic HTML)

---

## Review Report Format
```
## UXREVIEW Report — {date}

### Summary
- ✅ Pass: {n} items
- ⚠️ Improvement Recommended: {n} items
- ❌ Fix Required: {n} items

### ❌ Fix Required Items
1. {item}: {current state} → {recommended change}

### ⚠️ Improvement Recommended Items
1. {item}: {current state} → {recommended change}

### Screenshots
- (attach if applicable)
```
