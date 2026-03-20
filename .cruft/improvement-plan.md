# UI Studio Improvement Plan: Web-Specialized, Tech-Agnostic, App-Studio Consistent

## Problem Statement

UI Studio currently is a Go SaaS builder with a meta-generator bolted on. To become a **web application specialist** that's **technology-agnostic** and **equally consistent** as App Studio, we need to restructure around web-universal concepts while keeping stack-specific implementations pluggable.

---

## Architecture Target

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          UI Studio                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Universal Layer (web-agnostic)                                        │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ Orchestrator + 3-Layer Intent Routing + 3-Phase Step Protocol     ││
│  │ ┌──────────┐ ┌───────────────┐ ┌──────────────┐ ┌─────────────┐  ││
│  │ │Web       │ │Design System  │ │Chrome        │ │Project      │  ││
│  │ │Patterns  │ │Abstraction    │ │DevTools MCP  │ │Manifest     │  ││
│  │ │MCP       │ │MCP            │ │(verification)│ │(state chain)│  ││
│  │ └──────────┘ └───────────────┘ └──────────────┘ └─────────────┘  ││
│  └────────────────────────────────────────────────────────────────────┘│
│                              ▼                                         │
│  Stack Adapters (pluggable per project)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │Go+Templ  │ │Next.js   │ │SvelteKit │ │Nuxt 3    │ │Rails+      │ │
│  │+HTMX     │ │+React    │ │+Svelte   │ │+Vue 3    │ │Hotwire     │ │
│  │(current) │ │          │ │          │ │          │ │            │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│       ▲             ▲            ▲            ▲             ▲        │
│       └─────────────┴────────────┴────────────┴─────────────┘        │
│                    Stack MCP Server per adapter                       │
│                                                                         │
│  Generator (enhanced — produces consistent studios)                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ detect → infer → assemble (with universal + adapter layers)    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Gap Analysis: What Makes App Studio Consistent

| App Studio Has | UI Studio Current | Gap |
|---|---|---|
| 3-phase step protocol (Analyze → Do → Verify) | Single-phase skills | **Critical** |
| No-excuses verification rules | Basic `go build` gates | **Critical** |
| Artifact chain (application.json → routes → spec → code) | None | **High** |
| 16 specialized agents | 3 agents | **High** |
| Chrome DevTools as first-class MCP | Referenced but optional | **High** |
| 3-layer intent routing (detailed) | 3-layer (skeletal) | **Medium** |
| Fork/Join concurrency | None | **Low** (can add later) |
| Design system MCP with foundations | templUI only (5 components) | **High** |
| Dual context detection | Single context | **Medium** |
| 20+ step files with frontmatter | 8 SKILL.md files (flat) | **High** |
| Rich resource library (50+ patterns) | 13 patterns (Go-only) | **High** |

---

## Improvement Plan

### Phase 1: Universal Foundation (restructure core)

#### 1.1 Project Manifest — Artifact Chain

Create `web-project.json` that tracks project state through the pipeline, analogous to App Studio's `application.json → route-inventory → spec.json` chain.

```jsonc
// web-project.json (auto-generated, tracked in .ui-studio/)
{
  "name": "my-saas-app",
  "stack": {
    "id": "go-templ-htmx",       // or "nextjs", "sveltekit", "nuxt3", "rails-hotwire"
    "language": "go",
    "framework": "chi",
    "renderer": "server",         // "server" | "client" | "hybrid"
    "designSystem": "templui"     // or "shadcn", "vuetify", "skeleton", "custom"
  },
  "status": "scaffolded",         // scaffolded → authed → featured → styled → verified → shipped
  "features": [
    {
      "name": "auth",
      "type": "auth-jwt",
      "status": "verified",       // planned → built → verified
      "routes": ["/login", "/register", "/forgot-password"]
    },
    {
      "name": "billing",
      "type": "stripe-checkout",
      "status": "built",
      "routes": ["/billing", "/billing/success"]
    }
  ],
  "routes": [
    { "path": "/", "handler": "home", "auth": false, "verified": true },
    { "path": "/dashboard", "handler": "dashboard", "auth": true, "verified": false }
  ],
  "verifications": [
    { "route": "/", "screenshot": ".ui-studio/screenshots/home-v1.png", "timestamp": "2025-03-20T..." }
  ]
}
```

