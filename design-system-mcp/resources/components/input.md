---
description: Input component — text, email, password, select, textarea, validation states, and accessibility.
---

# Input

## Types

| Type | HTML | Notes |
|---|---|---|
| Text | `<input type="text">` | Single-line text |
| Email | `<input type="email">` | Email validation |
| Password | `<input type="password">` | Hidden characters |
| Number | `<input type="number">` | Numeric only |
| URL | `<input type="url">` | URL validation |
| Search | `<input type="search">` | Search field with clear |
| Select | `<select>` | Dropdown selection |
| Textarea | `<textarea>` | Multi-line text |
| Checkbox | `<input type="checkbox">` | Boolean toggle |
| Radio | `<input type="radio">` | Single selection from group |

## Anatomy

```html
<div class="form-group">
    <label for="email">
        Email address
        <span class="text-red-500" aria-hidden="true">*</span>
    </label>
    <input
        id="email"
        type="email"
        name="email"
        required
        aria-required="true"
        aria-describedby="email-help email-error"
        placeholder="you@example.com"
        class="input"
    />
    <span id="email-help" class="text-sm text-gray-500">We'll never share your email.</span>
    <span id="email-error" role="alert" class="text-sm text-red-500"></span>
</div>
```

## Validation States

| State | Border | Icon | Description text |
|---|---|---|---|
| Default | `border-gray-300` | none | Help text |
| Focus | `border-primary ring-2` | none | Help text |
| Error | `border-red-500` | error icon | Error message in red |
| Success | `border-green-500` | check icon | Success message |
| Disabled | `bg-gray-100 opacity-50` | none | (greyed out) |

## Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| `sm` | 32px | 6px 10px | 14px |
| `md` | 40px | 8px 12px | 14px |
| `lg` | 48px | 10px 16px | 16px |

## Accessibility

- Every input MUST have a `<label>`
- Use `aria-describedby` for help text and error messages
- Use `aria-required="true"` for required fields
- Use `role="alert"` on error messages
- Focus indicator must be visible
- Don't rely on placeholder as label
