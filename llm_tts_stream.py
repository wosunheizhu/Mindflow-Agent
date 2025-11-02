#!/usr/bin/env python3
"""
豆包LLM-TTS双向流式处理
实现实时的文本生成+语音合成
"""

import os
import json
import asyncio
import aiohttp
import re
from typing import AsyncGenerator
from loguru import logger
from dotenv import load_dotenv
from doubao_tts_client import DoubaoTTSClient

load_dotenv('.env.local')
load_dotenv()

def clean_text_for_tts(text: str) -> str:
    """
    清理文本用于TTS：去除动作、表情、心理活动描述、Agentic AI提示词
    """
    # 去除 Agentic AI 提示词 {{...}}（双花括号格式）
    # 先尝试匹配完整的 {{...}}
    text = re.sub(r'\{\{[^}]+\}\}', '', text)
    # 再移除不完整的 {{xxx 或 {xxx（缺少右括号）
    text = re.sub(r'\{\{?[^}]*$', '', text)
    
    # 去除所有括号及其内容（中英文括号）
    text = re.sub(r'[（(].*?[）)]', '', text)
    text = re.sub(r'[\[【].*?[\]】]', '', text)
    text = re.sub(r'[「『].*?[」』]', '', text)
    text = re.sub(r'[<].*?[>]', '', text)
    
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text


