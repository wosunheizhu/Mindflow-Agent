/**
 * 工作流管理器
 */

import { Workflow, WorkflowExecution } from './workflow-types';
import { WorkflowEngine } from './workflow-engine';

class WorkflowManager {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  /**
   * 创建工作流
   */
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const id = `wf_${Date.now()}`;
    const now = new Date().toISOString();
    
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  /**
   * 获取工作流
   */
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 更新工作流
   */
  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(id, updated);
    return updated;
  }

  /**
   * 删除工作流
   */
  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    variables?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    const engine = new WorkflowEngine(workflow);
    const execution = await engine.execute(variables);

    this.executions.set(execution.id, execution);
    return execution;
  }

  /**
   * 获取执行记录
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取工作流的所有执行记录
   */
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
}

// 全局单例
export const workflowManager = new WorkflowManager();

