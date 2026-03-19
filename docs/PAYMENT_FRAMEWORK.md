# Payment Framework: Lemon Squeezy

UpScrub uses **Lemon Squeezy** for subscriptions. This document explains the choice and how to set it up.

---

## Why Lemon Squeezy over Stripe

| Factor | Lemon Squeezy | Stripe |
|--------|---------------|--------|
| **Merchant of Record** | Yes - LS sells your product; they handle tax globally | No - you are the seller; you handle VAT/GST |
| **Tax compliance** | Built-in: 100+ countries, filing, receipts | Stripe Tax add-on; you still file |
| **Fees** | 5% + $0.50 all-inclusive | 2.9% + $0.30 + add-ons (effective 4-5% for international) |
| **Setup complexity** | Lower - no tax setup, fewer webhooks | Higher - Stripe Tax, more config |
| **Customer Portal** | Built-in: cancel, change plan, update payment | Stripe Customer Portal (separate setup) |

**Recommendation:** Lemon Squeezy simplifies tax and compliance for a small SaaS targeting global creators. Stripe acquired Lemon Squeezy in 2024; both operate independently.

---

## Setup Instructions

### 1. Create a Lemon Squeezy Account

- Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
- Create a store
- Add a product: "UpScrub Pro" with variants (e.g. Monthly, Yearly)

### 2. API Keys

- **API Key:** Settings → API → Create API key (for checkout URL generation)
- **Signing Secret:** Settings → Webhooks → Create webhook → copy signing secret (for webhook verification)

### 3. Environment Variables

```env
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_SIGNING_SECRET=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_PRO_VARIANT_ID=       # monthly variant ID
LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID= # optional, for yearly
LEMON_SQUEEZY_BILLING_URL=           # https://yourstore.lemonsqueezy.com/billing
```

### 4. Webhook Configuration

- **URL:** `https://your-domain.com/api/lemon-squeezy/webhook`
- **Events:** `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
- **Custom data:** Pass `user_id` (our internal user UUID) in checkout options so the webhook can map payments to users

### 5. Checkout Flow

1. User clicks "Upgrade to Pro"
2. Backend builds Checkout URL via Lemon Squeezy API or hosted checkout link
3. Include `checkout_options.custom_data.user_id` = our user ID
4. User completes payment on Lemon Squeezy
5. LS redirects to success URL (e.g. `/settings?upgraded=1`)
6. Webhook fires; we update `subscriptions` table

### 6. Customer Portal (Manage / Cancel)

- Users manage their subscription at `LEMON_SQUEEZY_BILLING_URL`
- They sign in with the email used for purchase
- From there they can: cancel, change plan, update payment method, view invoices

---

## Webhook Event Handling

| Event | Action |
|-------|--------|
| `subscription_created` | Set tier to `pro`, store `customer_id`, `subscription_id`, `current_period_end` |
| `subscription_updated` | Update tier and period end if status is active |
| `subscription_cancelled` | Set tier to `free` at period end (or immediately per payload) |
| `subscription_expired` | Set tier to `free`, clear subscription ID |

---

## Variant IDs

Find variant IDs in Lemon Squeezy: Products → Your product → Variants. Use the numeric ID for `LEMON_SQUEEZY_PRO_VARIANT_ID`.
