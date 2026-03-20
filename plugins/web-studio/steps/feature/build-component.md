---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://forms.md
  - universal://accessibility.md
  - stack://{stackId}/components.md
---

# Build Component

Build an interactive, reusable UI component.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read design-system to check if a similar component already exists
- Read stack-specific component patterns
- Confirm with user: component name, behavior, props/inputs
- Return manifest:

```json
{
  "found": true,
  "componentName": "CampaignForm",
  "existingDesignSystemComponents": ["input", "button", "card"],
  "customRequired": true,
  "props": [
    { "name": "campaign", "type": "Campaign | null", "description": "existing campaign for edit, null for create" },
    { "name": "onSubmit", "type": "function", "description": "submit handler" }
  ],
  "interactions": ["form validation", "submit with loading state", "error display"],
  "accessibility": ["form labels", "error announcements", "keyboard submit"]
}
```

## Phase 2 — Do

Launch **web-builder** subagent:
- Read design-system components to use as building blocks
- Create component file in stack-appropriate location
- Implement props/inputs interface
- Build UI using design system components where possible
- Add interactions (validation, loading states, error handling)
- Add accessibility (labels, ARIA, keyboard support)
- Run build command

Commit: `feat({scope}): add {componentName} component`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Visual check** (if component is rendered on an existing page):
   - Navigate to page with component — screenshot
   - Test interaction (fill form, click button)
3. **Accessibility check**: Labels present, keyboard navigable

**Pass criteria**: Build passes AND component renders correctly.
**Fail criteria**: Build fails OR component doesn't render.
