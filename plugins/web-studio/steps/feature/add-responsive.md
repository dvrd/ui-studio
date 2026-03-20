---
agent: web-designer
requires: [projectDir, stackId]
resources:
  - universal://responsive-layout.md
  - universal://accessibility.md
---

# Add Responsive Design

Make all pages responsive across mobile, tablet, and desktop viewports.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read `.ui-studio/web-project.json` to get all routes
- Read `universal://responsive-layout.md` for patterns
- For each route, check if responsive styles already exist
- Return manifest:

```json
{
  "found": true,
  "pages": [
    { "route": "/dashboard", "file": "...", "hasResponsive": false },
    { "route": "/campaigns", "file": "...", "hasResponsive": false },
    { "route": "/login", "file": "...", "hasResponsive": true }
  ]
}
```

**SetItems from**: manifest.pages[] (where hasResponsive === false)

## Phase 2 — Do

For each page, launch **web-designer** subagent:
- Read responsive layout patterns
- Read design-system components for responsive variants
- Apply mobile-first responsive design:
  - Stack layouts vertically on mobile
  - Collapse sidebar to hamburger menu
  - Convert tables to card layout on mobile
  - Ensure touch targets minimum 44x44px
  - Verify text readability (min 16px)
- Run build command

Commit per batch: `feat(responsive): add mobile support for {pages}`

## Phase 3 — Verify

For each page, run **responsive check procedure**:

1. **Desktop (1440x900)**: Screenshot, verify layout
2. **Tablet (768x1024)**: Screenshot, verify adaptation
3. **Mobile (375x812)**: Screenshot, verify stacking

Check for each viewport:
- No horizontal scroll
- Content readable
- Interactive elements accessible
- No broken layouts

**Pass criteria**: All pages render correctly at all 3 viewports.
**Fail criteria**: Any page has horizontal scroll, broken layout, or unreadable text.
