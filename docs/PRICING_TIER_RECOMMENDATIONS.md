# UpScrub Pricing Tier Recommendations

This document defines recommended feature limits and inclusions for each pricing tier. Use these as a reference when implementing billing and feature gating.

---

## Free

**Target:** Creators trying the product, small channels, or occasional check-ins.


| Feature                  | Limit                              |
| ------------------------ | ---------------------------------- |
| Audits per month         | 1                                  |
| Videos scanned per audit | Top 10 only                        |
| Scheduled audit emails   | No                                 |
| Revenue estimates        | No                                 |
| Channel score            | Basic (summary only, no breakdown) |
| Video score              | No                                 |
| High-intent comments     | No                                 |
| Link check / export      | Basic link list only               |
| Audit history            | Last 1 audit visible               |


**Rationale:** Free tier should be enough to see value (dead links, basic channel health) but intentionally limited so serious creators upgrade. No revenue estimates or scheduled emails keeps the free tier lightweight and encourages conversion.

---

## Pro

**Target:** Active creators with sponsors, affiliates, or merch links who want full visibility and automation.


| Feature                  | Limit                             |
| ------------------------ | --------------------------------- |
| Audits per month         | Unlimited                         |
| Videos scanned per audit | Top 200                           |
| Scheduled audit emails   | Yes (weekly or monthly)           |
| Revenue estimates        | Yes (customizable CPM, CTR, etc.) |
| Channel score            | Full 100-point breakdown          |
| Video score              | Yes                               |
| High-intent comments     | Yes                               |
| Link check / export      | Full CSV/JSON export              |
| Audit history            | Full history                      |


**Rationale:** Pro unlocks everything a solo creator needs: unlimited audits, revenue impact visibility, automated email alerts, and high-intent comment detection. This is the primary paid tier.

---

## Ultra (Pro Teams)

**Target:** Agencies, MCNs, or creators managing multiple channels.


| Feature                           | Limit                       |
| --------------------------------- | --------------------------- |
| Everything in Pro                 | Yes                         |
| Team members                      | Multiple seats (e.g. 3–10+) |
| Shared channel list               | Yes                         |
| Audit history                     | Per-team, shared            |
| Impersonation / audit any channel | Yes (admin-style)           |
| Priority support                  | Yes                         |


**Rationale:** Ultra adds collaboration and multi-channel management. Shared channel list and per-team audit history enable agencies to manage many creators from one workspace. Annual discount recommended (e.g. 2 months free).

---

## Annual Discounts

- **Pro:** Offer ~17% off (e.g. 2 months free) when billed annually.
- **Ultra:** Offer ~20% off (e.g. 2–3 months free) when billed annually.

---

## Implementation Notes

- Feature gating should check user tier before allowing access to restricted features.
- Consider soft limits (e.g. "You've used 1/1 audits this month") with clear upgrade CTA.
- Store tier in `users` or a separate `subscriptions` table; default new users to Free.

