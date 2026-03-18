# ui-studio

A self-expanding studio generator. Creates specialized Claude Code studios for any tech stack by inferring patterns from existing code or accepting user-defined conventions.

## Project Structure

This is the **source monorepo** for ui-studio. When making changes, always edit files here — never in `~/.claude/plugins/cache/` (those are runtime copies).

- `plugins/go-studio/` — Claude Code plugin (hooks, rules, agents, skills, workflows)
- `go-stack-mcp/` — MCP server for Go+Templ+HTMX patterns and guides
- `templui-mcp/` — MCP server for templUI v1.6 component documentation

## Standard App Stack

Every client app is built with:

- **Backend**: Go 1.25, chi v5 router, PostgreSQL (pgx/v5 + sqlx), Goose migrations
- **Frontend**: Templ v0.3+, HTMX 2.x, Tailwind CSS v4, templUI v1.6
- **Auth**: JWT + magic link + OAuth (Google/GitHub) + optional TOTP
- **Payments**: Stripe (pattern at `go-stack-mcp/resources/patterns/stripe-integration.md`)
- **AI**: OpenRouter (LLM calls)
- **Real-time**: SSE streaming
- **Email**: Resend
- **Storage**: S3-compatible (MinIO dev, Cloudflare R2 prod)
- **Testing**: Playwright E2E

## Key Conventions

- App server runs at `localhost:8080` (dev)
- Templ components in `internal/ui/components/`, pages in `internal/ui/pages/`
- Assets compiled with `npm run build` (Tailwind v4 via PostCSS)
- Goose migrations embedded in binary via `//go:embed`
- Health check at `/health`
- SSE endpoint at `/api/sse`

## SessionStart Hook

`plugins/go-studio/hooks/session-start.mjs` injects Go Studio orchestrator context at session start by reading rule fragments from `plugins/go-studio/rules/`.

## Committing

**Do NOT commit unless the user explicitly asks.**

```bash
git commit -m "feat: add stripe integration to {appName}"
git commit -m "fix: correct JWT expiry in auth middleware"
```

## Linear

Project tracking uses Linear. Create issues before starting significant work.
