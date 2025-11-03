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






