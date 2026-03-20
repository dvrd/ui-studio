#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllResources } from './lib/resources';

const server = new McpServer({
  name: '@web-studio/design-system-mcp',
  version: '2.0.0',
});

async function startServer() {
  try {
    const cache = registerAllResources(server);

    server.tool(
      'list_components',
      `List available design system components and foundations. Call this BEFORE creating custom UI components — use existing ones when possible.

Returns universal component patterns (what the component does, props, accessibility) and design system implementations (how to use it with a specific library like shadcn, templUI, etc.).`,
      {
        designSystem: z
          .string()
          .optional()
          .describe('Filter by design system (e.g. "shadcn", "templui", "vuetify")'),
        category: z
          .enum(['foundations', 'components', 'implementations', 'all'])
          .optional()
          .describe('Filter by category (default: all)'),
      },
      async ({ designSystem, category = 'all' }) => {
        const result: Record<string, unknown> = {};

        if (category === 'all' || category === 'foundations') {
          result.foundations = cache.foundations;
        }
        if (category === 'all' || category === 'components') {
          result.components = cache.components;
        }
        if (category === 'all' || category === 'implementations') {
          if (designSystem && cache.implementations[designSystem]) {
            result.implementations = { [designSystem]: cache.implementations[designSystem] };
          } else {
            result.implementations = cache.implementations;
          }
        }
        if (category === 'all') {
          result.availableDesignSystems = cache.allDesignSystems;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    server.tool(
      'search_components',
      `Search design system components by keyword. Use when you need a specific component type (e.g. "table", "form", "modal").`,
      {
        query: z.string().describe('Keywords to search for (e.g. "button", "table", "modal")'),
        designSystem: z
          .string()
          .optional()
          .describe('Limit search to a specific design system'),
      },
      async ({ query, designSystem }) => {
        const q = query.toLowerCase();
        const matches: ResourceRef[] = [];

        for (const r of cache.foundations) {
          if (r.id.includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) {
            matches.push(r);
          }
        }

        for (const r of cache.components) {
          if (r.id.includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) {
            matches.push(r);
          }
        }

        const systems = designSystem ? [designSystem] : cache.allDesignSystems;
        for (const ds of systems) {
          for (const r of cache.implementations[ds] || []) {
            if (r.id.includes(q) || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) {
              matches.push(r);
            }
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

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ Design System MCP Server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

startServer();
