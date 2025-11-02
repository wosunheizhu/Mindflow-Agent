#!/bin/bash

echo "🚀 开始部署项目到 Vercel 和 Railway..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 提交代码
echo -e "${BLUE}📝 第一步：提交代码到 Git${NC}"
echo ""

# 添加所有必要文件
git add \
  agent/ \
  app/ \
  components/ \
  lib/ \
  public/ \
  Dockerfile \
  Dockerfile.gpt5 \
  railway.json \
  railway.gpt5.json \
  vercel.json \
  package.json \
  pnpm-lock.yaml \
  next.config.js \
  next.config.mjs \
  tailwind.config.ts \
  postcss.config.mjs \
  tsconfig.json \
  gpt5_service.py \
  voice_server.py \
  llm_tts_stream.py \
  doubao_tts_client.py \
  xfyun_asr_client.py \
  llm_client.py \
  requirements.txt \
  .env.local

echo "文件已添加到暂存区"

# 提交
COMMIT_MSG="feat: 优化链接显示、文件下载、数字员工提示词 + 新增 GPT-5 服务部署配置"
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 代码提交成功${NC}"
else
  echo -e "${YELLOW}⚠️  没有需要提交的更改或提交失败${NC}"
fi

echo ""

# 2. 推送到远程仓库
echo -e "${BLUE}📤 第二步：推送到 GitHub${NC}"
git push origin main

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 代码推送成功${NC}"
else
  echo -e "${RED}❌ 推送失败，请检查网络或权限${NC}"
  exit 1
fi

echo ""

# 3. 部署到 Vercel
echo -e "${BLUE}🌐 第三步：部署到 Vercel${NC}"
echo ""

# 检查 vercel CLI 是否安装
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI 未安装${NC}"
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi

# 部署到生产环境
vercel --prod

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Vercel 部署成功${NC}"
else
  echo -e "${RED}❌ Vercel 部署失败${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 部署流程完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 4. Railway 部署说明
echo -e "${YELLOW}📋 Railway 部署步骤（需手动操作）：${NC}"
echo ""
echo "1️⃣  部署语音服务后端："
echo "   • 访问 https://railway.app/dashboard"
echo "   • 选择项目或创建新项目：agent-voice-service"
echo "   • Settings → Dockerfile Path: Dockerfile"
echo "   • 环境变量：PORT=8001, DOUBAO_API_KEY, ARK_API_KEY 等"
echo "   • Deploy"
echo ""
echo "2️⃣  部署 GPT-5 服务后端（新建服务）："
echo "   • 在同一个 Railway 项目中点击 + New"
echo "   • 选择 GitHub Repo → 选择相同的仓库"
echo "   • Settings → Dockerfile Path: Dockerfile.gpt5"
echo "   • 环境变量：PORT=8002, OPENAI_API_KEY, OPENAI_BASE_URL"
echo "   • Deploy"
echo ""
echo "3️⃣  获取 Railway 服务 URL 并更新 Vercel："
echo "   • 复制语音服务 URL：https://your-voice-service.railway.app"
echo "   • 复制 GPT-5 服务 URL：https://your-gpt5-service.railway.app"
echo "   • 在 Vercel → Settings → Environment Variables 添加："
echo "     - NEXT_PUBLIC_VOICE_SERVER_URL"
echo "     - NEXT_PUBLIC_GPT5_SERVER_URL"
echo "   • Redeploy Vercel 项目"
echo ""
echo -e "${BLUE}📖 详细文档：部署指南-Vercel-Railway.md${NC}"
echo ""

