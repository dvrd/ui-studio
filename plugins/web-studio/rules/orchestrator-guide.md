## Domain Model

Every web application follows the same anatomy regardless of stack:

- `appName` — kebab-case project name (e.g. `myapp`, `onlead`)
- `stackId` — detected tech stack (e.g. `go-templ-htmx`, `nextjs-react`, `sveltekit-svelte`, `nuxt3-vue`, `rails-hotwire`)
- `designSystem` — component library in use (e.g. `templui`, `shadcn`, `vuetify`, `daisyui`, `custom`)
- `projectDir` — absolute path to the app root

**Stack detection signals:**

| Signal | Stack |
|---|---|
| `go.mod` + `.templ` files | `go-templ-htmx` |
| `package.json` with `next` | `nextjs-react` |
| `package.json` with `@sveltejs/kit` | `sveltekit-svelte` |
| `package.json` with `nuxt` | `nuxt3-vue` |
| `Gemfile` with `rails` | `rails-hotwire` |
| `pyproject.toml` with `django` | `django` |
| `pyproject.toml` with `fastapi` | `fastapi` |

**Universal project concepts** (every stack has these, named differently):

| Concept | Go+Templ | Next.js | SvelteKit | Nuxt 3 | Rails |
|---|---|---|---|---|---|
| Route handler | `internal/handlers/` | `app/api/` | `src/routes/+server.ts` | `server/api/` | `app/controllers/` |
| Page/view | `internal/ui/pages/` | `app/(pages)/` | `src/routes/+page.svelte` | `pages/` | `app/views/` |
| Business logic | `internal/services/` | `lib/services/` | `src/lib/server/` | `server/services/` | `app/services/` |
| Data access | `internal/repositories/` | `lib/db/` | `src/lib/server/db/` | `server/repositories/` | `app/models/` |
| Components | `internal/ui/components/` | `components/` | `src/lib/components/` | `components/` | `app/components/` |
| Config | `internal/config/` | `.env` + `next.config` | `.env` + `svelte.config` | `.env` + `nuxt.config` | `config/` |
| Migrations | `internal/migrations/` | `prisma/migrations/` | `prisma/migrations/` | `prisma/migrations/` | `db/migrate/` |
| Static assets | `assets/` | `public/` | `static/` | `public/` | `app/assets/` |

## MCP Awareness

- **web-patterns** (`plugin:web-studio:web-patterns`): Source of truth for all implementation patterns. Universal patterns (`universal://*`) apply to every stack. Stack patterns (`stack://{stackId}/*`) have framework-specific implementations. **Always read both** before building.
- **design-system** (`plugin:web-studio:design-system`): Component library documentation. Check availability before creating custom components.
- **chrome-devtools**: Browser automation for visual verification. Required for all smoke tests and verification steps.

## State Detection

Check `.ui-studio/web-project.json` for project state:

- File exists with `status: "scaffolded"` → project initialized, build features next
- File exists with `status: "authed"` → auth built, add domain features next
- File exists with `status: "featured"` → features built, add integrations or verify
- File exists with `status: "verified"` → ready to ship
- File doesn't exist but project files exist → existing project, suggest initializing manifest
- No project files → new project, suggest scaffold

## Step Execution Protocol

Every step file has YAML frontmatter and phase sections. **Steps are orchestrator instructions** — YOU read the step and follow it. You launch focused subagents only for bounded, defined tasks. You do not hand the step file to one subagent and tell it to do everything.

### 1. Read the step file

From `steps/` directory, using the Step Index or intent routing table.

### 2. Parse frontmatter

```yaml
---
agent: web-builder              # default agent for Phase 2 subagents
requires: [projectDir, stackId] # entities to resolve BEFORE executing
resources:                      # MCP resource URIs — read before executing
  - universal://routing.md
  - stack://{stackId}/handlers.md
---
```

### 3. Read `resources` (skip if absent)

Each URI in `resources:` is an MCP resource on `web-patterns` or `design-system`. Read each one. When delegating to a subagent, tell it: "Read `universal://routing.md` from web-patterns before starting."

