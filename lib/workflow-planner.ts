/**
 * AI 工作流规划器
 * 让 AI 自主分析任务并创建工作流
 */

import OpenAI from "openai";
import { Workflow, WorkflowStep } from "./workflow-types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI 自主规划工作流
 */
export async function planWorkflow(userRequest: string): Promise<Workflow> {
  const systemPrompt = `你是一个工作流规划专家。根据用户的需求，将复杂任务分解为多个步骤，并使用可用的工具来完成。

可用工具：
1. search_web - 搜索互联网信息
2. execute_code - 执行 Python/JavaScript 代码
3. generate_image - 生成图像
4. read_file - 读取文档
5. visit_website - 访问网页并截图
6. extract_web_data - 提取网页数据
7. analyze_image - 分析图片
8. calculate - 数学计算
9. get_current_weather - 天气查询

你需要返回一个 JSON 格式的工作流定义，包含：
{
  "name": "工作流名称",
  "description": "工作流描述",
  "steps": [
    {
      "id": "step1",
      "name": "步骤名称",
      "tool": "工具名称",
      "params": { ... 参数 ... },
      "nextSteps": ["step2"]
    }
  ],
  "startStep": "step1"
}

注意：
- 合理分解任务
- 考虑步骤依赖关系
- 使用变量传递结果：\${step_stepX.字段名}
- 步骤要有逻辑性和连贯性
- 保持简洁高效

只返回 JSON，不要其他文字。`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `用户需求：${userRequest}\n\n请规划一个工作流来完成这个任务。` },
      ],
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("AI 未返回工作流");
    }

    const workflowDef = JSON.parse(content);

    // 创建完整的工作流对象
    const workflow: Workflow = {
      id: `wf_ai_${Date.now()}`,
      name: workflowDef.name || "AI 自动规划工作流",
      description: workflowDef.description || userRequest,
      steps: workflowDef.steps,
      startStep: workflowDef.startStep,
      variables: workflowDef.variables || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['AI生成', '自动规划'],
    };

    return workflow;
  } catch (error: any) {
    console.error("工作流规划失败:", error);
    throw new Error(`AI 工作流规划失败: ${error.message}`);
  }
}

/**
 * 验证工作流的合理性
 */
export function validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查基本字段
  if (!workflow.name) errors.push("缺少工作流名称");
  if (!workflow.steps || workflow.steps.length === 0) errors.push("没有定义步骤");
  if (!workflow.startStep) errors.push("没有指定起始步骤");

  // 检查起始步骤是否存在
  if (workflow.startStep && !workflow.steps.find(s => s.id === workflow.startStep)) {
    errors.push(`起始步骤 ${workflow.startStep} 不存在`);
  }

  // 检查步骤引用
  workflow.steps.forEach(step => {
    if (step.nextSteps) {
      step.nextSteps.forEach(nextId => {
        if (!workflow.steps.find(s => s.id === nextId)) {
          errors.push(`步骤 ${step.id} 引用了不存在的步骤 ${nextId}`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

