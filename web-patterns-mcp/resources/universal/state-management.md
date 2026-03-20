---
description: Client state, server state, URL state, caching strategy, and when to use each.
---

# State Management

## Three Types of State

### 1. Server State
Data that lives on the server (database). The source of truth.

- Fetched via API calls or server-side data loading
- Cached on client with TTL (time to live)
- Invalidated on mutations (create, update, delete)
- Examples: user profile, campaigns, invoices

### 2. Client State
Data that exists only in the browser. No server counterpart.

- UI state: sidebar open/closed, modal visibility, active tab
- Form state: in-progress form data before submission
- Ephemeral: disappears on page refresh
- Examples: selected filters, sort order, form inputs

### 3. URL State
State encoded in the URL. Shareable and bookmarkable.

- Query params: `?status=active&page=2&sort=created_at`
- Path segments: `/campaigns/123/edit`
- Hash: `#section-name` for scroll position
- Examples: current page, active filters, selected item

## When to Use Each

| State type | Use for | Don't use for |
|---|---|---|
| Server state | Persistent data, shared between users | UI toggles, form inputs |
| Client state | UI interactions, temporary data | Data that should persist |
| URL state | Filters, pagination, shareable views | Sensitive data, large payloads |

## Server State Patterns

### Fetch on Mount
Simplest pattern — load data when component/page mounts:

```
page load:
    data = await fetchCampaigns()
    render(data)
```

### Stale-While-Revalidate
Show cached data immediately, refresh in background:

```
page load:
    show cached data (instant)
    fetch fresh data in background
    update when fresh data arrives
```

### Optimistic Updates
Update UI immediately, sync with server in background:

```
on delete:
    remove from UI (instant feedback)
    send DELETE to server
    if server fails: restore in UI + show error
```

## Client State Patterns

### Local Component State
For state that belongs to a single component:

```
// React: useState
// Svelte: reactive declaration
// Vue: ref()
// Go/HTMX: DOM state + hx-swap
```

### Global Client State
For state shared across components (rare — prefer URL state or server state):

```
// React: Zustand, Jotai
// Svelte: writable stores
// Vue: Pinia
// Go/HTMX: not needed (server renders everything)
```

**Rule**: If you think you need global client state, first ask: "Can this be URL state instead?" URL state is shareable, bookmarkable, and survives refresh.

## Caching Strategy

| Data type | Cache TTL | Invalidation |
|---|---|---|
| User profile | 5 min | On profile update |
| List data | 1 min | On any mutation to that resource |
| Static config | 1 hour | On app restart |
| Search results | No cache | Every request |
