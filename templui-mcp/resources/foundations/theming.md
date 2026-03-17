---
description: templUI v1.6 theming — CSS variables, dark mode, and color tokens.
---

# Theming

## Setup in app.css

```css
@import "tailwindcss";
@import "templui/styles";
```

## CSS Variable Tokens

templUI uses CSS variables that map to shadcn/ui conventions:

```css
/* Light theme (default) */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

## Using Tokens in Templ

```html
<!-- Background and text -->
<div class="bg-background text-foreground">

<!-- Card -->
<div class="bg-card text-card-foreground border border-border rounded-lg">

<!-- Muted text -->
<p class="text-muted-foreground text-sm">

<!-- Primary action -->
<button class="bg-primary text-primary-foreground">

<!-- Destructive action -->
<button class="bg-destructive text-destructive-foreground">
```

## Dark Mode

Add `class="dark"` to `<html>` to activate dark theme. templUI handles variable overrides automatically.

## Border Radius

Use `rounded-[--radius]` for consistent radius matching the theme config, or use templUI component classes which apply it automatically.
