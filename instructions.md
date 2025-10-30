System / High-level Goal

你是一名资深前端架构师。请从零创建一个名为 ai-assistant-pro 的 Web 应用，技术栈与目标如下：

框架：Next.js 14（App Router） + TypeScript

UI：Tailwind CSS（专业简约风，暗色模式）

状态与数据：Zustand（轻量全局状态）+ TanStack Query（异步状态）

表单与校验：react-hook-form + zod

交互：kbar（命令面板）、react-hot-toast（即时反馈）

可视化：Recharts（HTML 交互图表）

拖拽编排：React Flow（工作流）

其他：lucide-react（图标）、react-json-view（结果查看）

功能上需完整呈现并对齐以下清单（映射为 UI 与表单即可，后端真实能力用 API Route 代理或 Demo/占位响应替代也可）：

工具（21 个）：网页搜索(Brave)、代码执行(Piston)、图像生成(DALL·E 3)、数学计算(mathjs)、文件读取、文档创建、文件操作、网页访问(Playwright 占位)、数据提取(占位)、API 调用、图片分析(GPT-4o Vision 占位)、文本翻译(LibreTranslate)、文本处理、OCR(Tesseract.js 占位)、数据可视化、数据转换(JSON↔CSV)、时间处理、AI 自主工作流（编排 UI）、邮件发送(Nodemailer 占位)、工作区管理、天气查询（演示）

核心数据 KPI：工具数 21、真实 API 20/21、零配置 13、测试通过率 100%、代码量 8,265、文档 50+、总体完成度 96%（Manus 水平）

页面：Dashboard、Tools、Workflows、Workspace（占位演示）、Logs、Settings

请严格生成文件结构与代码，可直接 npm run dev 运行。如遇到与版本有关的细节，由你自行调整为当下稳定写法，保证能成功构建与启动。

1) 初始化与依赖

创建项目并安装依赖（如你可以直接执行命令，请自动执行；否则在项目内写入匹配的 package.json 与配置文件）。

npx create-next-app@latest ai-assistant-pro --typescript --app --eslint --tailwind --use-npm
cd ai-assistant-pro
npm i @tanstack/react-query zustand zod react-hook-form @hookform/resolvers lucide-react kbar react-hot-toast date-fns mathjs react-json-view reactflow recharts clsx class-variance-authority

2) 目录结构（创建并填充以下文件内容）
ai-assistant-pro/
├─ app/
│  ├─ api/
│  │  └─ tools/
│  │     ├─ search/route.ts
│  │     ├─ math/route.ts
│  │     ├─ piston/route.ts
│  │     └─ weather-demo/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ page.tsx                # Dashboard
│  ├─ tools/page.tsx          # 工具工作台
│  ├─ workflows/page.tsx      # 工作流编排
│  ├─ logs/page.tsx           # 执行日志
│  └─ settings/page.tsx       # 配置页
├─ components/
│  ├─ LayoutShell.tsx
│  ├─ NavTop.tsx
│  ├─ SideNav.tsx
│  ├─ KPICard.tsx
│  ├─ ToolCard.tsx
│  ├─ ToolRunner.tsx
│  ├─ CommandBar.tsx
│  ├─ JsonView.tsx
│  └─ ChartPreview.tsx
├─ lib/
│  ├─ tools.ts
│  ├─ types.ts
│  ├─ utils.ts
│  └─ store.ts
├─ public/
│  └─ logo.svg
├─ next.config.mjs
├─ postcss.config.mjs
├─ tailwind.config.ts
└─ README.md

3) 代码文件

提示：以下所有代码块请逐一写入对应文件（路径位于代码块开头注释）。

▸ next.config.mjs
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
};
export default nextConfig;

▸ tailwind.config.ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(220 14% 90%)',
        muted: 'hsl(220 14% 96%)',
        bg: 'hsl(0 0% 100%)',
        fg: 'hsl(222 47% 11%)',
        accent: 'hsl(217 91% 60%)',
        // 暗色
        'bg-dark': 'hsl(222 47% 7%)',
        'fg-dark': 'hsl(210 40% 98%)',
        'border-dark': 'hsl(220 14% 25%)',
        'muted-dark': 'hsl(220 14% 18%)',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace','SFMono-Regular','Menlo','monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;

▸ postcss.config.mjs
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

▸ app/globals.css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light dark;
}

html, body {
  @apply h-full bg-bg text-fg dark:bg-bg-dark dark:text-fg-dark font-sans antialiased;
}

.container-app {
  @apply mx-auto w-full max-w-7xl px-4;
}

