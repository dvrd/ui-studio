---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://routing.md
  - universal://data-access.md
  - stack://{stackId}/handlers.md
  - stack://{stackId}/services.md
  - stack://{stackId}/repositories.md
---

# Build Domain Service

Add a complete domain feature: data model, data access, business logic, route handlers, and UI.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read universal patterns for routing and data-access
- Read stack-specific patterns for handlers, services, repositories
- Read existing project code to understand current features
- Confirm with user: service name, resource fields, auth required, HTTP methods
- Return manifest:

```json
{
  "found": true,
  "serviceName": "campaign",
  "pluralName": "campaigns",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "status", "type": "enum", "values": ["draft", "active", "paused"] },
    { "name": "budget", "type": "decimal", "required": false }
  ],
  "authRequired": true,
  "methods": ["list", "get", "create", "update", "delete"],
  "routes": [
    { "path": "/{pluralName}", "method": "GET", "handler": "List" },
    { "path": "/{pluralName}/{id}", "method": "GET", "handler": "Get" },
    { "path": "/{pluralName}", "method": "POST", "handler": "Create" },
    { "path": "/{pluralName}/{id}", "method": "PUT", "handler": "Update" },
    { "path": "/{pluralName}/{id}", "method": "DELETE", "handler": "Delete" }
  ],
  "files": {
    "create": ["migration", "model", "repository", "service", "handler", "list-page", "form-component", "card-component"],
    "modify": ["main/entry point"]
  }
}
```

## Phase 2 — Do

Launch **web-builder** subagent with the full manifest:
- Read web-patterns for routing, data-access, and stack-specific patterns
- Read design-system for UI components (table, card, form, button)
- Implement in order:
  1. Migration (create table with fields)
  2. Model/type definition
  3. Repository/data access layer
  4. Service/business logic
  5. Route handlers
  6. UI pages and components
  7. Wire into main entry point / router
- Run build command

Commit: `feat({serviceName}): add {serviceName} CRUD`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Structure check**: All files from manifest exist
3. **Route check**: All routes registered and accessible
4. **Visual check** (requires Chrome + running server):
   - Navigate to `/{pluralName}` — screenshot (list page)
   - Check console for errors
5. **Update manifest**: Add feature to `.ui-studio/web-project.json` features array

**Pass criteria**: Build passes AND all files exist AND routes registered.
**Fail criteria**: Build fails OR missing files.
