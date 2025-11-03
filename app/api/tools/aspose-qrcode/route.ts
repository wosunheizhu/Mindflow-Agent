import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall } from '@/lib/tools-complete';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { text, size } = await req.json();
    
    if (!text) {
      return NextResponse.json({
        error: '参数错误',
        message: '必须提供要编码的文本或链接'
      }, { status: 400 });
    }
    
    // 生成文件名
    const filename = `qrcode_${Date.now()}`;
    
    // 调用工具
    const result = await executeToolCall('generate_qrcode', {
      text,
      filename,
      size: size || 300,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      error: '二维码生成失败',
      message: error.message
    }, { status: 500 });
  }
}



