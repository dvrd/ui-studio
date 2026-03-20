---
description: WCAG compliance, ARIA, keyboard navigation, screen readers, color contrast, and focus management.
---

# Accessibility

## Semantic HTML First

Use the right element for the job — ARIA is a last resort:

```html
<!-- Good: semantic -->
<nav>...</nav>
<main>...</main>
<button>Save</button>
<a href="/dashboard">Dashboard</a>

<!-- Bad: div soup + ARIA -->
<div role="navigation">...</div>
<div role="main">...</div>
<div role="button" tabindex="0">Save</div>
<div role="link" tabindex="0" onclick="...">Dashboard</div>
```

## Landmark Structure

Every page should have:

```html
<header>          <!-- site header, logo, nav -->
<nav>             <!-- main navigation -->
<main>            <!-- primary content (ONE per page) -->
<aside>           <!-- sidebar, related content -->
<footer>          <!-- site footer -->
```

## Keyboard Navigation

All interactive elements must be reachable via keyboard:

- **Tab**: move to next interactive element
- **Shift+Tab**: move to previous
- **Enter/Space**: activate buttons and links
- **Escape**: close modals, dropdowns, popovers
- **Arrow keys**: navigate within menus, tabs, lists

**Rules:**
- Tab order follows visual order (don't use tabindex > 0)
- Focus indicator is always visible (never `outline: none` without replacement)
- Modals trap focus (Tab cycles within modal until closed)
- After closing modal, return focus to trigger element

## Focus Management

```
// When opening a modal:
1. Save reference to trigger element
2. Move focus to first focusable element in modal
3. Trap focus within modal (Tab cycles)
4. On close: return focus to saved trigger element

// When showing inline error:
1. Move focus to first error field
2. Announce error via aria-live region
```

## Color Contrast

WCAG AA minimum:
- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio
- **UI components** (borders, icons): 3:1 contrast ratio

Never use color alone to convey information — add icons, text, or patterns.

## Form Accessibility

```html
<!-- Every input needs a label -->
<label for="email">Email address</label>
<input id="email" type="email" required aria-describedby="email-help email-error">
<span id="email-help">We'll never share your email.</span>
<span id="email-error" role="alert"></span>

<!-- Required fields -->
<label for="name">Name <span aria-hidden="true">*</span></label>
<input id="name" required aria-required="true">
```

## Live Regions

For dynamic content updates (notifications, real-time data):

```html
<!-- Polite: announced when user is idle -->
<div aria-live="polite">
    Campaign saved successfully.
</div>

<!-- Assertive: announced immediately (errors, critical alerts) -->
<div aria-live="assertive" role="alert">
    Error: Email is already registered.
</div>
```

## Images

```html
<!-- Informative image: describe content -->
<img src="chart.png" alt="Sales increased 25% in Q3 2025">

<!-- Decorative image: empty alt -->
<img src="divider.png" alt="">

<!-- Complex image: longer description -->
<figure>
    <img src="architecture.png" alt="System architecture diagram">
    <figcaption>Three-tier architecture with load balancer, app servers, and database cluster.</figcaption>
</figure>
```

## Checklist

- [ ] All pages have landmarks (header, nav, main, footer)
- [ ] All interactive elements reachable via keyboard
- [ ] Focus indicator visible on all interactive elements
- [ ] All form inputs have labels
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Error messages announced to screen readers
- [ ] Modals trap and return focus
- [ ] Page has descriptive `<title>`
- [ ] Language set on `<html lang="en">`
