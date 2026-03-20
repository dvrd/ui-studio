---
description: Add authentication to a web application (JWT, session, OAuth, magic link).
user-invocable: true
agent: web-studio:web-builder
---

# Build Auth

Adds a complete authentication system adapted to the project's stack.

## Inputs

Confirm with user:
- Auth method: JWT (default for server-rendered), session (default for SSR frameworks), or both
- OAuth providers: Google, GitHub, or none
- Magic link: yes/no
- Password reset: yes/no

## Steps

Execute these step files in order:

1. `steps/auth/build-auth.md` — Build auth infrastructure (handlers, service, repository, migration, middleware, UI)
2. `steps/auth/verify-auth.md` — Visual verification of auth pages and protected redirect

## Success Criteria

- Build passes
- Login, register, forgot-password pages render
- Protected routes redirect to login when unauthenticated
- `.ui-studio/web-project.json` updated with auth feature status `"verified"`

## Next Steps

Suggest: `/web-studio:build-feature {name}` to add domain features
