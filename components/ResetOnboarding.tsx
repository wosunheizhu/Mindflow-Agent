'use client';
import { RotateCcw } from 'lucide-react';

export default function ResetOnboarding() {
  const handleReset = () => {
    localStorage.removeItem('hasSeenOnboarding');
    window.location.reload();
  };

  return (
    <button
      onClick={handleReset}
      className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-lg text-xs flex items-center gap-2 opacity-50 hover:opacity-100"
      title="重新显示新手引导"
    >
      <RotateCcw size={14} />
      <span>重置引导</span>
    </button>
  );
}

