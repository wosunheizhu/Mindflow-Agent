import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({
        ok: false,
        error: '请提供图片描述'
      }, { status: 400 });
    }
    
    // 检查 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        error: '未配置 OpenAI API Key',
        note: '请在 .env.local 中设置 OPENAI_API_KEY'
      }, { status: 500 });
    }
    
    // 调用 OpenAI DALL-E 3 API
    const OpenAI = require('openai').default;
    const openai = new OpenAI({ apiKey });
    
    console.log(`🎨 生成图片: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size as any,
      quality: 'standard',
      response_format: 'url',
    });
    
    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;
    
    console.log(`✅ 图片生成成功: ${imageUrl}`);
    
    return NextResponse.json({
      ok: true,
      image_url: imageUrl,
      prompt,
      revised_prompt: revisedPrompt,
      size,
      model: 'dall-e-3',
      note: '✅ 使用 DALL-E 3 生成',
      tip: '图片链接有效期约1小时，请及时保存'
    });
    
  } catch (error: any) {
    console.error('图片生成错误:', error);
    
    return NextResponse.json({
      ok: false,
      error: '图片生成失败',
      message: error.message,
      details: error.response?.data || error.toString()
    }, { status: 500 });
  }
}

