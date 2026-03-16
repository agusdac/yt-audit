# Channel Metadata Score — Data Sources

This document maps each metric in the channel score to its data source, calculation logic, and limitations.

## Formula

- **Channel Setup Score** = sum of 8 metrics (max 100, scaled from 75 computable points)
- **Recent Content Score** = average of last 10 video scores (max 100)
- **Global Channel Score** = (Channel Setup / 2) + (Recent Content / 2) - Channel Penalties

## Setup Metrics (Positive)

| Metric                | Points | Data Source                                                       | Why it matters                                                                 | Limitations                                      |
| --------------------- | ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Description SEO       | 20     | `snippet.description`                                             | Channel description gets indexed by Google; keyword-rich About helps your page rank. | Length threshold (300 chars) is heuristic         |
| Homepage layout       | 20     | **Deferred**                                                       | Curated playlists turn casual visitors into binge-watchers.                    | No direct API for shelves; document as future     |
| Trailer / Featured    | 20     | `brandingSettings.channel.unsubscribedTrailer`, `brandingSettings.watch.featuredPlaylistId` | Auto-playing a video when someone visits is the highest-converting tool for new subscribers. | Either set passes                                  |
| Channel handle        | 10     | `snippet.customUrl`                                                | Handles are essential for tagging, Shorts discovery, and brand identity.       | None                                             |
| Video watermark       | 10     | **Deferred**                                                       | Subscribe button on every video drives passive subscriptions.                  | Requires watermarks API + OAuth                   |
| Visual branding       | 10     | `snippet.thumbnails.default`, `brandingSettings.image.bannerExternalUrl` | Missing banner or avatar signals abandoned or amateur channel to viewers and sponsors. | Both avatar and banner required                   |
| Channel keywords      | 5      | `brandingSettings.channel.keywords`                                     | Keywords help YouTube surface your channel in search and recommendations.              | None                                             |
| Business & social links | 10   | `snippet.description` (regex for email, `extractUrls` for external) | Missing contact means missing brand deals; missing social links traps audience on YouTube. | YouTube Data API v3 does not expose the "More Info" panel links; we use description only. Email regex may miss edge cases. |

## Penalties

| Penalty     | Points | Data Source                                                        | Why it matters                                      |
| ----------- | ------ | ------------------------------------------------------------------ | --------------------------------------------------- |
| Ghost town  | -15    | `contentDetails` + playlist to get latest video date               | No public video in 90 days—algorithm may throttle reach. |
| Dead link   | -10    | `linkResults` from link check on channel description URLs          | Dead links on channel profile hurt sponsor credibility. |
| Default avatar | -10 | **Deferred**                                                       | Default letter avatar kills credibility.            | No reliable API detection; requires further research |
| Missing contact | -5  | `snippet.description` (regex for email)                             | No business email—sponsors cannot contact you.      | Regex only; no structured link parsing            |

## Data Flow

```
YouTube API (channels.list) part=snippet,brandingSettings,contentDetails,statistics
  ├── snippet.description → description SEO, business links, missing contact
  ├── snippet.customUrl → channel handle
  ├── snippet.thumbnails.default → visual branding
  └── brandingSettings → trailer/featured, banner image, channel keywords

Link check service (on channel description URLs) → linkResults
  └── category 'dead' → dead link penalty

getChannelVideoIds (last 10) → video IDs
  └── getVideoDetails (batch) → calculateVideoScore for each
  └── recentContentScore = average of 10 scores

contentDetails + playlist → latest video publishedAt
  └── ghost town penalty (no video in 90 days)
```

## Deferred Metrics

- **Homepage layout & shelves**: No direct API for channel homepage shelves. Plan: add when YouTube exposes shelves or similar data.
- **Video watermark**: Requires watermarks API and possibly OAuth. Plan: add when watermark check is needed.
- **Default avatar penalty**: Requires comparing thumbnail to default pattern; no reliable detection from API yet. Plan: add when detection method is available.

## Scaling

Deferred metrics (homepage layout, video watermark) do not block reaching 100. Raw setup score is scaled by `(100/75)` so that the 75 computable points map to 100.
