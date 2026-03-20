---
description: HTMX interaction patterns — hx-boost, hx-swap, OOB updates, SSE extension, loading states, and forms.
---

# HTMX Patterns

## Page Transitions (hx-boost)

```html
<body hx-boost="true">
```

All `<a>` and `<form>` tags inside a `hx-boost` body are automatically AJAX-powered. No JavaScript needed.

## Partial Updates

```html
<!-- Click to load fresh data into #campaign-list -->
<button hx-get="/campaigns" hx-target="#campaign-list" hx-swap="innerHTML">
    Refresh
</button>

<div id="campaign-list">
    <!-- Campaign cards render here -->
</div>
```

## CRUD Forms

### Create (POST)
```html
<form hx-post="/campaigns" hx-target="#campaign-list" hx-swap="beforeend">
    <input name="title" required/>
    <button type="submit">Create</button>
</form>
```

### Edit (PUT)
```html
<form hx-put="/campaigns/123" hx-target="closest .card" hx-swap="outerHTML">
    <input name="title" value="Existing Title"/>
    <button type="submit">Save</button>
</form>
```

### Delete
```html
<button
    hx-delete="/campaigns/123"
    hx-target="closest .card"
    hx-swap="outerHTML"
    hx-confirm="Are you sure?"
>
    Delete
</button>
```

Server returns empty body → element is removed.

## Out-of-Band (OOB) Swaps

Update multiple page regions from a single response:

```html
<!-- Server response -->
<div id="campaign-card-123" hx-swap-oob="true">
    <!-- Updated card content -->
</div>
<div id="notification-count" hx-swap-oob="innerHTML">
    3
</div>
```

## Loading States

```html
<button hx-post="/campaigns" class="btn">
    <span class="htmx-indicator">
        <svg class="animate-spin">...</svg>
    </span>
    Save
</button>
```

CSS:
```css
.htmx-indicator { display: none; }
.htmx-request .htmx-indicator { display: inline; }
.htmx-request button { opacity: 0.5; pointer-events: none; }
```

## SSE Integration

```html
<div hx-ext="sse" sse-connect="/api/events">
    <div sse-swap="notification" hx-swap="beforeend">
        <!-- Notifications appear here in real-time -->
    </div>
</div>
```

Requires the HTMX SSE extension:
```html
<script src="https://unpkg.com/htmx-ext-sse@2"></script>
```

## Error Handling

Handle HTTP errors with `hx-on`:

```html
<form
    hx-post="/campaigns"
    hx-target="#form-container"
    hx-on::response-error="alert('Something went wrong')"
>
```

Or globally:
```javascript
document.body.addEventListener('htmx:responseError', function(event) {
    // Show toast notification
});
```

## Infinite Scroll

```html
<div id="campaign-list">
    <!-- campaigns -->
    <div hx-get="/campaigns?page=2" hx-trigger="revealed" hx-swap="afterend">
        Loading more...
    </div>
</div>
```

## Active Search

```html
<input
    type="search"
    name="q"
    hx-get="/campaigns/search"
    hx-trigger="keyup changed delay:300ms"
    hx-target="#search-results"
/>
<div id="search-results"></div>
```
