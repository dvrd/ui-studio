---
description: Stripe Checkout, webhook handling, subscription lifecycle, and payment security patterns.
---

# Payments

## Stripe Checkout Flow

### One-Time Payment

1. User clicks "Buy" → frontend calls your API
2. Server creates Stripe Checkout Session with line items
3. Redirect user to Stripe-hosted checkout page
4. Stripe redirects to success/cancel URL
5. Webhook confirms payment → update database

### Subscription

1. User clicks "Subscribe" → frontend calls your API
2. Server creates Checkout Session in `subscription` mode
3. Redirect to Stripe checkout
4. Webhook `checkout.session.completed` → create subscription record
5. Webhook `invoice.paid` → confirm renewal
6. Webhook `customer.subscription.deleted` → mark cancelled

## Webhook Handler

**Critical security**: Verify webhook signature before processing.

```
POST /api/webhooks/stripe

handler(request):
    body = request.rawBody
    signature = request.header("Stripe-Signature")

    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    // ↑ This throws if signature is invalid — NEVER skip this

    switch event.type:
        case "checkout.session.completed":
            handleCheckoutComplete(event.data.object)
        case "invoice.paid":
            handleInvoicePaid(event.data.object)
        case "customer.subscription.deleted":
            handleSubscriptionCancelled(event.data.object)

    return 200  // Always return 200 to acknowledge receipt
```

**Webhook rules:**
- NO auth middleware on webhook endpoint (Stripe can't authenticate)
- ALWAYS verify Stripe signature
- Return 200 quickly — do heavy processing async
- Handle events idempotently (same event may be sent multiple times)
- Log all webhook events for debugging

## Database Schema

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

## Service Layer

```
PaymentService:
    CreateCheckoutSession(userId, priceId) → sessionURL
    GetOrCreateCustomer(userId, email) → stripeCustomerId
    HandleWebhookEvent(event) → void
    GetSubscription(userId) → Subscription
    CancelSubscription(userId) → void
    IsSubscribed(userId) → bool
```

## Config Fields

Required environment variables:
- `STRIPE_SECRET_KEY` — server-side API key
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification
- `STRIPE_PRICE_ID` — default price for subscription

## Billing UI

Minimal billing dashboard:
- Current plan status (active/cancelled/none)
- Next billing date
- "Manage Subscription" button → Stripe Customer Portal
- "Subscribe" button for non-subscribers → Checkout

```
GET /billing → render billing dashboard
POST /billing/checkout → create checkout session, redirect to Stripe
GET /billing/success → post-checkout landing page
```
