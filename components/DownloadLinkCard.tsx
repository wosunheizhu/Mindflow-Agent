'use client';
import React from 'react';
import { Download } from 'lucide-react';

type Props = {
  url: string;
  size?: 'sm' | 'md';
};

const getFileName = (url: string) => {
  try {
    // 如果是 /api/download?token= 格式，只显示"下载文件"
    if (url.includes('/api/download?')) {
      return '点击下载';
    }
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0]; // 去除查询参数
    return decodeURIComponent(lastPart) || '下载文件';
  } catch {
    return '下载文件';
  }
};

export default function DownloadLinkCard({ url, size = 'md' }: Props) {
  const isSm = size === 'sm';
  const filename = getFileName(url);
  
  return (
    <a
      href={url}
      download
      className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-600 dark:hover:border-blue-500 transition-colors"
      style={{ maxWidth: isSm ? 400 : 600 }}
      title="点击下载文件"
    >
      <Download size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
        {filename}
      </span>
    </a>
  );
}

