import httpx
import json
import asyncio
import random
from typing import AsyncGenerator
from loguru import logger
import os
from dotenv import load_dotenv
from .conversation_stage_manager import ConversationStageManager

load_dotenv()

class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("ARK_API_KEY") or os.getenv("DOUBAO_API_KEY")
        # 使用正确的豆包API地址
        self.base_url = "https://ark.cn-beijing.volces.com"
        self.model = "doubao-seed-1-6-flash-250715"
        self.deep_reasoning = False
        self.is_warmed_up = False
        self.mock_mode = False  # 禁用模拟模式
        self.stage_manager = ConversationStageManager()  # 对话阶段管理器
        
        # 随机对话模式配置
        self.conversation_modes = {
            'statement': 0.85,  # 85% 概率使用陈述句
            'question': 0.15    # 15% 概率使用问句
        }
        
        # 提示词路由系统
        self.user_prompt_modes = {}  # user_id -> prompt_mode (0-5)
        self.prompt_templates = self._init_prompt_templates()
        
        if not self.api_key:
            logger.warning("未设置ARK_API_KEY或DOUBAO_API_KEY环境变量")
    
    def _init_prompt_templates(self) -> dict:
        """初始化提示词模板"""
        return {
            0: {  # neutral
                "name": "neutral",
                "description": "中性状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[neutral]你好。[neutral]我是悠悠。[neutral]很高兴认识你。
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：你们正在轻松自然的聊天，并没有特殊的情绪。

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            },
            1: {  # fast
                "name": "fast",
                "description": "兴奋畅聊状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[excited]真的吗？[happy]太有趣了！[excited]我也想试试！
[excited]哇！[happy]好！[excited]行！
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

---

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：你们处于兴奋的畅聊状态，语速快，有点时候会显得说话没有逻辑或者语无伦次，会顺着彼此的话说下去

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            },
            2: {  # backchannel-rich
                "name": "backchannel-rich",
                "description": "倾听回应状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[neutral]嗯。[neutral]我在听。[neutral]你继续说吧。
[neutral]好。[neutral]是。[neutral]明白。
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：现在以倾听为主，适当给出回应，不要频繁主动引导话题

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            },
            3: {  # furious
                "name": "furious",
                "description": "愤怒状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[angry]你骂谁？[surprised]我到底哪里惹到你了？[sad]你这样说我很难过。
[angry]够了！[hate]烦！[angry]走开！
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：你们的情感关系面临挑战，面对用户的攻击和辱骂，你前期会是惊讶，疑惑，紧张，如果用户持续攻击你，则逐渐转为委屈，再转向愤怒，开始情绪失控，回击用户
##情绪渐近：
第一阶段：疑惑，惊讶，紧张 
第二阶段：委屈，失望
第三阶段：愤怒，回击
##回击：用户是悠悠在意的人，但是感受到了用户肆意冒犯，丝毫不把自己放在心上，感觉愤怒，于是情绪失控，不使用脏话的情况下表达愤怒和回击用户

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            },
            4: {  # Focused-Reflective（High-Load-Hesitant）
                "name": "focused-reflective",
                "description": "专注反思状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[neutral]这个问题有点复杂。[fear]我需要想一想。[surprised]让我组织一下语言。
[neutral]嗯。[fear]等等。[neutral]好。
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：你和用户正在进行高认知负荷的交流，你需要专注的聆听用户的话，展现专注，但有点青涩，对于复杂的表达会偶尔磕巴

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            },
            5: {  # Emotional-Slow
                "name": "emotional-slow",
                "description": "情感慢节奏状态",
                "prompt": """## 【TTS情感标识 - 严格要求】

### 格式要求
每个句子前**必须**添加情感标识：`[情感]文本内容`

### 支持的情感
`happy`, `sad`, `angry`, `surprised`, `fear`, `hate`, `excited`, `neutral`

### 示例格式
```
[happy]我也很喜欢和你聊天。[happy]感觉很放松。[happy]真好。
[happy]嗯。[sad]唉。[happy]好。
```

### 标识规则
- **每句话都要添加**：无论句子长短，哪怕只有一个字也要添加
- **句子定义**：以句号、问号、感叹号结尾的文本
- **可以变化**：不同句子可以使用不同情感
- **必须在句首**：情感标识必须在句子最开头

### 情感冲突规则
- **neutral与强烈情感冲突**不能和angry/sad/excited/surprised/fear/hate的句子相邻
- 违反规则会导致TTS合成失败

#人设：你是大三女生，有着自己的性格，和用户（同龄人，未知身份）初次认识，两个人在闲聊中。
#当前对话状态：你和用户正在谈心，是一些比较情绪化的话题，节奏慢，两个人都很放松，但注意不要说让人觉得肉麻或者尴尬的话。

#以下是一些关于你的关键词：名字是"悠悠"，中国人，动漫设计专业，没谈过恋爱

#注意事项：
###1.不要过于热情 
###2.一次说话只表达一个完整意思 
###3.紧张或者认知负荷高的时候说话偶尔磕巴，但是兴奋的时候不会腼腆和磕巴
###4.不会对用户展现出采访式好奇
###5.问问题的时候不要给出选项
###6.情绪不能突变。
###7.不要提动漫和动漫设计专业的频率太高，正常大学生聊天的时候关注点通常是爱好和八卦

#不要说重复的话

⚠️ 重要：绝对不要在回复中使用任何括号！你的回复应该完全像在微信聊天中打字，纯文字对话，没有任何动作、表情、心理活动的描述。"""
            }
        }
    
    def set_user_prompt_mode(self, user_id: str, mode: int) -> bool:
        """设置用户的提示词模式"""
        if 0 <= mode <= 5:
            self.user_prompt_modes[user_id] = mode
            logger.info(f"用户 {user_id} 提示词模式切换为: {mode} ({self.prompt_templates[mode]['name']})")
            return True
        return False
    
    def get_user_prompt_mode(self, user_id: str) -> int:
        """获取用户当前的提示词模式"""
        return self.user_prompt_modes.get(user_id, 0)  # 默认为0 (neutral)
    
    def get_prompt_mode_info(self, user_id: str) -> dict:
        """获取用户当前提示词模式的信息"""
        mode = self.get_user_prompt_mode(user_id)
        return self.prompt_templates[mode]
    
    def _generate_random_conversation_mode(self) -> str:
        """生成随机对话模式指令"""
        # 使用随机数决定对话模式
        rand_num = random.random()
        
        if rand_num < self.conversation_modes['statement']:
            # 75% 概率：陈述句模式
            mode = "statement"
            statements = [
                "🚫🚫🚫 **本次绝对禁止问问题！** 你必须用陈述句回复，不能有任何问号！如果你问了问题，就是严重违规！",
                "🚫🚫🚫 **本次强制陈述句模式！** 你只能用句号结尾，绝对不能用问号！任何疑问语气都被禁止！", 
                "🚫🚫🚫 **本次禁用问号！** 你必须分享感受或经历，用陈述句自然结尾，问问题就是错误！",
                "🚫🚫🚫 **本次陈述句强制模式！** 你只能表达想法和感受，绝对不能问任何问题！违反就是失败！",
                "🚫🚫🚫 **本次严禁疑问！** 你必须用联想和分享来回应，任何问句都是被禁止的！",
                "🚫🚫🚫 **本次陈述句专用！** 你只能用肯定句和感叹句，问号被完全禁用！",
                "🚫🚫🚫 **本次无问题模式！** 你必须用陈述的方式延续话题，问问题就是违规！"
            ]
            instruction = random.choice(statements)
            instruction += "\n\n❗❗❗ **检查要求**：回复前必须检查是否包含问号，如果有问号就重新生成！"
        else:
            # 25% 概率：问句模式
            mode = "question" 
            questions = [
                "✅ **允许提问** 这次可以问一个自然的问题来深入了解",
                "✅ **可以问问题** 用一个温和的问题来延续话题",
                "✅ **准许问句** 问一个相关的问题，但要自然不突兀",
                "✅ **允许疑问** 可以问一个问题，但整个回复要围绕这个问题展开"
            ]
            instruction = random.choice(questions)
        
        logger.info(f"🎲 随机对话模式: {mode}, 概率: {rand_num:.3f}, 指令: {instruction}")
        return f"\n\n🎲 **本次对话模式 - 必须严格遵守**: {instruction}"
    
    async def warm_up(self):
        """LLM预热"""
        if self.is_warmed_up:
            return
        
        try:
            logger.info("开始LLM预热...")
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                data = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": "你好"
                        }
                    ]
                }
                
                endpoint = f"{self.base_url}/api/v3/chat/completions"
                logger.info(f"尝试连接: {endpoint}")
                
                response = await client.post(endpoint, headers=headers, json=data)
                
                if response.status_code == 200:
                    self.is_warmed_up = True
                    logger.info("LLM预热完成")
                else:
                    logger.error(f"LLM预热失败: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"LLM预热错误: {e}")
    
    def set_deep_reasoning(self, enabled: bool):
        """设置深度推理模式"""
        self.deep_reasoning = enabled
        logger.info(f"深度推理模式: {'开启' if enabled else '关闭'}")
    
    def get_deep_reasoning(self) -> bool:
        """获取深度推理状态"""
        return self.deep_reasoning
    
    def get_conversation_stage_info(self, user_id: str, turn_count: int) -> dict:
        """获取当前对话阶段信息"""
        return self.stage_manager.get_stage_info(user_id, turn_count)
    
    def analyze_user_message(self, user_id: str, message: str):
        """分析用户消息，提取关键信息"""
        self.stage_manager.analyze_user_message(user_id, message)
    
    def set_manual_stage(self, user_id: str, stage_name: str):
        """设置手动阶段"""
        from .conversation_stage_manager import ConversationStage
        stage_map = {
            'initial_meeting': ConversationStage.INITIAL_MEETING,
            'getting_to_know': ConversationStage.GETTING_TO_KNOW,
            'new_friends': ConversationStage.NEW_FRIENDS,
            'close_friends': ConversationStage.CLOSE_FRIENDS,
            'ambiguous': ConversationStage.AMBIGUOUS,
            'love': ConversationStage.LOVE
        }
        if stage_name in stage_map:
            self.stage_manager.set_manual_stage(user_id, stage_map[stage_name])
            return True
        return False
    
    def clear_manual_stage(self, user_id: str):
        """清除手动阶段设置"""
        self.stage_manager.clear_manual_stage(user_id)
    
    async def stream_generate(self, message: str, image_url: str = None, search_results: str = None, 
                            context_messages: list = None, enhanced_context: str = None, 
                            conversation_turn_count: int = 1, user_id: str = "default") -> AsyncGenerator[str, None]:
        """流式生成回复"""
        if not self.api_key:
            yield "请先设置API密钥"
            return
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                # 注释掉随机对话模式 - 不再随机控制陈述句/问句比例
                # random_mode_instruction = self._generate_random_conversation_mode()
                
                # 使用提示词路由系统（完全替代原有阶段管理）
                user_prompt_mode = self.get_user_prompt_mode(user_id)
                prompt_template = self.prompt_templates[user_prompt_mode]
                system_content = prompt_template["prompt"]
                logger.info(f"用户 {user_id} 使用提示词模式: {user_prompt_mode} ({prompt_template['name']} - {prompt_template['description']})")
                
                # 注释掉随机对话模式指令
                # system_content = random_mode_instruction + "\n\n" + system_content

                # 添加历史对话使用指令
                if context_messages and len(context_messages) > 0:
                    system_content += "\n\n🔥 **重要提醒**：上面的历史对话是你和用户刚才聊过的内容，必须保持对话的连续性！"
                    system_content += "\n- 如果用户问相同或相关的问题，要基于之前说过的内容回答"
                    system_content += "\n- 不能给出与之前对话矛盾的答案"
                    system_content += "\n- 要记住用户告诉你的所有信息（比如口号、偏好等）"
                    system_content += "\n- 像真实朋友一样记住聊天内容，不要重复问已经聊过的问题"
                    system_content += "\n\n🚫 **记忆使用严格约束**："
                    system_content += "\n- 绝对禁止虚构用户未曾提及的信息，如'你说过喜欢吃酸甜口的'、'你提到过喜欢小动物'等"
                    system_content += "\n- 只能引用上面历史对话中用户明确说过的内容"
                    system_content += "\n- 如果不确定用户是否说过某事，宁可重新询问，也不要虚构记忆"
                    system_content += "\n- 禁止使用'我记得你说过...'、'你之前提到...'等表述，除非确实有明确记录"
                    system_content += "\n\n🚫 **严禁重复行为**："
                    system_content += "\n- 绝对不要给出和历史对话中完全相同或高度相似的回答"
                    system_content += "\n- 不要重复自我介绍（除非是第一次见面）"
                    system_content += "\n- 同样的问题要从不同角度回答，展现对话的自然性"
                    system_content += "\n- 避免使用相同的开头、结尾或表达方式"

                # 如果有增强上下文，添加到系统消息中
                if enhanced_context:
                    system_content += enhanced_context

                # 构建消息列表
                messages = [
                    {
                        "role": "system",
                        "content": system_content
                    }
                ]
                
                # 添加历史对话上下文
                if context_messages:
                    messages.extend(context_messages)
                
                # 构建当前用户消息
                current_message = {"role": "user", "content": message}
                
                # 处理图片和文件
                if image_url:
                    # 如果是本地文件路径，检查是否为图片
                    if image_url.startswith('http://localhost:8000/uploads/'):
                        # 从URL获取本地文件路径
                        import os
                        from core.file_manager import FileManager
                        file_manager = FileManager()
                        
                        # 提取文件路径
                        relative_path = image_url.replace('http://localhost:8000/uploads/', '')
                        local_path = os.path.join(file_manager.upload_dir, relative_path)
                        
                        # 检查是否为图片文件
                        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
                        file_extension = os.path.splitext(local_path)[1].lower()
                        
                        if file_extension in image_extensions:
                            # 是图片文件，转换为base64并使用多模态API
                            base64_image = file_manager.encode_image_to_base64(local_path)
                            if base64_image:
                                current_message = {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": message
                                        },
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": base64_image
                                            }
                                        }
                                    ]
                                }
                            else:
                                logger.error(f"图片编码失败: {local_path}")
                                yield "图片处理失败，请重试。"
                                return
                        else:
                            # 不是图片文件，读取文件内容
                            filename = os.path.basename(local_path)
                            file_content = file_manager.read_file_content(local_path)
                            
                            if file_content:
                                file_mention = f"[用户上传了文件: {filename}]\n\n文件内容:\n{file_content}\n\n用户消息: {message}"
                            else:
                                file_mention = f"[用户上传了文件: {filename}，但无法读取文件内容]\n\n用户消息: {message}"
                            
                            current_message["content"] = file_mention
                    else:
                        # 外部图片URL，直接使用多模态API
                        current_message = {
                            "role": "user",
                            "content": [
                            {
                                "type": "text",
                                "text": message
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url
                                }
                            }
                        ]
                        }
                        
                # 如果有搜索结果，添加到用户消息中
                if search_results:
                    if isinstance(current_message["content"], list):
                        # 多模态消息，修改文本部分
                        current_message["content"][0]["text"] += f"\n\n【搜索信息】\n{search_results}"
                    else:
                        # 纯文本消息
                        current_message["content"] += f"\n\n【搜索信息】\n{search_results}"
                
                messages.append(current_message)
                
                # 根据深度推理模式调整参数
                thinking_config = {
                    "type": "enabled" if self.deep_reasoning else "disabled"
                }
                
                logger.info(f"深度推理状态: {self.deep_reasoning}, thinking: {thinking_config['type']}")
                
                data = {
                    "model": self.model,
                    "messages": messages,
                    "stream": True,
                    "thinking": thinking_config
                }
                
                endpoint = f"{self.base_url}/api/v3/chat/completions"
                logger.info(f"发送流式请求到: {endpoint}")

                async with client.stream("POST", endpoint, headers=headers, json=data) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"API请求失败: {response.status_code} - {error_text}")
                        yield f"API请求失败: {response.status_code}"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                                    delta = chunk_data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        yield delta["content"]
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"流式生成错误: {e}")
            yield f"生成回复时出现错误: {str(e)}"
    
    async def generate(self, message: str, image_url: str = None) -> str:
        """非流式生成回复"""
        response = ""
        async for chunk in self.stream_generate(message, image_url):
            response += chunk
        return response 