import type { StackInfo } from './detector';
import type { InferredPattern } from './inferrer';

export interface StudioVars {
  STUDIO_NAME: string;        // e.g. "nextjs-studio"
  STUDIO_LABEL: string;       // e.g. "Next.js Studio"
  STACK_NAME: string;         // e.g. "Next.js + Drizzle"
  STACK_ID: string;           // e.g. "nextjs"
  LANGUAGE: string;           // e.g. "typescript"
  FRAMEWORK: string;          // e.g. "next"
  FEATURES: string;           // e.g. "stripe, drizzle, auth"
  INSTALL_PATH: string;       // absolute path to studio
}

export function makeVars(name: string, stack: StackInfo, installPath: string): StudioVars {
  return {
    STUDIO_NAME: name,
    STUDIO_LABEL: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    STACK_NAME: stack.name,
    STACK_ID: stack.id,
    LANGUAGE: stack.language,
    FRAMEWORK: stack.framework,
    FEATURES: stack.features.join(', ') || 'none detected',
    INSTALL_PATH: installPath,
  };
}

export function render(template: string, vars: StudioVars): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => (vars as unknown as Record<string, string>)[key] ?? `{{${key}}}`);
}

// ─── Plugin registration ──────────────────────────────────────────────────────

export function pluginJson(v: StudioVars): string {
  return JSON.stringify({
    name: v.STUDIO_NAME,
    description: `${v.STUDIO_LABEL} — AI coding assistant specialized for ${v.STACK_NAME}`,
    version: '1.0.0',
    author: { name: 'dvrd-studio generator' },
    keywords: [v.LANGUAGE, v.FRAMEWORK, ...v.FEATURES.split(', ').filter(f => f !== 'none detected')],
  }, null, 2);
}

export function mcpJson(v: StudioVars, navigatorPath?: string): string {
  const servers: Record<string, unknown> = {};
  if (navigatorPath) {
    servers['navigator'] = {
      command: 'bun',
      args: [navigatorPath],
      description: 'Passive graph walker for Layer 3 workflow execution.',
    };
  }
  servers[`${v.STUDIO_NAME}-patterns`] = {
    command: 'bun',
    args: [`${v.INSTALL_PATH}/mcp/index.ts`],
    description: `Pattern library for ${v.STUDIO_LABEL}. Call list_resources before building any feature.`,
  };
  servers['chrome-devtools'] = {
    command: 'bunx',
    args: ['-y', 'chrome-devtools-mcp@latest', '--viewport=1440x900'],
    description: 'Browser automation for visual verification. Required for smoke tests.',
  };
  return JSON.stringify({ mcpServers: servers }, null, 2);
}

// ─── Session start hook ───────────────────────────────────────────────────────

export function sessionStartTs(v: StudioVars): string {
  const projectFile = v.LANGUAGE === 'go' ? 'go.mod' : v.LANGUAGE === 'python' ? 'requirements.txt or pyproject.toml' : v.LANGUAGE === 'dart' ? 'pubspec.yaml' : 'package.json';
  return `#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';

const PLUGIN_ROOT = join(import.meta.dir, '..');
const RULES_DIR = join(PLUGIN_ROOT, 'rules');

let hookInput = '';
for await (const chunk of Bun.stdin.stream()) {
  hookInput += new TextDecoder().decode(chunk);
}

const input = JSON.parse(hookInput || '{}');

const orchestratorGuide = readFileSync(join(RULES_DIR, 'orchestrator-guide.md'), 'utf8');
const intentRouting = readFileSync(join(RULES_DIR, 'intent-routing.md'), 'utf8');
const conventions = readFileSync(join(RULES_DIR, 'conventions.md'), 'utf8');
const codeQuality = readFileSync(join(RULES_DIR, 'code-quality.md'), 'utf8');
const navigatorUsage = readFileSync(join(RULES_DIR, 'navigator-usage.md'), 'utf8');

const systemPrompt = \`<studio-context>

## ${v.STUDIO_LABEL}

You are a ${v.STACK_NAME} expert assistant. You help build production-quality ${v.LANGUAGE} applications using the conventions specific to this project.

Stack: ${v.STACK_NAME}
Framework: ${v.FRAMEWORK}
Features: ${v.FEATURES}

On session start:
1. Load MCP tools: list_resources on ${v.STUDIO_NAME}-patterns (read descriptions to know available patterns)
2. Check if current directory matches this project (look for ${projectFile})
3. Greet with one sentence about what you help build
4. Suggest next action based on project state

\${orchestratorGuide}

\${intentRouting}

\${conventions}

\${codeQuality}

\${navigatorUsage}

</studio-context>\`;

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: systemPrompt,
  },
};

console.log(JSON.stringify(output));
process.exit(0);
`;
}

