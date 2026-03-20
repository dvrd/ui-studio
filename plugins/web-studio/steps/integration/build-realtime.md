---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://realtime.md
  - stack://{stackId}/realtime-impl.md
---

# Build Realtime

Add real-time updates via SSE or WebSocket.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read universal realtime pattern and stack-specific implementation
- Determine best approach for the stack (SSE for server-rendered, WebSocket for SPA)
- Confirm with user: what data should be real-time, which pages
- Return manifest:

```json
{
  "found": true,
  "transport": "sse",
  "channels": [
    { "name": "notifications", "scope": "per-user", "events": ["new-notification", "read-notification"] },
    { "name": "activity", "scope": "per-user", "events": ["status-change"] }
  ],
  "routes": [
    { "path": "/api/events", "method": "GET", "auth": true, "purpose": "SSE endpoint" }
  ],
  "files": {
    "create": ["event broker/hub", "SSE handler", "client-side listener component"],
    "modify": ["services that produce events"]
  }
}
```

## Phase 2 — Do

Launch **web-builder** subagent:
- Create event broker/hub with subscribe/unsubscribe/publish
- Create SSE/WebSocket handler
- Create client-side listener component
- Wire event publishing into existing services
- Add heartbeat (30s interval for SSE)
- Handle disconnection and reconnection
- Run build command

Commit: `feat(realtime): add {transport} real-time updates`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Endpoint check**: SSE/WebSocket endpoint returns correct Content-Type
3. **Visual check** (requires Chrome + running server):
   - Navigate to page with real-time component
   - Verify connection established (network tab shows SSE/WS connection)

**Pass criteria**: Build passes AND endpoint responds with correct headers.
**Fail criteria**: Build fails OR endpoint doesn't respond correctly.
