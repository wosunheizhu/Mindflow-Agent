'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Loader2, Maximize2, Minimize2, User, Phone, Plus, Mic, MicOff, Upload, X, FileText, Image as ImageIcon, Volume2, VolumeX, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import LoginPrompt from './LoginPrompt';
import LoginModal from './LoginModal';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string; // 推理过程
};

// 清理文本：去除括号及其内容、小助理名字前缀（前端也过滤，双重保障）
function cleanTextForDisplay(text: string): string {
  // 去除小助理名字前缀（小岚：、小远：、小岚 、小远 ）
  let cleaned = text.replace(/^(小岚|小远)[：:：\s]+/g, '');
  
  // 去除所有括号及其内容
  cleaned = cleaned.replace(/[（(].*?[）)]/g, '');
  cleaned = cleaned.replace(/[\[【].*?[\]】]/g, '');
  cleaned = cleaned.replace(/[「『].*?[」』]/g, '');
  cleaned = cleaned.replace(/[<].*?[>]/g, '');
  
  // 去除多余空格和换行
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

type AvatarDisplayProps = {
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

export default function AvatarDisplay({ isExpanded: externalIsExpanded, onExpandChange }: AvatarDisplayProps = {}) {
  const [lanImages, setLanImages] = useState<string[]>([]);
  const [yuanImages, setYuanImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAgentWorking, setIsAgentWorking] = useState(false); // Agent工作状态
  const [internalIsExpanded, setInternalIsExpanded] = useState(false); // 内部展开状态
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    // 初始化时从localStorage读取
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected_avatar_voice') || 'zh_female_sajiaonvyou_moon_bigtts';
    }
    return 'zh_female_sajiaonvyou_moon_bigtts';
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    // 初始化时从localStorage读取
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avatar_chat_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  }); // 对话历史
  const [currentReply, setCurrentReply] = useState(''); // 当前正在生成的回复
  const [currentReasoning, setCurrentReasoning] = useState(''); // 当前正在生成的推理内容
  const [isRecording, setIsRecording] = useState(false); // 麦克风录音状态
  
  // 深度思考设置：只控制小助理本身的 LLM（豆包），简单开关
  const [deepThinking, setDeepThinking] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('avatar_deep_thinking');
    return saved ? saved === 'true' : false;
  });
  
  const [expandedReasoning, setExpandedReasoning] = useState<{[key: number]: boolean}>({}); // 每条消息的推理展开状态
  const [currentReasoningExpanded, setCurrentReasoningExpanded] = useState(false); // 当前推理的展开状态
  // 上传功能已移除
  // const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [lastSummaryText, setLastSummaryText] = useState(''); // 上一次总结内容（用于去重）
  const [lastSummaryTime, setLastSummaryTime] = useState(0); // 上一次总结时间（用于去重）
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // 初始化时从localStorage读取
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avatar_sound_enabled');
      return saved === null ? true : saved === 'true';
    }
    return true;
  }); // 声音开关
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // 上传功能已移除
  // const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reasoningRef = useRef<string>(''); // 用 ref 实时跟踪 reasoning 内容
  const audioQueueRef = useRef<Map<number, Blob>>(new Map()); // 音频播放队列
  const currentlyPlayingRef = useRef<boolean>(false); // 是否正在播放
  const nextOrderToPlayRef = useRef<number>(1); // 下一个要播放的序号

  // 使用外部传入的展开状态，或使用内部状态
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [chatHistory, currentReply, isExpanded]);

  // 保存聊天历史到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && chatHistory.length > 0) {
      localStorage.setItem('avatar_chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // 保存声音设置到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('avatar_sound_enabled', soundEnabled.toString());
    }
  }, [soundEnabled]);

  // 同步深度思考设置到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('avatar_deep_thinking', String(deepThinking));
    }
  }, [deepThinking]);

  // 切换声音开关
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    
    // 如果关闭声音，立即停止当前播放的音频并清空队列
    if (!newState) {
      // 停止当前播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSpeaking(false);
      }
      
      // 清空音频队列
      audioQueueRef.current.clear();
      currentlyPlayingRef.current = false;
      
      console.log('🔇 声音已关闭，已停止播放并清空队列');
    }
    
    toast.success(newState ? '🔊 声音已开启' : '🔇 声音已关闭', { duration: 1000 });
  };
  
  // 处理展开状态变化
  const handleExpandToggle = () => {
    const newState = !isExpanded;
    console.log(`🔄 [AvatarDisplay] 切换展开状态: ${isExpanded} → ${newState}`);
    if (onExpandChange) {
      onExpandChange(newState);
    } else {
      setInternalIsExpanded(newState);
    }
  };

  // 同步选择的小助理到localStorage
  useEffect(() => {
    localStorage.setItem('selected_avatar_voice', selectedAvatar);
    console.log(`📢 小助理选择: ${selectedAvatar}`);
  }, [selectedAvatar]);

  // 获取当前角色的图片列表
  const getCurrentImages = () => {
    return selectedAvatar === 'zh_female_sajiaonvyou_moon_bigtts' ? lanImages : yuanImages;
  };

  // 监听Agent工作状态（通过localStorage）
  useEffect(() => {
    const checkAgentStatus = () => {
      const agentWorking = localStorage.getItem('agent_working') === 'true';
      setIsAgentWorking(agentWorking);
    };

    // 初始检查
    checkAgentStatus();

    // 定时检查
    const interval = setInterval(checkAgentStatus, 500);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 初始化音频
    audioRef.current = new Audio();
    if (audioRef.current) {
      audioRef.current.preload = 'auto';
      
      // 监听音频播放状态
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onpause = () => setIsSpeaking(false);
    }

    // 扫描avatars文件夹中的图片
    fetch('/api/avatars')
      .then(res => res.json())
      .then(data => {
        if (data.lan) setLanImages(data.lan);
        if (data.yuan) setYuanImages(data.yuan);
      })
      .catch(err => {
        console.error('加载头像失败:', err);
      });
  }, []);

  // 智能图片轮播
  useEffect(() => {
    const images = getCurrentImages();
    if (images.length < 4) return; // 需要至少4张图片（1.jpg, 2.jpg, 3.jpg, 4.jpg）

    if (isAgentWorking) {
      // Agent工作时：在2, 3, 4之间循环（索引1, 2, 3）
      const workingImages = [1, 2, 3];
      let workingIndex = 0;
      
      // 如果当前不在工作图片中，跳到第一张工作图片
      if (currentImageIndex === 0) {
        setCurrentImageIndex(1);
      }
      
      const interval = setInterval(() => {
        workingIndex = (workingIndex + 1) % workingImages.length;
        setCurrentImageIndex(workingImages[workingIndex]);
      }, 10000); // 10秒

      return () => clearInterval(interval);
    } else {
      // Agent不工作时：固定显示1.jpg（索引0）
      setCurrentImageIndex(0);
    }
  }, [isAgentWorking, selectedAvatar, lanImages, yuanImages]);

  // 切换角色时重置图片索引
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedAvatar]);

  // 监听Agent消息（从主聊天页面）
  useEffect(() => {
    const handleAgentMessage = (event: CustomEvent) => {
      const { type, text, voice, duration } = event.detail;
      
      console.log(`🎧 [小助理组件] 收到事件:`, { type, textLength: text?.length, voice, currentAvatar: selectedAvatar });
      
      // 检查是否是当前选择的小助理
      if (voice !== selectedAvatar) {
        console.log(`⏭️  [小助理组件] 音色不匹配，忽略事件 (${voice} !== ${selectedAvatar})`);
        return;
      }
      
      // 只处理总结，不处理计划（任务开始时不打断）
      if (type === 'avatar_summary') {
        console.log(`✅ [小助理组件] 处理 ${type} 事件，文本: ${text?.substring(0, 50)}...`);
        
        // 去重：检查是否与上一次总结相同或相似
        if (text && text.trim()) {
          const now = Date.now();
          const trimmedText = text.trim();
          
          // 如果3秒内收到相同的总结内容，忽略（防止重复）
          if (trimmedText === lastSummaryText && (now - lastSummaryTime) < 3000) {
            console.warn(`⚠️ [小助理组件] 检测到重复总结（3秒内相同内容），忽略`);
            return;
          }
          
          // 更新去重记录
          setLastSummaryText(trimmedText);
          setLastSummaryTime(now);
          
          // 添加Agent触发的小助理回复到历史
          const assistantMessage: ChatMessage = { 
            role: 'assistant', 
            content: trimmedText 
          };
          setChatHistory(prev => {
            const newHistory = [...prev, assistantMessage];
            console.log(`💬 [小助理组件] 更新历史，当前总数: ${newHistory.length}`);
            return newHistory;
          });
          console.log(`📥 [小助理组件] 已添加消息到历史: ${trimmedText.substring(0, 30)}...`);
          
          // 触发说话动画
          setIsSpeaking(true);
          // 根据预估时长自动停止（如果有duration，否则默认3秒）
          setTimeout(() => {
            setIsSpeaking(false);
          }, duration || 3000);
        } else {
          console.warn(`⚠️ [小助理组件] 文本为空，不添加到历史`);
        }
      } else {
        console.log(`⏭️  [小助理组件] 忽略类型: ${type}`);
      }
    };

    console.log(`🎧 [小助理组件] 注册事件监听器，当前音色: ${selectedAvatar}`);
    window.addEventListener('agent_avatar_message' as any, handleAgentMessage as any);
    
    return () => {
      console.log(`🔇 [小助理组件] 移除事件监听器`);
      window.removeEventListener('agent_avatar_message' as any, handleAgentMessage as any);
    };
  }, [selectedAvatar]);

  // 文件上传处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // 上传功能已移除
    // setUploadedFiles([...uploadedFiles, ...files]);
    // toast.success(`已添加 ${files.length} 个文件`);
  };

  const removeFile = (index: number) => {
    // 上传功能已移除
    // setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // 语音录制功能
  // startRecording 已移除 - 改用登录提示
  // 所有麦克风按钮现在都调用 handleMicClick

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

  const handleAvatarChat = async () => {
    console.log(`🎯 [小助理] handleAvatarChat 被调用，chatLoading=${chatLoading}, input="${chatInput.substring(0, 30)}..."`);
    
    if (!chatInput.trim() || chatLoading) {
      console.log(`⏭️  [小助理] 跳过：输入为空或正在加载`);
      return;
    }

    let messageContent = chatInput;
    // 上传功能已移除
    const userMessage = messageContent;
    const currentHistory = chatHistory; // 保存当前历史
    
    setChatInput('');
    setChatLoading(true);
    setCurrentReply(''); // 清空当前回复，准备接收新回复
    setCurrentReasoning(''); // 清空推理内容
    reasoningRef.current = ''; // 同时清空 ref
    setCurrentReasoningExpanded(false); // 重置展开状态

    // 添加用户消息到历史
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);
    
    console.log(`📚 [前端] 发送历史: ${currentHistory.length}条消息`);
    console.log(`📚 [前端] 历史详情:`, JSON.stringify(currentHistory, null, 2));

    // 重置音频播放队列
    audioQueueRef.current.clear();
    currentlyPlayingRef.current = false;
    nextOrderToPlayRef.current = 1;
    
    console.log(`🎵 [播放器] 初始化播放队列，从句子#1开始`);

    // 播放下一个音频（按顺序）
    const playNext = () => {
      if (currentlyPlayingRef.current) {
        console.log(`⏸️  已在播放中，跳过`);
        return;
      }
      
      // 查找下一个应该播放的音频
      const nextBlob = audioQueueRef.current.get(nextOrderToPlayRef.current);
      if (!nextBlob) {
        console.log(`⏸️  等待句子#${nextOrderToPlayRef.current}，当前队列: ${Array.from(audioQueueRef.current.keys()).join(',')}`);
        return;
      }
      
      // 如果声音关闭，直接跳过所有音频（不创建blob URL）
      if (!soundEnabled) {
        console.log(`🔇 声音已关闭，跳过句子#${nextOrderToPlayRef.current}`);
        audioQueueRef.current.delete(nextOrderToPlayRef.current);
        nextOrderToPlayRef.current++;
        setTimeout(() => playNext(), 0);
        return;
      }
      
      currentlyPlayingRef.current = true;
      let audioUrl: string | null = null;
      
      try {
        audioUrl = URL.createObjectURL(nextBlob);
        console.log(`▶️  开始播放句子#${nextOrderToPlayRef.current}，队列中还有: ${Array.from(audioQueueRef.current.keys()).filter(k => k > nextOrderToPlayRef.current).join(',')}`);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          
          const cleanupAndNext = () => {
            if (audioUrl) {
              try {
                URL.revokeObjectURL(audioUrl);
              } catch (e) {
                console.warn('清理blob URL失败:', e);
              }
            }
            audioQueueRef.current.delete(nextOrderToPlayRef.current);
            nextOrderToPlayRef.current++;
            currentlyPlayingRef.current = false;
            setIsSpeaking(false);
            setTimeout(() => playNext(), 10);
          };
          
          audioRef.current.onended = () => {
            console.log(`✅ 句子#${nextOrderToPlayRef.current} 播放完成`);
            cleanupAndNext();
          };
          
          audioRef.current.onerror = (e) => {
            console.error(`❌ 句子#${nextOrderToPlayRef.current} 播放错误:`, e);
            cleanupAndNext();
          };
          
          setIsSpeaking(true);
          audioRef.current.play().catch(e => {
            console.error(`❌ 句子#${nextOrderToPlayRef.current} play()失败:`, e);
            cleanupAndNext();
          });
        }
      } catch (error) {
        console.error(`❌ 创建音频失败:`, error);
        if (audioUrl) {
          try {
            URL.revokeObjectURL(audioUrl);
          } catch (e) {
            console.warn('清理blob URL失败:', e);
          }
        }
        audioQueueRef.current.delete(nextOrderToPlayRef.current);
        nextOrderToPlayRef.current++;
        currentlyPlayingRef.current = false;
        setIsSpeaking(false);
        setTimeout(() => playNext(), 10);
      }
    };

    try {
      // 使用环境变量或本地地址
      const voiceServerUrl = process.env.NEXT_PUBLIC_VOICE_SERVER_URL || 'http://localhost:8001';
      console.log(`📤 [前端] 发送请求到小助理API，deep_thinking=${deepThinking}`);
      
      const response = await fetch(`${voiceServerUrl}/api/avatar-chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          voice: selectedAvatar,
          history: currentHistory, // 发送当前历史（不包括刚添加的用户消息）
          agent_working: isAgentWorking, // 发送Agentic AI工作状态
          deep_thinking: deepThinking, // 控制小助理本身（豆包 LLM）的深度思考
          uploaded_files: [] // 上传功能已移除
        })
      });
      
      console.log(`📥 [前端] 收到响应状态: ${response.ok ? '成功' : '失败'}`);
      console.log(`🧠 [前端] deepThinking 当前值: ${deepThinking}`);

      if (!response.ok) {
        throw new Error('请求失败');
      }

      // 处理SSE流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let promptSent = false;  // 标记提示词是否已发送

      if (reader) {
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;

          let boundary = sseBuffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = sseBuffer.slice(0, boundary);
            sseBuffer = sseBuffer.slice(boundary + 2);
            boundary = sseBuffer.indexOf('\n\n');

            const dataLines = rawEvent
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6));

            if (dataLines.length === 0) continue;

            for (const data of dataLines) {
              if (data === '[DONE]') {
                console.log('✅ 收到[DONE]，结束SSE');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                
                // 调试：打印所有收到的事件类型
                console.log(`📦 [前端SSE] 收到事件: type=${parsed.type}, 数据长度=${JSON.stringify(parsed).length}`);

                if (parsed.type === 'text') {
                  fullText += parsed.content;
                  
                  // 检测是否有完整的提示词（同时支持单花括号 {...} 和双花括号 {{...}}）
                  if (!promptSent) {
                    const completePromptMatch = fullText.match(/\{\{([^}]+)\}\}/) || fullText.match(/\{([^}]+)\}/);
                    if (completePromptMatch) {
                      const agentPrompt = completePromptMatch[1].trim();
                      console.log(`🤖 [实时] 检测到完整提示词，立即发送: ${agentPrompt.substring(0, 100)}...`);
                      console.log(`📊 [实时] promptSent当前状态: ${promptSent}`);
                      console.log(`📊 [实时] fullText: ${fullText.substring(0, 150)}...`);
                      
                      // 立即发送事件到主聊天页面
                      const event = new CustomEvent('avatar_agent_task', {
                        detail: {
                          prompt: agentPrompt,
                          avatarName: avatarName,
                          avatarImage: avatarImage
                        }
                      });
                      console.log(`📤 [实时] 即将 dispatchEvent，promptSent=${promptSent}`);
                      window.dispatchEvent(event);
                      promptSent = true;
                      console.log(`✅ [实时] 已发送 avatar_agent_task 事件，promptSent已设为true`);
                    }
                  } else {
                    console.log(`ℹ️ [实时] 提示词已发送过，跳过`);
                  }
                  
                  // 实时显示时过滤掉提示词部分（双花括号格式）
                  const displayText = fullText.replace(/\{\{[^}]*\}\}?/g, '').replace(/\{[^}]*$/g, '').trim();
                  setCurrentReply(displayText);
                } else if (parsed.type === 'reasoning') {
                  // 处理推理内容
                  console.log('🧠 [前端] 收到 reasoning 事件:', parsed.content?.substring(0, 100));
                  
                  // 同时更新 state 和 ref
                  reasoningRef.current += parsed.content;
                  console.log('🧠 [前端] reasoningRef 当前长度:', reasoningRef.current.length);
                  
                  setCurrentReasoning(prev => {
                    const newReasoning = prev + parsed.content;
                    console.log('🧠 [前端] currentReasoning 状态长度:', newReasoning.length);
                    return newReasoning;
                  });
                } else if (parsed.type === 'audio') {
                  const audioData = atob(parsed.data);
                  const bytes = new Uint8Array(audioData.length);
                  for (let i = 0; i < audioData.length; i++) {
                    bytes[i] = audioData.charCodeAt(i);
                  }
                  const audioBlob = new Blob([bytes], { type: 'audio/wav' });
                  const order = parsed.order || 1;
                  
                  // 添加到队列Map中
                  audioQueueRef.current.set(order, audioBlob);

                  const orderInfo = parsed.order ? `#${parsed.order}/${parsed.total}` : `#${order}`;
                  console.log(`📥 收到音频 ${orderInfo}，大小: ${bytes.length} bytes，队列中: ${Array.from(audioQueueRef.current.keys()).join(',')}`);

                  // 尝试播放（如果轮到它了就会播放）
                  playNext();
                } else if (parsed.type === 'done') {
                  setCurrentReply('');
                  
                  // 使用 ref 获取推理内容（避免 React 状态异步问题）
                  const savedReasoning = reasoningRef.current;
                  console.log('💾 [done] 从 reasoningRef 读取: ' + savedReasoning.length + ' 字符');

                  if (fullText.trim()) {
                    console.log(`📝 小助理完整回复: ${fullText}`);
                    console.log(`📊 promptSent状态: ${promptSent}`);
                    console.log(`🧠 当前推理内容长度: ${savedReasoning.length}`);
                    
                    // 如果在流式过程中还没有发送提示词，现在检测并发送
                    if (!promptSent) {
                      // 检测是否包含 Agentic AI 提示词（同时支持单花括号 {...} 和双花括号 {{...}}）
                      const agentPromptMatch = fullText.match(/\{\{([^}]+)\}\}/) || fullText.match(/\{([^}]+)\}/);
                      
                      if (agentPromptMatch) {
                        const agentPrompt = agentPromptMatch[1].trim();
                        console.log(`🤖 [done] 检测到 Agentic AI 提示词（长度: ${agentPrompt.length}）: ${agentPrompt.substring(0, 100)}...`);
                        
                        // 发送事件到主聊天页面
                        const event = new CustomEvent('avatar_agent_task', {
                          detail: {
                            prompt: agentPrompt,
                            avatarName: avatarName,
                            avatarImage: avatarImage
                          }
                        });
                        window.dispatchEvent(event);
                        promptSent = true; // 标记已发送
                        console.log(`📨 [done] 已发送 avatar_agent_task 事件`);
                      } else {
                        console.log(`ℹ️ [done] 未检测到提示词，这是普通闲聊`);
                      }
                    } else {
                      console.log(`ℹ️ 提示词已在流式过程中发送，跳过done发送`);
                    }
                    
                    // 添加到历史（移除提示词部分：双花括号和不完整的花括号，并包含推理内容）
                    const displayText = fullText.replace(/\{\{[^}]*\}\}?/g, '').replace(/\{[^}]*$/g, '').trim();
                    if (displayText) {
                      const newHistoryIndex = chatHistory.length;
                      
                      // 修复：只有当 savedReasoning 有实际内容时才保存（排除空字符串）
                      const finalReasoningContent = savedReasoning && savedReasoning.trim().length > 0 ? savedReasoning : undefined;
                      
                      const assistantMessage: ChatMessage = { 
                        role: 'assistant', 
                        content: displayText,
                        reasoningContent: finalReasoningContent
                      };
                      
                      console.log(`✅ 准备添加到历史（索引${newHistoryIndex}）: ${displayText.substring(0, 30)}...`);
                      console.log(`🧠 savedReasoning长度: ${savedReasoning.length}`);
                      console.log(`🧠 finalReasoningContent: ${finalReasoningContent ? finalReasoningContent.substring(0, 50) + '...' : '无'}`);
                      
                      setChatHistory(prev => {
                        const newHistory = [...prev, assistantMessage];
                        console.log(`📚 历史消息更新，总数: ${newHistory.length}`);
                        console.log(`📚 最新消息的 reasoningContent: ${assistantMessage.reasoningContent ? '有(' + assistantMessage.reasoningContent.length + '字符)' : '无'}`);
                        return newHistory;
                      });
                      
                      // 如果有推理内容，默认展开
                      if (finalReasoningContent) {
                        console.log(`🔓 设置消息#${newHistoryIndex}推理内容为展开状态`);
                        setExpandedReasoning(prev => {
                          const newState = {...prev, [newHistoryIndex]: true};
                          console.log(`📊 展开状态:`, newState);
                          return newState;
                        });
                      } else {
                        console.log(`⚠️ 没有推理内容，不设置展开状态`);
                      }
                      
                      if (promptSent) {
                        console.log(`📨 本次对话已触发Agentic AI任务`);
                      }
                    } else {
                      console.log(`ℹ️ 显示文本为空（可能全是提示词），不添加到历史`);
                    }
                  }
                  setCurrentReasoning(''); // 清空推理内容
                  reasoningRef.current = ''; // 同时清空 ref
                  console.log(`✅ SSE完成，队列中还有 ${audioQueueRef.current.size} 个音频待播放: ${Array.from(audioQueueRef.current.keys()).join(',')}`);
                  // 继续尝试播放剩余音频
                  playNext();
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error('❌ SSE解析失败:', e, data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('小助理对话错误:', error);
      toast.error('对话失败');
      setCurrentReply('');
      setCurrentReasoning('');
      reasoningRef.current = '';
    } finally {
      setChatLoading(false);
      // 确保清除状态
      setCurrentReply('');
      setCurrentReasoning('');
      setCurrentReasoningExpanded(false);
    }
  };

  const currentImages = getCurrentImages();
  
  if (currentImages.length === 0) {
    return null;
  }

  // 获取小助理头像（永远使用第一张图片）
  const avatarImage = currentImages[0];
  const avatarName = selectedAvatar === 'zh_female_sajiaonvyou_moon_bigtts' ? '小岚' : '小远';

  return (
    <>
    <div className={isExpanded ? 'h-full flex flex-col' : 'card mt-4 p-3'}>
      {/* 头部标题栏 */}
      {isExpanded ? (
        <div className="card p-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-lg font-semibold">小助理对话</div>
              <div className="text-xs text-gray-500">与小助理 {avatarName} 进行轻松对话</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors ${
                  soundEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
                }`}
                title={soundEnabled ? '点击关闭声音' : '点击开启声音'}
                onClick={toggleSound}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
                title="语音通话"
                onClick={() => setShowLoginPrompt(true)}
              >
                <Phone size={18} />
              </button>
              <div className="flex items-center gap-1">
                <select
                  value={selectedAvatar}
                  onChange={(e) => setSelectedAvatar(e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <option value="zh_female_sajiaonvyou_moon_bigtts">小岚</option>
                  <option value="zh_male_shaonianzixin_moon_bigtts">小远</option>
                </select>
                <button
                  onClick={() => setShowLoginPrompt(true)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
                  title="添加小助理"
                >
                  <Plus size={14} />
                </button>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('确认删除所有小助理聊天记录？')) {
                    setChatHistory([]);
                    setCurrentReply('');
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('avatar_chat_history');
                    }
                    toast.success('已清除对话历史');
                    }
                  }}
                  disabled={chatLoading}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  清除
                </button>
              )}
              <button
                onClick={handleExpandToggle}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
                title="缩小窗口"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 font-medium">小助理</div>
          <div className="flex items-center gap-1">
            <button
              className={`p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors ${
                soundEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
              }`}
              title={soundEnabled ? '关闭声音' : '开启声音'}
              onClick={toggleSound}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <select
              value={selectedAvatar}
              onChange={(e) => setSelectedAvatar(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="选择小助理"
            >
              <option value="zh_female_sajiaonvyou_moon_bigtts">小岚</option>
              <option value="zh_male_shaonianzixin_moon_bigtts">小远</option>
            </select>
            <button
              onClick={handleExpandToggle}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
              title="展开窗口"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* 非展开模式：显示图片轮播 */}
      {!isExpanded && (
        <div className="relative aspect-square rounded-lg overflow-hidden bg-transparent mb-2">
          {currentImages.map((image, idx) => (
            <div
              key={image}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
                idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className={`relative w-1/2 h-1/2 ${isSpeaking ? 'animate-pulse-subtle' : ''}`}>
                <Image
                  src={`/avatars/${image}`}
                  alt={avatarName}
                  fill
                  className="object-contain"
                  sizes="100px"
                  priority={idx === 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.05) rotate(-1deg);
          }
          50% {
            transform: scale(1.08) rotate(0deg);
          }
          75% {
            transform: scale(1.05) rotate(1deg);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 0.6s ease-in-out infinite;
        }
      `}</style>

      {/* 展开模式：完整聊天界面 */}
      {isExpanded ? (
        <>
          {/* 消息区域 */}
          <div className="card overflow-y-auto p-4 mb-4 flex-1">
            {/* 空状态：居中显示小助理图片 */}
            {chatHistory.length === 0 && !currentReply && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="h-32 w-32 mx-auto mb-4 flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <Image
                        src={`/avatars/${avatarImage}`}
                        alt={avatarName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="text-base font-medium mb-2">与 {avatarName} 对话</div>
                  <div className="text-sm">可以和小助理轻松闲聊</div>
                </div>
              </div>
            )}
            
            {/* 聊天消息列表 */}
            {(chatHistory.length > 0 || currentReply) && (
              <>
                {chatHistory.map((msg, idx) => {
                  // 调试：打印每条消息的 reasoningContent 状态
                  if (msg.role === 'assistant') {
                    console.log(`🔍 [渲染] 消息#${idx}: content=${msg.content.substring(0, 30)}..., reasoningContent=${msg.reasoningContent ? msg.reasoningContent.length + '字符' : '无'}`);
                  }
                  return (
                  <div key={idx} className={`mb-4 flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* 小助理消息：左侧显示头像 */}
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-white flex items-center justify-center ring-2 ring-lime-400 shadow-sm">
                        <div className="relative w-6 h-6">
                          <Image
                            src={`/avatars/${avatarImage}`}
                            alt={avatarName}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                      {/* 推理过程（历史消息） - 灰色样式 */}
                      {msg.role === 'assistant' && msg.reasoningContent && (
                        <div className="mb-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <button
                            onClick={() => {
                              console.log(`🔄 切换消息#${idx}的推理展开状态: ${!expandedReasoning[idx]}`);
                              setExpandedReasoning(prev => ({...prev, [idx]: !prev[idx]}));
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <Brain size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              模型思考过程
                            </span>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">
                              [{expandedReasoning[idx] ? '收起' : '展开'}]
                            </span>
                          </button>
                          {expandedReasoning[idx] && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                              {msg.reasoningContent}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`${
                        msg.role === 'user'
                          ? 'rounded-xl border border-blue-400/70 bg-blue-100/60 dark:bg-blue-900/20 dark:border-blue-500/60 backdrop-blur-sm shadow-sm px-4 py-3 text-blue-900 dark:text-blue-100'
                          : 'bg-transparent text-gray-900 dark:text-gray-100'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.role === 'assistant' ? cleanTextForDisplay(msg.content) : msg.content}
                        </div>
                      </div>
                    </div>
                    
                    {/* 用户消息：右侧显示用户图标 */}
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                  );
                })}
                
                {/* 当前正在生成的回复 */}
                {(currentReply || currentReasoning) && (
                  <div className="mb-4 flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-white flex items-center justify-center ring-2 ring-lime-400 shadow-sm animate-pulse-subtle">
                      <div className="relative w-6 h-6">
                        <Image
                          src={`/avatars/${avatarImage}`}
                          alt={avatarName}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div className="max-w-[75%] w-full">
                      {/* 推理过程（流式） - 灰色样式，可展开/收起 */}
                      {currentReasoning && (
                        <div className="mb-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <button
                            onClick={() => setCurrentReasoningExpanded(!currentReasoningExpanded)}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <Brain size={14} className="text-gray-500 dark:text-gray-400 animate-pulse flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 animate-pulse">
                              思考中...
                            </span>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">
                              [{currentReasoningExpanded ? '收起' : '展开'}]
                            </span>
                          </button>
                          {currentReasoningExpanded && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                              {currentReasoning}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {currentReply && (
                      <div className="bg-transparent text-gray-900 dark:text-gray-100">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {cleanTextForDisplay(currentReply)}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 输入区域 */}
          <div className="card p-4 flex-shrink-0">
            {/* 文件上传区域 */}
            {/* 上传功能已移除 */}

            {/* 功能选项栏 */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              {/* 上传功能已移除 */}
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <button
                onClick={() => setDeepThinking(!deepThinking)}
                className={`btn-ghost text-sm ${deepThinking ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}`}
                title="深度思考模式（小助理使用更强推理能力）"
              >
                <Brain size={16} className={deepThinking ? 'text-purple-600' : ''} />
                深度思考
                {deepThinking && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                    ON
                  </span>
                )}
              </button>

              <div className="flex-1"></div>
            </div>

            <div className="flex gap-2">
              <textarea
                className="input flex-1 resize-none"
                placeholder="输入消息... (Enter 发送)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAvatarChat();
                  }
                }}
                disabled={chatLoading || isRecording}
                rows={2}
              />
              <div className="flex flex-col gap-2">
              <button
                  className={`p-2 rounded transition-colors h-fit ${
                    isRecording 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleMicClick}
                  disabled={chatLoading}
                  title={isRecording ? '点击停止录音' : '请先登录使用语音功能'}
                >
                  {isRecording ? <MicOff size={16} className="text-red-600" /> : <Mic size={16} />}
                </button>
                <button
                  className="p-2 rounded transition-colors h-fit text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAvatarChat}
                disabled={chatLoading || !chatInput.trim()}
                  title="发送"
              >
                {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 正常模式：紧凑布局 */
        <div className="space-y-2">
          {/* 对话历史显示 - 固定高度，可滚动 */}
          {(chatHistory.length > 0 || currentReply) && (
            <div className="h-40 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 flex-shrink-0">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="text-xs">
                  {msg.role === 'user' ? (
                    <div className="inline-block rounded-lg border border-blue-400/70 bg-blue-100/60 dark:bg-blue-900/20 dark:border-blue-500/60 backdrop-blur-sm shadow-sm px-2 py-1 text-blue-900 dark:text-blue-100">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-gray-900 dark:text-gray-100 break-words">
                      {cleanTextForDisplay(msg.content)}
                    </div>
                  )}
                </div>
              ))}
              {currentReply && (
                <div className="text-xs text-gray-900 dark:text-gray-100 break-words">
                  {cleanTextForDisplay(currentReply)}
                </div>
              )}
            </div>
          )}

          {/* 输入框 + 麦克风 + 发送按钮 */}
          <div className="flex gap-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isRecording && handleAvatarChat()}
              placeholder="说点什么..."
              disabled={chatLoading || isRecording}
              className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleMicClick}
              disabled={chatLoading}
              className={`w-7 h-7 flex items-center justify-center rounded flex-shrink-0 ${
                isRecording 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title={isRecording ? '停止录音' : '请先登录使用语音功能'}
            >
              {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
            <button
              onClick={handleAvatarChat}
              disabled={chatLoading || !chatInput.trim()}
              className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
              title="发送"
            >
              {chatLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* 公司信息：展开状态下隐藏，放在小助理窗口外面 */}
      {!isExpanded && (
        <div className="card p-3 mt-3">
          <div className="text-center space-y-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              EVERCALL
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              北京心流元素科技有限公司
            </div>
            <a 
              href="mailto:contact@xinliuyuansu.com" 
              className="text-xs text-gray-900 dark:text-gray-100 hover:underline block mt-1"
            >
              contact@xinliuyuansu.com
            </a>
          </div>
        </div>
      )}

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
    </>
  );
}

