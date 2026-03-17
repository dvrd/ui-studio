---
description: Templ component patterns — layouts, pages, partials, and HTMX integration.
---

# Templ Component Patterns

## Base Layout

```go
// internal/ui/layouts/base.templ
package layouts

templ Base(title string) {
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{ title }</title>
        <link rel="stylesheet" href="/assets/dist/app.css"/>
        <script src="https://unpkg.com/htmx.org@2/dist/htmx.min.js"></script>
    </head>
    <body hx-boost="true" class="bg-background text-foreground">
        { children... }
    </body>
    </html>
}
```

## Page Template

```go
// internal/ui/pages/campaigns.templ
package pages

import (
    "yourapp/internal/models"
    "yourapp/internal/ui/layouts"
    "yourapp/internal/ui/components"
)

templ CampaignsPage(campaigns []models.Campaign) {
    @layouts.Base("Campaigns") {
        <main class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Campaigns</h1>
                <button
                    hx-get="/campaigns/new"
                    hx-target="#modal"
                    hx-swap="innerHTML"
                    class="btn btn-primary">
                    New Campaign
                </button>
            </div>
            <div id="campaign-list">
                @components.CampaignList(campaigns)
            </div>
            <div id="modal"></div>
        </main>
    }
}
```

## Reusable Component

```go
// internal/ui/components/campaign_card.templ
package components

import "yourapp/internal/models"

templ CampaignCard(c models.Campaign) {
    <div class="card p-4 mb-3" id={ "campaign-" + c.ID.String() }>
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-semibold">{ c.Name }</h3>
                <span class={ "badge", statusBadgeClass(c.Status) }>{ c.Status }</span>
            </div>
            <div class="flex gap-2">
                <button
                    hx-get={ "/campaigns/" + c.ID.String() + "/edit" }
                    hx-target={ "#campaign-" + c.ID.String() }
                    hx-swap="outerHTML"
                    class="btn btn-sm btn-ghost">
                    Edit
                </button>
                <button
                    hx-delete={ "/campaigns/" + c.ID.String() }
                    hx-confirm="Delete this campaign?"
                    hx-target={ "#campaign-" + c.ID.String() }
                    hx-swap="outerHTML swap:500ms"
                    class="btn btn-sm btn-ghost text-destructive">
                    Delete
                </button>
            </div>
        </div>
    </div>
}

func statusBadgeClass(status string) string {
    switch status {
    case "active":
        return "badge-success"
    case "draft":
        return "badge-secondary"
    default:
        return "badge-outline"
    }
}
```

## Form Component

```go
// internal/ui/components/campaign_form.templ
package components

templ CampaignForm(name, errorMsg string) {
    <form
        hx-post="/campaigns"
        hx-target="this"
        hx-swap="outerHTML"
        class="space-y-4">
        <div class="form-group">
            <label for="name" class="form-label">Name</label>
            <input
                type="text"
                id="name"
                name="name"
                value={ name }
                class="input"
                required/>
            if errorMsg != "" {
                <p class="text-destructive text-sm mt-1">{ errorMsg }</p>
            }
        </div>
        <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">
                <span class="htmx-indicator loading loading-spinner loading-sm"></span>
                Save
            </button>
            <button type="button" hx-on:click="this.closest('form').remove()" class="btn btn-ghost">
                Cancel
            </button>
        </div>
    </form>
}
```

## List Component

```go
templ CampaignList(campaigns []models.Campaign) {
    if len(campaigns) == 0 {
        <div class="text-center py-12 text-muted-foreground">
            <p>No campaigns yet.</p>
        </div>
    } else {
        for _, c := range campaigns {
            @CampaignCard(c)
        }
    }
}
```

## Render in Handler

```go
// Full page
pages.CampaignsPage(campaigns).Render(r.Context(), w)

// Partial (for HTMX swap)
components.CampaignList(campaigns).Render(r.Context(), w)

// Error state
components.CampaignForm(name, "Name is required").Render(r.Context(), w)
```

## Critical Rules

- Never use `templ.Raw()` on user-supplied input
- Run `templ generate` after every `.templ` file change
- Generated `_templ.go` files should not be edited manually
- Import paths must match the actual Go package structure
