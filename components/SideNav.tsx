'use client';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Wrench, Workflow, HardDriveDownload, ScrollText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href:'/', label:'快速开始', icon:LayoutDashboard },
  { href:'/chat', label:'智能对话', icon:MessageSquare },
  { href:'/tools', label:'工具中心', icon:Wrench },
  { href:'/workflows', label:'工作流', icon:Workflow },
  { href:'/logs', label:'日志', icon:ScrollText },
  { href:'/settings', label:'设置', icon:Settings },
];

export default function SideNav({ activePath }: { activePath?: string }) {
  const router = useRouter();
  
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    // 如果已经在目标页面，不做处理
    if (activePath === href) {
      e.preventDefault();
      return;
    }
    
    // 检查是否有 Agentic AI 任务正在执行
    if (typeof window !== 'undefined') {
      const isAgentWorking = localStorage.getItem('agent_working') === 'true';
      if (isAgentWorking) {
        e.preventDefault();
        const confirmed = window.confirm(
          'Agentic AI 任务正在执行中，切换页面将终止当前任务。是否确认切换？'
        );
        if (confirmed) {
          // 用户确认，终止任务并导航
          localStorage.setItem('agent_working', 'false');
          router.push(href);
        }
        // 用户取消，不导航
        return;
      }
    }
    
    // 没有任务执行，正常导航
    router.push(href);
  };
  
  return (
    <nav className="card p-2">
      {links.map(({href,label,icon:Icon}) => (
        <a 
          key={href} 
          href={href}
          onClick={(e) => {
            e.preventDefault();
            handleNavigation(href, e);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted dark:hover:bg-muted-dark cursor-pointer',
            activePath === href ? 'bg-muted dark:bg-muted-dark' : ''
          )}
        >
          <Icon size={16} /><span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

