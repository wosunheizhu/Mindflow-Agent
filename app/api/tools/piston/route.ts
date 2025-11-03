import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { language = 'python', code = '', stdin = '' } = await req.json();
  if (!code) return NextResponse.json({ ok:false, error:'缺少代码' }, { status: 400 });

  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, version: '*', files: [{ name: 'main', content: code }], stdin }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ ok:false, error:`Piston 调用失败：${res.status} ${text}` }, { status: 500 });
  }

  const out = await res.json();
  return NextResponse.json({ ok:true, out });
}






