---
agent: web-reviewer
requires: [projectDir, stackId]
resources:
  - stack://{stackId}/project-structure.md
---

# Verify Scaffold

Visual verification that the scaffolded project loads in the browser.

## Phase 1 — Analyze

Orchestrator reads `.ui-studio/web-project.json`:
- Confirm status is `"scaffolded"`
- Extract stackId, port, appName
- Return manifest of routes to verify: `[{ "path": "/", "expected": "home page content" }]`

## Phase 2 — Do

1. Start dev server for the stack:
   - `go-templ-htmx`: `go run cmd/server/main.go`
   - `nextjs-react`: `npm run dev`
   - `sveltekit-svelte`: `npm run dev`
   - `nuxt3-vue`: `npx nuxi dev`
   - `rails-hotwire`: `bin/rails server`

2. Wait for server to be ready (health check or port open)

## Phase 3 — Verify

1. **Chrome**: Navigate to `http://localhost:{port}/`
2. **Screenshot**: Save to `.ui-studio/screenshots/scaffold-v1.png`
3. **Console**: Check for errors — fail if any error-level messages
4. **Network**: Check for 5xx responses — fail if any
5. **Mobile**: Resize to 375x812, screenshot to `.ui-studio/screenshots/scaffold-mobile-v1.png`
6. **Restore**: Resize back to 1440x900

**Pass criteria**: Page loads, no console errors, no 5xx responses.
**Fail criteria**: Page doesn't load, console errors, or 5xx responses.
