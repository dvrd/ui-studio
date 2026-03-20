---
description: Mobile-first responsive design, breakpoints, container queries, layout patterns, and viewport testing.
---

# Responsive Layout

## Mobile-First Approach

Write base styles for mobile, then add breakpoints for larger screens:

```css
/* Mobile first (default) */
.container { padding: 1rem; }
.grid { display: flex; flex-direction: column; gap: 1rem; }

/* Tablet (768px+) */
@media (min-width: 768px) {
    .container { padding: 2rem; }
    .grid { flex-direction: row; flex-wrap: wrap; }
    .grid > * { flex: 1 1 calc(50% - 0.5rem); }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem 3rem; }
    .grid > * { flex: 1 1 calc(33.333% - 0.667rem); }
}
```

## Standard Breakpoints

| Name | Width | Target |
|---|---|---|
| Mobile | < 768px | Phones |
| Tablet | 768px - 1023px | Tablets, small laptops |
| Desktop | 1024px+ | Laptops, desktops |
| Wide | 1440px+ | Large monitors |

## Layout Patterns

### Sidebar + Main Content

```
Mobile:  [Nav] → [Main Content] (stacked, sidebar as drawer/menu)
Tablet:  [Sidebar 240px] [Main Content]
Desktop: [Sidebar 280px] [Main Content]
```

### Card Grid

```
Mobile:  1 column
Tablet:  2 columns
Desktop: 3-4 columns
```

### Form Layout

```
Mobile:  Full-width fields, stacked
Tablet:  Full-width fields, stacked (better readability)
Desktop: 2-column for short fields (first name | last name), full-width for long fields
```

### Data Table

```
Mobile:  Card layout (each row becomes a card with label:value pairs)
Tablet:  Horizontal scroll with sticky first column
Desktop: Full table with all columns visible
```

## Common Rules

- **No horizontal scroll** at any viewport
- **Touch targets**: minimum 44x44px for interactive elements
- **Text size**: minimum 16px for body text (prevents iOS zoom)
- **Line length**: max 70-80 characters for readability
- **Spacing**: use relative units (rem) not fixed pixels
- **Images**: responsive with `max-width: 100%; height: auto;`

## Testing Viewports

Always test at these 3 viewports:

1. **Mobile**: 375 x 812 (iPhone standard)
2. **Tablet**: 768 x 1024 (iPad)
3. **Desktop**: 1440 x 900 (standard laptop)

Use Chrome DevTools to test:
```
chrome-devtools: resize_page({ width: 375, height: 812 })
chrome-devtools: take_screenshot(...)
chrome-devtools: resize_page({ width: 768, height: 1024 })
chrome-devtools: take_screenshot(...)
chrome-devtools: resize_page({ width: 1440, height: 900 })
chrome-devtools: take_screenshot(...)
```

## Navigation Patterns

```
Mobile:  Hamburger menu → slide-out drawer
Tablet:  Collapsible sidebar or top nav
Desktop: Full sidebar or horizontal nav
```

Always provide a way to navigate back (breadcrumbs or back button).