export function hooksJson(v: StudioVars): string {
  return JSON.stringify({
    hooks: {
      SessionStart: [{
        matcher: '',
        hooks: [{
          type: 'command',
          command: `bun "\${CLAUDE_PLUGIN_ROOT}/hooks/session-start.ts"`,
        }],
      }],
    },
  }, null, 2);
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export function orchestratorGuide(v: StudioVars): string {
  const projectFile = v.LANGUAGE === 'go' ? 'go.mod' : v.LANGUAGE === 'dart' ? 'pubspec.yaml' : 'package.json';
  const buildCmd = v.LANGUAGE === 'go' ? 'go build ./...' : v.LANGUAGE === 'python' ? 'python -m pytest' : v.LANGUAGE === 'dart' ? 'flutter build' : 'npm run build';
  return `# Orchestrator Guide — ${v.STUDIO_LABEL}

## Role

You are a ${v.STACK_NAME} expert. Build features using the conventions documented in the MCP patterns server.

Always read patterns BEFORE writing code. Use \`list_resources\` on \`${v.STUDIO_NAME}-patterns\` to see available patterns.

## Step Execution Protocol

Every task follows a 3-phase protocol:

### Phase 1 — Analyze

Read the relevant pattern(s) for the task. Launch a focused research subagent if needed.
- Call \`list_resources\` on \`${v.STUDIO_NAME}-patterns\`
- Read the most relevant pattern(s)
- Return a concrete plan: which files to create/modify, what the structure should look like

Phase 1 must produce a manifest with explicit \`"found": true/false\`. If \`found\` is false, stop and report — do not proceed to Phase 2 on incomplete research.

### Phase 2 — Do

Implement exactly one bounded task. Follow the pattern from Phase 1.
- Write only what the task requires — no speculative additions
- Follow existing code conventions exactly
- Commit: \`feat({scope}): {description}\`

### Phase 3 — Verify

Run the stack's build/test command and confirm the result.

- Build: \`${buildCmd}\`
- Check: no compile errors, no test failures
- If Chrome DevTools is available: navigate to the affected route and take a screenshot

**Call Next(passed) only when verification produces evidence of success.**
**If verification cannot run, that is a failure — stop and report.**

## Behavioral Rules

- **Fix it, don't skip it**: When something fails, fix the root cause. Never paper over with mock data or fallback values.
- **No shortcuts**: Every phase must execute. Every verification must run.
- **Status update rule**: Do not report success until Phase 3 passes.
- **Existing work rule**: If work appears already done, stop and ask — never assume.

## State Detection

- \`${projectFile}\` found in cwd → existing project, ask what to build next
- No project file → new project, ask for project details and suggest scaffold

## MCP Awareness

- **${v.STUDIO_NAME}-patterns**: Source of truth for conventions. Call \`list_resources\` before building any feature.
- **chrome-devtools**: Required for visual verification in Phase 3.
- **navigator**: Workflow graph walker. Use only for explicit Layer 3 workflow requests.
`;
}

export function intentRouting(v: StudioVars): string {
  return `# Intent Routing — ${v.STUDIO_LABEL}

Route every user request through these layers in order. Stop at the first match.

## Layer 1: Ad-hoc step (default)

User describes a specific feature, file, or fix. Execute the 3-phase protocol immediately.

| User says | Action |
|---|---|
| "add {feature}", "build {thing}" | Analyze pattern → implement → verify build |
| "fix {bug}", "something's broken" | Reproduce → diagnose → fix → verify |
| "refactor {code}" | Read existing code → refactor → verify build |
| "add tests for {feature}" | Read test pattern → write tests → run suite |
| "make it responsive" | Read responsive pattern → update UI → verify |

## Layer 2: Pipeline command

User asks for a full project stage — multiple steps orchestrated together.

| User says | Action |
|---|---|
| "scaffold the project", "create a new ${v.FRAMEWORK} app" | Full scaffold: init → verify build → greet |
| "add authentication" | Auth pipeline: service → routes → UI → verify |
| "ship it", "lint and commit" | Build → lint → test → commit |

## Layer 3: Navigator workflow (rare)

User explicitly requests systematic multi-step workflow execution.

**Trigger phrases** (must be explicit):
- "run the full delivery workflow"
- "walk me through building step by step"
- "execute the project workflow"

**Not a trigger**: "build auth" → Layer 1. "scaffold the app" → Layer 2.

**Sequence**: \`Navigator.LoadWorkflows\` → \`Navigator.Init\` → \`Navigator.Start\` → core loop.

## Ambiguity rules

- If user names a feature, default to Layer 1
- If user asks for a full stage, use Layer 2
- Never default to Layer 3 — requires explicit request
- Prefer Layer 1 when uncertain
`;
}

export function conventionsMd(v: StudioVars, patterns: InferredPattern[], userDefined?: string): string {
  if (userDefined) {
    return `# Conventions — ${v.STUDIO_LABEL}\n\n${userDefined}\n`;
  }

  const hasPatterns = patterns.length > 0;

  return `# Conventions — ${v.STUDIO_LABEL}

## Stack

- Language: ${v.LANGUAGE}
- Framework: ${v.FRAMEWORK}
- Features: ${v.FEATURES}

## Patterns

${hasPatterns
    ? `Patterns have been inferred from existing code and are available in the MCP server \`${v.STUDIO_NAME}-patterns\`.\n\nCall \`list_resources\` to see all available patterns before building any feature.`
    : `No existing code was found to infer patterns from.\n\nDefine conventions here by editing this file, or add pattern files to \`mcp/resources/patterns/\`.`
  }

## General Rules

- Follow existing code patterns exactly — consistency matters more than elegance
- Read the relevant pattern before writing new code
- When in doubt, look at how similar code is structured in this project
`;
}

export function codeQualityMd(v: StudioVars): string {
  const buildCmd = v.LANGUAGE === 'go' ? 'go build ./...' : v.LANGUAGE === 'python' ? 'python -m pytest' : v.LANGUAGE === 'dart' ? 'flutter build' : 'npm run build';
  const testCmd = v.LANGUAGE === 'go' ? 'go test ./...' : v.LANGUAGE === 'python' ? 'python -m pytest' : v.LANGUAGE === 'dart' ? 'flutter test' : 'npm test';
  return `# Code Quality — ${v.STUDIO_LABEL}

## No-Excuses Verification

These are not valid reasons to skip Phase 3 verification or call a step passed without evidence:

- "The dev server is not running" — start it, wait for it, then verify
- "I couldn't navigate to the route" — fix the route first, then verify
- "Tests can't run in this environment" — they can; fix the setup
- "Will re-verify later" — no. Verify now. Deferring is skipping.
- "The code looks right" — looking right is not evidence. Run the build.

## Pass/Fail Criteria

A step is **passed** only when:
- Build command succeeds: \`${buildCmd}\`
- Test command passes: \`${testCmd}\`
- Visual verification confirms the route renders (when Chrome DevTools available)

A step is **failed** when:
- Any of the above cannot run or produces errors
- Evidence artifact from Phase 2 is missing
- "I couldn't verify but the code looks correct" — this is always a failure

## Fix It, Don't Skip It

When something fails:
1. Read the error output carefully
2. Identify the root cause
3. Fix the root cause — never add mock data or fallback values to make it pass
4. Re-run verification

If you cannot fix it, report the blocker clearly and wait for user direction.

## Commit Rules

- Only commit after Phase 3 passes
- One commit per feature/fix: \`feat({scope}): {description}\`
- Never commit with failing tests or build errors
`;
}

