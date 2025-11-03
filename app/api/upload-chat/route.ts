import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 配置 API Route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// 增加文件大小限制到 10MB（Vercel 限制）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // Vercel环境使用/tmp目录
    const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir) && !process.env.VERCEL) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${Date.now()}-${file.name}`;
      const filepath = path.join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        filename: filename, // 使用带时间戳的完整文件名
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: filepath, // 完整路径
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error("文件上传错误:", error);
    return NextResponse.json(
      { error: "文件上传失败", message: error.message },
      { status: 500 }
    );
  }
}




