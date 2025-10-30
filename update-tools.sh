#!/bin/bash

# 集成脚本：自动备份和更新工具文件

echo "🚀 开始更新工具文件..."
echo ""

# 1. 备份原文件
echo "📦 备份原文件..."
cp lib/tools.ts lib/tools-backup-$(date +%Y%m%d-%H%M%S).ts
echo "✅ 备份完成：lib/tools-backup-$(date +%Y%m%d-%H%M%S).ts"
echo ""

# 2. 替换为新文件
echo "🔄 替换工具文件..."
cp lib/tools-updated.ts lib/tools.ts
echo "✅ 工具文件已更新"
echo ""

# 3. 检查环境变量
echo "🔍 检查环境变量配置..."
if grep -q "GOOGLE_API_KEY" .env.local 2>/dev/null; then
    echo "✅ 找到 GOOGLE_API_KEY"
else
    echo "⚠️  未找到 GOOGLE_API_KEY，请配置 .env.local"
fi

if grep -q "GOOGLE_CSE_ID" .env.local 2>/dev/null; then
    echo "✅ 找到 GOOGLE_CSE_ID"
else
    echo "⚠️  未找到 GOOGLE_CSE_ID，请配置 .env.local"
fi

if grep -q "JUDGE0_API_KEY" .env.local 2>/dev/null; then
    echo "✅ 找到 JUDGE0_API_KEY"
else
    echo "⚠️  未找到 JUDGE0_API_KEY，请配置 .env.local"
fi

echo ""
echo "🎉 更新完成！"
echo ""
echo "📝 下一步："
echo "1. 如果还未配置 API 密钥，请编辑 .env.local 文件"
echo "2. 参考 env-template.txt 文件中的说明"
echo "3. 重启服务器：npm run dev"
echo "4. 测试功能：访问 http://localhost:3000"
echo ""