export function navigatorUsageMd(v: StudioVars): string {
  return `# Navigator Usage — ${v.STUDIO_LABEL}

Navigator is a passive graph walker. It does not drive execution — you decide when to call each tool.

## When Navigator Is Used

Navigator is only for **Layer 3** explicit workflow requests. Single tasks and pipeline stages (Layers 1-2) run without Navigator.

## Tools

- \`Navigator.LoadWorkflows(path, sourceRoot)\` — load workflow definitions. Call once at session start for Layer 3.
- \`Navigator.Init(taskFilePath, workflowType, description)\` — attach workflow to a task file
- \`Navigator.Start(taskFilePath)\` — advance to first actionable step
- \`Navigator.Current(taskFilePath)\` — read current position (read-only)
- \`Navigator.Next(taskFilePath, result)\` — advance. result is "passed" or "failed"
- \`Navigator.SetItems(taskFilePath, items)\` — register sequential sub-items for current step

## Terminal Values

- \`null\` — step is actionable, execute and call Next
- \`"hitl"\` — stop and ask user before calling Next
- \`"success"\` / \`"failure"\` — workflow complete, stop the loop

## Pass/Fail Rules

1. **Cannot verify = failed.** If verification cannot run, call Next(failed).
2. **Skipped = failed.** No "passed with caveats."
3. **Partial completion = failed.** All checks in a step must pass.

## Core Loop

\`\`\`
Navigator.Current → read instructions → execute work → Navigator.Next(passed/failed) → repeat
\`\`\`

Stop when \`terminal\` is non-null.
`;
}

// ─── MCP server for generated studio ─────────────────────────────────────────

