---
description: Button component — variants, sizes, loading state, and HTMX integration.
---

# Button

## Import

```go
import "github.com/axzilla/templui/pkg/components"
// or use CSS classes directly
```

## Variants

```html
<!-- Primary (default) -->
<button class="btn btn-primary">Save</button>

<!-- Secondary -->
<button class="btn btn-secondary">Cancel</button>

<!-- Outline -->
<button class="btn btn-outline">Export</button>

<!-- Ghost (no border) -->
<button class="btn btn-ghost">Edit</button>

<!-- Destructive -->
<button class="btn btn-destructive">Delete</button>

<!-- Link style -->
<button class="btn btn-link">View details</button>
```

## Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-icon">
    <!-- icon only, square -->
</button>
```

## With Loading (HTMX)

```html
<button class="btn btn-primary" hx-post="/action" hx-indicator="#spinner">
    <span id="spinner" class="htmx-indicator loading loading-spinner loading-sm"></span>
    Submit
</button>
```

## Disabled

```html
<button class="btn btn-primary" disabled>Disabled</button>
```

## Full Width

```html
<button class="btn btn-primary w-full">Full Width</button>
```

## With Icon

```html
<button class="btn btn-primary gap-2">
    <svg class="h-4 w-4">...</svg>
    With Icon
</button>
```
