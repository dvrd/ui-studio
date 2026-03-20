#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllResources } from './lib/resources';

const server = new McpServer({
  name: '@web-studio/web-patterns-mcp',
  version: '2.0.0',
});

async function startServer() {
  try {
    const cache = registerAllResources(server);

    server.tool(
      'list_resources',
      `MANDATORY: Call this tool BEFORE writing any code. Web Studio apps use consistent, opinionated patterns that differ per stack. These patterns are NOT guessable from general knowledge.

Returns universal patterns (apply to every stack) and stack-specific patterns (framework-specific implementations). Read both before implementing.`,
      {
        category: z
          .enum(['universal', 'stack', 'procedures', 'all'])
          .optional()
          .describe('Filter by category (default: all)'),
        stackId: z
          .string()
          .optional()
          .describe('Filter stack patterns by stack ID (e.g. go-templ-htmx, nextjs-react)'),
      },
      async ({ category = 'all', stackId }) => {
        const result: Record<string, unknown> = {};

        if (category === 'all' || category === 'universal') {
          result.universal = cache.universal;
        }
        if (category === 'all' || category === 'stack') {
          if (stackId && cache.stacks[stackId]) {
            result.stacks = { [stackId]: cache.stacks[stackId] };
          } else {
            result.stacks = cache.stacks;
          }
        }
        if (category === 'all' || category === 'procedures') {
          result.procedures = cache.procedures;
        }
        if (category === 'all') {
          result.availableStacks = cache.allStackIds;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    server.tool(
      'search_resources',
      `Search for patterns by keyword. Returns matching universal and stack-specific patterns.

Use this when you know what you need but not the exact resource name. Example: search_resources({ query: "authentication" }) returns the universal auth pattern + all stack auth implementations.`,
      {
        query: z.string().describe('Keywords to search for (e.g. "authentication", "forms", "stripe")'),
        stackId: z
          .string()
          .optional()
          .describe('Limit search to a specific stack (e.g. go-templ-htmx)'),
      },
      async ({ query, stackId }) => {
        const q = query.toLowerCase();
        const matches: Array<{ uri: string; id: string; title: string; description: string; category: string; stackId?: string }> = [];

        // Search universal
        for (const r of cache.universal) {
          if (
            r.id.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
          ) {
            matches.push(r);
          }
        }

        // Search stacks
        const stacksToSearch = stackId ? [stackId] : cache.allStackIds;
        for (const sid of stacksToSearch) {
          const stackResources = cache.stacks[sid] || [];
          for (const r of stackResources) {
            if (
              r.id.toLowerCase().includes(q) ||
              r.title.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q)
            ) {
              matches.push(r);
            }
          }
        }

        // Search procedures
        for (const r of cache.procedures) {
          if (
            r.id.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
          ) {
            matches.push(r);
          }
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ query, matches, count: matches.length }, null, 2),
          }],
        };
      }
    );

    server.tool(
      'get_pattern',
      `Read a specific pattern by ID. Returns the universal pattern and optionally the stack-specific implementation.

Use this after list_resources or search_resources to read the full content.`,
      {
        id: z.string().describe('Pattern ID (e.g. "authentication", "routing", "data-access")'),
        stackId: z
          .string()
          .optional()
          .describe('Also return the stack-specific implementation'),
      },
      async ({ id, stackId }) => {
        const results: Array<{ uri: string; category: string; content: string }> = [];

        // Find universal pattern
        const universal = cache.universal.find((r) => r.id === id);
        if (universal) {
          // Read the resource content by triggering the registered handler
          results.push({ uri: universal.uri, category: 'universal', content: `[Read resource: ${universal.uri}]` });
        }

        // Find stack-specific pattern
        if (stackId && cache.stacks[stackId]) {
          const stack = cache.stacks[stackId].find((r) => r.id === id || r.id === `${id}-impl`);
          if (stack) {
            results.push({ uri: stack.uri, category: `stack:${stackId}`, content: `[Read resource: ${stack.uri}]` });
          }
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ found: false, id, message: `No pattern found for "${id}". Use search_resources to find available patterns.` }),
            }],
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ found: true, id, results }, null, 2),
          }],
        };
      }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ Web Patterns MCP Server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

startServer();
