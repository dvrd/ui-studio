---
name: create-studio
description: Generate a specialized Claude Code studio for any tech stack. Infers patterns from existing code or accepts user-defined conventions.
user-invocable: true
---

# Create Studio

Generate a new Claude Code studio tailored to a specific project or stack.

## Steps

1. **Gather context**
   - Ask the user: what project do you want to generate a studio for?
   - Is there existing code? If yes, get the project path.
   - If no code: what stack/framework? What conventions should the studio know?

2. **Detect or confirm stack**
   - If project path provided: call `create_studio` with `project_path` — patterns are inferred automatically
   - If no code: call `create_studio` with `stack_description` and optionally `user_conventions`

3. **Generate the studio**

   With existing code:
   ```
   create_studio(
     name: "{project-name}-studio",
     project_path: "/path/to/project"
   )
   ```

   Without code:
   ```
   create_studio(
     name: "{stack}-studio",
     stack_description: "Next.js 14 + Drizzle + Stripe + Clerk",
     user_conventions: "... conventions text ..."
   )
   ```

4. **Report result**
   - Show what patterns were inferred
   - Remind user to restart Claude Code to activate the studio
   - Show path where the studio was installed

## Notes

- Studios are installed to `~/.claude/plugins/{name}/`
- The MCP server is registered in `~/.claude/settings.json` automatically
- To refresh patterns after adding more code: use `expand_studio`
- Each studio gets its own pattern MCP server + session hook + rules
