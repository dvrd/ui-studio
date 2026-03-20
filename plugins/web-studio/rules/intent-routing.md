## Intent Routing

Route every user request through these layers in order. Stop at the first match.

Step file paths are relative to `pluginRoot`. Read them directly — do not search the filesystem.

### Layer 1: Ad-hoc step (default)

User asks for a specific task. Match to the closest step file, read it, then follow the Step Execution Protocol.

| User says | Step file |
|---|---|
| "scaffold a new app", "create new project", "new app" | `steps/scaffold/init-project.md` |
| "does it build?", "verify the scaffold" | `steps/scaffold/verify-scaffold.md` |
| "add auth", "add login", "build authentication" | `steps/auth/build-auth.md` |
| "verify auth", "test the login" | `steps/auth/verify-auth.md` |
| "add a service", "add [feature]", "build [name] module" | `steps/feature/build-service.md` |
| "add a page", "create the dashboard", "new route" | `steps/feature/build-page.md` |
| "build a component", "add a [name] component", "create UI for" | `steps/feature/build-component.md` |
| "add payments", "add Stripe", "add billing" | `steps/integration/build-payments.md` |
| "add email", "send notifications", "transactional email" | `steps/integration/build-email.md` |
| "add real-time", "add SSE", "add WebSocket", "live updates" | `steps/integration/build-realtime.md` |
| "test it", "smoke test", "does it render?" | `steps/delivery/smoke-test.md` |
| "ship it", "commit", "lint and commit" | `steps/delivery/ship.md` |
| "make it responsive", "add mobile support" | `steps/feature/add-responsive.md` |
| "write tests", "add tests", "test coverage" | `steps/testing/build-tests.md` |
| "build mobile screen", "add Flutter screen" | `steps/mobile/build-screen.md` |
| "review the code", "check quality" | `steps/delivery/review.md` |
| "fix this bug", "something's broken" | Read existing code, diagnose, fix directly |

### Layer 2: Pipeline command

User asks for a full pipeline stage. Route to the corresponding skill which orchestrates multiple steps.

| User says | Skill |
|---|---|
| "build this app", "full delivery" | `/web-studio:deliver` |
| "set up the project from scratch" | `/web-studio:scaffold-app` → `/web-studio:build-auth` |
| "add [feature] end to end" | `/web-studio:build-feature {name}` |
| "build the full auth system" | `/web-studio:build-auth` |
| "add the full payments flow" | `/web-studio:build-payments` |

### Layer 3: Navigator workflow (explicit only)

Trigger phrases (must be explicit):
- "run the full delivery workflow"
- "execute web-app-delivery step by step"
- "walk me through building this app"

Not a trigger: "build auth" (Layer 1), "set up the project" (Layer 2).

### Ambiguity rules

- If the user names a specific feature (e.g. "campaigns"), default to Layer 1 build-service.
- If the user says "build" without specifying what, ask what they want to build.
- If unsure, prefer Layer 1. It's the most common path and easiest to recover from.
- Never default to Layer 3 without explicit user request.
