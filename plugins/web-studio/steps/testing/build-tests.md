---
agent: web-tester
requires: [projectDir, stackId]
resources:
  - universal://testing.md
---

# Build Tests

Write automated tests for the application's features.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read `.ui-studio/web-project.json` to get all features
- Read `universal://testing.md` for test strategy
- Scan existing code to identify untested services and routes
- Return manifest:

```json
{
  "found": true,
  "testFramework": "go test",
  "features": [
    {
      "name": "auth",
      "unitTests": [
        { "target": "services/auth.go", "tests": ["validate email", "hash password", "generate token"] }
      ],
      "integrationTests": [
        { "target": "POST /register", "tests": ["creates user", "rejects duplicate email"] },
        { "target": "POST /login", "tests": ["returns token", "rejects wrong password"] }
      ]
    },
    {
      "name": "campaigns",
      "unitTests": [
        { "target": "services/campaign.go", "tests": ["validate title", "enforce status enum"] }
      ],
      "integrationTests": [
        { "target": "GET /campaigns", "tests": ["lists user campaigns", "requires auth"] },
        { "target": "POST /campaigns", "tests": ["creates campaign", "validates input"] }
      ]
    }
  ]
}
```

**SetItems from**: manifest.features[]

## Phase 2 — Do

For each feature, launch **web-tester** subagent:
- Read testing patterns (universal + stack-specific)
- Write unit tests for service/business logic
- Write integration tests for API routes
- Run tests — fix failures before reporting
- Report: files created, pass/fail counts

Commit per feature: `test({feature}): add unit and integration tests`

## Phase 3 — Verify

Orchestrator runs the full test suite:

1. **Run all tests**: Execute the stack's test command
   - `go-templ-htmx`: `go test ./...`
   - `nextjs-react`: `npx vitest run`
   - `sveltekit-svelte`: `npx vitest run`
   - `nuxt3-vue`: `npx vitest run`

2. **Parse results**: Count total, passed, failed, skipped

3. **Coverage** (if available): Report coverage percentage

**Report format**:
```
Test Suite Results:

Total: N tests
Passed: N
Failed: N
Skipped: N
Coverage: N% (if available)

Per-feature breakdown:
  auth: N/N passed
  campaigns: N/N passed
```

**Pass criteria**: All tests pass.
**Fail criteria**: Any test fails.
