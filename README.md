# ui-studio

A self-expanding studio generator. Creates specialized Claude Code studios for any tech stack by inferring patterns from existing code or accepting user-defined conventions.

## What it does

ui-studio generates Claude Code plugins ("studios") tailored to a specific project. Each studio ships with:

- An MCP server exposing patterns and guides for the stack
- A session-start hook that injects orchestrator context
- Rules and skills for building features in that stack

Studios are installed to `~/.claude/plugins/` and registered in `~/.claude/settings.json` automatically.

## Repo structure

```
go-stack-mcp/          MCP server — Go+Templ+HTMX patterns and guides
templui-mcp/           MCP server — templUI v1.6 component docs
web-patterns-mcp/      MCP server — universal web patterns + stack-specific adapters
design-system-mcp/     MCP server — design system component docs (pluggable)
navigator-mcp/         MCP server — passive workflow graph walker
generator/             Studio generator (MCP server + OpenTUI CLI)
plugins/
  go-studio/           Claude Code plugin for the Go SaaS stack
  web-studio/          Claude Code plugin for stack-agnostic web applications
  studio-generator/    Claude Code plugin that exposes the generator
docs/                  GitHub Pages landing (ui-studio.devoured.io)
```

## Requirements

- [Bun](https://bun.sh) >= 1.0
- [Claude Code](https://claude.ai/code)

## Install

```bash
git clone https://github.com/dvrd/ui-studio
cd ui-studio
bun install
```

Then register the studio-generator plugin in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ui-studio-generator": {
      "command": "bun",
      "args": ["/path/to/ui-studio/generator/index.ts"]
    }
  }
}
```

Restart Claude Code. The generator is now available as an MCP tool and via the `/create-studio` skill.

## Usage

### Option 1 — from existing code

Point the generator at a project directory. It detects the stack and infers patterns from your handlers, services, components, and routes.

```
create_studio(
  name: "myapp-studio",
  project_path: "/path/to/myapp"
)
```

### Option 2 — from scratch

Describe the stack and provide conventions manually.

```
create_studio(
  name: "nextjs-studio",
  stack_description: "Next.js 14 + Drizzle ORM + Stripe + Clerk auth",
  user_conventions: "Use server actions for mutations. Keep components in src/components/..."
)
```

### Option 3 — interactive CLI

```bash
bun run generator/cli.ts
```

A terminal wizard walks through name, project path, and stack description step by step.

### Expand an existing studio

After adding more code to a project, refresh the studio's inferred patterns:

```
expand_studio(name: "myapp-studio", project_path: "/path/to/myapp")
```

### List / remove studios

```
list_studios()
remove_studio(name: "myapp-studio")
```

## Built-in studios

### web-studio (stack-agnostic)

`plugins/web-studio/` works with any web framework. It uses a 3-phase step protocol (Analyze → Do → Verify) and 3-layer intent routing.

**Supported stacks**: Go+Templ+HTMX, Next.js/React, SvelteKit/Svelte, Nuxt/Vue — and any other web framework through universal patterns.

**MCP servers**: `web-patterns` (universal patterns + stack adapters), `design-system` (component docs), `chrome-devtools` (visual verification), `navigator` (workflow graph walker).

| Command | What it does |
|---|---|
| `/web-studio:scaffold-app` | Scaffold a new web application (any stack) |
| `/web-studio:build-auth` | Add authentication (JWT, session, OAuth, magic link) |
| `/web-studio:build-feature [name]` | Add a domain feature (service + routes + UI) |
| `/web-studio:build-page [name]` | Add a new page/route |
| `/web-studio:build-component [name]` | Build an interactive component |
| `/web-studio:build-payments` | Add payment integration (Stripe/LemonSqueezy) |
| `/web-studio:build-email` | Add transactional email |
| `/web-studio:build-realtime` | Add real-time updates (SSE/WebSocket) |
| `/web-studio:build-tests` | Write unit + integration tests for all features |
| `/web-studio:add-responsive` | Make all pages responsive (mobile + tablet + desktop) |
| `/web-studio:build-mobile [name]` | Build a mobile screen consuming the web API |
| `/web-studio:smoke-test` | Visual smoke test via Chrome DevTools |
| `/web-studio:review` | Full code review (security, correctness, conventions) |
| `/web-studio:ship` | Lint, test, and commit |
| `/web-studio:deliver` | Full delivery pipeline (scaffold → auth → features → responsive → tests → verify → ship) |

### go-studio (Go SaaS stack)

`plugins/go-studio/` is a fully built studio for the standard Go SaaS stack:

| Stack component | Choice |
|---|---|
| Router | chi v5 |
| Database | PostgreSQL via pgx/v5 + sqlx |
| Migrations | Goose (embedded) |
| Frontend | Templ v0.3 + HTMX 2.x + Tailwind v4 + templUI v1.6 |
| Auth | JWT + magic link + OAuth (Google/GitHub) + TOTP |
| Payments | Stripe + Polar |
| Real-time | SSE |
| Email | Resend |
| Storage | S3-compatible (MinIO dev / Cloudflare R2 prod) |
| AI | OpenRouter |

| Command | What it does |
|---|---|
| `/go-studio:scaffold-app` | Scaffold a new Go SaaS app |
| `/go-studio:build-auth` | Add JWT + magic link + OAuth |
| `/go-studio:build-service [name]` | Add a domain service (handler + service + repo + migration) |
| `/go-studio:build-htmx-component [name]` | Build a Templ+HTMX component |
| `/go-studio:build-stripe` | Add Stripe Checkout + webhooks |
| `/go-studio:build-sse` | Add SSE real-time endpoint |
| `/go-studio:build-flutter` | Build a Flutter mobile screen |
| `/go-studio:smoke-test` | Visual smoke test via Chrome DevTools |

## Supported stacks (auto-detection)

| Detection file | Stack |
|---|---|
| `go.mod` | Go |
| `package.json` | Node / TypeScript |
| `requirements.txt` / `pyproject.toml` | Python |
| `pubspec.yaml` | Flutter / Dart |
| `Cargo.toml` | Rust |

## Landing page

[ui-studio.devoured.io](https://ui-studio.devoured.io) — hosted on GitHub Pages from `docs/`.
