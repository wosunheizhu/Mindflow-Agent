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






