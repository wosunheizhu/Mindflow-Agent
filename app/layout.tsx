import './globals.css';
import type { Metadata } from 'next';
import LayoutShell from '@/components/LayoutShell';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Evercall Agent',
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

