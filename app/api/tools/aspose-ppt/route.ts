import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall } from '@/lib/tools-complete';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { title, slides } = await req.json();
    
    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({
        error: '参数错误',
        message: '必须提供 slides 数组'
      }, { status: 400 });
    }
    
    // 生成文件名
    const filename = title ? title.replace(/[^\w\u4e00-\u9fa5]/g, '_') : `presentation_${Date.now()}`;
    
    // 调用工具
    const result = await executeToolCall('create_presentation', {
      filename,
      title,
      slides
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      error: 'PPT 生成失败',
      message: error.message
    }, { status: 500 });
  }
}