**Why:** This gives the orchestrator state awareness. It knows what's been built, what's verified, what's next. App Studio's consistency comes from never losing track of where you are in the pipeline.

#### 1.2 Adopt 3-Phase Step Protocol

Migrate skills from flat SKILL.md to structured step files with frontmatter:

**Before (current):**
```markdown
# build-service
## Inputs
- serviceName
## Steps
1. Create handler
2. Create service
3. Create repository
...
## Success Criteria
- go build ./...
```

**After (app-studio style):**
```yaml
---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - pattern://web/routing.md
  - pattern://web/data-access.md
  - pattern://{stackId}/service-layer.md
---

## Phase 1 — Analyze
Research subagent: read web-project.json, identify existing routes and services,
return manifest of what the new service needs (routes, data model, API calls).

**SetItems from**: manifest.routes[]

## Phase 2 — Do
For each route: launch web-builder agent with route spec.
Agent reads stack-specific pattern from MCP, implements route handler + service + data layer.
Commit per route: `feat({serviceName}): add {route.path}`

## Phase 3 — Verify
- Run stack build command (go build, npm run build, etc.)
- Start dev server
- Navigate to each route via Chrome DevTools
- Screenshot each route
- Check console for errors
- Update web-project.json with verification results
```

**Files to create:**
```
plugins/web-studio/
  steps/
    scaffold/
      init-project.md          # Phase 1-2-3: scaffold project structure
      verify-scaffold.md       # Chrome: does the app load?
    auth/
      build-auth.md            # Phase 1-2-3: auth system
      verify-auth.md           # Chrome: login flow works?
    feature/
      build-service.md         # Phase 1-2-3: add domain service
      build-page.md            # Phase 1-2-3: add page/route
      build-component.md       # Phase 1-2-3: interactive component
    integration/
      build-payments.md        # Stripe/LemonSqueezy
      build-email.md           # Transactional email
      build-realtime.md        # SSE/WebSocket
    delivery/
      smoke-test.md            # Full visual verification
      ship.md                  # Lint, test, commit
```

#### 1.3 Strict Verification Rules

Add to `rules/orchestrator-guide.md`:

```markdown
## Verification Rules

**No-excuses rule**: These are not valid reasons to skip verification:
- "Dev server won't start" — fix it. The build is broken.
- "Chrome isn't available" — set it up. Visual verification is mandatory.
- "Tests can't run" — they can. Fix the environment.
- "The code looks right" — looking right is not evidence. Run it.

**Fix-it-don't-skip-it rule**: When something fails, that is not an excuse to
skip. Call Next(failed) — the workflow handles retries and escalation.

**Status update rule**: Do not update web-project.json status until Phase 3
verification passes. A status update without verification is a false claim.

**Evidence rule**: Every verification produces an artifact:
- Screenshot saved to `.ui-studio/screenshots/{feature}-v{N}.png`
- Build output captured
- Console errors logged
- Route accessibility confirmed
```

#### 1.4 Restructure Plugin Directory

