#!/usr/bin/env python3
"""
语音服务后端 - FastAPI
提供ASR（语音识别）和TTS（语音合成）API
"""

import os
import base64
import asyncio
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from loguru import logger
from dotenv import load_dotenv

# 加载.env.local文件（Next.js使用的环境变量文件）
load_dotenv('.env.local')
load_dotenv()  # 备用

# 导入已有的客户端
from doubao_tts_client import DoubaoTTSClient
from xfyun_asr_client import XFYunASRClient
from llm_tts_stream import LLMTTSStreamer

app = FastAPI(title="语音服务API", version="1.0.0")

# 配置CORS - 允许所有域名（适用于公共 API）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名
    allow_credentials=False,  # 允许所有域名时必须设为 False
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化客户端
tts_client = DoubaoTTSClient()
asr_client = XFYunASRClient()

# 音色对应的语速配置
VOICE_SPEED_CONFIG = {
    'zh_female_sajiaonvyou_moon_bigtts': 1.2,  # 小岚 1.2倍速
    'zh_male_shaonianzixin_moon_bigtts': 1.2,  # 小远 1.2倍速
}

# 请求模型
class TTSRequest(BaseModel):
    text: str
    voice: str = "zh_female_sajiaonvyou_moon_bigtts"

class ASRRequest(BaseModel):
    audioBase64: str

class LLMTTSRequest(BaseModel):
    agentContent: str
    voice: str = "zh_female_sajiaonvyou_moon_bigtts"

class PlanningRequest(BaseModel):
    userQuestion: str
    voice: str = "zh_female_sajiaonvyou_moon_bigtts"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    voice: str = "zh_female_sajiaonvyou_moon_bigtts"
    history: list[ChatMessage] = []
    agent_working: bool = False  # Agentic AI工作状态
    deep_thinking: bool = False  # 深度思考模式
    uploaded_files: list[str] = []  # 上传的文件路径

@app.on_event("startup")
async def startup_event():
    """启动时预热"""
    logger.info("🚀 语音服务启动中...")
    
    # 预热TTS
    try:
        await tts_client.warm_up()
        logger.info("✅ TTS预热完成")
    except Exception as e:
        logger.error(f"TTS预热失败: {e}")
    
    # 预热ASR
    try:
        await asr_client.warm_up()
        logger.info("✅ ASR预热完成")
    except Exception as e:
        logger.error(f"ASR预热失败: {e}")
    
    # 预热LLM-TTS双向流式（使用默认音色）
    try:
        streamer = LLMTTSStreamer('zh_female_sajiaonvyou_moon_bigtts')
        await streamer.warm_up()
        logger.info("✅ LLM-TTS双向流式预热完成")
    except Exception as e:
        logger.error(f"LLM-TTS预热失败: {e}")
    
    logger.info("🎉 语音服务启动完成")

