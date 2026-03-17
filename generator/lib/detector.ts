import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface StackInfo {
  name: string;       // Human label: "Go + chi + Templ"
  id: string;         // Slug: "go-templ"
  language: string;   // "go" | "typescript" | "python" | "dart" | "rust"
  framework: string;  // Primary framework
  features: string[]; // Detected features: ["postgres", "stripe", "jwt", ...]
  sourceExts: string[]; // File extensions to scan
}

interface Detector {
  file: string;
  parse: (content: string) => StackInfo | null;
}

const DETECTORS: Detector[] = [
  {
    file: 'go.mod',
    parse(content) {
      const fw = content.includes('go-chi/chi') ? 'chi'
        : content.includes('gin-gonic/gin') ? 'gin'
        : content.includes('labstack/echo') ? 'echo'
        : 'stdlib';

      const features: string[] = [];
      if (content.includes('jackc/pgx')) features.push('postgres');
      if (content.includes('jmoiron/sqlx')) features.push('sqlx');
      if (content.includes('stripe-go')) features.push('stripe');
      if (content.includes('a-h/templ')) features.push('templ');
      if (content.includes('golang-jwt') || content.includes('lestrrat-go/jwx')) features.push('jwt');
      if (content.includes('resend-go') || content.includes('sendgrid')) features.push('email');
      if (content.includes('aws/aws-sdk-go') || content.includes('minio')) features.push('storage');

      const label = [
        'Go',
        fw !== 'stdlib' ? fw : null,
        features.includes('templ') ? 'Templ' : null,
        features.includes('postgres') ? 'PostgreSQL' : null,
      ].filter(Boolean).join(' + ');

      return {
        name: label,
        id: features.includes('templ') ? 'go-templ' : `go-${fw}`,
        language: 'go',
        framework: fw,
        features,
        sourceExts: ['.go', '.templ'],
      };
    },
  },
  {
    file: 'package.json',
    parse(content) {
      let pkg: Record<string, unknown>;
      try { pkg = JSON.parse(content); } catch { return null; }

      const deps: Record<string, string> = {
        ...(pkg.dependencies as object ?? {}),
        ...(pkg.devDependencies as object ?? {}),
      };

      const features: string[] = [];
      if (deps['stripe']) features.push('stripe');
      if (deps['drizzle-orm']) features.push('drizzle');
      if (deps['@prisma/client'] || deps['prisma']) features.push('prisma');
      if (deps['next-auth'] || deps['@auth/nextjs']) features.push('auth');
      if (deps['@trpc/server']) features.push('trpc');
      if (deps['socket.io']) features.push('websockets');

      if (deps['next']) {
        return {
          name: 'Next.js' + (deps['drizzle-orm'] ? ' + Drizzle' : deps['prisma'] ? ' + Prisma' : ''),
          id: 'nextjs',
          language: 'typescript',
          framework: 'next',
          features,
          sourceExts: ['.ts', '.tsx'],
        };
      }
      if (deps['express']) {
        return { name: 'Node.js + Express', id: 'node-express', language: 'typescript', framework: 'express', features, sourceExts: ['.ts'] };
      }
      if (deps['fastify']) {
        return { name: 'Node.js + Fastify', id: 'node-fastify', language: 'typescript', framework: 'fastify', features, sourceExts: ['.ts'] };
      }
      if (deps['hono']) {
        return { name: 'Hono', id: 'hono', language: 'typescript', framework: 'hono', features, sourceExts: ['.ts'] };
      }
      if (deps['react'] || deps['vite']) {
        return { name: 'React + Vite', id: 'react-vite', language: 'typescript', framework: 'vite', features, sourceExts: ['.ts', '.tsx'] };
      }
      return null;
    },
  },
  {
    file: 'requirements.txt',
    parse(content) {
      const fw = content.includes('fastapi') ? 'fastapi'
        : content.includes('django') ? 'django'
        : content.includes('flask') ? 'flask'
        : 'stdlib';

      const features: string[] = [];
      if (content.includes('sqlalchemy')) features.push('sqlalchemy');
      if (content.includes('stripe')) features.push('stripe');
      if (content.includes('celery')) features.push('celery');
      if (content.includes('pydantic')) features.push('pydantic');

      return {
        name: `Python + ${fw.charAt(0).toUpperCase() + fw.slice(1)}`,
        id: `python-${fw}`,
        language: 'python',
        framework: fw,
        features,
        sourceExts: ['.py'],
      };
    },
  },
  {
    file: 'pyproject.toml',
    parse(content) {
      const fw = content.includes('fastapi') ? 'fastapi'
        : content.includes('django') ? 'django'
        : content.includes('flask') ? 'flask'
        : 'stdlib';

      return {
        name: `Python + ${fw.charAt(0).toUpperCase() + fw.slice(1)}`,
        id: `python-${fw}`,
        language: 'python',
        framework: fw,
        features: [],
        sourceExts: ['.py'],
      };
    },
  },
  {
    file: 'pubspec.yaml',
    parse(content) {
      const features: string[] = [];
      if (content.includes('riverpod') || content.includes('flutter_riverpod')) features.push('riverpod');
      if (content.includes('bloc')) features.push('bloc');
      if (content.includes('dio')) features.push('dio');
      if (content.includes('go_router')) features.push('go_router');

      return {
        name: 'Flutter',
        id: 'flutter',
        language: 'dart',
        framework: 'flutter',
        features,
        sourceExts: ['.dart'],
      };
    },
  },
  {
    file: 'Cargo.toml',
    parse(content) {
      const fw = content.includes('axum') ? 'axum'
        : content.includes('actix-web') ? 'actix-web'
        : content.includes('rocket') ? 'rocket'
        : 'stdlib';

      const features: string[] = [];
      if (content.includes('sqlx')) features.push('sqlx');
      if (content.includes('diesel')) features.push('diesel');
      if (content.includes('stripe')) features.push('stripe');

      return {
        name: `Rust + ${fw}`,
        id: `rust-${fw}`,
        language: 'rust',
        framework: fw,
        features,
        sourceExts: ['.rs'],
      };
    },
  },
];

export function detectStack(projectPath: string): StackInfo | null {
  for (const { file, parse } of DETECTORS) {
    const full = join(projectPath, file);
    if (existsSync(full)) {
      const result = parse(readFileSync(full, 'utf-8'));
      if (result) return result;
    }
  }
  return null;
}
