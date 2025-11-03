'use client';
import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  const [nodes, setNodes] = useState([
    { id: 1, name: '搜索节点' },
    { id: 2, name: '代码节点' },
    { id: 3, name: '报告节点' },
  ]);

  const addNode = () => {
    const newNode = { id: nodes.length + 1, name: `新节点 ${nodes.length + 1}` };
    setNodes([...nodes, newNode]);
    setCount(count + 1);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">测试页面 - 验证基本功能</h1>
      
      <div className="card p-4 mb-4">
        <div className="text-lg font-semibold mb-2">计数器测试</div>
        <div className="text-xl mb-2">计数: {count}</div>
        <button className="btn-primary" onClick={() => setCount(count + 1)}>
          增加计数
        </button>
      </div>

      <div className="card p-4 mb-4">
        <div className="text-lg font-semibold mb-3">节点列表测试</div>
        <div className="mb-3">
          <button className="btn-primary" onClick={addNode}>
            添加节点
          </button>
          <span className="ml-3 text-sm text-gray-500">
            当前有 {nodes.length} 个节点
          </span>
        </div>
        
        <div className="space-y-2">
          {nodes.map((node) => (
            <div key={node.id} className="p-3 border-2 border-gray-300 rounded-lg bg-white">
              <div className="font-semibold">节点 {node.id}</div>
              <div className="text-sm text-gray-600">{node.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm">
          <div>✅ 如果你能看到这个页面，说明 React 正常工作</div>
          <div>✅ 如果能看到上面的节点列表，说明列表渲染正常</div>
          <div>✅ 如果点击"添加节点"能增加节点，说明状态更新正常</div>
          <div className="mt-3 text-xs text-gray-500">
            访问这个测试页面: http://localhost:3000/test
          </div>
        </div>
      </div>
    </div>
  );
}






