'use client';
import { useState, useEffect } from 'react';
import { X, LogIn } from 'lucide-react';

type LoginPromptProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function LoginPrompt({ isOpen, onClose, onLogin }: LoginPromptProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 处理弹窗显示/隐藏动画
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // 延迟触发动画，确保DOM已渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // 动画结束后才移除DOM（等待300ms动画完成）
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[9998] flex items-center justify-center transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* 提示内容 */}
      <div className={`relative w-full max-w-sm mx-4 bg-white dark:bg-[rgb(22,23,24)] rounded-xl border border-border dark:border-border-dark shadow-2xl transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
          <div className="text-base font-semibold">需要登录</div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
              <LogIn size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              此功能需要登录内测账号才能使用
            </p>
          </div>

          <button 
            onClick={() => {
              onClose();
              onLogin();
            }}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg hover:scale-105"
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn size={20} className="text-blue-600 dark:text-blue-400" />
              <div className="font-semibold">登录</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

