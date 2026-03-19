# QA Checklist for Launch

Manual test steps before releasing to testers or paying customers.

---

## Free Tier Limits

- [ ] New user defaults to Free tier
- [ ] Free user: 1 audit per month enforced (second audit shows upgrade prompt)
- [ ] Free user: max 10 videos in audit
- [ ] Free user: no scheduled emails, no revenue estimates, no video score breakdown, no high-intent comments, basic export only
- [ ] Upgrade CTA visible when limit hit (AUDIT_LIMIT)

---

## Pro Unlock

- [ ] Pro user: unlimited audits
- [ ] Pro user: up to 200 videos
- [ ] Pro user: scheduled emails, revenue estimates, channel score, video score, high-intent comments, full export
- [ ] Upgrade via Settings → "Upgrade to Pro" → Lemon Squeezy Checkout
- [ ] Webhook sets Pro after successful payment
- [ ] "Manage subscription" link works for Pro users

---

## Bulk Link Update

- [ ] Bulk link page shows "Upgrade to Pro" for Free users
- [ ] Pro user can bulk replace link across selected videos
- [ ] Old URL → New URL replacement works
- [ ] Progress/result feedback (updated count, failed count)
- [ ] PRO_REQUIRED error shows upgrade CTA
- [ ] Per-user rate limit enforced (429 when exceeded)

---

## Bulk Comment Reply

- [ ] Reply button visible for Pro users only
- [ ] Bulk reply modal: template with `{{author}}` placeholder
- [ ] Replies sent successfully
- [ ] PRO_REQUIRED error shows upgrade CTA
- [ ] Per-user rate limit enforced (429 when exceeded)

---

## Legal and Support

- [ ] Privacy page (`/privacy`) loads and displays policy
- [ ] Terms page (`/terms`) loads and displays terms
- [ ] Footer: Privacy, Terms, Support links work
- [ ] Settings: "Contact support" link works

---

## Pricing and Onboarding

- [ ] Landing pricing: Pro price displays (from PRO_PRICE_DISPLAY)
- [ ] Pro CTA goes to `/auth/google`
- [ ] First-time user sees onboarding modal ("Run your first audit")
- [ ] Onboarding dismissible and does not reappear (localStorage)

---

## Admin

- [ ] Admin tier override: set user to Pro without payment
- [ ] Admin tier override: clear override reverts to subscription/default
