import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall } from '@/lib/tools-complete';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string || 'auto';
    
    if (!file) {
      return NextResponse.json({
        error: '参数错误',
        message: '必须提供图片文件'
      }, { status: 400 });
    }
    
    // 保存上传的文件到 uploads 目录
    const fs = require('fs');
    const path = require('path');
    // Vercel环境使用/tmp目录
    const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir) && !process.env.VERCEL) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(uploadsDir, file.name);
    fs.writeFileSync(filepath, buffer);
    
    // 调用工具
    const result = await executeToolCall('ocr_image', {
      filename: file.name,
      language: language,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      error: 'OCR 识别失败',
      message: error.message
    }, { status: 500 });
  }
}

