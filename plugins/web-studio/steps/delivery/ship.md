---
requires: [projectDir, stackId]
---

# Ship

Lint, test, and commit the application.

## Phase 1 — Analyze

Orchestrator checks project state:
- Read `.ui-studio/web-project.json` — confirm status is `"verified"` or all features are `"built"`
- Run `git status` to see uncommitted changes
- Run `git log --oneline -5` to see recent commit style
- Return manifest:

```json
{
  "found": true,
  "status": "verified",
  "uncommittedFiles": ["file1", "file2"],
  "commitStyle": "conventional",
  "features": ["auth", "campaigns", "billing"]
}
```

## Phase 2 — Do

1. **Lint**: Run the stack's linter
   - `go-templ-htmx`: `go vet ./...`
   - `nextjs-react`: `npx eslint .`
   - `sveltekit-svelte`: `npx eslint .`
   - `nuxt3-vue`: `npx eslint .`
   - Fix any auto-fixable issues

2. **Type check**: Run the stack's type checker
   - `go-templ-htmx`: `go build ./...`
   - `nextjs-react`: `npx tsc --noEmit`
   - `sveltekit-svelte`: `npx svelte-check`

3. **Test**: Run tests if they exist
   - `go-templ-htmx`: `go test ./...`
   - `nextjs-react`: `npx jest` or `npx vitest run`
   - Others: `npm test`

4. **Stage and commit**:
   - Stage all relevant files (not `.env`, not `node_modules/`)
   - Commit with conventional message based on what was built

## Phase 3 — Verify

1. **Build check**: Final build must pass
2. **Git check**: `git status` shows clean working tree
3. **Update manifest**: Set project status to `"shipped"` in `.ui-studio/web-project.json`

**Pass criteria**: Lint passes AND build passes AND commit succeeds.
**Fail criteria**: Lint fails OR build fails.
