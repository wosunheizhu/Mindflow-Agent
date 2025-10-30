'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Sparkles, Zap, Workflow, FileText, Bot, UserCircle2, Mail, Mic, Palette, Users } from 'lucide-react';

export default function Page() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  return (
    <div className="grid gap-6">
      {/* Hero Section */}
      <section className="card p-8 relative overflow-hidden">
        {/* 流动的 sin 曲线背景 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 200">
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {/* 第一条连续 sin 曲线 */}
            <path
              d="M -400 50 Q -300 20, -200 50 Q -100 80, 0 50 Q 100 20, 200 50 Q 300 80, 400 50 Q 500 20, 600 50 Q 700 80, 800 50 Q 900 20, 1000 50 Q 1100 80, 1200 50 Q 1300 20, 1400 50"
              stroke="url(#gradient1)"
              strokeWidth="2"
              fill="none"
              className="animate-flow-1"
            />
            {/* 第二条连续 sin 曲线 */}
            <path
              d="M -400 100 Q -300 130, -200 100 Q -100 70, 0 100 Q 100 130, 200 100 Q 300 70, 400 100 Q 500 130, 600 100 Q 700 70, 800 100 Q 900 130, 1000 100 Q 1100 70, 1200 100 Q 1300 130, 1400 100"
              stroke="url(#gradient1)"
              strokeWidth="1.5"
              fill="none"
              className="animate-flow-2"
              opacity="0.6"
            />
            {/* 第三条连续 sin 曲线 */}
            <path
              d="M -400 150 Q -300 120, -200 150 Q -100 180, 0 150 Q 100 120, 200 150 Q 300 180, 400 150 Q 500 120, 600 150 Q 700 180, 800 150 Q 900 120, 1000 150 Q 1100 180, 1200 150 Q 1300 120, 1400 150"
              stroke="url(#gradient1)"
              strokeWidth="1"
              fill="none"
              className="animate-flow-3"
              opacity="0.4"
            />
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto relative z-10">
          <h1 className="text-4xl mb-4 text-gray-900 dark:text-gray-100" style={{ fontWeight: 900 }}>
            Mindflow Agent
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            首创融合数字员工与 Agentic AI 的新一代个性化协作平台
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/chat" 
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg hover:scale-105"
              onMouseEnter={() => setHoveredCard('chat')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className={`transition-transform ${hoveredCard === 'chat' ? 'scale-110 text-blue-500' : 'text-blue-600 dark:text-blue-400'}`} />
                <div className="font-semibold">立即体验</div>
              </div>
            </Link>
            <a 
              href="mailto:contact@xinliuyuansu.com" 
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-lg hover:scale-105"
              onMouseEnter={() => setHoveredCard('apply')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex items-center gap-2">
                <Mail size={20} className={`transition-transform ${hoveredCard === 'apply' ? 'scale-110 text-purple-500' : 'text-purple-600 dark:text-purple-400'}`} />
                <div className="font-semibold">申请内测</div>
              </div>
            </a>
          </div>
        </div>

        {/* CSS 动画定义 */}
        <style jsx>{`
          @keyframes flow1 {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(400px);
            }
          }
          
          @keyframes flow2 {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(400px);
            }
          }
          
          @keyframes flow3 {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(400px);
            }
          }
          
          .animate-flow-1 {
            animation: flow1 8s linear infinite;
          }
          
          .animate-flow-2 {
            animation: flow2 10s linear infinite;
          }
          
          .animate-flow-3 {
            animation: flow3 12s linear infinite;
          }
        `}</style>
      </section>

      {/* 数字员工和 Agentic AI 介绍 - 左右对齐 */}
      <section className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* 数字员工 */}
        <div 
          className="card p-6 flex flex-col transition-all hover:shadow-xl"
          onMouseEnter={() => setHoveredCard('avatar')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 bg-lime-100 dark:bg-lime-900/30 rounded-lg transition-all ${hoveredCard === 'avatar' ? 'scale-110 rotate-6' : ''}`}>
              <UserCircle2 size={24} className="text-lime-600 dark:text-lime-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">数字员工</h2>
              <p className="text-sm text-gray-500">您的智能语音助理</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="p-4 bg-green-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Mic size={16} className="text-green-600 dark:text-green-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">自然语音交互</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· 实时语音合成，自然流畅的对话体验</div>
                <div>· 支持小岚（女生）和小远（男生）两种声音</div>
                <div>· 智能语音播报工作进展和结果</div>
              </div>
            </div>
            
            <div className="p-4 bg-cyan-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">智能任务分发</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· 理解用户意图，自动生成结构化任务</div>
                <div>· 无缝对接 Agentic AI，实现任务自动化</div>
                <div>· 任务完成后通俗易懂地总结结果</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Palette size={16} className="text-purple-600 dark:text-purple-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">可定制数字员工</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· 自定义数字员工的声音、性格和语言风格</div>
                <div>· 灵活配置工作场景和交互模式</div>
                <div>· 打造专属的智能助理形象</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agentic AI */}
        <div 
          className="card p-6 flex flex-col transition-all hover:shadow-xl"
          onMouseEnter={() => setHoveredCard('agent')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-all ${hoveredCard === 'agent' ? 'scale-110 rotate-6' : ''}`}>
              <Bot size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Agentic AI 智能体</h2>
              <p className="text-sm text-gray-500">自主规划与执行的 AI 助手</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="p-4 bg-purple-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">智能推理</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· 深度思考模式</div>
                <div>· 结构化推理过程</div>
                <div>· 可验证的结果输出</div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">专业工具</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· 网页搜索与数据提取</div>
                <div>· 代码执行与文档生成</div>
                <div>· 数据分析与可视化</div>
              </div>
            </div>
            
            <div className="p-4 bg-green-500 bg-opacity-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 transition-all hover:scale-105 hover:shadow-md cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Workflow size={16} className="text-green-600 dark:text-green-400" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">自主工作流</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div>· AI 自动规划任务步骤</div>
                <div>· 多工具协同执行</div>
                <div>· 可视化编排与监控</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

