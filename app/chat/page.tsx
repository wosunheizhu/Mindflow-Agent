'use client';
import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { Send, User, Bot, Loader2, Wrench, Check, ChevronDown, ChevronUp, Brain, Upload, Image, FileText, X, Search, UserCircle2, Volume2, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import JsonView from '../../components/JsonView';
import FilePreview from '../../components/FilePreview';
import LoginPrompt from '../../components/LoginPrompt';
import LoginModal from '../../components/LoginModal';
import OnboardingGuide from '../../components/OnboardingGuide';
import ResetOnboarding from '../../components/ResetOnboarding';
import Linkify from '../../components/Linkify';

type ToolCall = {
  tool: string;
  args: any;
  result?: any;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  thinkingSteps?: string[];
  reasoningContent?: string; // Agentic AI的推理过程（GPT-5等推理模型）
  modelThinking?: string; // 模型思考过程
  fromAvatar?: boolean; // 标记消息是否来自数字员工
  avatarName?: string; // 数字员工名字
  avatarImage?: string; // 数字员工头像路径
};

// 音色配置
const voiceConfigs: Record<string, {name: string, rate: number, pitch: number, volume: number}> = {
  'zh_female_sajiaonvyou_moon_bigtts': { name: '小岚', rate: 1.05, pitch: 1.3, volume: 0.9 },
  'zh_male_shaonianzixin_moon_bigtts': { name: '小远', rate: 1.05, pitch: 0.9, volume: 1.0 },
};

function getVoiceName(voiceId: string): string {
  return voiceConfigs[voiceId]?.name || '数字员工';
}

function getVoiceConfig(voiceId: string) {
  return voiceConfigs[voiceId] || { name: '数字员工', rate: 1.0, pitch: 1.0, volume: 1.0 };
}

// Base64转Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export default function ChatPage() {
  // 使用固定的初始值以避免 hydration 错误
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 深度思考设置：开关 + 等级（low/medium/high）
  // 使用固定的初始值以避免 hydration 错误
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState<boolean>(false);
  const [deepThinkingLevel, setDeepThinkingLevel] = useState<'low'|'medium'|'high'>('medium');
  
  // 在客户端挂载后从 localStorage 读取
  useEffect(() => {
    const savedEnabled = localStorage.getItem('deep_thinking_enabled');
    if (savedEnabled !== null) {
      setDeepThinkingEnabled(savedEnabled === 'true');
    }
    
    const savedLevel = localStorage.getItem('deep_thinking_level') as 'low'|'medium'|'high' | null;
    if (savedLevel) {
      setDeepThinkingLevel(savedLevel);
    }
  }, []);
  
  const [browserSearch, setBrowserSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gpt5-thinking' | 'gpt5-pro' | 'claude'>('openai');
  const [avatarEnabled, setAvatarEnabled] = useState(true); // 数字员工功能开关（默认开启）
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // 登录提示弹窗
  const [showLogin, setShowLogin] = useState(false); // 登录弹窗
  
  // 从localStorage读取数字员工选择（由左侧数字员工框控制）
  const getSelectedVoice = () => {
    if (typeof window === 'undefined') {
      return 'zh_female_sajiaonvyou_moon_bigtts';
    }
    return localStorage.getItem('selected_avatar_voice') || 'zh_female_sajiaonvyou_moon_bigtts';
  };
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [thinkingProcess, setThinkingProcess] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isSubmittingRef = useRef(false); // 防止重复提交标记
  const messagesRef = useRef<Message[]>(messages); // 保持最新 messages 的引用
  const selectedModelRef = useRef(selectedModel); // 保持最新 selectedModel 的引用
  
  // 更新 messagesRef，确保总是指向最新的 messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // 更新 selectedModelRef，确保总是指向最新的 selectedModel
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // 在客户端挂载后从 localStorage 恢复聊天记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        console.log(`💾 [聊天记录] 从 localStorage 恢复了 ${parsed.length} 条消息`);
      }
    } catch (e) {
      console.error('恢复聊天记录失败:', e);
    }
  }, []); // 只在挂载时执行一次

  // 同步深度思考设置到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('deep_thinking_enabled', String(deepThinkingEnabled));
      localStorage.setItem('deep_thinking_level', deepThinkingLevel);
    }
  }, [deepThinkingEnabled, deepThinkingLevel]);

  // 保存聊天记录到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('chat_messages', JSON.stringify(messages));
        console.log(`💾 [聊天记录] 已保存 ${messages.length} 条消息到 localStorage`);
      } catch (e) {
        console.error('保存聊天记录失败:', e);
      }
    }
  }, [messages]);

  // 添加浏览器级别的提示（刷新/关闭页面/切换标签时）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = 'Agentic AI 任务正在执行中，离开页面将终止任务。是否确认离开？';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading]);

  useEffect(() => {
    audioRef.current = new Audio();
    if (audioRef.current) {
      audioRef.current.preload = 'auto';
    }
    
    // 初始化Agent工作状态
    localStorage.setItem('agent_working', 'false');

    // 防重复：记录最后处理的提示词
    let lastProcessedPrompt = '';
    let lastProcessedTime = 0;

    // 监听数字员工发送的任务
    const handleAvatarTask = (event: CustomEvent) => {
      const { prompt, avatarName, avatarImage } = event.detail;
      const now = Date.now();
      
      console.log(`📨 [主页面] 收到 avatar_agent_task 事件: ${prompt.substring(0, 50)}...`);
      console.log(`📊 [主页面] isSubmittingRef.current = ${isSubmittingRef.current}`);
      console.log(`📊 [主页面] lastProcessedPrompt = "${lastProcessedPrompt.substring(0, 30)}..."`);
      console.log(`📊 [主页面] 时间差 = ${now - lastProcessedTime}ms`);
      
      // 防重复：如果1秒内收到相同的提示词，忽略
      if (prompt === lastProcessedPrompt && (now - lastProcessedTime) < 1000) {
        console.log(`⚠️ [主页面] 检测到重复任务（1秒内相同提示词），忽略`);
        return;
      }
      
      lastProcessedPrompt = prompt;
      lastProcessedTime = now;
      
      console.log(`✅ [主页面] 通过防重复检查，继续处理任务`);
      
      // 创建一个来自数字员工的消息
      const avatarMessage: Message = {
        role: 'user',
        content: prompt,
        fromAvatar: true,
        avatarName: avatarName,
        avatarImage: avatarImage
      };
      
      // 防止重复提交：如果正在提交，忽略
      if (isSubmittingRef.current) {
        console.log(`⚠️ 检测到重复提交，忽略（正在处理中）`);
        return;
      }
      
      isSubmittingRef.current = true;
      
      // 添加到消息列表（使用 ref 获取最新状态）
      const newMessages = [...messagesRef.current, avatarMessage];
      setMessages(newMessages);
      
      // 延迟提交，确保状态已更新
      setTimeout(() => {
        handleSubmitFromAvatar(newMessages);
        // 1秒后重置标记（允许新任务）
        setTimeout(() => {
          isSubmittingRef.current = false;
        }, 1000);
      }, 100);
    };

    window.addEventListener('avatar_agent_task' as any, handleAvatarTask as any);
    
    return () => {
      window.removeEventListener('avatar_agent_task' as any, handleAvatarTask as any);
    };
  }, []); // 空依赖，只注册一次

  const ensureAudioUnlocked = async () => {
    try {
      // 解锁AudioContext（Safari/移动端需要用户手势后resume）
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'running') {
          await audioCtxRef.current.resume();
        }
      }
    } catch (e) {}
  };

  const toggleToolExpand = (messageIdx: number, toolIdx: number) => {
    const key = `${messageIdx}-${toolIdx}`;
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 只在用户发送消息时自动滚动，生成过程中不强制滚动
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    if (shouldAutoScroll.current) {
    scrollToBottom();
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    toast.success(`已添加 ${files.length} 个文件`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // 语音录制功能 - 已禁用，改用登录提示
  // startRecording 和 stopRecording 已移除

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('🛑 录音结束', { duration: 1000 });
    }
  };

  // 处理麦克风按钮点击 - 显示登录提示
  const handleMicClick = () => {
    if (isRecording) {
      // 如果正在录音，停止录音
      stopRecording();
    } else {
      // 显示登录提示
      setShowLoginPrompt(true);
    }
  };

  // 处理来自数字员工的任务提交
  const handleSubmitFromAvatar = async (newMessages: Message[]) => {
    if (loading) {
      toast.error('Agentic AI 正在处理任务，请稍后');
      return;
    }

    shouldAutoScroll.current = true; // 数字员工发送任务时自动滚动到底部
    setLoading(true);
    localStorage.setItem('agent_working', 'true');
    setThinkingProcess([]);

    try {
      await ensureAudioUnlocked();
      
      // 使用 ref 获取最新的 selectedModel（避免闭包陷阱）
      const currentModel = selectedModelRef.current;
      console.log(`🚀 [数字员工任务] 使用模型: ${currentModel}`);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          // 兼容旧字段
          deepThinking: deepThinkingEnabled,
          // 新字段：显式控制 GPT-5 Responses 的 reasoning.effort
          reasoning: deepThinkingEnabled ? { effort: deepThinkingLevel } : { effort: 'low' },
          deepThinkingEnabled,
          deepThinkingLevel,
          browserSearch: browserSearch,
          avatarEnabled: avatarEnabled,
          avatarVoice: getSelectedVoice(),
          modelProvider: currentModel, // 使用 ref 中的最新值
          hasFiles: false
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let currentToolCalls: ToolCall[] = [];
      let currentThinkingSteps: string[] = [];
      let modelThinkingContent = '';
      let reasoningContent = '';  // Agentic AI推理内容
      let sseBuffer = '';

      // === 新增：avatar 总结只触发一次（只在最终阶段触发） ===
      // 会话内暂存最后一条 avatar_audio 的内容与元信息
      let _avatarFinalReady = false;         // 是否进入"可安全输出最终总结"的阶段（收到 reasoning_complete 或流结束）
      let _avatarSummaryPlayed = false;      // 已经触发过最终总结
      let _avatarLastSummary: null | {
        text: string;
        voice: string;
        duration?: number;
        audioBase64?: string;
      } = null;

      // 统一封装：真正触发一次 avatar 总结（仅在满足条件且未播过时执行）
      const _playAvatarSummaryOnce = async () => {
        if (_avatarSummaryPlayed || !_avatarLastSummary) return;
        const { text, voice, duration, audioBase64 } = _avatarLastSummary;
        if (!text || !text.trim()) return;
        _avatarSummaryPlayed = true;

        // 1) 通知数字员工组件显示总结气泡
        try {
          window.dispatchEvent(new CustomEvent('agent_avatar_message', {
            detail: {
              type: 'avatar_summary',
              text: text.trim(),
              voice: voice,
              duration: duration || 3000
            }
          }));
        } catch {}

        // 2) 如果带音频则播放（与原逻辑一致）
        if (audioBase64) {
          try {
            await ensureAudioUnlocked();
            const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.onended = () => {
                URL.revokeObjectURL(audioUrl);
              };
              await audioRef.current.play().catch(() => {});
            }
          } catch {}
        }
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // SSE 读流结束：兜底触发一次（若此前未播且有缓存）
            _avatarFinalReady = true;
            if (!_avatarSummaryPlayed && _avatarLastSummary) {
              await _playAvatarSummaryOnce();
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const evt of events) {
            const dataPayload = evt
              .split('\n')
              .filter(l => l.startsWith('data: '))
              .map(l => l.slice(6))
              .join('\n');
            if (!dataPayload) continue;
            if (dataPayload === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataPayload);
                
                if (parsed.type === 'content' && parsed.content) {
                  assistantMessage += parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage,
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'reasoning_stream' && parsed.content) {
                  reasoningContent += parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在推理中...',
                    reasoningContent: reasoningContent,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'reasoning_complete' && parsed.content) {
                  // 记录推理完整体
                  reasoningContent = parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage,
                    reasoningContent: reasoningContent,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                  
                  // 标记可以安全输出最终总结
                  _avatarFinalReady = true;
                  if (!_avatarSummaryPlayed && _avatarLastSummary) {
                    await _playAvatarSummaryOnce();
                  }
                } else if (parsed.type === 'thinking' && parsed.content) {
                  currentThinkingSteps.push(parsed.content);
                  setThinkingProcess(prev => [...prev, parsed.content]);
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在深度思考...',
                    thinkingSteps: currentThinkingSteps
                  }]);
                } else if (parsed.type === 'tool_call') {
                  currentToolCalls.push({ tool: parsed.tool, args: parsed.args });
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在使用工具...',
                    toolCalls: currentToolCalls,
                    reasoningContent: reasoningContent || undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'tool_result') {
                  const idx = currentToolCalls.findIndex(t => t.tool === parsed.tool && !t.result);
                  if (idx !== -1) {
                    currentToolCalls[idx].result = parsed.result;
                    setMessages([...newMessages, { 
                      role: 'assistant', 
                      content: assistantMessage,
                      toolCalls: currentToolCalls,
                      reasoningContent: reasoningContent || undefined,
                      thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                    }]);
                  }
                } else if (parsed.type === 'avatar_start') {
                  // 数字员工开始总结
                  console.log('🎤 [数字员工任务] 数字员工开始总结...');
                } else if (parsed.type === 'avatar_audio') {
                  // 仅缓存"最后一条"avatar 总结，不立刻播报
                  const currentVoice = parsed.voice || getSelectedVoice();
                  const text = (parsed.summaryText || '').trim();

                  // 可选的"内容级"过滤：丢弃早期的"马上处理"类型（防止误判为最终总结）
                  if (text && /^马上处理/.test(text)) {
                    // 仍允许后续的真正总结覆盖缓存
                    // 不写入 _avatarLastSummary，直接跳过
                  } else {
                    _avatarLastSummary = {
                      text,
                      voice: currentVoice,
                      duration: parsed.duration,
                      audioBase64: parsed.audioBase64
                    };
                  }

                  // 如果已经进入最终阶段（_avatarFinalReady），且还没播过，则立刻播一次
                  if (_avatarFinalReady && !_avatarSummaryPlayed) {
                    await _playAvatarSummaryOnce();
                  }
                } else if (parsed.type === 'audio_segment' && parsed.audioBase64) {
                  // 处理音频...
                }
              } catch (e) {
                console.error('解析SSE失败:', e);
              }
          }
        }
      }

      // 兜底：若服务端异常或前端未拼出任何文本，显示简洁错误信息
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: assistantMessage && assistantMessage.trim().length > 0 
          ? assistantMessage 
          : '响应为空，请重试',
        toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
        reasoningContent: reasoningContent || undefined,
        modelThinking: modelThinkingContent || undefined,
        thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
      }]);
    } catch (error) {
      console.error('处理数字员工任务错误:', error);
      toast.error('处理任务失败');
      setMessages([...newMessages, { role: 'assistant', content: '抱歉，处理请求时出错。' }]);
    } finally {
      setLoading(false);
      localStorage.setItem('agent_working', 'false');
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || loading) return;

    let messageContent = input;
    let uploadedFilePaths: string[] = [];

    // 如果有上传的文件，先上传到服务器
    if (uploadedFiles.length > 0) {
      try {
        const formData = new FormData();
        uploadedFiles.forEach(file => formData.append('files', file));

        const uploadRes = await fetch('/api/upload-chat', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedFilePaths = uploadData.files.map((f: any) => f.filename);
          const fileInfo = uploadData.files.map((f: any) => `[${f.type.startsWith('image/') ? '图片' : '文件'}: ${f.filename}]`).join(' ');
          messageContent = `${fileInfo}\n\n${input || '请分析这些文件'}`;
          toast.success('文件上传成功');
        }
      } catch (err) {
        toast.error('文件上传失败');
        setLoading(false);
        return;
      }
    }

    const userMessage: Message = { role: 'user', content: messageContent };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    shouldAutoScroll.current = true; // 用户发送消息时自动滚动到底部
    setInput('');
    setUploadedFiles([]);
    setLoading(true);
    localStorage.setItem('agent_working', 'true'); // 通知数字员工：Agent开始工作
    setThinkingProcess([]); // 重置思考过程

    try {
      await ensureAudioUnlocked();
      
      // 使用 ref 获取最新的 selectedModel（保持代码一致性）
      const currentModel = selectedModelRef.current;
      console.log(`🚀 [主聊天] 使用模型: ${currentModel}`);
      console.log(`🧠 [主聊天] 深度思考: ${deepThinkingEnabled}, 等级: ${deepThinkingLevel}`);
      
      const requestBody = { 
        messages: newMessages,
        // 兼容旧字段
        deepThinking: deepThinkingEnabled,
        // 新字段：显式控制 GPT-5 Responses 的 reasoning.effort
        reasoning: deepThinkingEnabled ? { effort: deepThinkingLevel } : { effort: 'low' },
        deepThinkingEnabled,
        deepThinkingLevel,
        browserSearch: browserSearch,
        avatarEnabled: avatarEnabled,
        avatarVoice: getSelectedVoice(), // 从localStorage读取
        modelProvider: currentModel, // 使用 ref 中的最新值
        hasFiles: uploadedFiles.length > 0
      };
      
      console.log(`📤 [主聊天] 发送请求:`, requestBody);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 [主聊天] 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [主聊天] 请求失败: ${response.status}, 响应: ${errorText}`);
        throw new Error(`请求失败: ${response.status}`);
      }

      console.log(`📖 [主聊天] 开始读取响应流...`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let currentToolCalls: ToolCall[] = [];
      let currentThinkingSteps: string[] = [];
      let modelThinkingContent = '';
      let reasoningContent = '';  // Agentic AI推理内容
      let sseBuffer = '';
      let chunkCount = 0;

      // === 新增：avatar 总结只触发一次（只在最终阶段触发） ===
      // 会话内暂存最后一条 avatar_audio 的内容与元信息
      let _avatarFinalReady = false;         // 是否进入"可安全输出最终总结"的阶段（收到 reasoning_complete 或流结束）
      let _avatarSummaryPlayed = false;      // 已经触发过最终总结
      let _avatarLastSummary: null | {
        text: string;
        voice: string;
        duration?: number;
        audioBase64?: string;
      } = null;

      // 统一封装：真正触发一次 avatar 总结（仅在满足条件且未播过时执行）
      const _playAvatarSummaryOnce = async () => {
        if (_avatarSummaryPlayed || !_avatarLastSummary) return;
        const { text, voice, duration, audioBase64 } = _avatarLastSummary;
        if (!text || !text.trim()) return;
        _avatarSummaryPlayed = true;

        // 1) 通知数字员工组件显示总结气泡
        try {
          window.dispatchEvent(new CustomEvent('agent_avatar_message', {
            detail: {
              type: 'avatar_summary',
              text: text.trim(),
              voice: voice,
              duration: duration || 3000
            }
          }));
        } catch {}

        // 2) 如果带音频则播放（与原逻辑一致）
        if (audioBase64) {
          try {
            await ensureAudioUnlocked();
            const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.onended = () => {
                URL.revokeObjectURL(audioUrl);
              };
              await audioRef.current.play().catch(() => {});
            }
          } catch {}
        }
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // SSE 读流结束：兜底触发一次（若此前未播且有缓存）
            _avatarFinalReady = true;
            if (!_avatarSummaryPlayed && _avatarLastSummary) {
              await _playAvatarSummaryOnce();
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const evt of events) {
            const dataPayload = evt
              .split('\n')
              .filter(l => l.startsWith('data: '))
              .map(l => l.slice(6))
              .join('\n');
            if (!dataPayload) continue;
            if (dataPayload === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataPayload);
                
                if (parsed.type === 'content' && parsed.content) {
                  assistantMessage += parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage,
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'reasoning_stream' && parsed.content) {
                  // 处理Agentic AI的推理过程流式输出
                  reasoningContent += parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在推理中...',
                    reasoningContent: reasoningContent,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'reasoning_complete' && parsed.content) {
                  // 记录推理完整体
                  reasoningContent = parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage,
                    reasoningContent: reasoningContent,
                    modelThinking: modelThinkingContent || undefined,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                  
                  // 标记可以安全输出最终总结
                  _avatarFinalReady = true;
                  if (!_avatarSummaryPlayed && _avatarLastSummary) {
                    await _playAvatarSummaryOnce();
                  }
                } else if (parsed.type === 'thinking' && parsed.content) {
                  // 处理思考过程 - 保存到消息中
                  currentThinkingSteps.push(parsed.content);
                  setThinkingProcess(prev => [...prev, parsed.content]);
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在深度思考...',
                    thinkingSteps: currentThinkingSteps
                  }]);
                } else if (parsed.type === 'model_thinking_stream' && parsed.content) {
                  // 实时接收模型thinking流（Ollama等）
                  modelThinkingContent += parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '模型正在分析...',
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'model_thinking' && parsed.content) {
                  // 处理完整的模型thinking内容（Ollama等）
                  modelThinkingContent = parsed.content;
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '分析完成...',
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent,
                    toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'tool_call') {
                  currentToolCalls.push({
                    tool: parsed.tool,
                    args: parsed.args
                  });
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '正在调用工具...',
                    toolCalls: currentToolCalls,
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent || undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'tool_result') {
                  const lastToolCall = currentToolCalls[currentToolCalls.length - 1];
                  if (lastToolCall) {
                    lastToolCall.result = parsed.result;
                  }
                  setMessages([...newMessages, { 
                    role: 'assistant', 
                    content: assistantMessage || '工具执行完成，正在生成回复...',
                    toolCalls: currentToolCalls,
                    reasoningContent: reasoningContent || undefined,
                    modelThinking: modelThinkingContent || undefined,
                    thinkingSteps: currentThinkingSteps.length > 0 ? currentThinkingSteps : undefined
                  }]);
                } else if (parsed.type === 'avatar_planning') {
                  // 数字员工任务计划已禁用（不在任务开始时打断）
                  console.log('⏭️ 跳过数字员工计划回复');
                  
                } else if (parsed.type === 'avatar_start') {
                  // 数字员工开始第二次回答（静默处理）
                  console.log('🎤 数字员工开始总结...');
                } else if (parsed.type === 'avatar_audio') {
                  // 仅缓存"最后一条"avatar 总结，不立刻播报
                  const currentVoice = parsed.voice || getSelectedVoice();
                  const text = (parsed.summaryText || '').trim();

                  // 可选的"内容级"过滤：丢弃早期的"马上处理"类型（防止误判为最终总结）
                  if (text && /^马上处理/.test(text)) {
                    // 仍允许后续的真正总结覆盖缓存
                    // 不写入 _avatarLastSummary，直接跳过
                  } else {
                    _avatarLastSummary = {
                      text,
                      voice: currentVoice,
                      duration: parsed.duration,
                      audioBase64: parsed.audioBase64
                    };
                  }

                  // 如果已经进入最终阶段（_avatarFinalReady），且还没播过，则立刻播一次
                  if (_avatarFinalReady && !_avatarSummaryPlayed) {
                    await _playAvatarSummaryOnce();
                  }
                } else if (parsed.type === 'avatar_error') {
                  // 数字员工服务错误
                  toast.error(parsed.content || '数字员工服务错误', { id: 'avatar-summary' });
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error);
                }
              } catch (e) {}
            }
          }
        }
    } catch (error) {
      toast.error('发送失败');
      setMessages([...newMessages, { role: 'assistant', content: '抱歉，处理请求时出错。' }]);
    } finally {
      setLoading(false);
      localStorage.setItem('agent_working', 'false'); // 通知数字员工：Agent完成工作
      // 不清空思考过程，保留显示
    }
  };

  return (
    <>
    <OnboardingGuide />
    <ResetOnboarding />
    <div id="chat-container" className="flex flex-col h-full">
      <div className="card p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div id="chat-header">
            <div className="text-lg font-semibold">AI 对话</div>
            <div className="text-xs text-gray-500">它会自动调用工具完成任务</div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">模型:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'gpt5-thinking' | 'gpt5-pro' | 'claude')}
              className="select text-sm py-1 px-2"
              disabled={loading}
            >
              <option value="openai">Mindflow-Y-Workflow（推荐-自动工作流）</option>
              <option value="gpt5-pro">Mindflow-Y-Pro（强推理）</option>
              <option value="gpt5-thinking">Mindflow-Y（强推理）</option>
              <option value="claude">Mindflow-X-Workflow（Beta-Testing）</option>
            </select>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('确认清除所有聊天记录？此操作无法撤销。')) {
                    setMessages([]);
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('chat_messages');
                      console.log('🗑️ [聊天记录] 已清除 localStorage');
                    }
                    toast.success('聊天记录已清除');
                  }
                }}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                title="清除所有聊天记录"
              >
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息区域 - 固定高度，可滚动 */}
      <div className="card flex-1 overflow-y-auto p-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full overflow-hidden bg-white dark:bg-gray-800">
                <NextImage
                  src="/avatars/m.jpg"
                  alt="AI"
                  width={64}
                  height={64}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="text-base font-medium mb-2">开始对话</div>
              <div className="text-sm">AI 会自动调用工具帮你完成任务</div>
              <div className="text-xs mt-3 text-gray-400">
                例如："帮我搜索 AI 技术并生成报告"
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, msgIdx) => (
          <div key={msgIdx} className={`mb-4 flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-800">
                <NextImage
                  src="/avatars/m.jpg"
                  alt="AI"
                  width={32}
                  height={32}
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              <div>
                {/* Agentic AI推理过程（GPT-5等推理模型） */}
                {msg.role === 'assistant' && msg.reasoningContent && (
                  <div className="mb-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={18} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-900 dark:text-blue-100 text-sm">🤖 Agentic AI 推理过程</span>
                      <span className="ml-auto text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                        智能推理
                      </span>
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed bg-white/60 dark:bg-black/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                      {msg.reasoningContent}
                    </div>
                  </div>
                )}

                {/* 深度思考过程（如果有） */}
                {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                  <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-purple-900 dark:text-purple-100 text-sm">深度思考过程</span>
                    </div>
                    <div className="space-y-2">
                      {msg.thinkingSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-purple-800 dark:text-purple-200">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 消息内容 */}
                <div className={`${
                  msg.role === 'user' 
                    ? 'rounded-xl border border-blue-400/70 bg-blue-100/60 dark:bg-blue-900/20 dark:border-blue-500/60 backdrop-blur-sm shadow-sm px-4 py-3 text-blue-900 dark:text-blue-100'
                    : 'bg-transparent text-gray-900 dark:text-gray-100'
                }`}>
                  <div className={`text-xs mb-1 flex items-center gap-1 ${msg.role === 'user' ? 'text-blue-700/80 dark:text-blue-200/80' : 'text-gray-500 dark:text-gray-400 opacity-70'}`}>
                    {msg.role === 'user' ? (
                      <>
                        {msg.fromAvatar ? (
                          <>
                            <UserCircle2 size={12} />
                            <span>{msg.avatarName || '数字员工'}</span>
                          </>
                        ) : (
                      <>
                        <User size={12} />
                        <span>你</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Bot size={12} />
                        <span>AI 助手</span>
                      </>
                    )}
                  </div>
                  <div className={msg.role === 'user' ? 'text-blue-900 dark:text-blue-100' : ''}>
                    {msg.role === 'assistant' ? (
                      <Linkify text={msg.content} withCards size="sm" />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 工具调用详情 */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.toolCalls.map((tc, toolIdx) => {
                    const key = `${msgIdx}-${toolIdx}`;
                    const isExpanded = expandedTools.has(key);
                    return (
                      <div key={toolIdx} className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 overflow-hidden">
                        <button
                          onClick={() => toggleToolExpand(msgIdx, toolIdx)}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench size={14} className="text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              工具调用: {tc.tool}
                            </span>
                            {tc.result && (
                              <Check size={14} className="text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-3 py-2 border-t border-blue-200 dark:border-blue-800 bg-white dark:bg-[rgb(22,23,24)]">
                            <div className="text-xs font-semibold text-gray-500 mb-2">输入参数</div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mb-3">
                              <JsonView src={tc.args} />
                            </div>
                            
                            {tc.result && (
                              <>
                                <div className="text-xs font-semibold text-gray-500 mb-2">执行结果</div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                                  <JsonView src={tc.result} />
                                </div>
                                
                                {/* 文件预览 */}
                                <FilePreview result={tc.result} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <>
                {msg.fromAvatar && msg.avatarImage ? (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-white flex items-center justify-center ring-2 ring-lime-400 shadow-sm">
                    <div className="relative w-6 h-6">
                      <img
                        src={`/avatars/${msg.avatarImage}`}
                        alt={msg.avatarName || '数字员工'}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
                )}
              </>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start mb-4 gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Loader2 size={18} className="text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">AI 正在思考...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="card p-4 flex-shrink-0">
        {/* 文件上传区域 */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                {file.type.startsWith('image/') ? (
                  <Image size={14} className="text-blue-600" />
                ) : (
                  <FileText size={14} className="text-blue-600" />
                )}
                <span className="text-blue-900 dark:text-blue-100">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 功能选项栏 */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost text-sm"
            title="上传文件或图片"
          >
            <Upload size={16} />
            上传
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* 深度思考按钮 - 只在 GPT-5 系列模型时显示 */}
          {(selectedModel === 'gpt5-thinking' || selectedModel === 'gpt5-pro') && (
            <>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                  className={`btn-ghost text-sm ${
                    deepThinkingEnabled ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''
                  }`}
                  title="深度思考模式（控制 GPT-5 的推理强度）"
                >
                  <Brain size={16} className={deepThinkingEnabled ? 'text-purple-600' : ''} />
                  深度思考
                  {deepThinkingEnabled && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                      {deepThinkingLevel.toUpperCase()}
                    </span>
                  )}
                </button>
                {deepThinkingEnabled && (
                  <select
                    value={deepThinkingLevel}
                    onChange={(e) => setDeepThinkingLevel(e.target.value as 'low'|'medium'|'high')}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    title="思考强度"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                )}
              </div>
            </>
          )}

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <button
            id="avatar-toggle"
            onClick={() => setAvatarEnabled(!avatarEnabled)}
            className={`btn-ghost text-sm ${avatarEnabled ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : ''}`}
            title="语音数字员工（AI语音总结播报）"
          >
            <Volume2 size={16} className={avatarEnabled ? 'text-orange-600' : ''} />
            数字员工
            {avatarEnabled && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                ON
              </span>
            )}
          </button>

          <div className="flex-1"></div>
        </div>

        {/* 输入框 */}
        <div className="flex gap-2">
          <textarea
            className="input flex-1 resize-none"
            placeholder="输入消息... (Shift+Enter 换行)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading || isRecording}
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <button
              className={`p-2 rounded transition-colors h-fit ${
                isRecording 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleMicClick}
              disabled={loading}
              title={isRecording ? '点击停止录音' : '请先登录使用语音功能'}
            >
              {isRecording ? <MicOff size={16} className="text-red-600" /> : <Mic size={16} />}
            </button>
            <button
              className="p-2 rounded transition-colors h-fit text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSend}
              disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
              title="发送"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 登录提示 */}
      <LoginPrompt 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          setShowLogin(true);
        }}
      />

      {/* 登录弹窗 */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
    </>
  );
}

