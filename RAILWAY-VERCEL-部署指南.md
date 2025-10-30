# 🚀 Railway + Vercel 部署完整指南

## 📋 部署架构

```
┌─────────────────────────────────────────────────┐
│                   用户访问                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Vercel (前端 + API Routes)                      │
│  • Next.js 应用                                  │
│  • /app/api/chat (对话API)                       │
│  • /app/api/tools (工具API)                      │
│  • 静态资源托管                                   │
└─────────────────────────────────────────────────┘
                      ↓ (API调用)
┌─────────────────────────────────────────────────┐
│  Railway (Python 后端)                           │
│  • 语音识别 (ASR)                                │
│  • 语音合成 (TTS)                                │
│  • LLM-TTS 双向流式                              │
│  • 数字员工服务                                   │
└─────────────────────────────────────────────────┘
```

---

## ✅ 部署前准备清单

### 1. 必需的API密钥

在部署前，请确保您已经获取以下API密钥：

```bash
# AI服务
OPENAI_API_KEY=sk-proj-xxxxx           # OpenAI (必需)
ANTHROPIC_API_KEY=sk-ant-xxxxx         # Claude (可选)

# 搜索服务
BRAVE_API_KEY=BSAOiXxxxxx              # Brave Search (必需)

# 豆包服务 (语音功能)
ARK_API_KEY=xxxxx                      # 豆包/火山方舟 (必需)
```

### 2. 检查项目文件

确保以下文件存在：
- ✅ `vercel.json` - Vercel 配置
- ✅ `railway.json` - Railway 配置  
- ✅ `requirements.txt` - Python 依赖
- ✅ `Procfile` - Railway 启动命令
- ✅ `.vercelignore` - Vercel 忽略文件
- ✅ `.gitignore` - Git 忽略文件

---

## 🎯 第一步：部署 Python 后端到 Railway

### 1.1 准备 Railway 项目

1. **访问 Railway**
   ```
   https://railway.app/
   ```

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 连接您的 GitHub 账号
   - 选择这个项目仓库

### 1.2 配置环境变量

在 Railway 项目设置中添加以下环境变量：

```bash
# 豆包/火山方舟 API
ARK_API_KEY=你的豆包API密钥

# 可选：如果需要其他AI模型
OPENAI_API_KEY=你的OpenAI密钥

# Python环境
PYTHONUNBUFFERED=1
```

### 1.3 Railway 配置说明

Railway 会自动检测 `railway.json` 和 `requirements.txt`：

**railway.json** (已配置):
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

### 1.4 获取 Railway 服务 URL

部署完成后：
1. 进入 Railway 项目
2. 点击 "Settings" 
3. 在 "Domains" 部分点击 "Generate Domain"
4. 复制生成的 URL，格式类似：
   ```
   https://your-app.railway.app
   ```

**保存这个URL，下一步需要用到！**

---

## 🌐 第二步：部署前端到 Vercel

### 2.1 准备 Vercel 项目

1. **访问 Vercel**
   ```
   https://vercel.com/
   ```

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 从 GitHub 导入项目
   - 选择这个仓库

### 2.2 配置环境变量

在 Vercel 项目设置中添加环境变量：

#### 必需的环境变量

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxx

# Brave Search API
BRAVE_API_KEY=BSAOiXxxxxx

# Railway Python 后端地址 (重要！)
VOICE_SERVER_URL=https://your-app.railway.app

# 其他可选
ANTHROPIC_API_KEY=sk-ant-xxxxx          # 如果使用 Claude
ARK_API_KEY=xxxxx                        # 豆包API (用于某些功能)
```

#### 如何添加环境变量

1. 进入 Vercel 项目设置
2. 点击 "Settings" → "Environment Variables"
3. 添加上述所有变量
4. 选择适用环境：Production, Preview, Development

### 2.3 构建设置

Vercel 会自动检测 Next.js 项目，默认设置通常正确：

```bash
Framework Preset: Next.js
Build Command: pnpm run build
Output Directory: .next
Install Command: pnpm install
```

如果您使用 npm：
```bash
Build Command: npm run build
Install Command: npm install
```

### 2.4 部署

1. 点击 "Deploy"
2. 等待构建完成（通常 2-5 分钟）
3. 获取您的应用 URL：
   ```
   https://your-app.vercel.app
   ```

---

## 🔧 第三步：验证部署

### 3.1 测试前端

访问您的 Vercel URL：
```
https://your-app.vercel.app
```

**检查项目**：
- ✅ 页面正常加载
- ✅ 可以看到 Mindflow Agent 界面
- ✅ 侧边栏导航正常

### 3.2 测试后端连接

1. **打开浏览器控制台**（F12）

2. **测试聊天功能**
   - 在聊天页面输入问题
   - 查看是否能正常回复

3. **测试数字员工**（如果配置了语音服务）
   - 点击数字员工卡片
   - 尝试语音输入
   - 查看控制台是否有错误

### 3.3 常见问题检查

**如果聊天无法工作**：
```bash
# 检查 Vercel 环境变量
1. OPENAI_API_KEY 是否正确
2. BRAVE_API_KEY 是否正确
3. 进入 Vercel Dashboard → Settings → Environment Variables 确认
```

**如果语音功能无法工作**：
```bash
# 检查连接
1. VOICE_SERVER_URL 是否正确设置为 Railway URL
2. Railway 服务是否正常运行
3. 打开 Railway Dashboard 查看日志
```

---

## 📊 第四步：监控和日志

### 4.1 查看 Vercel 日志

```
Vercel Dashboard → 选择项目 → Deployments → 点击部署 → Function Logs
```

### 4.2 查看 Railway 日志

```
Railway Dashboard → 选择项目 → Deployments → View Logs
```

### 4.3 实时监控

**Vercel**:
- 查看函数调用次数
- 查看错误率
- 查看响应时间

**Railway**:
- CPU 使用率
- 内存使用量
- 请求响应时间

---

## 🔄 第五步：更新部署

### 5.1 自动部署

当您推送代码到 GitHub：

**Vercel**：
- 自动检测 Git 推送
- 自动构建和部署
- Preview 部署（PR）
- Production 部署（main 分支）

**Railway**：
- 自动检测 Git 推送
- 自动重新构建
- 零停机部署

### 5.2 手动部署

**Vercel**：
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

**Railway**：
```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 部署
railway up
```

---

## 💰 成本估算

### Vercel（免费层）
- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ⚠️ 函数执行时间: 10秒（Hobby），60秒（Pro）

### Railway（免费层）
- ✅ $5 免费额度/月
- ✅ 512MB RAM
- ✅ 1GB 磁盘
- ✅ 共享 CPU
- ⚠️ 约可运行 500 小时/月

**预计月成本**: $0-10 (取决于使用量)

---

## ⚙️ 优化建议

### 性能优化

1. **启用缓存**
```typescript
// next.config.mjs
export default {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
}
```

2. **优化图片**
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'
```

