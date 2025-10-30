import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, voice = 'zh_female_sajiaonvyou_moon_bigtts' } = await req.json();

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`💬 数字人闲聊请求 [${voice}]: ${message}`);

    // 调用 Python 双向流式闲聊服务（SSE流式）
    const response = await fetch('http://localhost:8001/api/avatar-chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        voice: voice
      })
    });

    if (!response.ok) {
      throw new Error('Python闲聊服务调用失败');
    }

    // 直接转发Python的SSE流
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('数字人闲聊错误:', error);
    return new Response(JSON.stringify({
      error: error.message || '处理失败',
      success: false
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

