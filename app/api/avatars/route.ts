import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    
    // 检查文件夹是否存在
    if (!fs.existsSync(avatarsDir)) {
      return NextResponse.json({ lan: [], yuan: [] });
    }
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    // 读取lan文件夹
    const lanDir = path.join(avatarsDir, 'lan');
    let lanImages: string[] = [];
    if (fs.existsSync(lanDir)) {
      const lanFiles = fs.readdirSync(lanDir);
      lanImages = lanFiles
        .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => `lan/${file}`);
    }
    
    // 读取yuan文件夹
    const yuanDir = path.join(avatarsDir, 'yuan');
    let yuanImages: string[] = [];
    if (fs.existsSync(yuanDir)) {
      const yuanFiles = fs.readdirSync(yuanDir);
      yuanImages = yuanFiles
        .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => `yuan/${file}`);
    }
    
    return NextResponse.json({ lan: lanImages, yuan: yuanImages });
  } catch (error) {
    console.error('读取头像文件夹错误:', error);
    return NextResponse.json({ lan: [], yuan: [] });
  }
}

