---
agent: mobile-builder
requires: [projectDir, stackId]
resources:
  - universal://routing.md
---

# Build Mobile Screen

Build a mobile screen that consumes the web application's API.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read `.ui-studio/web-project.json` to get available API routes
- Confirm with user: screen name, which API endpoints to consume, mobile framework
- Return manifest:

```json
{
  "found": true,
  "screenName": "CampaignList",
  "mobileFramework": "flutter",
  "apiEndpoints": [
    { "method": "GET", "path": "/api/campaigns", "purpose": "list campaigns" },
    { "method": "POST", "path": "/api/campaigns", "purpose": "create campaign" }
  ],
  "auth": { "type": "jwt", "headerFormat": "Bearer {token}" }
}
```

## Phase 2 — Do

Launch **mobile-builder** subagent:
- Create screen file with data fetching from API
- Implement auth header attachment
- Handle loading, error, and empty states
- Add navigation integration
- Run mobile build command

Commit: `feat(mobile): add {screenName} screen`

## Phase 3 — Verify

1. **Build check**: Mobile build command passes
2. **Structure check**: Screen file exists with API integration
3. **Visual check** (if simulator/emulator available): Screenshot

**Pass criteria**: Build passes AND screen file has API integration.
**Fail criteria**: Build fails OR missing API integration.