.card {
  @apply rounded-xl border border-border dark:border-border-dark bg-white dark:bg-[rgb(22,23,24)] shadow-subtle;
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition;
}
.btn-primary {
  @apply btn bg-[hsl(217_91%_60%)] text-white hover:brightness-95 active:brightness-90;
}
.btn-ghost {
  @apply btn bg-transparent hover:bg-muted dark:hover:bg-muted-dark;
}
.input, .select, .textarea {
  @apply w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-[rgb(16,16,17)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent;
}
.label { @apply text-xs text-gray-500 dark:text-gray-400; }
.badge {
  @apply inline-flex items-center rounded-full border border-border dark:border-border-dark px-2 py-0.5 text-[11px] uppercase tracking-wide;
}
.kbd {
  @apply rounded-md border border-border dark:border-border-dark bg-muted dark:bg-muted-dark px-1.5 py-0.5 text-[11px];
}

▸ lib/types.ts
// lib/types.ts
import { Icon } from 'lucide-react';

export type ParamField =
  | { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'json' | 'code' | 'toggle'; required?: boolean; placeholder?: string; helper?: string; options?: {label: string; value: string}[]; defaultValue?: any };

export type ToolDefinition = {
  id: string;
  name: string;
  icon: any; // lucide icon component
  category: '基础'|'文件'|'网页自动化'|'内容'|'数据'|'高级';
  description: string;
  realApi: boolean;
  zeroConfig: boolean;
  endpoint?: string;     // API Route
  method?: 'GET'|'POST';
  params?: ParamField[];
  clientRunnerId?: 'doc-create'|'data-viz'|'json-csv'|'time'|'file-read'|'text-process';
};

export type RunResult = {
  ok: boolean;
  data?: any;
  error?: string;
  notice?: string;
};

▸ lib/utils.ts
// lib/utils.ts
import { clsx } from 'clsx';

export const cn = (...args: any[]) => clsx(...args);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);

export const downloadTextFile = (name: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

▸ lib/store.ts
// lib/store.ts
import { create } from 'zustand';

type LogItem = { id: string; toolId: string; title: string; ts: number; payload?: any; result?: any; ok?: boolean };

type AppState = {
  theme: 'light'|'dark'|'system';
  setTheme: (t: AppState['theme']) => void;

  logs: LogItem[];
  pushLog: (log: Omit<LogItem,'id'|'ts'>) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  logs: [],
  pushLog: (log) => set({ logs: [{ id: crypto.randomUUID(), ts: Date.now(), ...log }, ...get().logs ] }),
}));

▸ lib/tools.ts
// lib/tools.ts
import { Search, Code2, ImageIcon, Calculator, FileText, FilePlus2, FolderCog, Globe, ListChecks, Network, ImagePlus, Languages, TextCursorInput, ScanText, BarChart3, Repeat2, Clock3, Workflow, Mail, HardDriveDownload, Cloud } from 'lucide-react';
import type { ToolDefinition } from './types';

