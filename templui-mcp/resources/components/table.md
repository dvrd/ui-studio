---
description: Table component for displaying lists of data with sorting and actions.
---

# Table

## Basic Table

```html
<div class="overflow-x-auto">
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
                <th class="text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="font-medium">Campaign Name</td>
                <td><span class="badge badge-secondary">Draft</span></td>
                <td class="text-muted-foreground text-sm">Jan 15, 2025</td>
                <td class="text-right">
                    <button class="btn btn-ghost btn-sm" hx-get="/campaigns/1/edit">Edit</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

## In Templ

```go
templ LeadTable(leads []models.Lead) {
    <div class="overflow-x-auto">
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th class="text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                if len(leads) == 0 {
                    <tr>
                        <td colspan="4" class="text-center text-muted-foreground py-8">
                            No leads yet
                        </td>
                    </tr>
                }
                for _, lead := range leads {
                    <tr>
                        <td class="font-medium">{ lead.Name }</td>
                        <td class="text-muted-foreground">{ lead.Email }</td>
                        <td>
                            <span class="badge badge-secondary">{ lead.Status }</span>
                        </td>
                        <td class="text-right">
                            <button
                                class="btn btn-ghost btn-sm"
                                hx-delete={ "/leads/" + lead.ID.String() }
                                hx-confirm="Delete this lead?"
                                hx-target="closest tr"
                                hx-swap="outerHTML">
                                Delete
                            </button>
                        </td>
                    </tr>
                }
            </tbody>
        </table>
    </div>
}
```
