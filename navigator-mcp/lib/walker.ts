import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Workflow, WorkflowNode, WorkflowEdge, TaskState, NavigatorResult, TerminalValue } from './types.js';

const workflows = new Map<string, Workflow>();

export function loadWorkflows(workflowsPath: string): string[] {
  if (!existsSync(workflowsPath)) return [];
  const loaded: string[] = [];
  for (const entry of readdirSync(workflowsPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = join(workflowsPath, entry.name, 'workflow.json');
    if (!existsSync(filePath)) continue;
    const wf: Workflow = JSON.parse(readFileSync(filePath, 'utf8'));
    workflows.set(wf.id, wf);
    loaded.push(wf.id);
  }
  return loaded;
}

export function getWorkflow(workflowType: string): Workflow {
  const wf = workflows.get(workflowType);
  if (!wf) throw new Error(`Workflow not found: ${workflowType}. Call LoadWorkflows first.`);
  return wf;
}

export function listWorkflows(): Workflow[] {
  return Array.from(workflows.values());
}

function getEdges(wf: Workflow, fromStep: string, on?: string): WorkflowEdge[] {
  return wf.edges.filter(e => e.from === fromStep && (on === undefined ? !e.on : e.on === on));
}

function buildResult(state: TaskState, node: WorkflowNode): NavigatorResult {
  const terminal = getTerminal(node);
  let instructions = node.description || node.name;

  // Augment with item context
  if (!terminal && state.items.length > 0) {
    const current = state.items[state.itemIndex];
    const total = state.items.length;
    instructions = `Item ${state.itemIndex + 1}/${total}: ${current}\n\n${instructions}`;
  }

  return {
    currentStep: state.currentStep,
    instructions,
    terminal,
    metadata: {
      workflowType: state.workflowType,
      retryCount: state.retryCount,
      ...(state.items.length > 0 && {
        itemIndex: state.itemIndex,
        itemCount: state.items.length,
        currentItem: state.items[state.itemIndex],
      }),
    },
  };
}

function getTerminal(node: WorkflowNode): TerminalValue {
  if (node.type !== 'end') return null;
  const r = node.result || 'success';
  if (r === 'success') return 'success';
  if (node.escalation === 'hitl') return 'hitl';
  return 'failure';
}

export function navigate(state: TaskState, wf: Workflow): NavigatorResult {
  const node = wf.nodes[state.currentStep];
  if (!node) throw new Error(`Node not found: ${state.currentStep}`);
  return buildResult(state, node);
}

export function advance(
  state: TaskState,
  wf: Workflow,
  result: 'passed' | 'failed'
): { state: TaskState; navResult: NavigatorResult } {
  const node = wf.nodes[state.currentStep];
  if (!node) throw new Error(`Node not found: ${state.currentStep}`);

  // Handle sequential items
  if (state.items.length > 0 && result === 'passed') {
    const nextIndex = state.itemIndex + 1;
    if (nextIndex < state.items.length) {
      // Still have items — advance itemIndex, stay on same step
      state.itemIndex = nextIndex;
      state.retryCount = 0;
      return { state, navResult: buildResult(state, node) };
    } else {
      // All items done — clear queue, fall through to edge traversal
      state.items = [];
      state.itemIndex = 0;
    }
  }

  if (result === 'failed') {
    state.items = [];
    state.itemIndex = 0;
  }

  // Find the next edge
  let nextNodeId: string | undefined;

  if (result === 'passed') {
    state.retryCount = 0;
    const edges = getEdges(wf, state.currentStep, 'passed');
    // Also accept unconditional edges (no `on`) for task nodes
    const fallback = getEdges(wf, state.currentStep);
    nextNodeId = (edges[0] || fallback[0])?.to;
  } else {
    // failed
    state.retryCount += 1;
    const maxRetries = node.maxRetries ?? 0;

    if (state.retryCount > maxRetries) {
      // exhausted
      const exhausted = getEdges(wf, state.currentStep, 'exhausted');
      nextNodeId = exhausted[0]?.to;
    }

    if (!nextNodeId) {
      const failEdges = getEdges(wf, state.currentStep, 'failed');
      nextNodeId = failEdges[0]?.to;
    }
  }

  if (!nextNodeId) {
    throw new Error(`No edge from '${state.currentStep}' on result '${result}'`);
  }

  state.currentStep = nextNodeId;
  const nextNode = wf.nodes[nextNodeId];
  if (!nextNode) throw new Error(`Target node not found: ${nextNodeId}`);

  // Update task status
  const terminal = getTerminal(nextNode);
  if (terminal === 'success' || terminal === 'join') {
    state.status = 'completed';
  } else if (terminal === 'failure' || terminal === 'hitl') {
    state.status = 'failed';
  }

  return { state, navResult: buildResult(state, nextNode) };
}

export function startWorkflow(
  state: TaskState,
  wf: Workflow,
  stepId?: string
): { state: TaskState; navResult: NavigatorResult } {
  const firstStep = stepId || getEdges(wf, 'start')[0]?.to;
  if (!firstStep) throw new Error('No edge from start node');

  state.currentStep = firstStep;
  state.status = 'in_progress';

  const node = wf.nodes[firstStep];
  if (!node) throw new Error(`First node not found: ${firstStep}`);

  return { state, navResult: buildResult(state, node) };
}
