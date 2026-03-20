---
description: Badge component — status indicators, variants, sizes, and usage patterns.
---

# Badge

## Variants

| Variant | Color | Usage |
|---|---|---|
| `default` | Gray | Neutral status, count |
| `success` | Green | Active, completed, paid |
| `warning` | Yellow | Pending, paused, expiring |
| `error` | Red | Failed, cancelled, overdue |
| `info` | Blue | New, in progress, info |

## Structure

```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Failed</span>
```

## Sizes

| Size | Padding | Font | Usage |
|---|---|---|---|
| `sm` | 2px 6px | 11px | Inline with text |
| `md` | 2px 8px | 12px | Default |

## With Icon

```html
<span class="badge badge-success">
    <svg class="w-3 h-3"><!-- check icon --></svg>
    Active
</span>
```

## As Counter

```html
<span class="badge badge-info rounded-full">3</span>
```

## Accessibility

- Don't use color alone — include text label
- For icon-only badges: add `aria-label`
