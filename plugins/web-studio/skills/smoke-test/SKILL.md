---
description: Visual smoke test of all routes via Chrome DevTools.
user-invocable: true
---

# Smoke Test

Full visual verification of all application routes at desktop and mobile viewports.

## Prerequisites

1. Chrome DevTools MCP must be connected
2. Dev server must be running

## Steps

1. `steps/delivery/smoke-test.md` — Navigate all routes, screenshot, check console and network

## Success Criteria

- All routes render without console errors
- No 5xx network responses
- Desktop and mobile screenshots saved for every route
- `.ui-studio/web-project.json` routes marked as verified
