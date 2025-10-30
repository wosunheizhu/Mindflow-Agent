/**
 * 工作流系统类型定义
 */

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  params: Record<string, any>;
  condition?: {
    type: 'if' | 'if-else' | 'loop';
    expression?: string;
    onTrue?: string[];  // 下一步的 step IDs
    onFalse?: string[];
  };
  nextSteps?: string[];  // 下一步的 step IDs
  errorHandling?: {
    retry?: number;
    fallback?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  startStep: string;
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  results: Record<string, any>;
  errors?: Array<{
    step: string;
    error: string;
    timestamp: string;
  }>;
  startedAt: string;
  completedAt?: string;
  logs: Array<{
    timestamp: string;
    step: string;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
  example?: string;
}

