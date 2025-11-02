"""
GPT-5 Responses API 服务
专门处理 GPT-5 的 Responses API 调用，支持工具调用和 agentic 工作流
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Callable
import httpx
import os
from dotenv import load_dotenv
import json
import requests

load_dotenv()

app = FastAPI(title="GPT-5 Responses API Service")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = "https://api.openai.com/v1"


class Message(BaseModel):
    role: str
    content: Optional[str] = None  # content 可以为 null（比如工具调用消息）
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None
    
    class Config:
        extra = "allow"  # 允许额外字段


class Tool(BaseModel):
    type: str
    function: Optional[Dict[str, Any]] = None  # 自定义工具有 function 字段
    name: Optional[str] = None  # 内置工具和 Responses API 格式的工具有 name
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"  # 允许额外字段


class GPT5Request(BaseModel):
    model: str = "gpt-5"
    input: List[Message]
    reasoning: Optional[Dict[str, str]] = {"effort": "medium"}
    text: Optional[Dict[str, str]] = {"verbosity": "medium"}
    tools: Optional[List[Tool]] = None
    tool_choice: Optional[str] = "auto"
    previous_response_id: Optional[str] = None


class GPT5Response(BaseModel):
    output_text: Optional[str] = None
    reasoning_content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    web_search_calls: Optional[List[Dict[str, Any]]] = None  # 内置工具调用
    response_id: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None


# ---- 从 Responses API 的 output 中提取 function_call ----
def extract_function_calls(response_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    """提取 output 数组中的 function_call 项"""
    calls: List[Dict[str, Any]] = []
    try:
        for item in response_json.get("output", []) or []:
            if item.get("type") == "function_call":
                calls.append({
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "arguments": item.get("arguments", "{}"),
                    "status": item.get("status"),
                })
    except Exception as e:
        print(f"  ⚠️ 提取 function_call 时出错: {e}")
    
    valid_calls = [c for c in calls if c.get("id") and c.get("name")]
    if valid_calls:
        print(f"  🔧 提取到 {len(valid_calls)} 个有效的 function_call")
    return valid_calls


def safe_json_string(obj: Any, max_len: int = 400_000) -> str:
    """安全地序列化对象为 JSON 字符串，并控制长度"""
    try:
        s = json.dumps(obj, ensure_ascii=False)
    except Exception:
        s = str(obj)
    
    # 控制长度（Responses API 限制）
    if len(s) > max_len:
        s = s[:max_len] + f"...[truncated {len(s)-max_len} chars]"
    return s


@app.get("/")
async def root():
    return {
        "service": "GPT-5 Responses API Service",
        "status": "running",
        "endpoints": {
            "responses": "/api/responses",
            "health": "/health"
        }
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy", "api_configured": bool(OPENAI_API_KEY)}


@app.post("/api/responses", response_model=GPT5Response)
async def create_response(request: GPT5Request):
    """
    调用 GPT-5 Responses API
    
    这是 OpenAI GPT-5 推荐的 API 端点，支持：
    - reasoning.effort 控制推理深度
    - text.verbosity 控制输出详略
    - previous_response_id 保持上下文
    - 原生工具调用支持
    """
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # 构建请求数据并清理消息格式
    # Responses API 严格要求：
    # 1. 不接受 role:"tool"（只允许 assistant/system/developer/user）
    # 2. 不接受 tool_calls/function_call 等模型产出字段
    # 3. content 应该是数组格式 [{"type":"text","text":"..."}]
    
    ALLOWED_ROLES = {"assistant", "system", "developer", "user"}
    
    cleaned_input = []
    skipped_count = 0
    
    for i, msg in enumerate(request.input):
        msg_dict = msg.model_dump(exclude_none=True)
        role = msg_dict.get("role")
        
        # 移除前端特有字段（OpenAI API 不支持）
        frontend_only_fields = ["fromAvatar", "avatarName", "avatarImage", "toolCalls", "thinkingSteps", "modelThinking", "reasoningContent"]
        for field in frontend_only_fields:
            msg_dict.pop(field, None)
        
        # 提取文本内容
        raw_content = msg_dict.get("content", "")
        if isinstance(raw_content, dict):
            text = raw_content.get("text") or raw_content.get("content") or ""
        elif isinstance(raw_content, list):
            # 可能是 [{"type":"text","text":"..."}] 格式
            texts = []
            for item in raw_content:
                if isinstance(item, dict):
                    texts.append(str(item.get("text") or item.get("content") or ""))
                else:
                    texts.append(str(item))
            text = "\n".join(texts).strip()
        else:
            text = str(raw_content).strip()
        
        # 检查并警告：如果消息包含禁止字段
        if "tool_calls" in msg_dict or "toolCalls" in msg_dict or "function_call" in msg_dict:
            print(f"  ⚠️ 消息 [{i}] role={role} 包含 tool_calls，将被移除")
        
        # 关键修复：将 role:"tool" 转换为 role:"assistant"
        if role == "tool":
            # 工具结果改写为 assistant 的 output_text
            if text:
                print(f"  🔄 消息 [{i}] role=tool 转换为 role=assistant (output_text)")
                cleaned_input.append({
                    "role": "assistant",
                    "content": [{"type": "output_text", "text": text}]
                })
            else:
                print(f"  ⚠️ 消息 [{i}] role=tool 无内容，跳过")
                skipped_count += 1
            continue
        
        # 其他非法角色转换为 user
        if role not in ALLOWED_ROLES:
            print(f"  ⚠️ 消息 [{i}] role={role} 不在允许列表中，转换为 user")
            role = "user"
        
        # 按角色映射到正确的 content type
        # user/system/developer → input_text
        # assistant → output_text
        if text:
            if role in ("user", "system", "developer"):
                cleaned_input.append({
                    "role": role,
                    "content": [{"type": "input_text", "text": text}]
                })
            else:  # assistant
                cleaned_input.append({
                    "role": role,
                    "content": [{"type": "output_text", "text": text}]
                })
        else:
            # 没有 content（可能只有 tool_calls），跳过
            print(f"  ⚠️ 消息 [{i}] role={role} 没有 content，跳过")
            skipped_count += 1
    
    print(f"📝 清理后的消息: {len(cleaned_input)} 条（跳过 {skipped_count} 条）")
    
    # 验证：确保没有禁止字段和角色
    input_json = json.dumps(cleaned_input)
    
    # 检查 content.type 是否正确
    try:
        if cleaned_input:
            first_type = cleaned_input[0]["content"][0]["type"] if cleaned_input[0].get("content") else None
            print(f"  📋 首条消息 content.type: {first_type}")
    except Exception:
        pass
    
    if "tool_calls" in input_json or "toolCalls" in input_json:
        print(f"  ⚠️⚠️⚠️ 警告：input 仍包含 tool_calls！")
    if '"role":"tool"' in input_json or '"role": "tool"' in input_json:
        print(f"  ⚠️⚠️⚠️ 警告：input 仍包含 role:tool！")
    if '"type":"text"' in input_json or '"type": "text"' in input_json:
        print(f"  ⚠️⚠️⚠️ 警告：input 使用了 type:text（应该是 input_text/output_text）！")
    else:
        print(f"  ✅ 确认：无 tool_calls、无 role:tool、正确使用 input_text/output_text")
    
    payload = {
        "model": request.model,
        "input": cleaned_input,
    }
    
    # 添加 GPT-5 特有参数
    if request.reasoning:
        payload["reasoning"] = request.reasoning
    
    if request.text:
        payload["text"] = request.text
    
    # 添加工具定义（转换为 Responses API 格式）
    if request.tools:
        # 转换工具格式：Chat Completions 格式 -> Responses API 格式
        # Chat Completions: {"type": "function", "function": {"name": "...", "description": "...", "parameters": {...}}}
        # Responses API: {"type": "function", "name": "...", "description": "...", "parameters": {...}}
        # 内置工具: {"type": "web_search"}
        converted_tools = []
        for tool in request.tools:
            tool_dict = tool.model_dump(exclude_none=True)
            
            # 内置工具（只有 type 字段）
            if tool_dict.get("type") in ["web_search", "file_search", "code_interpreter", "image_generation"]:
                converted_tool = {"type": tool_dict["type"]}
                print(f"  ✅ 添加内置工具: {tool_dict['type']}")
            
            # Chat Completions 格式（嵌套在 function 下）
            elif "function" in tool_dict and isinstance(tool_dict["function"], dict):
                converted_tool = {
                    "type": tool_dict.get("type", "function"),
                    "name": tool_dict["function"].get("name"),
                    "description": tool_dict["function"].get("description"),
                    "parameters": tool_dict["function"].get("parameters", {})
                }
                print(f"  ✅ 转换自定义工具: {converted_tool['name']}")
            
            # 已经是 Responses API 格式（顶层有 name）
            elif "name" in tool_dict:
                converted_tool = tool_dict
                print(f"  ✅ 保留 Responses API 格式工具: {tool_dict['name']}")
            
            else:
                print(f"  ⚠️ 未知工具格式，跳过: {tool_dict}")
                continue
            
            converted_tools.append(converted_tool)
        
        payload["tools"] = converted_tools
        if request.tool_choice:
            payload["tool_choice"] = request.tool_choice
        
        print(f"✅ 总计 {len(converted_tools)} 个工具（含内置和自定义）")
    
    # 添加上下文 ID（如果有）
    if request.previous_response_id:
        payload["previous_response_id"] = request.previous_response_id
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # 打印请求详情（用于调试）
    print(f"\n📤 发送到 OpenAI Responses API:")
    print(f"模型: {payload['model']}")
    print(f"消息数: {len(payload['input'])}")
    print(f"工具数: {len(payload.get('tools', []))}")
    if payload.get('tools'):
        # 清理工具列表中的占位符和非法项
        tool_names = []
        for t in payload['tools']:
            name = t.get('function', {}).get('name') or t.get('name', '')
            if name and name != '?':
                tool_names.append(name)
        print(f"工具列表: {tool_names[:5]}")
    print(f"Reasoning: {payload.get('reasoning')}")
    print(f"Text: {payload.get('text')}\n")
    
    try:
        # 增加超时时间（GPT-5 web_search 可能需要较长时间）
        async with httpx.AsyncClient(timeout=300.0) as client:
            # 调用 OpenAI Responses API
            response = await client.post(
                f"{OPENAI_BASE_URL}/responses",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = response.text
                print(f"❌ OpenAI API 错误: {response.status_code}")
                print(f"响应内容: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenAI API error: {error_detail}"
                )
            
            result = response.json()
            
            # 打印响应详情（用于调试）
            print(f"\n📥 收到 OpenAI Responses API 响应:")
            print(f"响应键: {list(result.keys())}")
            
            # 打印完整的 output 数组
            if result.get("output"):
                print(f"output 数组长度: {len(result['output'])}")
                for i, item in enumerate(result["output"]):
                    item_type = item.get('type')  # ← 定义变量
                    print(f"  [{i}] type={item_type}, keys={list(item.keys())[:10]}")
                    
                    # 检查是否有工具调用
                    if item.get('tool_calls'):
                        print(f"      🔧 发现工具调用: {len(item['tool_calls'])} 个")
                        for tc in item.get('tool_calls', [])[:2]:
                            print(f"         - {tc.get('function', {}).get('name', tc.get('name', '?'))}")
                    
                    # 检查内置工具调用（web_search_call, file_search_call 等）
                    if item_type == "web_search_call":
                        action = item.get('action', {})
                        query = action.get('query', '')
                        print(f"      🌐 内置 web_search: {query[:50]}...")
                    
                    if item_type == 'text':
                        content = item.get('content', item.get('text', ''))
                        print(f"      文本内容: {content[:100]}...")
                    elif item_type == 'message':
                        print(f"      message content 长度: {len(item.get('content', []))}")
                    elif item_type == 'reasoning':
                        summary = item.get('summary', item.get('content', ''))
                        print(f"      推理内容: {summary[:100]}...")
            
            print(f"完整 JSON (前 1000 字符): {json.dumps(result, indent=2, ensure_ascii=False)[:1000]}...\n")
            
            # 解析 Responses API 的响应格式
            output_text = None
            reasoning_content = None
            tool_calls = None
            web_search_calls = []  # 收集内置工具调用信息
            
            # Responses API 返回的 output 是一个数组
            if result.get("output") and isinstance(result["output"], list):
                for item in result["output"]:
                    item_type = item.get("type")
                    
                    # 提取文本内容 - 处理 message 类型
                    if item_type == "message":
                        # content 是一个数组，需要遍历
                        content_list = item.get("content", [])
                        if isinstance(content_list, list):
                            for content_item in content_list:
                                # 查找 output_text 类型
                                if content_item.get("type") == "output_text":
                                    output_text = content_item.get("text", "")
                                    break
                        elif isinstance(content_list, str):
                            # 如果 content 是字符串
                            output_text = content_list
                    
                    # 备用：提取文本内容 - text 类型
                    elif item_type == "text":
                        if item.get("content"):
                            output_text = item["content"]
                        elif item.get("text"):
                            output_text = item["text"]
                    
                    # 提取 reasoning 内容
                    elif item_type == "reasoning":
                        summary = item.get("summary")
                        # summary 可能是数组或字符串
                        if isinstance(summary, str):
                            reasoning_content = summary
                        elif isinstance(summary, list) and len(summary) > 0:
                            reasoning_content = str(summary)
                        elif item.get("content"):
                            reasoning_content = item["content"]
                    
                    # 提取内置 web_search 调用信息
                    elif item_type == "web_search_call":
                        action = item.get("action", {})
                        web_search_calls.append({
                            "id": item.get("id"),
                            "type": "web_search",
                            "query": action.get("query", ""),
                            "status": item.get("status", "completed")
                        })
                    
                    # 提取工具调用 - 关键修复！
                    # 1. 数组形式的工具调用
                    if item.get("tool_calls") and isinstance(item["tool_calls"], list):
                        if not tool_calls:
                            tool_calls = []
                        tool_calls.extend(item["tool_calls"])
                        print(f"      🔧 发现工具调用数组: {len(item['tool_calls'])} 个")
                    
                    # 2. 单个工具调用（type == "function_call"）
                    elif item_type == "function_call":
                        if not tool_calls:
                            tool_calls = []
                        
                        # 构建标准格式的工具调用
                        tool_call = {
                            "id": item.get("id"),
                            "type": "function",
                            "function": {
                                "name": item.get("name"),  # 工具名称
                                "arguments": item.get("arguments", "{}")  # 参数
                            }
                        }
                        tool_calls.append(tool_call)
                        print(f"      🔧 发现单个工具调用: {item.get('name')}")
                    
                    # 3. message 类型中可能也有工具调用
                    elif item_type == "message" and item.get("tool_calls"):
                        if not tool_calls:
                            tool_calls = []
                        tool_calls.extend(item["tool_calls"])
                        print(f"      🔧 message 中有工具调用: {len(item['tool_calls'])} 个")
            
            # 备用：尝试其他可能的格式
            if not output_text:
                if isinstance(result.get("output_text"), str):
                    output_text = result["output_text"]
                elif isinstance(result.get("text"), str):
                    output_text = result["text"]
                elif result.get("choices"):
                    output_text = result["choices"][0].get("message", {}).get("content")
            
            if not reasoning_content and result.get("reasoning"):
                if isinstance(result["reasoning"], dict):
                    reasoning_content = result["reasoning"].get("summary") or result["reasoning"].get("content")
            
            print(f"✅ 解析结果: 文本长度={len(output_text) if output_text else 0}, reasoning={bool(reasoning_content)}, 自定义工具={len(tool_calls) if tool_calls else 0}, web_search={len(web_search_calls)}")
            
            # === 检查是否有 function_call，如果有则执行二段式回路 ===
            function_calls = extract_function_calls(result)
            
            if function_calls:
                print(f"\n🔧 检测到 {len(function_calls)} 个 function_call，开始二段式工具回路")
                
                # 构建 tool_outputs
                tool_outputs = []
                for call in function_calls:
                    call_id = call["id"]
                    name = call["name"]
                    args_str = call.get("arguments", "{}")
                    
                    print(f"  ⚙️ 工具调用: {name} (id={call_id[:20]}...)")
                    
                    try:
                        # 解析参数
                        if isinstance(args_str, str):
                            args = json.loads(args_str) if args_str else {}
                        else:
                            args = args_str
                        
                        # 注意：这里应该调用实际的工具执行函数
                        # 目前返回占位结果，实际部署时需要集成工具执行逻辑
                        result_text = f"工具 {name} 已由后端处理（占位响应）"
                        
                        # 构建 tool_output（Responses API 格式）
                        tool_outputs.append({
                            "tool_call_id": call_id,
                            "output": result_text  # 注意：可能需要特定格式
                        })
                        
                        print(f"    ✅ 工具 {name} 执行完成")
                    except Exception as e:
                        print(f"    ❌ 工具 {name} 执行失败: {e}")
                        tool_outputs.append({
                            "tool_call_id": call_id,
                            "output": f"错误: {str(e)}"
                        })
                
                # 第二次请求：使用 previous_response_id + tool_outputs 续写
                follow_up_payload = {
                    "model": request.model,
                    "previous_response_id": result.get("id"),
                    "tool_outputs": tool_outputs,
                }
                
                # 保持相同的参数
                if request.reasoning:
                    follow_up_payload["reasoning"] = request.reasoning
                if request.text:
                    follow_up_payload["text"] = request.text
                if request.tools:
                    follow_up_payload["tools"] = payload["tools"]  # 使用已转换的工具
                
                print(f"\n🔁 续写请求: previous_response_id={result.get('id')[:20]}..., tool_outputs={len(tool_outputs)} 个")
                
                # 发送第二次请求（续写也需要足够时间）
                async with httpx.AsyncClient(timeout=300.0) as client:
                    follow_response = await client.post(
                        f"{OPENAI_BASE_URL}/responses",
                        headers=headers,
                        json=follow_up_payload
                    )
                    
                    if follow_response.status_code != 200:
                        error_detail = follow_response.text
                        print(f"❌ OpenAI API 错误（续写）: {follow_response.status_code}")
                        print(f"响应内容: {error_detail}")
                        # 如果续写失败，返回第一次的结果
                        print(f"⚠️ 续写失败，返回第一次响应")
                    else:
                        result = follow_response.json()
                        print(f"✅ 二段式工具回路完成")
                        
                        # 重新解析第二次的响应
                        output_text = None
                        reasoning_content = None
                        tool_calls = None
                        
                        if result.get("output") and isinstance(result["output"], list):
                            for item in result["output"]:
                                item_type = item.get("type")
                                
                                if item_type == "message":
                                    content_list = item.get("content", [])
                                    if isinstance(content_list, list):
                                        for content_item in content_list:
                                            if content_item.get("type") == "output_text":
                                                output_text = content_item.get("text", "")
                                                break
                                
                                elif item_type == "reasoning":
                                    summary = item.get("summary")
                                    if isinstance(summary, str):
                                        reasoning_content = summary
                                    elif isinstance(summary, list) and len(summary) > 0:
                                        reasoning_content = str(summary)
                        
                        print(f"✅ 二段式解析: 文本长度={len(output_text) if output_text else 0}")
            
            # 返回响应（包含内置工具调用信息）
            gpt5_response = GPT5Response(
                output_text=output_text,
                reasoning_content=reasoning_content,
                tool_calls=tool_calls,
                web_search_calls=web_search_calls if web_search_calls else None,
                response_id=result.get("id") or result.get("response_id"),
                usage=result.get("usage")
            )
            
            print(f"✅ GPT-5 Responses API 调用成功（最终）")
            
            return gpt5_response
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/responses/stream")
async def create_response_stream(request: GPT5Request):
    """
    流式调用 GPT-5 Responses API
    - 实时推送 reasoning 和 content
    - SSE 格式输出
    """
    print("📡 [GPT-5 Stream] 收到流式请求", flush=True)
    print(f"📨 [GPT-5 Stream] 请求参数: model={request.model}, input消息数={len(request.input)}", flush=True)
    
    def sse_event(data: dict) -> str:
        """生成 SSE 事件"""
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    
    async def generate_stream():
        print("🔄 [GPT-5 Stream] generate_stream() 开始执行", flush=True)
        yield sse_event({"type": "debug", "content": "流式生成器已启动"})
        print("✅ [GPT-5 Stream] 第一个事件已yield", flush=True)
        try:
            print("🔧 [GPT-5 Stream] 开始构建请求参数", flush=True)
            # 构建请求
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            }
            
            # 规范化消息
            print(f"📝 [GPT-5 Stream] 规范化 {len(request.input)} 条消息", flush=True)
            normalized_messages = []
            for msg in request.input:
                if isinstance(msg.content, str):
                    normalized_messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                else:
                    normalized_messages.append(msg.model_dump(exclude_none=True))
            
            # 规范化工具（与非流式端点逻辑一致）
            print(f"🔧 [GPT-5 Stream] 规范化 {len(request.tools) if request.tools else 0} 个工具", flush=True)
            normalized_tools = []
            if request.tools:
                for tool in request.tools:
                    tool_dict = tool.model_dump(exclude_none=True)
                    
                    # 内置工具（只有 type 字段）
                    if tool_dict.get("type") in ["web_search", "file_search", "code_interpreter", "image_generation"]:
                        normalized_tools.append({"type": tool_dict["type"]})
                        print(f"  ✅ 添加内置工具: {tool_dict['type']}")
                    
                    # Chat Completions 格式（嵌套在 function 下）
                    elif "function" in tool_dict and isinstance(tool_dict["function"], dict):
                        tool_name = tool_dict["function"].get("name")
                        if tool_name and tool_name != "?":
                            normalized_tools.append({
                                "type": tool_dict.get("type", "function"),
                                "name": tool_name,
                                "description": tool_dict["function"].get("description", ""),
                                "parameters": tool_dict["function"].get("parameters", {})
                            })
                            print(f"  ✅ 转换自定义工具: {tool_name}")
                    
                    # 已经是 Responses API 格式（顶层有 name）
                    elif "name" in tool_dict:
                        if tool_dict["name"] != "?":
                            normalized_tools.append(tool_dict)
                            print(f"  ✅ 保留 Responses API 格式工具: {tool_dict['name']}")
                
                print(f"✅ 总计 {len(normalized_tools)} 个工具（含内置和自定义）")
            
            payload = {
                "model": request.model,
                "input": normalized_messages,
                "reasoning": request.reasoning or {"effort": "medium"},
                "text": request.text or {"verbosity": "medium"},
                "stream": True  # 关键：开启流式
            }
            
            if normalized_tools:
                payload["tools"] = normalized_tools
                payload["tool_choice"] = request.tool_choice or "auto"
            
            if request.previous_response_id:
                payload["previous_response_id"] = request.previous_response_id
            
            print(f"📤 [GPT-5 Stream] 发送流式请求: model={request.model}, tools={len(normalized_tools)}, reasoning={payload['reasoning']}", flush=True)
            print(f"📋 [GPT-5 Stream] Payload keys: {list(payload.keys())}", flush=True)
            
            # 使用 httpx 异步客户端进行流式请求
            print("🌐 [GPT-5 Stream] 创建 httpx 客户端...", flush=True)
            async with httpx.AsyncClient(timeout=600.0) as client:
                print("📡 [GPT-5 Stream] 开始发送 POST 请求...", flush=True)
                async with client.stream(
                    "POST",
                    f"{OPENAI_BASE_URL}/responses",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_str = error_text.decode('utf-8')
                        print(f"❌ [GPT-5 Stream] 错误: {response.status_code}", flush=True)
                        print(f"❌ [GPT-5 Stream] 错误详情: {error_str}", flush=True)
                        yield sse_event({"type": "error", "error": f"OpenAI API 错误: {response.status_code}", "details": error_str})
                        yield "data: [DONE]\n\n"
                        return
                    
                    print("✅ [GPT-5 Stream] 开始接收流式响应")
                    
                    # 逐行读取 SSE
                    reasoning_buffer = ""
                    content_buffer = ""
                    line_count = 0
                    
                    async for line in response.aiter_lines():
                        line_count += 1
                        if line_count % 10 == 0:
                            print(f"📊 [GPT-5 Stream] 已读取 {line_count} 行")
                        if not line:
                            continue
                        if not line.startswith("data:"):
                            continue
                        
                        data = line[5:].strip()
                        if data == "[DONE]":
                            print("🏁 [GPT-5 Stream] 流式响应结束")
                            yield "data: [DONE]\n\n"
                            break
                        
                        try:
                            event = json.loads(data)
                            event_type = event.get("type", "")
                            
                            # 处理 reasoning 增量
                            if "reasoning" in event_type and "delta" in event:
                                delta_text = event.get("delta", "")
                                if delta_text:
                                    reasoning_buffer += delta_text
                                    yield sse_event({"type": "reasoning_stream", "content": delta_text})
                            
                            # 处理 reasoning 完成
                            elif "reasoning" in event_type and event.get("status") == "completed":
                                if reasoning_buffer:
                                    yield sse_event({"type": "reasoning_complete", "content": reasoning_buffer})
                            
                            # 处理 content 增量
                            elif "output" in event_type or "message" in event_type:
                                delta_text = event.get("delta") or event.get("text") or ""
                                if delta_text:
                                    content_buffer += delta_text
                                    yield sse_event({"type": "content", "content": delta_text})
                            
                            # 处理工具调用
                            elif "function_call" in event_type or "tool_call" in event_type:
                                yield sse_event({
                                    "type": "tool_call",
                                    "name": event.get("name"),
                                    "arguments": event.get("arguments", "")
                                })
                        
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            print(f"⚠️ [GPT-5 Stream] 解析事件失败: {e}")
                            continue
        
        except Exception as e:
            print(f"❌ [GPT-5 Stream] 流式处理错误: {e}")
            import traceback
            traceback.print_exc()
            yield sse_event({"type": "error", "error": str(e)})
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Railway 使用 PORT 环境变量，本地开发使用 8002
    port = int(os.getenv("PORT", 8002))
    
    print(f"""
    🚀 GPT-5 Responses API Service 启动中...
    
    📍 端点: http://localhost:{port}
    📖 API 文档: http://localhost:{port}/docs
    
    ✅ 功能:
    - GPT-5 Responses API 调用
    - 原生工具调用支持
    - reasoning.effort 控制
    - text.verbosity 控制
    - previous_response_id 上下文管理
    
    ⚠️  注意: 端口 8001 已被语音服务使用
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=port)

