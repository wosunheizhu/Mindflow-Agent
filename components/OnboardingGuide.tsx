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
    targetId: 'chat-header',
    position: 'bottom' // 提示卡片在标题下方
  },
  {
    id: 'step-2',
    title: '数字员工对话',
    description: '向吩咐真人一样和数字员工对话，让她帮您使用Agentic AI',
    targetId: 'avatar-chat',
    position: 'right' // 改为右侧
  },
  {
    id: 'step-3',
    title: '智能总结开关',
    description: '开启时数字员工会帮您简短的，通俗易懂的总结Agentic AI的回答',
    targetId: 'avatar-toggle',
    position: 'bottom' // 改为下方，避免超出屏幕上方
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
    
    console.log(`🎯 [新手引导] 步骤${currentStep + 1}: 查找元素 #${targetId}`);
    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      console.log(`🎯 [新手引导] 找到元素，位置:`, {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      setTargetRect(rect);
      setRetryCount(0);
      
      // 滚动到目标元素
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`🎯 [新手引导] 元素未找到: #${targetId}, 重试次数: ${retryCount}`);
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
    
    console.log('🎯 [新手引导] 检查引导状态:', hasSeenGuide);
    
    if (!hasSeenGuide) {
      console.log('🎯 [新手引导] 首次访问，立即显示引导');
      // 短暂延迟等待元素渲染完成
      const timer = setTimeout(() => {
        console.log('🎯 [新手引导] 开始显示引导');
        setIsVisible(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🎯 [新手引导] 已看过引导，不再显示');
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

  // 计算提示框位置（确保在屏幕可见范围内）
  const getTooltipStyle = () => {
    const padding = 20;
    const tooltipWidth = 360;
    const tooltipHeight = 300; // 预估高度
    
    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10002,
      width: `${tooltipWidth}px`,
    };

    console.log(`🎯 [新手引导] 计算提示框位置，目标位置: ${step.position}`);
    console.log(`🎯 [新手引导] 窗口大小:`, { width: window.innerWidth, height: window.innerHeight });
    console.log(`🎯 [新手引导] 目标区域:`, targetRect);

    let left = 0;
    let top = 0;

    switch (step.position) {
      case 'right':
        // 尝试放在右侧
        left = targetRect.right + padding;
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        
        // 如果超出右边界，放在左侧
        if (left + tooltipWidth > window.innerWidth - padding) {
          left = targetRect.left - tooltipWidth - padding;
          console.log(`🎯 [新手引导] 右侧空间不足，改为左侧`);
        }
        
        // 确保不超出上下边界
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
        
        style.left = `${left}px`;
        style.top = `${top}px`;
        break;
        
      case 'left':
        // 放在左侧
        left = targetRect.left - tooltipWidth - padding;
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        
        // 如果超出左边界，放在右侧
        if (left < padding) {
          left = targetRect.right + padding;
          console.log(`🎯 [新手引导] 左侧空间不足，改为右侧`);
        }
        
        // 确保不超出上下边界
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
        
        style.left = `${left}px`;
        style.top = `${top}px`;
        break;
        
      case 'top':
        // 放在上方
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.top - tooltipHeight - padding;
        
        // 如果超出上边界，放在下方
        if (top < padding) {
          top = targetRect.bottom + padding;
          console.log(`🎯 [新手引导] 上方空间不足，改为下方`);
        }
        
        // 确保不超出左右边界
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
        
        style.left = `${left}px`;
        style.top = `${top}px`;
        break;
        
      case 'bottom':
        // 放在下方
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.bottom + padding;
        
        // 如果超出下边界，放在上方
        if (top + tooltipHeight > window.innerHeight - padding) {
          top = targetRect.top - tooltipHeight - padding;
          console.log(`🎯 [新手引导] 下方空间不足，改为上方`);
        }
        
        // 确保不超出左右边界
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
        
        style.left = `${left}px`;
        style.top = `${top}px`;
        break;
    }

    console.log(`🎯 [新手引导] 最终提示框位置:`, style);
    return style;
  };

  return (
    <>
      {/* 四块遮罩层 - 镂空效果，只让高亮区域清晰 */}
      {/* 上方遮罩 */}
      <div 
        className="fixed left-0 right-0 bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ 
          zIndex: 9999,
          top: 0,
          height: `${Math.max(0, targetRect.top - 8)}px`
        }}
      />
      
      {/* 下方遮罩 */}
      <div 
        className="fixed left-0 right-0 bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ 
          zIndex: 9999,
          top: `${targetRect.bottom + 8}px`,
          bottom: 0
        }}
      />
      
      {/* 左侧遮罩 */}
      <div 
        className="fixed bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ 
          zIndex: 9999,
          left: 0,
          top: `${targetRect.top - 8}px`,
          width: `${Math.max(0, targetRect.left - 8)}px`,
          height: `${targetRect.height + 16}px`
        }}
      />
      
      {/* 右侧遮罩 */}
      <div 
        className="fixed bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ 
          zIndex: 9999,
          left: `${targetRect.right + 8}px`,
          top: `${targetRect.top - 8}px`,
          right: 0,
          height: `${targetRect.height + 16}px`
        }}
      />

      {/* 高亮边框 */}
      <div
        className="fixed border-4 border-blue-500 rounded-lg pointer-events-none transition-all duration-500 animate-pulse-slow"
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-blue-500"
        style={{
          ...getTooltipStyle(),
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
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
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            opacity: 0.9;
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}

