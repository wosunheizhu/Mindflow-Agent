'use client';
import React from 'react';
import LinkCard from './LinkCard';
import LinkCardSimple from './LinkCardSimple';
import DownloadLinkCard from './DownloadLinkCard';
import { extractUrls } from './extractUrls';

type Props = {
  text: string;
  withCards?: boolean; // 是否在文末展示预览卡片
  size?: 'sm' | 'md';
  useSimpleCard?: boolean; // 是否使用简化版卡片（无截图，更快更可靠）
};

// 判断是否为下载链接
const isDownloadLink = (url: string): boolean => {
  // 1. 明确的下载路径（支持查询参数）
  if (url.includes('/api/download')) return true;
  if (/\/download[?\/]/i.test(url)) return true;
  
  // 2. 以文件扩展名结尾（排除查询参数后的判断）
  const urlWithoutQuery = url.split('?')[0];
  const filePattern = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|md|txt)$/i;
  if (filePattern.test(urlWithoutQuery)) return true;
  
  return false;
};

export default function Linkify({ text, withCards = true, size = 'sm', useSimpleCard = true }: Props) {
  if (!text) return null;

  // 提取所有链接（包括相对路径的下载链接）
  const urlRegex = /\b(?:https?:\/\/[^\s<>"'））\])}]+|\/api\/download\/[^\s<>"'））\])}]+)/gi;
  const parts: (string | { url: string; isDownload: boolean })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // 重置正则表达式的 lastIndex
  urlRegex.lastIndex = 0;
  
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0].replace(/[),.\]\}]+$/g, '');
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push({ url, isDownload: isDownloadLink(url) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  // 提取所有链接并去重
  const allUrls = text.match(urlRegex)?.map(u => u.replace(/[),.\]\}]+$/g, '')) || [];
  const uniqueUrls = Array.from(new Set(allUrls));
  
  // 分离下载链接和普通链接
  const downloadLinks = uniqueUrls.filter(isDownloadLink);
  const normalLinks = uniqueUrls.filter(u => !isDownloadLink(u));
  
  // 调试输出
  if (uniqueUrls.length > 0) {
    console.log('🔗 链接分类结果：');
    console.log('  总链接数:', uniqueUrls.length);
    console.log('  所有链接:', uniqueUrls);
    uniqueUrls.forEach(url => {
      console.log(`  - ${url} => ${isDownloadLink(url) ? '✅ 下载' : '🌐 普通'}`);
    });
    console.log('  下载链接:', downloadLinks);
    console.log('  普通链接:', normalLinks);
  }
  
  const CardComponent = useSimpleCard ? LinkCardSimple : LinkCard;

  return (
    <div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
        {parts.map((p, i) => {
          if (typeof p === 'string') return <span key={i}>{p}</span>;
          
          // 下载链接使用特殊样式
          if (p.isDownload) {
            return (
              <a
                key={i}
                href={p.url}
                download
                className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-semibold underline decoration-2 hover:decoration-4 break-words bg-blue-50 dark:bg-blue-900/30 px-1 rounded"
                title="点击下载文件"
              >
                {p.url}
              </a>
            );
          }
          
          // 普通链接
          return (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid break-words"
            >
              {p.url}
            </a>
          );
        })}
      </div>

      {withCards && (downloadLinks.length > 0 || normalLinks.length > 0) && (
        <div className="mt-3 space-y-3">
          {/* 下载链接（简洁显示） */}
          {downloadLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {downloadLinks.map((u) => (
                <DownloadLinkCard key={u} url={u} size={size} />
              ))}
            </div>
          )}
          
          {/* 普通链接卡片 */}
          {normalLinks.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                参考链接 ({normalLinks.length})
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {normalLinks.map((u) => (
                  <CardComponent key={u} url={u} size={size} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

