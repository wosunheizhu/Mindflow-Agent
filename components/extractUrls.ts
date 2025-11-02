export function extractUrls(text: string): string[] {
  if (!text) return [];
  
  // 简单可靠的 URL 正则（支持 ()[] 结尾收尾修剪）
  const regex = /\bhttps?:\/\/[^\s<>"'））\])}]+/gi;
  const raw = text.match(regex) || [];
  const cleaned = raw.map(u => u.replace(/[),.\]\}]+$/g, '')); // 去掉尾部标点
  const uniq = Array.from(new Set(cleaned));
  return uniq.filter(u => /^https?:\/\//i.test(u));
}

