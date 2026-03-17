#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerAllResources } from './lib/resources';

const server = new McpServer({
  name: '@ui-studio/templui-mcp',
  version: '1.0.0',
});

async function startServer() {
  try {
    const resourceCache = registerAllResources(server);

    server.tool(
      'list_resources',
      `Call this before building any Templ UI component to see available templUI v1.6 components and design foundations.

templUI provides shadcn/ui-style components for Templ. Using these instead of custom HTML ensures visual consistency across all client apps.`,
      {
        category: z
          .enum(['components', 'foundations', 'all'])
          .optional()
          .describe('Filter by category (default: all)'),
      },
      async ({ category = 'all' }) => {
        const result: Record<string, unknown> = {};

        if (category === 'all' || category === 'components') {
          result.components = resourceCache.patterns;
        }
        if (category === 'all' || category === 'foundations') {
          result.foundations = resourceCache.foundations;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ templUI MCP Server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

startServer();