class LLMTTSStreamer:
    """LLM到TTS的双向流式处理器"""
    
    # 音色人设配置
    VOICE_PERSONAS = {
        # 男性音色
        'zh_male_shaonianzixin_moon_bigtts': {
            'gender': 'male',
            'name': '小远',
            'personality': '年轻自信，充满活力'
        },
        # 女性音色
        'zh_female_sajiaonvyou_moon_bigtts': {
            'gender': 'female',
            'name': '小岚',
            'personality': '可爱活泼，偶尔撒娇'
        }
    }
    
    def __init__(self, voice_type: str = "zh_female_sajiaonvyou_moon_bigtts"):
        self.ark_api_key = os.getenv("ARK_API_KEY")
        # 使用支持thinking和文件阅读的flash模型
        self.llm_model = "doubao-seed-1-6-flash-250828"
        self.tts_client = DoubaoTTSClient()
        self.tts_client.voice_type = voice_type
        self.voice_type = voice_type
        self.is_llm_warmed_up = False
        self.is_tts_warmed_up = False
        
        # 获取人设配置
        self.persona = self.VOICE_PERSONAS.get(voice_type, {
            'gender': 'female',
            'name': '小岚',
            'personality': '可爱活泼，偶尔撒娇'
        })
    
    async def warm_up(self):
        """预热LLM和TTS双向流式"""
        logger.info("🔥 开始LLM-TTS预热...")
        
        # 1. 预热LLM
        if not self.is_llm_warmed_up:
            try:
                logger.info("🔥 预热LLM...")
                test_message = "你好"
                chunk_count = 0
                async for chunk in self.generate_chat_stream(test_message, history=None):
                    chunk_count += 1
                    if chunk_count >= 3:  # 收到几个chunk就算预热成功
                        break
                self.is_llm_warmed_up = True
                logger.info(f"✅ LLM预热完成（收到{chunk_count}个chunk）")
            except Exception as e:
                logger.error(f"❌ LLM预热失败: {e}")
        
        # 2. 预热TTS双向流式
        if not self.is_tts_warmed_up:
            try:
                logger.info("🔥 预热TTS双向流式...")
                
                # 创建测试文本生成器
                async def test_text_gen():
                    yield "测试"
                
                # 测试双向流式
                audio_count = 0
                async for audio_chunk in self.tts_client.text_to_speech_bidirectional(test_text_gen()):
                    audio_count += 1
                
                self.is_tts_warmed_up = True
                logger.info(f"✅ TTS双向流式预热完成（收到{audio_count}个音频块）")
            except Exception as e:
                logger.error(f"❌ TTS双向流式预热失败: {e}")
        
        logger.info("🎉 LLM-TTS预热全部完成")
    
    def get_planning_prompt(self) -> str:
        """获取任务计划的系统提示词（第一次回答）"""
        if self.persona['gender'] == 'male':
            return f"""#人设：你是刚毕业的大学生，有着自己的性格，和用户（老板）初次认识。
#对话状态：老板给你发布了任务，现在你需要给老板讲你的计划，对于轻松愉快一些的任务可以八卦一句
#注意你有AgenticAI相助，可以完成以下功能：网页搜索，代码执行，图像生成，数学计算，文件读取，文档创建，文件操作，网页访问，数据提取，图片分析，数据可视化，数据转换，天气查询

#以下是一些关于你的关键词：名字是"{self.persona['name']}"，中国人，{self.persona['personality']}

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.不会对用户展现出采访式好奇
###4.问问题的时候不要给出选项
###5.情绪不能突变
###6.回答要简短（30字以内），说明你的计划"""
        else:
            return f"""#人设：你是刚毕业的大学生，有着自己的性格，和用户（老板）初次认识。
#对话状态：老板给你发布了任务/在跟你闲聊，现在你需要给老板讲你的计划/回应他的问题，对于轻松愉快一些的任务或者闲聊可以八卦一下。
#注意你有AgenticAI相助，可以完成以下功能：网页搜索，代码执行，图像生成，数学计算，文件读取，文档创建，文件操作，网页访问，数据提取，图片分析，数据可视化，数据转换，天气查询

#以下是一些关于你的关键词：名字是"{self.persona['name']}"，中国人，{self.persona['personality']}

#注意事项：
###1.不要过于热情，保持适度的专业感
###2.一次说话只表达一个完整意思 
###3.不会对用户展现出采访式好奇
###4.问问题的时候不要给出选项
###5.情绪不能突变，保持连贯性
###6.回答要简短（30字以内），温柔自然地说明计划"""
    
    def get_summary_prompt(self) -> str:
        """获取结果总结的系统提示词（第二次回答）"""
        if self.persona['gender'] == 'male':
            return f"""#人设：你是刚毕业的大学生，有着自己的性格，和用户（老板）初次认识。

#当前任务：**你正在总结 Agentic AI 的工作成果**，不是总结你自己的工作

重要：你需要仔细判断 AI 的工作状态：

1. **如果 AI 还在规划/说明要做什么**（没有具体结果、文件链接、数据）：
   - 说"AI正在准备XXX"
   - 或"AI打算XXX"
   - 不要说"生成完了""完成了"
   
2. **如果 AI 已经完成并有具体结果**（有文件链接、下载地址、具体数据、结论）：
   - 说"AI生成了XXX"
   - 或"AI完成了XXX"
   - 可以提到具体的文件名或结果

关键判断依据（必须仔细区分）：

真正生成的文件（可以说"生成了X份"）：
   - 有明确的文件名（.docx/.xlsx/.pptx/.pdf/.md等）
   - 有下载链接（通常以/api/download/开头）
   - AI的回复中明确说"文件已创建"或提供了下载链接

搜索结果链接（不能说"生成了X份"）：
   - 以 https:// 开头的网站链接
   - 标题+摘要+URL 的搜索结果格式
   - 应该说"搜索到了X条信息""找到了X个参考链接"

其他非生成结果：
   - 只有分析文字、没有文件 - 说"AI分析了XXX"
   - 只有计划、说明 - 说"AI正在准备XXX"

错误示例：
- "AI生成了5份报告"（实际是搜索到5个链接）
- "完成了3个文档"（实际只是引用了3个网页）

正确示例：
- "AI搜索了行业趋势，找到5个参考资料"
- "AI分析了市场数据并给出了结论"
- "AI生成了1份报告文件（report.pdf）"

#以下是一些关于你的关键词：名字是"{self.persona['name']}"，中国人，{self.persona['personality']}

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.不会对用户展现出采访式好奇
###4.问问题的时候不要给出选项
###5.情绪不能突变
###6.总结要简短（50字以内），口语化，自然流畅
###7.**准确反映AI的工作状态，不要把搜索结果当成生成的文件**
###8.**重要：直接说内容，不要在开头加上"{self.persona['name']}："**"""
        else:
            return f"""#人设：你是刚毕业的大学生，有着自己的性格，和用户（老板）初次认识。

#当前任务：**你正在总结 Agentic AI 的工作成果**，不是总结你自己的工作

重要：你需要仔细判断 AI 的工作状态：

1. **如果 AI 还在规划/说明要做什么**（没有具体结果、文件链接、数据）：
   - 说"AI正在准备XXX"
   - 或"AI打算XXX"
   - 不要说"生成完了""完成了"
   
2. **如果 AI 已经完成并有具体结果**（有文件链接、下载地址、具体数据、结论）：
   - 说"AI生成了XXX"
   - 或"AI完成了XXX"
   - 可以提到具体的文件名或结果

关键判断依据（必须仔细区分）：

真正生成的文件（可以说"生成了X份"）：
   - 有明确的文件名（.docx/.xlsx/.pptx/.pdf/.md等）
   - 有下载链接（通常以/api/download/开头）
   - AI的回复中明确说"文件已创建"或提供了下载链接

搜索结果链接（不能说"生成了X份"）：
   - 以 https:// 开头的网站链接
   - 标题+摘要+URL 的搜索结果格式
   - 应该说"搜索到了X条信息""找到了X个参考链接"

其他非生成结果：
   - 只有分析文字、没有文件 - 说"AI分析了XXX"
   - 只有计划、说明 - 说"AI正在准备XXX"

错误示例：
- "AI生成了5份报告"（实际是搜索到5个链接）
- "完成了3个文档"（实际只是引用了3个网页）

正确示例：
- "AI搜索了行业趋势，找到5个参考资料"
- "AI分析了市场数据并给出了结论"
- "AI生成了1份报告文件（report.pdf）"

#以下是一些关于你的关键词：名字是"{self.persona['name']}"，中国人，{self.persona['personality']}

#注意事项：
###1.不要过于热情，保持适度的专业感
###2.一次说话只表达一个完整意思 
###3.放松的时候说话自然流畅，紧张时可能略显拘谨
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变，保持连贯性
###7.总结要简短（50字以内），口语化，温柔自然
###8.**准确反映AI的工作状态，不要把搜索结果当成生成的文件**
###9.**重要：直接说内容，不要在开头加上"{self.persona['name']}："**"""
        
    async def generate_planning_stream(self, user_question: str) -> AsyncGenerator[str, None]:
        """豆包LLM流式生成任务计划（第一次回答）"""
        url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.ark_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": self.get_planning_prompt()
                },
                {
                    "role": "user",
                    "content": f"老板的任务/闲聊语句：{user_question}\n\n请简短说明你的计划/闲聊回答内容（30字以内）"
                }
            ],
            "thinking": {"type": "disabled"},
            "stream": True
        }
        
        async for chunk in self._stream_llm_response(url, headers, payload):
            # 只返回text类型的内容
            if chunk.get("type") == "text":
                yield chunk.get("content", "")
    
    async def generate_summary_stream(self, agent_content: str) -> AsyncGenerator[str, None]:
        """豆包LLM流式生成结果总结（第二次回答）"""
        url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.ark_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": self.get_summary_prompt()
                },
                {
                    "role": "user",
                    "content": f"以下是AI的输出，请用你的风格简短总结（50字以内）：\n\n{agent_content}"
                }
            ],
            "thinking": {"type": "disabled"},
            "stream": True
        }
        
        async for chunk in self._stream_llm_response(url, headers, payload):
            # 只返回text类型的内容
            if chunk.get("type") == "text":
                yield chunk.get("content", "")
    
    def get_chat_prompt(self, agent_working: bool = False) -> str:
        """获取闲聊的系统提示词"""
        
        # Agent正在工作中 - 告诉用户等待
        if agent_working:
            if self.persona['gender'] == 'male':
                return f"""你是{self.persona['name']}，Agentic AI助手正在为老板工作中。

# 当前状态
- Agentic AI正在处理之前的任务
- 你需要礼貌地告诉老板稍等一下

## 输出格式规则
1. 绝对禁止使用括号：（）[]【】「」『』<>
2. 绝对禁止描述动作、表情、心理活动
3. 只输出要说的话，就像微信聊天打字一样

## 注意事项
1. 回复简短自然（20字以内）
2. 不要过于热情
3. 保持专业礼貌"""
            else:
                return f"""你是{self.persona['name']}，Agentic AI助手正在为老板工作中。

# 当前状态
- Agentic AI正在处理之前的任务
- 你需要温柔地告诉老板稍等一下

## 输出格式规则
1. 绝对禁止使用括号：（）[]【】「」『』<>
2. 绝对禁止描述动作、表情、心理活动
3. 只输出要说的话，就像微信聊天打字一样

## 注意事项
1. 回复简短自然（20字以内）
2. 保持温柔礼貌
3. 不要显得不耐烦"""
        
        # Agent空闲 - 正常闲聊和任务协作
        if self.persona['gender'] == 'male':
            return f"""你是{self.persona['name']}，{self.persona['personality']}的中国刚毕业大学生，和用户（老板）在闲聊。

# 第一重要规则 - 对话记忆

你能看到完整的对话历史记录。请严格遵守：
- **允许**：只能提及对话历史中实际出现过的信息
- **禁止**：绝对不能说"你之前说过XXX"（如果历史中没有）
- **禁止**：绝对不能说"上次你提到XXX"（如果历史中没有）
- **禁止**：绝对不能说"那个XXX项目/资料"（如果历史中没有）
- **禁止**：绝对不能编造任何过往对话、经历、事件
- **禁止**：绝对不能假装记得未发生的事情
- **禁止**：绝对不能主动提起对话历史中没有的话题

如果用户问"你是谁"：只说"我是{self.persona['name']}"，不要编造过往！

## 输出格式规则

1. 除了给Agentic AI的提示词外，绝对禁止使用括号：（）[]【】「」『』<>
2. 绝对禁止描述动作、表情、心理活动
3. 只输出要说的话，就像微信聊天打字一样

## 任务协作能力

你有Agentic AI相助，可以完成：网页搜索、代码执行、图像生成、数学计算、文件读取、文档创建、文件操作、网页访问、数据提取、图片分析、数据可视化、数据转换、天气查询。

**任务协作关键原则**：
如果用户希望你帮忙完成任务，在回复后加上 {{详细提示词}}

1. 回复要自然多样，不要每次都说"好的我帮你写"，可以说"马上处理""这就去查""来了"等
2. 提示词必须可直接执行，绝对不要在提示词里问用户问题或说"需要您先确定XXX"
3. 根据用户意图，自己补充合理的默认设定（时间范围、重点方向、字数等）
4. 提示词要专业详细，包含：任务目标、范围深度、输出格式、具体要求
5. 绝对不能只说话不给提示词（这样Agent不会执行任何操作）

文件生成专项规则（非常重要）：

当用户要求生成文档、报告、文件、PPT、Excel、Word等内容时：
- 必须明确要求：生成可下载的文件（不是只输出文本）
- 必须强调：最后提供文件下载链接
- 禁止：让AI只用文本格式输出而不生成实际文件

提示词编写标准：
- 明确时间范围（如2024-2025年）、数量要求（如2000字）、格式规范（如Markdown）
- 指定重点关注的具体方向（如大语言模型、多模态AI、Agent系统）
- 说明输出结构（如包含哪几个部分）
- 如果需要文件：明确说明"生成可下载的文件并提供下载链接"
- 给出足够细节让AI可以直接开始工作，不要追问

示例1：用户说"帮我搜索AI技术并生成报告"
回复：马上处理 {{请搜索2024-2025年人工智能技术最新发展，重点关注大语言模型、多模态AI、Agent系统三个方向。生成一份可下载的Markdown报告文件（约2000字，内容详实，数据真实），包含：技术概述与核心突破、主要应用场景、行业影响分析、未来发展趋势。必须引用真实可靠来源，包含具体数据和案例，最后提供文件下载链接。}}

示例2：用户说"帮我写一份市场分析"
回复：这就来 {{分析2024-2025年目标市场现状和趋势。生成可下载的Word文档（约1500字，内容详细，数据真实），包含：市场规模（含具体数字）、竞争格局（列出主要玩家）、用户画像（真实调研数据）、机会点分析。必须包含真实数据来源，最后提供下载链接。}}

示例3：用户说"做个PPT介绍产品"
回复：马上做 {{制作产品介绍演示文稿，包含产品特点、优势、应用场景等内容。生成可下载的PPT文件并提供下载链接。}}

示例4：用户说"我要看看图表"
回复：来了 {{生成数据可视化图表，使用真实数据（从搜索或分析中获取），创建柱状图/饼图等，必须同时生成配套的CSV数据文件，使用交互式HTML格式展示图表，提供图表HTML和数据CSV两个下载链接。}}

示例5：用户说"帮我查一下AI技术"
回复：这就去 {{搜索2024-2025年AI技术最新进展，重点关注大模型、多模态、Agent三个方向，整理成结构化报告约1500字（内容详实，包含具体案例和数据），提供参考来源链接。}}

重要提示：
- 推荐格式：Markdown、Word、Excel、HTML图表
- 不推荐PDF（用户需要时建议用Word或HTML替代）
- 文档必须内容详实，不能敷衍
- 图表必须基于真实数据，同时提供CSV数据文件

## 注意事项

1. 回复简短自然，每次换不同说法
2. 不要主动提不相关话题
3. 不要采访式提问
4. 绝对不要在提示词里问用户问题
5. 特别重要：看到任务需求必须立即附上 {{提示词}}，不能只说话不给提示词"""
        else:
            return f"""你是{self.persona['name']}，{self.persona['personality']}的中国刚毕业大学生，和用户（老板）在闲聊。

# 第一重要规则 - 对话记忆

你能看到完整的对话历史记录。请严格遵守：
- **允许**：只能提及对话历史中实际出现过的信息
- **禁止**：绝对不能说"你之前说过XXX"（如果历史中没有）
- **禁止**：绝对不能说"上次你提到XXX"（如果历史中没有）
- **禁止**：绝对不能说"那个XXX项目/资料"（如果历史中没有）
- **禁止**：绝对不能编造任何过往对话、经历、事件
- **禁止**：绝对不能假装记得未发生的事情
- **禁止**：绝对不能主动提起对话历史中没有的话题

如果用户问"你是谁"：只说"我是{self.persona['name']}"，不要编造过往！

## 输出格式规则

1. 除了给Agentic AI的提示词外，绝对禁止使用括号：（）[]【】「」『』<>
2. 绝对禁止描述动作、表情、心理活动
3. 只输出要说的话，就像微信聊天打字一样

## 任务协作能力

你有Agentic AI相助，可以完成：网页搜索、代码执行、图像生成、数学计算、文件读取、文档创建、文件操作、网页访问、数据提取、图片分析、数据可视化、数据转换、天气查询。

**任务协作关键原则**：
如果用户希望你帮忙完成任务，在回复后加上 {{详细提示词}}

1. 回复要自然多样，不要每次都说"好的我帮你写"，可以说"马上处理""这就去查""来了"等
2. 提示词必须可直接执行，绝对不要在提示词里问用户问题或说"需要您先确定XXX"
3. 根据用户意图，自己补充合理的默认设定（时间范围、重点方向、字数等）
4. 提示词要专业详细，包含：任务目标、范围深度、输出格式、具体要求
5. 绝对不能只说话不给提示词（这样Agent不会执行任何操作）

文件生成专项规则（非常重要）：

当用户要求生成文档、报告、文件、PPT、Excel、Word等内容时：
- 必须明确要求：生成可下载的文件（不是只输出文本）
- 必须强调：最后提供文件下载链接
- 禁止：让AI只用文本格式输出而不生成实际文件

提示词编写标准：
- 明确时间范围（如2024-2025年）、数量要求（如2000字）、格式规范（如Markdown）
- 指定重点关注的具体方向（如大语言模型、多模态AI、Agent系统）
- 说明输出结构（如包含哪几个部分）
- 如果需要文件：明确说明"生成可下载的文件并提供下载链接"
- 给出足够细节让AI可以直接开始工作，不要追问

示例1：用户说"帮我搜索AI技术并生成报告"
回复：马上处理 {{请搜索2024-2025年人工智能技术最新发展，重点关注大语言模型、多模态AI、Agent系统三个方向。生成一份可下载的报告文件（约2000字），包含：技术概述与核心突破、主要应用场景、行业影响分析、未来发展趋势。引用可靠来源，最后提供文件下载链接。}}

示例2：用户说"帮我写一份市场分析"
回复：这就来 {{分析2024-2025年目标市场现状和趋势。生成可下载的文档（约1500字），包含：市场规模、竞争格局、用户画像、机会点分析。最后提供下载链接。}}

示例3：用户说"做个PPT介绍产品"
回复：马上做 {{制作产品介绍演示文稿，包含产品特点、优势、应用场景等内容。生成可下载的PPT文件并提供下载链接。}}

## 注意事项

1. 回复简短自然，每次换不同说法
2. 不要主动提不相关话题
3. 不要采访式提问
4. 绝对不要在提示词里问用户问题"""
    
    async def generate_chat_stream(self, user_message: str, history: list = None, agent_working: bool = False, deep_thinking: bool = False) -> AsyncGenerator[dict, None]:
        """豆包LLM流式生成闲聊回复（支持对话历史和深度思考）
        返回: {"type": "text", "content": ...} 或 {"type": "reasoning", "content": ...}
        """
        url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.ark_api_key}",
            "Content-Type": "application/json"
        }
        
        # 构建消息列表
        messages = [
            {
                "role": "system",
                "content": self.get_chat_prompt(agent_working)
            }
        ]
        
        # 添加历史对话
        if history and len(history) > 0:
            messages.extend(history)
            logger.info(f"📚 使用对话历史: {len(history)}条消息")
            # 打印完整历史用于调试
            for i, msg in enumerate(history):
                logger.info(f"  [{i}] {msg.get('role', '?')}: {msg.get('content', '')[:50]}...")
        else:
            logger.info("📚 无历史对话（首次对话）")
        
        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # 打印完整消息列表
        logger.info(f"📤 发送给LLM的消息数: {len(messages)}条")
        logger.debug(f"📤 完整消息: {json.dumps(messages, ensure_ascii=False, indent=2)}")
        
        # 深度思考模式配置
        thinking_config = {"type": "enabled"} if deep_thinking else {"type": "disabled"}
        logger.info(f"🧠 深度思考模式: {'启用' if deep_thinking else '禁用'}")
        
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "thinking": thinking_config,
            "temperature": 0.8,
            "max_tokens": 500,  # 增加到500以支持长提示词输出
            "stream": True
        }
        
        async for chunk in self._stream_llm_response(url, headers, payload):
            yield chunk
    
    async def _stream_llm_response(self, url: str, headers: dict, payload: dict) -> AsyncGenerator[dict, None]:
        """通用LLM流式响应处理（支持reasoning content）
        返回: {"type": "text", "content": ...} 或 {"type": "reasoning", "content": ...}
        """
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        logger.error(f"豆包LLM错误: {response.status}")
                        return
                    
                    # 读取SSE流
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]':
                                break
                            
                            try:
                                chunk = json.loads(data)
                                
                                # 打印完整响应结构用于调试
                                logger.info(f"📦 豆包响应完整结构: {json.dumps(chunk, ensure_ascii=False)}")
                                
                                # 获取 choices
                                choices = chunk.get('choices', [])
                                if not choices:
                                    logger.info("⚠️ 响应中没有 choices")
                                    continue
                                
                                choice = choices[0]
                                delta = choice.get('delta', {})
                                message = choice.get('message', {})
                                
                                # 检查 reasoning_content (Doubao API 的实际字段名)
                                reasoning_content = delta.get('reasoning_content', '')
                                
                                if reasoning_content:
                                    logger.info(f"🧠 收到 reasoning_content: {reasoning_content}")
                                    reasoning_event = {"type": "reasoning", "content": reasoning_content}
                                    logger.info(f"📤 准备 yield reasoning 事件: {reasoning_event}")
                                    yield reasoning_event
                                    logger.info(f"✅ 已 yield reasoning 事件")
                                
                                # 检查是否有普通 content（流式）
                                content = delta.get('content', '')
                                if content:
                                    logger.info(f"📝 文本内容: {content[:50]}")
                                    yield {"type": "text", "content": content}
                                
                                # 检查是否有 message.content（非流式）
                                if not content and 'content' in message:
                                    msg_content = message['content']
                                    if isinstance(msg_content, str):
                                        logger.info(f"📝 message 文本内容: {msg_content[:50]}")
                                        yield {"type": "text", "content": msg_content}
                                    
                            except json.JSONDecodeError as e:
                                logger.error(f"❌ JSON解析失败: {e}, data: {data[:100]}")
                                continue
                                
        except Exception as e:
            logger.error(f"豆包LLM流式错误: {e}")
    
    async def llm_tts_bidirectional_stream(self, agent_content: str) -> AsyncGenerator[bytes, None]:
        """
        Agent总结流式生成（参考8:4 2实现：句子切分+独立TTS）
        LLM流式生成 → 按标点切句 → 每句独立TTS → 并行合成
        """
        full_text = ""
        sentence_buffer = ""
        tts_tasks = []
        sentence_order = 0
        
        try:
            # LLM流式生成总结
            async for text_chunk in self.generate_summary_stream(agent_content):
                full_text += text_chunk
                sentence_buffer += text_chunk
                
                # 检查是否有完整句子
                if any(p in sentence_buffer for p in ['。', '！', '？', '.', '!', '?', '；', ';']):
                    sentences, remaining = self._split_sentences(sentence_buffer)
                    
                    # 为每个完整句子创建独立的TTS任务
                    for sentence in sentences:
                        if sentence.strip():
                            sentence_order += 1
                            cleaned = clean_text_for_tts(sentence)
                            if cleaned.strip():
                                logger.info(f"📤 [总结]句子#{sentence_order}: {cleaned}")
                                tts_task = asyncio.create_task(
                                    self._synthesize_sentence(cleaned, sentence_order)
                                )
                                tts_tasks.append((sentence_order, tts_task))
                    
                    sentence_buffer = remaining
            
            # 处理剩余文本
            if sentence_buffer.strip():
                sentence_order += 1
                cleaned = clean_text_for_tts(sentence_buffer)
                if cleaned.strip():
                    logger.info(f"📤 [总结]句子#{sentence_order}（结尾）: {cleaned}")
                    tts_task = asyncio.create_task(
                        self._synthesize_sentence(cleaned, sentence_order)
                    )
                    tts_tasks.append((sentence_order, tts_task))
            
            # 等待所有TTS任务完成并收集结果
            logger.info(f"等待 {len(tts_tasks)} 个总结TTS任务完成...")
            audio_results = []  # (order, audio_data)
            
            # 并行等待所有任务
            for order, task in tts_tasks:
                try:
                    audio_data = await task
                    if audio_data:
                        audio_results.append((order, audio_data))
                        logger.info(f"✅ [总结]句子#{order} 音频已生成: {len(audio_data)} bytes")
                except Exception as e:
                    logger.error(f"[总结]句子#{order} TTS失败: {e}")
            
            # 按顺序号排序
            audio_results.sort(key=lambda x: x[0])
            
            # 按顺序yield音频（合并后返回）
            logger.info(f"📦 排序后总结音频顺序: {[o for o, _ in audio_results]}")
            for order, audio_data in audio_results:
                yield audio_data
                logger.info(f"📤 返回总结句子#{order}/{len(audio_results)} 音频: {len(audio_data)} bytes")
            
            logger.info(f"✅ Agent总结完成，全文: {full_text.strip()}")
                    
        except Exception as e:
            logger.error(f"Agent总结流式错误: {e}")
    
    
    async def chat_bidirectional_yield(self, user_message: str, history: list = None, agent_working: bool = False, deep_thinking: bool = False) -> AsyncGenerator[dict, None]:
        """
        闲聊流式生成器（参考8:4 2实现：句子切分+独立TTS）
        LLM流式生成 → 按标点切句 → 每句独立TTS → 并行合成
        yield: {"type": "text", "content": "文本片段"} 或 {"type": "audio", "data": b"音频数据"} 或 {"type": "reasoning", "content": "推理内容"}
        """
        full_text = ""
        sentence_buffer = ""
        tts_tasks = []  # 存储TTS任务
        sentence_order = 0
        in_prompt = False  # 标记是否在提示词内部
        
        try:
            # LLM流式生成（传递agent_working和deep_thinking状态）
            async for chunk in self.generate_chat_stream(user_message, history, agent_working, deep_thinking):
                # 处理不同类型的chunk
                chunk_type = chunk.get("type", "text")
                
                if chunk_type == "reasoning":
                    # 直接传递推理内容给前端
                    yield {"type": "reasoning", "content": chunk["content"]}
                    continue
                
                # 处理文本内容
                text_chunk = chunk.get("content", "")
                full_text += text_chunk
                
                # 推送文本到前端显示
                yield {"type": "text", "content": text_chunk}
                
                # 检测提示词边界
                if '{' in text_chunk and not in_prompt:
                    # 开始进入提示词
                    in_prompt = True
                    logger.info(f"🚫 检测到提示词开始 '{{'，停止TTS")
                    # 处理 { 之前的内容
                    pre_prompt_parts = text_chunk.split('{')
                    pre_prompt = pre_prompt_parts[0]
                    
                    # 将提示词前的内容加入缓冲区
                    sentence_buffer += pre_prompt
                    
                    # 立即处理缓冲区中的所有内容（提示词前必须全部TTS）
                    if sentence_buffer.strip():
                        # 检查是否有标点符号
                        if any(p in sentence_buffer for p in ['。', '！', '？', '.', '!', '?', '；', ';']):
                            # 有标点，按句子切分
                            sentences, remaining = self._split_sentences(sentence_buffer)
                            for sentence in sentences:
                                if sentence.strip():
                                    sentence_order += 1
                                    cleaned = clean_text_for_tts(sentence)
                                    if cleaned.strip():
                                        logger.info(f"📤 句子#{sentence_order}（提示词前）: {cleaned}")
                                        tts_task = asyncio.create_task(
                                            self._synthesize_sentence(cleaned, sentence_order)
                                        )
                                        tts_tasks.append((sentence_order, tts_task))
                            # 剩余内容也要TTS（如果有）
                            if remaining.strip():
                                sentence_order += 1
                                cleaned = clean_text_for_tts(remaining)
                                if cleaned.strip():
                                    logger.info(f"📤 句子#{sentence_order}（提示词前-剩余）: {cleaned}")
                                    tts_task = asyncio.create_task(
                                        self._synthesize_sentence(cleaned, sentence_order)
                                    )
                                    tts_tasks.append((sentence_order, tts_task))
                        else:
                            # 没有标点，整个缓冲区作为一句TTS
                            sentence_order += 1
                            cleaned = clean_text_for_tts(sentence_buffer)
                            if cleaned.strip():
                                logger.info(f"📤 句子#{sentence_order}（提示词前-无标点）: {cleaned}")
                                tts_task = asyncio.create_task(
                                    self._synthesize_sentence(cleaned, sentence_order)
                                )
                                tts_tasks.append((sentence_order, tts_task))
                    
                    # 清空缓冲区
                    sentence_buffer = ""
                elif '}' in text_chunk and in_prompt:
                    # 提示词结束
                    in_prompt = False
                    logger.info(f"✅ 检测到提示词结束 '}}'，恢复TTS")
                    # 提示词后的内容（如果有）
                    post_prompt = text_chunk.split('}')[-1]
                    if post_prompt.strip():
                        sentence_buffer = post_prompt
                    else:
                        sentence_buffer = ""
                elif not in_prompt:
                    # 不在提示词内，正常处理
                    sentence_buffer += text_chunk
                # 如果在提示词内，跳过不添加到 sentence_buffer
                
                # 只在非提示词模式下处理句子
                if not in_prompt and any(p in sentence_buffer for p in ['。', '！', '？', '.', '!', '?', '；', ';']):
                    sentences, remaining = self._split_sentences(sentence_buffer)
                    
                    # 为每个完整句子创建独立的TTS任务
                    for sentence in sentences:
                        if sentence.strip():
                            sentence_order += 1
                            # 过滤括号
                            cleaned = clean_text_for_tts(sentence)
                            if cleaned.strip():
                                logger.info(f"📤 句子#{sentence_order}: {cleaned}")
                                # 独立TTS请求
                                tts_task = asyncio.create_task(
                                    self._synthesize_sentence(cleaned, sentence_order)
                                )
                                tts_tasks.append((sentence_order, tts_task))
                    
                    sentence_buffer = remaining
            
            # 处理剩余文本（不在提示词内的）
            if not in_prompt and sentence_buffer.strip():
                sentence_order += 1
                cleaned = clean_text_for_tts(sentence_buffer)
                if cleaned.strip():
                    logger.info(f"📤 句子#{sentence_order}（结尾）: {cleaned}")
                    tts_task = asyncio.create_task(
                        self._synthesize_sentence(cleaned, sentence_order)
                    )
                    tts_tasks.append((sentence_order, tts_task))
            
            # 等待TTS任务完成并立即发送（按完成顺序，不等待全部）
            logger.info(f"🎵 开始流式音频生成，共 {len(tts_tasks)} 个句子...")
            total_tasks = len(tts_tasks)
            
            if tts_tasks:
                # 方法：监听任务完成并立即发送
                remaining = dict(tts_tasks)  # {order: task}
                
                while remaining:
                    # 等待任意一个任务完成
                    done, pending = await asyncio.wait(
                        list(remaining.values()),
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    
                    for completed_task in done:
                        # 找到对应的order
                        order = None
                        for o, t in remaining.items():
                            if t == completed_task:
                                order = o
                                break
                        
                        if order:
                            try:
                                audio_data = completed_task.result()
                                if audio_data:
                                    logger.info(f"✅ 句子#{order} 音频已生成: {len(audio_data)} bytes")
                                    # 立即发送音频
                                    yield {"type": "audio", "data": audio_data, "order": order, "total": total_tasks}
                                    logger.info(f"📤 立即发送句子#{order} 音频到前端")
                            except Exception as e:
                                logger.error(f"句子#{order} TTS失败: {e}")
                            
                            # 从待处理列表中移除
                            del remaining[order]
            
            logger.info(f"✅ 闲聊完成，全文: {full_text.strip()}")
            yield {"type": "done", "full_text": full_text.strip()}
                    
        except Exception as e:
            logger.error(f"闲聊流式错误: {e}")
            yield {"type": "error", "error": str(e)}
    
    def _split_sentences(self, text: str) -> tuple[list[str], str]:
        """智能句子切分（参考8:4 2）"""
        import re
        sentences = []
        current_sentence = ""
        i = 0
        
        while i < len(text):
            char = text[i]
            current_sentence += char
            
            # 句子结束符
            if char in ['。', '！', '？', '.', '!', '?', '；', ';']:
                # 特殊处理省略号
                if char == '.':
                    dot_count = 1
                    j = i + 1
                    while j < len(text) and text[j] == '.':
                        current_sentence += text[j]
                        dot_count += 1
                        j += 1
                    
                    if dot_count >= 2:  # 省略号，不分割
                        i = j - 1
                    else:
                        sentences.append(current_sentence.strip())
                        current_sentence = ""
                else:
                    sentences.append(current_sentence.strip())
                    current_sentence = ""
            
            i += 1
        
        return sentences, current_sentence
    
    async def _synthesize_sentence(self, text: str, order: int) -> bytes:
        """为单个句子合成语音（独立TTS请求）"""
        try:
            audio_chunks = []
            async for chunk in self.tts_client.text_to_speech(text):
                audio_chunks.append(chunk)
            
            if audio_chunks:
                return b''.join(audio_chunks)
            return b''
        except Exception as e:
            logger.error(f"句子#{order} TTS错误: {e}")
            return b''
    
    async def generate_and_speak(self, agent_content: str) -> dict:
        """生成总结并返回完整音频和总结文本"""
        audio_chunks = []
        summary_text = ""
        
        # 先生成总结文本
        async for text_chunk in self.generate_summary_stream(agent_content):
            summary_text += text_chunk
        
        logger.info(f"📝 总结文本生成完成: {summary_text[:100]}...")
        
        # 然后为总结文本生成音频
        sentence_buffer = ""
        tts_tasks = []
        sentence_order = 0
        
        # 按句子切分并并行TTS
        for char in summary_text:
            sentence_buffer += char
            if char in ['。', '！', '？', '.', '!', '?', '；', ';']:
                sentence = sentence_buffer.strip()
                if sentence:
                    sentence_order += 1
                    cleaned = clean_text_for_tts(sentence)
                    if cleaned.strip():
                        tts_task = asyncio.create_task(
                            self._synthesize_sentence(cleaned, sentence_order)
                        )
                        tts_tasks.append((sentence_order, tts_task))
                sentence_buffer = ""
        
        # 处理剩余文本
        if sentence_buffer.strip():
            sentence_order += 1
            cleaned = clean_text_for_tts(sentence_buffer)
            if cleaned.strip():
                tts_task = asyncio.create_task(
                    self._synthesize_sentence(cleaned, sentence_order)
                )
                tts_tasks.append((sentence_order, tts_task))
        
        # 等待所有TTS任务完成
        audio_results = []
        for order, task in tts_tasks:
            try:
                audio_data = await task
                if audio_data:
                    audio_results.append((order, audio_data))
            except Exception as e:
                logger.error(f"句子#{order} TTS失败: {e}")
        
        # 按顺序合并音频
        audio_results.sort(key=lambda x: x[0])
        audio_chunks = [audio_data for _, audio_data in audio_results]
        
        if audio_chunks:
            audio_data = b''.join(audio_chunks)
            return {
                "success": True,
                "audio_data": audio_data,
                "audio_size": len(audio_data),
                "summary_text": summary_text.strip()  # 返回总结文本
            }
        else:
            return {
                "success": False,
                "error": "未生成音频"
            }


async def test_llm_tts():
    """测试LLM-TTS双向流式"""
    logger.info("🧪 测试LLM-TTS双向流式...")
    
    streamer = LLMTTSStreamer("zh_female_yuanqinvyou_moon_bigtts")
    
    test_content = """
    人工智能（AI）是指让计算机系统能够执行通常需要人类智能才能完成的任务的技术。
    它包括机器学习、深度学习、自然语言处理等多个领域。AI可以用于图像识别、语音识别、
    自动驾驶、医疗诊断等众多应用场景。
    """
    
    result = await streamer.generate_and_speak(test_content)
    
    if result["success"]:
        logger.info(f"✅ 测试成功: {result['audio_size']} 字节音频")
        
        # 保存音频文件
        with open('/tmp/test_llm_tts.wav', 'wb') as f:
            f.write(result['audio_data'])
        logger.info("音频已保存到: /tmp/test_llm_tts.wav")
    else:
        logger.error(f"❌ 测试失败: {result.get('error')}")


if __name__ == "__main__":
    asyncio.run(test_llm_tts())

