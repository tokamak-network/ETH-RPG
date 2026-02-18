# ETH-RPG LLM Model Benchmark Report

> Test date: 2026-02-18
> Proxy: LiteLLM (`https://api.ai.tokamak.network`)
> Purpose: RPG hero lore generation (short lore 80 chars, long lore 400 chars)

---

## 1. Models Tested (14 total)

| Model | Type | Test Result |
|-------|:---:|:---:|
| qwen3-80b-next | Non-reasoning | **Selected as primary model** |
| deepseek-v3.2 | Non-reasoning | **Selected as fallback model** |
| qwen3-235b | Non-reasoning | Candidate |
| qwen3-coder-flash | Non-reasoning | Partial defects |
| deepseek-chat | Non-reasoning | Candidate |
| gpt-5.2-codex | Non-reasoning | Candidate |
| gemini-3-flash | Non-reasoning | Slow |
| gemini-3-pro | Non-reasoning | Very slow |
| grok-4-1-fast-non-reasoning | Non-reasoning | Exceeded char limit |
| minimax-m2.5 | Non-reasoning (defective) | Excluded |
| deepseek-reasoner | Reasoning | Excluded |
| glm-4.7 | Reasoning | Excluded |
| grok-4-1-fast-reasoning | Reasoning | Not tested |
| gpt-5.2-pro | Non-reasoning | Not tested |

---

## 2. Reasoning Model Exclusion Rationale

### deepseek-reasoner

- `content` field always returns empty string
- Actual output exists in `reasoning_content` field
- `finish_reason: length` — `max_tokens` fully consumed by reasoning tokens, no answer generated
- Reasoning tokens are also billed, making it cost-inefficient

### glm-4.7

- Same structural issue as deepseek-reasoner
- `reasoning_content` outputs only analysis process in English
- `content` field always empty string

### Common Cause

Reasoning models split tokens into `reasoning_tokens` + `content_tokens`. With `max_tokens=100~200`, all tokens are consumed by the thinking process, so no actual answer (`content`) is generated. Lore generation (creative writing) is a task that does not require logical reasoning, making non-reasoning models the appropriate choice.

---

## 3. Non-Reasoning Model Defect Analysis

### minimax-m2.5 — Excluded

- Response includes `<think>` tags, exposing the thinking process
- Mixed Korean/Chinese/Japanese (e.g., "elite급的实力", "からに他ならない")
- Short lore 336 chars, long lore 870 chars — character limit ignored
- Classified as non-reasoning but effectively operates in thinking mode

### qwen3-coder-flash — Partial Defects

- Chinese mixed into long lore (e.g., "最后", "쓰레드")
- Code generation-specialized model with insufficient literary expressiveness
- Short lore quality is acceptable (52-74 chars)

### grok-4-1-fast-non-reasoning — Exceeded Character Limit

- Run 1 short lore: 91 chars (exceeded)
- Run 2 short lore: 61 chars (compliant)
- Writing style is list-like and rigid, lacking RPG lore feel

### gpt-5.2-codex — Unstable

- Test 1: Short lore HTTP 500 error (max_output_tokens parameter issue)
- Test 2: Short lore succeeded (71-84 chars)
- Test 3: Short lore 100 chars (exceeded), speed 12s (slow)
- Response quality is high but stability and speed vary

### gemini-3-flash — Speed Issue

- Short lore: 4-9s
- Long lore: 7-15s
- Quality is excellent but unsuitable from user wait time perspective

### gemini-3-pro — Extremely Slow

- Short lore: 16-55s
- Long lore: 8-9s
- Sentences truncated in short lore (incomplete responses)
- Latency at production-unusable levels

---

## 4. Non-Reasoning Model Performance Comparison

### Short Lore (target: 80 chars or less)

| Model | Run 1 | Run 2 | Speed (avg) | Char Limit Compliance |
|-------|:---:|:---:|:---:|:---:|
| **qwen3-80b-next** | 80 chars | 78 chars | **957ms** | Exact |
| qwen3-235b | 71 chars | 66 chars | 1,471ms | Compliant |
| qwen3-coder-flash | 52 chars | 74 chars | 1,113ms | Compliant |
| deepseek-v3.2 | 69 chars | 69 chars | 1,201ms | Compliant |
| deepseek-chat | 69 chars | 65 chars | 2,143ms | Compliant |
| grok-4-1-fast | 91 chars | 61 chars | 1,455ms | Unstable |
| gemini-3-flash | 83 chars | 70 chars | 6,704ms | Unstable |
| gemini-3-pro | 56 chars | 73 chars | 36,033ms | Compliant (slow) |
| gpt-5.2-codex | 84 chars | 100 chars | 7,608ms | Unstable |
| minimax-m2.5 | 336 chars | 356 chars | 3,169ms | Non-compliant |

### Long Lore (target: 400 chars or less)

