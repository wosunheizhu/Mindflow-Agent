# Railway 前端部署完整指南

## 📋 部署架构

```
Railway Project (一个项目)
├── Frontend Service (Next.js 前端)
│   └── URL: https://your-app.railway.app
└── Backend Service (Python 语音服务)
    └── URL: https://your-voice-api.railway.app
```

## 🚀 步骤一：准备工作

### 1. 确认文件已创建
- ✅ `Dockerfile.frontend` - 前端 Docker 配置
- ✅ `railway-frontend.json` - Railway 前端配置
- ✅ `next.config.mjs` - 已添加 standalone 输出

### 2. 安装 Railway CLI（如果还没有）
```bash
# macOS
brew install railway

# 或使用 npm
npm install -g @railway/cli

# 登录
railway login
```

## 🎯 步骤二：在 Railway 创建前端服务

### 方法 A：使用 Railway Dashboard（推荐，更直观）

1. **访问 Railway 控制台**
   - 打开 https://railway.app/dashboard
   - 选择您当前的项目（已有后端服务的项目）

2. **添加新服务**
   - 点击 `+ New Service`
   - 选择 `GitHub Repo`
   - 连接您的代码仓库

3. **配置前端服务**
   - Service Name: `frontend` 或 `nextjs-app`
   - Root Directory: `/` (默认)
   - Build Command: 自动检测
   - Start Command: 自动检测

4. **设置自定义配置**
   - 在服务设置中，找到 "Settings" 标签
   - 在 "Deploy" 部分，点击 "Custom Start Command"
   - 留空（将使用 Dockerfile）

5. **指定 Dockerfile**
   - 在 "Settings" → "Deploy" 中
   - 找到 "Dockerfile Path"
   - 输入：`Dockerfile.frontend`

### 方法 B：使用 Railway CLI

```bash
# 1. 进入项目目录
cd /Users/juntinghua/Desktop/agent

# 2. 连接到您的 Railway 项目
railway link

# 3. 创建新服务
railway service create frontend

# 4. 部署前端
railway up --service frontend

# 5. 查看部署日志
railway logs --service frontend
```

## ⚙️ 步骤三：配置环境变量

在 Railway Dashboard 中为前端服务添加环境变量：

### 必需的环境变量：

```bash
# 1. OpenAI API
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1

# 2. Anthropic API (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# 3. 语音服务 URL（指向您的后端服务）
VOICE_SERVER_URL=https://your-backend-service.railway.app
NEXT_PUBLIC_VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}

# 4. 其他 API
SERPER_API_KEY=your_serper_key
JINA_API_KEY=your_jina_key

# 5. 文档处理 (Aspose)
ASPOSE_WORDS_CLIENT_ID=your_client_id
ASPOSE_WORDS_CLIENT_SECRET=your_client_secret
ASPOSE_SLIDES_CLIENT_ID=your_client_id
ASPOSE_SLIDES_CLIENT_SECRET=your_client_secret

# 6. Node 环境
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 🔗 连接前后端服务

Railway 提供服务间引用功能：

```bash
# 前端环境变量中使用后端服务 URL
VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}

# 或者使用私有网络（更快）
VOICE_SERVER_URL=${{backend.RAILWAY_PRIVATE_DOMAIN}}
```

## 🔧 步骤四：设置域名（可选）

### 1. 使用 Railway 提供的域名
- 自动分配：`your-app.up.railway.app`
- 可以在 Settings → Domains 中自定义

### 2. 使用自定义域名
```bash
# 在 Railway Dashboard 中
1. 进入前端服务的 Settings → Domains
2. 点击 "Add Custom Domain"
3. 输入您的域名：example.com
4. 添加 DNS 记录：
   - Type: CNAME
   - Name: @ (或 www)
   - Value: [Railway提供的CNAME]
```

## 📊 步骤五：验证部署

### 1. 检查构建日志
```bash
# 使用 CLI
railway logs --service frontend

# 或在 Dashboard 查看
# Services → frontend → Deployments → 最新部署 → Logs
```

### 2. 测试前端服务
```bash
# 获取前端 URL
railway domain --service frontend

