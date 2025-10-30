'use client';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function ChartPreview({ type, data }: { type: 'bar'|'line'|'pie'; data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) return <div className="text-sm text-gray-500">无数据</div>;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Line dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip /><Legend />
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={110} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}




