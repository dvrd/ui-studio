---
description: Build a Templ component with HTMX interactivity and templUI styling.
user-invocable: true
agent: go-studio:go-builder
---

# Build HTMX Component

Creates a Templ component with HTMX-driven interactivity using templUI styling.

## Inputs

Confirm with user:
- `componentName` — PascalCase name (e.g. `CampaignCard`, `StatsPanel`)
- What data does it display?
- What interactions does it have? (click, form submit, load more, etc.)
- URL for the HTMX target handler

## Steps

1. Read patterns:
   - `go-stack: pattern://templ-components.md`
   - `go-stack: pattern://htmx-patterns.md`
   - `templui: list_resources()` — check available components

2. Read relevant templUI component docs for the UI patterns needed

3. Write `internal/ui/components/{component_name}.templ`:
   - Use templUI component classes
   - Add HTMX attributes for interactivity
   - Handle loading state with `hx-indicator`
   - Handle error state with OOB swap or inline error

4. Write handler method in the appropriate `internal/handlers/*.go`:
   - Full page handler (GET /{page}) — renders base layout + component
   - Partial handler (POST or GET /{action}) — returns only the component for HTMX swap

5. Register handler routes in `cmd/server/main.go`

6. Run `templ generate` + `go build ./...`

7. Smoke test (if Chrome available):
   - Navigate to the page
   - Screenshot: `screenshots/{componentName}-iter1.png`
   - Check console for errors

## Common Patterns

**Form with inline validation:**
```html
<form hx-post="/campaigns" hx-target="this" hx-swap="outerHTML">
  <!-- on error, server returns this form with error messages -->
  <!-- on success, server returns success state or redirects -->
</form>
```

**Load more pagination:**
```html
<button hx-get="/campaigns?page=2" hx-target="#campaign-list" hx-swap="beforeend">
  Load more
</button>
```

**Delete with confirmation:**
```html
<button hx-delete="/campaigns/123" hx-confirm="Delete this campaign?" hx-target="closest .campaign-card" hx-swap="outerHTML">
  Delete
</button>
```

## Success Criteria

- `templ generate` produces `_templ.go` file
- `go build ./...` passes
- Component renders at its route
- HTMX interactions work (verified by smoke test or manual check)
