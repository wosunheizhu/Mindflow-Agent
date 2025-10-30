import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall } from '@/lib/tools-complete';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const page = formData.get('page') as string;
    
    if (!file) {
      return NextResponse.json({
        error: '参数错误',
        message: '必须提供 PDF 文件'
      }, { status: 400 });
    }
    
    // 保存上传的文件到 uploads 目录
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(uploadsDir, file.name);
    fs.writeFileSync(filepath, buffer);
    
    // 调用工具
    const result = await executeToolCall('extract_pdf_text', {
      filename: file.name,
      page_number: page ? parseInt(page) : undefined,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      error: 'PDF 文本提取失败',
      message: error.message
    }, { status: 500 });
  }
}

