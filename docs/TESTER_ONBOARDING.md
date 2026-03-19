# Tester Onboarding Guide

This document explains how to onboard testers for UpScrub before general availability.

---

## Option 1: Lemon Squeezy Test Mode

1. **Enable test mode** in your Lemon Squeezy dashboard (Settings → Test mode).
2. Share the landing page URL with testers. They click "Choose plan" (Pro) and complete checkout.
3. **Test card:** Use Lemon Squeezy's test card (e.g. `4242 4242 4242 4242`) for payments. No real charges.
4. After checkout, the webhook updates the user's tier to Pro. Testers get full Pro access.

---

## Option 2: Admin Tier Override

For testers who should not go through checkout (e.g. internal QA):

1. **Admin access:** Ensure `ADMIN_PASSWORD` is set in `.env`. Sign in at `/admin`.
2. **Find user ID:** Get the tester's user UUID from the database (`users` table) or from your auth logs.
3. **Override tier:** Go to `/admin/tier-override` (or the tier override page in your admin layout).
4. Enter the user ID, select "Pro", and click "Set override".
5. The override takes precedence over subscription status. Use "Clear override" to revert.

**API:** `POST /api/admin/tier-override` with body `{ userId: string, tier: 'free' | 'pro' | null }`.

---

## Invite Flow (Manual)

1. Invite tester via email with sign-up link: `https://your-domain.com/auth/google`
2. Tester signs in with Google (must have a YouTube channel).
3. Choose one:
   - **Test checkout:** Tester uses Lemon Squeezy test mode to "purchase" Pro.
   - **Manual override:** Admin sets their tier to Pro via tier override.

---

## Checklist for New Testers

- [ ] Tester has a YouTube channel
- [ ] Tester signs in with Google
- [ ] Tester runs first audit
- [ ] If Pro: either completes test checkout or admin sets tier override
- [ ] Tester verifies Pro features (unlimited audits, bulk links, bulk reply, etc.)
