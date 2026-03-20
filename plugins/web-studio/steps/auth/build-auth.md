---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://authentication.md
  - universal://security.md
  - stack://{stackId}/auth-impl.md
---

# Build Authentication

Add a complete authentication system to the web application.

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read `universal://authentication.md` and `stack://{stackId}/auth-impl.md` from web-patterns
- Read existing project code to understand current structure
- Confirm with user: auth method (JWT, session, OAuth providers, magic link)
- Return manifest:

```json
{
  "found": true,
  "authMethod": "jwt",
  "oauthProviders": ["google"],
  "magicLink": true,
  "routes": [
    { "path": "/login", "method": "GET+POST", "auth": false },
    { "path": "/register", "method": "GET+POST", "auth": false },
    { "path": "/forgot-password", "method": "GET+POST", "auth": false },
    { "path": "/auth/callback/google", "method": "GET", "auth": false },
    { "path": "/logout", "method": "POST", "auth": true },
    { "path": "/dashboard", "method": "GET", "auth": true }
  ],
  "files": {
    "create": ["handler", "service", "repository", "migration", "middleware", "pages", "components"],
    "modify": ["main/entry point", "config"]
  },
  "configFields": ["JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "RESEND_API_KEY"]
}
```

**SetItems from**: manifest.routes[]

## Phase 2 — Do

For each route in the manifest, launch **web-builder** subagent:
- Read auth patterns (universal + stack-specific)
- Implement the route's handler, service logic, and UI
- For the first route: also create migration, middleware, repository, and config fields
- For subsequent routes: build on existing auth infrastructure
- Run build command after each route

Commit after all routes: `feat(auth): add {authMethod} authentication`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Structure check**: All auth files exist (handler, service, repository, migration, middleware)
3. **Route check**: All routes from manifest are registered
4. **Visual check** (requires Chrome + running server):
   - Navigate to `/login` — screenshot
   - Navigate to `/register` — screenshot
   - Verify protected route redirects to login when unauthenticated
5. **Update manifest**: Update `.ui-studio/web-project.json`:
   - Add auth feature with status `"verified"` (or `"built"` if no visual check)
   - Update project status to `"authed"`

**Pass criteria**: Build passes AND all auth files exist AND routes registered.
**Fail criteria**: Build fails OR missing files OR routes not registered.
