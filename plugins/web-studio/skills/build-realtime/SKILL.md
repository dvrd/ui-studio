---
description: Add real-time updates via SSE or WebSocket.
user-invocable: true
agent: web-studio:web-builder
---

# Build Realtime

Adds real-time updates for live data, notifications, or activity feeds.

## Inputs

Confirm with user:
- Transport: SSE (default for server-rendered) or WebSocket
- What data should be real-time?
- Which pages need live updates?

## Steps

1. `steps/integration/build-realtime.md` — Build event broker, endpoint, client listener

## Success Criteria

- Build passes
- SSE/WebSocket endpoint responds with correct Content-Type
- Client connects and receives events
