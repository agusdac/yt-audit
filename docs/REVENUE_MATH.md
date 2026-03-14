# Revenue Loss Math

This document describes the formulas and assumptions used to estimate revenue loss from dead links in video descriptions.

## Monthly Views Estimation

Videos receive most of their views in the first weeks after publish. Older "evergreen" content sustains a small percentage of total views per month.

### Formula

```
if (daysSincePublish < 30):
  monthlyViews = totalViews
else:
  monthlyViews = totalViews × EVERGREEN_RATE
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `NEW_VIDEO_DAYS` | 30 | Videos newer than this use total views as monthly views |
| `EVERGREEN_RATE` | 0.04 (4%) | For older videos, ~4% of total views per month (research: 3–5% for evergreen content) |

### Rationale

- **New videos**: Most views happen in the first 30 days; using totalViews approximates "this month's" impact.
- **Older videos**: Most YouTube content decays rapidly. Evergreen content (tutorials, how-tos) sustains roughly 3–5% of total views per month. We use 4% as a conservative estimate.

---

## Revenue by Link Type

Different link types have different revenue models and conversion rates.

### Sponsor Links

**Model**: CPM (cost per 1000 views) — brand deal value.

```
revenueLoss = (monthlyViews / 1000) × CPM_SPONSOR
```

| Constant | Value | Source |
|----------|-------|--------|
| `CPM_SPONSOR` | 25 | $15–80 range; $25 is a mid-range estimate |

### Affiliate Links

**Model**: CTR × conversion rate × average commission per conversion.

```
estimatedClicks = monthlyViews × CTR_AFFILIATE
conversions = estimatedClicks × CONV_AFFILIATE
revenueLoss = conversions × AVG_COMMISSION
```

Simplified: `revenuePer1000Views = 1000 × 0.015 × 0.05 × 5 ≈ 3.75`

| Constant | Value | Source |
|----------|-------|--------|
| `CTR_AFFILIATE` | 0.015 (1.5%) | 0.5–3% for description links; 1.5% when actively mentioned |
| `CONV_AFFILIATE` | 0.05 (5%) | 2–15% depending on program; 5% is typical |
| `AVG_COMMISSION` | 5 | $ per conversion (varies by niche) |

### Merch Links

**Model**: Similar to affiliate but lower CTR and conversion.

```
revenuePer1000Views = AFFILIATE_PER_1000 × MERCH_MULTIPLIER
```

| Constant | Value |
|----------|-------|
| `MERCH_MULTIPLIER` | 0.5 |

### Social With Revenue (Patreon, Ko-fi, etc.)

**Model**: Slightly higher CTR than affiliate, but lower conversion.

```
revenuePer1000Views = AFFILIATE_PER_1000 × SOCIAL_REVENUE_MULTIPLIER
```

| Constant | Value |
|----------|-------|
| `SOCIAL_REVENUE_MULTIPLIER` | 0.8 |

### Other Links

**Model**: Conservative; 0.2× sponsor CPM.

```
revenuePer1000Views = CPM_SPONSOR × 0.2
```

| Constant | Value |
|----------|-------|
| `OTHER_CPM_MULTIPLIER` | 0.2 |

---

## Link Type Classification

Link type is determined by domain and URL parameters (see [utils/url.ts](../utils/url.ts) and [config/link-domains.json](../config/link-domains.json)):

- **Sponsor**: Known sponsor domains, shorteners, user-defined "my sponsors"
- **Affiliate**: Affiliate networks (e.g. Rakuten, Impact) or params (`ref=`, `tag=`, `utm_source=`, etc.)
- **Merch**: Merch store domains or `/shop`, `/store`, `/merch` in path
- **SocialWithRevenue**: Patreon, Ko-fi, Buy Me a Coffee, etc.
- **Other**: Everything else that is checked (excludes pure social like Twitter, Instagram)

---

## Tunable Constants

All constants live in [utils/revenue.ts](../utils/revenue.ts). To adjust:

- `NEW_VIDEO_DAYS` — threshold for "new" vs "evergreen"
- `EVERGREEN_RATE` — monthly view rate for older videos
- `CPM_SPONSOR`, `CPM_DEFAULT` — sponsor/brand CPM
- `CTR_AFFILIATE`, `CONV_AFFILIATE`, `AVG_COMMISSION` — affiliate model
- `MERCH_MULTIPLIER`, `SOCIAL_REVENUE_MULTIPLIER`, `OTHER_CPM_MULTIPLIER` — link-type scaling
