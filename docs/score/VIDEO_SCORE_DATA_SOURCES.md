# Video Metadata Score — Data Sources

This document maps each metric in the video score to its data source, calculation logic, and limitations.

## Metrics (Positive)


| Metric                | Points | Data Source                                      | Calculation                                                                                                                                             | Limitations                                      |
| --------------------- | ------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Chapter markers       | 15     | `description`                                    | Regex `(\d{1,2}):(\d{2})` for timestamps. Requires 0:00 or 00:00, 0 timestamps in chronological order for videos <5 min; 2+ for 5–8 min; 3+ for >8 min. | None                                             |
| Title optimization    | 15     | `title`                                          | Length ≤65 chars AND (power word present OR number). Power words: How, Why, Secret, Best, Top, Ultimate, etc.                                           | Power word list is curated; may miss niche terms |
| Above-the-fold hook   | 15     | `description` (first 150 chars), `title`         | Word count ≥20 in first 150 chars AND ≥2 title keywords present.                                                                                        | Heuristic; no NLP                                |
| Custom thumbnail      | 10     | `snippet.thumbnails.maxres`                      | `!!thumbnails?.maxres` — maxres indicates custom or 720p+ upload                                                                                        | maxres can exist for high-res auto-thumbnails    |
| Description SEO depth | 10     | `description` (word count), `duration`           | >200 words for short (<8 min), >400 for long (≥8 min)                                                                                                   | Duration threshold is fixed                      |
| Custom captions       | 10     | **Deferred**                                     | Requires `captions.list` API + OAuth. Returns 0 with "Coming soon."                                                                                     | Not implemented in MVP                           |
| Binge-loop link       | 10     | `description` + `extractUrls`, `channelVideoIds` | youtube.com/youtu.be link whose video ID is in `channelVideoIds`                                                                                        | Needs channel uploads; capped at 500 IDs         |
| Pinned comment        | 10     | **Deferred**                                     | Requires `commentThreads` API + channel match. Returns 0 with "Coming soon."                                                                            | Not implemented in MVP                           |
| HD quality            | 5      | `contentDetails.definition`                      | `definition === 'hd'`                                                                                                                                   | API may misreport for some uploads               |


## Penalties


| Penalty     | Points | Data Source                                                        | Calculation                                        | Limitations                 |
| ----------- | ------ | ------------------------------------------------------------------ | -------------------------------------------------- | --------------------------- |
| Click-away  | -10    | First 150 chars of `description`, `links` (from `getLinksToCheck`) | External (non-YouTube) link in first 150 chars     | URL matching is positional  |
| Broken link | -10    | `linkResults` (from link check service)                            | Any link with `category === 'dead'` for this video | Depends on link check cache |
| Link spam   | -5     | `links` (from `getLinksToCheck`)                                   | External link count > 7                            | Threshold is fixed          |


## Data Flow

```
YouTube API (videos.list) → snippet, contentDetails
  ├── title, description → chapters, title opt, above-fold, description SEO, binge-loop
  ├── thumbnails.maxres → custom thumbnail
  └── contentDetails.definition → HD quality

Link check service → linkResults
  ├── category 'dead' → broken link penalty
  └── (with links) → click-away penalty

getLinksToCheck(links) → external URLs
  └── count > 7 → link spam penalty

getChannelVideoIds(handle) → channelVideoIds
  └── binge-loop check
```

## Deferred Metrics

- **Custom captions**: `captions.list` requires the video owner's OAuth or appropriate scope. Plan: add when caption check is needed.
- **Pinned comment**: `commentThreads` returns comments; "pinned" is not always exposed. Plan: add when we can reliably detect channel-pinned top comment.

