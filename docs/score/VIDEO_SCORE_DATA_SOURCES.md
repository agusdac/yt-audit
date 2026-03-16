# Video Metadata Score — Data Sources

This document maps each metric in the video score to its data source, calculation logic, and limitations.

## Metrics (Positive)


| Metric                | Points | Data Source                                      | Why it matters                                                                 | Limitations                                      |
| --------------------- | ------ | ------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Chapter markers       | 15     | `description`                                    | Google Search crawls timestamps for "Key Moments"—opting out costs free traffic. | None                                             |
| Title length          | 10     | `title`                                          | Mobile truncates at 65 chars—longer titles get cut off and hurt CTR.           | None                                             |
| Title boost words     | 5      | `title`                                          | Power words and numbers boost click-through rate.                              | Power word list is curated; may miss niche terms |
| Above-the-fold hook   | 15     | `description` (first 150 chars), `title`         | YouTube uses first 150 chars to understand context and recommend.                | Heuristic; no NLP                                |
| Custom thumbnail      | 10     | `snippet.thumbnails.maxres`                      | Custom thumbnail is baseline for CTR; auto-generated frames rarely convert.     | maxres can exist for high-res auto-thumbnails    |
| Description SEO depth | 10     | `description` (word count), `duration`           | Algorithm needs text to place your video in Suggested feed.                     | Duration threshold is fixed                      |
| Custom captions       | 10     | **Deferred**                                     | Custom captions improve indexing and mobile mute viewing.                      | Not implemented in MVP                           |
| Binge-loop link       | 10     | `description` + `extractUrls`, `channelVideoIds` | YouTube rewards videos that keep viewers on-platform; internal links boost promotion. | Needs channel uploads; capped at 500 IDs         |
| Pinned comment        | 10     | **Deferred**                                     | Pinned comment drives engagement and conversions.                                | Not implemented in MVP                           |
| HD quality            | 5      | `contentDetails.definition`                      | SD signals low production value; algorithm may restrict reach.                  | API may misreport for some uploads               |
| Video tags            | 5      | `snippet.tags`                                   | Tags help YouTube understand and recommend your video.                           | None                                             |


## Penalties


| Penalty     | Points | Data Source                                                        | Why it matters                                      |
| ----------- | ------ | ------------------------------------------------------------------ | --------------------------------------------------- |
| Click-away  | -10    | First 150 chars of `description`, `links` (from `getLinksToCheck`) | External links above fold act as exit ramps; algorithm suppresses. |
| Broken link | -10    | `linkResults` (from link check service)                            | Dead links hurt trust and signal outdated content to crawlers.     |
| Link spam   | -5     | `links` (from `getLinksToCheck`)                                   | Too many links mimics spam; reach can be silently restricted.      |


## Data Flow

```
YouTube API (videos.list) → snippet, contentDetails
  ├── title, description → chapters, title opt, above-fold, description SEO, binge-loop
  ├── thumbnails.maxres → custom thumbnail
  ├── snippet.tags → video tags
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

