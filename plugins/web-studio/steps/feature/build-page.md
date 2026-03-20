---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://routing.md
  - universal://responsive-layout.md
  - stack://{stackId}/pages.md
---

# Build Page

Add a new page/route to the web application.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read universal routing and layout patterns
- Read stack-specific page patterns
- Confirm with user: page name, route path, auth required, data needs
- Return manifest:

```json
{
  "found": true,
  "pageName": "dashboard",
  "routePath": "/dashboard",
  "authRequired": true,
  "dataNeeds": ["user profile", "recent campaigns", "billing status"],
  "layout": "sidebar + main content",
  "components": ["stats-card", "recent-list", "action-button"],
  "designSystemComponents": ["card", "table", "badge"]
}
```

## Phase 2 — Do

Launch **web-builder** subagent:
- Read design-system components for available UI elements
- Create page file in stack-appropriate location
- Implement data loading (loader/server action/handler)
- Compose layout using design system components
- Add route registration if needed
- Run build command

Commit: `feat({pageName}): add {routePath} page`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Visual check** (requires Chrome + running server):
   - Navigate to `{routePath}` — screenshot desktop + mobile
   - Check console for errors
   - Check network for failed requests
3. **Update manifest**: Add route to `.ui-studio/web-project.json`

**Pass criteria**: Build passes AND page renders at route.
**Fail criteria**: Build fails OR page doesn't render.
