'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Loader2, Maximize2, Minimize2, User, Phone, Plus, Mic, MicOff, Upload, Brain, X, FileText, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import LoginPrompt from './LoginPrompt';
import LoginModal from './LoginModal';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string; // 推理过程
};

// 清理文本：去除括号及其内容、数字员工名字前缀（前端也过滤，双重保障）
function cleanTextForDisplay(text: string): string {
  // 去除数字员工名字前缀（小岚：、小远：、小岚 、小远 ）
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
  const [deepThinking, setDeepThinking] = useState(false); // 深度思考模式
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // 上传的文件
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // 切换声音开关
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
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

  // 同步选择的数字员工到localStorage
  useEffect(() => {
    localStorage.setItem('selected_avatar_voice', selectedAvatar);
    console.log(`📢 数字员工选择: ${selectedAvatar}`);
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
      
      console.log(`🎧 [数字员工组件] 收到事件:`, { type, textLength: text?.length, voice, currentAvatar: selectedAvatar });
      
      // 检查是否是当前选择的数字员工
      if (voice !== selectedAvatar) {
        console.log(`⏭️  [数字员工组件] 音色不匹配，忽略事件 (${voice} !== ${selectedAvatar})`);
        return;
      }
      
      // 只处理总结，不处理计划（任务开始时不打断）
      if (type === 'avatar_summary') {
        console.log(`✅ [数字员工组件] 处理 ${type} 事件，文本: ${text?.substring(0, 50)}...`);
        
        // 添加Agent触发的数字员工回复到历史
        if (text && text.trim()) {
          const assistantMessage: ChatMessage = { 
            role: 'assistant', 
            content: text.trim() 
          };
          setChatHistory(prev => {
            const newHistory = [...prev, assistantMessage];
            console.log(`💬 [数字员工组件] 更新历史，当前总数: ${newHistory.length}`);
            return newHistory;
          });
          console.log(`📥 [数字员工组件] 已添加消息到历史: ${text.substring(0, 30)}...`);
          
          // 触发说话动画
          setIsSpeaking(true);
          // 根据预估时长自动停止（如果有duration，否则默认3秒）
          setTimeout(() => {
            setIsSpeaking(false);
          }, duration || 3000);
        } else {
          console.warn(`⚠️ [数字员工组件] 文本为空，不添加到历史`);
        }
      } else {
        console.log(`⏭️  [数字员工组件] 忽略类型: ${type}`);
      }
    };

    console.log(`🎧 [数字员工组件] 注册事件监听器，当前音色: ${selectedAvatar}`);
    window.addEventListener('agent_avatar_message' as any, handleAgentMessage as any);
    
    return () => {
      console.log(`🔇 [数字员工组件] 移除事件监听器`);
      window.removeEventListener('agent_avatar_message' as any, handleAgentMessage as any);
    };
  }, [selectedAvatar]);

  // 文件上传处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    toast.success(`已添加 ${files.length} 个文件`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
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
    if (!chatInput.trim() || chatLoading) return;

    let messageContent = chatInput;
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
          messageContent = `${fileInfo}\n\n${chatInput || '请分析这些文件'}`;
          toast.success('文件上传成功');
        }
      } catch (err) {
        toast.error('文件上传失败');
        setChatLoading(false);
        return;
      }
    }

    const userMessage = messageContent;
    const currentHistory = chatHistory; // 保存当前历史
    
    setChatInput('');
    setUploadedFiles([]);
    setChatLoading(true);
    setCurrentReply(''); // 清空当前回复，准备接收新回复
    setCurrentReasoning(''); // 清空推理内容

    // 添加用户消息到历史
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);
    
    console.log(`📚 [前端] 发送历史: ${currentHistory.length}条消息`);
    console.log(`📚 [前端] 历史详情:`, JSON.stringify(currentHistory, null, 2));

    // 音频播放队列（按order排序，支持乱序到达）
    const audioQueue: Map<number, Blob> = new Map(); // order -> blob
    let currentlyPlaying = false;
    let nextOrderToPlay = 1; // 下一个要播放的序号
    
    console.log(`🎵 [播放器] 初始化播放队列，从句子#1开始`);

    // 播放下一个音频（按顺序）
    const playNext = () => {
      if (currentlyPlaying) {
        console.log(`⏸️  已在播放中，跳过`);
        return;
      }
      
      // 查找下一个应该播放的音频
      const nextBlob = audioQueue.get(nextOrderToPlay);
      if (!nextBlob) {
        console.log(`⏸️  等待句子#${nextOrderToPlay}，当前队列: ${Array.from(audioQueue.keys()).join(',')}`);
        return;
      }
      
      currentlyPlaying = true;
      const audioUrl = URL.createObjectURL(nextBlob);
      
      console.log(`▶️  开始播放句子#${nextOrderToPlay}，队列中还有: ${Array.from(audioQueue.keys()).filter(k => k > nextOrderToPlay).join(',')}`);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        
        audioRef.current.onended = () => {
          console.log(`✅ 句子#${nextOrderToPlay} 播放完成`);
          URL.revokeObjectURL(audioUrl);
          audioQueue.delete(nextOrderToPlay); // 移除已播放的音频
          nextOrderToPlay++; // 准备播放下一个
          currentlyPlaying = false;
          setIsSpeaking(false);
          // 立即尝试播放下一个
          setTimeout(() => playNext(), 0);
        };
        
        audioRef.current.onerror = (e) => {
          console.error(`❌ 句子#${nextOrderToPlay} 播放错误:`, e);
          URL.revokeObjectURL(audioUrl);
          audioQueue.delete(nextOrderToPlay);
          nextOrderToPlay++;
          currentlyPlaying = false;
          setIsSpeaking(false);
          setTimeout(() => playNext(), 0);
        };
        
        // 检查声音开关
        if (soundEnabled) {
          setIsSpeaking(true);
        audioRef.current.play().catch(e => {
          console.error(`❌ 句子#${nextOrderToPlay} play()失败:`, e);
          URL.revokeObjectURL(audioUrl);
          audioQueue.delete(nextOrderToPlay);
          nextOrderToPlay++;
          currentlyPlaying = false;
            setIsSpeaking(false);
          setTimeout(() => playNext(), 0);
        });
        } else {
          // 声音关闭时，模拟播放完成
          console.log(`🔇 声音已关闭，跳过播放句子#${nextOrderToPlay}`);
          URL.revokeObjectURL(audioUrl);
          audioQueue.delete(nextOrderToPlay);
          nextOrderToPlay++;
          currentlyPlaying = false;
          setTimeout(() => playNext(), 0);
        }
      }
    };

    try {
      const response = await fetch('http://localhost:8001/api/avatar-chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          voice: selectedAvatar,
          history: currentHistory, // 发送当前历史（不包括刚添加的用户消息）
          agent_working: isAgentWorking, // 发送Agentic AI工作状态
          deep_thinking: deepThinking, // 深度思考模式
          uploaded_files: uploadedFilePaths // 上传的文件路径
        })
      });

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

                if (parsed.type === 'text') {
                  fullText += parsed.content;
                  
                  // 检测是否有完整的提示词（同时支持单花括号 {...} 和双花括号 {{...}}）
                  if (!promptSent) {
                    const completePromptMatch = fullText.match(/\{\{([^}]+)\}\}/) || fullText.match(/\{([^}]+)\}/);
                    if (completePromptMatch) {
                      const agentPrompt = completePromptMatch[1].trim();
                      console.log(`🤖 [实时] 检测到完整提示词，立即发送: ${agentPrompt.substring(0, 100)}...`);
                      console.log(`📊 [实时] promptSent当前状态: ${promptSent}`);
                      
                      // 立即发送事件到主聊天页面
                      const event = new CustomEvent('avatar_agent_task', {
                        detail: {
                          prompt: agentPrompt,
                          avatarName: avatarName,
                          avatarImage: avatarImage
                        }
                      });
                      window.dispatchEvent(event);
                      promptSent = true;
                      console.log(`📨 [实时] 已发送 avatar_agent_task 事件，promptSent设为true`);
                    }
                  } else {
                    console.log(`ℹ️ [实时] 提示词已发送过，跳过`);
                  }
                  
                  // 实时显示时过滤掉提示词部分（双花括号格式）
                  const displayText = fullText.replace(/\{\{[^}]*\}\}?/g, '').replace(/\{[^}]*$/g, '').trim();
                  setCurrentReply(displayText);
                } else if (parsed.type === 'reasoning') {
                  // 处理推理内容
                  setCurrentReasoning(prev => prev + parsed.content);
                } else if (parsed.type === 'audio') {
                  const audioData = atob(parsed.data);
                  const bytes = new Uint8Array(audioData.length);
                  for (let i = 0; i < audioData.length; i++) {
                    bytes[i] = audioData.charCodeAt(i);
                  }
                  const audioBlob = new Blob([bytes], { type: 'audio/wav' });
                  const order = parsed.order || 1;
                  
                  // 添加到队列Map中
                  audioQueue.set(order, audioBlob);

                  const orderInfo = parsed.order ? `#${parsed.order}/${parsed.total}` : `#${order}`;
                  console.log(`📥 收到音频 ${orderInfo}，大小: ${bytes.length} bytes，队列中: ${Array.from(audioQueue.keys()).join(',')}`);

                  // 尝试播放（如果轮到它了就会播放）
                  playNext();
                } else if (parsed.type === 'done') {
                  setCurrentReply('');

                  if (fullText.trim()) {
                    console.log(`📝 数字员工完整回复: ${fullText}`);
                    console.log(`📊 promptSent状态: ${promptSent}`);
                    
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
                      const assistantMessage: ChatMessage = { 
                        role: 'assistant', 
                        content: displayText,
                        reasoningContent: currentReasoning || undefined
                      };
                      setChatHistory(prev => [...prev, assistantMessage]);
                      console.log(`✅ 添加到历史: ${displayText.substring(0, 30)}...`);
                      if (currentReasoning) {
                        console.log(`🧠 包含推理内容: ${currentReasoning.length}字符`);
                      }
                      if (promptSent) {
                        console.log(`📨 本次对话已触发Agentic AI任务`);
                      }
                    } else {
                      console.log(`ℹ️ 显示文本为空（可能全是提示词），不添加到历史`);
                    }
                  }
                  setCurrentReasoning(''); // 清空推理内容
                  console.log(`✅ SSE完成，队列中还有 ${audioQueue.size} 个音频待播放: ${Array.from(audioQueue.keys()).join(',')}`);
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
      console.error('数字员工对话错误:', error);
      toast.error('对话失败');
      setCurrentReply('');
    } finally {
      setChatLoading(false);
    }
  };

  const currentImages = getCurrentImages();
  
  if (currentImages.length === 0) {
    return null;
  }

  // 获取数字员工头像（永远使用第一张图片）
  const avatarImage = currentImages[0];
  const avatarName = selectedAvatar === 'zh_female_sajiaonvyou_moon_bigtts' ? '小岚' : '小远';

  return (
    <>
    <div className={isExpanded ? 'h-full flex flex-col' : 'card mt-4 p-3'}>
      {/* 头部标题栏 */}
      {isExpanded ? (
        <div className="card p-3 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-lg font-semibold">数字员工对话</div>
              <div className="text-xs text-gray-500">与数字员工 {avatarName} 进行轻松对话</div>
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
                  title="添加数字员工"
                >
                  <Plus size={14} />
                </button>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('确认删除所有数字员工聊天记录？')) {
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
          <div className="text-xs text-gray-500 font-medium">数字员工</div>
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
              title="选择数字员工"
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
            {/* 空状态：居中显示数字员工图片 */}
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
                  <div className="text-sm">可以和数字员工轻松闲聊</div>
                </div>
              </div>
            )}
            
            {/* 聊天消息列表 */}
            {(chatHistory.length > 0 || currentReply) && (
              <>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`mb-4 flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* 数字员工消息：左侧显示头像 */}
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
                      {/* 推理过程 */}
                      {msg.role === 'assistant' && msg.reasoningContent && (
                        <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain size={18} className="text-purple-600 dark:text-purple-400" />
                            <span className="font-bold text-purple-900 dark:text-purple-100 text-sm">🤖 深度推理过程</span>
                            <span className="ml-auto text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
                              智能推理
                            </span>
                          </div>
                          <div className="text-xs text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed bg-white/60 dark:bg-black/20 rounded p-3 border border-purple-200 dark:border-purple-800">
                            {msg.reasoningContent}
                          </div>
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
                ))}
                
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
                      {/* 推理过程（流式） */}
                      {currentReasoning && (
                        <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain size={18} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                            <span className="font-bold text-purple-900 dark:text-purple-100 text-sm">🤖 深度推理中...</span>
                            <span className="ml-auto text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full animate-pulse">
                              思考中
                            </span>
                          </div>
                          <div className="text-xs text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed bg-white/60 dark:bg-black/20 rounded p-3 border border-purple-200 dark:border-purple-800">
                            {currentReasoning}
                          </div>
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
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon size={14} className="text-blue-600" />
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
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <button
                onClick={() => setDeepThinking(!deepThinking)}
                className={`btn-ghost text-sm ${deepThinking ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}`}
                title="深度思考模式（使用更强大的推理能力）"
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

      {/* 公司信息：展开状态下隐藏，放在数字员工窗口外面 */}
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

