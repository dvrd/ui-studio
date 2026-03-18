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

export function mcpJson(v: StudioVars): string {
  return JSON.stringify({
    mcpServers: {
      [`${v.STUDIO_NAME}-patterns`]: {
        command: 'bun',
        args: [`${v.INSTALL_PATH}/mcp/index.ts`],
      },
    },
  }, null, 2);
}

// ─── Session start hook ───────────────────────────────────────────────────────

export function sessionStartTs(v: StudioVars): string {
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

const conventions = readFileSync(join(RULES_DIR, 'conventions.md'), 'utf8');
const intentRouting = readFileSync(join(RULES_DIR, 'intent-routing.md'), 'utf8');
const orchestratorGuide = readFileSync(join(RULES_DIR, 'orchestrator-guide.md'), 'utf8');

const systemPrompt = \`<studio-context>

## ${v.STUDIO_LABEL}

You are a ${v.STACK_NAME} expert assistant. You help build production-quality ${v.LANGUAGE} applications using the conventions specific to this project.

Stack: ${v.STACK_NAME}
Framework: ${v.FRAMEWORK}
Features: ${v.FEATURES}

On session start:
1. Load MCP tools: list_resources on ${v.STUDIO_NAME}-patterns (read descriptions to know available patterns)
2. Check if current directory matches this project (look for ${v.LANGUAGE === 'go' ? 'go.mod' : v.LANGUAGE === 'python' ? 'requirements.txt or pyproject.toml' : v.LANGUAGE === 'dart' ? 'pubspec.yaml' : 'package.json'})
3. Greet with one sentence about what you help build
4. Suggest next action based on project state

\${orchestratorGuide}

\${intentRouting}

\${conventions}

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
  return `# Orchestrator Guide — ${v.STUDIO_LABEL}

## Role

You are a ${v.STACK_NAME} expert. Build features using the conventions documented in the MCP patterns server.

Always read patterns BEFORE writing code. Use \`list_resources\` on the \`${v.STUDIO_NAME}-patterns\` MCP server to see what's available.

## Execution Protocol

1. **Analyze**: Read the relevant pattern for the task
2. **Do**: Implement following the inferred conventions exactly
3. **Verify**: Ensure the code compiles / runs and matches project conventions

## State Detection

- Check for project file (${v.LANGUAGE === 'go' ? 'go.mod' : v.LANGUAGE === 'dart' ? 'pubspec.yaml' : 'package.json'}) in cwd
- If found: existing project — ask what to build next
- If not found: new project — ask for project details
`;
}

export function intentRouting(v: StudioVars): string {
  return `# Intent Routing — ${v.STUDIO_LABEL}

## Routing Layers

Route every user request through these layers in order. Stop at the first match.

### Layer 1: Direct task (default)

User describes a specific feature, file, or fix. Execute immediately.

Examples: "add user profile endpoint", "fix the login form", "add stripe webhook"

### Layer 2: Project setup

User wants to initialize or scaffold the project.

Examples: "set up the project", "create a new ${v.FRAMEWORK} project", "scaffold the app"

### Ambiguity rules

- If user names a feature, default to Layer 1
- If unsure, prefer Layer 1
- Ask for clarification only if the request is genuinely ambiguous
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
