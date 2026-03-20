---
description: Button component — variants, sizes, states, loading, icon support, and accessibility.
---

# Button

## Variants

| Variant | Usage |
|---|---|
| `primary` | Main action (Submit, Save, Create) |
| `secondary` | Secondary action (Cancel, Back) |
| `danger` | Destructive action (Delete, Remove) |
| `ghost` | Minimal: icon buttons, nav links |
| `link` | Looks like text, behaves like button |

## Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| `sm` | 32px | 8px 12px | 14px |
| `md` | 40px | 10px 16px | 14px |
| `lg` | 48px | 12px 24px | 16px |

## States

- **Default**: normal appearance
- **Hover**: slightly darker/lighter
- **Active**: pressed state
- **Focus**: visible focus ring (2px outline, 2px offset)
- **Disabled**: opacity 0.5, cursor not-allowed
- **Loading**: spinner icon, text changes to "Loading...", pointer-events none

## Loading State

```html
<button disabled class="btn btn-primary">
    <svg class="animate-spin h-4 w-4 mr-2">...</svg>
    Saving...
</button>
```

## With Icon

```html
<button class="btn btn-primary">
    <svg><!-- icon --></svg>
    Create Campaign
</button>
```

Icon size matches font size. Gap between icon and text: 8px.

## Accessibility

- Use `<button>` element (not `<div>` or `<span>`)
- Disabled buttons: `disabled` attribute + `aria-disabled="true"`
- Icon-only buttons: add `aria-label`
- Loading state: add `aria-busy="true"`
- Minimum touch target: 44x44px (use padding if needed)
