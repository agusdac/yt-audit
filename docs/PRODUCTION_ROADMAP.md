# UpScrub Production Roadmap

This document is the single source of truth for making UpScrub production-ready for paying customers. Use it to plan and execute all phases. Ultra (Pro Teams) is deferred to a second version.

---

## Goal

Make UpScrub production-ready within one week. Focus on **Free** and **Pro** tiers only. Target: testers first, then paying customers.

---

## Phase Overview

| Phase | Name | Priority |
|-------|------|----------|
| 1 | Billing and Tier Enforcement | Foundation |
| 2 | Bulk Link Updates | High |
| 3 | Bulk Comment Responses | High |
| 4 | Deferred Score Metrics | Medium |
| 5 | Production Hardening | High |
| 6 | Polish and Launch Prep | High |

---

## Phase 1: Billing and Tier Enforcement

**Why first:** Everything else depends on knowing the user's tier and enforcing limits.

### Deliverables

| Task | Details | Acceptance Criteria |
|------|---------|---------------------|
| Add `subscriptions` table | `userId`, `tier` (free/pro), `customerId`, `subscriptionId`, `currentPeriodEnd`, `auditsUsedThisMonth`, `auditsResetAt` | Schema created, migration applied |
| Default new users to Free | New users get `tier: 'free'` | All new signups are Free |
| Integrate Lemon Squeezy | Products: Free (no price), Pro (monthly/yearly). Webhook for `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled` | Webhook receives events, tier updated in DB |
| Create upgrade flow | `/settings` or `/pricing` with "Upgrade to Pro" CTA, redirect to Lemon Squeezy Checkout | User can upgrade, webhook sets Pro |
| Enforce Free limits | Before audit: `auditsUsedThisMonth < 1` and `auditsResetAt`; cap videos at 10 in `runAudit`; gate scheduled emails, revenue estimates, channel score breakdown, video score, high-intent comments, export by tier | Free users hit limits, see upgrade prompt |
| Enforce Pro limits | Unlimited audits, 200 videos, all features unlocked | Pro users have full access |
| Soft-limit UX | Show "You've used 1/1 audits" with "Upgrade to Pro" when limit hit | Clear upgrade CTA on limit |
| Admin override | Admin can set any user's tier (e.g. for testers) | Admin panel can override tier |

**Note:** Investigate Lemon Squeezy vs Stripe. Lemon Squeezy offers Merchant of Record (MoR) which simplifies tax/compliance.

### Files to Create/Modify

- `server/db/schemas/subscriptions.ts` (new)
- `server/api/lemon-squeezy/webhook.post.ts` (new)
- `server/service/tierService.ts` (new)
- `app/pages/settings.vue` or `app/pages/pricing.vue`
- `server/api/audit.post.ts`
- `server/utils/runAudit.ts`
- `composables/useTier.ts` (new)

### Dependencies

- Lemon Squeezy account and API keys
- Webhook URL configured in Lemon Squeezy dashboard

---

## Phase 2: Bulk Link Updates

**Why:** Creators need to fix dead links across many videos without editing each one in YouTube Studio.

### Deliverables

| Task | Details | Acceptance Criteria |
|------|---------|---------------------|
| Add OAuth scope | Add `https://www.googleapis.com/auth/youtube.force-ssl` to Google OAuth | Existing users must re-auth to grant write scope |
| Implement `videos.update` | `updateVideoDescription(videoId, description, accessToken)` in youtubeService. Use refresh token from `users.refreshToken` | Can update a video description via API |
| Bulk update API | `POST /api/bulk-update-links` body: `{ videoIds: string[], oldUrl: string, newUrl: string }`. For each video: fetch description, replace oldUrl with newUrl, call `videos.update` | API replaces link across selected videos |
| UI | "Bulk replace link" - select videos (from dead links list or video list), preselect old URL, enter new URL, "Apply" with progress indicator | User can bulk replace from UI |
| Rate limiting | YouTube quota: 50 units per `videos.update`. Batch with small delays | No quota exhaustion |

### Files to Create/Modify

- `server/routes/auth/google.get.ts`
- `server/service/youtubeService.ts`
- `server/api/bulk-update-links.post.ts` (new)
- `app/pages/bulk-links.vue` or component in `app/components/` (new)
- `app/components/DeadLinkWatchdog.vue` (add bulk CTA)

### Dependencies

- Phase 1 (tier enforcement) - bulk link update can be Pro-only
- OAuth write scope

---

## Phase 3: Bulk Comment Responses

**Why:** Creators want to reply to multiple high-intent comments with a template without opening each on YouTube.

### Deliverables

| Task | Details | Acceptance Criteria |
|------|---------|---------------------|
| OAuth scope | Same `youtube.force-ssl` as Phase 2 | Already added in Phase 2 |
| Implement `comments.insert` | `replyToComment(parentId, text, accessToken)` in commentService. Requires `snippet.parentId`, `snippet.textOriginal` | Can post a reply via API |
| Check `canReply` | Before replying, ensure `commentThread.canReply` is true. Filter UI to only show replyable comments | Only replyable comments shown |
| Bulk reply API | `POST /api/comments/reply-bulk` body: `{ commentIds: string[], template: string }`. Support `{{author}}` placeholder | API replies to selected comments |
| UI | Multi-select comments, "Reply to selected" opens modal with template input, "Send" triggers bulk API | User can bulk reply from UI |
| Mark as answered | After successful reply, mark in `answeredComments` table | Answered state persists |
| Mark as wrong | Option for users to mark a comment as "wrong" (false positive) so it doesn't get shown or fetched again | Wrong comments hidden, excluded from future fetches |

