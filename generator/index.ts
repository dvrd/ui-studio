#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { detectStack } from './lib/detector';
import { inferPatterns } from './lib/inferrer';
import { assembleStudio } from './lib/assembler';
import { registerStudio, unregisterStudio, listRegisteredStudios } from './lib/installer';

const DEFAULT_PLUGINS_DIR = join(homedir(), '.claude', 'plugins');

const server = new McpServer({
  name: 'ui-studio-generator',
  version: '1.0.0',
});

// ─── create_studio ────────────────────────────────────────────────────────────

server.tool(
  'create_studio',
  `Generate a specialized Claude Code studio for any tech stack.

If project_path is provided and contains existing code, patterns are inferred automatically.
If no code is found, the studio is created with placeholder patterns for the user to fill in.

After creation, the new studio MCP server is registered in ~/.claude/settings.json and becomes active on the next Claude Code session.`,
  {
    name: z.string().describe('Studio name as a slug, e.g. "nextjs-studio" or "my-api-studio"'),
    project_path: z.string().optional().describe('Absolute path to the project to infer patterns from. If omitted, creates a blank studio.'),
    stack_id: z.string().optional().describe('Force a specific stack ID (e.g. "nextjs", "go-templ", "python-fastapi"). Auto-detected if project_path is provided.'),
    stack_description: z.string().optional().describe('Human description of the stack when auto-detection is unavailable, e.g. "Next.js 14 + Drizzle ORM + Stripe + Clerk auth"'),
    user_conventions: z.string().optional().describe('Custom conventions text to include in the studio when no code exists to infer from'),
    install_dir: z.string().optional().describe(`Directory to install the studio. Defaults to ${DEFAULT_PLUGINS_DIR}`),
  },
  async ({ name, project_path, stack_id, stack_description, user_conventions, install_dir }) => {
    const lines: string[] = [];
    const installBase = install_dir ?? DEFAULT_PLUGINS_DIR;
    const installPath = join(installBase, name);

    // 1. Detect or build stack info
    let stack = null;
    let inferredPatterns: ReturnType<typeof inferPatterns> = [];

    if (project_path) {
      if (!existsSync(project_path)) {
        return { content: [{ type: 'text', text: `❌ project_path does not exist: ${project_path}` }] };
      }

      stack = detectStack(project_path);

      if (stack) {
        lines.push(`✅ Detected stack: **${stack.name}**`);
        lines.push(`   Language: ${stack.language} | Framework: ${stack.framework}`);
        lines.push(`   Features: ${stack.features.join(', ') || 'none'}`);

        inferredPatterns = inferPatterns(project_path, stack);
        lines.push(`\n📐 Inferred ${inferredPatterns.length} pattern(s) from existing code:`);
        for (const p of inferredPatterns) {
          lines.push(`   • ${p.title} (${p.id})`);
        }
      } else {
        lines.push(`⚠️  Could not auto-detect stack from ${project_path}`);
      }
    }

    // Fallback: build a minimal StackInfo from provided description
    if (!stack) {
      const desc = stack_description ?? stack_id ?? 'Custom';
      stack = {
        name: desc,
        id: stack_id ?? name.replace(/-studio$/, ''),
        language: 'unknown',
        framework: 'unknown',
        features: [],
        sourceExts: [],
      };
      lines.push(`ℹ️  Using description: "${desc}" — no code inferred`);
    }

    // 2. Assemble studio files
    const studioPath = assembleStudio({
      name,
      stack,
      patterns: inferredPatterns,
      installPath,
      userDefinedConventions: user_conventions,
    });

    lines.push(`\n📁 Studio assembled at: ${studioPath}`);

    // 3. Register MCP server in ~/.claude/settings.json
    const result = registerStudio(name, studioPath);
    if (result.alreadyRegistered) {
      lines.push(`♻️  MCP server "${result.mcpServerKey}" updated in ~/.claude/settings.json`);
    } else {
      lines.push(`✅ MCP server "${result.mcpServerKey}" registered in ~/.claude/settings.json`);
    }

    // 4. Install dependencies for the MCP server
    const { spawnSync } = await import('bun');
    const bunInstall = spawnSync(['bun', 'install'], { cwd: join(studioPath, 'mcp'), stdout: 'pipe', stderr: 'pipe' });
    if (bunInstall.exitCode === 0) {
      lines.push(`📦 MCP server dependencies installed`);
    } else {
      lines.push(`⚠️  bun install failed in mcp/ — run it manually: cd ${studioPath}/mcp && bun install`);
    }

    // 5. Next steps
    lines.push(`\n---`);
    lines.push(`## Next steps`);
    lines.push(`1. **Restart Claude Code** to activate the "${name}" studio`);
    lines.push(`2. The MCP server \`${result.mcpServerKey}\` will be available with ${inferredPatterns.length} pattern(s)`);
    if (inferredPatterns.length === 0) {
      lines.push(`3. Add patterns to: ${studioPath}/mcp/resources/patterns/`);
      lines.push(`4. Edit conventions: ${studioPath}/rules/conventions.md`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ─── expand_studio ────────────────────────────────────────────────────────────

server.tool(
  'expand_studio',
  `Re-infer patterns from a project and update an existing studio.

Use this after adding new code to the project — it refreshes the pattern library without recreating the studio from scratch.`,
  {
    name: z.string().describe('Studio name to expand'),
    project_path: z.string().describe('Absolute path to the project to re-infer patterns from'),
    install_dir: z.string().optional().describe(`Directory where studios are installed. Defaults to ${DEFAULT_PLUGINS_DIR}`),
  },
  async ({ name, project_path, install_dir }) => {
    const installBase = install_dir ?? DEFAULT_PLUGINS_DIR;
    const studioPath = join(installBase, name);

    if (!existsSync(studioPath)) {
      return { content: [{ type: 'text', text: `❌ Studio not found at: ${studioPath}\nRun create_studio first.` }] };
    }

    if (!existsSync(project_path)) {
      return { content: [{ type: 'text', text: `❌ project_path does not exist: ${project_path}` }] };
    }

    const stack = detectStack(project_path);
    if (!stack) {
      return { content: [{ type: 'text', text: `❌ Could not detect stack in ${project_path}` }] };
    }

    const patterns = inferPatterns(project_path, stack);
    const { writeFileSync, mkdirSync } = await import('fs');

    mkdirSync(join(studioPath, 'mcp', 'resources', 'patterns'), { recursive: true });
    for (const p of patterns) {
      writeFileSync(join(studioPath, 'mcp', 'resources', 'patterns', `${p.id}.md`), p.content, 'utf-8');
    }

    const lines = [
      `✅ Expanded studio **${name}**`,
      `   Stack: ${stack.name}`,
      `   Patterns updated: ${patterns.map(p => p.id).join(', ')}`,
      `\nPatterns are live immediately — no restart needed.`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ─── list_studios ─────────────────────────────────────────────────────────────

server.tool(
  'list_studios',
  'List all installed studios registered in ~/.claude/settings.json',
  {},
  async () => {
    const studios = listRegisteredStudios();
    if (studios.length === 0) {
      return { content: [{ type: 'text', text: 'No studios installed yet. Use create_studio to generate one.' }] };
    }
    const lines = ['## Installed Studios', ...studios.map(s => `• ${s}`)];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ─── remove_studio ────────────────────────────────────────────────────────────

server.tool(
  'remove_studio',
  'Unregister a studio from ~/.claude/settings.json (does not delete files)',
  {
    name: z.string().describe('Studio name to remove'),
  },
  async ({ name }) => {
    const removed = unregisterStudio(name);
    if (removed) {
      return { content: [{ type: 'text', text: `✅ Studio "${name}" unregistered from ~/.claude/settings.json\n\nFiles remain at ${join(DEFAULT_PLUGINS_DIR, name)} — delete manually if needed.` }] };
    }
    return { content: [{ type: 'text', text: `⚠️  Studio "${name}" was not registered.` }] };
  }
);

// ─── Start server ─────────────────────────────────────────────────────────────

async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ ui-studio generator MCP server started');
  } catch (error) {
    console.error('❌ Error starting generator:', error);
    process.exit(1);
  }
}

startServer();
