'use client';
import { useState, useCallback, useEffect } from 'react';
import { Search, Code2, FileText, BarChart3, Globe, Play, Save, Plus, Trash2, Download, Upload, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'reactflow/dist/style.css';
import LoginPrompt from '@/components/LoginPrompt';
import LoginModal from '@/components/LoginModal';

const ReactFlow = dynamic(() => import('reactflow'), { ssr: false });
const Background = dynamic(() => import('reactflow').then(m => m.Background), { ssr: false });
const Controls = dynamic(() => import('reactflow').then(m => m.Controls), { ssr: false });
const MiniMap = dynamic(() => import('reactflow').then(m => m.MiniMap), { ssr: false });

// 可用的节点类型
const nodeTypes = [
  { id: 'search', label: '网页搜索', icon: Search, color: 'bg-blue-500' },
  { id: 'code', label: '代码执行', icon: Code2, color: 'bg-green-500' },
  { id: 'file', label: '文件操作', icon: FileText, color: 'bg-purple-500' },
  { id: 'chart', label: '数据可视化', icon: BarChart3, color: 'bg-orange-500' },
  { id: 'web', label: '网页访问', icon: Globe, color: 'bg-cyan-500' },
];

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<any[]>([
    { 
      id:'n1', 
      position:{x:100,y:150}, 
      data:{label:'搜索', tool:'search_web'}, 
      type:'default',
      style: { background: 'white', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', width: '150px' }
    },
    { 
      id:'n2', 
      position:{x:300,y:150}, 
      data:{label:'代码执行', tool:'execute_code'}, 
      type:'default',
      style: { background: 'white', border: '2px solid #10b981', borderRadius: '8px', padding: '10px', width: '150px' }
    },
    { 
      id:'n3', 
      position:{x:500,y:150}, 
      data:{label:'生成报告', tool:'create_document'}, 
      type:'default',
      style: { background: 'white', border: '2px solid #8b5cf6', borderRadius: '8px', padding: '10px', width: '150px' }
    },
  ]);
  const [edges, setEdges] = useState<any[]>([
    { id:'e1-2', source:'n1', target:'n2', animated: true, type: 'smoothstep' },
    { id:'e2-3', source:'n2', target:'n3', animated: true, type: 'smoothstep' },
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('我的工作流');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查登录状态
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);
  
  // 检查是否需要登录
  const requireLogin = () => {
    setShowLoginPrompt(true);
    return false;
  };

  const addNode = (type: any) => {
    if (requireLogin()) return;
    
    const newNode = {
      id: `n${Date.now()}`,
      position: { 
        x: 50 + nodes.length * 180, 
        y: 150 + (nodes.length % 2) * 100 
      },
      data: { label: type.label, tool: type.id },
      type: 'default',
      style: {
        background: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        width: '150px',
      },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
    toast.success(`已添加节点: ${type.label}`);
  };

  const deleteNode = () => {
    if (requireLogin()) return;
    
    if (!selectedNode) {
      toast.error('请先选择一个节点');
      return;
    }
    setNodes(nodes.filter(n => n.id !== selectedNode));
    setEdges(edges.filter(e => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
    toast.success('节点已删除');
  };

  const runWorkflow = async () => {
    if (requireLogin()) return;
    
    if (nodes.length === 0) {
      toast.error('工作流为空');
      return;
    }

    toast.loading('正在执行工作流...', { duration: 2000 });
    
    // 模拟执行
    setTimeout(() => {
      toast.success(`工作流 "${workflowName}" 执行完成！共 ${nodes.length} 个步骤`);
    }, 2000);
  };

  const saveWorkflow = () => {
    if (requireLogin()) return;
    
    const workflow = {
      name: workflowName,
      nodes: nodes,
      edges: edges,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('saved-workflow', JSON.stringify(workflow));
    toast.success('工作流已保存到本地');
  };

  const loadWorkflow = () => {
    if (requireLogin()) return;
    
    const saved = localStorage.getItem('saved-workflow');
    if (saved) {
      const workflow = JSON.parse(saved);
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setWorkflowName(workflow.name || '我的工作流');
      toast.success('工作流已加载');
    } else {
      toast.error('没有保存的工作流');
    }
  };

  const exportWorkflow = () => {
    if (requireLogin()) return;
    
    const workflow = {
      name: workflowName,
      nodes: nodes,
      edges: edges,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('工作流已导出');
  };

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      let updated = [...nds];
      changes.forEach((change: any) => {
        if (change.type === 'position') {
          const idx = updated.findIndex(n => n.id === change.id);
          if (idx !== -1 && change.position) {
            updated[idx] = { ...updated[idx], position: change.position };
          }
        } else if (change.type === 'select') {
          if (change.selected) {
            setSelectedNode(change.id);
          }
        } else if (change.type === 'remove') {
          updated = updated.filter(n => n.id !== change.id);
        }
      });
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      let updated = [...eds];
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          updated = updated.filter(e => e.id !== change.id);
        }
      });
      return updated;
    });
  }, []);

  const onConnect = useCallback((params: any) => {
    const newEdge = {
      ...params,
      id: `e${Date.now()}`,
      animated: true,
      type: 'smoothstep',
    };
    setEdges((eds) => [...eds, newEdge]);
    toast.success('连接已创建');
  }, []);

  return (
    <div className="relative">
      {/* 未登录遮罩层 - 只覆盖内容区域 */}
      {!isLoggedIn && (
        <>
          {/* 遮罩层 - 只覆盖主内容，不覆盖侧边栏 */}
          <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center rounded-lg" style={{ minHeight: '80vh' }}>
            {/* 提示卡片 - 照搬LoginPrompt样式 */}
            <div className="w-full max-w-sm mx-4 bg-white dark:bg-[rgb(22,23,24)] rounded-xl border border-border dark:border-border-dark shadow-2xl">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
                <div className="text-base font-semibold">需要登录</div>
              </div>

              {/* 内容 */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    此功能需要登录内测账号才能使用
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setShowLogin(true);
                  }}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock size={20} className="text-blue-600 dark:text-blue-400" />
                    <div className="font-semibold">登录</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 主内容（未登录时禁止交互，但不模糊） */}
      <div className={`grid gap-4 ${!isLoggedIn ? 'pointer-events-none' : ''}`}>
      {/* 顶部工具栏 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              className="input max-w-md"
              placeholder="工作流名称"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              {nodes.length} 个节点 · {edges.length} 个连接
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={loadWorkflow} title="加载">
              <Upload size={16} />
              加载
            </button>
            <button className="btn-ghost" onClick={saveWorkflow} title="保存">
              <Save size={16} />
              保存
            </button>
            <button className="btn-ghost" onClick={exportWorkflow} title="导出">
              <Download size={16} />
              导出
            </button>
            <button className="btn-primary" onClick={runWorkflow} title="运行">
              <Play size={16} />
              运行
            </button>
          </div>
        </div>
      </div>

      {/* 节点工具栏 */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">添加节点</div>
          <button 
            className="btn-ghost text-red-600" 
            onClick={deleteNode}
            disabled={!selectedNode}
            title="删除选中节点"
          >
            <Trash2 size={16} />
            删除节点
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {nodeTypes.map(nt => {
            const Icon = nt.icon;
            return (
              <button
                key={nt.id}
                onClick={() => addNode(nt)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all ${nt.color} bg-opacity-10`}
              >
                <Icon size={16} className={nt.color.replace('bg-', 'text-')} />
                <span className="text-sm font-medium">{nt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 节点列表视图（可视化备选） */}
      <div className="card p-4">
        <div className="text-sm font-semibold mb-3">工作流节点列表</div>
        <div className="space-y-2">
          {nodes.map((node, idx) => (
            <div key={node.id} className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[rgb(22,23,24)]">
              <div className="text-lg font-bold text-gray-400">{idx + 1}</div>
              <div className="flex-1">
                <div className="font-semibold">{node.data.label}</div>
                <div className="text-xs text-gray-500">工具: {node.data.tool}</div>
              </div>
              <div className="text-xs text-gray-500">
                位置: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
              </div>
              <button
                onClick={() => {
                  setSelectedNode(node.id);
                  deleteNode();
                }}
                className="btn-ghost text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {edges.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">连接关系</div>
            <div className="space-y-1">
              {edges.map((edge, idx) => (
                <div key={edge.id} className="text-xs text-gray-600 dark:text-gray-400">
                  {idx + 1}. 节点 {nodes.findIndex(n => n.id === edge.source) + 1} → 节点 {nodes.findIndex(n => n.id === edge.target) + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* React Flow 画布（备用） */}
      {mounted && (
        <div className="card p-4">
          <div className="text-sm font-semibold mb-3">可视化画布（备用）</div>
          <div style={{ width: '100%', height: '400px' }}>
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              fitView
              style={{ background: '#fafafa', border: '2px solid #d1d5db', borderRadius: '8px' }}
            >
              <Background color="#ddd" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            如果看到节点，可以拖拽移动和创建连接
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="card p-4">
        <div className="text-sm font-semibold mb-2">使用说明</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>· 点击"添加节点"按钮添加工具节点</div>
          <div>· 拖拽节点调整位置</div>
          <div>· 从一个节点拖拽到另一个节点创建连接</div>
          <div>· 点击节点选中，然后点击"删除节点"移除</div>
          <div>· 点击"保存"保存工作流到本地</div>
          <div>· 点击"运行"执行工作流（演示）</div>
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
    </div>

      {/* 登录弹窗 */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}