```
plugins/
  web-studio/                    # Renamed from go-studio (web-universal)
    hooks/
      session-start.mjs          # Enhanced: detects stack, loads adapter
    rules/
      orchestrator-guide.md      # Universal orchestration + verification rules
      intent-routing.md          # Richer 3-layer routing
      web-conventions.md         # Universal web patterns (replaces go-conventions.md)
      commands.md                # Expanded command set
      artifacts.md               # Artifact chain documentation
      code-quality.md            # NEW: universal code quality rules
    agents/
      web-builder.md             # Universal: reads stack adapter patterns
      web-reviewer.md            # Universal: reviews against web + stack conventions
      web-designer.md            # NEW: layout, responsive, accessibility
      web-architect.md           # NEW: project structure, data flow decisions
    skills/                      # High-level pipeline commands (Layer 2)
      scaffold-app/SKILL.md
      build-auth/SKILL.md
      build-feature/SKILL.md     # Generic (replaces build-service)
      build-page/SKILL.md        # NEW
      build-component/SKILL.md   # NEW (replaces build-htmx-component)
      build-payments/SKILL.md
      build-realtime/SKILL.md
      build-email/SKILL.md       # NEW
      smoke-test/SKILL.md
      ship/SKILL.md              # NEW: lint + test + commit
    steps/                       # 3-phase step files (Layer 1)
      scaffold/
      auth/
      feature/
      integration/
      delivery/
    workflows/
      web-app-delivery/workflow.json    # Enhanced pipeline
      feature-delivery/workflow.json    # NEW: single feature workflow
```

---

### Phase 2: Web Patterns MCP (tech-agnostic knowledge)

#### 2.1 Universal Web Patterns MCP

Replace `go-stack-mcp` with a **two-tier pattern system**:

```
web-patterns-mcp/
  resources/
    universal/                   # Apply to ANY web stack
      routing.md                 # URL structure, params, guards, middleware
      authentication.md          # Auth flows: JWT, session, OAuth, magic link
      authorization.md           # RBAC, permissions, guards
      data-access.md             # Repository pattern, ORM vs raw SQL, migrations
      forms.md                   # Validation, error display, multi-step
      state-management.md        # Client state, server state, URL state
      error-handling.md          # Error boundaries, user-facing errors, logging
      api-design.md              # REST conventions, GraphQL, tRPC
      responsive-layout.md       # Mobile-first, breakpoints, container queries
      accessibility.md           # WCAG, ARIA, keyboard nav, screen readers
      performance.md             # Core Web Vitals, lazy loading, caching
      security.md                # CSRF, XSS, CSP, rate limiting, input sanitization
      testing.md                 # Unit, integration, e2e, visual regression
      realtime.md                # SSE, WebSocket, polling patterns
      payments.md                # Checkout flows, webhooks, subscription lifecycle
      email.md                   # Transactional, templates, delivery
      file-uploads.md            # Presigned URLs, streaming, validation
      search.md                  # Full-text, filters, pagination
      deployment.md              # Docker, CI/CD, health checks, migrations

    stacks/                      # Stack-specific implementations
      go-templ-htmx/
        project-structure.md     # cmd/server/, internal/, templates/
        handlers.md              # chi routing, request/response
        services.md              # Business logic layer
        repositories.md          # pgx/sqlx data access
        templ-components.md      # Templ syntax, composition
        htmx-patterns.md         # hx-*, OOB swaps, SSE extension
        auth-impl.md             # Go-specific auth implementation
        migrations.md            # Goose patterns

      nextjs-react/
        project-structure.md     # app/, pages/, components/, lib/
        server-actions.md        # Server actions, form handling
        api-routes.md            # Route handlers, middleware
        components.md            # React component patterns
        state.md                 # Zustand/Jotai/React Query
        auth-impl.md             # NextAuth.js / Clerk / Lucia
        prisma.md                # Prisma ORM patterns

      sveltekit-svelte/
        project-structure.md     # routes/, lib/, components/
        load-functions.md        # +page.server.ts, +layout.server.ts
        form-actions.md          # Progressive enhancement
        components.md            # Svelte component patterns
        state.md                 # Stores, derived
        auth-impl.md             # SvelteKit auth patterns

      nuxt3-vue/
        project-structure.md     # pages/, components/, composables/, server/
        server-routes.md         # Nitro server routes
        composables.md           # useAsyncData, useFetch, custom composables
        components.md            # Vue 3 composition API
        state.md                 # Pinia stores
        auth-impl.md            # Nuxt auth patterns

      rails-hotwire/
        project-structure.md     # app/controllers/, models/, views/
        controllers.md           # Rails controller patterns
        turbo-frames.md          # Turbo frames and streams
        stimulus.md              # Stimulus controllers
        models.md                # ActiveRecord patterns
        auth-impl.md             # Devise / custom auth
```