| Model | Run 1 | Run 2 | Speed (avg) | Quality |
|-------|:---:|:---:|:---:|:---:|
| **qwen3-80b-next** | 237 chars | 227 chars | **1,530ms** | Excellent |
| qwen3-235b | 248 chars | 249 chars | 3,862ms | Excellent |
| qwen3-coder-flash | 209 chars | 268 chars | 2,827ms | Chinese mixed in |
| deepseek-v3.2 | 283 chars | 251 chars | 3,450ms | Excellent |
| deepseek-chat | 220 chars | 215 chars | 4,140ms | Good |
| grok-4-1-fast | 212 chars | 217 chars | 2,812ms | Good (rigid) |
| gemini-3-flash | 238 chars | 302 chars | 11,407ms | Excellent (slow) |
| gemini-3-pro | 295 chars | 298 chars | 8,498ms | Excellent (slow) |
| gpt-5.2-codex | 258 chars | 192 chars | 5,085ms | Excellent |
| minimax-m2.5 | 849 chars | 870 chars | 7,241ms | Non-compliant |

---

## 5. Long Lore Quality Samples (Elder Wizard)

### qwen3-80b-next (Primary Model)

> O ancient wizard, he who chanted his first spell in 2017 was one who endured through time. He quietly gathered relics during the Age of the Great Bull Run, and did not close his eyes even when the Lunar Kingdom fell. Even amid the Betrayal of the Exchange Kingdom, his staff never wavered, and when the Ritual of the Great Merge arose, he alone proved to be the true heir of ancient magic. All 45 of his spells were prophecies for eternity, and his wallet is not merely treasure — it is a sanctuary preserving the breath of magic the world has forgotten.

### deepseek-v3.2 (Fallback Model)

> The ancient wizard stood unshaken by the chaos of the Decentralization Liberation War, guided by old wisdom, and even when the Age of the Great Bull Run dawned and many rejoiced, he remained in his hermit's tower. Amid the fall of the Lunar Kingdom and the Exchange Kingdom's betrayal, he proved the laws of time with merely 45 incantations. Even on the day the Ritual of the Great Merge shook the world, he responded with silence, still holding the primordial covenant in his heart, standing firm as a mountain.

### qwen3-235b

> The ancient wizard, one who had been silent for over seven years in the crevices of time, finally raised his hand. His journey, which began in the ruins of the Decentralization Liberation War, passed through the Age of the Great Bull Run and remained unshaken even amid the collapse of the Lunar Kingdom. Even during the Betrayal of the Exchange Kingdom, he refused the chains of gold and quietly accumulated his mana. On the day the Ritual of the Great Merge shook the cosmos, his staff redefined the flow of ether and opened the gates to a new era.

### gemini-3-pro

> After first raising his staff amid the gunfire of the 'Decentralization Liberation War,' he was a cautious hermit who chanted only forty-five spells over more than seven long years. When the world cheered during the 'Age of the Great Bull Run' and screamed through the 'Collapse of the Lunar Kingdom' and the 'Betrayal of the Exchange Kingdom,' he endured eons without so much as stirring in his Tower of Silence. Even the upheavals of the 'Betrayal of the Exchange Kingdom' and the 'Ritual of the Great Merge' were but momentary ripples to him, and his deep patience has now become ancient wisdom that none can approach, shining for eternity.

### gpt-5.2-codex

> An ancient wizard, he inscribed his first spell 7 years and 8 months ago and awakened in the flames of the Decentralization Liberation War. Keeping his vow of long-term holding with only a handful of trades, he amplified his mana during the Age of the Great Bull Run and stood unshaken through the Collapse of the Lunar Kingdom and the Betrayal of the Exchange Kingdom. Finally, at the Ritual of the Great Merge, his staff sealed the rifts of the world, and through quiet endurance, he became legend.

---

## 6. Final Selection

| Role | Model | Selection Rationale |
|------|-------|---------------------|
| **Primary** | `qwen3-80b-next` | Fastest speed (sub-second), exact char limit compliance, excellent Korean quality, natural RPG writing style |
| **Fallback** | `deepseek-v3.2` | Stable responses, excellent poetic expression, good speed (1-3s) |

### Fallback Chain

```
qwen3-80b-next → deepseek-v3.2 → Anthropic Direct → template fallback
```

### Environment Variables (.env.local)

```env
LITELLM_MODEL=qwen3-80b-next
LITELLM_FALLBACK_MODEL=deepseek-v3.2
```

---

## 7. Future Considerations

- **qwen3-235b**: Quality on par with qwen3-80b-next but 2-4x slower. Could be considered for quality-priority mode
- **gemini-3-pro**: Top-tier literary expressiveness but latency (8-55s) unsuitable for production. Could be considered for batch generation
- **gpt-5.2-codex**: Revisit as fallback candidate if response stability improves
- **minimax-m2.5**: Could be revisited with `<think>` tag filtering + Chinese mixing prevention, but has fundamental quality issues
