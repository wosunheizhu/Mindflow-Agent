#!/bin/bash

echo "🔄 正在重启 Next.js 服务器以应用 PPT 修复..."
echo ""

# 1. 查找并终止现有的 Next.js 进程
echo "1️⃣ 终止现有的 Next.js 进程..."
pkill -f "next dev" || echo "   没有发现运行中的 Next.js 进程"
sleep 2

# 2. 清理 Next.js 缓存（可选但推荐）
echo ""
echo "2️⃣ 清理 Next.js 缓存..."
rm -rf .next
echo "   ✅ 缓存已清理"

# 3. 重新启动服务器
echo ""
echo "3️⃣ 重新启动 Next.js 服务器..."
echo ""
echo "================================================"
echo "  🚀 服务器正在启动..."
echo "  📍 访问: http://localhost:3000"
echo "  📝 按 Ctrl+C 停止服务器"
echo "================================================"
echo ""

pnpm run dev

# 如果上面的命令失败，尝试使用 npm
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  pnpm 启动失败，尝试使用 npm..."
    npm run dev
fi

