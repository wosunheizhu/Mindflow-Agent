# Railway GPT-5 服务 - 快速部署指南

## ✅ Vercel 部署状态

前端已成功部署到：
```
https://mindflow-agent-eg85clpg7-wosunheizhus-projects.vercel.app
```

---

## 🚂 Railway 部署（两个后端服务）

### 准备工作

GitHub 仓库：`https://github.com/wosunheizhu/Mindflow-Agent`

需要部署两个独立的 Railway 服务：
1. 语音服务（voice_server.py）- 端口 8001
2. GPT-5 服务（gpt5_service.py）- 端口 8002（新增）

---

## 📋 服务1：语音服务后端

### 快速配置

1. **访问 Railway**：https://railway.app/new
2. **Deploy from GitHub repo**
3. **选择仓库**：`Mindflow-Agent`
4. **服务名称**：`mindflow-voice-service`

### 配置设置

**Settings → Build**：
```
Dockerfile Path: Dockerfile
Start Command: python voice_server.py
```

**Settings → Deploy**：
```
Root Directory: /
Watch Paths: (留空，监听整个仓库)
```

**Variables（环境变量）**：
```bash
PORT=8001
ARK_API_KEY=你的豆包ARK密钥
DOUBAO_API_KEY=你的豆包API密钥
XFYUN_APP_ID=你的讯飞APP_ID
XFYUN_API_KEY=你的讯飞API_KEY
XFYUN_API_SECRET=你的讯飞API_SECRET
```

### 部署并获取 URL

1. 点击 **Deploy** 等待部署完成（约2-3分钟）
2. 查看 **Logs** 确认启动成功，应该看到：
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8001
   ```
3. **Settings → Networking → Generate Domain**
4. 复制生成的 URL，例如：
   ```
   https://mindflow-voice-service.railway.app
   ```

---

## 📋 服务2：GPT-5 服务后端（新增）

### 快速配置

1. **在同一个 Railway Project 中**点击 **+ New**
2. **选择 GitHub Repo** → `Mindflow-Agent`（相同仓库）
3. **服务名称**：`mindflow-gpt5-service`

### 配置设置

**Settings → Build**：
```
Dockerfile Path: Dockerfile.gpt5
Start Command: python gpt5_service.py
```

**Settings → Deploy**：
```
Root Directory: /
Watch Paths: (留空)
```

**Variables（环境变量）**：
```bash
PORT=8002
OPENAI_API_KEY=sk-proj-你的OpenAI密钥
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 部署并获取 URL

1. 点击 **Deploy** 等待部署完成
2. 查看 **Logs** 确认启动成功，应该看到：
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8002
   ```
3. **Settings → Networking → Generate Domain**
4. 复制生成的 URL，例如：
   ```
   https://mindflow-gpt5-service.railway.app
   ```

---

## 🔗 连接 Vercel 和 Railway

### 更新 Vercel 环境变量

1. 访问 [Vercel 控制台](https://vercel.com/dashboard)
2. 选择项目：`agent` 或 `mindflow-agent`
3. **Settings → Environment Variables**
4. 添加/更新以下变量：

```bash
# Railway 语音服务地址
NEXT_PUBLIC_VOICE_SERVER_URL=https://mindflow-voice-service.railway.app

# Railway GPT-5 服务地址
NEXT_PUBLIC_GPT5_SERVER_URL=https://mindflow-gpt5-service.railway.app
```

5. 点击 **Save**

### 重新部署 Vercel

环境变量更新后需要重新部署：

**方式1：通过控制台**
1. **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**

**方式2：通过 CLI**
```bash
vercel --prod
```

---

## 🧪 验证部署

### 1. 检查 Railway 服务状态

```bash
# 语音服务健康检查
curl https://mindflow-voice-service.railway.app/health

# GPT-5 服务检查
curl https://mindflow-gpt5-service.railway.app/
```

### 2. 检查 Vercel 前端

访问：`https://mindflow-agent-eg85clpg7-wosunheizhus-projects.vercel.app`

测试功能：
- ✅ 页面正常加载
- ✅ AI 聊天功能
- ✅ 数字员工（连接语音服务）
- ✅ 深度思考（连接 GPT-5 服务）
- ✅ 文件生成和下载

