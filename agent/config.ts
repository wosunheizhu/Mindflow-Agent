import OpenAI from "openai";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentConfig {
  model: string;
  tools: any[];
}

export const agentConfig: AgentConfig = {
  model: "gpt-4o",
  tools: [
    { type: "web_search_preview" },
    { type: "code_interpreter" },
    { type: "image_generation" },
  ],
};

/**
 * 调用 OpenAI Responses API
 * @param messages 对话历史
 * @returns API 响应
 */
export async function callAgent(messages: Message[]) {
  try {
    const response = await openai.chat.completions.create({
      model: agentConfig.model,
      messages: messages,
      stream: true,
    });

    return response;
  } catch (error) {
    console.error("调用智能体失败:", error);
    throw error;
  }
}

export { openai };

