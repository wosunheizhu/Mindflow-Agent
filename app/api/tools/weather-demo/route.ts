import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({
    ok: true,
    city: '示例市',
    days: [
      { day:'周一', high:25, low:17, desc:'多云' },
      { day:'周二', high:27, low:18, desc:'晴' },
      { day:'周三', high:23, low:16, desc:'小雨' },
    ],
  });
}




