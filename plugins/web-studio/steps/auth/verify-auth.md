---
requires: [projectDir, stackId]
---

# Verify Auth

Visual verification that the authentication flow works end-to-end.

## Phase 1 — Analyze

Orchestrator reads `.ui-studio/web-project.json`:
- Find auth feature, extract routes
- Return manifest of auth routes to verify

## Phase 2 — Do

1. Start dev server if not running
2. Navigate Chrome to each auth route

## Phase 3 — Verify

1. **Login page**: Navigate to `/login` — screenshot, check form renders
2. **Register page**: Navigate to `/register` — screenshot, check form renders
3. **Protected redirect**: Navigate to a protected route without auth — should redirect to `/login`
4. **Console**: No errors on any auth page
5. **Mobile**: All auth pages render correctly at 375px

**Pass criteria**: All auth pages render, protected redirect works.
**Fail criteria**: Any auth page fails to render or redirect is broken.
