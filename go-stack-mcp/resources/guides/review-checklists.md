---
description: Code review checklists for Go backend and Templ frontend.
---

# Review Checklists

## Severity Table

| Level | Definition | Action |
|---|---|---|
| **Critical** | Security vulnerability, data corruption, auth bypass | Block — must fix before merge |
| **Major** | Incorrect behavior, missing error handling, N+1 query | Block — must fix before merge |
| **Minor** | Style deviation, naming inconsistency | Comment — fix recommended |

## Go Backend Checklist

### Security (Critical if failed)

- [ ] All SQL queries use parameterized statements (`$1`, `$2`, not string concat)
- [ ] JWT secret loaded from env — not hardcoded
- [ ] Stripe webhook signature verified with `webhook.ConstructEvent`
- [ ] Auth middleware applied to all non-public routes
- [ ] No sensitive values (tokens, keys) in logs or error messages
- [ ] Passwords hashed with bcrypt if used (not plaintext)

### Error Handling (Major if failed)

- [ ] All errors wrapped: `fmt.Errorf("context: %w", err)`
- [ ] No bare `_ = err` (swallowed errors)
- [ ] `defer rows.Close()` after every `Query` call
- [ ] `defer tx.Rollback()` in every transaction
- [ ] HTTP 4xx vs 5xx correctly distinguished (client error vs server error)

### Data Access (Major if failed)

- [ ] No N+1 queries (check loops that call DB inside)
- [ ] Context propagated: `r.Context()` passed to all DB calls
- [ ] Repository errors checked in service layer
- [ ] Pagination applied to list queries (no unbounded SELECT *)

### Conventions (Minor if failed)

- [ ] Handlers in `internal/handlers/` — no business logic
- [ ] Services in `internal/services/` — no HTTP concerns
- [ ] Repositories in `internal/repositories/` — DB only
- [ ] Config loaded from env, not hardcoded defaults
- [ ] Goose migrations have both Up and Down

### Build

- [ ] `go build ./...` passes
- [ ] `go vet ./...` passes

## Templ Frontend Checklist

### Security (Critical if failed)

- [ ] No `templ.Raw()` on user-supplied input
- [ ] No inline `<script>` tags with user data

### Correctness (Major if failed)

- [ ] `templ generate` was run (check `_templ.go` files are up to date)
- [ ] HTMX swap targets exist in the DOM at request time
- [ ] Form `name` attributes match `r.FormValue("name")` calls in handler

### UX (Minor if failed)

- [ ] Loading indicator on forms with `hx-indicator`
- [ ] Error state displayed inline (not just console)
- [ ] Empty state handled in list components
- [ ] Mobile viewport tested (no horizontal overflow)
