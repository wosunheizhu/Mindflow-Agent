import os
import json
import asyncio
import struct
import uuid
import websockets
from typing import AsyncGenerator, Optional
from loguru import logger
from dotenv import load_dotenv

# 加载.env.local文件
load_dotenv('.env.local')
load_dotenv()  # 备用

class DoubaoTTSClient:
    """豆包双向流式TTS客户端"""
    
    def __init__(self):
        self.app_id = os.getenv("DOUBAO_TTS_APPID")
        self.access_token = os.getenv("DOUBAO_TTS_ACCESS_TOKEN")
        self.voice_type = os.getenv("DOUBAO_TTS_VOICE_TYPE", "zh_female_meilinvyou_emo_v2_mars_bigtts")
        self.secret_key = os.getenv("DOUBAO_TTS_SECRET_KEY")
        self.speed = 1.0  # 默认语速，会被voice_server动态设置
        self.is_warmed_up = False  # 预热状态标记
        
        self.websocket_url = "wss://openspeech.bytedance.com/api/v3/tts/bidirection"
        self.resource_id = "volc.service_type.10029"  # 大模型语音合成
        
        if not all([self.app_id, self.access_token, self.secret_key]):
            logger.warning("豆包TTS配置不完整，请检查环境变量")
    
    def _create_binary_frame(self, message_type: int, event: Optional[int] = None, 
                           session_id: Optional[str] = None, payload: bytes = b'{}',
                           serialization: int = 1, compression: int = 0):
        """创建二进制协议帧"""
        # Protocol version (4-bit) + Header size (4-bit) 
        header_byte0 = 0x11  # v1 + 4-byte header
        
        # Message type (4-bit) + Message type specific flags (4-bit)
        if event is not None:
            header_byte1 = (message_type << 4) | 0x04  # with event number
        else:
            header_byte1 = (message_type << 4) | 0x00  # no event number
        
        # Serialization method (4-bit) + Compression method (4-bit)
        header_byte2 = (serialization << 4) | compression
        
        # Reserved
        header_byte3 = 0x00
        
        # 构建帧
        frame = struct.pack('!BBBB', header_byte0, header_byte1, header_byte2, header_byte3)
        
        # 添加可选字段
        if event is not None:
            frame += struct.pack('!I', event)
        
        if session_id:
            session_bytes = session_id.encode('utf-8')
            frame += struct.pack('!I', len(session_bytes))
            frame += session_bytes
        
        # 添加payload长度和内容
        frame += struct.pack('!I', len(payload))
        frame += payload
        
        return frame
    
    def _parse_binary_frame(self, data: bytes):
        """解析二进制协议帧"""
        if len(data) < 4:
            return None
        
        # 解析头部
        header_byte0, header_byte1, header_byte2, header_byte3 = struct.unpack('!BBBB', data[:4])
        
        message_type = (header_byte1 >> 4) & 0x0F
        has_event = (header_byte1 & 0x04) != 0
        serialization = (header_byte2 >> 4) & 0x0F
        compression = header_byte2 & 0x0F
        
        offset = 4
        event = None
        session_id = None
        
        # 解析可选字段
        if has_event and len(data) >= offset + 4:
            event = struct.unpack('!I', data[offset:offset+4])[0]
            offset += 4
        
        # 如果有session_id字段
        if len(data) >= offset + 8:
            try:
                session_id_len = struct.unpack('!I', data[offset:offset+4])[0]
                offset += 4
                if len(data) >= offset + session_id_len:
                    session_id = data[offset:offset+session_id_len].decode('utf-8')
                    offset += session_id_len
            except:
                pass
        
        # 解析payload
        if len(data) >= offset + 4:
            payload_len = struct.unpack('!I', data[offset:offset+4])[0]
            offset += 4
            if len(data) >= offset + payload_len:
                payload = data[offset:offset+payload_len]
                
                # 如果是JSON序列化，尝试解析
                if serialization == 1:
                    try:
                        payload = json.loads(payload.decode('utf-8'))
                    except:
                        pass
                
                return {
                    'message_type': message_type,
                    'event': event,
                    'session_id': session_id,
                    'payload': payload
                }
        
        return None
    
    async def warm_up(self):
        """TTS预热 - 建立连接测试"""
        if self.is_warmed_up:
            return
            
        if not all([self.app_id, self.access_token]):
            logger.error("豆包TTS配置不完整，无法预热")
            return
        
        try:
            logger.info("开始TTS预热...")
            connection_id = str(uuid.uuid4())
            
            headers = {
                'X-Api-App-Key': self.app_id,
                'X-Api-Access-Key': self.access_token,
                'X-Api-Resource-Id': self.resource_id,
                'X-Api-Connect-Id': connection_id
            }
            
            # 尝试建立WebSocket连接进行预热
            async with websockets.connect(self.websocket_url, extra_headers=headers) as websocket:
                logger.info(f"TTS预热WebSocket连接成功: {connection_id}")
                
                # 发送StartConnection进行握手测试
                start_conn_payload = json.dumps({}).encode('utf-8')
                start_conn_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=1,  # StartConnection
                    payload=start_conn_payload
                )
                await websocket.send(start_conn_frame)
                
                # 等待ConnectionStarted响应
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                parsed = self._parse_binary_frame(response)
                
                if parsed and parsed.get('event') == 50:
                    self.is_warmed_up = True
                    logger.info("TTS预热完成 - 连接测试成功")
                else:
                    logger.warning("TTS预热连接测试失败")
                    
        except asyncio.TimeoutError:
            logger.warning("TTS预热超时")
        except Exception as e:
            logger.error(f"TTS预热错误: {e}")
    
    async def text_to_speech(self, text: str, user_id: str = "default", emotion: str = "neutral") -> AsyncGenerator[bytes, None]:
        """文本转语音流式生成"""
        if not all([self.app_id, self.access_token]):
            logger.error("豆包TTS配置不完整")
            return
        
        connection_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        headers = {
            'X-Api-App-Key': self.app_id,
            'X-Api-Access-Key': self.access_token,
            'X-Api-Resource-Id': self.resource_id,
            'X-Api-Connect-Id': connection_id
        }
        
        try:
            async with websockets.connect(self.websocket_url, extra_headers=headers) as websocket:
                logger.info(f"豆包TTS WebSocket连接成功: {connection_id}")
                
                # 1. 发送StartConnection
                start_conn_payload = json.dumps({}).encode('utf-8')
                start_conn_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=1,  # StartConnection
                    payload=start_conn_payload
                )
                await websocket.send(start_conn_frame)
                
                # 等待ConnectionStarted响应
                response = await websocket.recv()
                parsed = self._parse_binary_frame(response)
                if not parsed or parsed.get('event') != 50:
                    logger.error("StartConnection失败")
                    return
                
                logger.info("Connection建立成功")
                
                # 2. 发送StartSession
                # 将语速转换为豆包TTS的speech_rate格式
                # 根据文档：speech_rate范围[-50,100]，100代表2.0倍速，-50代表0.5倍速，0代表1.0倍速
                # 公式：speech_rate = (倍速 - 1.0) * 100
                speech_rate = int((self.speed - 1.0) * 100)
                speech_rate = max(-50, min(100, speech_rate))  # 限制范围[-50, 100]
                logger.info(f"⚡ 语速设置: {self.speed}x → speech_rate={speech_rate}")
                
                # 构建音频参数，包含情感
                audio_params = {
                    "format": "wav",  # 使用WAV格式，更易去除句首静音
                    "sample_rate": 24000,
                    "speech_rate": speech_rate,
                    "loudness_rate": 0
                }
                
                # 如果指定了情感，添加到音频参数中
                if emotion and emotion != "neutral":
                    audio_params["emotion"] = emotion
                    logger.info(f"TTS使用情感: {emotion}")
                
                session_payload = {
                    "user": {"uid": user_id},
                    "event": 100,
                    "namespace": "BidirectionalTTS",
                    "req_params": {
                        "text": text,
                        "speaker": self.voice_type,
                        "audio_params": audio_params
                    }
                }
                
                session_payload_bytes = json.dumps(session_payload).encode('utf-8')
                start_session_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=100,  # StartSession
                    session_id=session_id,
                    payload=session_payload_bytes
                )
                await websocket.send(start_session_frame)
                
                # 等待SessionStarted响应
                response = await websocket.recv()
                parsed = self._parse_binary_frame(response)
                if not parsed or parsed.get('event') != 150:
                    logger.error("StartSession失败")
                    return
                
                logger.info("Session建立成功，开始接收音频数据")
                
                # 3. 发送TaskRequest
                task_payload = {
                    "req_params": {
                        "text": text
                    }
                }
                task_payload_bytes = json.dumps(task_payload).encode('utf-8')
                task_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=200,  # TaskRequest
                    session_id=session_id,
                    payload=task_payload_bytes
                )
                await websocket.send(task_frame)
                
                # 4. 发送FinishSession
                finish_payload = json.dumps({}).encode('utf-8')
                finish_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=102,  # FinishSession
                    session_id=session_id,
                    payload=finish_payload
                )
                await websocket.send(finish_frame)
                
                # 5. 接收音频数据
                while True:
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                        parsed = self._parse_binary_frame(response)
                        
                        if not parsed:
                            continue
                        
                        event = parsed.get('event')
                        payload = parsed.get('payload')
                        
                        if event == 352:  # TTSResponse - 音频数据
                            if isinstance(payload, bytes):
                                yield payload
                            elif isinstance(payload, dict) and 'data' in payload:
                                # payload中可能包含base64编码的音频数据
                                import base64
                                try:
                                    audio_data = base64.b64decode(payload['data'])
                                    yield audio_data
                                except:
                                    pass
                        elif event == 351:  # TTSSentenceEnd
                            logger.info("句子合成结束")
                        elif event == 152:  # SessionFinished
                            logger.info("Session结束")
                            break
                        elif event == 153:  # SessionFailed
                            logger.error(f"Session失败: {payload}")
                            break
                            
                    except asyncio.TimeoutError:
                        logger.warning("接收音频数据超时")
                        break
                    except Exception as e:
                        logger.error(f"接收音频数据错误: {e}")
                        break
                
                # 6. 发送FinishConnection
                finish_conn_payload = json.dumps({}).encode('utf-8')
                finish_conn_frame = self._create_binary_frame(
                    message_type=1,  # Full-client request
                    event=2,  # FinishConnection
                    payload=finish_conn_payload
                )
                await websocket.send(finish_conn_frame)
                
        except Exception as e:
            logger.error(f"豆包TTS连接错误: {e}")
    
    async def text_to_speech_bidirectional(self, text_generator: AsyncGenerator[str, None], 
                                           user_id: str = "default", emotion: str = "neutral") -> AsyncGenerator[bytes, None]:
        """
        真正的双向流式TTS
        接受文本生成器作为输入，边接收文本边发送给TTS，边接收音频
        参考文档：推荐将流式输出的文本直接输入该接口
        """
        if not all([self.app_id, self.access_token]):
            logger.error("豆包TTS配置不完整")
            return
        
        connection_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        headers = {
            'X-Api-App-Key': self.app_id,
            'X-Api-Access-Key': self.access_token,
            'X-Api-Resource-Id': self.resource_id,
            'X-Api-Connect-Id': connection_id
        }
        
        try:
            async with websockets.connect(self.websocket_url, extra_headers=headers) as websocket:
                logger.info(f"豆包TTS双向流式连接成功: {connection_id}")
                
                # 1. 发送StartConnection
                start_conn_payload = json.dumps({}).encode('utf-8')
                start_conn_frame = self._create_binary_frame(
                    message_type=1,
                    event=1,
                    payload=start_conn_payload
                )
                await websocket.send(start_conn_frame)
                
                # 等待ConnectionStarted响应
                response = await websocket.recv()
                parsed = self._parse_binary_frame(response)
                if not parsed or parsed.get('event') != 50:
                    logger.error("StartConnection失败")
                    return
                
                logger.info("TTS双向流式Connection建立成功")
                
                # 2. 发送StartSession（不包含完整text，让TTS自己处理切句）
                # 根据文档：speech_rate范围[-50,100]，100代表2.0倍速，-50代表0.5倍速，0代表1.0倍速
                # 公式：speech_rate = (倍速 - 1.0) * 100
                speech_rate = int((self.speed - 1.0) * 100)
                speech_rate = max(-50, min(100, speech_rate))  # 限制范围[-50, 100]
                logger.info(f"⚡ 双向流式语速: {self.speed}x → speech_rate={speech_rate}")
                
                audio_params = {
                    "format": "wav",
                    "sample_rate": 24000,
                    "speech_rate": speech_rate,
                    "loudness_rate": 0
                }
                
                if emotion and emotion != "neutral":
                    audio_params["emotion"] = emotion
                
                # 注意：StartSession不包含text，text通过TaskRequest发送
                session_payload = {
                    "user": {"uid": user_id},
                    "event": 100,
                    "namespace": "BidirectionalTTS",
                    "req_params": {
                        "speaker": self.voice_type,
                        "audio_params": audio_params
                    }
                }
                
                session_payload_bytes = json.dumps(session_payload).encode('utf-8')
                start_session_frame = self._create_binary_frame(
                    message_type=1,
                    event=100,
                    session_id=session_id,
                    payload=session_payload_bytes
                )
                await websocket.send(start_session_frame)
                
                # 等待SessionStarted响应
                response = await websocket.recv()
                parsed = self._parse_binary_frame(response)
                if not parsed or parsed.get('event') != 150:
                    logger.error("StartSession失败")
                    return
                
                logger.info("TTS双向流式Session建立成功")
                
                # 3. 创建发送任务和接收任务并发执行
                async def send_text_chunks():
                    """发送文本片段任务"""
                    import time
                    start_time = time.time()
                    chunk_count = 0
                    
                    try:
                        # 流式接收LLM输出的文本，立即发送给TTS
                        async for text_chunk in text_generator:
                            if text_chunk.strip():
                                chunk_count += 1
                                elapsed = (time.time() - start_time) * 1000
                                logger.info(f"⏱️  [{elapsed:.0f}ms] 📤 发送文本#{chunk_count}: {text_chunk}")
                                
                                # 通过TaskRequest发送文本片段
                                task_payload = {
                                    "req_params": {
                                        "text": text_chunk
                                    }
                                }
                                task_payload_bytes = json.dumps(task_payload).encode('utf-8')
                                task_frame = self._create_binary_frame(
                                    message_type=1,
                                    event=200,
                                    session_id=session_id,
                                    payload=task_payload_bytes
                                )
                                await websocket.send(task_frame)
                        
                        # 文本发送完毕，发送FinishSession
                        elapsed = (time.time() - start_time) * 1000
                        logger.info(f"⏱️  [{elapsed:.0f}ms] 📤 文本发送完毕，发送FinishSession")
                        finish_payload = json.dumps({}).encode('utf-8')
                        finish_frame = self._create_binary_frame(
                            message_type=1,
                            event=102,
                            session_id=session_id,
                            payload=finish_payload
                        )
                        await websocket.send(finish_frame)
                        
                    except Exception as e:
                        logger.error(f"发送文本错误: {e}")
                
                async def receive_audio_chunks():
                    """接收音频片段任务"""
                    import time
                    start_time = time.time()
                    audio_count = 0
                    
                    try:
                        while True:
                            response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                            parsed = self._parse_binary_frame(response)
                            
                            if not parsed:
                                continue
                            
                            event = parsed.get('event')
                            payload = parsed.get('payload')
                            elapsed = (time.time() - start_time) * 1000
                            
                            if event == 352:  # TTSResponse - 音频数据
                                audio_count += 1
                                logger.info(f"⏱️  [{elapsed:.0f}ms] 🔊 收到音频#{audio_count}: {len(payload) if isinstance(payload, bytes) else 'base64'}")
                                
                                if isinstance(payload, bytes):
                                    yield payload
                                elif isinstance(payload, dict) and 'data' in payload:
                                    import base64
                                    try:
                                        audio_data = base64.b64decode(payload['data'])
                                        yield audio_data
                                    except:
                                        pass
                            elif event == 351:  # TTSSentenceEnd
                                logger.info(f"⏱️  [{elapsed:.0f}ms] 🔊 TTS句子合成结束")
                            elif event == 152:  # SessionFinished
                                logger.info(f"⏱️  [{elapsed:.0f}ms] 🔊 TTS Session结束")
                                break
                            elif event == 153:  # SessionFailed
                                logger.error(f"TTS Session失败: {payload}")
                                break
                                
                    except asyncio.TimeoutError:
                        logger.warning("接收音频数据超时")
                    except Exception as e:
                        logger.error(f"接收音频数据错误: {e}")
                
                # 4. 并发执行发送和接收任务
                send_task = asyncio.create_task(send_text_chunks())
                
                # 边发送边接收音频
                async for audio_chunk in receive_audio_chunks():
                    yield audio_chunk
                
                # 等待发送任务完成
                await send_task
                
                # 5. 发送FinishConnection
                finish_conn_payload = json.dumps({}).encode('utf-8')
                finish_conn_frame = self._create_binary_frame(
                    message_type=1,
                    event=2,
                    payload=finish_conn_payload
                )
                await websocket.send(finish_conn_frame)
                
        except Exception as e:
            logger.error(f"豆包TTS双向流式错误: {e}")
    
    async def test_connection(self) -> bool:
        """测试TTS连接"""
        try:
            async for audio_chunk in self.text_to_speech("你好，这是一个测试。"):
                logger.info(f"收到音频数据: {len(audio_chunk)} bytes")
                return True
            return False
        except Exception as e:
            logger.error(f"TTS连接测试失败: {e}")
            return False