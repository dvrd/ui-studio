---
description: Magic link email authentication — one-use time-limited tokens sent via Resend.
---

# Magic Link Pattern

## Flow

1. User submits email → generate token → store hash in DB → send email via Resend
2. User clicks link → verify token → issue JWT pair → set cookies → redirect to dashboard

## Database

```sql
-- +goose Up
CREATE TABLE magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_magic_link_tokens_token_hash ON magic_link_tokens(token_hash);
```

## Service: Send Magic Link

```go
func (s *AuthService) SendMagicLink(ctx context.Context, email string) error {
    // Find or create user
    user, err := s.userRepo.FindOrCreateByEmail(ctx, email)
    if err != nil {
        return fmt.Errorf("find or create user: %w", err)
    }

    // Generate token
    tokenBytes := make([]byte, 32)
    if _, err := rand.Read(tokenBytes); err != nil {
        return fmt.Errorf("generate token: %w", err)
    }
    token := base64.URLEncoding.EncodeToString(tokenBytes)

    // Hash for storage (never store raw token)
    h := sha256.Sum256([]byte(token))
    tokenHash := hex.EncodeToString(h[:])

    // Store in DB
    expiresAt := time.Now().Add(15 * time.Minute)
    if err := s.authRepo.CreateMagicLinkToken(ctx, user.ID, tokenHash, expiresAt); err != nil {
        return fmt.Errorf("store token: %w", err)
    }

    // Send email
    magicURL := s.cfg.BaseURL + "/auth/verify?token=" + url.QueryEscape(token)
    return s.emailService.SendMagicLink(ctx, user.Email, magicURL)
}
```

## Service: Verify Magic Link

```go
func (s *AuthService) VerifyMagicLink(ctx context.Context, token string) (string, string, error) {
    // Hash the incoming token
    h := sha256.Sum256([]byte(token))
    tokenHash := hex.EncodeToString(h[:])

    // Consume token (marks used_at, validates expiry)
    user, err := s.authRepo.ConsumeMagicLinkToken(ctx, tokenHash)
    if err != nil {
        return "", "", fmt.Errorf("invalid or expired token: %w", err)
    }

    // Issue JWT pair
    access, refresh, err := s.generateTokenPair(user)
    if err != nil {
        return "", "", err
    }

    // Store refresh token hash
    rh := sha256.Sum256([]byte(refresh))
    refreshHash := hex.EncodeToString(rh[:])
    s.authRepo.CreateRefreshToken(ctx, user.ID, refreshHash, time.Now().Add(7*24*time.Hour))

    return access, refresh, nil
}
```

## Handler

```go
// POST /auth/magic-link
func (h *Handler) RequestMagicLink(w http.ResponseWriter, r *http.Request) {
    email := r.FormValue("email")
    if email == "" {
        ui.LoginForm("Email is required").Render(r.Context(), w)
        return
    }

    if err := h.authService.SendMagicLink(r.Context(), email); err != nil {
        ui.LoginForm("Failed to send link, try again").Render(r.Context(), w)
        return
    }

    // HTMX: swap form with confirmation
    ui.MagicLinkSent(email).Render(r.Context(), w)
}

// GET /auth/verify?token=...
func (h *Handler) VerifyMagicLink(w http.ResponseWriter, r *http.Request) {
    token := r.URL.Query().Get("token")
    access, refresh, err := h.authService.VerifyMagicLink(r.Context(), token)
    if err != nil {
        http.Redirect(w, r, "/auth/login?error=invalid_token", http.StatusSeeOther)
        return
    }

    setAuthCookies(w, access, refresh, h.cfg)
    http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
}
```

## Email (Resend)

```go
func (s *EmailService) SendMagicLink(ctx context.Context, to, magicURL string) error {
    _, err := s.client.Emails.Send(&resend.SendEmailRequest{
        From:    "auth@" + s.cfg.Domain,
        To:      []string{to},
        Subject: "Your login link",
        Html:    fmt.Sprintf(`<a href="%s">Click to log in</a> (expires in 15 minutes)`, magicURL),
    })
    return err
}
```
