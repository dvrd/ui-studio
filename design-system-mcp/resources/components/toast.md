---
description: Toast/notification component — success, error, info variants, auto-dismiss, and positioning.
---

# Toast

## Structure

```html
<div id="toast-container" class="fixed bottom-4 right-4 z-50 space-y-2">
    <div class="toast toast-success" role="alert">
        <svg><!-- check icon --></svg>
        <span>Campaign saved successfully.</span>
        <button class="btn btn-ghost btn-sm" aria-label="Dismiss">
            <svg><!-- X icon --></svg>
        </button>
    </div>
</div>
```

## Variants

| Variant | Color | Icon | Usage |
|---|---|---|---|
| `success` | Green | Check | Action completed |
| `error` | Red | X circle | Action failed |
| `warning` | Yellow | Triangle | Caution |
| `info` | Blue | Info circle | Information |

## Behavior

- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss via close button
- Stack from bottom (newest at bottom)
- Maximum 3 visible at once (older ones dismiss)

## With HTMX (OOB)

Server response includes toast via OOB swap:

```html
<!-- Main response content -->
<div>...</div>

<!-- Toast via OOB -->
<div id="toast-container" hx-swap-oob="beforeend">
    <div class="toast toast-success" role="alert">
        Campaign saved successfully.
    </div>
</div>
```

## Accessibility

- Use `role="alert"` for important messages (errors)
- Use `role="status"` for informational messages
- Auto-dismiss should be long enough to read (5s minimum)
- Don't auto-dismiss error toasts — require manual dismissal
