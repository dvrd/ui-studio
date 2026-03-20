## Artifacts

`.ui-studio/` is the project metadata directory. Contains:

- `web-project.json` — project manifest (state, features, routes, verifications)
- `screenshots/` — visual verification evidence

Subagents return:
```json
{
  "success": true,
  "results": ".ui-studio/...",
  "summary": "<200 char summary of what was done>"
}
```

Screenshot naming:
- Desktop: `.ui-studio/screenshots/{feature}-v{N}.png`
- Mobile: `.ui-studio/screenshots/{feature}-mobile-v{N}.png`
- N starts at 1, increments with each rebuild

Never write permanent documentation files unless explicitly requested by the user.
