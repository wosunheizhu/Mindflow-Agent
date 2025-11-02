# 项目部署指南 - Vercel + Railway

本项目包含三个部分：
1. **前端 + API**：部署到 Vercel
2. **语音服务后端**：部署到 Railway（voice_server.py）
3. **GPT-5 服务后端**：部署到 Railway（gpt5_service.py）- 新增

---

## 📦 部署前准备

### 1. 确保所有改动已提交

```bash
cd /Users/juntinghua/Desktop/agent

# 查看修改状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "feat: 优化文件下载、链接显示、数字员工提示词"

# 推送到远程仓库
git push origin main
```

---

## 🚀 部署到 Vercel（前端 + API）

### 方式1：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### 方式2：通过 Vercel 控制台

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **"Redeploy"**
4. 或：**Settings** → **Git** → 触发重新部署

### Vercel 环境变量配置

在 Vercel 控制台 → **Settings** → **Environment Variables**：

```bash
# 必需
OPENAI_API_KEY=sk-proj-...
OPENAI_BASE_URL=https://api.openai.com/v1

# Vercel Blob Storage（推荐配置，用于文件下载）
# 在 Storage 标签创建 Blob 后自动生成
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Railway 后端服务地址（部署 Railway 后获取）
NEXT_PUBLIC_VOICE_SERVER_URL=https://your-voice-service.railway.app
NEXT_PUBLIC_GPT5_SERVER_URL=https://your-gpt5-service.railway.app

# 其他可选服务
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_API_KEY=...
DOUBAO_API_KEY=...
```

### 配置 Vercel Blob Storage

1. 在 Vercel 控制台选择项目
2. 进入 **Storage** 标签
3. 点击 **Create Database** → 选择 **Blob**
4. 创建完成后，环境变量 `BLOB_READ_WRITE_TOKEN` 会自动添加

---

## 🚂 部署到 Railway

Railway 需要部署两个独立的后端服务。

### 服务1：语音服务后端（voice_server.py）

#### 1. 创建新服务

```bash
# 方式A：通过 Railway CLI
railway login
railway init

# 选择 "Empty Project"
# 项目名称：agent-voice-service

# 方式B：通过 Railway 控制台
# 访问 https://railway.app/dashboard
# 点击 "New Project" → "Deploy from GitHub repo"
# 选择你的仓库
```

#### 2. 配置构建设置

在 Railway 项目设置中：

**Settings**：
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile`（默认的语音服务）
- **Start Command**: `python voice_server.py`

**Environment Variables**：
```bash
PORT=8001
DOUBAO_API_KEY=your_doubao_key
ARK_API_KEY=your_ark_key
XFYUN_APP_ID=your_xfyun_app_id
XFYUN_API_KEY=your_xfyun_api_key
XFYUN_API_SECRET=your_xfyun_api_secret
```

#### 3. 部署

```bash
# 通过 CLI
railway up

# 或通过控制台
# 推送代码到 GitHub 后自动部署
```

#### 4. 获取服务地址

部署成功后，Railway 会生成一个公开 URL：
```
https://your-voice-service.railway.app
```

**重要**：将此 URL 添加到 Vercel 的环境变量 `NEXT_PUBLIC_VOICE_SERVER_URL`

---

### 服务2：GPT-5 服务后端（gpt5_service.py）- 新增

#### 1. 创建新的 Railway 服务

```bash
# 在同一个 Railway 项目中创建第二个服务
# 或创建新的 Railway 项目

# 通过 Railway 控制台：
# 1. 打开你的 Railway Project
# 2. 点击 "+ New" → "GitHub Repo"
# 3. 选择相同的仓库
# 4. 项目名称：agent-gpt5-service
```

#### 2. 配置构建设置

**Settings**：
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile.gpt5`（新的 GPT-5 Dockerfile）
- **Start Command**: `python gpt5_service.py`

**Environment Variables**：
```bash
PORT=8002
OPENAI_API_KEY=sk-proj-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### 3. 部署

推送代码后自动部署，或手动触发：

```bash
# 通过 CLI
railway up --service gpt5-service
```

#### 4. 获取服务地址

部署成功后：
```
https://your-gpt5-service.railway.app
```

**重要**：将此 URL 添加到 Vercel 的环境变量 `NEXT_PUBLIC_GPT5_SERVER_URL`

---

## 🔄 更新 Vercel 前端配置

部署 Railway 服务后，需要更新 Vercel 的环境变量：

```bash
# 在 Vercel 控制台添加/更新：
NEXT_PUBLIC_VOICE_SERVER_URL=https://your-voice-service.railway.app
NEXT_PUBLIC_GPT5_SERVER_URL=https://your-gpt5-service.railway.app
```

然后 **Redeploy** Vercel 项目使环境变量生效。

---

## 📁 项目文件清单

### Vercel 部署文件
- ✅ `vercel.json` - Vercel 配置
- ✅ `next.config.js` - Next.js 配置
- ✅ `package.json` - 依赖（已添加 @vercel/blob）

### Railway 语音服务
- ✅ `Dockerfile` - 语音服务容器
- ✅ `railway.json` - Railway 配置
- ✅ `voice_server.py` - 语音服务主程序
- ✅ `requirements.txt` - Python 依赖

### Railway GPT-5 服务（新增）
- ✅ `Dockerfile.gpt5` - GPT-5 服务容器
- ✅ `railway.gpt5.json` - GPT-5 Railway 配置
- ✅ `gpt5_service.py` - GPT-5 服务主程序

---

## 🧪 部署后测试

### 1. 测试 Vercel 前端

```bash
# 访问你的 Vercel 域名
https://your-project.vercel.app

