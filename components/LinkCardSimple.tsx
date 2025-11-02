'use client';
import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

type Props = {
  url: string;
  size?: 'sm' | 'md';
};

const prettyHost = (u: string) => {
  try { return new URL(u).host; } catch { return u; }
};

const getFavicon = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return null;
  }
};

export default function LinkCardSimple({ url, size = 'md' }: Props) {
  const isSm = size === 'sm';
  const favicon = getFavicon(url);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all p-3"
      style={{ maxWidth: isSm ? 340 : 520 }}
      title={url}
    >
      <div className="flex items-start gap-3">
        {/* 网站图标 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
          {favicon ? (
            <img 
              src={favicon} 
              alt="" 
              className="w-6 h-6"
              onError={(e) => {
                // 如果favicon加载失败，显示默认图标
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
                }
              }}
            />
          ) : (
            <Globe size={20} className="text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        {/* 链接信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {prettyHost(url)}
            </div>
            <ExternalLink size={12} className="text-gray-400 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {url}
          </div>
        </div>
      </div>
    </a>
  );
}

