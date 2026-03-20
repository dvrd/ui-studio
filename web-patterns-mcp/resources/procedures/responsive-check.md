---
description: Responsive verification procedure — test at 3 viewports, check layout, touch targets, and no horizontal scroll.
---

# Responsive Check Procedure

## Steps

1. **Desktop (1440x900)**:
   ```
   chrome-devtools: resize_page({ width: 1440, height: 900 })
   chrome-devtools: take_screenshot({ filePath: ".ui-studio/screenshots/{name}-desktop-v{N}.png", fullPage: true })
   ```
   Check: Content fills available width, no excessive whitespace

2. **Tablet (768x1024)**:
   ```
   chrome-devtools: resize_page({ width: 768, height: 1024 })
   chrome-devtools: take_screenshot({ filePath: ".ui-studio/screenshots/{name}-tablet-v{N}.png", fullPage: true })
   ```
   Check: Layout adapts (sidebar collapses, grid reduces columns)

3. **Mobile (375x812)**:
   ```
   chrome-devtools: resize_page({ width: 375, height: 812 })
   chrome-devtools: take_screenshot({ filePath: ".ui-studio/screenshots/{name}-mobile-v{N}.png", fullPage: true })
   ```
   Check: Single column, no horizontal scroll, readable text

4. **Restore**: `chrome-devtools: resize_page({ width: 1440, height: 900 })`

## Pass Criteria

- No horizontal scroll at any viewport
- Text is readable (minimum 16px body text)
- Interactive elements minimum 44x44px on mobile
- Layout adapts appropriately (stacking, collapsing)
- Images don't overflow container
