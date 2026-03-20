---
description: Modal/dialog component — focus trap, backdrop, close behavior, sizes, and accessibility.
---

# Modal

## Structure

```html
<dialog id="confirm-dialog" class="modal">
    <div class="modal-backdrop" data-close></div>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button class="btn btn-ghost btn-sm" data-close aria-label="Close">
                <svg><!-- X icon --></svg>
            </button>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to delete this campaign? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" data-close>Cancel</button>
            <button class="btn btn-danger">Delete</button>
        </div>
    </div>
</dialog>
```

## Sizes

| Size | Max Width | Usage |
|---|---|---|
| `sm` | 400px | Confirmations, simple forms |
| `md` | 560px | Standard forms, detail views |
| `lg` | 720px | Complex forms, data views |

## Behavior

- **Open**: focus moves to first focusable element inside modal
- **Tab**: cycles within modal (focus trap)
- **Escape**: closes modal
- **Backdrop click**: closes modal
- **Close**: focus returns to trigger element

## Accessibility

- Use `<dialog>` element (native) or `role="dialog"` + `aria-modal="true"`
- Set `aria-labelledby` pointing to the modal title
- Focus trap: Tab cycles within modal
- Return focus to trigger on close
- Escape key closes modal

## With HTMX

```html
<button
    hx-get="/campaigns/123/delete-confirm"
    hx-target="#modal-container"
    hx-swap="innerHTML"
>
    Delete
</button>

<div id="modal-container"></div>
```

Server returns the modal HTML, which appears as an overlay.
