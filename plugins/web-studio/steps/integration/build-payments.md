---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://payments.md
  - stack://{stackId}/stripe-impl.md
---

# Build Payments

Add payment integration (Stripe Checkout + webhook handling).

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read universal payments pattern and stack-specific Stripe implementation
- Read existing project code (auth, config, data access layer)
- Confirm with user: payment type (one-time/subscription), products
- Return manifest:

```json
{
  "found": true,
  "paymentType": "subscription",
  "provider": "stripe",
  "routes": [
    { "path": "/billing", "method": "GET", "auth": true, "purpose": "billing dashboard" },
    { "path": "/billing/checkout", "method": "POST", "auth": true, "purpose": "create checkout session" },
    { "path": "/billing/success", "method": "GET", "auth": true, "purpose": "post-checkout redirect" },
    { "path": "/billing/webhook", "method": "POST", "auth": false, "purpose": "Stripe webhook" }
  ],
  "files": {
    "create": ["migration", "repository", "service", "handler", "billing-page", "checkout-component"],
    "modify": ["config (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID)"]
  },
  "configFields": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID"]
}
```

## Phase 2 — Do

Launch **web-builder** subagent:
- Read Stripe patterns (universal + stack-specific)
- Implement in order:
  1. Config fields for Stripe keys
  2. Migration (subscriptions/purchases table)
  3. Repository (UpsertSubscription, GetSubscription)
  4. Service (CreateCheckoutSession, HandleWebhook, GetOrCreateCustomer)
  5. Handlers for all routes
  6. UI: billing dashboard page, checkout button component
  7. Wire webhook route (no auth middleware!)
- Run build command

Commit: `feat(billing): add Stripe {paymentType} integration`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Structure check**: All payment files exist
3. **Route check**: All routes registered, webhook route has no auth middleware
4. **Visual check** (requires Chrome + running server):
   - Navigate to `/billing` — screenshot
   - Verify checkout button is present
5. **Security check**: Webhook handler verifies Stripe signature before processing
6. **Update manifest**: Add billing feature to `.ui-studio/web-project.json`

**Pass criteria**: Build passes AND webhook signature verification present AND routes registered.
**Fail criteria**: Build fails OR missing webhook verification.
