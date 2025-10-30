import { NextRequest } from "next/server";
import { consumeDownload } from "../../../lib/download-registry";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  
  const item = await consumeDownload(token);
  if (!item) {
    return new Response('Invalid or expired token', { status: 404 });
  }

  return new Response(item.data, {
    status: 200,
    headers: {
      'Content-Type': item.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
      'Cache-Control': 'no-store',
    },
  });
}


