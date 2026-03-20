---
description: SSE, WebSocket, and polling patterns for real-time updates, event broker design, and client reconnection.
---

# Realtime

## Transport Selection

| Transport | Best for | Stack preference |
|---|---|---|
| **SSE** (Server-Sent Events) | Server → client only, simple updates | Go+HTMX, Rails+Hotwire |
| **WebSocket** | Bidirectional, chat, collaboration | Next.js, SvelteKit, Nuxt |
| **Polling** | Simple, low-frequency updates | Any (fallback) |

## SSE Pattern

### Server Side

```
GET /api/events (auth required)

handler(request, response):
    response.headers:
        Content-Type: text/event-stream
        Cache-Control: no-cache
        Connection: keep-alive

    userId = request.user.id
    channel = broker.subscribe(userId)

    // Heartbeat every 30 seconds
    heartbeat = setInterval(30s):
        response.write(": heartbeat\n\n")

    // Send events
    for event in channel:
        response.write("event: {event.type}\n")
        response.write("data: {event.json}\n\n")
        response.flush()

    // Cleanup on disconnect
    on request.context.done:
        clearInterval(heartbeat)
        broker.unsubscribe(userId, channel)
```

### Client Side

```javascript
const events = new EventSource('/api/events');

events.addEventListener('notification', (e) => {
    const data = JSON.parse(e.data);
    showNotification(data);
});

events.addEventListener('error', () => {
    // Browser auto-reconnects with Last-Event-ID
    console.log('SSE connection lost, reconnecting...');
});
```

For HTMX:
```html
<div hx-ext="sse" sse-connect="/api/events">
    <div sse-swap="notification" hx-swap="beforeend">
        <!-- New notifications appear here -->
    </div>
</div>
```

## Event Broker Pattern

Central hub that manages subscriptions and fan-out:

```
EventBroker:
    subscribers: Map<userId, Set<channel>>

    Subscribe(userId) → channel:
        create new channel
        add to subscribers[userId]
        return channel

    Unsubscribe(userId, channel):
        remove channel from subscribers[userId]

    Publish(userId, event):
        for channel in subscribers[userId]:
            send event to channel

    Broadcast(event):
        for all subscribers:
            for all channels:
                send event to channel
```

**Rules:**
- Thread-safe: use mutex/lock for subscriber map
- Non-blocking: if a channel is full, skip (don't block other subscribers)
- Cleanup: remove subscriber when connection closes
- Heartbeat: send every 30s to keep connection alive

## WebSocket Pattern

```
// Server
on connection(socket, request):
    user = authenticate(request)
    broker.subscribe(user.id, socket)

    socket.on('message', (data) => {
        handleMessage(user, data)
    })

    socket.on('close', () => {
        broker.unsubscribe(user.id, socket)
    })

// Client
const ws = new WebSocket('wss://app.example.com/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleUpdate(data);
};

ws.onclose = () => {
    // Reconnect with exponential backoff
    setTimeout(() => connect(), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
};
```

## Reconnection Strategy

```
Client reconnection:
    initialDelay: 1000ms
    maxDelay: 30000ms
    backoffMultiplier: 2

    on disconnect:
        delay = initialDelay
        while not connected:
            wait(delay)
            try connect()
            delay = min(delay * backoffMultiplier, maxDelay)
```

For SSE, the browser handles reconnection automatically with `Last-Event-ID`.
