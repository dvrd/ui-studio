---
description: Table component — data display, sorting, pagination, responsive behavior, and empty states.
---

# Table

## Basic Structure

```html
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
            <td>Campaign Alpha</td>
            <td><span class="badge badge-success">Active</span></td>
            <td>Jan 15, 2025</td>
            <td class="text-right">
                <button class="btn btn-sm btn-ghost">Edit</button>
            </td>
        </tr>
    </tbody>
</table>
```

## Sortable Headers

```html
<th>
    <button class="flex items-center gap-1" hx-get="/campaigns?sort=name&dir=asc">
        Name
        <svg><!-- sort icon --></svg>
    </button>
</th>
```

## Pagination

```html
<div class="flex justify-between items-center mt-4">
    <span class="text-sm text-gray-500">Showing 1-25 of 150</span>
    <div class="flex gap-2">
        <button class="btn btn-sm" disabled>Previous</button>
        <button class="btn btn-sm" hx-get="/campaigns?page=2">Next</button>
    </div>
</div>
```

## Responsive Behavior

On mobile (< 768px), tables should transform to cards:

```html
<!-- Desktop: table -->
<table class="hidden md:table">...</table>

<!-- Mobile: card list -->
<div class="md:hidden space-y-3">
    <div class="card">
        <div class="flex justify-between">
            <span class="font-medium">Campaign Alpha</span>
            <span class="badge badge-success">Active</span>
        </div>
        <div class="text-sm text-gray-500">Jan 15, 2025</div>
    </div>
</div>
```

## Empty State

```html
<div class="text-center py-12">
    <svg class="mx-auto h-12 w-12 text-gray-400"><!-- empty icon --></svg>
    <h3 class="mt-2 text-sm font-semibold">No campaigns</h3>
    <p class="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
    <div class="mt-6">
        <a href="/campaigns/new" class="btn btn-primary">New Campaign</a>
    </div>
</div>
```

## Loading State (Skeleton)

```html
<table class="table">
    <tbody>
        <tr class="animate-pulse">
            <td><div class="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td><div class="h-4 bg-gray-200 rounded w-16"></div></td>
            <td><div class="h-4 bg-gray-200 rounded w-24"></div></td>
        </tr>
        <!-- repeat 5 rows -->
    </tbody>
</table>
```
