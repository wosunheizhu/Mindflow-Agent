'use client';
import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, File, FileSpreadsheet, Presentation, Code, Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

type FilePreviewProps = {
  result: any; // 工具返回的结果对象
};

// 检测文件类型
function detectFileType(url: string, filename?: string): {
  type: 'image' | 'html' | 'pdf' | 'word' | 'excel' | 'ppt' | 'code' | 'text' | 'unknown';
  icon: any;
  canPreview: boolean;
} {
  const name = (filename || url).toLowerCase();
  
  if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
    return { type: 'image', icon: ImageIcon, canPreview: true };
  }
  if (name.match(/\.html?$/)) {
    return { type: 'html', icon: Code, canPreview: true };
  }
  if (name.match(/\.pdf$/)) {
    return { type: 'pdf', icon: FileText, canPreview: true };
  }
  if (name.match(/\.(docx?|odt)$/)) {
    return { type: 'word', icon: FileText, canPreview: false };
  }
  if (name.match(/\.(xlsx?|csv|ods)$/)) {
    return { type: 'excel', icon: FileSpreadsheet, canPreview: false };
  }
  if (name.match(/\.(pptx?|odp)$/)) {
    return { type: 'ppt', icon: Presentation, canPreview: false };
  }
  if (name.match(/\.(json|js|ts|py|md|txt|xml|css)$/)) {
    return { type: 'code', icon: Code, canPreview: true };
  }
  
  return { type: 'unknown', icon: File, canPreview: false };
}

export default function FilePreview({ result }: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  
  // 提取文件信息
  const downloadUrl = result?.download_url || result?.downloadUrl || result?.url;
  const filename = result?.filename || result?.outputFile || result?.name || '文件';
  const fileSize = result?.size || result?.fileSize;
  
  if (!downloadUrl) {
    return null; // 没有文件链接，不显示预览
  }
  
  const fileInfo = detectFileType(downloadUrl, filename);
  const Icon = fileInfo.icon;
  
  // 下载处理
  const handleDownload = async () => {
    try {
      // 如果是相对路径，补全为绝对路径
      const fullUrl = downloadUrl.startsWith('http') 
        ? downloadUrl 
        : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('下载成功');
    } catch (error) {
      console.error('下载错误:', error);
      toast.error('下载失败');
    }
  };
  
  // 在新窗口打开
  const handleOpenInNew = () => {
    const fullUrl = downloadUrl.startsWith('http') 
      ? downloadUrl 
      : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
    window.open(fullUrl, '_blank');
  };
  
  return (
    <div className="mt-3 border-2 border-green-200 dark:border-green-800 rounded-lg overflow-hidden bg-green-50 dark:bg-green-950/30">
      {/* 文件信息头部 */}
      <div className="px-3 py-2 bg-green-100 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              {filename}
            </span>
            {fileSize && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900 px-2 py-0.5 rounded">
                {fileSize}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* 预览切换按钮 */}
            {fileInfo.canPreview && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-1.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                title={showPreview ? "隐藏预览" : "显示预览"}
              >
                {showPreview ? (
                  <EyeOff size={14} className="text-green-600 dark:text-green-400" />
                ) : (
                  <Eye size={14} className="text-green-600 dark:text-green-400" />
                )}
              </button>
            )}
            
            {/* 新窗口打开按钮 */}
            <button
              onClick={handleOpenInNew}
              className="p-1.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              title="在新窗口打开"
            >
              <ExternalLink size={14} className="text-green-600 dark:text-green-400" />
            </button>
            
            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white rounded transition-colors text-xs font-medium"
              title="下载文件"
            >
              <Download size={12} />
              <span>下载</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 预览区域 */}
      {showPreview && fileInfo.canPreview && (
        <div className="p-3 bg-white dark:bg-gray-900">
          {fileInfo.type === 'image' && (
            <div className="flex justify-center">
              <img
                src={downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`}
                alt={filename}
                className="max-w-full max-h-96 rounded shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  toast.error('图片加载失败');
                }}
              />
            </div>
          )}
          
          {fileInfo.type === 'html' && (
            <iframe
              src={downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`}
              className="w-full h-96 border rounded bg-white"
              title={filename}
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => console.log('✅ HTML 文件预览加载成功')}
              onError={() => {
                console.error('❌ HTML 文件预览加载失败');
                toast.error('预览加载失败，请点击"在新窗口打开"查看');
              }}
            />
          )}
          
          {fileInfo.type === 'pdf' && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                PDF 预览（点击"在新窗口打开"查看完整文档）
              </div>
              <iframe
                src={`${downloadUrl.startsWith('http') ? downloadUrl : `${window.location.origin}${downloadUrl}`}#toolbar=1`}
                className="w-full h-96 border rounded"
                title={filename}
              />
            </div>
          )}
          
          {fileInfo.type === 'code' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-4">
              点击"在新窗口打开"或"下载"查看文件内容
            </div>
          )}
        </div>
      )}
      
      {/* 无法预览的文件类型提示 */}
      {!fileInfo.canPreview && (
        <div className="p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Icon size={32} className="text-green-600 dark:text-green-400" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {fileInfo.type === 'word' && '此 Word 文档需要下载后查看'}
              {fileInfo.type === 'excel' && '此 Excel 文档需要下载后查看'}
              {fileInfo.type === 'ppt' && '此 PowerPoint 文档需要下载后查看'}
              {fileInfo.type === 'unknown' && '点击下载按钮获取文件'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

