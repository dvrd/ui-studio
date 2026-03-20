#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { loadWorkflows, getWorkflow, listWorkflows, navigate, advance, startWorkflow } from './lib/walker.js';
import { readTask, writeTask, createTask } from './lib/store.js';
import type { TaskState } from './lib/types.js';

const server = new Server(
  { name: 'navigator', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'LoadWorkflows',
      description: 'Load workflow definitions from a directory. Call once at session start.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to workflows/ directory' },
          sourceRoot: { type: 'string', description: 'Plugin root (for reference)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'ListWorkflows',
      description: 'List all loaded workflow types.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'Init',
      description: 'Attach workflow metadata to a task file. Creates the file if needed.',
      inputSchema: {
        type: 'object',
        properties: {
          taskFilePath: { type: 'string' },
          workflowType: { type: 'string', description: 'Workflow ID (e.g. web-app-delivery)' },
          description: { type: 'string' },
          stepId: { type: 'string', description: 'Optional: start at a specific step' },
        },
        required: ['taskFilePath', 'workflowType', 'description'],
      },
    },
    {
      name: 'Start',
      description: 'Advance from start node to first actionable step. Sets task to in_progress.',
      inputSchema: {
        type: 'object',
        properties: {
          taskFilePath: { type: 'string' },
        },
        required: ['taskFilePath'],
      },
    },
    {
      name: 'Current',
      description: 'Read current workflow position without advancing.',
      inputSchema: {
        type: 'object',
        properties: {
          taskFilePath: { type: 'string' },
        },
        required: ['taskFilePath'],
      },
    },
    {
      name: 'Next',
      description: 'Advance to next step. result is "passed" or "failed".',
      inputSchema: {
        type: 'object',
        properties: {
          taskFilePath: { type: 'string' },
          result: { type: 'string', enum: ['passed', 'failed'] },
        },
        required: ['taskFilePath', 'result'],
      },
    },
    {
      name: 'SetItems',
      description: 'Register a sequential list of sub-items for the current step.',
      inputSchema: {
        type: 'object',
        properties: {
          taskFilePath: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['taskFilePath', 'items'],
      },
    },
    {
      name: 'Diagram',
      description: 'Return the workflow graph as a Mermaid diagram.',
      inputSchema: {
        type: 'object',
        properties: {
          workflowType: { type: 'string' },
        },
        required: ['workflowType'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'LoadWorkflows': {
        const loaded = loadWorkflows(args.path as string);
        return { content: [{ type: 'text', text: JSON.stringify({ loaded, count: loaded.length }) }] };
      }

      case 'ListWorkflows': {
        const wfs = listWorkflows().map(w => ({ id: w.id, name: w.name, description: w.description }));
        return { content: [{ type: 'text', text: JSON.stringify(wfs) }] };
      }

      case 'Init': {
        const { taskFilePath, workflowType, description, stepId } = args as {
          taskFilePath: string; workflowType: string; description: string; stepId?: string;
        };
        const wf = getWorkflow(workflowType);
        // Validate stepId if provided
        if (stepId && !wf.nodes[stepId]) {
          throw new Error(`Step '${stepId}' not found in workflow '${workflowType}'`);
        }
        const state = createTask(taskFilePath, {
          workflowType,
          description,
          currentStep: stepId || 'start',
        });
        return { content: [{ type: 'text', text: JSON.stringify({ initialized: true, taskFilePath, workflowType, currentStep: state.currentStep }) }] };
      }

      case 'Start': {
        const { taskFilePath } = args as { taskFilePath: string };
        let state = readTask(taskFilePath);
        const wf = getWorkflow(state.workflowType);
        const stepId = state.currentStep !== 'start' ? state.currentStep : undefined;
        const { state: newState, navResult } = startWorkflow(state, wf, stepId);
        writeTask(taskFilePath, newState);
        return { content: [{ type: 'text', text: JSON.stringify(navResult) }] };
      }

      case 'Current': {
        const { taskFilePath } = args as { taskFilePath: string };
        const state = readTask(taskFilePath);
        const wf = getWorkflow(state.workflowType);
        const navResult = navigate(state, wf);
        return { content: [{ type: 'text', text: JSON.stringify(navResult) }] };
      }

      case 'Next': {
        const { taskFilePath, result } = args as { taskFilePath: string; result: 'passed' | 'failed' };
        let state = readTask(taskFilePath);
        const wf = getWorkflow(state.workflowType);
        const { state: newState, navResult } = advance(state, wf, result);
        writeTask(taskFilePath, newState);
        return { content: [{ type: 'text', text: JSON.stringify(navResult) }] };
      }

      case 'SetItems': {
        const { taskFilePath, items } = args as { taskFilePath: string; items: string[] };
        let state = readTask(taskFilePath);
        const wf = getWorkflow(state.workflowType);
        state.items = items;
        state.itemIndex = 0;
        writeTask(taskFilePath, state);
        const navResult = navigate(state, wf);
        return { content: [{ type: 'text', text: JSON.stringify(navResult) }] };
      }

      case 'Diagram': {
        const { workflowType } = args as { workflowType: string };
        const wf = getWorkflow(workflowType);
        const lines = ['graph TD'];
        for (const edge of wf.edges) {
          const label = edge.on ? `|${edge.on}|` : '';
          lines.push(`  ${edge.from} -->${label} ${edge.to}`);
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: JSON.stringify({ error: msg }) }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
