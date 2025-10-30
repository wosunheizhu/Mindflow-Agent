# Railway 前端部署 - 快速开始 🚀

## 📦 准备就绪的文件

✅ 以下文件已经为您创建好：

1. `Dockerfile.frontend` - 前端 Docker 配置
2. `railway-frontend.json` - Railway 配置文件
3. `next.config.mjs` - 已添加 `standalone` 输出模式
4. `.dockerignore.frontend` - 前端构建忽略文件
5. `deploy-railway-frontend.sh` - 自动部署脚本
6. `railway-frontend-env-template.txt` - 环境变量模板

## ⚡ 最快部署方式（推荐）

### 方法一：使用一键部署脚本

```bash
# 1. 运行部署脚本
./deploy-railway-frontend.sh

# 脚本会自动：
# ✅ 检查 Railway CLI
# ✅ 检查必需文件
# ✅ 提交代码（可选）
# ✅ 部署到 Railway
# ✅ 显示部署 URL
```

### 方法二：使用 Railway Dashboard（3 分钟）

1. **访问 Railway**
   ```
   https://railway.app/dashboard
   ```

2. **在现有项目中添加服务**
   - 点击 `+ New Service`
   - 选择 `GitHub Repo`
   - 选择您的仓库

3. **配置服务**
   - Service Name: `frontend`
   - Settings → Deploy → Dockerfile Path: `Dockerfile.frontend`

4. **添加环境变量**
   - 复制 `railway-frontend-env-template.txt` 中的变量
   - 在 Variables 标签页粘贴

5. **触发部署**
   - 点击 `Deploy`

## 🔧 必需配置

### 1. 环境变量（最重要！）

在 Railway Dashboard 中添加以下变量：

```bash
# 基础配置
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# API Keys（必需）
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# 连接后端（必需）
VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}

# 其他 API
SERPER_API_KEY=your-key
JINA_API_KEY=your-key
```

💡 **注意**：`${{backend.RAILWAY_PUBLIC_DOMAIN}}` 会自动引用您的后端服务 URL

### 2. 服务名称

确保您的后端服务在 Railway 中命名为 `backend`，或修改环境变量中的引用。

## 📝 详细步骤

### 步骤 1：安装 Railway CLI（首次使用）

```bash
# macOS
brew install railway

# 或使用 npm
pnpm add -g @railway/cli

# 登录
railway login
```

### 步骤 2：推送代码到 GitHub

```bash
git add .
git commit -m "准备 Railway 前端部署"
git push origin main
```

### 步骤 3：创建前端服务

#### 使用 CLI：
```bash
# 连接项目
railway link

# 创建服务
railway service create frontend

# 设置 Dockerfile
# （在 Dashboard 中设置为 Dockerfile.frontend）

# 部署
railway up --service frontend
```

#### 使用 Dashboard：
1. 打开项目
2. 点击 `+ New Service`
3. 选择 GitHub Repo
4. 配置 Dockerfile 路径

### 步骤 4：配置环境变量

```bash
# 使用 CLI
railway variables set NODE_ENV=production --service frontend
railway variables set OPENAI_API_KEY=sk-your-key --service frontend

# 或在 Dashboard 中批量添加
# Variables → Raw Editor → 粘贴所有变量
```

### 步骤 5：验证部署

```bash
# 查看日志
railway logs --service frontend -f

# 获取 URL
railway domain --service frontend

# 打开网站
open $(railway domain --service frontend)
```

## ✅ 部署检查清单

- [ ] Railway CLI 已安装并登录
- [ ] 代码已推送到 GitHub
- [ ] 在 Railway 创建了前端服务
- [ ] Dockerfile 路径设置为 `Dockerfile.frontend`
- [ ] 已添加所有必需的环境变量
- [ ] 后端服务正在运行
- [ ] 环境变量中正确引用了后端服务
- [ ] 构建成功（检查日志）
- [ ] 可以访问前端 URL
- [ ] 前后端通信正常

## 🐛 常见问题

### 问题 1：构建失败 - "Dockerfile not found"

**解决方案**：
```bash
# 在 Railway Dashboard 中
Settings → Deploy → Dockerfile Path → 输入: Dockerfile.frontend
```

### 问题 2：前端无法连接后端

**解决方案**：
```bash
# 检查环境变量
railway variables --service frontend

# 确认包含：
VOICE_SERVER_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}

# 或使用实际 URL：
VOICE_SERVER_URL=https://your-backend.railway.app
```

### 问题 3：环境变量不生效

**解决方案**：
```bash
# 修改环境变量后，需要重新部署
railway up --service frontend

# 或在 Dashboard 中触发重新部署
```

### 问题 4：构建很慢

**解决方案**：
- 第一次构建会慢（安装依赖）
- 后续构建会使用缓存，快很多
- 通常 3-5 分钟完成

## 📊 监控部署

### 查看实时日志
```bash
railway logs --service frontend -f
```

### 查看服务状态
```bash
railway status
```

### 查看资源使用
在 Dashboard → Metrics 中查看：
- CPU 使用率
- 内存使用
- 请求量
- 响应时间

## 🔄 更新部署

### 自动部署（推荐）
```bash
# 只需推送代码
git add .
git commit -m "更新功能"
git push

# Railway 自动检测并部署
```

### 手动部署
```bash
# 使用 CLI
railway up --service frontend

# 或使用脚本
./deploy-railway-frontend.sh
```

## 💰 成本估算

Railway 按实际使用计费：

- **免费额度**：每月 $5
- **小型项目**：$5-10/月
- **中型项目**：$10-20/月

前端服务通常使用：
- 内存：256MB-512MB
- CPU：较低
- 流量：主要成本来源

## 🎯 性能优化

### 已配置的优化
✅ 多阶段 Docker 构建
✅ Next.js standalone 模式
✅ 生产环境优化
✅ Docker 层缓存

### 建议的优化
- 配置 CDN（Cloudflare）
- 启用图片优化
- 使用 Railway 私有网络连接后端

## 🔗 有用的链接

- Railway Dashboard: https://railway.app/dashboard
- Railway 文档: https://docs.railway.app
- Railway 状态: https://status.railway.app

## 📞 获取帮助

如果遇到问题：

1. **查看日志**
   ```bash
   railway logs --service frontend -f
   ```

2. **检查环境变量**
   ```bash
   railway variables --service frontend
   ```

3. **查看完整指南**
   - 阅读 `RAILWAY-前端部署指南.md`

4. **Railway 社区**
   - Discord: https://discord.gg/railway
   - GitHub: https://github.com/railwayapp/nixpacks

## 🎉 下一步

部署成功后：

1. ✅ 配置自定义域名
2. ✅ 设置监控和告警
3. ✅ 配置 CI/CD 自动化
4. ✅ 优化性能和缓存

---

**需要帮助？** 查看详细文档或在 Railway Discord 提问

**祝部署顺利！** 🚀

