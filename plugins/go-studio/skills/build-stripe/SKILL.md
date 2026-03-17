---
description: Add Stripe Checkout + webhook handling for subscription or one-time payments.
user-invocable: true
agent: go-studio:go-builder
---

# Build Stripe

Adds Stripe payments to an existing Go SaaS app.

## Inputs

Confirm with user:
- Payment type: `subscription` or `one-time`
- Stripe Price IDs (from Stripe dashboard)
- Success URL and cancel URL
- Webhook events to handle (default: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)

## Steps

1. Read `go-stack: pattern://stripe-integration.md`

2. Add dependency: `github.com/stripe/stripe-go/v76`

3. Add config fields to `internal/config/config.go`:
   - `StripeSecretKey`
   - `StripeWebhookSecret`
   - `StripeSuccessURL`
   - `StripeCancelURL`

4. Write migration `internal/migrations/NNN_billing.sql`:
   - `subscriptions` table: id, user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end
   - OR `purchases` table for one-time payments

5. Write `internal/repositories/billing.go`:
   - `UpsertSubscription(ctx, userID, stripeCustomerID, subID, status, periodEnd)`
   - `GetSubscription(ctx, userID)`

6. Write `internal/services/billing.go`:
   - `CreateCheckoutSession(ctx, userID, priceID)` → Stripe session URL
   - `HandleWebhook(ctx, payload, signature)` — processes webhook events
   - `GetOrCreateCustomer(ctx, user)` → Stripe customer ID

7. Write `internal/handlers/billing.go`:
   - `GET /billing/checkout` — creates Stripe session, redirects
   - `GET /billing/success` — success page
   - `POST /billing/webhook` — Stripe webhook endpoint (no auth middleware)

8. Write `internal/ui/pages/billing.templ`:
   - Current plan display
   - Upgrade/subscribe button
   - Success confirmation page

9. Wire billing routes in `cmd/server/main.go`:
   - Webhook route must NOT have auth middleware
   - Other billing routes require RequireAuth

10. Run `go build ./...` + `templ generate`

## Success Criteria

- `go build ./...` passes
- `POST /billing/webhook` accepts Stripe events with signature verification
- `GET /billing/checkout` creates a real Stripe session and redirects
- Subscription status persisted to DB after webhook
