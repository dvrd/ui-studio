## Domain Model

Every client app follows the same anatomy:

- `appName` — kebab-case project name (e.g. `ariel`, `onlead`)
- `featureName` — the capability being built (e.g. `auth`, `campaigns`, `billing`)
- `serviceName` — Go package name for the service (e.g. `auth`, `campaign`, `billing`)
- `projectDir` — absolute path to the app root (has `go.mod`)

**Standard project layout:**

```
cmd/server/main.go          ← entry point, wires everything
internal/
  config/config.go          ← env-based config struct
  handlers/                 ← HTTP handlers (one file per feature)
  services/                 ← business logic (one file per feature)
  repositories/             ← DB queries (one file per feature)
  middleware/               ← auth, logging, rate limiting
  models/                   ← shared data types
  migrations/               ← Goose SQL files (embedded)
  ui/
    components/             ← reusable Templ components
    pages/                  ← full-page Templ templates
    layouts/                ← base layouts
assets/
  app.css                   ← Tailwind v4 entry
```

## MCP Awareness

- **go-stack** (`plugin:go-studio:go-stack`): Source of truth for all Go patterns. Patterns (`pattern://*`), Guides (`guide://*`). Use for ALL building and reviewing.
- **templui** (`plugin:go-studio:templui`): templUI v1.6 component documentation. Use for ALL UI component decisions.
- **chrome-devtools**: Browser automation for smoke testing. Required for visual verification steps.

## State Detection

Check for these signals to understand current project state:

- `go.mod` exists → Go project initialized
- `internal/handlers/auth.go` exists → auth already built
- `internal/migrations/` has files → DB schema exists
- `assets/app.css` exists → Tailwind configured

## Step Execution Protocol

Every skill has a description and numbered steps. Follow them exactly.

**Phase 1 — Analyze**: Research subagent reads existing code, returns structured findings.
**Phase 2 — Do**: Builder subagent implements the task using patterns from go-stack MCP.
**Phase 3 — Verify**: Run `go build ./...`, check for compile errors, smoke test if Chrome available.

Pass/fail rules:
- Cannot verify = failed
- Skipped = failed
- `go build ./...` fails = failed
- Partial completion = failed

## Step Index

**Building**: `skills/build-auth/`, `skills/build-service/`, `skills/build-htmx-component/`, `skills/build-stripe/`, `skills/build-sse/`
**Scaffolding**: `skills/scaffold-app/`
**Flutter**: `skills/build-flutter/`
**Testing**: `skills/smoke-test/`
