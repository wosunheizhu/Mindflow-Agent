# 立即使用 Vercel 部署前端 - 最简单方案 🚀

## 为什么选择 Vercel？

Railway 在同一个仓库中很难区分前后端，但 Vercel：
- ✅ **自动识别 Next.js**，不会混淆
- ✅ **零配置**，点击就能部署
- ✅ **免费**，100GB 流量/月
- ✅ **最快**，全球 CDN
- ✅ Railway 继续运行后端，互不干扰

---

## 🚀 3 分钟部署步骤

### 步骤 1：访问 Vercel（30 秒）

1. 打开 **https://vercel.com**
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**

### 步骤 2：导入项目（30 秒）

1. 点击 **"Add New..."** → **"Project"**
2. 找到并选择 **`Mindflow-Agent`** 仓库
3. 点击 **"Import"**

### 步骤 3：自动配置（不用改）

Vercel 会自动检测到 Next.js，显示：

```
✓ Framework Preset: Next.js
✓ Root Directory: ./
✓ Build Command: pnpm build
✓ Output Directory: .next
✓ Install Command: pnpm install
```

**这些都是自动的，不需要修改！**

### 步骤 4：添加环境变量（2 分钟）

在 **"Environment Variables"** 部分，点击 **"Add"** 添加：

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# OpenAI
OPENAI_API_KEY=您的OpenAI_Key
OPENAI_API_BASE=https://api.openai.com/v1

# Claude
ANTHROPIC_API_KEY=您的Claude_Key

# 后端服务地址（从 Railway 复制）
VOICE_SERVER_URL=https://您的后端地址.railway.app
NEXT_PUBLIC_VOICE_SERVER_URL=https://您的后端地址.railway.app

# 搜索 API
SERPER_API_KEY=您的Key
JINA_API_KEY=您的Key

# Aspose 文档处理
ASPOSE_WORDS_CLIENT_ID=您的ID
ASPOSE_WORDS_CLIENT_SECRET=您的Secret
ASPOSE_SLIDES_CLIENT_ID=您的ID
ASPOSE_SLIDES_CLIENT_SECRET=您的Secret
```

💡 **如何获取 Railway 后端地址？**
1. 打开 Railway Dashboard
2. 进入您的后端服务
3. 在 Settings → Domains 中复制 Public Domain
4. 粘贴到上面的 VOICE_SERVER_URL

### 步骤 5：部署（点击一下）

1. 点击 **"Deploy"**
2. 等待 2-3 分钟
3. 完成！🎉

---

## ✅ 部署完成后

### 获取前端地址

部署成功后，Vercel 会显示：
```
https://mindflow-agent-xxx.vercel.app
```

### 测试访问

1. 点击 URL 访问前端
2. 测试主要功能
3. 检查是否能连接到 Railway 后端

---

## 🔧 后续操作

### 1. 设置自定义域名（可选）

在 Vercel 项目设置中：
1. 进入 **"Domains"**
2. 添加您的域名
3. 按提示配置 DNS

### 2. 自动部署

Vercel 已自动配置 Git 集成：
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 自动创建预览环境

### 3. 删除 Railway 前端服务

既然已经在 Vercel 部署了前端，可以删除 Railway 的前端服务：
1. 进入 Railway Dashboard
2. 选择前端服务
3. Settings → Danger Zone → Delete Service

---

## 💰 成本对比

| 方案 | 前端 | 后端 | 总计 |
|------|-----|------|------|
| **Vercel + Railway** | $0 | $5-10/月 | **$5-10/月** ✨ |
| Railway 全部 | $5 | $5-10/月 | $10-15/月 |

使用 Vercel 更便宜，性能更好！

---

## 🎯 架构图

```
┌─────────────────────────────────────┐
│         用户访问                     │
└─────────────────────────────────────┘
                 │
                 ├─── 前端页面 ──────────→ Vercel
                 │                       (全球 CDN)
                 │                           │
                 └─── API 调用 ──────────────┘
                                             │
                                             ↓
                                      Railway Backend
                                      (Python 语音服务)
```

---

## ❓ 常见问题

### Q: Vercel 收费吗？
A: 个人使用完全免费，包含 100GB 流量/月

### Q: 会影响现有的 Railway 后端吗？
A: 完全不会，前后端独立部署

### Q: 如何更新部署？
A: 直接 git push，Vercel 自动部署

### Q: 性能怎么样？
A: Vercel 有全球 CDN，比 Railway 更快

---

## 🚀 立即开始

1. 访问 https://vercel.com
2. 登录 GitHub
3. 导入项目
4. 添加环境变量
5. 点击 Deploy

**就这么简单！** 🎉

---

## 📞 需要帮助？

如果有任何问题，告诉我：
- Vercel 显示什么错误？
- 环境变量是否都添加了？
- 能否访问部署的网站？

我会立即帮您解决！

