---
description: Card component for content containers, stat cards, and list items.
---

# Card

## Basic Card

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Title</h3>
        <p class="card-description">Optional description</p>
    </div>
    <div class="card-content">
        <!-- content -->
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Action</button>
    </div>
</div>
```

## Stat Card

```html
<div class="card p-6">
    <div class="flex justify-between items-start">
        <div>
            <p class="text-sm text-muted-foreground">Total Revenue</p>
            <p class="text-2xl font-bold mt-1">$12,450</p>
            <p class="text-sm text-muted-foreground mt-1">
                <span class="text-green-600">+12%</span> from last month
            </p>
        </div>
        <div class="p-2 bg-primary/10 rounded-lg">
            <!-- icon -->
        </div>
    </div>
</div>
```

## Clickable Card

```html
<div class="card hover:shadow-md transition-shadow cursor-pointer"
     hx-get="/campaigns/42"
     hx-target="#main-content"
     hx-push-url="true">
    <div class="card-content p-4">
        <h3 class="font-semibold">Campaign Name</h3>
        <p class="text-sm text-muted-foreground">Status: Active</p>
    </div>
</div>
```

## Card Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- card items -->
</div>
```
