import { NextRequest } from "next/server";
import { consumeDownload } from "../../../lib/download-registry";
import { getFile } from "../../../lib/blob-storage";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  
  // 先尝试新的 blob-storage
  let item = await getFile(token);
  
  // 降级到旧的 download-registry（兼容性）
  if (!item) {
    item = await consumeDownload(token);
  }
  
  if (!item) {
    return new Response('Invalid or expired token', { status: 404 });
  }

  return new Response(Buffer.isBuffer(item.data) ? new Uint8Array(item.data) : item.data, {
    status: 200,
    headers: {
      'Content-Type': item.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
      'Cache-Control': 'no-store',
    },
  });
}


