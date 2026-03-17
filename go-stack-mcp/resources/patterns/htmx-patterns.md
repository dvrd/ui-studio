---
description: HTMX 2.x patterns for dynamic UI without JavaScript — forms, lists, modals, SSE, OOB swaps.
---

# HTMX Patterns

## Core Attributes Reference

| Attribute | Purpose |
|---|---|
| `hx-get/post/put/delete` | HTTP method + URL |
| `hx-target` | CSS selector of element to update |
| `hx-swap` | How to update: `innerHTML`, `outerHTML`, `beforeend`, `afterend` |
| `hx-boost` | On `<body>`: converts all `<a>` and `<form>` to AJAX |
| `hx-push-url` | Update browser URL after swap |
| `hx-trigger` | When to fire: `click`, `change`, `keyup delay:300ms` |
| `hx-indicator` | CSS selector of loading spinner element |
| `hx-confirm` | Show browser confirm dialog before request |
| `hx-swap-oob` | Out-of-band swap for updating multiple regions |

## Form Pattern

```html
<!-- Inline error replacement: server returns this form with errors -->
<form hx-post="/items" hx-target="this" hx-swap="outerHTML">
    <input name="name" type="text" class="input"/>
    <button type="submit" class="btn btn-primary">
        <span class="htmx-indicator loading loading-sm"></span>
        Save
    </button>
</form>
```

## List with Add Item

```html
<div id="item-list">
    <!-- items rendered here -->
</div>

<!-- Append new item to list on success -->
<form hx-post="/items" hx-target="#item-list" hx-swap="beforeend">
    <input name="name" type="text"/>
    <button type="submit">Add</button>
</form>
```

## Delete with Fade-out

```html
<div id="item-42" class="item-card">
    <button
        hx-delete="/items/42"
        hx-target="#item-42"
        hx-swap="outerHTML swap:300ms"
        class="btn btn-ghost">
        Delete
    </button>
</div>
```

```css
.htmx-swapping { opacity: 0; transition: opacity 0.3s; }
```

## Load More Pagination

```html
<div id="items">
    <!-- initial items -->
    <button
        hx-get="/items?page=2"
        hx-target="this"
        hx-swap="outerHTML"
        class="btn btn-outline w-full">
        Load more
    </button>
</div>
```

Server returns next batch + new "load more" button (or nothing if last page).

## Inline Edit

```html
<!-- Display mode -->
<div id="item-42">
    <span>Item name</span>
    <button hx-get="/items/42/edit" hx-target="#item-42" hx-swap="outerHTML">
        Edit
    </button>
</div>

<!-- Edit mode (returned by GET /items/42/edit) -->
<form id="item-42" hx-put="/items/42" hx-target="#item-42" hx-swap="outerHTML">
    <input name="name" value="Item name"/>
    <button type="submit">Save</button>
    <button hx-get="/items/42" hx-target="#item-42" hx-swap="outerHTML">Cancel</button>
</form>
```

## Search with Debounce

```html
<input
    type="search"
    name="q"
    hx-get="/items"
    hx-target="#item-list"
    hx-trigger="keyup changed delay:300ms"
    placeholder="Search..."/>
```

## Out-of-Band Swap (Update Multiple Regions)

Server can update multiple page regions in one response:

```html
<!-- Main response -->
<div id="campaign-list"><!-- new list --></div>

<!-- OOB update (also in same response body) -->
<span id="campaign-count" hx-swap-oob="true">42</span>
<div id="flash-message" hx-swap-oob="true" class="alert">Campaign created!</div>
```

## Loading Indicator

```html
<!-- Global indicator -->
<div id="global-indicator" class="htmx-indicator fixed top-0 left-0 w-full">
    <div class="h-1 bg-primary animate-pulse"></div>
</div>

<!-- Per-button indicator -->
<button hx-post="/action" hx-indicator="#btn-spinner">
    <span id="btn-spinner" class="htmx-indicator loading loading-sm"></span>
    Submit
</button>
```

## HTMX Response Headers from Go

```go
// Redirect after successful HTMX form submit
w.Header().Set("HX-Redirect", "/dashboard")
w.WriteHeader(http.StatusOK)

// Refresh the page
w.Header().Set("HX-Refresh", "true")

// Trigger a custom event on the client
w.Header().Set("HX-Trigger", `{"showToast": "Saved!"}`)
```

## Listen for Custom Events

```html
<div hx-on:show-toast="alert(event.detail.value)">...</div>
```
