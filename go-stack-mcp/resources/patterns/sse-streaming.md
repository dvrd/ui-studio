---
description: Server-sent events for real-time UI updates — per-user fan-out broker with heartbeat.
---

# SSE Streaming Pattern

## Event Broker

```go
package services

import (
    "encoding/json"
    "time"
)

type Event struct {
    Type string `json:"type"`
    Data any    `json:"data"`
}

type subscription struct {
    userID string
    ch     chan Event
}

type Broker struct {
    clients     map[string][]chan Event
    subscribe   chan subscription
    unsubscribe chan subscription
    publish     chan struct{ userID string; event Event }
    broadcast   chan Event
}

func NewBroker() *Broker {
    b := &Broker{
        clients:     make(map[string][]chan Event),
        subscribe:   make(chan subscription, 10),
        unsubscribe: make(chan subscription, 10),
        publish:     make(chan struct{ userID string; event Event }, 100),
        broadcast:   make(chan Event, 100),
    }
    go b.run()
    return b
}

func (b *Broker) run() {
    for {
        select {
        case sub := <-b.subscribe:
            b.clients[sub.userID] = append(b.clients[sub.userID], sub.ch)

        case sub := <-b.unsubscribe:
            channels := b.clients[sub.userID]
            for i, ch := range channels {
                if ch == sub.ch {
                    b.clients[sub.userID] = append(channels[:i], channels[i+1:]...)
                    close(ch)
                    break
                }
            }
            if len(b.clients[sub.userID]) == 0 {
                delete(b.clients, sub.userID)
            }

        case msg := <-b.publish:
            for _, ch := range b.clients[msg.userID] {
                select {
                case ch <- msg.event:
                default: // drop if consumer is slow
                }
            }

        case event := <-b.broadcast:
            for _, channels := range b.clients {
                for _, ch := range channels {
                    select {
                    case ch <- event:
                    default:
                    }
                }
            }
        }
    }
}

func (b *Broker) Subscribe(userID string) chan Event {
    ch := make(chan Event, 10)
    b.subscribe <- subscription{userID: userID, ch: ch}
    return ch
}

func (b *Broker) Unsubscribe(userID string, ch chan Event) {
    b.unsubscribe <- subscription{userID: userID, ch: ch}
}

func (b *Broker) Publish(userID string, event Event) {
    b.publish <- struct{ userID string; event Event }{userID, event}
}
```

## SSE Handler

```go
func (h *Handler) Events(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "streaming unsupported", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("X-Accel-Buffering", "no") // disable nginx buffering

    userID := userIDFromContext(r).String()
    ch := h.broker.Subscribe(userID)
    defer h.broker.Unsubscribe(userID, ch)

    // Heartbeat ticker
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()

    // Send initial connected event
    fmt.Fprintf(w, "event: connected\ndata: {}\n\n")
    flusher.Flush()

    for {
        select {
        case event, ok := <-ch:
            if !ok {
                return
            }
            data, _ := json.Marshal(event.Data)
            fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Type, data)
            flusher.Flush()

        case <-ticker.C:
            fmt.Fprintf(w, ": heartbeat\n\n")
            flusher.Flush()

        case <-r.Context().Done():
            return
        }
    }
}
```

## Templ Component with HTMX SSE Extension

```html
<!-- Load HTMX SSE extension -->
<script src="https://unpkg.com/htmx-ext-sse@2/sse.js"></script>

<!-- SSE listener component -->
<div hx-ext="sse" hx-sse="connect:/api/sse">
    <!-- Swap this div when job-status event arrives -->
    <div id="job-status" hx-sse="swap:job-status">
        <!-- initial content -->
    </div>
</div>
```

## Publishing Events from Services

```go
// In job service after job completes:
h.broker.Publish(userID, services.Event{
    Type: "job-status",
    Data: map[string]any{
        "jobID":  job.ID,
        "status": job.Status,
    },
})
```

## Wire in main.go

```go
broker := services.NewBroker()

sseHandler := handlers.NewSSEHandler(broker)
r.Get("/api/sse", middleware.RequireAuth(sseHandler.Events))

// Inject broker into services that emit events
jobService := services.NewJobService(jobRepo, broker, cfg)
```