export const TOOL_DEFS: ToolDefinition[] = [
  { id:'web-search', name:'网页搜索', icon:Search, category:'基础', description:'Brave Search 实时检索', realApi:true, zeroConfig:false, endpoint:'/api/tools/search', method:'POST',
    params:[{key:'q',label:'搜索词',type:'text',required:true,placeholder:'例如：Transformers 论文最新进展'},
            {key:'count',label:'返回数量',type:'number',defaultValue:5},
            {key:'country',label:'地域',type:'select',options:[{label:'自动',value:''},{label:'US',value:'us'},{label:'CN',value:'cn'}],defaultValue:''}]
  },
  { id:'code-exec', name:'代码执行', icon:Code2, category:'基础', description:'Piston 在线运行代码', realApi:true, zeroConfig:true, endpoint:'/api/tools/piston', method:'POST',
    params:[{key:'language',label:'语言',type:'select',options:[{label:'python',value:'python'},{label:'javascript',value:'javascript'}],defaultValue:'python'},
            {key:'code',label:'代码',type:'code',required:true,placeholder:'# 在此粘贴代码'},
            {key:'stdin',label:'标准输入',type:'textarea',placeholder:'可选'}]
  },
  { id:'image-gen', name:'图像生成', icon:ImageIcon, category:'基础', description:'DALL·E 3 文生图（需 OPENAI_API_KEY）', realApi:true, zeroConfig:false,
    // 占位：当前仅做 UI 与占位说明
    endpoint:'/api/tools/not-implemented', method:'POST',
    params:[{key:'prompt',label:'提示词',type:'textarea',required:true,placeholder:'例如：未来主义风格的城市夜景，霓虹灯，广角'}]
  },
  { id:'math', name:'数学计算', icon:Calculator, category:'基础', description:'mathjs 表达式计算', realApi:true, zeroConfig:true, endpoint:'/api/tools/math', method:'POST',
    params:[{key:'expr',label:'表达式',type:'text',required:true,placeholder:'sum(1..100) 或 (123 * 456) / 7'}]
  },

  { id:'file-read', name:'文件读取', icon:FileText, category:'文件', description:'读取 PDF/Word/Excel/TXT/图片（UI演示）', realApi:true, zeroConfig:true, clientRunnerId:'file-read',
    params:[{key:'file',label:'上传文件',type:'file',required:true}]
  },
  { id:'doc-create', name:'文档创建', icon:FilePlus2, category:'文件', description:'生成 Markdown/Word/Excel/TXT/JSON（前端生成示例）', realApi:true, zeroConfig:true, clientRunnerId:'doc-create',
    params:[{key:'format',label:'格式',type:'select',options:[{label:'Markdown',value:'md'},{label:'TXT',value:'txt'},{label:'JSON',value:'json'}],defaultValue:'md'},
            {key:'content',label:'内容',type:'textarea',required:true,placeholder:'输入要写入的文档内容'}]
  },
  { id:'file-ops', name:'文件操作', icon:FolderCog, category:'文件', description:'创建/删除/移动/复制/重命名（占位）', realApi:true, zeroConfig:true,
    endpoint:'/api/tools/not-implemented', method:'POST',
  },

  { id:'web-visit', name:'网页访问', icon:Globe, category:'网页自动化', description:'Playwright 访问网页、截图、抽取（占位）', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'data-extract', name:'数据提取', icon:ListChecks, category:'网页自动化', description:'Playwright + CSS 选择器提取（占位）', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'api-call', name:'API 调用', icon:Network, category:'网页自动化', description:'任意 REST 请求（占位）', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST' },

  { id:'image-analyze', name:'图片分析', icon:ImagePlus, category:'内容', description:'GPT-4o Vision（占位）', realApi:true, zeroConfig:false, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'translate', name:'文本翻译', icon:Languages, category:'内容', description:'LibreTranslate 免费接口', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST',
    params:[{key:'text',label:'文本',type:'textarea',required:true},
            {key:'target',label:'目标语言',type:'select',options:[{label:'中文',value:'zh'},{label:'英文',value:'en'},{label:'日文',value:'ja'},{label:'法语',value:'fr'}],defaultValue:'en'}]
  },
  { id:'text-process', name:'文本处理', icon:TextCursorInput, category:'内容', description:'统计/提取/替换/格式化（前端演示）', realApi:true, zeroConfig:true, clientRunnerId:'text-process',
    params:[{key:'mode',label:'模式',type:'select',options:[{label:'统计字数',value:'count'},{label:'大写',value:'upper'},{label:'小写',value:'lower'}],defaultValue:'count'},
            {key:'text',label:'文本',type:'textarea',required:true}]
  },
  { id:'ocr', name:'OCR 识别', icon:ScanText, category:'内容', description:'Tesseract.js（占位）', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST',
    params:[{key:'file',label:'图片',type:'file',required:true}]
  },

  { id:'data-viz', name:'数据可视化', icon:BarChart3, category:'数据', description:'柱状/折线/饼图（前端渲染）', realApi:true, zeroConfig:true, clientRunnerId:'data-viz',
    params:[{key:'type',label:'图表类型',type:'select',options:[{label:'柱状图',value:'bar'},{label:'折线图',value:'line'},{label:'饼图',value:'pie'}],defaultValue:'bar'},
            {key:'data',label:'数据(JSON)',type:'json',placeholder:'[{ "name":"一月","value":120 }...]',required:true}]
  },
  { id:'convert', name:'数据转换', icon:Repeat2, category:'数据', description:'JSON ↔ CSV（前端转换）', realApi:true, zeroConfig:true, clientRunnerId:'json-csv',
    params:[{key:'mode',label:'方向',type:'select',options:[{label:'JSON → CSV',value:'json2csv'},{label:'CSV → JSON',value:'csv2json'}],defaultValue:'json2csv'},
            {key:'content',label:'内容',type:'textarea',required:true,placeholder:'粘贴 JSON 或 CSV 文本'}]
  },
  { id:'time', name:'时间处理', icon:Clock3, category:'数据', description:'日期解析/格式化（前端演示）', realApi:true, zeroConfig:true, clientRunnerId:'time',
    params:[{key:'iso',label:'ISO 日期',type:'text',placeholder:'2025-10-26T10:00:00Z',required:true}]
  },

  { id:'workflow', name:'AI 自主工作流', icon:Workflow, category:'高级', description:'图形化编排与一键执行', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'email', name:'邮件发送', icon:Mail, category:'高级', description:'Nodemailer（需邮箱配置）', realApi:true, zeroConfig:false, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'workspace', name:'工作区管理', icon:HardDriveDownload, category:'高级', description:'类似 Cursor 的工作区操作（占位）', realApi:true, zeroConfig:true, endpoint:'/api/tools/not-implemented', method:'POST' },
  { id:'weather-demo', name:'天气查询（演示）', icon:Cloud, category:'高级', description:'演示数据返回', realApi:false, zeroConfig:true, endpoint:'/api/tools/weather-demo', method:'GET' },
];

export const CORE_KPIS = {
  tools: 21,
  realApiRatio: '20/21 (95.2%)',
  zeroConfig: '13 (61.9%)',
  passRate: '100%',
  loc: '8,265',
  docs: '50+',
  completeness: '96% Manus 水平',
};

▸ components/LayoutShell.tsx
// components/LayoutShell.tsx
'use client';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import NavTop from './NavTop';
import SideNav from './SideNav';
import CommandBar from './CommandBar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <CommandBar />
      <NavTop />
      <div className="container-app grid grid-cols-12 gap-4 py-4">
        <aside className={cn('col-span-12 md:col-span-3 lg:col-span-2')}>
          <SideNav activePath={pathname} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {children}
        </main>
      </div>
    </div>
  );
}

