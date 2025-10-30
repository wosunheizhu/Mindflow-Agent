// 文件系统下载注册表（跨进程可用）
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

type DownloadMeta = {
  filename: string;
  mime: string;
  createdAt: number;
};

// Vercel环境使用/tmp，本地使用.temp-downloads
const TEMP_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.temp-downloads');

// 确保临时目录存在
async function ensureTempDir() {
  // Vercel的/tmp目录始终存在，本地环境才需要创建
  if (!process.env.VERCEL && !existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

function genToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function registerDownload(data: Buffer, filename: string, mime: string): Promise<string> {
  await ensureTempDir();
  const token = genToken();
  
  // 存储文件内容
  const dataPath = path.join(TEMP_DIR, `${token}.data`);
  await writeFile(dataPath, data);
  
  // 存储元数据
  const metaPath = path.join(TEMP_DIR, `${token}.meta.json`);
  const meta: DownloadMeta = {
    filename,
    mime,
    createdAt: Date.now(),
  };
  await writeFile(metaPath, JSON.stringify(meta));
  
  return token;
}

export async function consumeDownload(token: string): Promise<{ data: Buffer; filename: string; mime: string } | null> {
  const dataPath = path.join(TEMP_DIR, `${token}.data`);
  const metaPath = path.join(TEMP_DIR, `${token}.meta.json`);
  
  try {
    // 读取元数据
    if (!existsSync(metaPath)) return null;
    const metaContent = await readFile(metaPath, 'utf-8');
    const meta: DownloadMeta = JSON.parse(metaContent);
    
    // 过期检查（30分钟）
    if (Date.now() - meta.createdAt > 30 * 60 * 1000) {
      await cleanup(token);
      return null;
    }
    
    // 读取数据
    if (!existsSync(dataPath)) return null;
    const data = await readFile(dataPath);
    
    // 读取后立即删除
    await cleanup(token);
    
    return {
      data,
      filename: meta.filename,
      mime: meta.mime,
    };
  } catch (error) {
    return null;
  }
}

async function cleanup(token: string) {
  const dataPath = path.join(TEMP_DIR, `${token}.data`);
  const metaPath = path.join(TEMP_DIR, `${token}.meta.json`);
  
  try {
    if (existsSync(dataPath)) await unlink(dataPath);
    if (existsSync(metaPath)) await unlink(metaPath);
  } catch (e) {
    // 忽略清理错误
  }
}


