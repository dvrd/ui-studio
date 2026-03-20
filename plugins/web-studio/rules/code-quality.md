## Code Quality & Verification Rules

These rules are non-negotiable. They are what make Web Studio consistent across stacks and sessions.

### 3-Phase Verification

Every step produces verifiable output. Verification is not optional.

**Phase 1 output** must include `"found": true/false`. If false → `Next(failed)`.
**Phase 2 output** must include evidence: file paths created, build status.
**Phase 3** must produce objective evidence: screenshots, build output, test results.

### No-Excuses Rule

These are NOT valid reasons to skip verification:

- "Dev server won't start" — fix it. The build is broken.
- "Chrome isn't available" — set it up first. Visual verification is mandatory.
- "Tests can't run" — they can. Fix the test environment.
- "The code looks right" — looking right is not evidence. Run it.
- "Will verify later" — no. Verify now or call `Next(failed)`.
- "It worked in a similar project" — this is a different project. Verify.

### Fix-It-Don't-Skip-It Rule

When something fails:
1. Investigate the root cause
2. Fix the underlying issue
3. Re-run verification

Do NOT:
- Skip the step and move on
- Add fallback data to make it "look" like it works
- Mark as passed with a caveat

Call `Next(failed)` — the workflow handles retries and escalation.

### Status Update Rule

Do not update `web-project.json` status until Phase 3 verification passes. A status update without verification is a false claim of completion.

### Evidence Rule

Every verification produces an artifact:

| Verification type | Evidence |
|---|---|
| Build check | Build command output (pass/fail) |
| Visual check | Screenshot at `.ui-studio/screenshots/{feature}-v{N}.png` |
| Mobile check | Screenshot at `.ui-studio/screenshots/{feature}-mobile-v{N}.png` |
| Console check | List of console errors (or "0 errors") |
| Network check | List of failed requests (or "0 failures") |
| Test check | Test runner output with pass/fail counts |

### Build Commands by Stack

| Stack | Build command | Additional checks |
|---|---|---|
| `go-templ-htmx` | `go build ./...` | `go vet ./...`, `templ generate` |
| `nextjs-react` | `npm run build` | `npx tsc --noEmit` |
| `sveltekit-svelte` | `npm run build` | `npx svelte-check` |
| `nuxt3-vue` | `npx nuxi build` | `npx vue-tsc --noEmit` |
| `rails-hotwire` | `bundle exec rails assets:precompile` | `bundle exec rubocop` |
| `django` | `python manage.py check` | `python -m mypy .` |

### Commit Convention

Commits follow conventional commits:
- `feat({scope}): add {description}` — new feature
- `fix({scope}): fix {description}` — bug fix
- `refactor({scope}): {description}` — code change without behavior change

Scope is the feature name (e.g. `auth`, `billing`, `campaigns`).

Never commit without a passing build. Never commit with known failing tests.
