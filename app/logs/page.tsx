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




