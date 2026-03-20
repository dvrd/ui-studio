---
description: Authentication flows — JWT, sessions, OAuth, magic link — token management, session lifecycle, and security.
---

# Authentication

## Auth Methods

### JWT (JSON Web Tokens)
Best for: Server-rendered apps, API-first architectures.

- **Access token**: short-lived (15-30 min), contains user ID + roles
- **Refresh token**: long-lived (7-30 days), stored in HttpOnly cookie
- Token rotation: issue new refresh token on each use, invalidate old one
- Store in HttpOnly, Secure, SameSite=Lax cookies — never localStorage

### Session-Based
Best for: Traditional server-rendered apps (Rails, Django, PHP).

- Server stores session data (user ID, roles) in DB or Redis
- Session ID in HttpOnly cookie
- Logout = destroy session server-side
- Simpler but requires server-side state

### OAuth 2.0
For social login (Google, GitHub, etc.):

1. Redirect user to provider's auth URL with `state` + `code_challenge` (PKCE)
2. Provider redirects back with `code`
3. Server exchanges `code` for tokens
4. Extract user profile, create/update local user
5. Issue local session/JWT

**Always use PKCE** — even for server-side flows.

### Magic Link
Passwordless authentication via email:

1. User enters email
2. Server generates time-limited token (15 min), stores hash in DB
3. Send email with login link containing token
4. User clicks link → server validates token → issues session/JWT
5. Mark token as used (single-use)

## Auth Middleware Pattern

```
middleware requireAuth(request):
    token = extractToken(request)  // from cookie or Authorization header
    if !token:
        redirect to /login (server-rendered) OR return 401 (API)

    user = validateToken(token)
    if !user:
        redirect to /login OR return 401

    request.context.user = user
    next()
```

## Registration Flow

1. Validate email format + password strength
2. Check email not already registered
3. Hash password with bcrypt (cost 12+)
4. Create user record
5. Send welcome email (if email service configured)
6. Issue session/JWT
7. Redirect to dashboard

## Login Flow

1. Find user by email
2. Compare password hash
3. Issue session/JWT (access + refresh)
4. Set cookies (HttpOnly, Secure, SameSite)
5. Redirect to dashboard (or requested URL)

## Logout Flow

1. Clear cookies (set Max-Age=0)
2. Invalidate refresh token server-side
3. Redirect to login

## Password Reset Flow

1. User enters email
2. Generate time-limited reset token (1 hour)
3. Send email with reset link
4. User clicks link → render reset form
5. Validate token, update password hash
6. Invalidate all existing sessions/tokens
7. Redirect to login

## Security Requirements

- **CSRF protection** on all state-changing endpoints (POST, PUT, DELETE)
- **Rate limiting** on auth endpoints (5 attempts per minute per IP)
- **Account lockout** after N failed attempts (optional, with unlock via email)
- **Password requirements**: minimum 8 chars, check against known breached passwords
- **Never reveal** whether an email exists in the system (timing-safe comparison)
- **Secure cookies**: HttpOnly + Secure + SameSite=Lax
- **Token storage**: never in localStorage, always in HttpOnly cookies