# 访问前端
open https://your-frontend.railway.app
```

### 3. 验证前后端连接
- 打开前端应用
- 测试语音功能（需要后端服务）
- 检查浏览器控制台是否有错误

## 🎛️ 高级配置

### 1. 设置健康检查
在 `railway-frontend.json` 中已配置：
```json
{
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 300
  }
}
```

### 2. 配置自动部署
- Railway 默认在 push 到 main/master 分支时自动部署
- 可以在 Settings → Deployments 中配置触发条件

### 3. 设置构建缓存
```bash
# Railway 自动处理 Docker 层缓存
# 无需额外配置
```

### 4. 优化构建时间
在 `Dockerfile.frontend` 中已使用多阶段构建：
- deps 阶段：只在依赖变化时重新构建
- builder 阶段：构建应用
- runner 阶段：最小化生产镜像

## 🐛 常见问题排查

### 问题 1：构建失败
```bash
# 检查日志
railway logs --service frontend

# 常见原因：
- package.json 中的依赖版本问题
- 环境变量缺失
- Dockerfile 路径错误

# 解决方案：
- 本地测试构建：docker build -f Dockerfile.frontend -t test .
- 确认所有文件都已提交到 Git
```

### 问题 2：运行时错误
```bash
# 检查环境变量
railway variables --service frontend

# 检查端口配置
# Railway 会自动设置 $PORT 环境变量
# 确保应用监听 $PORT 或 0.0.0.0:3000
```

### 问题 3：前端无法连接后端
```bash
# 1. 确认后端服务正在运行
railway status --service backend

# 2. 检查 VOICE_SERVER_URL 配置
railway variables --service frontend

# 3. 使用 Railway 服务引用
VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

### 问题 4：部署后样式丢失
```bash
# 确保 public 文件夹被正确复制
# 检查 Dockerfile.frontend 中的 COPY 命令

# 清除 .next 缓存重新构建
rm -rf .next
railway up --service frontend
```

## 📈 监控和维护

### 1. 查看部署状态
```bash
# CLI
railway status

# Dashboard
# 访问 https://railway.app/dashboard
```

### 2. 查看资源使用
```bash
# Dashboard 中查看
- CPU 使用率
- 内存使用
- 网络流量
- 构建时间
```

### 3. 扩展配置
```bash
# 在 Settings → Resources 中配置
- 内存限制（默认 512MB，可调整到 8GB）
- CPU 配置
- 实例数量
```

## 💰 成本优化

### Railway 计费说明
- **免费额度**：每月 $5 使用额度
- **按量付费**：
  - 计算时间：$0.000231/GB-second
  - 网络：$0.10/GB
  - 存储：基本免费

### 优化建议
1. **使用多阶段构建**（已配置）
2. **启用 Docker 层缓存**（自动）
3. **监控资源使用**
4. **设置合理的健康检查间隔**

## 🔄 更新部署

### 自动部署（推荐）
```bash
# 只需 push 代码到 GitHub
git add .
git commit -m "更新功能"
git push origin main

# Railway 会自动检测并部署
```

### 手动部署
```bash
# 使用 CLI
railway up --service frontend

# 或在 Dashboard 中
# Services → frontend → Deployments → "Deploy Latest"
```

## 📝 完整命令速查

```bash
# 部署前端
railway up --service frontend

# 查看日志
railway logs --service frontend -f

# 查看状态
railway status

# 设置环境变量
railway variables set KEY=value --service frontend

# 获取域名
railway domain --service frontend

# 连接数据库（如需要）
railway connect

# 删除服务（小心！）
railway service delete frontend
```

## ✅ 部署检查清单

### 部署前
- [ ] 确认 `Dockerfile.frontend` 已创建
- [ ] 确认 `next.config.mjs` 包含 `output: 'standalone'`
- [ ] 本地测试构建成功
- [ ] 所有更改已提交到 Git

### 部署时
- [ ] 在 Railway 创建前端服务
- [ ] 配置 Dockerfile 路径为 `Dockerfile.frontend`
- [ ] 设置所有必需的环境变量
- [ ] 配置前后端服务连接

### 部署后
- [ ] 检查构建日志无错误
- [ ] 访问前端 URL 正常
- [ ] 测试主要功能
- [ ] 验证前后端通信
- [ ] 配置自定义域名（可选）

## 🎉 下一步

部署成功后，您可以：

1. **设置 CI/CD 流程**
   - 配置 GitHub Actions
   - 添加自动化测试

2. **配置监控**
   - 集成错误追踪（Sentry）
   - 设置性能监控

3. **优化性能**
   - 配置 CDN
   - 启用边缘缓存
   - 图片优化

4. **安全加固**
   - 添加环境变量加密
   - 配置 CORS
   - 启用 HTTPS（自动）

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Railway 文档：https://docs.railway.app
2. Railway Discord 社区
3. 查看项目日志排查问题

部署愉快！🚀

