---
description: Badge and status indicator components.
---

# Badge

## Variants

```html
<!-- Default -->
<span class="badge">Default</span>

<!-- Semantic variants -->
<span class="badge badge-secondary">Secondary</span>
<span class="badge badge-outline">Outline</span>
<span class="badge badge-destructive">Error</span>

<!-- Status colors (use with Tailwind) -->
<span class="badge bg-green-100 text-green-800">Active</span>
<span class="badge bg-yellow-100 text-yellow-800">Pending</span>
<span class="badge bg-red-100 text-red-800">Failed</span>
<span class="badge bg-blue-100 text-blue-800">Processing</span>
<span class="badge bg-gray-100 text-gray-800">Draft</span>
```

## In Templ with Dynamic Status

Use a templ component — never `templ.Raw` with dynamic values (XSS risk):

```go
templ StatusBadge(status string) {
    switch status {
    case "active":
        <span class="badge bg-green-100 text-green-800">Active</span>
    case "draft":
        <span class="badge badge-secondary">Draft</span>
    case "failed":
        <span class="badge badge-destructive">Failed</span>
    default:
        <span class="badge badge-outline">{ status }</span>
    }
}
```

Templ auto-escapes `{ status }` — safe even if the value comes from user input or the database.

> **Never** use `templ.Raw(... + userValue + ...)` — it bypasses escaping and enables XSS.
