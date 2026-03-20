import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import type { StackInfo } from './detector';
import type { InferredPattern } from './inferrer';
import {
  makeVars,
  pluginJson,
  mcpJson,
  sessionStartTs,
  hooksJson,
  orchestratorGuide,
  intentRouting,
  conventionsMd,
  codeQualityMd,
  navigatorUsageMd,
  mcpIndexTs,
  mcpResourcesTs,
  mcpPackageJson,
} from './templates';

// Resolve the navigator-mcp path relative to this file (generator/lib/ → ../../navigator-mcp/)
const NAVIGATOR_MCP_PATH = resolve(import.meta.dir, '..', '..', 'navigator-mcp', 'index.ts');

export interface StudioConfig {
  name: string;
  stack: StackInfo;
  patterns: InferredPattern[];
  installPath: string;
  userDefinedConventions?: string;
}

function write(path: string, content: string) {
  try {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content, 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write ${path}: ${msg}`);
  }
}

export function assembleStudio(config: StudioConfig): string {
  const { name, stack, patterns, installPath, userDefinedConventions } = config;
  const v = makeVars(name, stack, installPath);

  const base = installPath;

  // Detect navigator-mcp availability
  const navigatorPath = existsSync(NAVIGATOR_MCP_PATH) ? NAVIGATOR_MCP_PATH : undefined;

  // Plugin registration
  write(join(base, '.claude-plugin', 'plugin.json'), pluginJson(v));
  write(join(base, '.mcp.json'), mcpJson(v, navigatorPath));

  // Hooks
  write(join(base, 'hooks', 'session-start.ts'), sessionStartTs(v));
  write(join(base, 'hooks', 'hooks.json'), hooksJson(v));

  // Rules
  write(join(base, 'rules', 'orchestrator-guide.md'), orchestratorGuide(v));
  write(join(base, 'rules', 'intent-routing.md'), intentRouting(v));
  write(join(base, 'rules', 'conventions.md'), conventionsMd(v, patterns, userDefinedConventions));
  write(join(base, 'rules', 'code-quality.md'), codeQualityMd(v));
  write(join(base, 'rules', 'navigator-usage.md'), navigatorUsageMd(v));

  // MCP server
  write(join(base, 'mcp', 'index.ts'), mcpIndexTs(v));
  write(join(base, 'mcp', 'lib', 'resources.ts'), mcpResourcesTs(v));
  write(join(base, 'mcp', 'package.json'), mcpPackageJson(v));
  write(join(base, 'mcp', 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'bundler', strict: true, skipLibCheck: true, types: ['bun-types'] },
    include: ['index.ts', 'lib/**/*.ts'],
  }, null, 2));

  // Pattern resources from inference
  mkdirSync(join(base, 'mcp', 'resources', 'patterns'), { recursive: true });
  for (const pattern of patterns) {
    write(join(base, 'mcp', 'resources', 'patterns', `${pattern.id}.md`), pattern.content);
  }

  // Placeholder if no patterns inferred
  if (patterns.length === 0) {
    write(
      join(base, 'mcp', 'resources', 'patterns', 'conventions.md'),
      `---\ndescription: General conventions for ${v.STACK_NAME}\n---\n\n# Conventions\n\nAdd your patterns here. Each .md file in this directory becomes a resource in the MCP server.\n`
    );
  }

  return base;
}
