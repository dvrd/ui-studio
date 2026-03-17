---
description: Add an SSE streaming endpoint for real-time UI updates.
user-invocable: true
agent: go-studio:go-builder
---

# Build SSE

Adds server-sent events for real-time updates (job status, notifications, live data).

## Inputs

Confirm with user:
- `streamName` — what is being streamed? (e.g. `job-status`, `notifications`, `analytics`)
- Event types — what events will be sent?
- Who receives events? (per-user or broadcast)

## Steps

1. Read `go-stack: pattern://sse-streaming.md`

2. Write `internal/services/broker.go` — event broker:
   ```go
   type Broker struct {
       clients    map[string][]chan Event  // userID → channels
       subscribe  chan subscription
       unsubscribe chan subscription
       publish    chan Event
   }
   ```
   - `Start()` — goroutine that manages client channels
   - `Subscribe(userID)` → `chan Event`
   - `Unsubscribe(userID, ch)`
   - `Publish(userID, event)` or `Broadcast(event)`

3. Write SSE handler in `internal/handlers/sse.go`:
   ```go
   func (h *Handler) Events(w http.ResponseWriter, r *http.Request) {
       w.Header().Set("Content-Type", "text/event-stream")
       w.Header().Set("Cache-Control", "no-cache")
       w.Header().Set("Connection", "keep-alive")
       // subscribe, stream events, handle disconnect
   }
   ```

4. Write `internal/ui/components/sse_listener.templ`:
   - HTMX SSE extension: `<div hx-ext="sse" hx-sse="connect:/api/sse">`
   - Event listener elements: `<div hx-sse="swap:{event-name}">`

5. Register `GET /api/sse` in `cmd/server/main.go` (behind RequireAuth)

6. Initialize broker in main.go and inject into relevant services that need to emit events

7. Add heartbeat tick (every 30s) to keep connection alive through proxies

8. Run `go build ./...` + `templ generate`

## Success Criteria

- `go build ./...` passes
- `GET /api/sse` returns `Content-Type: text/event-stream`
- Broker fan-out works: publishing to a userID sends to all that user's open connections
- Heartbeat keeps connections alive
