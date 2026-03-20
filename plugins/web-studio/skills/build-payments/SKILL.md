---
description: Add payment integration (Stripe Checkout + webhook handling).
user-invocable: true
agent: web-studio:web-builder
---

# Build Payments

Adds Stripe Checkout with webhook handling for one-time or subscription payments.

## Inputs

Confirm with user:
- Payment type: one-time or subscription
- Products/prices (can use Stripe Dashboard)

## Steps

1. `steps/integration/build-payments.md` — Build payment routes, webhook handler, billing UI

## Success Criteria

- Build passes
- Webhook handler verifies Stripe signatures
- Billing page renders
- `.ui-studio/web-project.json` updated with billing feature
