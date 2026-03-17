---
description: Add JWT + magic link + OAuth (Google/GitHub) + optional TOTP auth to an existing Go app.
user-invocable: true
agent: go-studio:go-builder
---

# Build Auth

Adds a complete authentication system to an existing Go SaaS app.

## Inputs

Confirm with user before proceeding:
- Magic link? (yes/no, default yes)
- OAuth providers? (google, github, both, none)
- TOTP 2FA? (yes/no, default no)
- Session duration? (default: 15min access, 7d refresh)

## Steps

1. Read patterns:
   - `go-stack: pattern://auth-jwt.md`
   - `go-stack: pattern://auth-magic-link.md`
   - `go-stack: pattern://auth-oauth.md` (if OAuth enabled)
   - `go-stack: pattern://auth-totp.md` (if TOTP enabled)

2. Add dependencies to `go.mod`:
   - `github.com/golang-jwt/jwt/v5`
   - `golang.org/x/oauth2` (if OAuth)
   - `github.com/pquerna/otp` (if TOTP)

3. Write migration: `internal/migrations/002_auth.sql`
   - `magic_link_tokens` table (id, user_id, token_hash, expires_at, used_at)
   - `refresh_tokens` table (id, user_id, token_hash, expires_at)
   - `totp_secrets` table (if TOTP)

4. Write `internal/repositories/auth.go`:
   - `FindUserByEmail(ctx, email)`
   - `CreateMagicLinkToken(ctx, userID, tokenHash, expiresAt)`
   - `ConsumeMagicLinkToken(ctx, tokenHash)` — marks used, returns user
   - `CreateRefreshToken(ctx, userID, tokenHash)`
   - `RotateRefreshToken(ctx, oldHash, newHash)`

5. Write `internal/services/auth.go`:
   - `SendMagicLink(ctx, email)` — generates token, sends via Resend
   - `VerifyMagicLink(ctx, token)` — returns JWT pair
   - `RefreshTokens(ctx, refreshToken)` — rotates and returns new pair
   - `OAuthCallback(ctx, provider, code)` (if OAuth)

6. Write `internal/handlers/auth.go`:
   - `POST /auth/magic-link` — request magic link
   - `GET /auth/verify?token=...` — verify and set cookies
   - `POST /auth/refresh` — rotate tokens
   - `GET /auth/logout` — clear cookies
   - `GET /auth/oauth/{provider}` (if OAuth)
   - `GET /auth/oauth/{provider}/callback` (if OAuth)

7. Write `internal/middleware/auth.go`:
   - `RequireAuth` middleware — validates JWT from cookie, sets user in context
   - `OptionalAuth` middleware — sets user if token present, continues either way

8. Write auth Templ pages:
   - `internal/ui/pages/login.templ` — email form for magic link
   - `internal/ui/pages/verify-sent.templ` — "check your email" confirmation

9. Wire auth handler to chi router in `cmd/server/main.go`

10. Add auth config fields to `internal/config/config.go`:
    - `JWTSecret`, `JWTAccessExpiry`, `JWTRefreshExpiry`
    - `MagicLinkExpiry`, `BaseURL`
    - `GoogleClientID`, `GoogleClientSecret` (if OAuth)
    - `GitHubClientID`, `GitHubClientSecret` (if OAuth)

11. Run `go build ./...` + `templ generate`

## Success Criteria

- `go build ./...` passes
- Auth routes registered: POST /auth/magic-link, GET /auth/verify, POST /auth/refresh, GET /auth/logout
- `RequireAuth` middleware available for protecting routes
- Magic link email sends via Resend
