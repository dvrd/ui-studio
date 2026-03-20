---
description: Navigation patterns — sidebar, top nav, breadcrumbs, mobile menu, and active states.
---

# Navigation

## Sidebar

```html
<aside class="w-64 bg-white border-r h-screen sticky top-0 hidden md:block">
    <div class="p-4">
        <a href="/" class="font-bold text-lg">AppName</a>
    </div>
    <nav class="px-2 space-y-1">
        <a href="/dashboard" class="nav-link nav-link-active">
            <svg><!-- icon --></svg>
            Dashboard
        </a>
        <a href="/campaigns" class="nav-link">
            <svg><!-- icon --></svg>
            Campaigns
        </a>
        <a href="/billing" class="nav-link">
            <svg><!-- icon --></svg>
            Billing
        </a>
        <a href="/settings" class="nav-link">
            <svg><!-- icon --></svg>
            Settings
        </a>
    </nav>
</aside>
```

## Top Navigation

```html
<header class="bg-white border-b">
    <div class="container mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" class="font-bold">AppName</a>
        <nav class="hidden md:flex gap-6">
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="/campaigns" class="nav-link">Campaigns</a>
        </nav>
        <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm">Profile</button>
            <form method="POST" action="/logout">
                <button class="btn btn-ghost btn-sm">Logout</button>
            </form>
        </div>
    </div>
</header>
```

## Mobile Menu

```html
<!-- Hamburger button (visible on mobile only) -->
<button class="md:hidden" aria-label="Open menu" onclick="toggleMenu()">
    <svg><!-- hamburger icon --></svg>
</button>

<!-- Slide-out drawer -->
<div id="mobile-menu" class="fixed inset-0 z-50 hidden">
    <div class="bg-black/50 absolute inset-0" onclick="toggleMenu()"></div>
    <nav class="bg-white w-64 h-full relative z-10 p-4 space-y-2">
        <a href="/dashboard" class="nav-link">Dashboard</a>
        <a href="/campaigns" class="nav-link">Campaigns</a>
        <a href="/billing" class="nav-link">Billing</a>
    </nav>
</div>
```

## Breadcrumbs

```html
<nav aria-label="Breadcrumb" class="text-sm text-gray-500 mb-4">
    <ol class="flex items-center gap-2">
        <li><a href="/campaigns">Campaigns</a></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-gray-900">Edit Campaign</li>
    </ol>
</nav>
```

## Active States

- Active link: bold text + primary color + left border (sidebar) or underline (top nav)
- Hover: slight background highlight
- Focus: visible focus ring
