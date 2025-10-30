# 🚀 完整部署指南

本指南将指导您一步步将项目部署到生产环境。

## 📋 部署架构

- **前端 + API路由**: Vercel
- **Python后端服务（语音功能）**: Railway
- **数据库/存储**: 根据需要选择

---

## 第一部分：准备工作

### 1.1 创建必要的配置文件

首先，我们需要创建一些配置文件。

#### 创建 `.env.production`

```bash
# 在项目根目录创建 .env.production
AI_PROVIDER=openai
OPENAI_API_KEY=你的OpenAI密钥
GOOGLE_API_KEY=你的Google密钥
GOOGLE_CSE_ID=你的搜索引擎ID

# Python后端服务地址（稍后部署后填写）
VOICE_SERVER_URL=https://你的railway应用.railway.app
```

#### 创建 `.gitignore` 检查

确保以下内容在 `.gitignore` 中：

```
.env
.env.local
.env.production
node_modules/
.next/
venv_voice/
__pycache__/
*.pyc
```

### 1.2 优化项目配置

#### 更新 `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量
  env: {
    VOICE_SERVER_URL: process.env.VOICE_SERVER_URL,
  },
  
  // 优化生产构建
  output: 'standalone',
  
  // 允许的图片域名
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
```

---

## 第二部分：部署 Python 后端到 Railway

### 2.1 准备 Python 服务

#### 创建 `requirements.txt`（用于Railway）

在项目根目录创建：

```txt
fastapi==0.115.5
uvicorn[standard]==0.32.1
websockets==13.1
loguru==0.7.3
python-dotenv==1.0.1
pydantic==2.10.3
aiohttp==3.11.10
```

#### 创建 `Procfile`（Railway启动命令）

```
web: python voice_server.py
```

#### 创建 `railway.json`（Railway配置）

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python voice_server.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 更新 `voice_server.py` 支持生产环境

在 `voice_server.py` 中确保有以下内容：

```python
import os
from fastapi import FastAPI
import uvicorn

app = FastAPI()

# ... 你的路由代码 ...

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
```

### 2.2 部署到 Railway

**步骤 1**: 访问 https://railway.app

**步骤 2**: 登录/注册账号

**步骤 3**: 创建新项目
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 连接你的 GitHub 账号
- 选择你的项目仓库

**步骤 4**: 配置环境变量
- 在 Railway 项目设置中，添加环境变量：
  ```
  AI_PROVIDER=openai
  OPENAI_API_KEY=你的密钥
  # 其他需要的环境变量
  ```

**步骤 5**: 等待部署完成
- Railway 会自动检测 Python 项目并部署
- 部署完成后，复制生成的 URL（例如：https://your-app.railway.app）

**步骤 6**: 测试
```bash
curl https://your-app.railway.app/health
```

---

## 第三部分：部署 Next.js 到 Vercel

### 3.1 准备 Vercel 配置

#### 创建 `vercel.json`（可选配置）

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "AI_PROVIDER": "openai"
  }
}
```

### 3.2 部署到 Vercel

#### 方式一：通过 Vercel CLI（推荐）

**步骤 1**: 安装 Vercel CLI

```bash
npm install -g vercel
```

**步骤 2**: 登录 Vercel

```bash
vercel login
```

**步骤 3**: 初始化项目

```bash
cd /Users/juntinghua/Desktop/agent
vercel
```

按照提示操作：
- Set up and deploy? **Y**
- Which scope? 选择你的账号
- Link to existing project? **N**
- What's your project's name? **agent** (或其他名称)
- In which directory is your code located? **./**
- Want to override the settings? **N**

**步骤 4**: 配置环境变量

在 Vercel Dashboard 中添加环境变量：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加以下变量：

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
GOOGLE_CSE_ID=...
VOICE_SERVER_URL=https://your-app.railway.app
```

**步骤 5**: 重新部署

```bash
vercel --prod
```

#### 方式二：通过 GitHub（更简单）

**步骤 1**: 将代码推送到 GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**步骤 2**: 连接 Vercel

1. 访问 https://vercel.com
2. 点击 "New Project"
3. Import 你的 GitHub 仓库
4. 配置项目：
   - Framework Preset: **Next.js**
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

**步骤 3**: 添加环境变量（同上）

**步骤 4**: 点击 "Deploy"

---

## 第四部分：验证部署

### 4.1 检查清单

- [ ] Railway Python 服务运行正常
- [ ] Vercel Next.js 应用可访问
- [ ] 工具工作台功能正常
- [ ] API 接口响应正常
- [ ] 语音功能连接正常

### 4.2 测试步骤

**测试 1**: 访问首页

```bash
https://your-project.vercel.app
```

**测试 2**: 测试工具工作台

```bash
https://your-project.vercel.app/tools
```

**测试 3**: 测试 API

```bash
curl https://your-project.vercel.app/api/tools/math \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"expr":"1+1"}'
```

**测试 4**: 测试语音服务

```bash
curl https://your-app.railway.app/health
```

---

## 第五部分：常见问题排查

### 5.1 Vercel 构建失败

**问题**: 依赖安装失败

**解决**:
```bash
# 清理本地缓存
rm -rf node_modules .next
pnpm install
pnpm run build

# 如果成功，推送到 GitHub 重新部署
```

**问题**: 环境变量未生效

**解决**:
1. 检查 Vercel Dashboard 中的环境变量设置
2. 确保变量名称正确
3. 重新部署项目

### 5.2 Railway 部署失败

**问题**: Python 服务无法启动

**解决**:
1. 检查 Railway 日志
2. 确保 `requirements.txt` 完整
3. 检查 `PORT` 环境变量

**问题**: 连接超时

**解决**:
1. 确保服务监听 `0.0.0.0`
2. 检查防火墙设置

### 5.3 API 调用失败

**问题**: CORS 错误

**解决**: 在 `next.config.js` 添加：

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
      ],
    },
  ]
}
```

---

## 第六部分：优化建议

### 6.1 性能优化

1. **启用 Vercel Edge Functions**（可选）
2. **配置 CDN 缓存**
3. **优化图片加载**

### 6.2 监控和日志

1. **Vercel Analytics**: 在项目设置中启用
2. **Railway Logs**: 实时查看日志
3. **错误追踪**: 考虑集成 Sentry

### 6.3 安全加固

1. **API 密钥管理**: 使用环境变量，不要硬编码
2. **HTTPS**: Vercel 和 Railway 默认支持
3. **Rate Limiting**: 添加 API 访问限制

---

## 第七部分：更新和维护

### 7.1 更新流程

**更新代码**:
```bash
# 本地开发和测试
git pull
pnpm install
pnpm run dev

# 提交更改
git add .
git commit -m "Update feature"
git push origin main

# Vercel 会自动重新部署
# Railway 也会自动重新部署
```

### 7.2 回滚

**Vercel**:
1. 进入项目 Dashboard
2. 选择 "Deployments"
3. 找到之前的部署版本
4. 点击 "Promote to Production"

**Railway**:
1. 进入项目设置
2. 选择之前的部署
3. 点击 "Redeploy"

---

## 🎉 完成！

现在您的应用已经成功部署到生产环境！

- **前端访问**: https://your-project.vercel.app
- **API 地址**: https://your-project.vercel.app/api
- **Python 服务**: https://your-app.railway.app

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

## 💬 需要帮助？

如遇到问题，请检查：
1. Vercel 部署日志
2. Railway 应用日志
3. 浏览器控制台错误
4. 网络请求状态

