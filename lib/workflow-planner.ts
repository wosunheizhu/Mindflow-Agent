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

## 🔧 可用工具列表（共26个）

### 基础工具

1. **search_web** - 搜索互联网信息
   参数: { "query": "搜索关键词" }

2. **execute_code** - 执行 Python/JavaScript 代码
   参数: { "code": "真实代码", "language": "python" | "javascript" }
   ⚠️ 必须传入可执行代码，不能传中文描述！

3. **calculate** - 数学计算
   参数: { "expression": "2 + 2" | "sqrt(16)" | "sin(45)" }

4. **get_current_weather** - 查询天气
   参数: { "location": "城市名", "unit": "celsius | fahrenheit" }

### 图像工具

5. **generate_image** - AI 文生图（DALL-E）
   参数: { "prompt": "英文描述", "size": "1024x1024" | "1792x1024" | "1024x1792" }
   ⚠️ 用于生成艺术图片，不能生成数据图表！

6. **analyze_image** - 分析图片内容
   参数: { "filename": "图片文件名", "question": "问题（可选）" }

7. **ocr_image** - OCR 文字识别
   参数: { "filename": "图片文件名", "language": "auto" | "chinese" | "english" }

8. **ocr_recognize** - OCR 文字识别（Tesseract）
   参数: { "image_filename": "图片文件名", "language": "chi_sim" | "eng" | "chi_sim+eng" }

9. **generate_qrcode** - 生成二维码
   参数: { "text": "文本或 URL", "filename": "输出文件名", "size": 300 }

### 文档工具

10. **read_file** - 读取文档内容
    参数: { "filename": "文件名", "query": "查询内容（可选）" }

11. **create_document** - 创建文档
    参数: { "filename": "文件名.扩展名", "content": "内容", "format": "markdown" | "word" | "text" | "excel" | "json", "options": {} }

12. **create_presentation** - 创建 PPT
    参数: { "filename": "文件名", "title": "标题", "slides": [{ "title": "...", "content": "..." }] }

13. **convert_document** - 文档格式转换
    参数: { "input_file": "输入文件", "output_format": "pdf" | "docx" | "xlsx" | "pptx" | "html", "output_filename": "可选" }

14. **extract_pdf_text** - 提取 PDF 文本
    参数: { "filename": "PDF 文件名", "page_number": 页码（可选） }

### 网页工具

15. **visit_website** - 访问网页并截图
    参数: { "url": "完整 URL" }

16. **extract_web_data** - 提取网页数据
    参数: { "url": "URL", "selectors": ["CSS选择器1", "CSS选择器2"] }

### 数据处理工具

17. **create_chart** - 创建数据图表
    参数: { "chart_type": "bar" | "line" | "pie", "labels": ["标签1", "标签2"], "values": [数值1, 数值2], "title": "图表标题" }
    ⚠️ 生成数据图表用这个工具！

18. **convert_data** - 数据格式转换
    参数: { "data": "数据内容", "from_format": "json" | "csv" | "xml", "to_format": "json" | "csv" | "xml" }

19. **process_text** - 文本处理
    参数: { "operation": "count" | "extract" | "replace" | "format" | "split", "text": "文本", "params": {} }

### 文件系统工具

20. **file_operations** - 文件系统操作
    参数: { "operation": "list" | "create_dir" | "delete" | "move" | "copy" | "rename" | "info", "path": "路径", "new_path": "新路径（可选）" }

21. **workspace_operation** - 工作区操作
    参数: { "action": "set" | "scan" | "read" | "write" | "create_folder" | "delete" | "search" | "info", "path": "路径", "content": "内容", "query": "查询" }

### 高级工具

22. **create_and_execute_workflow** - 创建并执行工作流
    参数: { "task_description": "任务描述", "auto_execute": true | false }
    ⚠️ 递归工具，谨慎使用！

23. **call_api** - 调用 REST API
    参数: { "url": "API URL", "method": "GET" | "POST" | "PUT" | "DELETE", "data": {}, "headers": {} }

24. **translate_text** - 翻译文本
    参数: { "text": "文本", "target_lang": "zh" | "en" | "ja" | "ko", "source_lang": "auto" }

25. **datetime_tool** - 日期时间处理
    参数: { "operation": "current" | "format" | "add_days" | "diff" | "parse", "date_input": "日期", "format_or_value": "格式或值" }

26. **send_email** - 发送邮件
    参数: { "to": "收件人", "subject": "主题", "content": "内容", "attachment_path": "附件路径（可选）" }

---

## 📋 返回格式

返回 JSON 格式的工作流定义：
\`\`\`json
{
  "name": "工作流名称",
  "description": "工作流描述",
  "steps": [
    {
      "id": "step1",
      "name": "步骤名称",
      "tool": "工具名称（必须是上面 26 个之一）",
      "params": { "参数名": "参数值" },
      "nextSteps": ["step2"]
    }
  ],
  "startStep": "step1"
}
\`\`\`

---

## ⚠️ 重要规则

### 1. 工具选择原则
- **数据图表** → 用 \`create_chart\`（不是 generate_image！）
- **艺术图片/插图** → 用 \`generate_image\`
- **文档报告** → 用 \`create_document\`
- **演示文稿** → 用 \`create_presentation\`
- **代码执行** → 用 \`execute_code\`（传真实代码）

### 2. 参数传递
- 使用变量引用前置步骤结果：\`\${step_stepX.字段名}\`
- 示例：\`\${step_step1.results[0].url}\` 引用 step1 的第一个结果的 url 字段

### 3. 代码执行注意事项
- \`execute_code\` 必须传入真实可执行的代码
- ❌ 错误：\`{ "code": "生成 Markdown 报告" }\`
- ✅ 正确：\`{ "code": "print('# Report\\n\\nContent here')", "language": "python" }\`

### 4. 任务分解
- 合理分解任务，避免过度复杂
- 考虑步骤依赖关系
- 保持简洁高效

---

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

