import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const RESOURCES_DIR = join(import.meta.dir, '..', 'resources');

interface Frontmatter {
  description?: string;
  title?: string;
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
  category: string;
  stackId?: string;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta: Frontmatter = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function scanDirectory(dirPath: string): ResourceEntry[] {
  if (!existsSync(dirPath)) return [];

  const entries: ResourceEntry[] = [];

  for (const name of readdirSync(dirPath)) {
    const fullPath = join(dirPath, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      for (const subName of readdirSync(fullPath)) {
        if (!subName.endsWith('.md')) continue;
        const subPath = join(fullPath, subName);
        const content = readFileSync(subPath, 'utf-8');
        const meta = parseFrontmatter(content);
        const id = subName.replace('.md', '');

        entries.push({
          id,
          path: relative(RESOURCES_DIR, subPath),
          title: extractTitle(content) ?? id,
          description: meta.description ?? '',
          subcategory: name,
        });
      }
    } else if (name.endsWith('.md')) {
      const content = readFileSync(fullPath, 'utf-8');
      const meta = parseFrontmatter(content);
      const id = name.replace('.md', '');

      entries.push({
        id,
        path: relative(RESOURCES_DIR, fullPath),
        title: extractTitle(content) ?? id,
        description: meta.description ?? '',
      });
    }
  }

  return entries;
}

function registerEntries(
  server: McpServer,
  category: string,
  uriScheme: string,
  entries: ResourceEntry[],
  stackId?: string
): ResourceRef[] {
  const resources: ResourceRef[] = [];

  for (const entry of entries) {
    const uri = entry.subcategory
      ? `${uriScheme}://${entry.subcategory}/${entry.id}.md`
      : `${uriScheme}://${entry.id}.md`;

    const registrationName = stackId
      ? `${category}-${stackId}-${entry.id}`
      : `${category}-${entry.id}`;

    server.registerResource(
      registrationName,
      uri,
      { title: entry.title, description: entry.description },
      async () => ({
        contents: [{ uri, text: readFileSync(join(RESOURCES_DIR, entry.path), 'utf-8') }],
      })
    );

    resources.push({
      uri,
      id: entry.id,
      title: entry.title,
      description: entry.description,
      category,
      stackId,
    });
  }

  return resources;
}

export interface ResourceCache {
  universal: ResourceRef[];
  stacks: Record<string, ResourceRef[]>;
  procedures: ResourceRef[];
  allStackIds: string[];
}

export function registerAllResources(server: McpServer): ResourceCache {
  // Register universal patterns
  const universal = registerEntries(
    server,
    'universal',
    'universal',
    scanDirectory(join(RESOURCES_DIR, 'universal'))
  );

  // Register stack-specific patterns
  const stacksDir = join(RESOURCES_DIR, 'stacks');
  const stacks: Record<string, ResourceRef[]> = {};
  const allStackIds: string[] = [];

  if (existsSync(stacksDir)) {
    for (const stackDir of readdirSync(stacksDir)) {
      const stackPath = join(stacksDir, stackDir);
      if (!statSync(stackPath).isDirectory()) continue;

      allStackIds.push(stackDir);
      stacks[stackDir] = registerEntries(
        server,
        'stack',
        `stack://${stackDir}`,
        scanDirectory(stackPath).map((e) => ({
          ...e,
          // Override path to be relative to RESOURCES_DIR
          path: `stacks/${stackDir}/${e.path.startsWith('stacks/') ? e.path.slice(`stacks/${stackDir}/`.length) : e.id + '.md'}`,
        })),
        stackDir
      );
    }
  }

  // Register procedures
  const procedures = registerEntries(
    server,
    'procedure',
    'procedure',
    scanDirectory(join(RESOURCES_DIR, 'procedures'))
  );

  const parts = [
    `${universal.length} universal patterns`,
    `${allStackIds.length} stacks (${Object.values(stacks).reduce((a, b) => a + b.length, 0)} stack patterns)`,
  ];
  if (procedures.length > 0) parts.push(`${procedures.length} procedures`);
  console.error(`✅ Registered ${parts.join(', ')}`);

  return { universal, stacks, procedures, allStackIds };
}
