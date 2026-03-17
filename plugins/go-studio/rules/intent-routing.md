## Intent Routing

Route every user request through these layers in order. Stop at the first match.

### Layer 1: Ad-hoc skill (default)

| User says | Skill |
|---|---|
| "scaffold a new app", "create new project", "new Go app" | `skills/scaffold-app/SKILL.md` |
| "add auth", "add login", "add magic link", "add OAuth" | `skills/build-auth/SKILL.md` |
| "add a service", "add [feature] feature", "build [name] module" | `skills/build-service/SKILL.md` |
| "build a component", "add a [name] component", "create UI for" | `skills/build-htmx-component/SKILL.md` |
| "add payments", "add Stripe", "add billing" | `skills/build-stripe/SKILL.md` |
| "add real-time", "add SSE", "add live updates" | `skills/build-sse/SKILL.md` |
| "add a Flutter app", "build mobile", "Flutter screen" | `skills/build-flutter/SKILL.md` |
| "test it", "smoke test", "does it render?" | `skills/smoke-test/SKILL.md` |
| "fix this bug", "something's broken" | Read existing code, diagnose, fix directly |

### Layer 2: Full-feature pipeline

| User says | What to do |
|---|---|
| "build the full auth system" | scaffold-app (if needed) → build-auth → smoke-test |
| "add the full payments flow" | build-stripe → build-htmx-component (checkout UI) → smoke-test |
| "set up the project from scratch" | scaffold-app → build-auth → build-stripe |

### Layer 3: Navigator workflow (explicit only)

Trigger phrases:
- "run the full client-app workflow"
- "execute client-app-delivery step by step"

Not a trigger: "build auth" (Layer 1), "set up the project" (Layer 2).

### Ambiguity rules

- If the user names a feature (e.g. "campaigns"), default to Layer 1 build-service.
- If unsure, prefer Layer 1. It's the most common path.
- Never default to Layer 3 without explicit user request.
