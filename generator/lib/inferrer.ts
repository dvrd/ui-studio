import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import type { StackInfo } from './detector';

export interface InferredPattern {
  id: string;
  title: string;
  description: string;
  content: string;
}

// Caps to avoid reading too much into context
const MAX_CHARS_PER_FILE = 2500;
const MAX_FILES_PER_CATEGORY = 3;

const IGNORED_DIRS = new Set([
  'node_modules', 'vendor', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', 'target',
]);

function walk(dir: string, exts: string[], max: number): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];

  const scan = (d: string) => {
    if (results.length >= max) return;
    for (const name of readdirSync(d)) {
      if (IGNORED_DIRS.has(name)) continue;
      const full = join(d, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        scan(full);
      } else if (exts.includes(extname(name)) && results.length < max) {
        results.push(full);
      }
    }
  };

  scan(dir);
  return results;
}

function snippet(filePath: string, root: string): string {
  const raw = readFileSync(filePath, 'utf-8');
  const body = raw.length > MAX_CHARS_PER_FILE ? raw.slice(0, MAX_CHARS_PER_FILE) + '\n// ... (truncated)' : raw;
  return `// ${relative(root, filePath)}\n${body}`;
}

function pySnippet(filePath: string, root: string): string {
  const raw = readFileSync(filePath, 'utf-8');
  const body = raw.length > MAX_CHARS_PER_FILE ? raw.slice(0, MAX_CHARS_PER_FILE) + '\n# ... (truncated)' : raw;
  return `# ${relative(root, filePath)}\n${body}`;
}

// ─── Language-specific inferrers ──────────────────────────────────────────────

function inferGo(root: string, stack: StackInfo): InferredPattern[] {
  const patterns: InferredPattern[] = [];
  const exts = ['.go'];

  const categories: Array<{ id: string; title: string; description: string; dirs: string[] }> = [
    { id: 'handlers', title: 'HTTP Handlers', description: 'HTTP handler conventions used in this project', dirs: ['internal/handlers', 'handlers', 'api/handlers', 'cmd'] },
    { id: 'services', title: 'Service Layer', description: 'Business logic / service layer conventions', dirs: ['internal/services', 'services', 'pkg/services'] },
    { id: 'database', title: 'Database / Repository', description: 'Database access and repository conventions', dirs: ['internal/repositories', 'internal/db', 'repositories', 'store', 'db'] },
    { id: 'middleware', title: 'Middleware', description: 'HTTP middleware conventions', dirs: ['internal/middleware', 'middleware', 'pkg/middleware'] },
    { id: 'models', title: 'Domain Models', description: 'Domain types and models', dirs: ['internal/models', 'models', 'internal/domain', 'domain'] },
  ];

  if (stack.features.includes('templ')) {
    categories.push({ id: 'components', title: 'Templ Components', description: 'Templ component conventions', dirs: ['internal/ui', 'ui', 'templates'] });
  }

  for (const cat of categories) {
    for (const dir of cat.dirs) {
      const files = walk(join(root, dir), exts, MAX_FILES_PER_CATEGORY);
      if (files.length > 0) {
        const examples = files.map(f => snippet(f, root)).join('\n\n---\n\n');
        patterns.push({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          content: `---\ndescription: ${cat.description}\n---\n\n# ${cat.title}\n\nInferred from existing code.\n\n\`\`\`go\n${examples}\n\`\`\``,
        });
        break;
      }
    }
  }

  // Migrations
  const migDirs = ['migrations', 'db/migrations', 'internal/migrations'];
  for (const dir of migDirs) {
    const files = walk(join(root, dir), ['.sql'], MAX_FILES_PER_CATEGORY);
    if (files.length > 0) {
      const examples = files.map(f => `-- ${relative(root, f)}\n${readFileSync(f, 'utf-8').slice(0, 1500)}`).join('\n\n---\n\n');
      patterns.push({
        id: 'migrations',
        title: 'Database Migrations',
        description: 'Migration conventions (Goose)',
        content: `---\ndescription: Migration conventions (Goose)\n---\n\n# Database Migrations\n\n\`\`\`sql\n${examples}\n\`\`\``,
      });
      break;
    }
  }

  return patterns;
}

