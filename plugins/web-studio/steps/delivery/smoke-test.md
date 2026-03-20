---
requires: [projectDir, stackId]
resources:
  - universal://testing.md
---

# Smoke Test

Full visual verification of all routes in the application.

## Phase 1 — Analyze

Orchestrator reads `.ui-studio/web-project.json`:
- Extract all routes from features array
- Extract port and stackId
- Return manifest of routes to verify:

```json
{
  "found": true,
  "routes": [
    { "path": "/", "auth": false, "feature": "scaffold" },
    { "path": "/login", "auth": false, "feature": "auth" },
    { "path": "/register", "auth": false, "feature": "auth" },
    { "path": "/dashboard", "auth": true, "feature": "dashboard" },
    { "path": "/campaigns", "auth": true, "feature": "campaigns" },
    { "path": "/billing", "auth": true, "feature": "billing" }
  ],
  "port": 8080
}
```

**SetItems from**: manifest.routes[]

## Phase 2 — Do

For each route, orchestrator performs Chrome DevTools verification:

1. **Navigate**: `chrome-devtools: navigate_page({ url: "http://localhost:{port}{path}" })`
2. **Wait**: `chrome-devtools: wait_for({ timeout: 10000 })` for content to load
3. **Screenshot desktop**: `chrome-devtools: take_screenshot({ filePath: ".ui-studio/screenshots/{feature}-v{N}.png" })`
4. **Screenshot mobile**: Resize to 375x812, screenshot to `.ui-studio/screenshots/{feature}-mobile-v{N}.png`, resize back
5. **Console check**: `chrome-devtools: list_console_messages()` — fail if error-level messages
6. **Network check**: `chrome-devtools: list_network_requests()` — fail if 5xx responses

## Phase 3 — Verify

After all routes checked:

1. **Summary**: Count passes and failures across all routes
2. **Console errors**: Aggregate all console errors
3. **Network failures**: Aggregate all failed requests
4. **Update manifest**: Mark each route as `verified: true/false` in `.ui-studio/web-project.json`
5. **Update status**: If all routes pass, set project status to `"verified"`

**Report format**:
```
Smoke test summary:

Routes tested: N
Passed: N
Failed: N

[For each route:]
  {path}: PASS/FAIL
    Console errors: N
    Network failures: N
    Screenshots: desktop + mobile

Overall: PASS / FAIL
```

**Pass criteria**: All routes render without console errors or 5xx responses.
**Fail criteria**: Any route fails to load or has errors.
