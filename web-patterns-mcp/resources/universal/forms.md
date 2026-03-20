---
description: Form validation, error display, multi-step forms, progressive enhancement, and accessibility.
---

# Forms

## Validation Strategy

Validate on both client and server. Server is the source of truth.

### Server-Side (Required)

```
validate(input):
    errors = {}

    if !input.email:
        errors.email = "Email is required"
    elif !isValidEmail(input.email):
        errors.email = "Invalid email format"

    if !input.title:
        errors.title = "Title is required"
    elif len(input.title) > 200:
        errors.title = "Title must be under 200 characters"

    if errors:
        return { valid: false, errors }
    return { valid: true, data: sanitized_input }
```

### Client-Side (Enhancement)

- Use HTML5 validation attributes: `required`, `type="email"`, `minlength`, `maxlength`, `pattern`
- Add JavaScript validation for complex rules (password match, async email check)
- Always re-validate on server — client validation is a UX convenience, not security

## Error Display

### Per-Field Inline Errors

```html
<label for="email">Email</label>
<input id="email" type="email" name="email" required aria-describedby="email-error">
<span id="email-error" role="alert" class="error">Invalid email format</span>
```

**Rules:**
- Show errors next to the field, not just in a banner
- Use `role="alert"` for screen reader announcements
- Use `aria-describedby` to link error to input
- Highlight the field visually (red border, error icon)
- Clear error when user starts correcting

### Form-Level Errors

For errors that don't belong to a specific field (e.g. "Email already registered"):

```html
<div role="alert" class="form-error">
    An account with this email already exists.
</div>
```

## Progressive Enhancement

Forms should work without JavaScript:

1. Standard `<form>` with `action` and `method`
2. Server handles POST, returns rendered page with errors or redirect
3. JavaScript enhances with: inline validation, loading states, partial updates

For server-rendered stacks (Go+HTMX, Rails+Hotwire), this is the default.
For SPA stacks (Next.js, SvelteKit), use server actions / form actions.

## Multi-Step Forms (Wizards)

```
Step 1: Basic Info      → validate → store in session/state
Step 2: Details         → validate → store
Step 3: Review & Submit → show summary → submit all
```

**Rules:**
- Validate each step before advancing
- Allow going back without losing data
- Show progress indicator (Step 2 of 3)
- Final submit sends all data at once

## Form State Preservation

On validation failure, preserve all entered values:

```
# Server returns the form pre-filled with submitted values + errors
render form({
    values: submitted_values,    // what the user typed
    errors: validation_errors    // per-field errors
})
```

Never make the user re-enter valid fields after a validation error.

## Loading States

```html
<button type="submit" data-loading="Saving...">
    Save Campaign
</button>
```

On submit:
1. Disable button
2. Show loading text/spinner
3. On success: redirect or show success message
4. On error: re-enable button, show errors

## File Uploads

- Use `enctype="multipart/form-data"` for file uploads
- Validate file type and size on both client and server
- For large files: use presigned URLs (S3, GCS) + direct upload
- Show upload progress for files > 1MB
- Maximum file size: enforce server-side (default 10MB)

## Accessibility Checklist

- [ ] Every `<input>` has a `<label>` (or `aria-label`)
- [ ] Required fields have `required` attribute + visual indicator
- [ ] Error messages have `role="alert"`
- [ ] Errors linked to inputs via `aria-describedby`
- [ ] Form can be submitted via Enter key
- [ ] Tab order follows visual order
- [ ] Focus moves to first error on failed submission
