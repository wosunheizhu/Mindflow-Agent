'use client';

export default function JsonView({ src }: { src: any }) {
  // 使用原生 JSON.stringify，避免第三方库加载问题
  return (
    <pre className="text-xs overflow-auto max-h-60 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
      <code className="text-gray-800 dark:text-gray-200">
        {JSON.stringify(src, null, 2)}
      </code>
    </pre>
  );
}




