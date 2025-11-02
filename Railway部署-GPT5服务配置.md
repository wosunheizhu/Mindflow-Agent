# Railway 部署 - GPT-5 服务配置指南

## 概述

为 GPT-5 服务（gpt5_service.py）创建单独的 Railway 后端部署。

---

## 📦 准备工作

### 文件清单

- ✅ `Dockerfile.gpt5` - GPT-5 服务专用 Dockerfile
- ✅ `railway.gpt5.json` - Railway 配置文件
- ✅ `gpt5_service.py` - GPT-5 服务主程序
- ✅ `requirements.txt` - Python 依赖

### 端口分配

- 语音服务：8001
- GPT-5 服务：8002（新增）

---

## 🚂 Railway 部署步骤

### 方式1：通过 Railway 控制台（推荐）

#### 步骤1：创建新服务

1. 访问 [https://railway.app/dashboard](https://railway.app/dashboard)
2. 选择现有项目或创建新项目
3. 点击 **"+ New"** → **"GitHub Repo"**
4. 选择你的仓库
5. 服务名称：`agent-gpt5-service`

#### 步骤2：配置构建设置

在服务的 **Settings** 中：

**Build**：
```
Builder: Dockerfile
Dockerfile Path: Dockerfile.gpt5
```

**Deploy**：
```
Start Command: python gpt5_service.py
Restart Policy: On Failure
Max Retries: 10
```

**Root Directory**：
```
/  （项目根目录）
```

#### 步骤3：配置环境变量

在 **Variables** 标签添加：

```bash
# 必需
PORT=8002
OPENAI_API_KEY=sk-proj-xxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选（如果要覆盖默认模型）
GPT5_MODEL=gpt-5-reasoning
```

**重要提示**：
- `PORT` 必须设置，Railway 会自动映射到公网
- `OPENAI_API_KEY` 必须是有效的 GPT-5 访问密钥

#### 步骤4：部署

1. 点击 **"Deploy"** 按钮
2. 等待构建和部署完成（约2-3分钟）
3. 查看 **Logs** 确认服务启动成功

#### 步骤5：获取公网地址

1. 在服务详情页找到 **Settings** → **Networking**
2. 点击 **"Generate Domain"**
3. 复制生成的 URL：
   ```
   https://your-gpt5-service.railway.app
   ```

#### 步骤6：测试服务

```bash
# 健康检查
curl https://your-gpt5-service.railway.app/

# 期望响应：FastAPI 欢迎页面或 404（正常）
```

---

### 方式2：通过 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接到项目（如果已存在）
railway link

# 创建新服务
railway service create gpt5-service

# 设置 Dockerfile 路径
railway variables set DOCKERFILE_PATH=Dockerfile.gpt5

# 添加环境变量
railway variables set PORT=8002
railway variables set OPENAI_API_KEY=sk-proj-xxx
railway variables set OPENAI_BASE_URL=https://api.openai.com/v1

# 部署
railway up

# 查看日志
railway logs
```

---

## 🔗 更新 Vercel 配置

部署 GPT-5 服务后，需要将其 URL 添加到 Vercel 前端：

### 1. 在 Vercel 控制台添加环境变量

```
Variable Name: NEXT_PUBLIC_GPT5_SERVER_URL
Value: https://your-gpt5-service.railway.app
```

### 2. 更新前端代码（如需要）

如果前端需要调用 GPT-5 服务，在 `.env.local` 或环境变量中配置：

```bash
NEXT_PUBLIC_GPT5_SERVER_URL=https://your-gpt5-service.railway.app
```

### 3. 重新部署 Vercel

```bash
vercel --prod
```

---

## 🧪 验证部署

### 1. 检查 Railway 服务状态

```bash
# 查看语音服务
curl https://your-voice-service.railway.app/health

# 查看 GPT-5 服务
curl https://your-gpt5-service.railway.app/
```

### 2. 检查 Vercel 前端

访问你的 Vercel 域名：
```
https://your-project.vercel.app
```

测试功能：
- ✅ 聊天功能
- ✅ 深度思考（GPT-5）
- ✅ 数字员工（语音服务）
- ✅ 文件下载

### 3. 查看日志

**Railway 日志**：
```bash
# 语音服务
railway logs --service voice-service

# GPT-5 服务
railway logs --service gpt5-service
```

**Vercel 日志**：
```bash
vercel logs --follow
```

---

## 📊 服务架构

部署完成后的架构：

```
┌─────────────────────────────────────────┐
│         Vercel（前端 + API）             │
│  https://your-project.vercel.app        │
│  - Next.js 前端                          │
│  - API Routes                            │
│  - Vercel Blob Storage                   │
└─────────────────────────────────────────┘
           ↓ ↓
           │ └─────────────────┐
           ↓                   ↓
┌──────────────────────┐  ┌──────────────────────┐
│  Railway 语音服务     │  │  Railway GPT-5 服务   │
│  voice_server.py     │  │  gpt5_service.py     │
│  Port: 8001          │  │  Port: 8002          │
│  - 数字员工语音合成   │  │  - GPT-5 推理        │
│  - ASR 语音识别      │  │  - 流式响应          │
└──────────────────────┘  └──────────────────────┘
```

---

## 🔧 环境变量完整清单

### Vercel 环境变量

```bash
# AI 服务
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_API_KEY=sk-ant-xxx

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx（自动生成）

# Railway 后端服务
NEXT_PUBLIC_VOICE_SERVER_URL=https://your-voice-service.railway.app
NEXT_PUBLIC_GPT5_SERVER_URL=https://your-gpt5-service.railway.app

# 其他服务（可选）
BRAVE_API_KEY=xxx
DOUBAO_API_KEY=xxx
```

### Railway 语音服务环境变量

```bash
PORT=8001
DOUBAO_API_KEY=xxx
ARK_API_KEY=xxx
XFYUN_APP_ID=xxx
XFYUN_API_KEY=xxx
XFYUN_API_SECRET=xxx
```

### Railway GPT-5 服务环境变量

```bash
PORT=8002
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

---

## 💡 常见问题

### Q1：Railway 服务无法访问

**检查**：
1. 服务是否部署成功
2. 端口是否正确（8001/8002）
3. 健康检查是否通过
4. 域名是否已生成

**解决方案**：
```bash
# 查看 Railway 日志
railway logs

# 重新部署
railway up
```

### Q2：Vercel 无法连接 Railway

**检查**：
1. 环境变量是否正确
2. URL 是否以 `https://` 开头
3. CORS 配置是否正确

**解决方案**：
在 Railway 服务中添加 CORS 配置（如需要）

### Q3：文件下载失败

**原因**：
- Vercel Blob 未配置
- 文件 > 2MB 但没有云存储

**解决方案**：
1. 在 Vercel 控制台创建 Blob Storage
2. 环境变量 `BLOB_READ_WRITE_TOKEN` 会自动生成
3. 重新部署 Vercel

---

## 🎯 部署后检查清单

- [ ] Vercel 前端部署成功
- [ ] Vercel Blob Storage 已配置
- [ ] Railway 语音服务运行中
- [ ] Railway GPT-5 服务运行中（新）
- [ ] 所有环境变量已配置
- [ ] Vercel 已连接到 Railway 服务
- [ ] 端到端测试通过
- [ ] 文件下载功能正常
- [ ] 数字员工功能正常
- [ ] 深度思考功能正常

---

## 📞 获取帮助

如遇到问题：
1. 查看 `部署指南-Vercel-Railway.md`
2. 查看服务日志排查问题
3. 检查环境变量配置
4. 确认所有服务都在运行

**部署成功后，你的项目将完全运行在云端！** 🚀

