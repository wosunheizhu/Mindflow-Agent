'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
            const keys = [...new Set(arr.flatMap((o: any) => Object.keys(o)))] as string[];
            const csv = [keys.join(','), ...arr.map((o: any) => keys.map((k: string) => JSON.stringify(o[k] ?? '')).join(','))].join('\n');
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
          
          // 检查是否包含文件参数
          const hasFileParam = (tool.params || []).some(p => p.type === 'file');
          let fetchOptions: RequestInit;
          
          if (hasFileParam && method === 'POST') {
            // 使用 FormData 上传文件
            const formData = new FormData();
            for (const [key, value] of Object.entries(values)) {
              if (value instanceof FileList && value.length > 0) {
                formData.append(key, value[0]);
              } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
            fetchOptions = { method, body: formData };
          } else {
            // 使用 JSON 发送数据
            fetchOptions = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'GET' ? undefined : JSON.stringify(values)
            };
          }
          
          const res = await fetch(tool.endpoint || '/api/tools/not-implemented', fetchOptions);
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
            {/* 通用 JSON 视图 - 添加溢出处理 */}
            <div className="rounded-lg border border-border dark:border-border-dark p-2 max-h-[600px] overflow-auto break-words">
              <JsonView src={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




