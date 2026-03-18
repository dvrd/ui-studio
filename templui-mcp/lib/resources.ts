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
  entries: ResourceEntry[]
): ResourceRef[] {
  const resources: ResourceRef[] = [];

  for (const entry of entries) {
    const uri = entry.subcategory
      ? `${uriScheme}://${entry.subcategory}/${entry.id}.md`
      : `${uriScheme}://${entry.id}.md`;

    server.registerResource(
      `${category}-${entry.id}`,
      uri,
      { title: entry.title, description: entry.description },
      async () => ({
        contents: [{ uri, text: readFileSync(join(RESOURCES_DIR, entry.path), 'utf-8') }],
      })
    );

    resources.push({ uri, id: entry.id, title: entry.title, description: entry.description });
  }

  return resources;
}

export interface ResourceCache {
  components: ResourceRef[];
  foundations: ResourceRef[];
}

export function registerAllResources(server: McpServer): ResourceCache {
  const components = registerEntries(server, 'components', 'component', scanDirectory(join(RESOURCES_DIR, 'components')));
  const foundations = registerEntries(
    server,
    'foundations',
    'foundation',
    scanDirectory(join(RESOURCES_DIR, 'foundations'))
  );

  console.error(`✅ Registered ${components.length} components, ${foundations.length} foundations`);

  return { components, foundations };
}