# 检查：
- ✅ 页面正常加载
- ✅ 聊天功能可用
- ✅ 文件下载正常
```

### 2. 测试语音服务

```bash
# 测试 Railway 语音服务是否在线
curl https://your-voice-service.railway.app/health

# 期望返回：{"status": "ok"}
```

### 3. 测试 GPT-5 服务

```bash
# 测试 Railway GPT-5 服务
curl https://your-gpt5-service.railway.app/

# 期望返回：{"detail":"Not Found"} 或健康检查响应
```

### 4. 端到端测试

1. 在前端发送消息
2. 检查是否能正常对话
3. 测试数字员工功能（语音）
4. 测试文件生成和下载
5. 测试深度思考功能（GPT-5）

---

## 🔍 故障排查

### Vercel 部署失败

**查看构建日志**：
```bash
# 通过 CLI
vercel logs

# 或在 Vercel 控制台 → Deployments → 查看日志
```

**常见问题**：
1. 依赖安装失败 → 检查 `package.json`
2. 环境变量缺失 → 检查 Settings → Environment Variables
3. Build 超时 → 增加 `vercel.json` 中的 maxDuration

### Railway 部署失败

**查看日志**：
```bash
# 通过 CLI
railway logs

# 或在 Railway 控制台 → 选择服务 → Logs
```

**常见问题**：
1. Dockerfile 路径错误 → 检查 Settings → Dockerfile Path
2. Python 依赖缺失 → 检查 `requirements.txt`
3. 端口配置错误 → 确认环境变量 `PORT` 正确
4. 内存不足 → 升级 Railway 计划

### 服务间通信失败

**检查环境变量**：
```bash
# 在 Vercel 控制台确认：
NEXT_PUBLIC_VOICE_SERVER_URL=https://...  # 必须以 https:// 开头
NEXT_PUBLIC_GPT5_SERVER_URL=https://...   # 必须以 https:// 开头
```

**检查 CORS**：
确保 Railway 服务允许来自 Vercel 域名的请求。

---

## 📊 监控和日志

### Vercel 监控

```bash
# 实时日志
vercel logs --follow

# 性能监控
# Vercel 控制台 → Analytics
```

### Railway 监控

```bash
# 实时日志
railway logs --follow

# 资源使用
# Railway 控制台 → Metrics
```

---

## 💰 费用估算

### Vercel
- **Hobby 计划**：免费
  - 100GB 带宽/月
  - 1GB Blob 存储
  - 适合个人项目

- **Pro 计划**：$20/月
  - 1TB 带宽/月
  - 更多 Blob 存储
  - 适合生产环境

### Railway
- **Free Trial**：$5 免费额度
  - 可运行小型服务

- **Developer 计划**：$5/月 + 使用量
  - 适合个人项目

- **Team 计划**：$20/月 + 使用量
  - 适合团队和生产环境

**建议**：
- 开发/测试：Vercel Hobby + Railway Free Trial
- 生产环境：Vercel Pro + Railway Developer/Team

---

## 🔐 安全建议

1. **环境变量安全**
   - 不要在代码中硬编码密钥
   - 使用 Vercel/Railway 环境变量管理

2. **API 密钥轮换**
   - 定期更换 API 密钥
   - 监控 API 使用量

3. **访问控制**
   - 考虑添加身份验证
   - 限制 API 请求频率

4. **HTTPS**
   - Vercel 和 Railway 默认提供 HTTPS
   - 确保所有通信使用 HTTPS

---

## 🚀 快速部署命令

### 一键部署到 Vercel

```bash
cd /Users/juntinghua/Desktop/agent
git add .
git commit -m "部署更新"
git push origin main
vercel --prod
```

### 一键部署到 Railway（语音服务）

```bash
# 推送代码后自动部署
git push origin main

# 或手动触发
railway up
```

### 一键部署到 Railway（GPT-5 服务）

```bash
# 确保 Dockerfile.gpt5 已提交
git add Dockerfile.gpt5 railway.gpt5.json
git commit -m "添加 GPT-5 服务部署配置"
git push origin main

# 在 Railway 控制台创建新服务并选择 Dockerfile.gpt5
```

---

## ✅ 部署检查清单

### Vercel 部署
- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 控制台选择项目
- [ ] 环境变量已配置
- [ ] Vercel Blob Storage 已创建
- [ ] 部署成功
- [ ] 前端可访问
- [ ] API 功能正常

### Railway 语音服务
- [ ] Dockerfile 已提交
- [ ] 在 Railway 创建服务
- [ ] Dockerfile Path 设置为 `Dockerfile`
- [ ] 环境变量已配置
- [ ] 服务部署成功
- [ ] 健康检查通过
- [ ] URL 已添加到 Vercel

### Railway GPT-5 服务
- [ ] Dockerfile.gpt5 已提交
- [ ] 在 Railway 创建新服务
- [ ] Dockerfile Path 设置为 `Dockerfile.gpt5`
- [ ] 环境变量已配置
- [ ] 服务部署成功
- [ ] 健康检查通过
- [ ] URL 已添加到 Vercel

### 最终验证
- [ ] Vercel 重新部署（应用新的环境变量）
- [ ] 端到端测试通过
- [ ] 所有功能正常工作

---

**现在可以开始部署了！** 🎉

按照上述步骤，你的项目将运行在：
- **前端**：`https://your-project.vercel.app`
- **语音服务**：`https://your-voice-service.railway.app`
- **GPT-5 服务**：`https://your-gpt5-service.railway.app`