@app.get("/")
async def root():
    return {
        "service": "语音服务API",
        "version": "1.0.0",
        "endpoints": {
            "tts": "/api/tts",
            "asr": "/api/asr",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "tts_ready": tts_client.is_warmed_up,
        "asr_ready": asr_client.is_warmed_up
    }

@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """文本转语音"""
    try:
        logger.info(f"🎤 TTS请求: 音色={request.voice}, 文本长度={len(request.text)}")
        
        # 设置音色和语速
        tts_client.voice_type = request.voice
        tts_client.speed = VOICE_SPEED_CONFIG.get(request.voice, 1.0)
        logger.info(f"⚡ 设置语速: {tts_client.speed}x")
        
        # 收集音频数据
        audio_chunks = []
        async for audio_chunk in tts_client.text_to_speech(request.text):
            audio_chunks.append(audio_chunk)
        
        if not audio_chunks:
            raise HTTPException(status_code=500, detail="未生成音频数据")
        
        # 合并音频
        audio_data = b''.join(audio_chunks)
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        logger.info(f"✅ TTS成功: {len(audio_data)} 字节")
        
        return {
            "success": True,
            "audioBase64": audio_base64,
            "audioSize": len(audio_data),
            "voice": request.voice,
            "text": request.text
        }
        
    except Exception as e:
        logger.error(f"TTS错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/asr")
async def speech_to_text(request: ASRRequest):
    """语音转文字 - 支持WebM格式自动转换"""
    try:
        logger.info(f"🎙️ ASR请求: 音频长度={len(request.audioBase64)}")
        
        # 解码音频数据
        audio_data = base64.b64decode(request.audioBase64)
        logger.info(f"解码后音频大小: {len(audio_data)} bytes")
        
        # 检测音频格式并转换为 PCM
        import io
        import tempfile
        
        # 使用 pydub 进行格式转换
        try:
            from pydub import AudioSegment
            
            # 从bytes创建AudioSegment
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # 转换为 16kHz 单声道 PCM
            audio_segment = audio_segment.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            
            # 导出为 raw PCM
            pcm_data = audio_segment.raw_data
            logger.info(f"✅ 音频转换成功: {len(pcm_data)} bytes PCM @ 16kHz")
            
        except ImportError:
            # 如果没有安装 pydub，尝试简单处理
            logger.warning("未安装 pydub，尝试直接使用音频数据")
            pcm_data = audio_data
        except Exception as e:
            logger.error(f"音频转换失败: {e}")
            # 降级方案：直接使用原始数据
            pcm_data = audio_data
        
        # 创建音频流生成器
        async def audio_generator():
            # 分块发送音频数据
            chunk_size = 1280  # 40ms @ 16kHz (16000 * 2 bytes * 0.04)
            for i in range(0, len(pcm_data), chunk_size):
                chunk = pcm_data[i:i + chunk_size]
                if len(chunk) > 0:
                    yield chunk
                    await asyncio.sleep(0.04)  # 40ms间隔
        
        # 识别语音
        recognized_text = ""
        async for result in asr_client.speech_to_text(audio_generator()):
            logger.debug(f"ASR结果: {result}")
            
            if result.get('error'):
                error_msg = result['error']
                logger.error(f"ASR识别错误: {error_msg}")
                raise HTTPException(status_code=500, detail=f"ASR识别失败: {error_msg}")
            
            if result.get('text'):
                recognized_text = result['text']
                logger.info(f"识别到文本: {recognized_text}")
            
            if result.get('is_final'):
                logger.info("ASR识别完成（最终结果）")
                break
        
        if not recognized_text:
            logger.warning("ASR未识别到任何文本")
            recognized_text = ""
        
        logger.info(f"✅ ASR成功: {recognized_text}")
        
        return {
            "success": True,
            "text": recognized_text,
            "isFinal": True
        }
        
    except Exception as e:
        logger.error(f"ASR错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/avatar-planning")
async def avatar_planning(request: PlanningRequest):
    """数字人第一次回答：任务计划"""
    try:
        logger.info(f"📋 数字人计划: 音色={request.voice}, 问题={request.userQuestion[:30]}...")
        
        # 创建流式处理器并设置语速
        streamer = LLMTTSStreamer(request.voice)
        streamer.tts_client.speed = VOICE_SPEED_CONFIG.get(request.voice, 1.0)
        logger.info(f"⚡ 设置语速: {streamer.tts_client.speed}x")
        
        # 生成任务计划
        planning_text = ""
        async for text_chunk in streamer.generate_planning_stream(request.userQuestion):
            planning_text += text_chunk
        
        logger.info(f"💭 计划文本: {planning_text}")
        
        # 合成语音
        audio_chunks = []
        async for audio_chunk in streamer.tts_client.text_to_speech(planning_text):
            audio_chunks.append(audio_chunk)
        
        if audio_chunks:
            audio_data = b''.join(audio_chunks)
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            logger.info(f"✅ 任务计划成功: {len(audio_data)} 字节")
            
            return {
                "success": True,
                "audioBase64": audio_base64,
                "audioSize": len(audio_data),
                "planningText": planning_text,
                "voice": request.voice
            }
        else:
            raise HTTPException(status_code=500, detail="未生成音频")
        
    except Exception as e:
        logger.error(f"任务计划错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm-tts-stream")
async def llm_tts_bidirectional(request: LLMTTSRequest):
    """LLM-TTS双向流式：生成总结并实时合成语音（第二次回答）"""
    try:
        logger.info(f"🔄 LLM-TTS双向流式请求: 音色={request.voice}, 内容长度={len(request.agentContent)}")
        
        # 创建流式处理器并设置语速
        streamer = LLMTTSStreamer(request.voice)
        streamer.tts_client.speed = VOICE_SPEED_CONFIG.get(request.voice, 1.0)
        logger.info(f"⚡ 设置语速: {streamer.tts_client.speed}x")
        
        # 生成总结并合成音频
        result = await streamer.generate_and_speak(request.agentContent)
        
        if result["success"]:
            audio_base64 = base64.b64encode(result["audio_data"]).decode('utf-8')
            
            logger.info(f"✅ LLM-TTS成功: {result['audio_size']} 字节, 总结: {result.get('summary_text', '')[:50]}...")
            
            return {
                "success": True,
                "audioBase64": audio_base64,
                "audioSize": result["audio_size"],
                "summaryText": result.get("summary_text", ""),  # 返回总结文本
                "voice": request.voice
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "生成失败"))
        
    except Exception as e:
        logger.error(f"LLM-TTS错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/avatar-chat-stream")
