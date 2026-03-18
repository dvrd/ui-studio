import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = join(__dirname, '..', 'resources');

/**
 * Parse YAML frontmatter from markdown content.
 * Extracts key: value pairs between --- delimiters.
 * @param {string} content - Markdown file content
 * @returns {{ description?: string, title?: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  }
  return meta;
}

/**
 * Extract title from first markdown heading (# Title)
 * @param {string} content - Markdown file content
 * @returns {string|null}
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Scan a directory for .md files and build resource entries from frontmatter.
 * @param {string} dirPath - Absolute path to scan
 * @returns {Array<{ id: string, path: string, title: string, description: string, subcategory?: string }>}
 */
function scanDirectory(dirPath) {
  if (!existsSync(dirPath)) return [];

  const entries = [];

  for (const name of readdirSync(dirPath)) {
    const fullPath = join(dirPath, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectories (e.g., patterns/microapp/)
      for (const subName of readdirSync(fullPath)) {
        if (!subName.endsWith('.md')) continue;
        const subPath = join(fullPath, subName);
        const content = readFileSync(subPath, 'utf-8');
        const meta = parseFrontmatter(content);
        const id = subName.replace('.md', '');

        entries.push({
          id,
          path: relative(RESOURCES_DIR, subPath),
          title: extractTitle(content) || id,
          description: meta.description || '',
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
        title: extractTitle(content) || id,
        description: meta.description || '',
      });
    }
  }

  return entries;
}

/**
 * Register scanned resources with MCP server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {string} category - Resource category (patterns, guides, foundations)
 * @param {string} uriScheme - URI scheme (pattern, guide, foundation)
 * @param {Array} entries - Scanned entries
 * @returns {Array} Formatted resources for listResources tool
 */
function registerEntries(server, category, uriScheme, entries) {
  const resources = [];

  for (const entry of entries) {
    const uri = entry.subcategory
      ? `${uriScheme}://${entry.subcategory}/${entry.id}.md`
      : `${uriScheme}://${entry.id}.md`;

    server.registerResource(
      `${category}-${entry.id}`,
      uri,
      {
        title: entry.title,
        description: entry.description,
      },
      async () => ({
        contents: [
          {
            uri,
            text: readFileSync(join(RESOURCES_DIR, entry.path), 'utf-8'),
          },
        ],
      })
    );

    resources.push({
      uri,
      id: entry.id,
      title: entry.title,
      description: entry.description,
    });
  }

  return resources;
}

/**
 * Scan resources directory and register all resources with MCP server.
 * Builds index dynamically from filesystem structure and frontmatter metadata.
 *
 * Directory structure:
 *   resources/patterns/microapp/*.md  → pattern://microapp/{id}.md
 *   resources/guides/*.md             → guide://{id}.md
 *   resources/foundations/*.md        → foundation://{id}.md
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @returns {{ patterns: Array, guides: Array, foundations: Array }}
 */
export function registerAllResources(server) {
  const components = registerEntries(server, 'components', 'component', scanDirectory(join(RESOURCES_DIR, 'components')));
  const foundations = registerEntries(
    server,
    'foundations',
    'foundation',
    scanDirectory(join(RESOURCES_DIR, 'foundations'))
  );

  console.error(
    `✅ Registered ${components.length} components, ${foundations.length} foundations`
  );

  return { components, foundations };
}
