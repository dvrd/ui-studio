---
description: URL structure, route parameters, guards, middleware, and RESTful resource naming conventions.
---

# Routing

## RESTful Resource Naming

```
GET    /{resources}          → list
GET    /{resources}/{id}     → detail
POST   /{resources}          → create
PUT    /{resources}/{id}     → update
DELETE /{resources}/{id}     → delete
```

- Resources are plural nouns: `/campaigns`, `/users`, `/invoices`
- Nested resources for relationships: `/campaigns/{campaignId}/messages`
- Use kebab-case for multi-word resources: `/billing-plans`

## Route Parameters

- Path params for required identifiers: `/campaigns/{id}`
- Query params for optional filters: `/campaigns?status=active&page=2`
- Never put sensitive data in URLs (tokens, passwords)

## Route Guards / Middleware

Apply auth at the router level, not inside handlers:

```
# Pseudocode — applies to all stacks
router.group("/api", authMiddleware) {
    GET  /campaigns      → list
    POST /campaigns      → create
}

# Public routes — no middleware
GET  /login
GET  /register
POST /auth/callback
```

**Rules:**
- All routes behind auth by default
- Explicitly mark public routes
- Webhook endpoints: no auth, but verify signatures
- Static assets: no auth needed

## URL Structure Convention

```
/                           → home (public)
/login                      → auth (public)
/register                   → auth (public)
/dashboard                  → main view (auth required)
/{resource}                 → list view (auth required)
/{resource}/{id}            → detail view (auth required)
/{resource}/{id}/edit       → edit form (auth required)
/settings                   → user settings (auth required)
/billing                    → billing dashboard (auth required)
/api/...                    → API endpoints (auth + JSON)
/api/webhooks/...           → webhooks (no auth, verify signature)
```

## Pagination

Prefer cursor-based for large datasets, offset-based for simple cases:

```
# Offset (simple)
GET /campaigns?page=2&per_page=25

# Cursor (scalable)
GET /campaigns?cursor=abc123&limit=25
```

Response should include pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "per_page": 25,
    "has_more": true
  }
}
```

## Error Responses

Consistent error format across all routes:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

HTTP status codes:
- `400` — validation error
- `401` — not authenticated
- `403` — not authorized
- `404` — resource not found
- `409` — conflict (duplicate)
- `422` — unprocessable entity
- `500` — server error (never expose internals)