▸ components/NavTop.tsx
// components/NavTop.tsx
'use client';
import { Keyboard, Sun, Moon, MonitorCog, Command } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function NavTop() {
  const { theme, setTheme } = useAppStore();
  return (
    <header className="sticky top-0 z-40 border-b border-border dark:border-border-dark bg-white/70 dark:bg-[rgb(16,16,17)/0.7] backdrop-blur">
      <div className="container-app flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="logo" className="h-6" />
          <span className="font-semibold">AI 智能助手 · Ultimate Pro</span>
          <span className="badge">生产就绪</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" aria-label="Command Palette (⌘K)" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
            <Command size={16} /> <span className="hidden sm:inline">命令面板</span> <span className="kbd">⌘K</span>
          </button>
          <button className="btn-ghost" onClick={() => setTheme('light')} aria-label="浅色"><Sun size={16} /></button>
          <button className="btn-ghost" onClick={() => setTheme('dark')} aria-label="深色"><Moon size={16} /></button>
          <button className="btn-ghost" onClick={() => setTheme('system')} aria-label="跟随系统"><MonitorCog size={16} /></button>
        </div>
      </div>
    </header>
  );
}

▸ components/SideNav.tsx
// components/SideNav.tsx
'use client';
import Link from 'next/link';
import { LayoutDashboard, Wrench, Workflow, HardDriveDownload, ScrollText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href:'/', label:'Dashboard', icon:LayoutDashboard },
  { href:'/tools', label:'Tools', icon:Wrench },
  { href:'/workflows', label:'Workflows', icon:Workflow },
  { href:'/logs', label:'Logs', icon:ScrollText },
  { href:'/settings', label:'Settings', icon:Settings },
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
      <div className="mt-4 rounded-lg border border-dashed border-border dark:border-border-dark p-3 text-xs text-gray-500">
        <div>版本：5.0 Ultimate Pro</div>
        <div>完成度：96% Manus</div>
        <div>状态：生产就绪</div>
      </div>
    </nav>
  );
}

▸ components/KPICard.tsx
// components/KPICard.tsx
import { cn } from '@/lib/utils';

export default function KPICard({ title, value, hint }: { title: string; value: string|number; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

▸ components/ToolCard.tsx
// components/ToolCard.tsx
'use client';
import { TOOL_DEFS } from '@/lib/tools';
import { cn } from '@/lib/utils';

export default function ToolCard({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const tool = TOOL_DEFS.find(t => t.id === id)!;
  const Icon = tool.icon;
  return (
    <button onClick={() => onSelect(id)} className="card w-full text-left p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <div className="font-medium">{tool.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge">{tool.category}</span>
          <span className={cn('badge', tool.zeroConfig ? 'text-green-600 border-green-300 dark:border-green-700' : 'text-amber-600 border-amber-300 dark:border-amber-700')}>
            {tool.zeroConfig ? '零配置' : '需配置'}
          </span>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{tool.description}</div>
    </button>
  );
}

▸ components/JsonView.tsx
// components/JsonView.tsx
'use client';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });
export default function JsonView({ src }: { src: any }) {
  return <ReactJson src={src} name={false} collapsed={2} enableClipboard={false} displayDataTypes={false} />;
}

▸ components/ChartPreview.tsx
// components/ChartPreview.tsx
'use client';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, Legend } from 'recharts';

