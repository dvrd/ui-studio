---
description: Stripe Checkout + webhook integration for subscriptions and one-time payments.
---

# Stripe Integration Pattern

## Setup

```go
import "github.com/stripe/stripe-go/v76"
import "github.com/stripe/stripe-go/v76/checkout/session"
import "github.com/stripe/stripe-go/v76/webhook"
import "github.com/stripe/stripe-go/v76/customer"

// In main.go or service init
stripe.Key = cfg.StripeSecretKey
```

## Create Checkout Session

```go
func (s *BillingService) CreateCheckoutSession(ctx context.Context, userID uuid.UUID, priceID string) (string, error) {
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return "", fmt.Errorf("get user: %w", err)
    }

    // Get or create Stripe customer
    customerID, err := s.getOrCreateCustomer(ctx, user)
    if err != nil {
        return "", err
    }

    params := &stripe.CheckoutSessionParams{
        Customer: stripe.String(customerID),
        Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
        LineItems: []*stripe.CheckoutSessionLineItemParams{
            {
                Price:    stripe.String(priceID),
                Quantity: stripe.Int64(1),
            },
        },
        SuccessURL: stripe.String(s.cfg.BaseURL + "/billing/success?session_id={CHECKOUT_SESSION_ID}"),
        CancelURL:  stripe.String(s.cfg.BaseURL + "/billing"),
    }

    sess, err := session.New(params)
    if err != nil {
        return "", fmt.Errorf("create checkout session: %w", err)
    }

    return sess.URL, nil
}
```

## Get or Create Customer

```go
func (s *BillingService) getOrCreateCustomer(ctx context.Context, user *models.User) (string, error) {
    sub, err := s.billingRepo.GetSubscription(ctx, user.ID)
    if err == nil && sub.StripeCustomerID != "" {
        return sub.StripeCustomerID, nil
    }

    params := &stripe.CustomerParams{
        Email: stripe.String(user.Email),
        Metadata: map[string]string{"user_id": user.ID.String()},
    }
    c, err := customer.New(params)
    if err != nil {
        return "", fmt.Errorf("create stripe customer: %w", err)
    }

    return c.ID, nil
}
```

## Webhook Handler

```go
// POST /billing/webhook — NO auth middleware on this route
func (h *BillingHandler) Webhook(w http.ResponseWriter, r *http.Request) {
    payload, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "read body", http.StatusBadRequest)
        return
    }

    // Verify signature
    sig := r.Header.Get("Stripe-Signature")
    event, err := webhook.ConstructEvent(payload, sig, h.cfg.StripeWebhookSecret)
    if err != nil {
        http.Error(w, "invalid signature", http.StatusBadRequest)
        return
    }

    if err := h.billingService.HandleWebhookEvent(r.Context(), event); err != nil {
        http.Error(w, "handler error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}
```

## Handle Webhook Events

```go
func (s *BillingService) HandleWebhookEvent(ctx context.Context, event stripe.Event) error {
    switch event.Type {
    case "checkout.session.completed":
        var sess stripe.CheckoutSession
        if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
            return fmt.Errorf("unmarshal session: %w", err)
        }
        return s.handleCheckoutCompleted(ctx, &sess)

    case "customer.subscription.updated":
        var sub stripe.Subscription
        if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
            return fmt.Errorf("unmarshal subscription: %w", err)
        }
        return s.handleSubscriptionUpdated(ctx, &sub)

    case "customer.subscription.deleted":
        var sub stripe.Subscription
        if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
            return fmt.Errorf("unmarshal subscription: %w", err)
        }
        return s.handleSubscriptionDeleted(ctx, &sub)
    }
    return nil
}
```

## Critical: Webhook Route Must Skip Auth

```go
// In main.go routing setup:
r.Post("/billing/webhook", billingHandler.Webhook) // NO RequireAuth middleware

r.Route("/billing", func(r chi.Router) {
    r.Use(middleware.RequireAuth)
    r.Get("/", billingHandler.Page)
    r.Get("/checkout", billingHandler.Checkout)
    r.Get("/success", billingHandler.Success)
})
```
