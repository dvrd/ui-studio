---
agent: web-reviewer
requires: [projectDir, stackId]
resources:
  - universal://security.md
  - universal://performance.md
  - stack://{stackId}/review-checklists.md
---

# Code Review

Full code review of the application for security, correctness, and conventions.

## Phase 1 — Analyze

Orchestrator gathers context:
- Read `.ui-studio/web-project.json` for features list
- Run `git diff --stat` to see what changed
- Return manifest of files/features to review

**SetItems from**: manifest.features[]

## Phase 2 — Do

For each feature, launch **web-reviewer** subagent:
- Read relevant patterns from web-patterns (universal + stack)
- Review all files for the feature against the review checklist
- Report issues with severity, file:line, and suggested fix

## Phase 3 — Verify

Orchestrator aggregates results:
- Count critical, major, minor issues across all features
- If any critical issues: overall verdict is CHANGES REQUESTED
- If only minor issues: overall verdict is APPROVED

**Report format**:
```
Code Review Summary

Features reviewed: N
Critical issues: N (blocks ship)
Major issues: N (blocks ship)
Minor issues: N (informational)

[Per-feature breakdown]

Overall verdict: APPROVED / CHANGES REQUESTED
```

**Pass criteria**: No critical or major issues.
**Fail criteria**: Any critical or major issue found.
