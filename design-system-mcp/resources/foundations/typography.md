---
description: Typography scale, font stacks, line heights, and responsive text sizing.
---

# Typography

## Type Scale

| Name | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-xs` | 12px | 16px | 400 | Captions, badges |
| `text-sm` | 14px | 20px | 400 | Secondary text, labels |
| `text-base` | 16px | 24px | 400 | Body text (default) |
| `text-lg` | 18px | 28px | 500 | Subheadings |
| `text-xl` | 20px | 28px | 600 | Section headings |
| `text-2xl` | 24px | 32px | 700 | Page headings |
| `text-3xl` | 30px | 36px | 700 | Hero headings |

## Font Stack

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: ui-monospace, "Cascadia Code", "Fira Code", monospace;
```

## Rules

- Body text minimum 16px (prevents iOS zoom on focus)
- Line height: 1.5 for body, 1.2 for headings
- Max line length: 70-80 characters for readability
- Heading hierarchy: only one `<h1>` per page, don't skip levels
