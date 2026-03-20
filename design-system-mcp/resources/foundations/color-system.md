---
description: Token-based color system — semantic colors, dark mode, contrast requirements.
---

# Color System

## Semantic Color Tokens

Use semantic names, not raw values. This enables dark mode and theming.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0a0a0a` | Page background |
| `--color-bg-secondary` | `#f5f5f5` | `#171717` | Card, section backgrounds |
| `--color-fg` | `#0a0a0a` | `#fafafa` | Primary text |
| `--color-fg-muted` | `#737373` | `#a3a3a3` | Secondary text |
| `--color-border` | `#e5e5e5` | `#262626` | Borders, dividers |
| `--color-primary` | `#2563eb` | `#3b82f6` | Primary actions, links |
| `--color-primary-fg` | `#ffffff` | `#ffffff` | Text on primary bg |
| `--color-success` | `#16a34a` | `#22c55e` | Success states |
| `--color-warning` | `#d97706` | `#f59e0b` | Warning states |
| `--color-error` | `#dc2626` | `#ef4444` | Error states |

## Contrast Requirements

WCAG AA minimum:
- **Normal text on background**: 4.5:1
- **Large text (18px+ / 14px+ bold)**: 3:1
- **UI components, borders**: 3:1

## Dark Mode

Prefer `prefers-color-scheme` media query:

```css
:root {
    --color-bg: #ffffff;
    --color-fg: #0a0a0a;
}

@media (prefers-color-scheme: dark) {
    :root {
        --color-bg: #0a0a0a;
        --color-fg: #fafafa;
    }
}
```

## Usage Rule

Never use raw hex values in components. Always reference tokens:

```css
/* Good */
.card { background: var(--color-bg-secondary); }

/* Bad */
.card { background: #f5f5f5; }
```
