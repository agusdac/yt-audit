# Audit Performance Optimizations

This document tracks the performance optimizations applied to the run audit flow.

## Overview

The full audit flow (`POST /api/audit`) involves:
1. Fetching videos from YouTube (channels, playlists, video details)
2. Checking links (cache lookups + HTTP requests to external URLs)
3. Fetching high-intent comments (YouTube CommentThreads API)
4. Saving audit history

## Optimizations Applied

### 1. runAudit (server/utils/runAudit.ts)

| Area | Before | After |
|------|--------|-------|
| **Multiple handles** | Sequential `for` loop | `Promise.all(handles.map(...))` - handles processed in parallel |
| **Video details chunks** | Sequential per handle | Batches of 4 chunks in parallel via `Promise.all` |

- Handles are now fetched in parallel (e.g. 2 channels = 2 concurrent flows)
- Video details chunks within each handle run in batches of 4 to respect YouTube API quota

### 2. Link Check (server/service/linkCheckService.ts)

| Area | Before | After |
|------|--------|-------|
| **Cache lookups** | Sequential `for` loop with `await getCachedLinkResult(url)` | `Promise.all(uniqueUrls.map(getCachedLinkResult))` |

- All unique URLs are checked against the cache in parallel
- External URL checks already use `runWithConcurrency` (default 5)

### 3. Comment Fetching (server/api/audit.post.ts)

| Area | Before | After |
|------|--------|-------|
| **fetchCommentsForVideo** | Sequential `for` loop (50 videos one-by-one) | Batches of 5 in parallel via `Promise.all` |

- Up to 5 videos' comments are fetched concurrently
- Failed fetches (e.g. comments disabled) return `[]` and don't block the batch

### 4. Audit History (server/service/auditHistoryService.ts)

| Area | Before | After |
|------|--------|-------|
| **DB inserts** | Sequential `for` loop with `await db.insert(...)` | `Promise.all(rows.map(...))` |

- All handle rows are inserted in parallel

## Logging

Backend logs added for debugging slow audits:

- `[audit] Starting audit for handles: ...`
- `[audit] Fetched N videos for @handle in Xms` (per handle)
- `[audit] Fetched N videos in Xms` (total after runAudit)
- `[audit] Checking N links...` / `Link check done in Xms`
- `[audit] Fetching comments for N videos...` / `Comments fetched in Xms`
- `[audit] Complete in Xms`

## Configuration

- `VIDEO_DETAILS_CONCURRENCY`: 4 (runAudit.ts)
- `COMMENT_CONCURRENCY`: 5 (audit.post.ts)
- `CHECK_LINKS_CONCURRENCY`: 5 via env (linkCheckService.ts)
