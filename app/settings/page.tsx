'use client';
import { useState, useEffect } from 'react';
import LoginPrompt from '@/components/LoginPrompt';
import LoginModal from '@/components/LoginModal';
import { Lock } from 'lucide-react';

type KeyItem = { key: string; label: string; placeholder?: string; type?: string; options?: {label: string, value: string}[] };

const ITEMS: KeyItem[] = [
  { 
    key:'AI_PROVIDER', 
    label:'AI 服务提供商', 
    type:'select',
    options:[
      {label:'OpenAI (GPT-4o)', value:'openai'},
      {label:'Ollama (本地模型)', value:'ollama'}
    ]
  },
  { key:'OPENAI_API_KEY', label:'OpenAI API Key', placeholder:'sk-...' },
  { key:'OLLAMA_BASE_URL', label:'Ollama 服务地址', placeholder:'http://localhost:11434' },
  { key:'OLLAMA_MODEL', label:'Ollama 模型名称', placeholder:'gpt-oss-20b' },
  { key:'BRAVE_API_KEY', label:'Brave Search API Key', placeholder:'...' },
  { key:'EMAIL_HOST', label:'Email Host (可选)' },
  { key:'EMAIL_USER', label:'Email User (可选)' },
];

export default function Settings() {
  const [values, setValues] = useState<Record<string,string>>({});
  const [aiProvider, setAiProvider] = useState('ollama');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    const saved = localStorage.getItem('ai-assistant-keys');
    if (saved) {
      const parsed = JSON.parse(saved);
      setValues(parsed);
      setAiProvider(parsed.AI_PROVIDER || 'ollama');
    }
  }, []);

  const save = () => {
    localStorage.setItem('ai-assistant-keys', JSON.stringify(values));
    alert('本地已保存（仅用于前端占位展示，真实服务端请配置 .env.local）');
  };

  const handleProviderChange = (provider: string) => {
    setAiProvider(provider);
    setValues({ ...values, AI_PROVIDER: provider });
  };

  return (
    <div className="relative">
      {/* 未登录遮罩层 - 只覆盖内容区域 */}
      {!isLoggedIn && (
        <>
          {/* 遮罩层 - 只覆盖主内容，不覆盖侧边栏 */}
          <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center rounded-lg">
            {/* 提示卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-2 border-blue-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Lock size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  需要登录
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  设置功能需要登录后才能访问
                </p>
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setShowLogin(true);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  立即登录
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 主内容（未登录时禁止交互，但不模糊） */}
      <div className={`grid gap-3 ${!isLoggedIn ? 'pointer-events-none' : ''}`}>
      <div className="card p-4">
        <div className="text-lg font-semibold">AI 模型配置</div>
        <div className="text-xs text-gray-500 mt-1">
          真实调用请在服务端配置环境变量（.env.local）。此处仅做前端说明与占位存储。
        </div>
      </div>

      {/* AI 服务选择 */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-3">AI 服务配置</div>
        <div className="grid gap-4">
          <div>
            <div className="label">AI 服务提供商</div>
            <select 
              className="select" 
              value={aiProvider} 
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="ollama">Ollama (本地模型)</option>
            </select>
          </div>

          {aiProvider === 'openai' && (
            <>
              <div>
                <div className="label">OpenAI API Key</div>
                <input 
                  className="input" 
                  placeholder="sk-..." 
                  value={values.OPENAI_API_KEY || ''} 
                  onChange={e => setValues({ ...values, OPENAI_API_KEY: e.target.value })}
                />
              </div>
            </>
          )}

          {aiProvider === 'ollama' && (
            <>
              <div>
                <div className="label">Ollama 服务地址</div>
                <input 
                  className="input" 
                  placeholder="http://localhost:11434" 
                  value={values.OLLAMA_BASE_URL || ''} 
                  onChange={e => setValues({ ...values, OLLAMA_BASE_URL: e.target.value })}
                />
              </div>
              <div>
                <div className="label">Ollama 模型名称</div>
                <input 
                  className="input" 
                  placeholder="gpt-oss:20b" 
                  value={values.OLLAMA_MODEL || ''} 
                  onChange={e => setValues({ ...values, OLLAMA_MODEL: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 其他配置 */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-3">其他 API 配置</div>
        <div className="grid gap-4">
          <div>
            <div className="label">Brave Search API Key</div>
            <input 
              className="input" 
              placeholder="..." 
              value={values.BRAVE_API_KEY || ''} 
              onChange={e => setValues({ ...values, BRAVE_API_KEY: e.target.value })}
            />
          </div>
          <div>
            <div className="label">Email Host (可选)</div>
            <input 
              className="input" 
              value={values.EMAIL_HOST || ''} 
              onChange={e => setValues({ ...values, EMAIL_HOST: e.target.value })}
            />
          </div>
          <div>
            <div className="label">Email User (可选)</div>
            <input 
              className="input" 
              value={values.EMAIL_USER || ''} 
              onChange={e => setValues({ ...values, EMAIL_USER: e.target.value })}
            />
          </div>
          <button className="btn-primary w-fit" onClick={save}>保存（本地）</button>
        </div>
      </div>

      {/* 配置说明 */}
      <div className="card p-4">
        <div className="text-base font-semibold mb-3">配置说明</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <div><strong>Ollama 配置步骤：</strong></div>
          <div>1. 确保 Ollama 服务正在运行：<code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama serve</code></div>
          <div>2. 下载并运行模型：<code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama pull gpt-oss-20b</code></div>
          <div>3. 在 .env.local 中设置：</div>
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono">
            AI_PROVIDER=ollama<br/>
            OLLAMA_BASE_URL=http://localhost:11434<br/>
            OLLAMA_MODEL=gpt-oss-20b
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ⚠️ 注意：Ollama 模式下工具调用功能将被禁用，因为本地模型不支持 OpenAI 格式的工具调用。
          </div>
        </div>
      </div>
    </div>
    
    {/* 登录弹窗 */}
    <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}


