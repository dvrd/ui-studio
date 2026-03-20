---
description: Card component — container with header, body, footer slots, click behavior, and responsive layout.
---

# Card

## Structure

```html
<div class="card">
    <div class="card-header">
        <h3>Card Title</h3>
        <span class="badge">Status</span>
    </div>
    <div class="card-body">
        <p>Card content goes here.</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-sm">Action</button>
    </div>
</div>
```

## Variants

| Variant | Usage |
|---|---|
| Default | Standard content card |
| Interactive | Clickable card (hover effect, cursor pointer) |
| Highlighted | Featured/selected card (primary border) |

## Interactive Card

```html
<a href="/campaigns/123" class="card card-interactive">
    <!-- entire card is clickable -->
</a>
```

Add hover effect: `hover:shadow-md transition-shadow`

## Responsive Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
</div>
```

## Card as Data Row (Mobile)

On mobile, tables become cards:

```html
<div class="card">
    <div class="flex justify-between">
        <span class="font-medium">Campaign Name</span>
        <span class="badge badge-success">Active</span>
    </div>
    <div class="text-sm text-gray-500 mt-1">
        Created Jan 15, 2025 · $1,500 budget
    </div>
</div>
```

## Styling

- Padding: `space-4` (16px)
- Border: `1px solid var(--color-border)`
- Border radius: `8px`
- Background: `var(--color-bg-secondary)` or `var(--color-bg)`
- Shadow: `shadow-sm` (optional)
