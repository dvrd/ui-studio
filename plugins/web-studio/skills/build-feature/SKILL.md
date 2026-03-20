---
description: Add a new domain feature with full CRUD (data model, service, routes, UI).
user-invocable: true
agent: web-studio:web-builder
---

# Build Feature

Adds a complete domain feature: data model, data access, business logic, route handlers, and UI pages.

## Inputs

Confirm with user:
- `featureName` — name in snake_case (e.g. `campaign`, `lead`, `subscription`)
- Resource fields — what data does this entity have?
- Auth required? (default: yes)
- Which operations? (list, get, create, update, delete — default: all)

## Steps

1. `steps/feature/build-service.md` — Build data model, repository, service, handlers, and UI
2. `steps/delivery/smoke-test.md` — Visual verification of feature routes (scoped to this feature)

## Success Criteria

- Build passes
- All CRUD routes registered and accessible
- Feature pages render correctly
- `.ui-studio/web-project.json` updated with feature
