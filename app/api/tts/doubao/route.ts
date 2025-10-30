import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { text, voice = 'zh_female_sajiaonvyou_moon_bigtts' } = await req.json();

    if (!text) {
      return Response.json({ error: '缺少文本参数' }, { status: 400 });
    }

    const WebSocket = require('ws');
    const crypto = require('crypto');

    const appId = process.env.DOUBAO_TTS_APPID!;
    const accessToken = process.env.DOUBAO_TTS_ACCESS_TOKEN!;

    // WebSocket URL
    const wsUrl = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection';

    // 生成唯一ID
    const connectionId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    console.log(`🎤 开始TTS合成，音色: ${voice}, 文本长度: ${text.length}`);

    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl, {
        headers: {
          'X-Api-App-Key': appId,
          'X-Api-Access-Key': accessToken,
          'X-Api-Resource-Id': 'seed-tts-1.0',
          'X-Api-Connect-Id': connectionId,
        }
      });

      const audioChunks: Buffer[] = [];
      let isConnected = false;
      let isSessionStarted = false;

      ws.on('open', () => {
        console.log('🔌 WebSocket连接成功');

        // 1. 发送 StartConnection (Event 1)
        const startConnPayload = Buffer.from('{}');
        const startConnMsg = createBinaryFrame(1, 1, null, startConnPayload);
        console.log('📤 发送StartConnection');
        ws.send(startConnMsg);
      });

      ws.on('message', (data: Buffer) => {
        try {
          const parsed = parseBinaryFrame(data);
          if (!parsed) return;
          
          console.log(`📨 收到事件: ${parsed.event}, 类型: ${parsed.messageType}`);
          
          // 检查是否是错误消息 (0xF)
          if (parsed.messageType === 0xF) {
            console.error('❌ 收到错误消息:', parsed.payload);
            ws.close();
            return;
          }
          
          if (parsed.event === 50) {
            // ConnectionStarted
            isConnected = true;
            console.log('✅ Connection已建立');

            // 2. 发送 StartSession (Event 100) - 根据Python实现
            const sessionMeta = {
              user: { uid: '12345' },
              event: 100, // 添加event字段
              namespace: 'BidirectionalTTS',
              req_params: {
                text: text,
                speaker: voice,
                audio_params: {
                  format: 'mp3',
                  sample_rate: 24000,
                  bit_rate: 128000
                }
              }
            };

            const sessionPayload = Buffer.from(JSON.stringify(sessionMeta));
            const startSessionMsg = createBinaryFrame(1, 100, sessionId, sessionPayload);
            console.log(`📤 发送StartSession, 音色: ${voice}, 文本: "${text.substring(0, 20)}..."`);
            ws.send(startSessionMsg);
            
          } else if (parsed.event === 150) {
            // SessionStarted
            isSessionStarted = true;
            console.log('✅ Session已启动，发送TaskRequest和FinishSession');
            
            // 3. 发送 TaskRequest (Event 200) - 根据Python实现
            const taskPayload = Buffer.from(JSON.stringify({
              req_params: {
                text: text
              }
            }));
            const taskRequestMsg = createBinaryFrame(1, 200, sessionId, taskPayload);
            ws.send(taskRequestMsg);
            console.log('📤 已发送TaskRequest');
            
            // 4. 立即发送 FinishSession (Event 102)
            const finishPayload = Buffer.from('{}');
            const finishSessionMsg = createBinaryFrame(1, 102, sessionId, finishPayload);
            ws.send(finishSessionMsg);
            console.log('📤 已发送FinishSession');
            
          } else if (parsed.event === 352) {
            // TTSResponse - 音频数据
            // payload是Buffer类型，直接就是音频数据
            if (Buffer.isBuffer(parsed.payload) && parsed.payload.length > 0) {
              audioChunks.push(parsed.payload);
              console.log(`🎵 收到音频块: ${parsed.payload.length} 字节`);
            }
            
          } else if (parsed.event === 152) {
            // SessionFinished
            console.log('✅ Session完成，发送FinishConnection');

            // 4. 发送 FinishConnection (Event 2)
            const finishConnPayload = Buffer.from('{}');
            const finishConnMsg = createBinaryFrame(1, 2, null, finishConnPayload);
            ws.send(finishConnMsg);
            
          } else if (parsed.event === 52) {
            // ConnectionFinished
            console.log('✅ Connection关闭');
            ws.close();
          }
        } catch (error) {
          console.error('处理消息错误:', error);
        }
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket连接关闭，共收到 ${audioChunks.length} 个音频块`);

        // 合并音频数据
        const audioBuffer = Buffer.concat(audioChunks);

        if (audioBuffer.length > 0) {
          console.log(`✅ 音频合成成功: ${audioBuffer.length} 字节`);
          resolve(Response.json({
            success: true,
            audioBase64: audioBuffer.toString('base64'),
            audioSize: audioBuffer.length,
            voice: voice,
            text: text
          }));
        } else {
          resolve(Response.json({
            success: false,
            error: '未收到音频数据'
          }, { status: 500 }));
        }
      });

      ws.on('error', (error: Error) => {
        console.error('❌ WebSocket错误:', error);
        ws.close();
        resolve(Response.json({
          success: false,
          error: error.message
        }, { status: 500 }));
      });

      // 超时处理
      setTimeout(() => {
        if (ws.readyState === 1) { // OPEN
          console.log('⏰ TTS请求超时');
          ws.close();
          resolve(Response.json({
            success: false,
            error: 'TTS请求超时'
          }, { status: 408 }));
        }
      }, 30000);
    });

  } catch (error: any) {
    console.error('豆包TTS错误:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * 创建二进制协议帧（基于Python实现）
 */
function createBinaryFrame(
  messageType: number,
  event: number | null = null,
  sessionId: string | null = null,
  payload: Buffer = Buffer.from('{}'),
  serialization: number = 1,
  compression: number = 0
): Buffer {
  // Header byte 0: protocol_version (4-bit) + header_size (4-bit)
  const headerByte0 = 0x11; // v1 + 4-byte header
  
  // Header byte 1: message_type (4-bit) + flags (4-bit)
  const headerByte1 = event !== null 
    ? (messageType << 4) | 0x04  // with event number
    : (messageType << 4) | 0x00; // no event number
  
  // Header byte 2: serialization (4-bit) + compression (4-bit)
  const headerByte2 = (serialization << 4) | compression;
  
  // Header byte 3: reserved
  const headerByte3 = 0x00;
  
  // 构建帧
  let frame = Buffer.from([headerByte0, headerByte1, headerByte2, headerByte3]);
  
  // 添加event (4 bytes, big-endian)
  if (event !== null) {
    const eventBuffer = Buffer.alloc(4);
    eventBuffer.writeUInt32BE(event, 0);
    frame = Buffer.concat([frame, eventBuffer]);
  }
  
  // 添加session_id
  if (sessionId) {
    const sessionIdBuffer = Buffer.from(sessionId, 'utf-8');
    const sessionIdSizeBuffer = Buffer.alloc(4);
    sessionIdSizeBuffer.writeUInt32BE(sessionIdBuffer.length, 0);
    frame = Buffer.concat([frame, sessionIdSizeBuffer, sessionIdBuffer]);
  }
  
  // 添加payload长度和内容
  const payloadSizeBuffer = Buffer.alloc(4);
  payloadSizeBuffer.writeUInt32BE(payload.length, 0);
  frame = Buffer.concat([frame, payloadSizeBuffer, payload]);
  
  return frame;
}

/**
 * 解析二进制协议帧（基于Python实现）
 */
function parseBinaryFrame(data: Buffer): any {
  if (data.length < 4) {
    return null;
  }
  
  // 解析header
  const headerByte1 = data[1];
  const messageType = (headerByte1 >> 4) & 0x0F;
  const hasEvent = (headerByte1 & 0x04) !== 0;
  const serialization = (data[2] >> 4) & 0x0F;
  const compression = data[2] & 0x0F;
  
  let offset = 4;
  let event = null;
  let sessionId = null;
  let payload: any = null;
  
  // 解析event
  if (hasEvent && data.length >= offset + 4) {
    event = data.readUInt32BE(offset);
    offset += 4;
  }
  
  // 解析session_id
  if (data.length >= offset + 4) {
    try {
      const sessionIdLen = data.readUInt32BE(offset);
      offset += 4;
      if (data.length >= offset + sessionIdLen) {
        sessionId = data.slice(offset, offset + sessionIdLen).toString('utf-8');
        offset += sessionIdLen;
      }
    } catch (e) {
      // session_id可选
    }
  }
  
  // 解析payload
  if (data.length >= offset + 4) {
    const payloadLen = data.readUInt32BE(offset);
    offset += 4;
    if (data.length >= offset + payloadLen) {
      payload = data.slice(offset, offset + payloadLen);
      
      // 如果是JSON序列化，尝试解析
      if (serialization === 1) {
        try {
          payload = JSON.parse(payload.toString('utf-8'));
        } catch (e) {
          // 保持为Buffer
        }
      }
    }
  }
  
  return {
    messageType,
    event,
    sessionId,
    payload
  };
}

