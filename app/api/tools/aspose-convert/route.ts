import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall } from '@/lib/tools-complete';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;
    
    if (!file || !format) {
      return NextResponse.json({
        error: '参数错误',
        message: '必须提供文件和目标格式'
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
    const result = await executeToolCall('convert_document', {
      input_file: file.name,
      output_format: format,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      error: '文档转换失败',
      message: error.message
    }, { status: 500 });
  }
}