3. **减少打包体积**
```bash
# 检查打包体积
npm run build
npx next-bundle-analyzer
```

### 安全优化

1. **环境变量**
   - ✅ 永远不要提交 `.env.local` 到 Git
   - ✅ 使用平台的环境变量管理
   - ✅ 定期轮换 API 密钥

2. **CORS 配置**
   - Railway 后端已配置 CORS
   - 确保只允许您的 Vercel 域名

3. **速率限制**
   - 考虑添加 API 速率限制
   - 防止滥用

---

## 🐛 常见问题解决

### 问题1：Vercel 构建失败

**原因**：依赖安装失败

**解决**：
```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 重新安装
pnpm install

# 提交更新
git add .
git commit -m "fix: update dependencies"
git push
```

### 问题2：Railway Python 服务启动失败

**原因**：requirements.txt 问题

**解决**：
```bash
# 检查 requirements.txt
cat requirements.txt

# 确保格式正确，没有多余空格
# 推送更新
git add requirements.txt
git commit -m "fix: update python requirements"
git push
```

### 问题3：CORS 错误

**原因**：Railway 后端不允许 Vercel 域名

**解决**：
在 Railway 环境变量中添加：
```bash
FRONTEND_URL=https://your-app.vercel.app
```

### 问题4：语音功能 404

**原因**：VOICE_SERVER_URL 配置错误

**解决**：
1. 检查 Railway URL 是否正确
2. 在 Vercel 设置正确的 VOICE_SERVER_URL
3. 重新部署 Vercel

---

## 📚 部署检查清单

部署前请确认：

### Vercel 配置
- [ ] GitHub 仓库已连接
- [ ] `OPENAI_API_KEY` 已设置
- [ ] `BRAVE_API_KEY` 已设置
- [ ] `VOICE_SERVER_URL` 已设置（Railway URL）
- [ ] 构建命令正确
- [ ] 环境变量应用到 Production

### Railway 配置
- [ ] GitHub 仓库已连接
- [ ] `ARK_API_KEY` 已设置
- [ ] `requirements.txt` 存在
- [ ] `railway.json` 配置正确
- [ ] Domain 已生成
- [ ] 服务正常运行

### 功能测试
- [ ] 前端页面正常加载
- [ ] AI 对话功能正常
- [ ] 工具调用功能正常
- [ ] 语音功能正常（如果需要）
- [ ] 图片生成正常
- [ ] 搜索功能正常

---

## 🎉 部署完成！

恭喜！您的 Mindflow Agent 现已部署到生产环境！

**您的应用地址**：
- 🌐 前端：`https://your-app.vercel.app`
- 🔧 后端：`https://your-app.railway.app`

**下一步**：
1. 分享给用户使用
2. 监控使用情况
3. 根据需求扩展功能
4. 优化性能和成本

---

## 📞 技术支持

遇到问题？

1. **查看日志**
   - Vercel: Function Logs
   - Railway: Deployment Logs

2. **检查环境变量**
   - 所有密钥是否正确
   - URL 是否配置正确

3. **测试 API**
   ```bash
   # 测试 Railway 后端
   curl https://your-app.railway.app/health
   
   # 测试 Vercel 前端
   curl https://your-app.vercel.app/api/health
   ```

---

**部署时间**: 预计 15-30 分钟  
**难度**: ⭐⭐⭐ (中等)  
**成功率**: 95%+

祝您部署顺利！🚀

