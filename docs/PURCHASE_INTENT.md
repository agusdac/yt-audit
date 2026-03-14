# Purchase Intent Detection

## Overview

The comment scraper identifies YouTube comments that express **purchase intent** — viewers asking where to buy, for discount codes, or otherwise indicating they might become customers. Surfacing these helps creators respond quickly and convert leads.

## Current Implementation

**Keyword-based detection** in `server/service/commentService.ts`:

- Uses `config/purchase-intent-keywords.json` — a list of phrases (e.g. "where can i buy", "discount code", "promo code")
- Case-insensitive substring match via `detectPurchaseIntent(text)`
- Simple, fast, no external dependencies

**Limitations:**

- Misses nuanced expressions ("I need this", "take my money")
- Can produce false positives (sarcasm, unrelated context)
- No negation handling ("I don't want to buy")
- Static list requires manual updates

---

## Improvement Options

### 1. Expand Keywords (Short-term)

**Approach:** Add more phrases to `purchase-intent-keywords.json`, optionally add negation filtering.

**Pros:** No infra, instant, zero cost  
**Cons:** Still misses nuance, more phrases can increase false positives

**Implementation:** Extend the JSON config; add a negation pass (e.g. skip if text contains "don't", "not", "never" before the phrase).

---

### 2. Hugging Face RoBERTa (Medium-term)

**Model:** `j-hartmann/purchase-intention-english-roberta-large`

- Fine-tuned on 2,000 annotated social media posts
- Binary classification: purchase intention vs. no purchase intention
- ~95% hold-out accuracy
- Compatible with Hugging Face Inference API

**Pros:** High accuracy, social media trained, no training needed  
**Cons:** Requires HF token, API latency, possible rate limits

**Implementation sketch:**

```ts
// Optional: when DETECT_INTENT_VIA_HF=true and HF_TOKEN set
const res = await $fetch(
  'https://api-inference.huggingface.co/models/j-hartmann/purchase-intention-english-roberta-large',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.hfToken}` },
    body: { inputs: text }
  }
)
// Returns: [{ label: 'yes'|'no', score }]
```

**Config:** `DETECT_INTENT_VIA_HF`, `HF_TOKEN` in runtime config; fallback to keywords when disabled.

---

### 3. OpenAI / Claude API

**Approach:** Few-shot prompt or structured output for intent classification.

**Pros:** Flexible, handles edge cases, no model hosting  
**Cons:** Cost per comment, latency, API dependency

---

### 4. Fine-tune Small Model (Long-term)

**Approach:** Collect creator-labeled comments (intent / no intent), fine-tune a small model (e.g. DistilBERT, TinyBERT) or use Unsloth for efficient fine-tuning.

**Pros:** Domain-specific, offline, no per-request cost  
**Cons:** Needs labeled data, ML pipeline, deployment

---

## Recommended Path

1. **Short-term:** Expand keywords, add basic negation filtering.
2. **Medium-term:** Add optional HF Inference API integration behind `DETECT_INTENT_VIA_HF` and `HF_TOKEN`; fallback to keywords when disabled.
3. **Long-term:** If we collect creator feedback (e.g. "not intent" / "intent" labels), fine-tune a small model for domain-specific accuracy.

---

## References

- [j-hartmann/purchase-intention-english-roberta-large](https://huggingface.co/j-hartmann/purchase-intention-english-roberta-large) — Hugging Face model card
- Hartmann et al. (2021), "The Power of Brand Selfies", Journal of Marketing Research
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference) — Serverless inference
- [@huggingface/inference](https://huggingface.co/docs/huggingface.js/inference/README) — Node.js client
