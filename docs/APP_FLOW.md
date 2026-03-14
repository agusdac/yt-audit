# YT-Audit App Flow

## Overview

YT-Audit is a SaaS for YouTube creators to audit their video descriptions for dead links, expired sponsor codes, and affiliate issues.

## User Flows

### Creator Flow (logged in)

1. **Landing (`/`)** — User sees value prop and "Sign in with Google"
2. **OAuth** — User clicks Sign in, redirects to `/auth/google`, completes Google OAuth with scopes: email, profile, youtube.readonly
3. **Post-login** — Server fetches user's YouTube channels via API, stores in `users` and `linked_channels` tables, sets session, redirects to `/dashboard`
4. **Dashboard (`/dashboard`)** — Sidebar layout with Dashboard, All Videos, Profile. Dashboard shows dead links summary, global score, estimated revenue, fix actions.
5. **All Videos (`/videos`)** — Full video list with filters, link check, export. Link results sync to store for Dashboard.
6. **Audit** — POST `/api/audit` (no body needed; server uses creator's linked channels from DB)
7. **Link check** — Creator clicks "Check links" in All Videos; POST `/api/check-links`; results sync to store

### Admin Flow

1. **Admin login (`/admin/login`)** — Password-based login, sets admin cookie
2. **Admin (`/admin`)** — Redirects to `/admin/audit`
3. **Run Audit (`/admin/audit`)** — Channel searchbar to audit any handle(s), "Run Audit", VideoList
4. **History (`/admin/history`)** — Recent audits list; placeholder for future historical tracking
5. **Back to app** — Header link to `/` (main landing)
6. **Audit** — POST `/api/audit` with `body: { handles: [...] }` (admin session allows arbitrary handles)
7. **Link check** — Same as creator; admin session is accepted

### API Access

- **Audit** — Creator session OR admin session OR valid `X-API-Key` / `Authorization: Bearer`
- **Check links** — Creator session OR admin session OR valid API key
- **Rate limit** — Per IP or API key (configurable)

## Data Flow

```
users (id, googleId, email, name, avatarUrl, refreshToken)
  └── linked_channels (userId, channelId, handle, channelTitle)

audit_history (handle, video_count, created_at)
link_cache (url, result, cached_at)
```

## Auth

- **Creator**: nuxt-auth-utils session (encrypted cookie), set after Google OAuth
- **Admin**: Custom HMAC-signed cookie (`yt_audit_admin`), set after password login