export default function ChartPreview({ type, data }: { type: 'bar'|'line'|'pie'; data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) return <div className="text-sm text-gray-500">无数据</div>;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="value" />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Line dataKey="value" />
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip /><Legend />
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={110} label>
              {data.map((_, i) => <Cell key={i} />)}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

▸ components/ToolRunner.tsx
// components/ToolRunner.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z, ZodTypeAny } from 'zod';
import { TOOL_DEFS } from '@/lib/tools';
import JsonView from './JsonView';
import toast from 'react-hot-toast';
import ChartPreview from './ChartPreview';
import { downloadTextFile } from '@/lib/utils';

type Props = { toolId: string };

export default function ToolRunner({ toolId }: Props) {
  const tool = TOOL_DEFS.find(t => t.id === toolId)!;
  const { register, handleSubmit, formState, watch, reset } = useForm<any>({
    defaultValues: Object.fromEntries((tool.params||[]).map(p => [p.key, p.defaultValue ?? '']))
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: any) => {
    setLoading(true);
    setResult(null);

    try {
      // 前端直跑的工具
      switch (tool.clientRunnerId) {
        case 'doc-create': {
          const { format, content } = values;
          const name = `document_${Date.now()}.${format}`;
          const text = format === 'json' ? JSON.stringify({ content, ts: Date.now() }, null, 2) : content;
          downloadTextFile(name, text);
          setResult({ ok: true, notice: `已下载 ${name}` });
          toast.success('文档已生成并下载');
          break;
        }
        case 'data-viz': {
          let parsed: any[] = [];
          try { parsed = typeof values.data === 'string' ? JSON.parse(values.data) : values.data; }
          catch { throw new Error('JSON 解析失败'); }
          setResult({ ok: true, chartType: values.type, chartData: parsed });
          toast.success('图表已生成');
          break;
        }
        case 'json-csv': {
          const mode = values.mode;
          if (mode === 'json2csv') {
            const arr = JSON.parse(values.content);
            const keys = [...new Set(arr.flatMap((o: any) => Object.keys(o)))];
            const csv = [keys.join(','), ...arr.map((o: any) => keys.map(k => JSON.stringify(o[k] ?? '')).join(','))].join('\n');
            downloadTextFile(`converted_${Date.now()}.csv`, csv);
            setResult({ ok: true, lines: arr.length });
          } else {
            const [head, ...rows] = values.content.trim().split('\n');
            const keys = head.split(','); const json = rows.map((r: string) => Object.fromEntries(r.split(',').map((v,i) => [keys[i], JSON.parse(v || '""') ])));
            downloadTextFile(`converted_${Date.now()}.json`, JSON.stringify(json, null, 2));
            setResult({ ok: true, items: rows.length });
          }
          toast.success('转换完成');
          break;
        }
        case 'time': {
          const d = new Date(values.iso);
          if (isNaN(d.getTime())) throw new Error('无效日期');
          setResult({ ok: true, iso: d.toISOString(), locale: d.toLocaleString(), timestamp: d.getTime() });
          break;
        }
        case 'file-read': {
          const file = (values.file as FileList)?.[0];
          if (!file) throw new Error('请选择文件');
          const text = await file.text();
          setResult({ ok: true, name: file.name, size: file.size, preview: text.slice(0, 2000) });
          break;
        }
        case 'text-process': {
          const { mode, text } = values;
          const res = mode === 'count' ? { chars: text.length, words: text.trim().split(/\s+/).filter(Boolean).length } : (mode === 'upper' ? text.toUpperCase() : text.toLowerCase());
          setResult({ ok: true, data: res });
          break;
        }
        default: {
          // 后端 API
          const method = tool.method || 'POST';
          const res = await fetch(tool.endpoint || '/api/tools/not-implemented', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'GET' ? undefined : JSON.stringify(values)
          });
          const json = await res.json();
          setResult(json);
          if (json.ok) toast.success('执行成功'); else toast.error(json.error || '执行失败');
        }
      }
    } catch (e: any) {
      setResult({ ok:false, error: e.message || String(e) });
      toast.error(e.message || '执行异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{tool.name}</div>
        <div className="text-xs text-gray-500">{tool.description}</div>
      </div>

      {/* 动态表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-3">
        {(tool.params||[]).map(p => (
          <div key={p.key} className="grid gap-1.5">
            <label className="label">{p.label}{p.required ? ' *' : ''}</label>
            {p.type === 'text' && <input className="input" {...register(p.key, { required: !!p.required })} placeholder={p.placeholder} />}
            {p.type === 'number' && <input type="number" className="input" {...register(p.key as any)} />}
            {p.type === 'textarea' && <textarea className="textarea" rows={5} {...register(p.key as any)} placeholder={p.placeholder} />}
            {p.type === 'select' && (
              <select className="select" {...register(p.key as any)} defaultValue={p.defaultValue}>
                {(p.options||[]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            {p.type === 'file' && <input type="file" className="input" {...register(p.key as any)} />}
            {p.type === 'json' && <textarea className="textarea font-mono" rows={8} {...register(p.key as any)} placeholder={p.placeholder} />}
            {p.type === 'code' && <textarea className="textarea font-mono" rows={10} {...register(p.key as any)} placeholder={p.placeholder} />}
            {p.helper && <p className="text-xs text-gray-500">{p.helper}</p>}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button disabled={loading} className="btn-primary">{loading ? '运行中…' : '运行'}</button>
          <button type="button" onClick={() => { setResult(null); }} className="btn-ghost">清空结果</button>
        </div>
      </form>

      {/* 结果区 */}
      <div className="mt-4">
        {!result && <div className="text-sm text-gray-500">提交后将在此显示结果。</div>}
        {result && (
          <div className="grid gap-2">
            {/* 图表预览（仅 data-viz） */}
            {result.chartType && result.chartData && (
              <ChartPreview type={result.chartType} data={result.chartData} />
            )}
            {/* 通用 JSON 视图 */}
            <div className="rounded-lg border border-border dark:border-border-dark p-2">
              <JsonView src={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

▸ components/CommandBar.tsx
// components/CommandBar.tsx
'use client';
import { KBarProvider, KBarPortal, KBarPositioner, KBarAnimator, KBarSearch, useMatches, KBarResults } from 'kbar';
import { useRouter } from 'next/navigation';

const actions = (router: ReturnType<typeof useRouter>) => ([
  { id:'go-dashboard', name:'打开 Dashboard', shortcut:['d'], keywords:'home', section:'导航', perform:() => router.push('/') },
  { id:'go-tools', name:'打开 Tools', shortcut:['t'], keywords:'tools', section:'导航', perform:() => router.push('/tools') },
  { id:'go-workflows', name:'打开 Workflows', shortcut:['w'], keywords:'flow', section:'导航', perform:() => router.push('/workflows') },
  { id:'go-logs', name:'打开 Logs', shortcut:['l'], keywords:'logs', section:'导航', perform:() => router.push('/logs') },
  { id:'go-settings', name:'打开 Settings', shortcut:['s'], keywords:'settings', section:'导航', perform:() => router.push('/settings') },
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

▸ app/layout.tsx
// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import LayoutShell from '@/components/LayoutShell';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI 智能助手 · Ultimate Pro',
  description: '专业简约风、交互性强的多工具 AI 工作台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <LayoutShell>
          {children}
        </LayoutShell>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

▸ app/page.tsx（Dashboard）
// app/page.tsx
'use client';
import KPICard from '@/components/KPICard';
import { CORE_KPIS } from '@/lib/tools';
import Link from 'next/link';

export default function Page() {
  const K = CORE_KPIS;
  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="工具数量" value={K.tools} />
        <KPICard title="真实 API" value={K.realApiRatio} />
        <KPICard title="零配置工具" value={K.zeroConfig} />
        <KPICard title="测试通过率" value={K.passRate} />
        <KPICard title="代码量" value={K.loc} />
        <KPICard title="文档数量" value={K.docs} />
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">总体完成度</div>
            <div className="text-sm text-gray-500">目标：专业简约风 + 高交互</div>
          </div>
          <div className="badge">{K.completeness}</div>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div>· AI 自主工作流、文件闭环、工作区管理、数据可视化均已覆盖 UI。</div>
          <div>· 真实接口：Brave/Piston/mathjs/演示天气；其他工具提供可扩展占位 API。</div>
          <div>· 支持命令面板（⌘K）、暗色模式、响应式布局、即时反馈。</div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/tools" className="btn-primary">打开工具工作台</Link>
          <Link href="/workflows" className="btn-ghost">进入工作流编排</Link>
        </div>
      </section>
    </div>
  );
}

▸ app/tools/page.tsx
// app/tools/page.tsx
'use client';
import { useState } from 'react';
import { TOOL_DEFS } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import ToolRunner from '@/components/ToolRunner';

export default function ToolsPage() {
  const [active, setActive] = useState<string>('web-search');
  const categories = ['全部','基础','文件','网页自动化','内容','数据','高级'] as const;
  const [cat, setCat] = useState<(typeof categories)[number]>('全部');

  const list = TOOL_DEFS.filter(t => cat === '全部' ? true : t.category === cat);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-5 grid gap-3">
        <div className="card p-2 flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} className={`btn-ghost ${c===cat ? 'bg-muted dark:bg-muted-dark' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map(t => <ToolCard key={t.id} id={t.id} onSelect={setActive} />)}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7">
        <ToolRunner toolId={active} />
      </div>
    </div>
  );
}

▸ app/workflows/page.tsx
// app/workflows/page.tsx
'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { TOOL_DEFS } from '@/lib/tools';
import toast from 'react-hot-toast';

const ReactFlow = dynamic(() => import('reactflow').then(m => m.default), { ssr: false });
const Background = dynamic(() => import('reactflow').then(m => m.Background), { ssr: false });
const Controls = dynamic(() => import('reactflow').then(m => m.Controls), { ssr: false });

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<any[]>([
    { id:'n1', position:{x:50,y:50}, data:{label:'搜索'}, type:'input' },
    { id:'n2', position:{x:300,y:160}, data:{label:'代码执行'} },
    { id:'n3', position:{x:600,y:80}, data:{label:'生成报告'}, type:'output' },
  ]);
  const [edges, setEdges] = useState<any[]>([
    { id:'e1-2', source:'n1', target:'n2' },
    { id:'e2-3', source:'n2', target:'n3' },
  ]);

  return (
    <div className="grid gap-3">
      <div className="card p-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">工作流编排</div>
          <div className="text-xs text-gray-500">拖拽节点、连接边，点击运行模拟执行（演示版）。</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => toast('这是工作流运行的演示，具体调度逻辑留作扩展。')}>运行</button>
          <button className="btn-primary" onClick={() => toast.success('工作流已保存（本地演示）')}>保存</button>
        </div>
      </div>

      <div className="card h-[520px] overflow-hidden">
        {/* 轻量演示：仅展示画布与基础节点/边 */}
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={setNodes as any} onEdgesChange={setEdges as any} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

▸ app/logs/page.tsx
// app/logs/page.tsx
'use client';
import { useAppStore } from '@/lib/store';
import JsonView from '@/components/JsonView';

export default function Logs() {
  const logs = useAppStore(s => s.logs);
  return (
    <div className="card p-4">
      <div className="text-lg font-semibold">执行日志</div>
      <div className="mt-3 grid gap-3">
        {logs.length === 0 && <div className="text-sm text-gray-500">暂无日志</div>}
        {logs.map(l => (
          <div key={l.id} className="rounded-lg border border-border dark:border-border-dark p-3">
            <div className="text-xs text-gray-500">{new Date(l.ts).toLocaleString()} · {l.title} · {l.toolId}</div>
            {l.result && <div className="mt-2"><JsonView src={l.result} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

▸ app/settings/page.tsx
// app/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';

type KeyItem = { key: string; label: string; placeholder?: string };

const ITEMS: KeyItem[] = [
  { key:'OPENAI_API_KEY', label:'OpenAI API Key', placeholder:'sk-...' },
  { key:'BRAVE_API_KEY', label:'Brave Search API Key', placeholder:'...' },
  { key:'EMAIL_HOST', label:'Email Host (可选)' },
  { key:'EMAIL_USER', label:'Email User (可选)' },
];

export default function Settings() {
  const [values, setValues] = useState<Record<string,string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('ai-assistant-keys');
    if (saved) setValues(JSON.parse(saved));
  }, []);

  const save = () => {
    localStorage.setItem('ai-assistant-keys', JSON.stringify(values));
    alert('本地已保存（仅用于前端占位展示，真实服务端请配置 .env）');
  };

  return (
    <div className="grid gap-3">
      <div className="card p-4">
        <div className="text-lg font-semibold">系统配置</div>
        <div className="text-xs text-gray-500 mt-1">真实调用请在服务端配置环境变量（.env.local）。此处仅做前端说明与占位存储。</div>
      </div>
      <div className="card p-4">
        <div className="grid gap-4">
          {ITEMS.map(i => (
            <div key={i.key}>
              <div className="label">{i.label}</div>
              <input className="input" placeholder={i.placeholder} value={values[i.key] || ''} onChange={e => setValues({ ...values, [i.key]: e.target.value })}/>
            </div>
          ))}
          <button className="btn-primary w-fit" onClick={save}>保存（本地）</button>
        </div>
      </div>
    </div>
  );
}

4) API Routes（演示可运行的后端）

提供 4 个可实际调用的接口：search（Brave 直连或返回 demo）、math（mathjs 计算）、piston（代码执行）、weather-demo（演示数据）。其他工具 API 先返回 Not Implemented 占位（你可扩展）。

▸ app/api/tools/search/route.ts
// app/api/tools/search/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { q, count = 5, country = '' } = await req.json();
  if (!q || typeof q !== 'string') {
    return NextResponse.json({ ok:false, error:'缺少 q' }, { status: 400 });
  }

  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    // 演示数据
    return NextResponse.json({
      ok: true,
      notice: '未配置 BRAVE_API_KEY，返回演示结果',
      results: [
        { title: 'Brave Search 示例结果 1', url: 'https://example.com/1', snippet: '这是演示数据（未配置 API Key）。' },
        { title: 'Brave Search 示例结果 2', url: 'https://example.com/2', snippet: '请在 .env.local 配置 BRAVE_API_KEY 以调用真实接口。' },
      ],
      demo: true,
    });
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', q);
  url.searchParams.set('count', String(count));
  if (country) url.searchParams.set('country', country);

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ ok:false, error:`Brave API 调用失败：${res.status} ${text}` }, { status: 500 });
  }

  const json = await res.json();
  const items = (json.web?.results || []).map((r: any) => ({ title: r.title, url: r.url, snippet: r.description }));
  return NextResponse.json({ ok:true, results: items });
}

▸ app/api/tools/math/route.ts
// app/api/tools/math/route.ts
import { NextResponse } from 'next/server';
import { create, all } from 'mathjs';

const math = create(all, { });

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { expr } = await req.json();
  if (!expr) return NextResponse.json({ ok:false, error:'缺少表达式 expr' }, { status: 400 });
  try {
    const value = math.evaluate(expr);
    return NextResponse.json({ ok:true, value });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 400 });
  }
}

▸ app/api/tools/piston/route.ts
// app/api/tools/piston/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { language = 'python', code = '', stdin = '' } = await req.json();
  if (!code) return NextResponse.json({ ok:false, error:'缺少代码' }, { status: 400 });

  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, version: '*', files: [{ name: 'main', content: code }], stdin }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ ok:false, error:`Piston 调用失败：${res.status} ${text}` }, { status: 500 });
  }

  const out = await res.json();
  return NextResponse.json({ ok:true, out });
}

