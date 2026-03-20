import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const RESOURCES_DIR = join(import.meta.dir, '..', 'resources');

interface ResourceEntry {
  id: string;
  path: string;
  title: string;
  description: string;
}

interface ResourceRef {
  uri: string;
  id: string;
  title: string;
  description: string;
  category: string;
  designSystem?: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta: Record<string, string> = {};
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

function scanMarkdownFiles(dirPath: string): ResourceEntry[] {
  if (!existsSync(dirPath)) return [];

  const entries: ResourceEntry[] = [];
  for (const name of readdirSync(dirPath)) {
    const fullPath = join(dirPath, name);
    if (!name.endsWith('.md') || !statSync(fullPath).isFile()) continue;

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
  return entries;
}

function registerEntries(
  server: McpServer,
  uriScheme: string,
  category: string,
  entries: ResourceEntry[],
  designSystem?: string
): ResourceRef[] {
  const resources: ResourceRef[] = [];

  for (const entry of entries) {
    const uri = `${uriScheme}://${entry.id}.md`;
    const regName = designSystem
      ? `${category}-${designSystem}-${entry.id}`
      : `${category}-${entry.id}`;

    server.registerResource(
      regName,
      uri,
      { title: entry.title, description: entry.description },
      async () => ({
        contents: [{ uri, text: readFileSync(join(RESOURCES_DIR, entry.path), 'utf-8') }],
      })
    );

    resources.push({ uri, id: entry.id, title: entry.title, description: entry.description, category, designSystem });
  }

  return resources;
}

export interface DesignCache {
  foundations: ResourceRef[];
  components: ResourceRef[];
  implementations: Record<string, ResourceRef[]>;
  allDesignSystems: string[];
}

export function registerAllResources(server: McpServer): DesignCache {
  const foundations = registerEntries(server, 'foundation', 'foundation', scanMarkdownFiles(join(RESOURCES_DIR, 'foundations')));
  const components = registerEntries(server, 'component', 'component', scanMarkdownFiles(join(RESOURCES_DIR, 'components')));

  const implDir = join(RESOURCES_DIR, 'implementations');
  const implementations: Record<string, ResourceRef[]> = {};
  const allDesignSystems: string[] = [];

  if (existsSync(implDir)) {
    for (const name of readdirSync(implDir)) {
      if (!name.endsWith('.md')) continue;
      const dsName = name.replace('.md', '');
      allDesignSystems.push(dsName);
      implementations[dsName] = registerEntries(
        server,
        `impl://${dsName}`,
        'implementation',
        [scanMarkdownFiles(implDir).find((e) => e.id === dsName)!].filter(Boolean),
        dsName
      );
    }
  }

  console.error(`✅ Registered ${foundations.length} foundations, ${components.length} components, ${allDesignSystems.length} design systems`);
  return { foundations, components, implementations, allDesignSystems };
}
