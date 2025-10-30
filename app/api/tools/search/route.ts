import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { q, count = 5, country = '' } = await req.json();
  if (!q || typeof q !== 'string') {
    return NextResponse.json({ ok:false, error:'缺少 q' }, { status: 400 });
  }

  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    // 演示数据
    return NextResponse.json({
      ok: true,
      notice: '未配置 BRAVE_API_KEY，返回演示结果',
      results: [
        { title: 'Brave Search 示例结果 1', url: 'https://example.com/1', snippet: '这是演示数据（未配置 API Key）。' },
        { title: 'Brave Search 示例结果 2', url: 'https://example.com/2', snippet: '请在 .env.local 配置 BRAVE_API_KEY 以调用真实接口。' },
      ],
      demo: true,
    });
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', q);
  url.searchParams.set('count', String(count));
  if (country) url.searchParams.set('country', country);

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ ok:false, error:`Brave API 调用失败：${res.status} ${text}` }, { status: 500 });
  }

  const json = await res.json();
  const items = (json.web?.results || []).map((r: any) => ({ title: r.title, url: r.url, snippet: r.description }));
  return NextResponse.json({ ok:true, results: items });
}




