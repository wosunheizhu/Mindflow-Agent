'use client';
import { KBarProvider, KBarPortal, KBarPositioner, KBarAnimator, KBarSearch, useMatches, KBarResults } from 'kbar';
import { useRouter } from 'next/navigation';

const actions = (router: ReturnType<typeof useRouter>) => ([
  { id:'go-dashboard', name:'打开快速开始', shortcut:['d'], keywords:'home 首页 开始', section:'导航', perform:() => router.push('/') },
  { id:'go-chat', name:'打开智能对话', shortcut:['c'], keywords:'chat 对话 聊天', section:'导航', perform:() => router.push('/chat') },
  { id:'go-tools', name:'打开工具中心', shortcut:['t'], keywords:'tools 工具', section:'导航', perform:() => router.push('/tools') },
  { id:'go-workflows', name:'打开工作流', shortcut:['w'], keywords:'flow 工作流 流程', section:'导航', perform:() => router.push('/workflows') },
  { id:'go-logs', name:'打开日志', shortcut:['l'], keywords:'logs 日志', section:'导航', perform:() => router.push('/logs') },
  { id:'go-settings', name:'打开设置', shortcut:['s'], keywords:'settings 设置 配置', section:'导航', perform:() => router.push('/settings') },
]);

export default function CommandBar() {
  const router = useRouter();
  return (
    <KBarProvider actions={actions(router) as any}>
      <KBarPortal>
        <KBarPositioner className="z-[9999] backdrop-blur">
          <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-xl border border-border dark:border-border-dark bg-white dark:bg-[rgb(22,23,24)] shadow-subtle">
            <KBarSearch className="w-full border-b border-border dark:border-border-dark bg-transparent px-4 py-3 outline-none" placeholder="输入指令或页面…"/>
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </KBarProvider>
  );
}

function RenderResults() {
  const { results } = useMatches();
  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => typeof item === 'string' ? (
        <div className="px-4 py-2 text-xs text-gray-500">{item}</div>
      ) : (
        <div className={`px-4 py-2 ${active ? 'bg-muted dark:bg-muted-dark' : ''}`}>{item.name}</div>
      )}
    />
  );
}

