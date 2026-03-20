---
description: Error boundaries, user-facing errors, logging, error wrapping at layer boundaries, and graceful degradation.
---

# Error Handling

## Error Wrapping at Boundaries

Every layer boundary wraps errors with context:

```
Repository: "find campaign by id: connection refused"
Service:    "get campaign: find campaign by id: connection refused"
Handler:    logs full chain, returns generic "Something went wrong" to user
```

**Rules:**
- Wrap at every boundary: `"context: {underlying error}"`
- Never swallow errors (empty catch, `_ = err`)
- Never expose internal errors to users

## User-Facing Errors

### HTTP Error Responses (API)

```json
{
  "error": {
    "code": "not_found",
    "message": "Campaign not found"
  }
}
```

### Rendered Error Pages (Server-Rendered)

- **404**: "Page not found" with navigation back to dashboard
- **403**: "You don't have access" with link to appropriate page
- **500**: "Something went wrong, please try again" — never show stack trace
- **Maintenance**: "We're updating, back in a few minutes"

### Form Validation Errors

Show inline per-field errors (see forms.md). Never redirect to an error page for validation failures.

## Error Boundaries (Client-Side)

For SPA and hybrid apps, wrap sections in error boundaries:

```
<ErrorBoundary fallback={<ErrorFallback />}>
    <Dashboard />
</ErrorBoundary>
```

**Rules:**
- Catch rendering errors without crashing the whole page
- Show a helpful fallback ("Something went wrong. Try refreshing.")
- Log the error to monitoring
- Allow retry/refresh from the fallback

## Logging

### What to Log

- All errors (with stack trace in non-production)
- Auth events: login, logout, failed attempts
- Webhook processing: received, validated, processed/failed
- Slow queries (> 1s)

### What NOT to Log

- Passwords, tokens, API keys
- Full credit card numbers
- Personal data (email is OK for auth logs, but not in general logging)

### Log Format

```json
{
  "level": "error",
  "message": "create campaign: insert failed: duplicate key",
  "timestamp": "2025-01-15T10:30:00Z",
  "request_id": "abc-123",
  "user_id": "usr_456",
  "service": "campaign"
}
```

## Graceful Degradation

When external services fail:
- **Payment provider down**: Show "Payments temporarily unavailable", allow retry
- **Email service down**: Queue emails for retry, don't block the user action
- **Database slow**: Return cached data if available, show loading state
- **Third-party API down**: Show cached/stale data with "Last updated: {time}"

Never let an external service failure crash the user's experience.

## Recovery Patterns

### Retry with Backoff

```
retry(operation, maxAttempts=3):
    for attempt in 1..maxAttempts:
        try:
            return operation()
        catch transientError:
            if attempt == maxAttempts: throw
            sleep(2^attempt * 100ms)  // 200ms, 400ms, 800ms
```

### Circuit Breaker

For external services that may be down:
1. **Closed**: requests pass through normally
2. **Open**: after N failures, reject requests immediately (return fallback)
3. **Half-open**: after timeout, allow one request to test recovery
