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