**MCP tools:**
```typescript
// Tools exposed by web-patterns-mcp
{
  list_resources(category: 'universal' | 'stack' | 'all', stackId?: string)
  search_resources(query: string, stackId?: string)  // NEW: keyword search like app-studio
  get_pattern(id: string, stackId?: string)           // Resolve universal + stack-specific
}
```

**Key design**: When an agent asks for "authentication", the MCP returns the **universal pattern** (auth flows, token management, session lifecycle) PLUS the **stack-specific implementation** (e.g., Go JWT middleware, or NextAuth.js config). The agent gets both the "what" and the "how for this stack."

#### 2.2 Design System Abstraction MCP

Replace `templui-mcp` with a pluggable design system MCP:

```
design-system-mcp/
  resources/
    foundations/
      color-system.md            # Token-based colors, dark mode
      typography.md              # Scale, responsive, font loading
      spacing.md                 # Consistent spacing system
      layout.md                  # Grid, flexbox, container patterns
      motion.md                  # Transitions, animations, reduced-motion

    components/                  # Universal component patterns (what, not how)
      button.md                  # Variants, states, accessibility
      input.md                   # Text, select, checkbox, radio, validation
      card.md                    # Container patterns
      table.md                   # Data display, sorting, pagination
      modal.md                   # Dialog patterns, focus trap
      toast.md                   # Notifications, auto-dismiss
      form.md                    # Layout, validation, error display
      navigation.md              # Sidebar, breadcrumb, tabs
      loading.md                 # Skeleton, spinner, progress

    implementations/             # Stack-specific component libraries
      templui.md                 # templUI v1.6 (Go/Templ)
      shadcn-react.md            # shadcn/ui for React
      shadcn-svelte.md           # shadcn-svelte
      vuetify.md                 # Vuetify 3
      nuxt-ui.md                 # Nuxt UI
      daisyui.md                 # DaisyUI (any framework)
```

**MCP tools:**
```typescript
{
  list_components(designSystem?: string)
  search_components(query: string, designSystem?: string)
  get_component(name: string, designSystem?: string)  // Universal + implementation
}
```

---

### Phase 3: Enhanced Agents & Orchestration

#### 3.1 Agent Roster (6 agents, up from 3)

| Agent | Role | When Used |
|---|---|---|
| **web-builder** | Implements features using universal + stack patterns | Phase 2 of any build step |
| **web-reviewer** | Reviews code against web conventions + stack patterns | Phase 3, or on-demand |
| **web-designer** | Layout, responsive design, accessibility, design system usage | Steps involving UI (pages, components) |
| **web-architect** | Project structure decisions, data flow, API design | Phase 1 analysis, scaffold steps |
| **web-tester** | Writes and runs tests (unit, integration, e2e) | Verification steps, ship step |
| **mobile-builder** | Flutter/React Native screens consuming the web API | Mobile extension steps |

Each agent's prompt includes:
```markdown
## MCP Awareness
- **web-patterns** (universal + stack): Call `search_resources()` BEFORE writing code
- **design-system** (components + implementation): Call `search_components()` for any UI
- **chrome-devtools**: Visual verification of rendered output

## Stack Context
You are working on a {stackId} project. Read `pattern://{stackId}/*` resources
for stack-specific implementation patterns. Universal patterns tell you WHAT;
stack patterns tell you HOW.
```

#### 3.2 Richer Intent Routing

```markdown
### Layer 1: Ad-hoc step (default)

