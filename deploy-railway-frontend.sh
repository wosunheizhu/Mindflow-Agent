#!/bin/bash

# Railway 前端部署脚本
# 使用方法: ./deploy-railway-frontend.sh

set -e  # 遇到错误立即退出

echo "🚀 Railway 前端部署脚本"
echo "======================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Railway CLI 是否安装
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI 未安装${NC}"
    echo "请运行: brew install railway"
    echo "或: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI 已安装${NC}"
echo ""

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  需要登录 Railway${NC}"
    railway login
fi

echo -e "${GREEN}✅ 已登录 Railway${NC}"
echo ""

# 确认部署
echo -e "${YELLOW}📋 部署信息：${NC}"
echo "  - 服务名称: frontend"
echo "  - Dockerfile: Dockerfile.frontend"
echo "  - 分支: $(git branch --show-current)"
echo ""

read -p "确认部署? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 取消部署${NC}"
    exit 1
fi

# 检查必需文件
echo ""
echo "📝 检查必需文件..."

if [ ! -f "Dockerfile.frontend" ]; then
    echo -e "${RED}❌ 缺少 Dockerfile.frontend${NC}"
    exit 1
fi

if [ ! -f "next.config.mjs" ]; then
    echo -e "${RED}❌ 缺少 next.config.mjs${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 缺少 package.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 所有必需文件都存在${NC}"
echo ""

# 检查 Git 状态
echo "🔍 检查 Git 状态..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  有未提交的更改${NC}"
    echo ""
    git status -s
    echo ""
    read -p "是否先提交更改? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "提交消息: " commit_msg
        git add .
        git commit -m "$commit_msg"
        git push origin $(git branch --show-current)
        echo -e "${GREEN}✅ 已提交并推送更改${NC}"
    fi
fi

echo ""

# 确保使用正确的 .dockerignore
echo "📦 准备 Docker 构建环境..."
if [ -f ".dockerignore.frontend" ]; then
    cp .dockerignore.frontend .dockerignore.temp
    echo -e "${GREEN}✅ 使用前端 .dockerignore${NC}"
fi

# 部署到 Railway
echo ""
echo "🚀 开始部署到 Railway..."
echo ""

# 尝试部署
if railway up --service frontend; then
    echo ""
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo ""
    
    # 获取部署 URL
    echo "🌐 获取服务 URL..."
    FRONTEND_URL=$(railway domain --service frontend 2>/dev/null || echo "")
    
    if [ -n "$FRONTEND_URL" ]; then
        echo ""
        echo -e "${GREEN}✅ 前端服务地址:${NC}"
        echo "   $FRONTEND_URL"
        echo ""
        
        # 询问是否打开浏览器
        read -p "是否在浏览器中打开? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://$FRONTEND_URL" || xdg-open "https://$FRONTEND_URL" || echo "请手动访问: https://$FRONTEND_URL"
        fi
    fi
    
    # 显示日志
    echo ""
    read -p "是否查看部署日志? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway logs --service frontend
    fi
else
    echo ""
    echo -e "${RED}❌ 部署失败${NC}"
    echo ""
    echo "请检查日志: railway logs --service frontend"
    
    # 恢复 .dockerignore
    if [ -f ".dockerignore.temp" ]; then
        rm .dockerignore.temp
    fi
    
    exit 1
fi

# 恢复 .dockerignore
if [ -f ".dockerignore.temp" ]; then
    rm .dockerignore.temp
fi

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📚 有用的命令:"
echo "  - 查看日志: railway logs --service frontend -f"
echo "  - 查看状态: railway status"
echo "  - 环境变量: railway variables --service frontend"
echo "  - 打开控制台: railway open"
echo ""

