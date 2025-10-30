#!/bin/bash

echo "🔄 清除缓存并重启开发服务器..."

# 1. 停止开发服务器
echo "1. 停止开发服务器..."
PID=$(lsof -ti:3000)
if [ -n "$PID" ]; then
    kill $PID
    echo "   ✅ 已停止开发服务器 (PID: $PID)"
    sleep 2
else
    echo "   ℹ️  开发服务器未运行"
fi

# 2. 清除 Next.js 缓存
echo "2. 清除 Next.js 缓存..."
rm -rf .next
echo "   ✅ 已删除 .next 目录"

# 3. 重新启动
echo "3. 重新启动开发服务器..."
pnpm run dev &

echo ""
echo "✅ 完成！"
echo ""
echo "请在浏览器中："
echo "1. 硬刷新页面：Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)"
echo "2. 或访问：http://localhost:3000"
echo ""
echo "查看日志：tail -f next_dev.log"

