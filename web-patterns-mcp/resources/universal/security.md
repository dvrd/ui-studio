---
description: CSRF, XSS, CSP, rate limiting, input sanitization, and OWASP-aligned security practices.
---

# Security

## CSRF Protection

Required on all state-changing endpoints (POST, PUT, DELETE):

- **Server-rendered**: Use CSRF tokens in forms (hidden field + cookie)
- **SPA**: Use SameSite=Lax cookies (most modern stacks handle this)
- **API**: For cookie-based auth, require custom header (e.g. `X-Requested-With`)

## XSS Prevention

- **Never** render user input as raw HTML
  - Go/Templ: never use `templ.Raw()` on user input
  - React: never use `dangerouslySetInnerHTML` on user input
  - Svelte: never use `{@html}` on user input
  - Vue: never use `v-html` on user input
- All template engines auto-escape by default — don't bypass this
- Sanitize HTML if rich text is required (use DOMPurify or equivalent)

## Content Security Policy (CSP)

Set CSP headers on all responses:

```
Content-Security-Policy:
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
    font-src 'self';
    frame-ancestors 'none';
```

Adjust based on requirements (CDN, analytics, etc.) but start restrictive.

## Rate Limiting

Apply to sensitive endpoints:

| Endpoint | Limit |
|---|---|
| `/login`, `/register` | 5 req/min per IP |
| `/api/auth/magic-link` | 3 req/min per email |
| `/api/auth/forgot-password` | 3 req/min per email |
| `/api/webhooks/*` | 100 req/min per IP |
| General API | 60 req/min per user |

## Input Validation

Validate at system boundaries (HTTP handlers):

- **Type check**: ensure expected types (string, number, UUID)
- **Length limits**: prevent oversized inputs
- **Format validation**: email, URL, phone with regex
- **Allowlist**: for enums, accept only known values
- **Sanitize**: trim whitespace, normalize unicode

Never trust client-side validation alone.

## SQL Injection Prevention

- **Always** use parameterized queries: `WHERE id = $1`
- **Never** string-concatenate user input into SQL
- Use ORM/query builder for complex queries
- Validate UUIDs before using in queries

## Authentication Security

- Hash passwords with bcrypt (cost 12+) or Argon2id
- Use timing-safe comparison for tokens
- Don't reveal whether email exists (same response for valid/invalid)
- Invalidate all sessions on password change
- Log auth events (login, logout, failed attempt)

## Secrets Management

- All secrets from environment variables
- Never commit secrets to git
- Never log secrets
- Use different secrets per environment (dev/staging/prod)
- Rotate secrets periodically

## Headers

Set security headers on all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
