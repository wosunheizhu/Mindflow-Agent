import { NextRequest } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * 科大讯飞ASR - 语音识别
 * 基于xfyun_asr_client.py实现
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      return Response.json({ error: '缺少音频数据' }, { status: 400 });
    }

    const appId = process.env.XFYUN_APPID!;
    const apiKey = process.env.XFYUN_API_KEY!;
    const apiSecret = process.env.XFYUN_API_SECRET!;

    // 生成鉴权参数
    const { authorization, date, host } = generateAuthorization(apiKey, apiSecret);
    
    // 构建WebSocket URL
    const wsUrl = buildWebSocketUrl(authorization, date, host);
    
    console.log('🎙️ 开始ASR识别...');

    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);

    return new Promise((resolve) => {
      let recognizedText = '';

      ws.on('open', () => {
        console.log('🔌 讯飞ASR WebSocket连接成功');

        // 发送首帧
        const firstFrame = {
          common: {
            app_id: appId
          },
          business: {
            language: 'zh_cn',
            domain: 'iat',
            accent: 'mandarin',
            vad_eos: 1000,
            dwa: 'wpgs',
            ptt: 1
          },
          data: {
            status: 0,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: ''
          }
        };

        ws.send(JSON.stringify(firstFrame));
        console.log('📤 已发送首帧');

        // 发送音频数据帧
        const audioFrame = {
          data: {
            status: 2, // 最后一帧
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: audioBase64
          }
        };

        setTimeout(() => {
          ws.send(JSON.stringify(audioFrame));
          console.log('📤 已发送音频数据');
        }, 40);
      });

      ws.on('message', (data: string) => {
        try {
          const result = JSON.parse(data);
          console.log('📨 收到ASR响应:', result.code);

          if (result.code !== 0) {
            console.error('ASR错误:', result.message);
            ws.close();
            resolve(Response.json({
              success: false,
              error: result.message,
              code: result.code
            }, { status: 500 }));
            return;
          }

          // 解析识别结果
          const wsResults = result.data?.result?.ws || [];
          if (wsResults.length > 0) {
            const textParts: string[] = [];
            for (const ws of wsResults) {
              for (const cw of ws.cw || []) {
                textParts.push(cw.w || '');
              }
            }
            recognizedText += textParts.join('');
          }

          // 检查是否结束
          if (result.data?.status === 2) {
            console.log('✅ ASR识别完成:', recognizedText);
            ws.close();
            resolve(Response.json({
              success: true,
              text: recognizedText,
              isFinal: true
            }));
          }
        } catch (error: any) {
          console.error('解析ASR响应错误:', error);
        }
      });

      ws.on('error', (error: Error) => {
        console.error('❌ ASR WebSocket错误:', error);
        resolve(Response.json({
          success: false,
          error: error.message
        }, { status: 500 }));
      });

      ws.on('close', () => {
        console.log('🔌 ASR WebSocket关闭');
        if (recognizedText) {
          resolve(Response.json({
            success: true,
            text: recognizedText,
            isFinal: true
          }));
        }
      });

      // 超时处理
      setTimeout(() => {
        if (ws.readyState === 1) {
          console.log('⏰ ASR请求超时');
          ws.close();
          resolve(Response.json({
            success: false,
            error: 'ASR请求超时'
          }, { status: 408 }));
        }
      }, 10000);
    });

  } catch (error: any) {
    console.error('讯飞ASR错误:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * 生成鉴权参数（基于Python实现）
 */
function generateAuthorization(apiKey: string, apiSecret: string) {
  const url = 'wss://iat-api.xfyun.cn/v2/iat';
  const urlObj = new URL(url);
  const host = urlObj.host;
  const path = urlObj.pathname;

  // 生成RFC1123格式的时间戳
  const date = new Date().toUTCString();

  // 构建签名字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 使用HMAC-SHA256算法签名
  const signatureSha = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest();

  // Base64编码签名
  const signature = signatureSha.toString('base64');

  // 构建authorization原始字符串
  const authorizationOrigin = 
    `api_key="${apiKey}", ` +
    `algorithm="hmac-sha256", ` +
    `headers="host date request-line", ` +
    `signature="${signature}"`;

  // Base64编码authorization
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  return { authorization, date, host };
}

/**
 * 构建带鉴权参数的WebSocket URL
 */
function buildWebSocketUrl(authorization: string, date: string, host: string): string {
  const baseUrl = 'wss://iat-api.xfyun.cn/v2/iat';
  const params = new URLSearchParams({
    authorization,
    date,
    host
  });
  
  return `${baseUrl}?${params.toString()}`;
}

