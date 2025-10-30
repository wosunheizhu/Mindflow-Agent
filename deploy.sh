#!/bin/bash

# 🚀 快速部署脚本
# 此脚本帮助您快速完成本地检查和准备工作

set -e  # 遇到错误立即退出

echo "=================================="
echo "  🚀 开始部署前检查"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 Node.js
echo "📦 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ 未找到 Node.js，请先安装${NC}"
    exit 1
fi

# 2. 检查 pnpm
echo "📦 检查 pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓ pnpm 已安装: $PNPM_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ 未找到 pnpm，正在安装...${NC}"
    npm install -g pnpm
fi

# 3. 安装依赖
echo ""
echo "📦 安装项目依赖..."
pnpm install

# 4. 运行类型检查
echo ""
echo "🔍 运行 TypeScript 类型检查..."
if pnpm run lint; then
    echo -e "${GREEN}✓ 类型检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 发现一些警告，但可以继续${NC}"
fi

# 5. 测试构建
echo ""
echo "🏗️  测试生产环境构建..."
if pnpm run build; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败，请修复错误后重试${NC}"
    exit 1
fi

# 6. 检查环境变量文件
echo ""
echo "🔐 检查环境变量配置..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ 找到 .env.local${NC}"
else
    echo -e "${YELLOW}⚠ 未找到 .env.local，请根据 .env.example 创建${NC}"
fi

# 7. 检查 Git 状态
echo ""
echo "📝 检查 Git 状态..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
    
    # 检查是否有未提交的更改
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠ 检测到未提交的更改${NC}"
        echo ""
        echo "是否提交所有更改？(y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            git add .
            echo "请输入提交信息："
            read -r commit_message
            git commit -m "$commit_message"
            echo -e "${GREEN}✓ 已提交更改${NC}"
        fi
    else
        echo -e "${GREEN}✓ 工作区干净${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未初始化 Git 仓库${NC}"
    echo "是否初始化？(y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git init
        git add .
        git commit -m "Initial commit"
        echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
    fi
fi

# 8. 总结
echo ""
echo "=================================="
echo "  ✅ 检查完成！"
echo "=================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 部署 Python 后端到 Railway："
echo "   - 访问 https://railway.app"
echo "   - 创建新项目并连接 GitHub"
echo "   - 配置环境变量"
echo ""
echo "2. 部署前端到 Vercel："
echo "   方式A - 使用 CLI："
echo "   $ npm install -g vercel"
echo "   $ vercel"
echo ""
echo "   方式B - 通过网页："
echo "   - 访问 https://vercel.com"
echo "   - Import GitHub 仓库"
echo ""
echo "3. 查看完整指南："
echo "   $ cat DEPLOYMENT-GUIDE.md"
echo ""
echo "祝部署顺利！🚀"

