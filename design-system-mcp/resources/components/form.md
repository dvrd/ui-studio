---
description: Form layout component — field groups, sections, inline errors, submit button, and responsive layout.
---

# Form Layout

## Standard Form

```html
<form class="space-y-4 max-w-lg">
    <div class="form-group">
        <label for="title">Title</label>
        <input id="title" type="text" name="title" class="input" required />
    </div>

    <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status" class="input">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
        </select>
    </div>

    <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" class="input" rows="4"></textarea>
    </div>

    <div class="flex gap-3 justify-end">
        <button type="button" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
    </div>
</form>
```

## Two-Column Layout (Desktop)

```html
<form class="space-y-4 max-w-2xl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
            <label for="first-name">First name</label>
            <input id="first-name" class="input" />
        </div>
        <div class="form-group">
            <label for="last-name">Last name</label>
            <input id="last-name" class="input" />
        </div>
    </div>

    <!-- Full-width fields for long content -->
    <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" class="input" />
    </div>
</form>
```

## Form Sections

```html
<form class="space-y-8">
    <fieldset class="space-y-4">
        <legend class="text-lg font-semibold">Basic Information</legend>
        <!-- fields -->
    </fieldset>

    <fieldset class="space-y-4">
        <legend class="text-lg font-semibold">Settings</legend>
        <!-- fields -->
    </fieldset>
</form>
```

## Spacing

- Between fields: `space-y-4` (16px)
- Between sections: `space-y-8` (32px)
- Form max width: `max-w-lg` (32rem) or `max-w-2xl` (42rem)
- Submit button alignment: right (`justify-end`)
