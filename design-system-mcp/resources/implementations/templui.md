---
description: templUI v1.6 implementation — shadcn/ui-style components for Go Templ + Tailwind v4.
---

# templUI Implementation

templUI provides shadcn/ui-style components for Go Templ applications with Tailwind v4.

## Setup

```css
/* assets/app.css */
@import "tailwindcss";
@import "templui/styles";
```

## Available Components

### Button
```go
@button.Button(button.Props{
    Variant: button.VariantDefault,
    Size:    button.SizeMd,
}) {
    Save Campaign
}
```

Variants: `VariantDefault`, `VariantDestructive`, `VariantOutline`, `VariantSecondary`, `VariantGhost`, `VariantLink`

### Input
```go
@input.Input(input.Props{
    Type:        input.TypeEmail,
    Placeholder: "you@example.com",
    Name:        "email",
    ID:          "email",
    Required:    true,
})
```

### Badge
```go
@badge.Badge(badge.Props{
    Variant: badge.VariantDefault,
}) {
    Active
}
```

### Card
```go
@card.Card(card.Props{}) {
    @card.Header() {
        @card.Title() { Campaign }
    }
    @card.Content() {
        <p>Card content</p>
    }
    @card.Footer() {
        @button.Button(button.Props{Size: button.SizeSm}) { View }
    }
}
```

### Table
```go
@table.Table(table.Props{}) {
    @table.Header() {
        @table.Row() {
            @table.Head() { Name }
            @table.Head() { Status }
        }
    }
    @table.Body() {
        for _, campaign := range campaigns {
            @table.Row() {
                @table.Cell() { { campaign.Title } }
                @table.Cell() {
                    @badge.Badge(badge.Props{}) { { campaign.Status } }
                }
            }
        }
    }
}
```

## CSS Classes

When not using the Go components directly, use these Tailwind classes:

```
.btn           → base button
.btn-primary   → primary variant
.btn-danger    → destructive variant
.btn-sm/md/lg  → sizes

.input         → form input
.badge         → badge
.card          → card container
.table         → data table

.form-group    → label + input + error wrapper
.nav-link      → navigation link
```

## Dark Mode

templUI respects `prefers-color-scheme` automatically.
