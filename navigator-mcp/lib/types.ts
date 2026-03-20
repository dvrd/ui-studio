export interface WorkflowNode {
  type: 'start' | 'task' | 'gate' | 'end';
  name: string;
  description: string;
  stage?: string;
  maxRetries?: number;
  result?: string;
  escalation?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  on?: 'passed' | 'failed' | 'exhausted';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
}

export interface TaskState {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  workflowType: string;
  currentStep: string;
  retryCount: number;
  description: string;
  items: string[];
  itemIndex: number;
  subject?: string;
  activeForm?: string;
}

export type TerminalValue = 'success' | 'failure' | 'hitl' | 'join' | null;

export interface NavigatorResult {
  currentStep: string;
  instructions: string;
  terminal: TerminalValue;
  metadata: {
    workflowType: string;
    retryCount: number;
    itemIndex?: number;
    itemCount?: number;
    currentItem?: string;
  };
}
