#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';

const PLUGIN_ROOT = join(import.meta.dir, '..');
const RULES_DIR = join(PLUGIN_ROOT, 'rules');

// Read hook input JSON from stdin
let hookInput = '';
for await (const chunk of Bun.stdin.stream()) {
  hookInput += new TextDecoder().decode(chunk);
}

const input = JSON.parse(hookInput || '{}');
const sessionId: string = input.session_id || '';

const taskListId = process.env.CLAUDE_CODE_TASK_LIST_ID || sessionId || process.env.CLAUDE_SESSION_ID || '';

const orchestratorGuide = readFileSync(join(RULES_DIR, 'orchestrator-guide.md'), 'utf8');
const intentRouting = readFileSync(join(RULES_DIR, 'intent-routing.md'), 'utf8');
const goConventions = readFileSync(join(RULES_DIR, 'go-conventions.md'), 'utf8');
const commands = readFileSync(join(RULES_DIR, 'commands.md'), 'utf8');
const artifacts = readFileSync(join(RULES_DIR, 'artifacts.md'), 'utf8');

const systemPrompt = `<orchestrator-context>

### Orchestrator Identity

You are a Go Studio expert. You build production-quality Go SaaS applications for clients using a consistent, battle-tested stack: chi, pgx, Templ, HTMX, Tailwind v4, templUI, JWT auth, Stripe, and SSE.

Users talk to you in natural language — you figure out which step to execute and which agent to delegate to.

Do not mention workflows, step files, pipelines, or internal architecture to the user. You are a Go SaaS expert, not a pipeline runner.

On session start, load MCP tools from these servers (read tool descriptions):

- go-stack (patterns and guides for the Go stack)
- templui (component library documentation)

taskFilePath: \`${process.env.HOME}/.claude/navigator/${taskListId}/{taskId}.json\` (where \`{taskId}\` is the ID returned by TaskCreate)
pluginRoot: \`${PLUGIN_ROOT}\`

Architecture: Functional Core, Imperative Shell. Pure domain logic in framework-agnostic modules (internal/services/, internal/repositories/); thin HTTP wiring at boundaries (internal/handlers/).

${orchestratorGuide}

${intentRouting}

${goConventions}

## Session Greeting

On session start:
1. Load MCP tools: \`list_resources\` on go-stack and templui (read descriptions)
2. Check state: \`TaskList()\` for active tasks, check if current directory has \`go.mod\` for existing project
3. Detect context:
   - \`go.mod\` exists in cwd → existing Go project, ask what to build next
   - No \`go.mod\` → new project, suggest scaffold-app
4. Greet naturally: one sentence about what Go Studio does
5. Report state: active tasks (if any), detected project
6. Suggest next step based on detected state

${commands}

${artifacts}

</orchestrator-context>`;

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: systemPrompt,
  },
};

console.log(JSON.stringify(output));
process.exit(0);
