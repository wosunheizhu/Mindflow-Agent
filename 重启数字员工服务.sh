#!/bin/bash

echo "🔄 重启数字员工服务以应用提示词更新..."

# 查找并停止现有的 voice_server.py 进程
echo "🛑 停止现有服务..."
pkill -f "python.*voice_server.py" || echo "没有运行中的服务"

# 等待进程完全停止
sleep 2

# 启动新的服务
echo "🚀 启动数字员工服务..."
cd /Users/juntinghua/Desktop/agent

# 激活虚拟环境并启动服务
source venv_voice/bin/activate
nohup python voice_server.py > voice_server.log 2>&1 &

# 获取新进程ID
sleep 2
PID=$(pgrep -f "python.*voice_server.py")

if [ -n "$PID" ]; then
    echo "✅ 数字员工服务已启动 (PID: $PID)"
    echo "📝 日志文件: voice_server.log"
    echo ""
    echo "查看日志: tail -f voice_server.log"
else
    echo "❌ 启动失败，请检查日志"
    tail -20 voice_server.log
fi

