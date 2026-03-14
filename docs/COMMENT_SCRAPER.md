# Comment Scraper

## Purpose

The comment scraper fetches comments from a creator's YouTube videos and detects **purchase-intent** phrases. These are comments that ask where to buy, request discount codes, or otherwise indicate the viewer might become a customer. Surfacing them helps creators respond quickly and convert leads.

## Architecture

```
Client (store.fetchComments)
  → POST /api/comments.fetch { videos: [{ id, title }] }
  → Server checks comment_cache (userId + handlesHash)
  → Cache hit: return cached high-intent comments
  → Cache miss: for each video, call commentThreads.list
  → Run detectPurchaseIntent(text) on each comment
  → Cache results, return to client
```

## Components

- **commentService.ts** — `fetchCommentsForVideo(videoId, videoTitle, ytApiKey)`, `detectPurchaseIntent(text)`
- **commentCacheService.ts** — `getCachedComments`, `setCachedComments` (24h TTL)
- **comment_cache** table — `userId`, `handlesHash`, `comments` (jsonb), `cachedAt`
- **config/purchase-intent-keywords.json** — List of phrases to match (case-insensitive)

## Keyword Config

Edit `config/purchase-intent-keywords.json` to add or remove phrases. Examples:

- "where can i buy"
- "discount code"
- "promo code"
- "get your course"
- "where's the link"

## YouTube API Quota

- `commentThreads.list` costs **1 unit per request**
- Default: 10,000 units/day
- Each video may need multiple pages (100 comments per page)
- `COMMENTS_FETCH_MAX_VIDEOS` (default 50) limits how many videos are scanned per fetch
- 50 videos × ~2 pages avg ≈ 100 units per full fetch

## Future Improvements

- Reply tracking (mark comments as answered)
- Sentiment or intent scoring
- Filters by video, date, keyword
- Scheduled comment scans
- Integration with YouTube Studio API for reply actions
