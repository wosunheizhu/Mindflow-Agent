'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import NavTop from './NavTop';
import SideNav from './SideNav';
import CommandBar from './CommandBar';
import AvatarDisplay from './AvatarDisplay';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);

  // 初始化时从localStorage读取状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expanded = localStorage.getItem('avatar_expanded') === 'true';
      setIsAvatarExpanded(expanded);
    }
  }, []);

  // 处理展开状态变化
  const handleExpandChange = (expanded: boolean) => {
    console.log(`📐 [LayoutShell] 展开状态变化: ${expanded}`);
    setIsAvatarExpanded(expanded);
    // 同步到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('avatar_expanded', expanded ? 'true' : 'false');
    }
  };

  return (
    <div className="min-h-screen">
      <CommandBar />
      <NavTop />
      
      <div className="relative">
      {/* 展开状态下的整体布局：左侧数字员工 + 右侧主内容 */}
      {isAvatarExpanded ? (
        <div className="flex h-[calc(100vh-4rem)]">
          {/* 左侧：数字员工（50%宽度，flex布局确保内容对齐） */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="px-4 py-4 h-full flex flex-col">
              <AvatarDisplay isExpanded={true} onExpandChange={handleExpandChange} />
            </div>
          </div>
          
          {/* 右侧：主内容（50%宽度，有独立的滚动区域） */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-4 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
              {children}
            </div>
          </div>
        </div>
      ) : (
          /* 正常状态下的布局 */
          <div className="container-app grid grid-cols-12 gap-4 py-4" style={{ height: 'calc(100vh - 4rem)' }}>
            <aside className="col-span-12 md:col-span-3 lg:col-span-2">
              <SideNav activePath={pathname} />
              <div id="avatar-chat">
              <AvatarDisplay isExpanded={false} onExpandChange={handleExpandChange} />
              </div>
            </aside>
            
            <main className="col-span-12 md:col-span-9 lg:col-span-10 flex flex-col overflow-hidden">
              {children}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}


