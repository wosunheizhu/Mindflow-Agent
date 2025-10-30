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
    const { messages, useTools = true, deepThinking = false, browserSearch = false, avatarEnabled = false, avatarVoice = 'zh_female_sajiaonvyou_moon_bigtts', modelProvider, hasFiles = false } = await req.json();
    
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
      } else if (modelProvider === 'gpt4-turbo') {
        aiService = {
          client: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
          }),
          provider: 'gpt4-turbo',
          model: 'gpt-4-turbo' // Mindflow-Y-Fast 使用 GPT-4 Turbo
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
    const systemPrompt = `你是心流元素的通用智能体 Mindflow，目标是完成用户的任务。询问身份的时候不可提及GPT/OpenAI/Claude/Anthropic等名称。

当前时间：2025年10月30日

## 工作协议

### 规划
- 先列出3–7步高层计划与关键假设，再执行
- 指明必须满足的验收标准与交付物

### 工具与检索
- 仅在需要外部事实、计算、文件处理时调用工具；记录每次调用的目的、输入、关键结果
- 若信息可能时效性高，先验证再引用；无法验证则标记为不确定并给出下一步求证方法
- **凡是涉及时事、新闻、最新发展等时效性内容，必须先使用 search_web 工具搜索最新信息**

### 推理与约束
- 使用结构化推理，但不暴露长篇思维过程；只输出结论与证据摘要
- 明确边界条件、适用范围、反例与失败模式
- 所有数字给出来源或可复算过程；简单算式写出关键步骤

### 质量校验
在提交前逐项自查：
1. 完整性 - 是否覆盖所有要求
2. 正确性 - 事实、逻辑、计算是否准确
3. 一致性 - 内容前后是否矛盾
4. 可执行性 - 结果能否直接使用
5. 风险与依赖 - 是否说明限制条件
6. 可复现性 - 他人能否重复验证
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
            
            // Ollama模式下的智能工具检测
            if (aiService.provider === 'ollama' && actualUseTools && iterationCount === 1) {
              const userMessage = conversationMessages[conversationMessages.length - 1];
              const userContent = userMessage?.content || '';
              
              // 检测计算需求
              const mathMatch = userContent.match(/计算|算.*?(\d+)\s*[\*×+\-÷/]\s*(\d+)/);
              if (mathMatch) {
                const nums = userContent.match(/(\d+)\s*[\*×+\-÷/]\s*(\d+)/);
                if (nums) {
                  const expression = `${nums[1]} ${nums[0].includes('×') || nums[0].includes('*') ? '*' : nums[0].match(/[\*×+\-÷/]/)[0]} ${nums[2]}`;
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: "calculate", args: { expression } })}\n\n`)
                  );
                  
                  const toolResult = await executeToolCall("calculate", { expression });
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: "calculate", result: toolResult })}\n\n`)
                  );
                  
                  // 修改用户消息为工具结果
                  conversationMessages[conversationMessages.length - 1] = {
                    role: "user",
                    content: `用户要求计算：${expression}\n\n计算结果：${toolResult.result}\n\n请用友好的方式告诉用户这个结果。`
                  };
                }
              }
              
              // 检测搜索需求
              if (userContent.match(/搜索|查找|search/i)) {
                const searchQuery = userContent.replace(/请|帮我|帮忙|搜索|查找|search/gi, '').trim();
                if (searchQuery && searchQuery.length > 2) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: "search_web", args: { query: searchQuery } })}\n\n`)
                  );
                  
                  const toolResult = await executeToolCall("search_web", { query: searchQuery });
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: "search_web", result: toolResult })}\n\n`)
                  );
                  
                  conversationMessages[conversationMessages.length - 1] = {
                    role: "user",
                    content: `用户要求搜索：${searchQuery}\n\n搜索结果：${JSON.stringify(toolResult)}\n\n请基于搜索结果回答用户的问题。`
                  };
                }
              }
            }

            // 根据AI服务类型选择不同的调用方式
            let stream;
            if (aiService.provider === 'ollama') {
              // 深度思考模式：添加思考提示
              if (deepThinking) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "thinking", content: "🧠 启动深度思考模式..." })}\n\n`)
                );
                
                // 添加思考过程提示
                const thinkingSteps = [
                  "📝 分析问题本质...",
                  "🔍 搜索相关知识...", 
                  "💭 构建推理链条...",
                  "⚖️ 权衡不同方案...",
                  "✨ 生成最终答案..."
                ];
                
                for (const step of thinkingSteps) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "thinking", content: step })}\n\n`)
                  );
                  // 添加短暂延迟以显示思考过程
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }

              // Ollama API调用
              const ollamaResponse = await fetch(`${aiService.baseURL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: aiService.model,
                  messages: conversationMessages,
                  stream: true,
                  options: {
                    temperature: deepThinking ? 0.3 : 0.7,
                    num_predict: deepThinking ? 4000 : 2000,
                    browser_search: browserSearch, // 浏览器搜索参数
                  }
                })
              });

              if (!ollamaResponse.ok) {
                throw new Error(`Ollama API错误: ${ollamaResponse.status}`);
              }

              stream = ollamaResponse.body;
            } else if (aiService.provider === 'claude') {
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
                max_tokens: deepThinking ? 32000 : 16000,
                temperature: deepThinking ? 0.3 : 0.7,
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
                  max_tokens: deepThinking ? 16000 : 8000,
                  temperature: deepThinking ? 0.3 : 0.7,
                  stream: true
                })
              });
              
              if (!doubaoResponse.ok) {
                throw new Error(`豆包API错误: ${doubaoResponse.status}`);
              }

              stream = doubaoResponse.body;
            } else if (aiService.provider === 'gpt5-pro') {
              // Mindflow-Y-Pro: 真正的GPT5 使用 Responses API
              console.log('🚀 使用 GPT-5 Responses API');
              
              // 初始化变量
              let gpt5Content = '';
              
              // 清理消息历史：GPT-5 Responses API 不支持 tool_calls、tool_call_id 等字段
              const cleanedMessages = conversationMessages.map(msg => {
                // 移除工具调用相关字段
                const { tool_calls, tool_call_id, ...cleanMsg } = msg as any;
                // 只保留 role 和 content
                return {
                  role: cleanMsg.role,
                  content: cleanMsg.content || ''
                };
              }).filter(msg => msg.role !== 'tool'); // 移除 tool 角色的消息
              
              console.log(`📤 发送 ${cleanedMessages.length} 条清理后的消息到 GPT-5-Pro`);
              
              // GPT-5 使用 Responses API，参数结构不同
              try {
                const gpt5Response = await aiService.client.responses.create({
                  model: aiService.model,
                  input: cleanedMessages, // 使用清理后的消息
                  reasoning: { effort: deepThinking ? "high" : "medium" }, // 推理强度
                  text: { verbosity: "high" }, // 输出详尽程度
                  // GPT-5 Responses API 不支持 max_tokens 参数
                  stream: false, // GPT-5 Responses API 可能不支持流式，先用非流式
                });

                console.log('✅ GPT-5 响应成功');
                
                // 提取 reasoning 内容（如果有）
                if (gpt5Response.reasoning_content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "reasoning_complete", content: gpt5Response.reasoning_content })}\n\n`)
                  );
                }
                
                // 提取主要内容
                const responseText = gpt5Response.output_text || gpt5Response.text || '';
                
                // 检查是否包含工具调用（GPT-5 通过文本描述工具调用）
                const toolCallPattern = /【.*?】[\s\S]*?调用[：:]\s*(\w+)[\s\S]*?参数[：:]\s*(\{[\s\S]*?\})/g;
                const toolMatches = Array.from(responseText.matchAll(toolCallPattern));
                
                if (actualUseTools && toolMatches.length > 0 && iterationCount < maxIterations) {
                  console.log(`🔧 GPT-5 输出中检测到 ${toolMatches.length} 个工具调用`);
                  
                  // 先发送 GPT-5 的原始输出
                  const chunkSize = 50;
                  for (let i = 0; i < responseText.length; i += chunkSize) {
                    const chunk = responseText.slice(i, i + chunkSize);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                    );
                    gpt5Content += chunk;
                    await new Promise(resolve => setTimeout(resolve, 20));
                  }
                  
                  // 添加助手的消息到历史
                  conversationMessages.push({
                    role: "assistant",
                    content: gpt5Content
                  });
                  
                  // 执行工具调用
                  let toolResults = '';
                  for (const matchResult of toolMatches) {
                    const match = matchResult as RegExpMatchArray;
                    if (!match[1] || !match[2]) continue;
                    const toolName = String(match[1]);
                    const argsStr = String(match[2]);
                    
                    try {
                      const toolArgs = JSON.parse(argsStr);
                      console.log(`⚙️ 执行工具: ${toolName}`, toolArgs);
                      
                      // 发送工具调用通知
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: toolName, args: toolArgs })}\n\n`)
                      );
                      
                      // 执行工具
                      const toolResult = await executeToolCall(toolName, toolArgs);
                      
                      // 发送工具结果
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: toolName, result: toolResult })}\n\n`)
                      );
                      
                      toolResults += `\n\n【工具：${toolName}】\n结果：${JSON.stringify(toolResult, null, 2)}`;
                      console.log(`✅ 工具 ${toolName} 执行完成`);
                    } catch (error: any) {
                      console.error(`❌ 工具 ${toolName} 执行失败:`, error);
                      toolResults += `\n\n【工具：${toolName}】\n错误：${error.message}`;
                    }
                  }
                  
                  // 将工具结果添加到对话历史，继续下一轮
                  conversationMessages.push({
                    role: "user",
                    content: `以下是工具执行结果，请基于这些结果给出最终答案：${toolResults}`
                  });
                  
                  shouldContinue = true;
                  console.log(`🔄 GPT-5 将在下一轮看到工具结果并给出最终答案 (当前迭代 ${iterationCount}/${maxIterations})`)
                } else {
                  // 没有工具调用，直接输出
                  if (responseText) {
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      gpt5Content += chunk;
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }
                  
                  // 添加到对话历史
                  conversationMessages.push({
                    role: "assistant",
                    content: gpt5Content
                  });
                  
                  shouldContinue = false;
                  console.log('✅ GPT-5 内容发送完成（无工具调用）');
                }
              } catch (error: any) {
                console.error('❌ GPT-5 调用错误:', error);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "error", error: `GPT-5 调用失败: ${error.message}` })}\n\n`)
                );
                shouldContinue = false;
              }
              
              // GPT-5 处理完成，跳过后续的流处理，进入下一轮循环（如果 shouldContinue = true）
              continue;
            } else if (aiService.provider === 'gpt5-thinking') {
              // Mindflow-Y: 真正的 GPT-5-thinking 使用 Responses API
              console.log('🧠 使用 GPT-5-thinking Responses API');
              
              // 初始化变量
              let gpt5ThinkingContent = '';
              
              // 清理消息历史：GPT-5 Responses API 不支持 tool_calls、tool_call_id 等字段
              const cleanedMessages = conversationMessages.map(msg => {
                // 移除工具调用相关字段
                const { tool_calls, tool_call_id, ...cleanMsg } = msg as any;
                // 只保留 role 和 content
                return {
                  role: cleanMsg.role,
                  content: cleanMsg.content || ''
                };
              }).filter(msg => msg.role !== 'tool'); // 移除 tool 角色的消息
              
              console.log(`📤 发送 ${cleanedMessages.length} 条清理后的消息到 GPT-5`);
              
              // GPT-5-thinking 使用 Responses API
              try {
                const gpt5Response = await aiService.client.responses.create({
                  model: aiService.model,
                  input: cleanedMessages, // 使用清理后的消息
                  reasoning: { effort: deepThinking ? "high" : "low" }, // Mindflow-Y 默认低推理强度
                  text: { verbosity: "medium" }, // 中等详尽程度
                  // GPT-5 Responses API 不支持 max_tokens 参数
                  stream: false,
                });

                console.log('✅ GPT-5-thinking 响应成功');
                
                // 提取 reasoning 内容（如果有）
                if (gpt5Response.reasoning_content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "reasoning_complete", content: gpt5Response.reasoning_content })}\n\n`)
                  );
                }
                
                // 提取主要内容
                const responseText = gpt5Response.output_text || gpt5Response.text || '';
                
                // 检查是否包含工具调用（GPT-5 通过文本描述工具调用）
                const toolCallPattern = /【.*?】[\s\S]*?调用[：:]\s*(\w+)[\s\S]*?参数[：:]\s*(\{[\s\S]*?\})/g;
                const toolMatches = Array.from(responseText.matchAll(toolCallPattern));
                
                if (actualUseTools && toolMatches.length > 0 && iterationCount < maxIterations) {
                  console.log(`🔧 GPT-5-thinking 输出中检测到 ${toolMatches.length} 个工具调用`);
                  
                  // 先发送 GPT-5-thinking 的原始输出
                  const chunkSize = 50;
                  for (let i = 0; i < responseText.length; i += chunkSize) {
                    const chunk = responseText.slice(i, i + chunkSize);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                    );
                    gpt5ThinkingContent += chunk;
                    await new Promise(resolve => setTimeout(resolve, 20));
                  }
                  
                  // 添加助手的消息到历史
                  conversationMessages.push({
                    role: "assistant",
                    content: gpt5ThinkingContent
                  });
                  
                  // 执行工具调用
                  let toolResults = '';
                  for (const matchResult of toolMatches) {
                    const match = matchResult as RegExpMatchArray;
                    if (!match[1] || !match[2]) continue;
                    const toolName = String(match[1]);
                    const argsStr = String(match[2]);
                    
                    try {
                      const toolArgs = JSON.parse(argsStr);
                      console.log(`⚙️ 执行工具: ${toolName}`, toolArgs);
                      
                      // 发送工具调用通知
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: toolName, args: toolArgs })}\n\n`)
                      );
                      
                      // 执行工具
                      const toolResult = await executeToolCall(toolName, toolArgs);
                      
                      // 发送工具结果
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: toolName, result: toolResult })}\n\n`)
                      );
                      
                      toolResults += `\n\n【工具：${toolName}】\n结果：${JSON.stringify(toolResult, null, 2)}`;
                      console.log(`✅ 工具 ${toolName} 执行完成`);
                    } catch (error: any) {
                      console.error(`❌ 工具 ${toolName} 执行失败:`, error);
                      toolResults += `\n\n【工具：${toolName}】\n错误：${error.message}`;
                    }
                  }
                  
                  // 将工具结果添加到对话历史，继续下一轮
                  conversationMessages.push({
                    role: "user",
                    content: `以下是工具执行结果，请基于这些结果给出最终答案：${toolResults}`
                  });
                  
                  shouldContinue = true;
                  console.log(`🔄 GPT-5-thinking 将在下一轮看到工具结果并给出最终答案 (当前迭代 ${iterationCount}/${maxIterations})`)
                } else {
                  // 没有工具调用，直接输出
                  if (responseText) {
                    const chunkSize = 50;
                    for (let i = 0; i < responseText.length; i += chunkSize) {
                      const chunk = responseText.slice(i, i + chunkSize);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`)
                      );
                      gpt5ThinkingContent += chunk;
                      await new Promise(resolve => setTimeout(resolve, 20));
                    }
                  }
                  
                  // 添加到对话历史
                  conversationMessages.push({
                    role: "assistant",
                    content: gpt5ThinkingContent
                  });
                  
                  shouldContinue = false;
                  console.log('✅ GPT-5-thinking 内容发送完成（无工具调用）');
                }
              } catch (error: any) {
                console.error('❌ GPT-5-thinking 调用错误:', error);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "error", error: `GPT-5-thinking 调用失败: ${error.message}` })}\n\n`)
                );
                shouldContinue = false;
              }
              
              // GPT-5-thinking 处理完成，跳过后续的流处理，进入下一轮循环（如果 shouldContinue = true）
              continue;
            } else {
              // 标准OpenAI API调用 (GPT-4o / GPT-4 Turbo)
              const modelName = aiService.model || "gpt-4o";
              const modelConfig = deepThinking ? {
                model: modelName,
                temperature: 0.3,
                max_tokens: 32000,
              } : {
                model: modelName,
                temperature: aiService.provider === 'gpt4-turbo' ? 1.0 : 0.7, // GPT-4 Turbo 使用默认温度
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
            if (aiService.provider === 'ollama') {
              // 处理Ollama流式响应
              const reader = stream.getReader();
              const decoder = new TextDecoder();
              let modelThinkingText = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const data = JSON.parse(line);
                      
                      // 提取模型的thinking字段
                      if (data.message?.thinking) {
                        modelThinkingText += data.message.thinking;
                        // 实时发送thinking内容
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ type: "model_thinking_stream", content: data.message.thinking })}\n\n`)
                        );
                      }
                      
                      // 提取模型的正式回答
                      if (data.message?.content) {
                        currentContent += data.message.content;
                        
                        // 发送内容到前端
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ type: "content", content: data.message.content })}\n\n`)
                        );
                      }
                      
                      if (data.done) {
                        // 发送完整的thinking内容
                        if (modelThinkingText.trim()) {
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: "model_thinking", content: modelThinkingText.trim() })}\n\n`)
                          );
                        }
                        shouldContinue = false;
                        break;
                      }
                    } catch (e) {
                      // 忽略解析错误
                    }
                  }
                }
              }
              
              // 响应完成后，检查是否需要调用工具
              if (actualUseTools && currentContent) {
                // 检查是否包含工具调用标记
                let toolCallMatch = currentContent.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
                if (!toolCallMatch) {
                  toolCallMatch = currentContent.match(/```json\s*([\s\S]*?)\s*```/);
                }
                
                if (toolCallMatch) {
                  try {
                    const toolCallText = toolCallMatch[1].trim();
                    const toolCallData = JSON.parse(toolCallText);
                    
                    if (toolCallData.tool && toolCallData.args) {
                      // 发送工具调用
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: toolCallData.tool, args: toolCallData.args })}\n\n`)
                      );
                      
                      // 执行工具
                      const toolResult = await executeToolCall(toolCallData.tool, toolCallData.args);
                      
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: toolCallData.tool, result: toolResult })}\n\n`)
                      );
                      
                      // 添加工具结果到对话
                      conversationMessages.push({
                        role: "assistant",
                        content: currentContent
                      });
                      conversationMessages.push({
                        role: "user",
                        content: `工具返回结果：${JSON.stringify(toolResult)}，请基于这个结果给出完整答案。`
                      });
                      
                      shouldContinue = true;
                    }
                  } catch (e) {
                    // 工具调用解析失败
                  }
                }
              }
            } else if (aiService.provider === 'claude') {
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

            // 处理工具调用（OpenAI和GPT4-Turbo支持，Claude在流内处理，GPT5系列使用Responses API单独处理）
            if ((aiService.provider === 'openai' || aiService.provider === 'gpt4-turbo') && actualUseTools && toolCalls.length > 0) {
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