### 3. 查看日志

**Railway 日志**：
- 语音服务：Railway 控制台 → mindflow-voice-service → Logs
- GPT-5 服务：Railway 控制台 → mindflow-gpt5-service → Logs

**Vercel 日志**：
- Vercel 控制台 → Deployments → 最新部署 → View Function Logs

---

## 📊 完整架构

```
┌─────────────────────────────────────────────────────────┐
│  Vercel 前端                                             │
│  https://mindflow-agent-xxx.vercel.app                  │
│  - Next.js UI                                           │
│  - API Routes                                           │
│  - Vercel Blob Storage（文件下载）                      │
└─────────────────────────────────────────────────────────┘
         ↓                           ↓
         │                           │
    调用语音服务                调用GPT-5服务
         ↓                           ↓
┌────────────────────┐      ┌────────────────────┐
│ Railway 语音服务    │      │ Railway GPT-5服务   │
│ :8001              │      │ :8002              │
│                    │      │                    │
│ - 数字员工语音      │      │ - GPT-5推理        │
│ - TTS合成          │      │ - 深度思考         │
│ - ASR识别          │      │ - 流式响应         │
└────────────────────┘      └────────────────────┘
```

---

## ⚙️ 环境变量速查表

### Vercel 前端
```bash
# AI 服务
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_API_KEY=sk-ant-xxx（可选）

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=（在Storage标签自动生成）

# Railway 后端
NEXT_PUBLIC_VOICE_SERVER_URL=https://mindflow-voice-service.railway.app
NEXT_PUBLIC_GPT5_SERVER_URL=https://mindflow-gpt5-service.railway.app

# 其他
BRAVE_API_KEY=xxx（可选）
```

### Railway 语音服务
```bash
PORT=8001
ARK_API_KEY=xxx
DOUBAO_API_KEY=xxx
XFYUN_APP_ID=xxx
XFYUN_API_KEY=xxx
XFYUN_API_SECRET=xxx
```

### Railway GPT-5 服务
```bash
PORT=8002
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

---

## 🎯 部署检查清单

### Vercel
- [x] 代码已推送到 GitHub
- [x] Vercel 部署成功
- [ ] Vercel Blob Storage 已创建（可选，用于大文件下载）
- [ ] 环境变量已配置
- [ ] Railway URL 已添加到环境变量
- [ ] 重新部署以应用环境变量

### Railway 语音服务
- [ ] 服务已创建
- [ ] Dockerfile Path: `Dockerfile`
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] 域名已生成
- [ ] URL 已添加到 Vercel

### Railway GPT-5 服务
- [ ] 服务已创建（新）
- [ ] Dockerfile Path: `Dockerfile.gpt5`
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] 域名已生成
- [ ] URL 已添加到 Vercel

### 最终验证
- [ ] 所有服务运行正常
- [ ] 前后端通信正常
- [ ] 功能测试通过

---

## 💡 快速提示

### Railway 多服务部署技巧

在 Railway 中，你可以：
1. **单个 Project 包含多个 Service**（推荐）
   - 便于管理
   - 共享配置
   
2. **或创建多个独立 Project**
   - 更好的隔离
   - 独立计费

**推荐方案**：
```
Railway Project: mindflow-agent
├── Service 1: voice-service (Dockerfile)
└── Service 2: gpt5-service (Dockerfile.gpt5)
```

### 快速检查服务是否正常

```bash
# 一键检查所有服务
echo "检查 Vercel..." && \
curl -I https://mindflow-agent-eg85clpg7-wosunheizhus-projects.vercel.app && \
echo "检查语音服务..." && \
curl https://你的语音服务URL/health && \
echo "检查 GPT-5 服务..." && \
curl https://你的GPT5服务URL/
```

---

## 🚀 下一步

1. **配置 Railway 语音服务**
   - 按照上述步骤创建和配置
   - 获取 URL

2. **配置 Railway GPT-5 服务**
   - 创建第二个服务
   - 使用 `Dockerfile.gpt5`
   - 获取 URL

3. **更新 Vercel 环境变量**
   - 添加两个 Railway URL
   - 重新部署

4. **端到端测试**
   - 测试所有功能
   - 确认服务间通信正常

**现在可以开始配置 Railway 了！** 🎉

