# ui-studio

A self-expanding studio generator. Creates specialized Claude Code studios for any tech stack by inferring patterns from existing code or accepting user-defined conventions.

## Project Structure

This is the **source monorepo** for ui-studio. When making changes, always edit files here — never in `~/.claude/plugins/cache/` (those are runtime copies).

- `plugins/go-studio/` — Claude Code plugin for the Go+Templ+HTMX SaaS stack
- `plugins/web-studio/` — Claude Code plugin for stack-agnostic web applications (Next.js, SvelteKit, Nuxt, Go+Templ, etc.)
- `plugins/studio-generator/` — Claude Code plugin that exposes the generator as a skill
- `go-stack-mcp/` — MCP server for Go+Templ+HTMX patterns and guides
- `templui-mcp/` — MCP server for templUI v1.6 component documentation
- `web-patterns-mcp/` — MCP server for universal web patterns + stack-specific adapters
- `design-system-mcp/` — MCP server for design system component documentation (pluggable)
- `navigator-mcp/` — Passive graph walker MCP for Layer 3 workflow execution
- `generator/` — Studio generator (MCP server + CLI)

## Web Studio

`plugins/web-studio/` is a stack-agnostic plugin supporting Go+Templ+HTMX, Next.js/React, SvelteKit, Nuxt/Vue, and any other web framework.

### Architecture

- **3-phase step protocol**: every task follows Analyze → Do → Verify
- **3-layer intent routing**: Layer 1 (ad-hoc step) → Layer 2 (pipeline command) → Layer 3 (Navigator workflow)
- **Universal patterns + stack adapters**: `web-patterns-mcp` serves patterns at two levels — what to build (universal) and how to build it (stack-specific)
- **Navigator integration**: `navigator-mcp` walks workflow graphs for systematic multi-step execution

### MCP Servers

- `web-patterns` — universal patterns + stack-specific adapters. Call `list_resources` before building any feature
- `design-system` — component documentation, pluggable per project
- `chrome-devtools` — browser automation for Phase 3 visual verification
- `navigator` — workflow graph walker for Layer 3 workflows only

### SessionStart Hook

`plugins/web-studio/hooks/session-start.ts` reads 7 rule fragments from `plugins/web-studio/rules/` and injects them as the orchestrator system prompt.

### Skills

| Command | What it does |
|---|---|
| `/web-studio:scaffold-app` | Scaffold a new web application (any stack) |
| `/web-studio:build-auth` | Add authentication (JWT, session, OAuth, magic link) |
| `/web-studio:build-feature [name]` | Add a domain feature (service + routes + UI) |
| `/web-studio:build-page [name]` | Add a new page/route |
| `/web-studio:build-component [name]` | Build an interactive component |
| `/web-studio:build-payments` | Add payment integration |
| `/web-studio:build-email` | Add transactional email |
| `/web-studio:build-realtime` | Add real-time updates |
| `/web-studio:build-tests` | Write unit + integration tests |
| `/web-studio:add-responsive` | Make all pages responsive |
| `/web-studio:build-mobile [name]` | Build a mobile screen consuming the web API |
| `/web-studio:smoke-test` | Visual smoke test via Chrome DevTools |
| `/web-studio:review` | Full code review |
| `/web-studio:ship` | Lint, test, and commit |
| `/web-studio:deliver` | Full delivery pipeline |

## Go Studio

`plugins/go-studio/` is a fully built studio for the standard Go SaaS stack (chi + PostgreSQL + Templ + HTMX + templUI).

`plugins/go-studio/hooks/session-start.mjs` injects Go Studio orchestrator context at session start by reading rule fragments from `plugins/go-studio/rules/`.

## Navigator MCP

Navigator is a passive graph walker. It does not drive execution — the orchestrator decides when to call each tool.

- Source files: `navigator-mcp/` (types, store, walker, index)
- Tools: `LoadWorkflows`, `Init`, `Start`, `Current`, `Next`, `SetItems`, `Diagram`
- Used only for Layer 3 explicit workflow requests

## Generator

`generator/` analyzes any codebase and produces a complete Claude Code plugin. Generated studios include:
- 3-phase Step Execution Protocol (Analyze → Do → Verify)
- 3-layer intent routing
- `code-quality.md` with no-excuses verification rules
- `navigator-usage.md` with Navigator contract
- `chrome-devtools` and `navigator` MCP servers (when navigator-mcp is available)

## Committing

**Do NOT commit unless the user explicitly asks.**

```bash
git commit -m "feat: add stripe integration to {appName}"
git commit -m "fix: correct JWT expiry in auth middleware"
```
