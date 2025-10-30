'use client';
import { useState } from 'react';
import Image from 'next/image';
import { FileText, Code, LogIn, Command } from 'lucide-react';
import LoginModal from './LoginModal';
import LoginPrompt from './LoginPrompt';

export default function NavTop() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const handleProtectedAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    setShowPrompt(true);
  };
  
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border dark:border-border-dark bg-white/70 dark:bg-[rgb(16,16,17)/0.7] backdrop-blur">
        <div className="container-app flex h-14 items-center justify-between">
          <div className="flex items-center gap-0 -ml-4">
            <div className="relative h-14 w-14 flex-shrink-0">
              <Image
                src="/avatars/m.jpg"
                alt="Mindflow Logo"
                fill
                className="object-cover rounded-lg"
                priority
                unoptimized
              />
            </div>
            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm -ml-1">M</div>
            <span className="font-semibold -ml-1">Mindflow Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="btn-ghost" 
              aria-label="命令面板 (⌘K)" 
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              title="命令面板"
            >
              <Command size={16} />
              <span className="hidden sm:inline text-xs">⌘K</span>
            </button>
            <button
              onClick={(e) => handleProtectedAction(e, 'docs')}
              className="btn-ghost" 
              aria-label="文档"
              title="查看文档"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={(e) => handleProtectedAction(e, 'api')}
              className="btn-ghost" 
              aria-label="API"
              title="API 文档"
            >
              <Code size={16} />
            </button>
            <button 
              className="btn-ghost" 
              aria-label="登录"
              title="登录"
              onClick={() => setShowLogin(true)}
            >
              <LogIn size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 登录提示 */}
      <LoginPrompt 
        isOpen={showPrompt} 
        onClose={() => setShowPrompt(false)}
        onLogin={() => setShowLogin(true)}
      />

      {/* 登录弹窗 */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