async def avatar_chat_bidirectional(request: ChatRequest):
    """数字人闲聊双向流式：LLM生成回复并实时合成语音（SSE流式返回）"""
    
    async def generate_stream():
        """SSE流式生成器"""
        try:
            logger.info(f"💬 数字员工闲聊: 音色={request.voice}, 消息={request.message[:30]}..., 历史={len(request.history)}条, Agent工作={request.agent_working}, 深度思考={request.deep_thinking}, 文件={len(request.uploaded_files)}个")
            
            # 创建流式处理器并设置语速
            streamer = LLMTTSStreamer(request.voice)
            streamer.tts_client.speed = VOICE_SPEED_CONFIG.get(request.voice, 1.0)
            logger.info(f"⚡ 设置语速: {streamer.tts_client.speed}x")
            
            # 转换历史消息格式
            history_messages = [{"role": msg.role, "content": msg.content} for msg in request.history]
            logger.info(f"🔄 [后端] 转换后历史: {len(history_messages)}条")
            if history_messages:
                for i, msg in enumerate(history_messages[:2]):  # 打印前2条
                    logger.info(f"  [后端] [{i}] {msg['role']}: {msg['content'][:50]}...")
            
            # 处理上传的文件（支持图片多模态和文本文件阅读）
            message_with_files = request.message
            file_info_list = []  # 用于传递给 LLM 的文件信息
            
            if request.uploaded_files:
                import os
                import base64
                import mimetypes
                
                for filename in request.uploaded_files:
                    try:
                        # 构建文件路径
                        file_path = os.path.join('uploads', filename)
                        
                        # 判断文件类型
                        mime_type, _ = mimetypes.guess_type(filename)
                        mime_type = mime_type or 'application/octet-stream'
                        
                        # 图片文件：转为 base64 Data URL（豆包多模态支持）
                        if mime_type.startswith('image/'):
                            logger.info(f"🖼️ 处理图片文件: {filename}")
                            with open(file_path, 'rb') as f:
                                img_data = f.read()
                                b64_data = base64.b64encode(img_data).decode('utf-8')
                                data_url = f"data:{mime_type};base64,{b64_data}"
                                
                                file_info_list.append({
                                    "name": filename,
                                    "type": mime_type,
                                    "url": data_url
                                })
                                logger.info(f"✅ 图片转换为 base64: {filename} ({len(b64_data)} chars)")
                        
                        # 文本文件：读取内容添加到消息
                        elif filename.lower().endswith(('.txt', '.md')):
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                                message_with_files += f"\n\n--- 文件 {filename} 内容 ---\n{content}\n--- 文件结束 ---"
                                logger.info(f"📄 读取文本文件: {filename} ({len(content)} chars)")
                        
                        # PDF 文件
                        elif filename.lower().endswith('.pdf'):
                            try:
                                import PyPDF2
                                with open(file_path, 'rb') as f:
                                    pdf_reader = PyPDF2.PdfReader(f)
                                    content = ""
                                    for page in pdf_reader.pages:
                                        content += page.extract_text()
                                    message_with_files += f"\n\n--- PDF {filename} 内容 ---\n{content}\n--- 文件结束 ---"
                                    logger.info(f"📑 读取PDF文件: {filename}")
                            except Exception as e:
                                logger.warning(f"PDF读取失败: {e}")
                                message_with_files += f"\n\n[PDF文件 {filename}，无法读取]"
                        
                        else:
                            message_with_files += f"\n\n[附件: {filename}]"
                        
                    except Exception as e:
                        logger.error(f"处理文件 {filename} 失败: {e}")
                        message_with_files += f"\n\n[文件 {filename} 处理失败]"
                
                logger.info(f"📎 文件处理完成：{len(file_info_list)} 个图片，文本已添加到消息")
            
            # 双向流式处理（传递文件信息以支持多模态）
            async for event in streamer.chat_bidirectional_yield(
                message_with_files, 
                history_messages, 
                request.agent_working, 
                request.deep_thinking,
                uploaded_files=file_info_list if file_info_list else None
            ):
                logger.info(f"📬 [voice_server] 收到事件类型: {event['type']}")
                
                if event["type"] == "text":
                    # 流式返回文本片段
                    logger.info(f"📝 [voice_server] 转发 text 事件: {event['content'][:30]}...")
                    yield f"data: {json.dumps({'type': 'text', 'content': event['content']})}\n\n"
                
                elif event["type"] == "reasoning":
                    # 流式返回推理内容
                    logger.info(f"🧠 [voice_server] 转发 reasoning 事件: {event['content'][:50]}...")
                    reasoning_payload = json.dumps({'type': 'reasoning', 'content': event['content']})
                    logger.info(f"📤 [voice_server] SSE数据: {reasoning_payload[:100]}...")
                    yield f"data: {reasoning_payload}\n\n"
                    logger.info(f"✅ [voice_server] reasoning 事件已发送")
                    
                elif event["type"] == "audio":
                    # 流式返回音频片段（Base64编码，携带顺序信息）
                    audio_base64 = base64.b64encode(event["data"]).decode('utf-8')
                    payload = {
                        'type': 'audio',
                        'data': audio_base64
                    }
                    if 'order' in event:
                        payload['order'] = event['order']
                    if 'total' in event:
                        payload['total'] = event['total']
                    yield f"data: {json.dumps(payload)}\n\n"
                    
                elif event["type"] == "done":
                    # 完成标记
                    logger.info(f"✅ 闲聊完成: {event.get('full_text', '')[:50]}...")
                    yield f"data: {json.dumps({'type': 'done', 'full_text': event.get('full_text', '')})}\n\n"
                    
                elif event["type"] == "error":
                    # 错误
                    yield f"data: {json.dumps({'type': 'error', 'error': event.get('error', '未知错误')})}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"数字人闲聊流式错误: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # 从环境变量获取端口，Railway 等平台会设置 PORT
    port = int(os.environ.get("PORT", 8001))
    
    logger.info(f"🚀 启动语音服务，端口: {port}")
    
    # 运行服务器
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