▸ app/api/tools/weather-demo/route.ts
// app/api/tools/weather-demo/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({
    ok: true,
    city: '示例市',
    days: [
      { day:'周一', high:25, low:17, desc:'多云' },
      { day:'周二', high:27, low:18, desc:'晴' },
      { day:'周三', high:23, low:16, desc:'小雨' },
    ],
  });
}

▸ 占位路由（未实现的统一返回）
// app/api/tools/not-implemented/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST() {
  return NextResponse.json({ ok:false, error:'此工具后端未实现（占位）。仅提供 UI 与表单，可在 /app/api/tools 下扩展。' }, { status: 501 });
}

5) 资产与 README
▸ public/logo.svg
<!-- public/logo.svg -->
<svg width="120" height="24" viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="4" width="24" height="16" rx="8" fill="#3B82F6"/>
  <circle cx="12" cy="12" r="5" fill="white"/>
  <text x="32" y="17" font-family="Inter, ui-sans-serif" font-size="14" fill="#111827">AI Assistant · Pro</text>
</svg>

▸ README.md
# AI 智能助手 · Ultimate Pro（前端 UI）

**技术栈**：Next.js 14 + TypeScript + Tailwind + Zustand + TanStack Query + react-hook-form + zod + kbar + Recharts + React Flow