### 4. Resolve `requires` entities (skip if absent)

| Entity | How to resolve |
|---|---|
| `projectDir` | Current working directory (must contain project files) |
| `stackId` | Detect from project files (see Stack Detection Signals) |
| `designSystem` | Read from `.ui-studio/web-project.json` or detect from dependencies |
| `appName` | Read from `.ui-studio/web-project.json`, `package.json` name, or `go.mod` module |

### 5. Substitute `{templates}`

Replace `{stackId}`, `{projectDir}`, `{appName}`, `{designSystem}` with resolved values everywhere in the step.

### 6. Execute the three phases

**Tool rejection rule**: If a tool use is rejected by the user, treat it as `Next(failed)`. Stop immediately. Do not attempt alternatives. Report what was rejected and wait for user direction.

**Existing work rule**: If work appears already done (code committed from a previous session), do NOT advance automatically. Stop and ask: "This appears to already be done. Should I re-verify, skip, or something else?"

**No shortcuts rule**: This work is long. That is expected. Never circumvent the step sequence:
- Every phase must execute. Every verification must run.
- Building and reviewing are ALWAYS separate agents.
- When SetItems registers N items, each item gets its own subagent launch.
- "I already did something similar earlier" is not a reason to skip.

---

### Phase 1 — Analyze

The step defines a specific research task. Launch a **focused research subagent** (typically `web-architect`) with that exact bounded task. The task is narrow: read these specific files, return this specific structured output. Do not ask the research subagent to implement anything.

Read the returned output. If the step contains a `**SetItems from**:` directive, extract values and call `Navigator.SetItems(taskFilePath, items)`.

Phase 1 subagents must return a structured manifest with an explicit `"found": true/false` field. If `found` is false or missing, call `Next(failed)` immediately.

---

### Phase 2 — Do

For each item in the manifest: launch a **focused action subagent** (typically `web-builder`) with a single bounded task. Pass the item's full specification as input. Tell the subagent to read each `resources` URI from frontmatter.

The action subagent:
- Implements the one thing it was given
- Writes an evidence artifact (path and contents confirmed)
- Returns a summary of what it did and any issues
- **Does NOT call Navigator.Next** — that is your job

If an action subagent reports it could not complete the task, do not move to the next item. Investigate and call `Next(failed)` if the blocker is real.

---

### Phase 3 — Verify

After all Phase 2 items complete, run the step's verification criteria **yourself** using available tools. Do not ask the builder to verify its own work.

Verification uses tools that produce objective output:
- Chrome DevTools: navigate to route, take screenshot, read console errors
- Build command: run the stack's build/compile command, read output
- Test runner: run tests, read pass/fail counts

**Call `Next(passed)` only when verification produces evidence of success.**

**Call `Next(failed)` if:**
- Verification tool is unavailable
- Tool output shows errors or failures
- Evidence artifact from Phase 2 is missing or incomplete

Do not rationalize a pass when verification could not run. "I couldn't verify but the code looks right" is a `Next(failed)`.

---

### Pass/fail rules

1. **Cannot verify = failed.** If verification cannot run, the step is failed.
2. **Skipped = failed.** A step that was skipped for any reason is failed.
3. **Build fails = failed.** The stack's build command must pass.
4. **Partial completion = failed.** All checks must pass, not just some.
5. **Existing artifacts are not a free pass.** Every step must execute its work.
6. **Fix it, don't skip it.** When something fails, call `Next(failed)`. The workflow handles retries and escalation.

## Step Index

**Scaffolding**: `steps/scaffold/init-project.md`, `verify-scaffold.md`
**Auth**: `steps/auth/build-auth.md`, `verify-auth.md`
**Features**: `steps/feature/build-service.md`, `build-page.md`, `build-component.md`, `add-responsive.md`
**Integrations**: `steps/integration/build-payments.md`, `build-email.md`, `build-realtime.md`
**Testing**: `steps/testing/build-tests.md`
**Delivery**: `steps/delivery/smoke-test.md`, `ship.md`, `review.md`