| User says | Step file |
|---|---|
| "scaffold the project", "init the app" | steps/scaffold/init-project.md |
| "add auth", "build login" | steps/auth/build-auth.md |
| "add a service", "build {feature}" | steps/feature/build-service.md |
| "add a page", "create the dashboard" | steps/feature/build-page.md |
| "build a component", "add a form" | steps/feature/build-component.md |
| "add payments", "integrate Stripe" | steps/integration/build-payments.md |
| "add email", "send notifications" | steps/integration/build-email.md |
| "add realtime", "add live updates" | steps/integration/build-realtime.md |
| "test it", "does it work?" | steps/delivery/smoke-test.md |
| "ship it", "commit and push" | steps/delivery/ship.md |
| "make it responsive", "mobile support" | steps/feature/add-responsive.md |
| "review the code" | steps/delivery/review.md |

### Layer 2: Pipeline command

| User says | Skill |
|---|---|
| "build this app", "full delivery" | /web-studio:deliver |
| "add {feature} end to end" | /web-studio:feature {name} |
| "scaffold and set up" | /web-studio:scaffold |

### Layer 3: Navigator workflow (explicit only)

| User says | Workflow |
|---|---|
| "run the full delivery pipeline" | web-app-delivery |
| "walk me through building {feature}" | feature-delivery |
```

#### 3.3 Enhanced Workflow

**web-app-delivery/workflow.json** (expanded from 11 to 15 nodes):

```
START (collect: appName, stackId, designSystem, features[])
  ↓ scaffold (3-phase step)
  ↓ scaffold_verify (gate: build + Chrome loads)
  ↓ build_auth (3-phase step, if auth in features)
  ↓ auth_verify (gate: build + Chrome login flow)
  ↓ build_features (fork: one per feature, SetItems)
  ↓   ├─ feature_N (3-phase step)
  ↓   └─ feature_N_verify (gate per feature)
  ↓ build_integrations (fork: payments, email, realtime)
  ↓   ├─ integration_N (3-phase step)
  ↓   └─ integration_N_verify (gate per integration)
  ↓ responsive_pass (3-phase: make all pages responsive)
  ↓ responsive_verify (gate: Chrome mobile viewport)
  ↓ smoke_test (full visual verification, all routes)
  ↓ ship (lint + test + commit + optional push)
  ↓ END_SUCCESS / HITL_BLOCKED
```

**feature-delivery/workflow.json** (NEW — single feature):
```
START (collect: featureName, routes[], dataModel)
  ↓ analyze (Phase 1: research existing code, find patterns)
  ↓ build_data_layer (service + repository + migration)
  ↓ build_routes (handler/controller per route)
  ↓ build_ui (pages + components)
  ↓ verify (Chrome: all routes render, forms work)
  ↓ ship (lint + test + commit)
  ↓ END_SUCCESS
```

---

### Phase 4: Generator Enhancement

The generator currently produces minimal studios. Enhance it to produce studios with the same consistency guarantees:

#### 4.1 Generated Studio Structure

When `create_studio` runs, the assembled studio should include:

```
{studio-name}/
  hooks/session-start.mjs        # With 3-phase protocol + verification rules
  rules/
    orchestrator-guide.md         # Full orchestration guide (not skeleton)
    intent-routing.md             # 3-layer routing with detected skills
    web-conventions.md            # Universal + inferred conventions
    code-quality.md               # Verification rules
    commands.md
    artifacts.md
  agents/
    web-builder.md                # With MCP awareness for detected stack
    web-reviewer.md
    web-designer.md               # If UI-heavy stack detected
    web-architect.md              # If complex project structure detected
  skills/
    scaffold-app/SKILL.md         # Adapted to detected stack
    build-auth/SKILL.md           # If auth detected in features
    build-feature/SKILL.md        # Generic service/feature builder
    build-page/SKILL.md
    build-component/SKILL.md
    smoke-test/SKILL.md
    ship/SKILL.md
  steps/                          # 3-phase step files
    scaffold/init-project.md
    auth/build-auth.md
    feature/build-service.md
    feature/build-page.md
    delivery/smoke-test.md
    delivery/ship.md
  workflows/
    web-app-delivery/workflow.json
    feature-delivery/workflow.json
  mcp/                            # Stack-specific pattern server
    index.ts
    resources/patterns/           # Inferred + template patterns
    resources/guides/
