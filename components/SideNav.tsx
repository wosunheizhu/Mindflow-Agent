'use client';
import Link from 'next/link';
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
  return (
    <nav className="card p-2">
      {links.map(({href,label,icon:Icon}) => (
        <Link key={href} href={href} className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted dark:hover:bg-muted-dark',
          activePath === href ? 'bg-muted dark:bg-muted-dark' : ''
        )}>
          <Icon size={16} /><span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

