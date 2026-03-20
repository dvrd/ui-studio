---
description: Templ component patterns — composition, props, conditionals, loops, HTMX attributes, and templUI usage.
---

# Go Templ Components

## Basic Component

```go
package components

templ CampaignCard(campaign models.Campaign) {
    <div class="card">
        <div class="card-header">
            <h3 class="font-semibold text-lg">{ campaign.Title }</h3>
            <span class={ "badge", statusBadgeClass(campaign.Status) }>
                { campaign.Status }
            </span>
        </div>
        <div class="card-body">
            <p class="text-gray-600">Created { campaign.CreatedAt.Format("Jan 2, 2006") }</p>
        </div>
        <div class="card-footer flex gap-2">
            <a href={ templ.SafeURL(fmt.Sprintf("/campaigns/%s", campaign.ID)) } class="btn btn-sm">
                View
            </a>
            <button
                hx-delete={ fmt.Sprintf("/campaigns/%s", campaign.ID) }
                hx-target="closest .card"
                hx-swap="outerHTML"
                hx-confirm="Delete this campaign?"
                class="btn btn-sm btn-danger"
            >
                Delete
            </button>
        </div>
    </div>
}

func statusBadgeClass(status string) string {
    switch status {
    case "active": return "badge-success"
    case "paused": return "badge-warning"
    default: return "badge-default"
    }
}
```

## Form Component

```go
templ CampaignForm(values services.CreateCampaignInput, errors map[string]string) {
    <form hx-post="/campaigns" hx-target="#main-content" hx-swap="innerHTML">
        <div class="form-group">
            <label for="title">Title</label>
            <input
                type="text"
                id="title"
                name="title"
                value={ values.Title }
                required
                class={ "input", errorClass(errors, "title") }
                aria-describedby={ errorID(errors, "title") }
            />
            if msg, ok := errors["title"]; ok {
                <span id="title-error" role="alert" class="text-red-500 text-sm">{ msg }</span>
            }
        </div>

        <div class="form-group">
            <label for="status">Status</label>
            <select id="status" name="status" class="input">
                <option value="draft" selected?={ values.Status == "draft" }>Draft</option>
                <option value="active" selected?={ values.Status == "active" }>Active</option>
            </select>
        </div>

        <button type="submit" class="btn btn-primary">
            Save Campaign
        </button>
    </form>
}
```

## Page Template

```go
package pages

templ CampaignList(campaigns []models.Campaign) {
    @layouts.Base("Campaigns") {
        <div class="container mx-auto py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Campaigns</h1>
                <a href="/campaigns/new" class="btn btn-primary">New Campaign</a>
            </div>

            if len(campaigns) == 0 {
                <div class="text-center py-12 text-gray-500">
                    <p>No campaigns yet. Create your first one!</p>
                </div>
            } else {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    for _, campaign := range campaigns {
                        @components.CampaignCard(campaign)
                    }
                </div>
            }
        </div>
    }
}
```

## Layout

```go
package layouts

templ Base(title string) {
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{ title }</title>
        <link rel="stylesheet" href="/assets/dist/app.css"/>
        <script src="https://unpkg.com/htmx.org@2"></script>
    </head>
    <body hx-boost="true">
        <nav class="bg-white border-b px-6 py-3">
            <a href="/" class="font-bold">App</a>
        </nav>
        <main id="main-content">
            { children... }
        </main>
    </body>
    </html>
}
```

## Rules

- Components in `internal/ui/components/`
- Pages in `internal/ui/pages/`
- Layouts in `internal/ui/layouts/`
- Always run `templ generate` after editing `.templ` files
- Never use `templ.Raw()` on user input (XSS)
- Use `templ.SafeURL()` for dynamic URLs
- Use templUI classes for consistent styling