### Files to Create/Modify

- `server/service/commentService.ts`
- `server/api/comments/reply-bulk.post.ts` (new)
- `server/db/schemas/` - add `wrongComments` or extend `answeredComments` for wrong flag
- `app/pages/comments.vue`

### Dependencies

- Phase 1 (tier enforcement) - bulk reply can be Pro-only
- OAuth write scope (Phase 2)

---

## Phase 4: Deferred Score Metrics

**Channel score** (from [CHANNEL_SCORE_DATA_SOURCES.md](score/CHANNEL_SCORE_DATA_SOURCES.md)):

| Metric | Status | Action |
|--------|--------|--------|
| Homepage layout | No API | Document as "Not available" - skip |
| Video watermark | Watermarks API + OAuth | Research; add if feasible within week, else keep deferred |
| Default avatar | No reliable detection | Skip - document as future |

**Video score** (from [VIDEO_SCORE_DATA_SOURCES.md](score/VIDEO_SCORE_DATA_SOURCES.md)):

| Metric | Status | Action |
|--------|--------|--------|
| Custom captions | `captions.list` + OAuth | Call `captions.list`, check for non-ASR tracks. 10 points if custom |
| Pinned comment | `commentThreads` | Research pinned detection; add if feasible |

### Files to Create/Modify

- `utils/channelScore.ts`
- `utils/videoScore.ts`
- `server/service/youtubeService.ts` (new captions + comment methods)
- Update score docs

---

## Phase 5: Production Hardening

| Area | Tasks |
|------|-------|
| **Privacy & Legal** | Add `/privacy` page. Add `/terms` if required. GDPR-friendly data handling |
| **Error handling** | Consistent error boundaries, user-friendly messages. Log server errors (consider Sentry) |
| **Monitoring** | Health check (`/api/health` exists). Add uptime/monitoring for production |
| **Rate limits** | Per-user rate limits for bulk operations |
| **Onboarding** | Post-signup tooltip or modal: "Run your first audit" |
| **Upgrade prompts** | When Free user hits limit or tries Pro feature: modal with "Upgrade to Pro" CTA |
| **Support** | Contact email or support link in footer/settings |

---

## Phase 6: Polish and Launch Prep

| Task | Details |
|------|---------|
| Pricing page | Update `LandingPricing.vue` with real Pro price and Lemon Squeezy Checkout link |
| Settings billing section | Show current plan, "Manage subscription" (Lemon Squeezy customer portal), upgrade CTA for Free |
| Tester onboarding | Document: Lemon Squeezy test mode, invite codes, or manual tier override |
| Final QA | Test Free limits, Pro unlock, bulk link update, bulk comment reply, score metrics |

---

## Dependencies and Order

```
Phase 1 (Billing) --> Phase 2 (Bulk Links)
Phase 1 (Billing) --> Phase 3 (Bulk Comments)
Phase 2 (OAuth scope) --> Phase 3 (same scope)
Phase 2, 3 --> Phase 5 (Hardening)
Phase 4 --> Phase 5
Phase 5 --> Phase 6 (Polish)
```

**Recommended order:** Phase 1 first, then Phase 2 and 3 in parallel, then Phase 4, 5, 6.

---

## Week Plan (Suggested)

| Day | Focus |
|-----|-------|
| Mon | Phase 1: Lemon Squeezy setup, subscriptions table, tier service, enforce limits in audit |
| Tue | Phase 1: Upgrade flow, settings billing. Phase 2: OAuth scope, youtubeService.updateVideoDescription |
| Wed | Phase 2: Bulk link API + UI. Phase 3: Bulk comment API |
| Thu | Phase 3: Bulk comment UI. Phase 4: Custom captions, pinned comment (if feasible) |
| Fri | Phase 5: Privacy page, error handling, upgrade prompts. Phase 6: Pricing page, QA |

---

## Out of Scope (Second Version)

- **Ultra (Pro Teams):** Team seats, shared channels, per-team audit history
- **Homepage layout** score (no API)
- **Video watermark** score (complex API)
- **Default avatar** penalty (no reliable detection)

---

## Acceptance Criteria Summary

- [ ] Free users: 1 audit/month, 10 videos, no scheduled emails, no revenue estimates, basic channel score, no video score, no high-intent comments, basic export only
- [ ] Pro users: Unlimited audits, 200 videos, all features unlocked
- [ ] Admin can override user tier
- [ ] Bulk link update works for selected videos
- [ ] Bulk comment reply works with template and `{{author}}` placeholder
- [ ] "Mark as wrong" hides false-positive comments
- [ ] Custom captions and pinned comment in score (if feasible)
- [ ] Privacy page exists
- [ ] Upgrade prompts shown when Free user hits limits
- [ ] Pricing page links to Lemon Squeezy Checkout