export function mcpIndexTs(v: StudioVars): string {
  return `#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllResources } from './lib/resources';

const server = new McpServer({
  name: '${v.STUDIO_NAME}-patterns',
  version: '1.0.0',
});

async function startServer() {
  try {
    const resourceCache = registerAllResources(server);

    server.tool(
      'list_resources',
      \`Call this FIRST before building any ${v.STACK_NAME} feature.

Returns available patterns inferred from this project's codebase. These are the actual conventions used here — not generic advice.\`,
      {
        category: z.enum(['patterns', 'guides', 'all']).optional().describe('Filter by category (default: all)'),
      },
      async ({ category = 'all' }) => {
        const result: Record<string, unknown> = {};
        if (category === 'all' || category === 'patterns') {
          result.patterns = resourceCache.patterns;
        }
        if (category === 'all' || category === 'guides') {
          result.guides = resourceCache.guides;
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ ${v.STUDIO_LABEL} patterns server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

startServer();
`;
}

export function mcpResourcesTs(v: StudioVars): string {
  return `import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const RESOURCES_DIR = join(import.meta.dir, '..', 'resources');

interface Frontmatter {
  description?: string;
  [key: string]: string | undefined;
}

interface ResourceEntry {
  id: string;
  path: string;
  title: string;
  description: string;
  subcategory?: string;
}

interface ResourceRef {
  uri: string;
  id: string;
  title: string;
  description: string;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\\n([\\s\\S]*?)\\n---/);
  if (!match) return {};
  const meta: Frontmatter = {};
  for (const line of match[1].split('\\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function scanDirectory(dirPath: string): ResourceEntry[] {
  if (!existsSync(dirPath)) return [];
  const entries: ResourceEntry[] = [];

  for (const name of readdirSync(dirPath)) {
    const fullPath = join(dirPath, name);
    let stat: ReturnType<typeof statSync>;
    try { stat = statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      for (const subName of readdirSync(fullPath)) {
        if (!subName.endsWith('.md')) continue;
        const subPath = join(fullPath, subName);
        const content = readFileSync(subPath, 'utf-8');
        const meta = parseFrontmatter(content);
        const id = subName.replace('.md', '');
        entries.push({ id, path: relative(RESOURCES_DIR, subPath), title: extractTitle(content) ?? id, description: meta.description ?? '', subcategory: name });
      }
    } else if (name.endsWith('.md')) {
      const content = readFileSync(fullPath, 'utf-8');
      const meta = parseFrontmatter(content);
      const id = name.replace('.md', '');
      entries.push({ id, path: relative(RESOURCES_DIR, fullPath), title: extractTitle(content) ?? id, description: meta.description ?? '' });
    }
  }
  return entries;
}

function registerEntries(server: McpServer, category: string, uriScheme: string, entries: ResourceEntry[]): ResourceRef[] {
  const resources: ResourceRef[] = [];
  for (const entry of entries) {
    const uri = entry.subcategory ? \`\${uriScheme}://\${entry.subcategory}/\${entry.id}.md\` : \`\${uriScheme}://\${entry.id}.md\`;
    server.registerResource(\`\${category}-\${entry.id}\`, uri, { title: entry.title, description: entry.description }, async () => ({
      contents: [{ uri, text: readFileSync(join(RESOURCES_DIR, entry.path), 'utf-8') }],
    }));
    resources.push({ uri, id: entry.id, title: entry.title, description: entry.description });
  }
  return resources;
}

export function registerAllResources(server: McpServer) {
  const patterns = registerEntries(server, 'patterns', 'pattern', scanDirectory(join(RESOURCES_DIR, 'patterns')));
  const guides = registerEntries(server, 'guides', 'guide', scanDirectory(join(RESOURCES_DIR, 'guides')));
  const foundations = registerEntries(server, 'foundations', 'foundation', scanDirectory(join(RESOURCES_DIR, 'foundations')));
  console.error(\`✅ Registered \${patterns.length} patterns, \${guides.length} guides, \${foundations.length} foundations\`);
  return { patterns, guides, foundations };
}
`;
}

export function mcpPackageJson(v: StudioVars): string {
  return JSON.stringify({
    name: `@${v.STUDIO_NAME}/mcp`,
    version: '1.0.0',
    description: `Pattern MCP server for ${v.STUDIO_LABEL}`,
    main: './index.ts',
    scripts: { start: 'bun run index.ts', dev: 'bun --watch index.ts' },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.13.1',
      'zod': '^3.25.0',
    },
    devDependencies: { 'bun-types': 'latest', 'typescript': '^5.0.0' },
    engines: { bun: '>=1.0.0' },
  }, null, 2);
}
