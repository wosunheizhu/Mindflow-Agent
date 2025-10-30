/**
 * 工作流执行引擎
 */

import { Workflow, WorkflowStep, WorkflowExecution } from './workflow-types';
import { executeToolCall } from './tools-complete';

export class WorkflowEngine {
  private execution: WorkflowExecution;
  private workflow: Workflow;

  constructor(workflow: Workflow) {
    this.workflow = workflow;
    this.execution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'pending',
      results: {},
      startedAt: new Date().toISOString(),
      logs: [],
    };
  }

  /**
   * 执行工作流
   */
  async execute(initialVariables?: Record<string, any>): Promise<WorkflowExecution> {
    try {
      this.execution.status = 'running';
      this.log('info', 'workflow_start', `开始执行工作流: ${this.workflow.name}`);

      // 合并初始变量
      const variables = { ...this.workflow.variables, ...initialVariables };

      // 从起始步骤开始执行
      await this.executeStep(this.workflow.startStep, variables);

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      this.log('info', 'workflow_complete', '工作流执行完成');

      return this.execution;
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.logError('workflow_error', error.message);
      throw error;
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(stepId: string, variables: Record<string, any>): Promise<any> {
    const step = this.workflow.steps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`步骤未找到: ${stepId}`);
    }

    this.execution.currentStep = stepId;
    this.log('info', stepId, `执行步骤: ${step.name}`);

    try {
      // 替换参数中的变量
      const resolvedParams = this.resolveVariables(step.params, variables);

      // 执行工具
      const result = await executeToolCall(step.tool, resolvedParams);

      // 保存结果
      this.execution.results[stepId] = result;
      variables[`step_${stepId}`] = result;

      this.log('info', stepId, `步骤完成: ${step.name}`);

      // 处理条件分支
      if (step.condition) {
        const nextSteps = this.evaluateCondition(step.condition, result, variables);
        for (const nextId of nextSteps) {
          await this.executeStep(nextId, variables);
        }
      } else if (step.nextSteps && step.nextSteps.length > 0) {
        // 执行下一步
        for (const nextId of step.nextSteps) {
          await this.executeStep(nextId, variables);
        }
      }

      return result;
    } catch (error: any) {
      // 错误处理
      if (step.errorHandling?.retry && step.errorHandling.retry > 0) {
        this.log('warning', stepId, `步骤失败，重试中...`);
        // 简单重试逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.executeStep(stepId, variables);
      }

      this.logError(stepId, error.message);
      
      if (step.errorHandling?.fallback) {
        this.log('info', stepId, `使用降级步骤: ${step.errorHandling.fallback}`);
        return this.executeStep(step.errorHandling.fallback, variables);
      }

      throw error;
    }
  }

  /**
   * 解析变量
   */
  private resolveVariables(params: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // 变量引用，如 ${step_1.result}
        const varName = value.slice(2, -1);
        resolved[key] = this.getNestedValue(variables, varName);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * 评估条件
   */
  private evaluateCondition(
    condition: WorkflowStep['condition'],
    result: any,
    variables: Record<string, any>
  ): string[] {
    if (!condition) return [];

    try {
      // 简单的条件评估
      if (condition.type === 'if' && condition.expression) {
        const isTrue = this.evaluateExpression(condition.expression, result, variables);
        return isTrue ? (condition.onTrue || []) : [];
      } else if (condition.type === 'if-else' && condition.expression) {
        const isTrue = this.evaluateExpression(condition.expression, result, variables);
        return isTrue ? (condition.onTrue || []) : (condition.onFalse || []);
      }
    } catch (error) {
      this.logError('condition_eval', `条件评估失败: ${error}`);
    }

    return [];
  }

  /**
   * 评估表达式
   */
  private evaluateExpression(expression: string, result: any, variables: Record<string, any>): boolean {
    try {
      // 简单的表达式评估（生产环境应使用更安全的方式）
      const context = { result, variables };
      
      // 支持简单的条件，如：result.status === 'success'
      if (expression.includes('result.')) {
        return eval(expression.replace(/result\./g, 'context.result.'));
      }
      
      return eval(expression);
    } catch {
      return false;
    }
  }

  /**
   * 记录日志
   */
  private log(level: 'info' | 'warning' | 'error', step: string, message: string) {
    this.execution.logs.push({
      timestamp: new Date().toISOString(),
      step,
      message,
      level,
    });
  }

  /**
   * 记录错误
   */
  private logError(step: string, error: string) {
    if (!this.execution.errors) {
      this.execution.errors = [];
    }
    this.execution.errors.push({
      step,
      error,
      timestamp: new Date().toISOString(),
    });
    this.log('error', step, error);
  }

  /**
   * 获取执行状态
   */
  getExecution(): WorkflowExecution {
    return this.execution;
  }
}

