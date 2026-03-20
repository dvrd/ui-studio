---
description: Lint, test, and commit the application.
user-invocable: true
---

# Ship

Final quality checks and commit.

## Prerequisites

- All features built
- Smoke test passed (or at minimum, build passes)

## Steps

1. `steps/delivery/ship.md` — Lint, type check, test, stage, and commit

## Success Criteria

- Lint passes
- Build passes
- Tests pass (if they exist)
- Clean git working tree after commit
- `.ui-studio/web-project.json` status set to `"shipped"`
