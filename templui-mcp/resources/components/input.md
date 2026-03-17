---
description: Input, textarea, and form field components with labels and validation states.
---

# Input

## Basic Input

```html
<div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input
        type="email"
        id="email"
        name="email"
        class="input"
        placeholder="you@example.com"
        required/>
</div>
```

## With Error State

```html
<div class="form-group">
    <label for="name" class="form-label">Name</label>
    <input type="text" id="name" name="name" class="input input-error" value=""/>
    <p class="form-message text-destructive">Name is required</p>
</div>
```

## Textarea

```html
<div class="form-group">
    <label for="bio" class="form-label">Description</label>
    <textarea id="bio" name="bio" class="textarea" rows="4" placeholder="Describe..."></textarea>
</div>
```

## Input with Icon

```html
<div class="input-group">
    <span class="input-addon">
        <svg class="h-4 w-4 text-muted-foreground"><!-- search icon --></svg>
    </span>
    <input type="search" class="input" placeholder="Search..."/>
</div>
```

## Select

```html
<div class="form-group">
    <label for="status" class="form-label">Status</label>
    <select id="status" name="status" class="select">
        <option value="">Select status</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
    </select>
</div>
```

## Checkbox

```html
<div class="form-group flex items-center gap-2">
    <input type="checkbox" id="agree" name="agree" class="checkbox"/>
    <label for="agree" class="form-label mb-0">I agree to the terms</label>
</div>
```

## Full Form Example (Templ)

```go
templ CampaignForm(input CreateInput, errMsg string) {
    <form hx-post="/campaigns" hx-target="this" hx-swap="outerHTML" class="space-y-4">
        <div class="form-group">
            <label for="name" class="form-label">Campaign Name</label>
            <input
                type="text"
                id="name"
                name="name"
                value={ input.Name }
                class={ "input", templ.KV("input-error", errMsg != "") }
                required/>
            if errMsg != "" {
                <p class="form-message text-destructive">{ errMsg }</p>
            }
        </div>
        <button type="submit" class="btn btn-primary">
            <span class="htmx-indicator loading loading-sm"></span>
            Save Campaign
        </button>
    </form>
}
```