function inferTypeScript(root: string, stack: StackInfo): InferredPattern[] {
  const patterns: InferredPattern[] = [];
  const exts = ['.ts', '.tsx'];

  const categories: Array<{ id: string; title: string; description: string; dirs: string[] }> = [
    { id: 'api-routes', title: 'API Routes', description: 'API route conventions', dirs: ['app/api', 'src/app/api', 'pages/api', 'src/pages/api', 'src/routes', 'routes'] },
    { id: 'components', title: 'UI Components', description: 'Component conventions', dirs: ['components', 'src/components', 'app/_components', 'src/app/_components'] },
    { id: 'lib', title: 'Utility / Lib', description: 'Shared utilities and helpers', dirs: ['lib', 'src/lib', 'utils', 'src/utils'] },
    { id: 'server-actions', title: 'Server Actions', description: 'Server action conventions', dirs: ['app/actions', 'src/actions', 'actions'] },
    { id: 'db', title: 'Database Layer', description: 'Database schema and queries', dirs: ['db', 'src/db', 'drizzle', 'prisma'] },
  ];

  for (const cat of categories) {
    for (const dir of cat.dirs) {
      const files = walk(join(root, dir), exts, MAX_FILES_PER_CATEGORY);
      if (files.length > 0) {
        const examples = files.map(f => snippet(f, root)).join('\n\n---\n\n');
        patterns.push({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          content: `---\ndescription: ${cat.description}\n---\n\n# ${cat.title}\n\nInferred from existing code.\n\n\`\`\`typescript\n${examples}\n\`\`\``,
        });
        break;
      }
    }
  }

  return patterns;
}

function inferPython(root: string): InferredPattern[] {
  const patterns: InferredPattern[] = [];
  const exts = ['.py'];

  const categories: Array<{ id: string; title: string; description: string; dirs: string[] }> = [
    { id: 'routers', title: 'API Routers', description: 'Router / endpoint conventions', dirs: ['app/routers', 'routers', 'api', 'routes'] },
    { id: 'services', title: 'Service Layer', description: 'Business logic conventions', dirs: ['app/services', 'services', 'core'] },
    { id: 'models', title: 'Data Models', description: 'Pydantic / SQLAlchemy model conventions', dirs: ['app/models', 'models', 'schemas'] },
    { id: 'db', title: 'Database Layer', description: 'Database session and query conventions', dirs: ['app/db', 'db', 'database'] },
  ];

  for (const cat of categories) {
    for (const dir of cat.dirs) {
      const files = walk(join(root, dir), exts, MAX_FILES_PER_CATEGORY);
      if (files.length > 0) {
        const examples = files.map(f => pySnippet(f, root)).join('\n\n---\n\n');
        patterns.push({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          content: `---\ndescription: ${cat.description}\n---\n\n# ${cat.title}\n\nInferred from existing code.\n\n\`\`\`python\n${examples}\n\`\`\``,
        });
        break;
      }
    }
  }

  return patterns;
}

function inferDart(root: string): InferredPattern[] {
  const patterns: InferredPattern[] = [];
  const exts = ['.dart'];

  const categories: Array<{ id: string; title: string; description: string; dirs: string[] }> = [
    { id: 'screens', title: 'Screens', description: 'Screen / page conventions', dirs: ['lib/screens', 'lib/pages', 'lib/features'] },
    { id: 'widgets', title: 'Widgets', description: 'Widget conventions', dirs: ['lib/widgets', 'lib/components'] },
    { id: 'providers', title: 'State / Providers', description: 'State management conventions', dirs: ['lib/providers', 'lib/state', 'lib/riverpod'] },
    { id: 'services', title: 'Services / API', description: 'API client and service conventions', dirs: ['lib/services', 'lib/api', 'lib/repositories'] },
  ];

  for (const cat of categories) {
    for (const dir of cat.dirs) {
      const files = walk(join(root, dir), exts, MAX_FILES_PER_CATEGORY);
      if (files.length > 0) {
        const examples = files.map(f => snippet(f, root)).join('\n\n---\n\n');
        patterns.push({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          content: `---\ndescription: ${cat.description}\n---\n\n# ${cat.title}\n\nInferred from existing code.\n\n\`\`\`dart\n${examples}\n\`\`\``,
        });
        break;
      }
    }
  }

  return patterns;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function inferPatterns(projectPath: string, stack: StackInfo): InferredPattern[] {
  switch (stack.language) {
    case 'go':         return inferGo(projectPath, stack);
    case 'typescript': return inferTypeScript(projectPath, stack);
    case 'python':     return inferPython(projectPath);
    case 'dart':       return inferDart(projectPath);
    default:           return [];
  }
}
