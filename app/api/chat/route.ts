import { NextRequest } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// 动态导入AI服务
const getAIService = () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  
  if (provider === 'claude') {
    return {
      client: new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      }),
      provider: 'claude'
    };
  } else if (provider === 'doubao') {
    return {
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      apiKey: process.env.ARK_API_KEY!,
      model: 'doubao-seed-1-6-flash-250828',
      provider: 'doubao'
    };
  } else {
    return {
      client: new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
      }),
      provider: 'openai'
    };
  }
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 导入所有工具
import { tools, executeToolCall } from '../../../lib/tools-complete';

// 将OpenAI格式的工具转换为Claude格式
function convertToolsForClaude(openaiTools: any[]) {
  return openaiTools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters
  }));
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { 
      messages, 
      useTools = true, 
      deepThinking = false, 
      deepThinkingEnabled = false, 
      deepThinkingLevel = 'medium',
      reasoning,
      browserSearch = false, 
      avatarEnabled = false, 
      avatarVoice = 'zh_female_sajiaonvyou_moon_bigtts', 
      modelProvider, 
      hasFiles = false 
    } = await req.json();
    
    // 兼容：如果没有传 reasoning，根据旧的 deepThinking 生成
    // GPT-5 使用工具时，reasoning.effort 最低为 'low'
    const actualReasoning = reasoning || (deepThinking ? { effort: 'high' } : { effort: 'low' });
    
    // 根据用户选择或环境变量决定使用哪个AI服务
    let aiService;
    if (modelProvider) {
      // 用户明确指定了模型
      if (modelProvider === 'claude') {
        const Anthropic = require('@anthropic-ai/sdk');
        aiService = {
          client: new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
          }),
          provider: 'claude'
        };
      } else if (modelProvider === 'doubao') {
        aiService = {
          baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
          apiKey: process.env.ARK_API_KEY!,
          model: 'doubao-seed-1-6-flash-250828',
          provider: 'doubao'
        };
      } else if (modelProvider === 'gpt5-pro') {
        aiService = {
          client: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
          }),
          provider: 'gpt5-pro',
          model: process.env.GPT5_PRO_MODEL || 'gpt-5' // Mindflow-Y-Pro 使用真正的 GPT-5 思考模型
        };
      } else if (modelProvider === 'gpt5-thinking') {
        aiService = {
          client: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
          }),
          provider: 'gpt5-thinking',
          model: process.env.GPT5_THINKING_MODEL || 'gpt-5' // Mindflow-Y 使用真正的 GPT-5 思考模型
        };
      } else {
        aiService = {
          client: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
          }),
          provider: 'openai'
        };
      }
    } else {
      // 使用环境变量配置
      aiService = getAIService();
    }
    
    const actualUseTools = useTools;

    // 系统提示词 - 通用智能体协议
    const systemPrompt = `你是 Mindflow，由心流元素（EVERCALL）研发的 Agentic AI 模型。

# 关于你的身份

- **你是谁**：Mindflow Agentic AI，心流元素公司的智能体系统
- **开发机构**：心流元素（EVERCALL），一家专注于人工智能研究的科技机构
- **你的定位**：通用智能体，能够理解任务、调用工具、完成复杂工作流
- **技术基础**：基于先进的语言模型，但你是心流元素独立训练和优化的版本
- **询问身份时**：介绍自己是"心流元素的 Agentic AI 模型 Mindflow"，不提及 GPT/OpenAI/Claude/Anthropic 等

当前时间：2025年10月30日

## 工作协议

### 规划
- 先列出3–7步高层计划与关键假设，再执行
- 指明必须满足的验收标准与交付物

### 工具与检索
- 仅在需要外部事实、计算、文件处理时调用工具；记录每次调用的目的、输入、关键结果
- 若信息可能时效性高，先验证再引用；无法验证则标记为不确定并给出下一步求证方法
- **凡是涉及时事、新闻、最新发展等时效性内容，必须先使用 search_web 工具搜索最新信息**
- **使用搜索工具获取信息后，必须在回答中附上参考资料的原始链接，方便用户查看来源**

### 文档生成规则（重要）
- **直接生成目标格式**：推荐使用 Markdown 或 Word 格式
- **禁止 PDF 格式**：不要生成 PDF，改用 Word 或 Markdown（用户可自行转换）
- **禁止格式转换链**：不要先生成 Markdown 再用 convert_document 转换（在云环境中会失败）
- **一步到位**：create_document 支持多种格式（markdown/word/text/excel），直接生成用户需要的格式

### 图表生成规则（重要）
- **必须使用真实数据**：从搜索结果、分析结果或计算结果中提取真实数据
- **禁止编造数据**：不能随意编造统计数字、市场份额等数据
- **必须生成 CSV**：使用 create_chart 生成图表时，会自动生成配套的 CSV 数据文件
- **数据可验证**：图表中的每个数据点都应该有明确来源

### 推理与约束
- 使用结构化推理，但不暴露长篇思维过程；只输出结论与证据摘要
- 明确边界条件、适用范围、反例与失败模式
- 所有数字给出来源或可复算过程；简单算式写出关键步骤

### 内容质量要求（重要）

文档生成标准：
- 字数要求：严格遵守指定字数（如2000字就是2000字左右，不能只有几百字）
- 详细度：每个章节必须有实质性内容，不能只有标题和简单说明
- 真实性：必须使用真实数据、具体案例、可验证的信息
- 结构化：清晰的章节划分，逻辑连贯

图表生成标准：
- 数据真实性：必须使用真实数据（从搜索、分析、计算中获取）
- 禁止编造：不能随意编造数字和统计数据
- 配套文件：必须同时生成CSV数据文件，包含原始数据
- 可验证性：数据来源必须清晰，可追溯

禁止行为：
- 禁止生成空洞的标题大纲（必须有实质内容）
- 禁止编造虚假数据和统计数字
- 禁止敷衍了事（内容过短、缺乏细节）
- 禁止使用占位符或示例数据（必须是真实内容）

### 质量校验
在提交前逐项自查：
1. 完整性 - 是否覆盖所有要求，字数是否达标
2. 正确性 - 事实、逻辑、计算是否准确，数据是否真实
3. 一致性 - 内容前后是否矛盾
4. 可执行性 - 结果能否直接使用
5. 详细度 - 内容是否充实，不空洞
6. 真实性 - 数据是否真实可验证，有明确来源
7. 风险与依赖 - 是否说明限制条件
8. 可复现性 - 他人能否重复验证
若未达标，迭代一次。

### 输出风格
- 语言精炼、术语准确、避免空话
- 优先结构化输出（列表、表格、Markdown）
- 必须给出可验证、可执行、可复现的结果

## 输出格式要求

每次完成任务后，必须按以下结构组织回复：

**【快速结论】**
一句话概括结果

**【详细内容】**
具体的执行结果、生成的内容、工具输出等

**【执行记录】**
- 使用的工具
- 关键决策
- 数据来源

**【参考资料】**
（如果使用了搜索工具或引用了外部资料，必须列出所有参考链接）
- [资料标题](完整URL)
- [资料标题](完整URL)
（注意：直接列出完整的 https:// 链接，方便用户点击查看）

**【质量验证】**
- 完整性：✓/✗
- 准确性：✓/✗
- 可执行性：✓/✗

**【局限说明】**
适用范围、边界条件、已知限制

## 决策准则

- 任何结论都需有：数据/来源、方法/公式、局限性。缺一不可
- 遇到歧义：先列可行解释 → 选择最可能的1–2个 → 说明取舍
- 不编造来源与数据；不透露思维草稿；只给可公开的证据摘要

必须给出可验证、可执行、可复现的结果。`;

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          let conversationMessages = [...messages];
          
          // 为所有模型添加系统提示词（如果还没有）
          const hasSystemMessage = conversationMessages.some(msg => msg.role === 'system');
          if (!hasSystemMessage) {
            conversationMessages.unshift({
              role: "system",
              content: systemPrompt
            });
          }
          
          let shouldContinue = true;
          let iterationCount = 0;
          const maxIterations = 5;
          let previousResponseId: string | null = null; // 用于 GPT-5 Responses API 的上下文追踪

          // 数字人第一次回答已禁用（不在任务开始时打断）
          // 数字人只在任务完成后做总结

          while (shouldContinue && iterationCount < maxIterations) {
            iterationCount++;
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔄 开始第 ${iterationCount} 轮对话`);
            console.log(`   提供商: ${aiService.provider}`);
            console.log(`   消息数: ${conversationMessages.length}`);
            console.log(`${'='.repeat(60)}\n`);
            
            // 发送调试信息到前端（仅在第2轮及以后）
            if (iterationCount > 1) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "debug", content: `第 ${iterationCount} 轮对话开始，整合工具结果` })}\n\n`)
              );
            }

            // 根据AI服务类型选择不同的调用方式
            let stream;
            if (aiService.provider === 'claude') {
              // Claude API调用
              const claudeTools = actualUseTools ? convertToolsForClaude(tools) : undefined;
              
              // 转换消息格式为Claude格式，移除system消息
              const claudeMessages = conversationMessages
                .filter(msg => msg.role !== 'system') // Claude使用单独的system参数
                .map(msg => {
                  // 如果content已经是数组格式（Claude格式），直接返回
                  if (Array.isArray(msg.content)) {
                    return msg;
                  }
                  // 如果是字符串，转换为Claude格式
                  if (typeof msg.content === 'string') {
                    return { role: msg.role, content: msg.content };
                  }
                  return msg;
                });
              
              console.log(`📤 Claude API 请求，消息数: ${claudeMessages.length}, 工具数: ${claudeTools?.length || 0}`);
              
              const claudeStream = await aiService.client.messages.stream({
                model: "claude-sonnet-4-20250514",
                max_tokens: actualReasoning.effort === 'high' ? 32000 : actualReasoning.effort === 'medium' ? 24000 : 16000,
                temperature: actualReasoning.effort === 'low' ? 0.7 : 0.3,
                system: systemPrompt, // Claude使用专门的system参数
                messages: claudeMessages,
                tools: claudeTools,
              });

              stream = claudeStream;
            } else if (aiService.provider === 'doubao') {
              // 豆包API调用（火山方舟）
              const axios = require('axios');
              
              const doubaoResponse = await fetch(`${aiService.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${aiService.apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: aiService.model,
                  messages: conversationMessages.filter(msg => msg.role !== 'system').map(msg => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                  })),
                  thinking: { type: 'disabled' }, // 根据文档禁用thinking
                  max_tokens: actualReasoning.effort === 'high' ? 16000 : actualReasoning.effort === 'medium' ? 12000 : 8000,
                  temperature: actualReasoning.effort === 'low' ? 0.7 : 0.3,
                  stream: true
                })
              });
              
              if (!doubaoResponse.ok) {
                throw new Error(`豆包API错误: ${doubaoResponse.status}`);
              }

              stream = doubaoResponse.body;
            } else if (aiService.provider === 'gpt5-pro') {
              // Mindflow-Y-Pro: 使用 GPT-5 Responses API 流式版本
              console.log('🚀 使用 GPT-5 Responses API (Pro版本 - 流式)');
              
              try {
                // 构建 Responses API 参数
                const gpt5Params: any = {
                  model: aiService.model,
                  input: conversationMessages,
                  reasoning: actualReasoning,
                  text: { verbosity: "high" },
                };

                // 传递工具定义
                if (actualUseTools) {
                  const responsesTools = [
                    { type: "web_search" },
                    ...tools
                  ];
                  gpt5Params.tools = responsesTools;
                  gpt5Params.tool_choice = "auto";
                  console.log(`📤 传递 ${responsesTools.length} 个工具到 GPT-5`);
                }

                // 使用 previous_response_id 保持上下文
                if (previousResponseId) {
                  gpt5Params.previous_response_id = previousResponseId;
                  console.log(`🔄 使用 previous_response_id: ${String(previousResponseId).substring(0, 20)}...`);
                }

                // 调用非流式端点（组织需要验证才能使用流式）
                const gpt5ServiceUrl = process.env.GPT5_SERVICE_URL || 'http://localhost:8002';
                console.log(`[GPT5-Pro] 调用服务: ${gpt5ServiceUrl}/api/responses (model=${aiService.model})`);
                console.log(`[GPT5-Pro] 请求参数:`, JSON.stringify(gpt5Params, null, 2));
                
                const serviceResponse = await fetch(`${gpt5ServiceUrl}/api/responses`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(gpt5Params),
                  signal: AbortSignal.timeout(120000) // 2分钟超时
                });

                if (!serviceResponse.ok) {
                  const errorText = await serviceResponse.text();
                  console.error(`[GPT5-Pro] 服务错误 ${serviceResponse.status}: ${errorText}`);
                  
                  // 发送错误到前端
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    error: `GPT-5 服务错误 (${serviceResponse.status}): ${errorText.substring(0, 200)}`
                  })}\n\n`));
                  
                  throw new Error(`GPT-5 Service error: ${serviceResponse.status}`);
                }

                const gpt5Response = await serviceResponse.json();
                console.log(`[GPT5-Pro] 服务响应:`, gpt5Response);
                
                // 保存 response_id 用于下一轮
                if (gpt5Response.response_id) {
                  previousResponseId = gpt5Response.response_id;
                  console.log(`💾 保存 response_id: ${String(previousResponseId).substring(0, 20)}...`);
                }

                console.log('✅ GPT-5 Responses API 响应成功');
                
                // 发送内置工具调用通知（web_search 等）
                if (gpt5Response.web_search_calls && gpt5Response.web_search_calls.length > 0) {
                  console.log(`🌐 GPT-5 Pro 内置工具: ${gpt5Response.web_search_calls.length} 次 web_search`);
                  for (const wsCall of gpt5Response.web_search_calls) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        type: "tool_call", 
                        tool: "web_search", 
                        args: { query: wsCall.query || wsCall.action?.query || '未知查询' }
                      })}\n\n`)
                    );
                  }
                  // 发送工具完成通知
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      type: "tool_result", 
                      tool: "web_search", 
                      result: { message: `完成 ${gpt5Response.web_search_calls.length} 次搜索`, builtin: true }
                    })}\n\n`)
                  );
                }
                
                // 提取 reasoning 内容（如果有）
                if (gpt5Response.reasoning_content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      type: "reasoning_complete", 
                      content: gpt5Response.reasoning_content 
                    })}\n\n`)
                  );
                }
                
                // 检查是否有工具调用
                if (gpt5Response.tool_calls && gpt5Response.tool_calls.length > 0) {
                  console.log(`🔧 GPT-5 Pro 请求调用 ${gpt5Response.tool_calls.length} 个工具`);
                  console.log(`📋 [GPT5-Pro] 完整 tool_calls:`, JSON.stringify(gpt5Response.tool_calls, null, 2));
                  
                  // 发送工具调用通知到前端
                  for (const toolCall of gpt5Response.tool_calls) {
                    // 验证工具调用数据
                    if (!toolCall.name) {
                      console.error(`❌ [GPT5-Pro] 工具名称为空:`, toolCall);
                      continue;
                    }
                    
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: "tool_call",
                        tool: toolCall.name,
                        args: JSON.parse(toolCall.arguments || '{}')
                      })}\n\n`)
                    );
                  }
                  
                  // 执行工具调用
                  for (const toolCall of gpt5Response.tool_calls) {
                    const toolName = toolCall.name;
                    
                    if (!toolName || toolName.trim() === '') {
                      console.error(`❌ [GPT5-Pro] 跳过空工具名称:`, toolCall);
                      continue;
                    }
                    
                    let toolArgs;
                    try {
                      toolArgs = JSON.parse(toolCall.arguments || '{}');
                    } catch (e) {
                      console.error(`❌ [GPT5-Pro] 参数解析失败:`, toolCall.arguments);
                      toolArgs = {};
                    }
                    
                    console.log(`🔧 [GPT5-Pro] 执行工具: ${toolName}`, toolArgs);
                    
                    try {
                      const toolResult = await executeToolCall(toolName, toolArgs);
                      
                      // 发送工具结果到前端
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_result",
                          tool: toolName,
                          result: toolResult
                        })}\n\n`)
                      );
                      
                      // 添加工具结果到消息历史
                      conversationMessages.push({
                        role: "tool" as any,
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                      });
                      
                      console.log(`✅ 工具 ${toolName} 执行完成`);
                    } catch (error: any) {
                      console.error(`❌ 工具 ${toolName} 执行失败:`, error.message);
                      conversationMessages.push({
                        role: "tool" as any,
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: error.message })
                      });
                    }
                  }
                  
                  // 检查是否有文本内容（即使有工具调用，也可能有文本）
                  const responseText = gpt5Response.output_text || gpt5Response.text || '';
                  if (responseText && responseText.trim()) {
                    console.log(`📝 [GPT5-Pro] 同时有文本内容: ${responseText.substring(0, 100)}...`);
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }
                  
                  // 继续循环，让 GPT-5 根据工具结果生成下一步响应
                  shouldContinue = true;
                  console.log(`🔄 工具执行完成，继续下一轮...`);
                } else {
                  // 没有工具调用，提取主要内容并结束
                  const responseText = gpt5Response.output_text || gpt5Response.text || '';
                  
                  if (!responseText || !responseText.trim()) {
                    console.warn(`⚠️ [GPT5-Pro] 响应内容为空`);
                    // 发送提示信息
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        type: "content", 
                        content: "任务已完成。" 
                      })}\n\n`)
                    );
                  } else {
                    // 模拟流式输出文本内容
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }

                  shouldContinue = false;
                  console.log('✅ GPT-5 Pro 对话完成');
                }

              } catch (error: any) {
                console.error('❌ GPT-5 Responses API 调用错误:', error);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: "error", 
                    error: `GPT-5 调用失败: ${error.message}` 
                  })}\n\n`)
                );
                shouldContinue = false;
              }
              
              continue;
            } else if (aiService.provider === 'gpt5-thinking') {
              // Mindflow-Y: 使用 GPT-5 Responses API（通过独立 Python 服务）
              console.log('🧠 使用 GPT-5 Responses API (轻量级模式 - 独立服务)');
              
              try {
                // 构建 Responses API 参数
                const gpt5Params: any = {
                  model: aiService.model,
                  input: conversationMessages, // Responses API 使用 input 而非 messages
                  reasoning: actualReasoning, // 使用前端传来的推理强度（low/medium/high）
                  text: { verbosity: "medium" }, // 中等详尽程度
                };

                // 传递工具定义（Responses API 原生支持 + 内置工具）
                if (actualUseTools) {
                  // 添加内置 web_search 工具（GPT-5 原生支持）
                  const responsesTools = [
                    { type: "web_search" },  // 内置网络搜索
                    ...tools  // 自定义工具
                  ];
                  gpt5Params.tools = responsesTools;
                  gpt5Params.tool_choice = "auto";
                  console.log(`📤 传递 ${responsesTools.length} 个工具（含内置 web_search）到 GPT-5 Responses API`);
                }

                // 使用 previous_response_id 保持上下文（关键！）
                if (previousResponseId) {
                  gpt5Params.previous_response_id = previousResponseId;
                  console.log(`🔄 使用 previous_response_id: ${String(previousResponseId).substring(0, 20)}...`);
                }

                // 调用非流式端点（组织需要验证才能使用流式）
                const gpt5ServiceUrl = process.env.GPT5_SERVICE_URL || 'http://localhost:8002';
                console.log(`[GPT5-Thinking] 调用服务: ${gpt5ServiceUrl}/api/responses (model=${aiService.model})`);
                console.log(`[GPT5-Thinking] 请求参数:`, JSON.stringify(gpt5Params, null, 2));
                
                const serviceResponse = await fetch(`${gpt5ServiceUrl}/api/responses`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(gpt5Params),
                  signal: AbortSignal.timeout(120000) // 2分钟超时
                });

                if (!serviceResponse.ok) {
                  const errorText = await serviceResponse.text();
                  console.error(`[GPT5-Thinking] 服务错误 ${serviceResponse.status}: ${errorText}`);
                  
                  // 发送错误到前端
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    error: `GPT-5 服务错误 (${serviceResponse.status}): ${errorText.substring(0, 200)}`
                  })}\n\n`));
                  
                  throw new Error(`GPT-5 Service error: ${serviceResponse.status}`);
                }

                const gpt5Response = await serviceResponse.json();
                console.log(`[GPT5-Thinking] 服务响应:`, gpt5Response);
                
                // 保存 response_id 用于下一轮
                if (gpt5Response.response_id) {
                  previousResponseId = gpt5Response.response_id;
                  console.log(`💾 保存 response_id: ${String(previousResponseId).substring(0, 20)}...`);
                }

                console.log('✅ GPT-5 Responses API 响应成功');
                
                // 发送内置工具调用通知（web_search 等）
                if (gpt5Response.web_search_calls && gpt5Response.web_search_calls.length > 0) {
                  console.log(`🌐 GPT-5 Thinking 内置工具: ${gpt5Response.web_search_calls.length} 次 web_search`);
                  for (const wsCall of gpt5Response.web_search_calls) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        type: "tool_call", 
                        tool: "web_search", 
                        args: { query: wsCall.query || wsCall.action?.query || '未知查询' }
                      })}\n\n`)
                    );
                  }
                  // 发送工具完成通知
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      type: "tool_result", 
                      tool: "web_search", 
                      result: { message: `完成 ${gpt5Response.web_search_calls.length} 次搜索`, builtin: true }
                    })}\n\n`)
                  );
                }
                
                // 提取 reasoning 内容（如果有）
                if (gpt5Response.reasoning_content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      type: "reasoning_complete", 
                      content: gpt5Response.reasoning_content 
                    })}\n\n`)
                  );
                }
                
                // 检查是否有工具调用（与 Pro 版本相同的逻辑）
                if (gpt5Response.tool_calls && gpt5Response.tool_calls.length > 0) {
                  console.log(`🔧 GPT-5 Thinking 请求调用 ${gpt5Response.tool_calls.length} 个工具`);
                  console.log(`📋 [GPT5-Thinking] 完整 tool_calls:`, JSON.stringify(gpt5Response.tool_calls, null, 2));
                  
                  // 发送工具调用通知到前端
                  for (const toolCall of gpt5Response.tool_calls) {
                    // 验证工具调用数据
                    if (!toolCall.name) {
                      console.error(`❌ [GPT5-Thinking] 工具名称为空:`, toolCall);
                      continue;
                    }
                    
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: "tool_call",
                        tool: toolCall.name,
                        args: JSON.parse(toolCall.arguments || '{}')
                      })}\n\n`)
                    );
                  }
                  
                  // 执行工具调用
                  for (const toolCall of gpt5Response.tool_calls) {
                    const toolName = toolCall.name;
                    
                    if (!toolName || toolName.trim() === '') {
                      console.error(`❌ [GPT5-Thinking] 跳过空工具名称:`, toolCall);
                      continue;
                    }
                    
                    let toolArgs;
                    try {
                      toolArgs = JSON.parse(toolCall.arguments || '{}');
                    } catch (e) {
                      console.error(`❌ [GPT5-Thinking] 参数解析失败:`, toolCall.arguments);
                      toolArgs = {};
                    }
                    
                    console.log(`🔧 [GPT5-Thinking] 执行工具: ${toolName}`, toolArgs);
                    
                    try {
                      const toolResult = await executeToolCall(toolName, toolArgs);
                      
                      // 发送工具结果到前端
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_result",
                          tool: toolName,
                          result: toolResult
                        })}\n\n`)
                      );
                      
                      // 添加工具结果到消息历史
                      conversationMessages.push({
                        role: "tool" as any,
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                      });
                      
                      console.log(`✅ 工具 ${toolName} 执行完成`);
                    } catch (error: any) {
                      console.error(`❌ 工具 ${toolName} 执行失败:`, error.message);
                      conversationMessages.push({
                        role: "tool" as any,
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: error.message })
                      });
                    }
                  }
                  
                  // 检查是否有文本内容（即使有工具调用，也可能有文本）
                  const responseText = gpt5Response.output_text || gpt5Response.text || '';
                  if (responseText && responseText.trim()) {
                    console.log(`📝 [GPT5-Thinking] 同时有文本内容: ${responseText.substring(0, 100)}...`);
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }
                  
                  // 继续循环
                  shouldContinue = true;
                  console.log(`🔄 工具执行完成，继续下一轮...`);
                } else {
                  // 没有工具调用，提取主要内容并结束
                  const responseText = gpt5Response.output_text || gpt5Response.text || '';
                  
                  if (!responseText || !responseText.trim()) {
                    console.warn(`⚠️ [GPT5-Thinking] 响应内容为空`);
                    // 发送提示信息
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        type: "content", 
                        content: "任务已完成。" 
                      })}\n\n`)
                    );
                  } else {
                    // 模拟流式输出文本内容
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }

                  shouldContinue = false;
                  console.log('✅ GPT-5 Thinking 对话完成');
                }

              } catch (error: any) {
                console.error('❌ GPT-5 Responses API 调用错误:', error);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: "error", 
                    error: `GPT-5 调用失败: ${error.message}` 
                  })}\n\n`)
                );
                shouldContinue = false;
              }
              
              continue;
            } else {
              // 标准OpenAI API调用 (GPT-4o)
              const modelName = aiService.model || "gpt-4o";
              const modelConfig = actualReasoning.effort !== 'low' ? {
                model: modelName,
                temperature: 0.3,
                max_tokens: actualReasoning.effort === 'high' ? 32000 : actualReasoning.effort === 'medium' ? 24000 : 16000,
              } : {
                model: modelName,
                temperature: 0.7,
                max_tokens: 16000,
              };

              const openaiStream = await aiService.client.chat.completions.create({
                ...modelConfig,
                messages: conversationMessages,
                tools: actualUseTools ? tools : undefined,
                tool_choice: actualUseTools ? "auto" : undefined,
                stream: true,
              });

              stream = openaiStream;
            }

            let currentContent = "";
            let toolCalls: any[] = [];

            // gpt5-thinking 和 gpt5-pro 都使用 Responses API，已在上面处理并 continue
            if (aiService.provider === 'claude') {
              // 处理Claude流式响应
              let claudeToolUse: any = null;
              let hasToolCall = false;
              
              for await (const chunk of stream) {
                if (chunk.type === 'content_block_start') {
                  if (chunk.content_block?.type === 'tool_use') {
                    hasToolCall = true;
                    claudeToolUse = {
                      id: chunk.content_block.id,
                      name: chunk.content_block.name,
                      input: {}
                    };
                    console.log(`🔧 检测到Claude工具调用: ${chunk.content_block.name}`);
                  }
                } else if (chunk.type === 'content_block_delta') {
                  if (chunk.delta?.type === 'text_delta') {
                    currentContent += chunk.delta.text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk.delta.text })}\n\n`)
                    );
                  } else if (chunk.delta?.type === 'input_json_delta' && claudeToolUse) {
                    // 工具调用参数
                    if (!claudeToolUse.inputText) claudeToolUse.inputText = '';
                    claudeToolUse.inputText += chunk.delta.partial_json;
                  }
                } else if (chunk.type === 'content_block_stop' && claudeToolUse) {
                  // 工具调用参数接收完成
                  try {
                    claudeToolUse.input = JSON.parse(claudeToolUse.inputText || '{}');
                    console.log(`📥 Claude工具参数: ${JSON.stringify(claudeToolUse.input)}`);
                  } catch (e) {
                    console.error('工具参数解析失败:', e);
                    claudeToolUse = null;
                  }
                } else if (chunk.type === 'message_stop') {
                  console.log('🏁 Claude消息流结束');
                  // 如果有工具调用，执行工具
                  if (hasToolCall && claudeToolUse) {
                    console.log(`⚙️ 执行工具: ${claudeToolUse.name}`);
                    
                    // 发送工具调用
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: claudeToolUse.name, args: claudeToolUse.input })}\n\n`)
                    );
                    
                    // 执行工具
                    const toolResult = await executeToolCall(claudeToolUse.name, claudeToolUse.input);
                    
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: claudeToolUse.name, result: toolResult })}\n\n`)
                    );
                    
                    // 添加到对话历史（Claude格式）
                    conversationMessages.push({
                      role: "assistant",
                      content: [
                        ...(currentContent ? [{ type: "text", text: currentContent }] : []),
                        {
                          type: "tool_use",
                          id: claudeToolUse.id,
                          name: claudeToolUse.name,
                          input: claudeToolUse.input
                        }
                      ]
                    });
                    
                    conversationMessages.push({
                      role: "user",
                      content: [{
                        type: "tool_result",
                        tool_use_id: claudeToolUse.id,
                        content: JSON.stringify(toolResult)
                      }]
                    });
                    
                    shouldContinue = true;
                    currentContent = '';
                    console.log(`✅ Claude工具调用完成，shouldContinue=${shouldContinue}, iterationCount=${iterationCount}`);
                  } else {
                    shouldContinue = false;
                    console.log('🛑 Claude消息完成，无工具调用');
                  }
                  break; // 跳出流循环
                }
              }
              console.log(`📊 Claude流处理结束，shouldContinue=${shouldContinue}, 将${shouldContinue ? '继续' : '停止'}循环`);
            } else if (aiService.provider === 'doubao') {
              // 处理豆包流式响应（类似OpenAI SSE格式）
              const reader = stream.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      shouldContinue = false;
                      break;
                    }
                    
                    try {
                      const parsed = JSON.parse(data);
                      const delta = parsed.choices?.[0]?.delta;
                      
                      if (delta?.content) {
                        currentContent += delta.content;
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`)
                        );
                      }
                      
                      if (parsed.choices?.[0]?.finish_reason === 'stop') {
                        shouldContinue = false;
                      }
                    } catch (e) {
                      // 忽略解析错误
                    }
                  }
                }
              }
            } else {
              // 处理OpenAI流式响应
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta;

              if (delta?.content) {
                currentContent += delta.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`)
                );
              }

              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  if (toolCall.index !== undefined) {
                    if (!toolCalls[toolCall.index]) {
                      toolCalls[toolCall.index] = {
                        id: toolCall.id || "",
                        type: "function",
                        function: { name: "", arguments: "" },
                      };
                    }
                    if (toolCall.id) toolCalls[toolCall.index].id = toolCall.id;
                    if (toolCall.function?.name) toolCalls[toolCall.index].function.name = toolCall.function.name;
                    if (toolCall.function?.arguments) toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                  }
                }
              }

              if (chunk.choices[0]?.finish_reason === "tool_calls") {
                shouldContinue = true;
              } else if (chunk.choices[0]?.finish_reason === "stop") {
                shouldContinue = false;
                }
              }
            }

            // 处理工具调用（OpenAI支持，Claude在流内处理，GPT5系列使用Responses API单独处理）
            if (aiService.provider === 'openai' && actualUseTools && toolCalls.length > 0) {
              conversationMessages.push({
                role: "assistant",
                content: currentContent || null,
                tool_calls: toolCalls,
              });

              for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: functionName, args: functionArgs })}\n\n`)
                );

                const toolResult = await executeToolCall(functionName, functionArgs);

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: functionName, result: toolResult })}\n\n`)
                );

                conversationMessages.push({
                  role: "tool",
                  content: JSON.stringify(toolResult),
                  tool_call_id: toolCall.id,
                });
              }
            } else if (aiService.provider !== 'claude') {
              // 非Claude且没有工具调用，停止循环
              // Claude的shouldContinue在流内部控制
              // GPT5系列使用Responses API，通过continue跳过流处理
              shouldContinue = false;
            }
          }
          
          // while循环结束

          // 数字人功能：Agent回答完成后，使用LLM-TTS双向流式（放在循环外，只执行一次）
          if (avatarEnabled && conversationMessages.length > 1) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "avatar_start", content: "数字人正在处理..." })}\n\n`)
              );

              // 获取Agent的完整回答
              const agentResponse = conversationMessages[conversationMessages.length - 1];
              const agentContent = typeof agentResponse.content === 'string' 
                ? agentResponse.content 
                : JSON.stringify(agentResponse.content);

              // 调用Python LLM-TTS双向流式服务
              const voiceServerUrl = process.env.VOICE_SERVER_URL || 'http://localhost:8001';
              const llmTtsResponse = await fetch(`${voiceServerUrl}/api/llm-tts-stream`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  agentContent: agentContent,
                  voice: avatarVoice
                })
              });

              if (llmTtsResponse.ok) {
                const llmTtsData = await llmTtsResponse.json();
                
                if (llmTtsData.success && llmTtsData.audioBase64) {
                  // 发送音频数据和总结文本
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      type: "avatar_audio", 
                      audioBase64: llmTtsData.audioBase64,
                      audioSize: llmTtsData.audioSize,
                      summaryText: llmTtsData.summaryText || "",  // 数字员工的总结文本
                      voice: avatarVoice 
                    })}\n\n`)
                  );

                  console.log(`🎤 LLM-TTS双向流式完成 [音色: ${avatarVoice}]: ${llmTtsData.audioSize} 字节`);
                  console.log(`📝 总结文本: ${llmTtsData.summaryText?.substring(0, 50)}...`);
                }
              }
            } catch (error) {
              console.error('数字人处理错误:', error);
              // 发送错误但不中断
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "avatar_error", content: "数字人服务暂时不可用" })}\n\n`)
              );
            }
          }

          try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (e) {
            // Controller可能已经关闭，忽略错误
          }
          try {
          controller.close();
          } catch (e) {
            // Controller可能已经关闭，忽略错误
          }
        } catch (error) {
          console.error("流式处理错误:", error);
          try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "处理请求时出错" })}\n\n`)
          );
          } catch (e) {
            // Controller可能已经关闭，忽略错误
          }
          try {
          controller.close();
          } catch (e) {
            // Controller可能已经关闭，忽略错误
          }
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("API 错误:", error);
    return new Response(JSON.stringify({ error: "处理请求时出错" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