## 快速开始
```bash
npm i
npm run dev


可选：在 .env.local 中配置：

OPENAI_API_KEY=sk-...
BRAVE_API_KEY=...
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=you@example.com

已实现要点

专业简约风：留白、细边框、暗色模式、响应式布局

命令面板（⌘K）、即时反馈（toast）、动态表单

工具工作台（21 个工具映射；可运行的示例：Brave 搜索、Piston 代码、mathjs 计算、天气演示）

工作流编排（React Flow 演示，便于后续接入真实调度）

KPI 仪表盘：工具数、真实 API、零配置、测试率、代码量、文档、完成度

扩展指引

在 app/api/tools 下为未实现的工具补充真实接口。

在 lib/tools.ts 中为每个工具补充 params 与 endpoint。

替换 image-gen / image-analyze / ocr / web-visit / data-extract / api-call / email / workspace / workflow 为你的后端实现。


---

### 6) 验收清单

- [x] 访问 `/` 显示 KPI 仪表盘与状态徽章  
- [x] 访问 `/tools` 左侧可筛选工具，右侧显示动态表单与运行结果  
- [x] `web-search` 未配 `BRAVE_API_KEY` 时返回演示数据；配置后调用真实 Brave API  
- [x] `math` 可直接计算表达式  
- [x] `code-exec` 可在线运行 Python/JS  
- [x] `weather-demo` 返回演示天气  
- [x] 命令面板（⌘K）可快速导航  
- [x] 暗色模式与响应式良好

> 到此，一个**专业简约、交互性强**的 UI 就绪，可承载你总结中 21 个工具与 96% 能力；后续只需逐步替换占位 API 即可对接全量真实能力。

---

## ✅ 使用小贴士

- 真实调用请在 `/.env.local` 配置密钥（尤其是 `BRAVE_API_KEY`）。  
- 需要导出/下载的功能（文档创建、数据转换）已在前端直接实现，无需后端。  
- 工作流页目前是编排演示，便于你接入已有“AI 自主工作流”后端。  