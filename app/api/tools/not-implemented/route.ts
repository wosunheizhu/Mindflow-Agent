import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST() {
  return NextResponse.json({ ok:false, error:'此工具后端未实现（占位）。仅提供 UI 与表单，可在 /app/api/tools 下扩展。' }, { status: 501 });
}




