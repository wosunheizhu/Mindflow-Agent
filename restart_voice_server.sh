#!/bin/bash

echo "🔄 重启语音服务器..."

# 停止旧进程
echo "1. 停止旧进程..."
PID=$(ps aux | grep 'voice_server.py' | grep -v grep | awk '{print $2}')
if [ -n "$PID" ]; then
    echo "   找到进程 PID: $PID"
    kill $PID
    sleep 2
    echo "   ✅ 已停止旧进程"
else
    echo "   ℹ️  没有找到运行中的进程"
fi

# 启动新进程
echo "2. 启动新进程..."
cd "$(dirname "$0")"
source venv_voice/bin/activate
nohup python voice_server.py > voice_server.log 2>&1 &
NEW_PID=$!

sleep 3

# 检查是否成功启动
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo "   ✅ 服务器已启动 (PID: $NEW_PID)"
    echo "3. 测试连接..."
    if curl -s http://localhost:8001/health > /dev/null; then
        echo "   ✅ 服务器响应正常"
        echo ""
        echo "🎉 重启完成！"
        echo ""
        echo "查看日志: tail -f voice_server.log"
        echo "停止服务: kill $NEW_PID"
    else
        echo "   ⚠️  服务器启动但无响应，请检查日志"
        echo "   查看日志: tail -f voice_server.log"
    fi
else
    echo "   ❌ 启动失败，请查看日志"
    echo "   查看日志: tail -f voice_server.log"
    exit 1
fi

