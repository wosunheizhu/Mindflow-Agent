import os
import json
import asyncio
import base64
import hashlib
import hmac
import time
from urllib.parse import urlencode, urlparse
from typing import AsyncGenerator, Optional
from loguru import logger
import websockets
from dotenv import load_dotenv

# 加载.env.local文件
load_dotenv('.env.local')
load_dotenv()  # 备用

class XFYunASRClient:
    """科大讯飞语音识别客户端"""
    
    def __init__(self):
        self.app_id = os.getenv("XFYUN_APPID")
        self.api_key = os.getenv("XFYUN_API_KEY") 
        self.api_secret = os.getenv("XFYUN_API_SECRET")
        self.is_warmed_up = False
        
        # 接口地址
        self.websocket_url = "wss://iat-api.xfyun.cn/v2/iat"
        
        # 默认配置
        self.language = "zh_cn"  # 中文
        self.domain = "iat"  # 日常用语
        self.accent = "mandarin"  # 普通话
        self.sample_rate = 16000  # 采样率
        
        if not all([self.app_id, self.api_key, self.api_secret]):
            logger.warning("科大讯飞ASR配置不完整，请检查环境变量")
    
    def _generate_authorization(self) -> tuple[str, str]:
        """生成鉴权参数"""
        # 解析URL
        parsed_url = urlparse(self.websocket_url)
        host = parsed_url.netloc
        path = parsed_url.path
        
        # 生成RFC1123格式的时间戳
        date = time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime())
        
        # 构建签名字符串
        signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
        
        # 使用HMAC-SHA256算法签名
        signature_sha = hmac.new(
            self.api_secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Base64编码签名
        signature = base64.b64encode(signature_sha).decode('utf-8')
        
        # 构建authorization原始字符串
        authorization_origin = (
            f'api_key="{self.api_key}", '
            f'algorithm="hmac-sha256", '
            f'headers="host date request-line", '
            f'signature="{signature}"'
        )
        
        # Base64编码authorization
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
        
        return authorization, date, host
    
    def _build_websocket_url(self) -> str:
        """构建带鉴权参数的WebSocket URL"""
        authorization, date, host = self._generate_authorization()
        
        params = {
            'authorization': authorization,
            'date': date,
            'host': host
        }
        
        return f"{self.websocket_url}?{urlencode(params)}"
    
    def _create_first_frame(self) -> str:
        """创建首帧请求数据"""
        data = {
            "common": {
                "app_id": self.app_id
            },
            "business": {
                "language": self.language,
                "domain": self.domain,
                "accent": self.accent,
                "vad_eos": 1000,  # 静默检测时间1秒，提高响应速度
                "dwa": "wpgs",  # 开启动态修正
                "ptt": 1,  # 开启标点符号
                "rlang": "zh-cn",  # 简体中文
                "vinfo": 1,  # 返回端点帧偏移值
                "nunum": 1  # 数字格式化
            },
            "data": {
                "status": 0,  # 第一帧
                "format": f"audio/L16;rate={self.sample_rate}",
                "encoding": "raw",
                "audio": ""  # 首帧不包含音频数据
            }
        }
        return json.dumps(data)
    
    def _create_audio_frame(self, audio_data: bytes, status: int = 1) -> str:
        """创建音频帧数据"""
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        data = {
            "data": {
                "status": status,  # 1: 中间帧, 2: 最后一帧
                "format": f"audio/L16;rate={self.sample_rate}",
                "encoding": "raw",
                "audio": audio_base64
            }
        }
        return json.dumps(data)
    
    async def warm_up(self):
        """ASR预热 - 建立连接测试"""
        if self.is_warmed_up:
            return
            
        if not all([self.app_id, self.api_key, self.api_secret]):
            logger.error("科大讯飞ASR配置不完整，无法预热")
            return
        
        try:
            logger.info("开始ASR预热...")
            websocket_url = self._build_websocket_url()
            logger.debug(f"ASR连接URL: {websocket_url[:100]}...")
            
            # 尝试建立WebSocket连接进行预热
            async with websockets.connect(websocket_url) as websocket:
                logger.info("ASR预热WebSocket连接成功")
                
                # 发送首帧进行握手测试
                first_frame = self._create_first_frame()
                logger.debug(f"发送首帧数据: {first_frame[:200]}...")
                await websocket.send(first_frame)
                
                try:
                    # 等待响应，但设置较短超时
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    logger.debug(f"ASR预热收到响应: {response}")
                    result = json.loads(response)
                    
                    # 科大讯飞ASR成功响应的code应该是0
                    if result.get('code') == 0:
                        self.is_warmed_up = True
                        logger.info("ASR预热完成 - 连接测试成功")
                    elif result.get('code') == 10114:  # 开始识别
                        self.is_warmed_up = True
                        logger.info("ASR预热完成 - 识别会话已建立")
                    else:
                        logger.warning(f"ASR预热连接测试失败: code={result.get('code')}, message={result.get('message')}")
                        # 即使返回非0状态码，如果连接成功也认为预热成功
                        if result.get('code') is not None:
                            self.is_warmed_up = True
                            logger.info("ASR预热完成 - 连接已建立（忽略状态码）")
                            
                except asyncio.TimeoutError:
                    # 如果连接建立成功但没有响应，也认为预热成功
                    logger.info("ASR预热完成 - 连接建立成功（无响应超时）")
                    self.is_warmed_up = True
                    
        except Exception as e:
            logger.error(f"ASR预热错误: {e}")
            # 检查是否是鉴权问题
            if "401" in str(e) or "403" in str(e):
                logger.error("ASR鉴权失败，请检查APPID、API_KEY和API_SECRET是否正确")
            elif "Invalid handshake response" in str(e):
                logger.error("ASR握手失败，可能是URL或参数问题")
    
    async def speech_to_text(self, audio_stream: AsyncGenerator[bytes, None]) -> AsyncGenerator[dict, None]:
        """语音转文字流式识别"""
        if not all([self.app_id, self.api_key, self.api_secret]):
            logger.error("科大讯飞ASR配置不完整")
            return
        
        websocket_url = self._build_websocket_url()
        
        try:
            async with websockets.connect(websocket_url) as websocket:
                logger.info("ASR WebSocket连接成功")
                
                # 发送首帧
                first_frame = self._create_first_frame()
                await websocket.send(first_frame)
                logger.debug("已发送ASR首帧")
                
                # 启动发送任务在后台运行
                send_task = asyncio.create_task(
                    self._send_audio_data(websocket, audio_stream)
                )
                
                # 直接处理接收结果
                try:
                    async for result in self._receive_results(websocket):
                        yield result
                except Exception as e:
                    logger.error(f"接收ASR结果时出错: {e}")
                    yield {"error": str(e)}
                finally:
                    # 确保发送任务完成
                    try:
                        if not send_task.done():
                            send_task.cancel()
                            try:
                                await send_task
                            except asyncio.CancelledError:
                                pass
                    except Exception as e:
                        logger.debug(f"清理发送任务时出错: {e}")
                
        except Exception as e:
            logger.error(f"ASR识别错误: {e}")
            yield {"error": str(e)}
    
    async def _send_audio_data(self, websocket, audio_stream: AsyncGenerator[bytes, None]):
        """发送音频数据"""
        try:
            frame_count = 0
            async for audio_chunk in audio_stream:
                if audio_chunk:
                    frame_count += 1
                    # 发送音频帧
                    audio_frame = self._create_audio_frame(audio_chunk, status=1)
                    await websocket.send(audio_frame)
                    logger.debug(f"已发送音频帧 #{frame_count}: {len(audio_chunk)} bytes")
                    
                    # 控制发送频率，避免过快
                    await asyncio.sleep(0.04)  # 40ms间隔
            
            # 发送结束帧
            end_frame = self._create_audio_frame(b"", status=2)
            await websocket.send(end_frame)
            logger.info("已发送ASR结束帧")
            
        except Exception as e:
            logger.error(f"发送音频数据错误: {e}")
    
    async def _receive_results(self, websocket) -> AsyncGenerator[dict, None]:
        """接收识别结果"""
        try:
            while True:
                response = await websocket.recv()
                result = json.loads(response)
                
                logger.debug(f"收到ASR响应: {result}")
                
                # 检查错误
                if result.get('code') != 0:
                    error_msg = result.get('message', 'Unknown error')
                    logger.error(f"ASR识别错误: code={result.get('code')}, message={error_msg}")
                    yield {"error": error_msg, "code": result.get('code')}
                    break
                
                # 处理识别结果
                data = result.get('data', {})
                if data:
                    # 解析识别文本
                    ws_results = data.get('result', {}).get('ws', [])
                    if ws_results:
                        text_parts = []
                        for ws in ws_results:
                            for cw in ws.get('cw', []):
                                text_parts.append(cw.get('w', ''))
                        
                        if text_parts:
                            recognized_text = ''.join(text_parts)
                            
                            yield {
                                "text": recognized_text,
                                "is_final": data.get('status') == 2,  # status=2表示最终结果
                                "confidence": ws_results[0].get('cw', [{}])[0].get('wp', 'normal') if ws_results else 'normal',
                                "raw_data": result
                            }
                
                # 检查是否结束
                if data.get('status') == 2:
                    logger.info("ASR识别完成")
                    break
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("ASR WebSocket连接已关闭")
        except Exception as e:
            logger.error(f"接收ASR结果错误: {e}")
            yield {"error": str(e)}
    
    def set_language(self, language: str):
        """设置识别语言"""
        self.language = language
        logger.info(f"ASR语言设置为: {language}")
    
    def set_domain(self, domain: str):
        """设置应用领域"""
        self.domain = domain
        logger.info(f"ASR领域设置为: {domain}")
    
    def set_sample_rate(self, sample_rate: int):
        """设置采样率"""
        if sample_rate in [8000, 16000]:
            self.sample_rate = sample_rate
            logger.info(f"ASR采样率设置为: {sample_rate}")
        else:
            logger.error("ASR采样率只支持8000或16000")