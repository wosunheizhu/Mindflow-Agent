/**
 * 云存储适配器 - 支持 Vercel Blob 和降级方案
 */

type StorageItem = {
  url: string;
  filename: string;
  mime: string;
  expiresAt: number;
};

// 内存存储（仅作为降级方案）
const memoryStorage = new Map<string, { data: Buffer; filename: string; mime: string; createdAt: number }>();

function genToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * 上传文件到云存储
 */
export async function uploadFile(data: Buffer, filename: string, mime: string): Promise<string> {
  const token = genToken();
  
  // 方案1：尝试使用 Vercel Blob（如果已配置）
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(`downloads/${token}/${filename}`, data, {
        access: 'public',
        contentType: mime,
      });
      
      console.log('✅ 文件已上传到 Vercel Blob:', blob.url);
      return blob.url;
    } catch (error) {
      console.warn('⚠️ Vercel Blob 上传失败，使用降级方案:', error);
    }
  }
  
  // 方案2：降级到内存存储 + Base64 编码（适用于小文件）
  if (data.length < 1024 * 1024 * 2) { // 小于 2MB
    const base64 = data.toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;
    console.log('⚠️ 使用 Data URL 方案（文件较小）');
    return dataUrl;
  }
  
  // 方案3：内存存储 + token（仅适用于单实例或快速下载）
  console.warn('⚠️ 使用内存存储（可能在无服务器环境中失败）');
  memoryStorage.set(token, {
    data,
    filename,
    mime,
    createdAt: Date.now(),
  });
  
  // 30分钟后清理
  setTimeout(() => {
    memoryStorage.delete(token);
  }, 30 * 60 * 1000);
  
  return `/api/download?token=${token}`;
}

/**
 * 获取文件（仅用于内存存储方案）
 */
export async function getFile(token: string): Promise<{ data: Buffer; filename: string; mime: string } | null> {
  const item = memoryStorage.get(token);
  if (!item) return null;
  
  // 检查过期（30分钟）
  if (Date.now() - item.createdAt > 30 * 60 * 1000) {
    memoryStorage.delete(token);
    return null;
  }
  
  // 读取后删除
  memoryStorage.delete(token);
  
  return {
    data: item.data,
    filename: item.filename,
    mime: item.mime,
  };
}

/**
 * 清理过期文件
 */
export function cleanupExpiredFiles() {
  const now = Date.now();
  for (const [token, item] of memoryStorage.entries()) {
    if (now - item.createdAt > 30 * 60 * 1000) {
      memoryStorage.delete(token);
    }
  }
}

// 每10分钟清理一次
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredFiles, 10 * 60 * 1000);
}

