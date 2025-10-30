'use client';
import { TOOL_DEFS } from '@/lib/tools';
import { cn } from '@/lib/utils';

export default function ToolCard({ id, onSelect, isActive }: { id: string; onSelect: (id: string) => void; isActive?: boolean }) {
  const tool = TOOL_DEFS.find(t => t.id === id)!;
  const Icon = tool.icon;
  return (
    <button 
      onClick={() => onSelect(id)} 
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        isActive 
          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-md" 
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[rgb(22,23,24)] hover:border-blue-400 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        )}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">{tool.name}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{tool.description}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {tool.category}
            </span>
            {tool.zeroConfig && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                零配置
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

