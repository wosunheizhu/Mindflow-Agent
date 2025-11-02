'use client';
import React, { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';

type Props = {
  url: string;
  size?: 'sm' | 'md';
};

/**
 * 截图源可切换：
 * - thum.io: https://image.thum.io/get/<url>
 * - microlink (若有额度/密钥): https://api.microlink.io?url=<url>&screenshot=true&meta=false
 */
const screenshotSrc = (url: string) => {
  const provider = process.env.NEXT_PUBLIC_LINK_SCREENSHOT_PROVIDER || 'thum';
  if (provider === 'microlink') {
    return `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
  }
  // 默认 thum.io（无需 key，公共服务）
  return `https://image.thum.io/get/width/640/crop/1200/${encodeURIComponent(url)}`;
};

const prettyHost = (u: string) => {
  try { return new URL(u).host; } catch { return u; }
};

export default function LinkCard({ url, size = 'md' }: Props) {
  const isSm = size === 'sm';
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
      style={{ maxWidth: isSm ? 340 : 520 }}
      title={url}
    >
      <div className="bg-gray-50 dark:bg-gray-900 relative aspect-video flex items-center justify-center">
        {!imageError ? (
          <>
            {/* 加载中占位 */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-xs text-gray-400">加载预览中...</div>
              </div>
            )}
            {/* 实际图片 */}
            <img
              src={screenshotSrc(url)}
              alt={`${prettyHost(url)} 预览`}
              loading="lazy"
              className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              onLoad={() => {
                console.log('✅ 截图加载成功:', url);
                setImageLoading(false);
              }}
              onError={(e) => {
                console.error('❌ 截图加载失败:', url);
                setImageError(true);
                setImageLoading(false);
              }}
            />
            <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition">
              预览
            </div>
          </>
        ) : (
          // 截图失败占位符
          <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
            <ImageOff size={32} />
            <div className="text-xs">预览不可用</div>
          </div>
        )}
      </div>
      <div className="px-3 py-2 bg-white dark:bg-[rgb(22,23,24)]">
        <div className="flex items-center gap-1.5">
          <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{prettyHost(url)}</div>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300 truncate underline decoration-dotted group-hover:decoration-solid mt-1">
          {url}
        </div>
      </div>
    </a>
  );
}

