import { NextResponse } from 'next/server';
import { create, all } from 'mathjs';

const math = create(all, { });

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { expr } = await req.json();
  if (!expr) return NextResponse.json({ ok:false, error:'缺少表达式 expr' }, { status: 400 });
  try {
    const value = math.evaluate(expr);
    return NextResponse.json({ ok:true, value });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 400 });
  }
}






