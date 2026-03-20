---
description: Full delivery pipeline — scaffold → auth → features → integrations → responsive → tests → smoke test → review → ship.
user-invocable: true
---

# Deliver

The complete web application delivery pipeline. Orchestrates all steps from scaffolding to shipping.

## Inputs

Confirm with user before proceeding:
- `appName` — project name
- `stackId` — tech stack (auto-detect or choose)
- `designSystem` — component library
- `features` — list of domain features to build (e.g. campaigns, leads, invoices)
- `integrations` — which integrations (payments, email, realtime)
- `authMethod` — JWT, session, OAuth providers

## Pipeline

Execute these steps in order. Each step follows the 3-phase protocol.

### Stage 1: Foundation
1. `steps/scaffold/init-project.md` — Create project structure
2. `steps/scaffold/verify-scaffold.md` — Visual verification

### Stage 2: Authentication
3. `steps/auth/build-auth.md` — Build auth system
4. `steps/auth/verify-auth.md` — Visual verification of auth pages

### Stage 3: Domain Features
For each feature in the user's list:
5. `steps/feature/build-service.md` — Build feature (data → service → routes → UI)

### Stage 4: Integrations
For each integration requested:
6. `steps/integration/build-payments.md` — if payments requested
7. `steps/integration/build-email.md` — if email requested
8. `steps/integration/build-realtime.md` — if realtime requested

### Stage 5: Polish
9. `steps/feature/add-responsive.md` — Make all pages responsive
10. `steps/testing/build-tests.md` — Write tests for all features

### Stage 6: Delivery
11. `steps/delivery/smoke-test.md` — Full visual verification of all routes
12. `steps/delivery/review.md` — Code review for security and correctness
13. `steps/delivery/ship.md` — Lint, test, and commit

## Success Criteria

- All stages complete with passing verifications
- Every route renders correctly at desktop and mobile viewports
- All tests pass
- Code review has no critical or major issues
- Final commit is clean

## On Failure

If any stage fails:
- Stop at the failing step
- Report what failed and why
- Wait for user direction before proceeding

Never skip a failing step to continue the pipeline.