```

#### 4.2 Enhanced Inferrer

The inferrer should produce **two tiers** of patterns:

1. **Universal patterns** — always included (routing, auth flows, data access, error handling)
2. **Stack patterns** — inferred from source code (specific to detected framework)

```typescript
// inferrer.ts changes
interface InferredStudio {
  universalPatterns: Pattern[];     // From web-patterns-mcp templates
  stackPatterns: Pattern[];          // From source analysis
  detectedFeatures: Feature[];       // Auth, payments, realtime, etc.
  projectStructure: Structure;       // Directory conventions
  designSystem: DesignSystemInfo;    // Detected component library
  conventions: Convention[];         // Naming, file org, error handling
}
```

#### 4.3 Assembler Templates

Update `templates.ts` to generate:
- Full orchestrator-guide.md (not skeleton) with verification rules
- 3-phase step files (not flat skills)
- Agent prompts with MCP awareness
- Workflow JSON with gates and verification

---

### Phase 5: Chrome DevTools as First-Class Citizen

#### 5.1 Mandatory Visual Verification

Chrome DevTools should be required, not optional. Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "web-patterns": { "command": "bun", "args": ["web-patterns-mcp/index.ts"] },
    "design-system": { "command": "bun", "args": ["design-system-mcp/index.ts"] },
    "chrome-devtools": { "command": "npx", "args": ["@anthropic/chrome-devtools-mcp"] }
  }
}
```

#### 5.2 Verification Procedures

Create reusable verification procedures (like App Studio's `procedure://smoke-test.md`):

```
web-patterns-mcp/resources/procedures/
  smoke-test.md          # Navigate to route, screenshot, check console
  responsive-check.md    # Test at 3 viewports (mobile, tablet, desktop)
  accessibility-check.md # Run axe-core, check keyboard nav
  form-test.md           # Fill form, submit, check validation
  auth-flow-test.md      # Register → login → protected page → logout
```

---

## Implementation Order

| Priority | Phase | Effort | Impact |
|---|---|---|---|
| **P0** | 1.2 — 3-phase step protocol | 2 days | Consistency foundation |
| **P0** | 1.3 — Verification rules | 1 day | Quality enforcement |
| **P1** | 1.1 — Project manifest | 1 day | State awareness |
| **P1** | 2.1 — Universal web patterns | 3 days | Tech-agnostic knowledge |
| **P1** | 1.4 — Plugin restructure | 2 days | Clean architecture |
| **P2** | 3.1 — Agent roster expansion | 2 days | Specialization |
| **P2** | 2.2 — Design system abstraction | 2 days | Component agnosticism |
| **P2** | 5.1-5.2 — Chrome DevTools integration | 1 day | Visual verification |
| **P3** | 3.2-3.3 — Enhanced routing + workflows | 2 days | Richer orchestration |
| **P3** | 4.1-4.3 — Generator enhancement | 3 days | Generated studio quality |

**Total estimated effort: ~19 days**

---

## Success Criteria

1. **Tech-agnostic**: A user can say "build me a SaaS app with Next.js" or "build me a SaaS with Go+Templ" and get equally consistent results
2. **3-phase verified**: Every step follows Analyze → Do → Verify. No step passes without evidence
3. **Visual verification**: Every route is screenshot-verified via Chrome DevTools before marking complete
4. **Artifact chain**: `web-project.json` tracks full project state; orchestrator always knows where it is
5. **Pattern-driven**: Agents always read universal + stack patterns before writing code
6. **Design system pluggable**: Works with shadcn, templUI, Vuetify, DaisyUI, or custom
7. **Generator produces consistent studios**: New studios from `create_studio` have full verification rules and 3-phase steps

---

## What NOT to Change

- **Navigator integration** — already works, same contract as App Studio
- **Session-start hook pattern** — proven, just extend it
- **MCP-as-knowledge pattern** — core insight, just expand the knowledge
- **Orchestrator+delegation** — correct architecture, just add agents
- **Generator concept** — unique differentiator, just make output richer
