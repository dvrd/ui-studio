## Artifacts

`.gocrft/` is the temp directory for all intermediate work (screenshots, analysis output, drafts).

Subagents return:
```json
{
  "success": true,
  "results": ".gocrft/...",
  "summary": "<200 char summary of what was done>"
}
```

Screenshot naming: `screenshots/{feature}-iter{N}.png` (e.g. `screenshots/auth-login-iter1.png`)

Never write permanent documentation files unless explicitly requested by the user.
