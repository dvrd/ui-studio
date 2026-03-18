---
description: Scaffold a new Go SaaS app with chi router, pgx, Goose, Templ, HTMX, and Tailwind v4.
user-invocable: true
agent: go-studio:go-builder
---

# Scaffold App

Creates a new Go SaaS application with the standard project structure.

## Inputs

Confirm with user before proceeding:
- `appName` — kebab-case project name (e.g. `myapp`)
- `modulePath` — Go module path (e.g. `github.com/username/myapp`)
- `dbName` — PostgreSQL database name (e.g. `myapp_dev`)
- `port` — HTTP port (default: `8080`)

## Steps

1. Read `go-stack: guide://project-scaffold.md`

2. Create directory structure:
```
cmd/server/
internal/{config,handlers,services,repositories,middleware,models,migrations,ui/{components,pages,layouts}}/
assets/
```

3. Write `go.mod` with dependencies:
   - `github.com/go-chi/chi/v5`
   - `github.com/jackc/pgx/v5`
   - `github.com/jmoiron/sqlx`
   - `github.com/pressly/goose/v3`
   - `github.com/a-h/templ`
   - `github.com/golang-jwt/jwt/v5`
   - `github.com/resendlabs/resend-go`

4. Write `internal/config/config.go` — env-based config struct with all standard fields (DB_URL, JWT_SECRET, PORT, etc.)

5. Write `cmd/server/main.go` — chi router setup, DB pool init, health check route, static files

6. Write `internal/ui/layouts/base.templ` — base HTML layout with Tailwind, HTMX, templUI imports

7. Write `internal/ui/pages/home.templ` — minimal home page

8. Write `assets/app.css`:
```css
@import "tailwindcss";
@import "templui/styles";
```

9. Write `package.json` for Tailwind tooling:
```json
{ "scripts": { "build:css": "npx @tailwindcss/cli -i assets/app.css -o assets/dist/app.css" } }
```

10. Write `internal/migrations/001_initial.sql` with users table

11. Run `go mod tidy`

12. Run `go build ./...` — must pass

13. Report: all files created, next steps (suggest build-auth)

## Success Criteria

- `go build ./...` passes
- Project compiles with zero errors
- Standard directory structure in place
