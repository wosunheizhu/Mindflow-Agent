'use client';
import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right';
};

const steps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Agentic AI 自主编排',
    description: 'Agentic AI具有自主编排工作流的能力，可以帮您完成复杂任务',
    targetId: 'chat-container',
    position: 'right'
  },
  {
    id: 'step-2',
    title: '数字员工对话',
    description: '向吩咐真人一样和数字员工对话，让她帮您使用Agentic AI',
    targetId: 'avatar-chat',
    position: 'left'
  },
  {
    id: 'step-3',
    title: '智能总结开关',
    description: '开启时数字员工会帮您简短的，通俗易懂的总结Agentic AI的回答',
    targetId: 'avatar-toggle',
    position: 'top'
  }
];

export default function OnboardingGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const updateTargetPosition = () => {
    const targetId = steps[currentStep]?.targetId;
    if (!targetId) return;
    
    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setRetryCount(0);
      
      // 滚动到目标元素
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`引导目标元素未找到: ${targetId}, 重试次数: ${retryCount}`);
      // 如果找不到元素且重试次数小于5次，延迟重试
      if (retryCount < 5) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 500);
      }
    }
  };

  useEffect(() => {
    // 检查是否已经看过引导
    const hasSeenGuide = localStorage.getItem('hasSeenOnboarding');
    
    if (!hasSeenGuide) {
      // 延迟2秒显示引导，等待页面完全加载和元素渲染
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateTargetPosition();
      
      // 监听窗口大小变化
      const handleResize = () => updateTargetPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible, currentStep, retryCount]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !targetRect) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // 计算提示框位置
  const getTooltipStyle = () => {
    const padding = 20;
    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10001,
      maxWidth: '320px',
    };

    switch (step.position) {
      case 'right':
        style.left = `${targetRect.right + padding}px`;
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.right = `${window.innerWidth - targetRect.left + padding}px`;
        style.top = `${targetRect.top + targetRect.height / 2}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'top':
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.bottom = `${window.innerHeight - targetRect.top + padding}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.left = `${targetRect.left + targetRect.width / 2}px`;
        style.top = `${targetRect.bottom + padding}px`;
        style.transform = 'translateX(-50%)';
        break;
    }

    return style;
  };

  return (
    <>
      {/* 遮罩层 - 让其他区域变暗 */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        style={{ zIndex: 9999 }}
        onClick={handleSkip}
      />

      {/* 高亮区域 - 镂空效果 */}
      <div
        className="fixed border-4 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-500 animate-pulse-slow"
        style={{
          zIndex: 10000,
          left: `${targetRect.left - 8}px`,
          top: `${targetRect.top - 8}px`,
          width: `${targetRect.width + 16}px`,
          height: `${targetRect.height + 16}px`,
        }}
      />

      {/* 提示卡片 */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-blue-500 animate-slide-in"
        style={getTooltipStyle()}
      >
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              步骤 {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {step.title}
        </h3>

        {/* 描述 */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          {step.description}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            跳过引导
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            {currentStep < steps.length - 1 ? (
              <>
                下一步
                <ChevronRight size={16} />
              </>
            ) : (
              '开始使用'
            )}
          </button>
        </div>
      </div>

      {/* 自定义动画 */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

