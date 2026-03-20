---
agent: web-builder
requires: [appName, stackId, designSystem]
resources:
  - universal://project-structure.md
  - stack://{stackId}/project-structure.md
---

# Scaffold Project

Initialize a new web application with the standard project structure for the detected stack.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read `universal://project-structure.md` and `stack://{stackId}/project-structure.md` from web-patterns
- Read `design-system: list_components()` to know available components
- Confirm with user: `appName`, `stackId`, database name, port
- Return manifest:

```json
{
  "found": true,
  "appName": "myapp",
  "stackId": "go-templ-htmx",
  "designSystem": "templui",
  "directories": ["cmd/server/", "internal/config/", ...],
  "files": [
    { "path": "go.mod", "purpose": "Go module definition" },
    { "path": "cmd/server/main.go", "purpose": "Entry point with router setup" },
    ...
  ],
  "dependencies": ["chi", "pgx", "templ", ...],
  "config": { "port": 8080, "dbName": "myapp_dev" }
}
```

## Phase 2 — Do

Launch **web-builder** subagent with the full manifest:
- Read the stack-specific project structure pattern from web-patterns
- Read the design system components for initial layout
- Create all directories from manifest
- Write all files from manifest following stack patterns exactly
- Write initial migration (users table or equivalent)
- Write base layout with design system imports
- Write home page
- Write config/env handling
- Run dependency installation (go mod tidy / npm install / bundle install)
- Run build command

Commit: `feat({appName}): scaffold {stackId} project`

## Phase 3 — Verify

Orchestrator verifies:

1. **Build check**: Run the stack's build command (see code-quality.md table)
   - Must pass with zero errors

2. **Structure check**: Verify all directories and key files from manifest exist
   - `ls` each directory from manifest

3. **Server check** (if possible): Start dev server, check health endpoint
   - `curl -s http://localhost:{port}/health` or equivalent

4. **Update manifest**: Create `.ui-studio/web-project.json` with status `"scaffolded"`

**Pass criteria**: Build passes AND all manifest files exist.
**Fail criteria**: Build fails OR missing files.
