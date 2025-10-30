'use client';
import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  // ESC 键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 始终显示错误信息
    setErrorMessage('用户名或密码错误，请先申请内测账号');
    toast.error('用户名或密码错误，请先申请内测账号');
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className={`relative w-full max-w-md mx-4 bg-white dark:bg-[rgb(22,23,24)] rounded-xl border border-border dark:border-border-dark shadow-2xl transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
          <div className="text-lg font-semibold">登录</div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrorMessage('');
              }}
              className="input w-full"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage('');
              }}
              className="input w-full"
              placeholder="请输入密码"
              required
            />
          </div>

          {/* 错误提示 */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              登录
            </button>
            <a 
              href="mailto:contact@xinliuyuansu.com"
              className="btn-ghost flex-1 flex items-center justify-center gap-2"
              onClick={onClose}
            >
              <Mail size={16} />
              申请内测
            </a>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              暂无账号？发送邮件申请内测资格
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

