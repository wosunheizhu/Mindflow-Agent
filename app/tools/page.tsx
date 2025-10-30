'use client';
import { useState } from 'react';
import { TOOL_DEFS } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import ToolRunner from '@/components/ToolRunner';

export default function ToolsPage() {
  const [active, setActive] = useState<string>('web-search');
  const categories = ['全部','基础','文件','内容','数据'] as const;
  const [cat, setCat] = useState<(typeof categories)[number]>('全部');

  const list = TOOL_DEFS.filter(t => cat === '全部' ? true : t.category === cat);

  return (
    <div className="grid gap-4">
      {/* 顶部标题栏 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">工具工作台</h1>
            <p className="text-sm text-gray-500 mt-1">选择工具，填写参数，运行查看结果</p>
          </div>
          <div className="text-sm text-gray-500">
            共 {TOOL_DEFS.length} 个工具
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button 
              key={c} 
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                c === cat 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )} 
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 工具内容区 */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          {/* 固定高度的可滚动容器，与右侧卡片底端齐平 */}
          <div className="card p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div className="grid gap-2">
            {list.map(t => (
              <ToolCard key={t.id} id={t.id} onSelect={setActive} isActive={t.id === active} />
            ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <ToolRunner toolId={active} />
        </div>
      </div>
    </div>
  );
}

// 导入 cn 函数
import { cn } from '@/lib/utils';

