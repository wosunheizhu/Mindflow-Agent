# ⚡ 5分钟快速部署指南

最简化的部署流程，适合快速上线。

## 🎯 方案概述

- **前端 + API**: Vercel（免费）
- **Python后端**: Railway（免费额度）
- **总耗时**: 10-15分钟

---

## 第一步：准备工作（2分钟）

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 运行部署检查

```bash
cd /Users/juntinghua/Desktop/agent
./deploy.sh
```

这个脚本会自动：
- ✅ 检查 Node.js 和 pnpm
- ✅ 安装依赖
- ✅ 测试构建
- ✅ 提交代码

---

## 第二步：部署 Python 后端（5分钟）

### 1. 访问 Railway

打开浏览器访问：https://railway.app

### 2. 创建项目

- 登录/注册（支持 GitHub 登录）
- 点击 **"New Project"**
- 选择 **"Deploy from GitHub repo"**
- 选择你的项目仓库

### 3. 配置环境变量

在 Railway 项目中点击 **"Variables"**，添加：

```
OPENAI_API_KEY=你的OpenAI密钥
AI_PROVIDER=openai
```

### 4. 等待部署

- Railway 会自动检测 Python 项目并部署
- 完成后，复制 URL（例如：`https://xxx.railway.app`）

---

## 第三步：部署 Next.js（5分钟）

### 方式A：使用 Vercel CLI（推荐）

```bash
# 登录 Vercel
vercel login

# 部署项目
vercel

# 按提示操作，全部选择默认即可
```

### 方式B：通过网页

1. 访问 https://vercel.com
2. 点击 **"New Project"**
3. Import 你的 GitHub 仓库
4. 点击 **"Deploy"**

### 配置环境变量

无论哪种方式，都需要在 Vercel Dashboard 添加环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：

```
OPENAI_API_KEY=你的OpenAI密钥
GOOGLE_API_KEY=你的Google密钥
GOOGLE_CSE_ID=你的搜索引擎ID
VOICE_SERVER_URL=https://你的railway应用.railway.app
AI_PROVIDER=openai
```

3. 点击 **"Redeploy"** 使环境变量生效

---

## 第四步：验证部署（2分钟）

### 1. 访问网站

```
https://your-project.vercel.app
```

### 2. 测试功能

- ✅ 访问首页
- ✅ 打开工具工作台
- ✅ 测试一个工具（如数学计算）

### 3. 检查 API

```bash
curl https://your-project.vercel.app/api/tools/math \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"expr":"1+1"}'
```

应该返回：
```json
{"ok":true,"result":2}
```

---

## 🎉 完成！

您的应用现在已经上线了！

- 🌐 **网站**: https://your-project.vercel.app
- 🔧 **管理**: 
  - Vercel: https://vercel.com/dashboard
  - Railway: https://railway.app/dashboard

---

## 🔄 更新部署

以后更新代码，只需：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

Vercel 和 Railway 会自动重新部署！

---

## ❓ 遇到问题？

### 构建失败
```bash
# 本地测试
pnpm run build

# 如果成功，重新部署
git push origin main
```

### 环境变量未生效
1. 检查 Vercel Dashboard 中的变量
2. 点击 "Redeploy" 重新部署

### 需要详细指南
查看完整文档：
```bash
cat DEPLOYMENT-GUIDE.md
```

---

## 💰 费用

- **Vercel Free**: 100GB 带宽/月
- **Railway Free**: $5 额度/月
- **总计**: $0（免费计划足够）

---

## 📱 移动端访问

部署后，你的应用可以在任何设备访问：
- 💻 电脑
- 📱 手机
- 🖥️ 平板

---

祝您使用愉快！🚀

