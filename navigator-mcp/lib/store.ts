import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { TaskState } from './types.js';

export function readTask(taskFilePath: string): TaskState {
  if (!existsSync(taskFilePath)) {
    throw new Error(`Task file not found: ${taskFilePath}`);
  }
  return JSON.parse(readFileSync(taskFilePath, 'utf8'));
}

export function writeTask(taskFilePath: string, state: TaskState): void {
  const dir = dirname(taskFilePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(taskFilePath, JSON.stringify(state, null, 2));
}

export function createTask(taskFilePath: string, partial: Partial<TaskState>): TaskState {
  const state: TaskState = {
    id: partial.id || crypto.randomUUID(),
    status: 'pending',
    workflowType: partial.workflowType || '',
    currentStep: 'start',
    retryCount: 0,
    description: partial.description || '',
    items: [],
    itemIndex: 0,
    ...partial,
  };
  writeTask(taskFilePath, state);
  return state;
}
