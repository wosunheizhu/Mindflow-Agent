#!/bin/bash

echo "🔍 Mindflow Agent 部署前检查"
echo "================================"
echo ""

# 检查必需文件
echo "📁 检查必需文件..."
files=(
    "vercel.json"
    "railway.json"
    "requirements.txt"
    "Procfile"
    ".vercelignore"
    "package.json"
    "next.config.mjs"
    "voice_server.py"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        all_files_exist=false
    fi
done
echo ""

# 检查 .env.local 文件
echo "🔐 检查环境变量配置..."
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local 存在"
    
    # 检查关键环境变量
    required_vars=("OPENAI_API_KEY" "BRAVE_API_KEY" "ARK_API_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.local 2>/dev/null; then
            echo "  ✅ $var 已配置"
        else
            echo "  ⚠️  $var 未找到"
        fi
    done
else
    echo "  ⚠️  .env.local 不存在（本地开发用）"
fi
echo ""

# 检查 .gitignore
echo "🚫 检查 .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo "  ✅ .env 文件已被忽略"
    else
        echo "  ⚠️  建议添加 .env 到 .gitignore"
    fi
    
    if grep -q "venv_voice" .gitignore; then
        echo "  ✅ Python 虚拟环境已被忽略"
    else
        echo "  ⚠️  建议添加 venv_voice/ 到 .gitignore"
    fi
fi
echo ""

# 检查 Git 状态
echo "📦 检查 Git 状态..."
if [ -d ".git" ]; then
    echo "  ✅ Git 仓库已初始化"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo "  ⚠️  有未提交的更改"
        echo ""
        echo "  未提交的文件:"
        git status --short | head -10
    else
        echo "  ✅ 工作区干净"
    fi
    
    # 检查远程仓库
    if git remote -v | grep -q "origin"; then
        echo "  ✅ 已配置远程仓库"
        git remote -v | head -2
    else
        echo "  ⚠️  未配置远程仓库"
        echo "  请运行: git remote add origin <your-repo-url>"
    fi
else
    echo "  ❌ 不是 Git 仓库"
    echo "  请先运行: git init"
fi
echo ""

# 检查 Node.js 依赖
echo "📦 检查 Node.js 依赖..."
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "  ✅ node_modules 存在"
    else
        echo "  ⚠️  node_modules 不存在"
        echo "  请运行: pnpm install"
    fi
fi
echo ""

# 检查 Python 依赖
echo "🐍 检查 Python 依赖..."
if [ -f "requirements.txt" ]; then
    echo "  ✅ requirements.txt 存在"
    if [ -d "venv_voice" ]; then
        echo "  ✅ Python 虚拟环境存在"
    else
        echo "  ⚠️  虚拟环境不存在（本地开发用）"
    fi
else
    echo "  ❌ requirements.txt 不存在"
fi
echo ""

# 生成部署清单
echo "📋 部署清单"
echo "================================"
echo ""
echo "Vercel 部署需要:"
echo "  • GitHub 仓库已推送"
echo "  • 在 Vercel 设置以下环境变量:"
echo "    - OPENAI_API_KEY"
echo "    - BRAVE_API_KEY"
echo "    - VOICE_SERVER_URL (Railway URL)"
echo "    - ARK_API_KEY (可选)"
echo "    - ANTHROPIC_API_KEY (可选)"
echo ""
echo "Railway 部署需要:"
echo "  • GitHub 仓库已推送"
echo "  • 在 Railway 设置以下环境变量:"
echo "    - ARK_API_KEY"
echo "    - PYTHONUNBUFFERED=1"
echo ""

# 总结
echo "🎯 准备状态"
echo "================================"
if $all_files_exist; then
    echo "✅ 所有必需文件都存在"
    echo "✅ 项目已准备好部署"
    echo ""
    echo "📚 查看详细部署指南:"
    echo "   cat RAILWAY-VERCEL-部署指南.md"
    echo ""
    echo "🚀 下一步:"
    echo "   1. 提交所有更改: git add . && git commit -m 'Ready for deployment'"
    echo "   2. 推送到 GitHub: git push origin main"
    echo "   3. 在 Railway 导入项目"
    echo "   4. 在 Vercel 导入项目"
else
    echo "⚠️  有些文件缺失，请先完善项目"
fi
echo ""

