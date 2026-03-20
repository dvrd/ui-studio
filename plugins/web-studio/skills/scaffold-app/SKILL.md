---
description: Scaffold a new web application with any supported stack.
user-invocable: true
agent: web-studio:web-builder
---

# Scaffold App

Creates a new web application with the standard project structure for the chosen stack.

## Inputs

Confirm with user before proceeding:
- `appName` — kebab-case project name (e.g. `myapp`)
- `stackId` — tech stack (auto-detect or ask: `go-templ-htmx`, `nextjs-react`, `sveltekit-svelte`, `nuxt3-vue`, `rails-hotwire`)
- `designSystem` — component library (suggest based on stack: `templui`, `shadcn`, `skeleton`, `vuetify`, `daisyui`)
- Database name and port (stack defaults apply)

## Steps

Execute these step files in order, following the 3-phase protocol for each:

1. `steps/scaffold/init-project.md` — Create project structure, install dependencies, verify build
2. `steps/scaffold/verify-scaffold.md` — Visual verification via Chrome DevTools

## Success Criteria

- Stack build command passes
- App loads in Chrome at localhost
- `.ui-studio/web-project.json` exists with status `"scaffolded"`
- Desktop and mobile screenshots saved

## Next Steps

Suggest: `/web-studio:build-auth` to add authentication
