#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllResources } from './lib/resources.mjs';

const server = new McpServer({
  name: '@ui-studio/go-stack-mcp',
  version: '1.0.0',
});

async function startServer() {
  try {
    const resourceCache = registerAllResources(server);

    server.tool(
      'list_resources',
      `MANDATORY: Call this tool EVERY TIME you work on a Go SaaS feature — before reading code, before writing code, before reviewing code.

Go Studio apps use consistent, opinionated patterns for handlers, services, repositories, auth, payments, and SSE. These patterns are NOT guessable from general Go knowledge.

Call this first, then read the relevant pattern files before implementing.`,
      {
        category: z
          .enum(['patterns', 'guides', 'all'])
          .optional()
          .describe('Filter by category (default: all)'),
      },
      async ({ category = 'all' }) => {
        const result = {};

        if (category === 'all' || category === 'patterns') {
          result.patterns = resourceCache.patterns;
        }
        if (category === 'all' || category === 'guides') {
          result.guides = resourceCache.guides;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    server.prompt(
      'go-patterns',
      'REQUIRED: Use this before implementing any Go handler, service, repository, or migration.',
      async () => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `# REQUIRED: Read Go Stack Patterns Before Building

Call list_resources FIRST to see all available patterns and guides.

## Always Read Before Building

For any feature, read the relevant pattern:
- Handler: pattern://handlers.md
- Database/repository: pattern://database.md + pattern://migrations.md
- Auth: pattern://auth-jwt.md + pattern://auth-magic-link.md
- Payments: pattern://stripe-integration.md
- Real-time: pattern://sse-streaming.md
- UI: pattern://templ-components.md + pattern://htmx-patterns.md

## Why

These apps use exact conventions across all projects. Deviating produces code that doesn't fit the existing codebase.
`,
          },
        }],
      })
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ Go Stack MCP Server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

startServer();
